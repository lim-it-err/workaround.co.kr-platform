package com.workaround.platform.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PlatformStoreWorkManagerTest {
  private static final String WORK_MANAGER_PASSWORD = "xptmxldxptmxld";
  private static final String WORK_MANAGER_PASSWORD_SHA256 =
      "9d77b517528af09a35b95ce19b7d96bc0f4ee00bd886c787814c6c0123ad75a4";

  @Test
  void workManagerBoardExposesProtectedActionDescriptor() {
    PlatformStore store = createStore(5);

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

  private PlatformStore createStore(int maxFailedAttempts) {
    return new PlatformStore(
        "http://localhost:8003",
        "http://localhost:8002",
        WORK_MANAGER_PASSWORD_SHA256,
        30,
        maxFailedAttempts,
        5);
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
