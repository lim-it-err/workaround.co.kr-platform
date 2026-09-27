package com.workaround.platform.gateway;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PlatformStoreWorkManagerTest {
  private static final String WORK_MANAGER_PASSWORD = "subway-gate-passphrase-2026";
  private static final String WORK_MANAGER_PASSWORD_SHA256 =
      "ee918019bd5b90917c7aadc92189b286b2dbc45566e14f2da6cf95b7ec849481";

  @TempDir
  Path tempDir;

  @Test
  void workManagerBoardExposesProtectedActionDescriptor() {
    PlatformStore store = createStore(WORK_MANAGER_PASSWORD_SHA256, 5, repoRootForReadOnlyTests());

    Map<String, Object> board = store.workManagerBoard();
    Map<String, Object> actions = castMap(board.get("actions"));
    Map<String, Object> persistence = castMap(board.get("persistence"));
    List<Map<String, Object>> workerSummary = castList(board.get("workerSummary"));
    List<Map<String, Object>> commandPresets = castList(actions.get("commandPresets"));

    assertThat(actions)
        .containsEntry("authRequired", true)
        .containsEntry("commandBridgeReady", true)
        .containsEntry("commandGateReady", true)
        .containsEntry("tokenHeader", "X-Work-Manager-Token");
    assertThat(persistence)
        .containsEntry("targetDatabase", "embedded-h2");
    assertThat(workerSummary)
        .extracting(item -> item.get("workerId"))
        .contains("ion2-worker", "orchestrator");
    assertThat(commandPresets)
        .extracting(preset -> preset.get("action"))
        .containsExactly("resume_worker", "summarize_blockers", "prepare_review_handoff");
  }

  @Test
  void authenticateWorkManagerIssuesSessionAndQueuesProtectedCommand() {
    PlatformStore store = createStore(5);

    Map<String, Object> authResponse = store.authenticateWorkManager(
        "127.0.0.1",
        new WorkManagerAuthRequest(WORK_MANAGER_PASSWORD));

    String token = String.valueOf(authResponse.get("token"));
    assertThat(token).isNotBlank();
    assertThat(authResponse.get("message")).isEqualTo("Command gate unlocked");

    String actor = store.requireWorkManagerSession(token);
    Map<String, Object> commandResponse = store.runWorkManagerCommand(
        new WorkManagerCommandRequest("summarize_blockers", "Need a blocker sweep", ""),
        actor);

    Map<String, Object> commandRun = castMap(commandResponse.get("commandRun"));
    Map<String, Object> board = castMap(commandResponse.get("board"));
    List<Map<String, Object>> commandHistory = castList(board.get("commandHistory"));
    Map<String, Object> persistence = castMap(board.get("persistence"));
    List<PlatformTicket> tickets = store.tickets();

    assertThat(commandRun.get("action")).isEqualTo("summarize_blockers");
    assertThat(commandRun.get("status")).isEqualTo("queued");
    assertThat(commandRun.get("workerTicketId")).isNotNull();
    assertThat(commandHistory).isNotEmpty();
    assertThat(((Number) persistence.get("auditEventCount")).intValue()).isGreaterThan(0);
    assertThat(tickets)
        .extracting(PlatformTicket::type)
        .contains("job.work-manager.summarize-blockers");
  }

  @Test
  void repeatedAuthFailuresEventuallyLockRemoteAddress() {
    PlatformStore store = createStore(2);

    ResponseStatusException first = assertThrows(
        ResponseStatusException.class,
        () -> store.authenticateWorkManager("127.0.0.1", new WorkManagerAuthRequest("wrong-password")));
    ResponseStatusException second = assertThrows(
        ResponseStatusException.class,
        () -> store.authenticateWorkManager("127.0.0.1", new WorkManagerAuthRequest("wrong-password")));
    ResponseStatusException third = assertThrows(
        ResponseStatusException.class,
        () -> store.authenticateWorkManager("127.0.0.1", new WorkManagerAuthRequest("wrong-password")));

    assertEquals(HttpStatus.UNAUTHORIZED, first.getStatusCode());
    assertEquals(HttpStatus.UNAUTHORIZED, second.getStatusCode());
    assertEquals(HttpStatus.TOO_MANY_REQUESTS, third.getStatusCode());
  }

  @Test
  void authenticateWorkManagerDoesNotLeakSessionTokenToFeedOrStore() throws Exception {
    PlatformStore store = createStore(5);

    Map<String, Object> authResponse = store.authenticateWorkManager(
        "127.0.0.1",
        new WorkManagerAuthRequest(WORK_MANAGER_PASSWORD));

    String token = String.valueOf(authResponse.get("token"));
    Map<String, Object> board = store.workManagerBoard();
    List<Map<String, Object>> activityFeed = castList(board.get("activityFeed"));
    Map<String, Object> authFeed = activityFeed.stream()
        .filter(item -> "auth".equals(item.get("type")))
        .findFirst()
        .orElseThrow();
    String feedRunId = String.valueOf(authFeed.get("runId"));
    String persistedStore = Files.readString(
        tempDir.resolve("gateway").resolve("data").resolve("work-manager-store.json"),
        StandardCharsets.UTF_8);

    assertThat(feedRunId)
        .startsWith("wm-feed-run-")
        .isNotEqualTo(token);
    assertThat(activityFeed.toString()).doesNotContain(token);
    assertThat(persistedStore).doesNotContain(token);

    ResponseStatusException replay = assertThrows(
        ResponseStatusException.class,
        () -> store.requireWorkManagerSession(feedRunId));
    assertEquals(HttpStatus.UNAUTHORIZED, replay.getStatusCode());
  }

  @Test
  void repeatedFailuresAcrossDifferentRemoteAddressesTriggerGlobalLock() {
    PlatformStore store = createStore(2);

    ResponseStatusException first = assertThrows(
        ResponseStatusException.class,
        () -> store.authenticateWorkManager("198.51.100.10", new WorkManagerAuthRequest("wrong-password")));
    ResponseStatusException second = assertThrows(
        ResponseStatusException.class,
        () -> store.authenticateWorkManager("198.51.100.11", new WorkManagerAuthRequest("wrong-password")));
    ResponseStatusException third = assertThrows(
        ResponseStatusException.class,
        () -> store.authenticateWorkManager("198.51.100.12", new WorkManagerAuthRequest("wrong-password")));

    assertEquals(HttpStatus.UNAUTHORIZED, first.getStatusCode());
    assertEquals(HttpStatus.UNAUTHORIZED, second.getStatusCode());
    assertEquals(HttpStatus.TOO_MANY_REQUESTS, third.getStatusCode());
  }

  @Test
  void authenticateWorkManagerAcceptsUppercaseSha256Hash() {
    PlatformStore store = createStore(WORK_MANAGER_PASSWORD_SHA256.toUpperCase(), 5);

    Map<String, Object> authResponse = store.authenticateWorkManager(
        "127.0.0.1",
        new WorkManagerAuthRequest(WORK_MANAGER_PASSWORD));

    assertThat(authResponse.get("token")).isNotNull();
  }

  @Test
  void controllerIgnoresForwardedForWhenRemoteAddressIsNotTrusted() {
    PlatformApiController controller = createController(2, "");

    ResponseStatusException first = assertThrows(
        ResponseStatusException.class,
        () -> controller.authenticateWorkManager(
            mockRequest("198.51.100.20", "203.0.113.1"),
            new WorkManagerAuthRequest("wrong-password")));
    ResponseStatusException second = assertThrows(
        ResponseStatusException.class,
        () -> controller.authenticateWorkManager(
            mockRequest("198.51.100.20", "203.0.113.2"),
            new WorkManagerAuthRequest("wrong-password")));
    ResponseStatusException third = assertThrows(
        ResponseStatusException.class,
        () -> controller.authenticateWorkManager(
            mockRequest("198.51.100.20", "203.0.113.3"),
            new WorkManagerAuthRequest("wrong-password")));

    assertEquals(HttpStatus.UNAUTHORIZED, first.getStatusCode());
    assertEquals(HttpStatus.UNAUTHORIZED, second.getStatusCode());
    assertEquals(HttpStatus.TOO_MANY_REQUESTS, third.getStatusCode());
  }

  private PlatformStore createStore(int maxFailedAttempts) {
    return createStore(WORK_MANAGER_PASSWORD_SHA256, maxFailedAttempts);
  }

  private PlatformStore createStore(String passwordHash, int maxFailedAttempts) {
    return createStore(passwordHash, maxFailedAttempts, tempDir);
  }

  private PlatformStore createStore(String passwordHash, int maxFailedAttempts, Path repoRoot) {
    return new PlatformStore(
        "http://localhost:8003",
        "http://localhost:8002",
        passwordHash,
        30,
        maxFailedAttempts,
        5,
        repoRoot);
  }

  private PlatformApiController createController(int maxFailedAttempts, String trustedProxies) {
    return new PlatformApiController(
        "dev-key",
        "",
        createStore(maxFailedAttempts),
        trustedProxies);
  }

  private HttpServletRequest mockRequest(String remoteAddress, String forwardedFor) {
    HttpServletRequest request = mock(HttpServletRequest.class);
    when(request.getRemoteAddr()).thenReturn(remoteAddress);
    when(request.getHeader("X-Forwarded-For")).thenReturn(forwardedFor);
    return request;
  }

  private Path repoRootForReadOnlyTests() {
    Path current = Path.of("").toAbsolutePath().normalize();
    if (Files.exists(current.resolve("docs").resolve("tickets").resolve("board.md"))) {
      return current;
    }
    Path parent = current.getParent();
    return parent == null ? current : parent;
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> castMap(Object value) {
    return (Map<String, Object>) value;
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> castList(Object value) {
    return (List<Map<String, Object>>) value;
  }
}
