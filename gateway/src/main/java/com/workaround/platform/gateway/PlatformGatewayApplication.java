package com.workaround.platform.gateway;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@SpringBootApplication
public class PlatformGatewayApplication {
  public static void main(String[] args) {
    SpringApplication.run(PlatformGatewayApplication.class, args);
  }
}

@RestController
@RequestMapping("/api")
class PlatformApiController {
  private static final String DEFAULT_WORK_MANAGER_PASSWORD_SHA256 = "8e0894262a5710556e3a186ff6476306c62c8c91f9853249fb878bf4f2826176";
  private final PlatformStore store;
  private final String platformApiKey;
  private final String ollamaBaseUrl;
  private final Set<String> trustedWorkManagerProxies;

  PlatformApiController(
      @Value("${app.platform.api-key:dev-key}") String platformApiKey,
      @Value("${app.ollama.base-url:}") String ollamaBaseUrl,
      @Value("${app.platform.elevator-service-url:http://localhost:8003}") String elevatorServiceUrl,
      @Value("${app.platform.sample-spring-service-url:http://localhost:8002}") String sampleSpringServiceUrl,
      @Value("${app.work-manager.password-sha256:" + DEFAULT_WORK_MANAGER_PASSWORD_SHA256 + "}") String workManagerPasswordHash,
      @Value("${app.work-manager.session-ttl-minutes:30}") int workManagerSessionTtlMinutes,
      @Value("${app.work-manager.max-failed-attempts:5}") int workManagerMaxFailedAttempts,
      @Value("${app.work-manager.lock-minutes:5}") int workManagerLockMinutes,
      @Value("${app.work-manager.trusted-proxies:}") String trustedWorkManagerProxies) {
    this(
        platformApiKey,
        ollamaBaseUrl,
        new PlatformStore(
            elevatorServiceUrl,
            sampleSpringServiceUrl,
            workManagerPasswordHash,
            workManagerSessionTtlMinutes,
            workManagerMaxFailedAttempts,
            workManagerLockMinutes),
        trustedWorkManagerProxies);
  }

  PlatformApiController(
      String platformApiKey,
      String ollamaBaseUrl,
      PlatformStore store,
      String trustedWorkManagerProxies) {
    this.platformApiKey = platformApiKey;
    this.ollamaBaseUrl = ollamaBaseUrl;
    this.trustedWorkManagerProxies = parseTrustedProxyAddresses(trustedWorkManagerProxies);
    this.store = store;
  }

  @GetMapping("/health")
  Map<String, Object> health() {
    return store.healthSnapshot(ollamaBaseUrl);
  }

  @GetMapping("/services")
  Map<String, Object> services() {
    return Map.of("services", store.services());
  }

  @GetMapping("/runtime")
  Map<String, Object> runtime() {
    return store.runtimeSnapshot(ollamaBaseUrl);
  }

  @GetMapping("/work-manager/board")
  Map<String, Object> workManagerBoard() {
    return store.workManagerBoard();
  }

  @PostMapping("/work-manager/auth")
  Map<String, Object> authenticateWorkManager(
      HttpServletRequest request,
      @RequestBody(required = false) WorkManagerAuthRequest authRequest) {
    return store.authenticateWorkManager(resolveRemoteAddress(request), authRequest);
  }

  @PostMapping("/work-manager/tickets/{ticketId}/transition")
  Map<String, Object> transitionWorkTicket(
      @RequestHeader(value = "X-Work-Manager-Token", required = false) String token,
      @PathVariable String ticketId,
      @RequestBody(required = false) WorkManagerTransitionRequest request) {
    String actor = store.requireWorkManagerSession(token);
    return store.transitionWorkTicket(ticketId, request, actor);
  }

  @PostMapping("/work-manager/tickets/{ticketId}/metadata")
  Map<String, Object> updateWorkTicketMetadata(
      @RequestHeader(value = "X-Work-Manager-Token", required = false) String token,
      @PathVariable String ticketId,
      @RequestBody(required = false) WorkManagerMetadataUpdateRequest request) {
    String actor = store.requireWorkManagerSession(token);
    return store.updateWorkTicketMetadata(ticketId, request, actor);
  }

  @PostMapping("/work-manager/commands")
  Map<String, Object> runWorkManagerCommand(
      @RequestHeader(value = "X-Work-Manager-Token", required = false) String token,
      @RequestBody(required = false) WorkManagerCommandRequest request) {
    String actor = store.requireWorkManagerSession(token);
    return store.runWorkManagerCommand(request, actor);
  }

  @GetMapping("/services/{serviceId}/**")
  ResponseEntity<String> proxyServiceGet(@PathVariable String serviceId, HttpServletRequest request) {
    return store.proxyService("GET", serviceId, request.getRequestURI(), request.getQueryString(), null);
  }

  @PostMapping("/services/{serviceId}/**")
  ResponseEntity<String> proxyServicePost(
      @PathVariable String serviceId,
      HttpServletRequest request,
      @RequestBody(required = false) String body) {
    return store.proxyService("POST", serviceId, request.getRequestURI(), request.getQueryString(), body);
  }

  @GetMapping("/tickets")
  Map<String, Object> tickets() {
    return Map.of("tickets", store.tickets());
  }

  @GetMapping("/tickets/{ticketId}")
  PlatformTicket ticket(@PathVariable String ticketId) {
    return store.ticket(ticketId);
  }

  @PostMapping("/tickets")
  ResponseEntity<PlatformTicket> createTicket(
      @RequestHeader(value = "X-Platform-Key", required = false) String requestKey,
      @RequestBody(required = false) TicketCreateRequest request) {
    requireApiKey(requestKey);
    return ResponseEntity.status(HttpStatus.CREATED).body(store.createTicket(request));
  }

  @PostMapping("/tickets/{ticketId}/claim")
  PlatformTicket claimTicket(
      @RequestHeader(value = "X-Platform-Key", required = false) String requestKey,
      @PathVariable String ticketId) {
    requireApiKey(requestKey);
    return store.claimTicket(ticketId);
  }

  @PostMapping("/tickets/{ticketId}/complete")
  PlatformTicket completeTicket(
      @RequestHeader(value = "X-Platform-Key", required = false) String requestKey,
      @PathVariable String ticketId,
      @RequestBody(required = false) TicketCompleteRequest request) {
    requireApiKey(requestKey);
    Object result = request == null ? null : request.result();
    return store.completeTicket(ticketId, result);
  }

  @PostMapping("/tickets/{ticketId}/fail")
  PlatformTicket failTicket(
      @RequestHeader(value = "X-Platform-Key", required = false) String requestKey,
      @PathVariable String ticketId,
      @RequestBody(required = false) TicketFailRequest request) {
    requireApiKey(requestKey);
    String error = request == null ? null : request.error();
    return store.failTicket(ticketId, error);
  }

  @PostMapping("/tickets/{ticketId}/waiting-llm")
  PlatformTicket waitingLlmTicket(
      @RequestHeader(value = "X-Platform-Key", required = false) String requestKey,
      @PathVariable String ticketId,
      @RequestBody(required = false) TicketWaitingRequest request) {
    requireApiKey(requestKey);
    Object result = request == null ? null : request.result();
    String error = request == null ? null : request.error();
    return store.waitingForLlm(ticketId, result, error);
  }

  private void requireApiKey(String requestKey) {
    if (!Objects.equals(platformApiKey, requestKey)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid X-Platform-Key");
    }
  }

  private String resolveRemoteAddress(HttpServletRequest request) {
    String remoteAddress = normalizeRemoteAddress(request.getRemoteAddr());
    if (trustedWorkManagerProxies.contains(remoteAddress)) {
      String forwardedFor = request.getHeader("X-Forwarded-For");
      if (forwardedFor != null && !forwardedFor.isBlank()) {
        String forwardedAddress = normalizeRemoteAddress(forwardedFor.split(",")[0]);
        if (!forwardedAddress.isBlank()) {
          return forwardedAddress;
        }
      }
    }
    return remoteAddress;
  }

  private String normalizeRemoteAddress(String remoteAddress) {
    return remoteAddress == null || remoteAddress.isBlank()
        ? "unknown"
        : remoteAddress.trim();
  }

  private Set<String> parseTrustedProxyAddresses(String rawTrustedProxies) {
    return Arrays.stream(normalizeRemoteAddress(rawTrustedProxies).split(","))
        .map(String::trim)
        .filter(value -> !value.isBlank() && !"unknown".equals(value))
        .collect(java.util.stream.Collectors.toUnmodifiableSet());
  }
}

final class PlatformStore {
  private static final Pattern TICKET_META_PATTERN = Pattern.compile("`([^`]+)`");
  private static final Pattern TICKET_FILE_ID_PATTERN = Pattern.compile("^(TKT-\\d+).*$");
  private static final Pattern TICKET_FILENAME_PATTERN = Pattern.compile("^(TKT-\\d+)-([^-]+)-(.+)$");
  private static final List<String> WORK_MANAGER_STATUSES = List.of("backlog", "started", "need_review", "finished");
  private static final String BOARD_RULES_HEADER = "## 보드 규칙";
  private static final int WORK_MANAGER_HISTORY_LIMIT = 12;
  private static final int WORK_MANAGER_FEED_LIMIT = 20;
  private static final String TICKET_METADATA_HEADER = "\uBA54\uD0C0\uB370\uC774\uD130";
  private static final String TICKET_FIELD_STATUS = "\uC0C1\uD0DC";
  private static final String TICKET_FIELD_PRIORITY = "\uC6B0\uC120\uC21C\uC704";
  private static final String TICKET_FIELD_TARGET_VERSION = "\uB300\uC0C1 \uBC84\uC804";
  private static final String TICKET_FIELD_PROGRESS_DECISION = "\uC9C4\uD589 \uD310\uC815";
  private static final String TICKET_SECTION_DEPENDENCIES = "\uC758\uC874\uC131";
  private static final String TICKET_SECTION_DECISIONS = "\uC9C8\uBB38/\uACB0\uC815 \uAE30\uB85D";
  private static final String TICKET_NONE = "\uC5C6\uC74C";

  private final ConcurrentHashMap<String, PlatformTicket> tickets = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, WorkManagerSession> workManagerSessions = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, WorkManagerAuthAttempt> workManagerAuthAttempts = new ConcurrentHashMap<>();
  private final List<WorkManagerCommandRun> workManagerCommandHistory = new ArrayList<>();
  private final List<Map<String, Object>> workManagerDynamicFeed = new ArrayList<>();
  private final List<Map<String, Object>> workManagerAuditLog = new ArrayList<>();
  private final List<ServiceDescriptor> services = new ArrayList<>();
  private final HttpClient client = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(2))
      .build();
  private final Path repoRoot;
  private final Path workManagerStorePath;
  private final ObjectMapper objectMapper = new ObjectMapper();
  private final String workManagerPasswordHash;
  private final Duration workManagerSessionTtl;
  private final int workManagerMaxFailedAttempts;
  private final Duration workManagerLockDuration;
  private WorkManagerAuthAttempt workManagerGlobalAuthAttempt = WorkManagerAuthAttempt.unlocked();

  PlatformStore(
      String elevatorServiceUrl,
      String sampleSpringServiceUrl,
      String workManagerPasswordHash,
      int workManagerSessionTtlMinutes,
      int workManagerMaxFailedAttempts,
      int workManagerLockMinutes) {
    this(
        elevatorServiceUrl,
        sampleSpringServiceUrl,
        workManagerPasswordHash,
        workManagerSessionTtlMinutes,
        workManagerMaxFailedAttempts,
        workManagerLockMinutes,
        null);
  }

  PlatformStore(
      String elevatorServiceUrl,
      String sampleSpringServiceUrl,
      String workManagerPasswordHash,
      int workManagerSessionTtlMinutes,
      int workManagerMaxFailedAttempts,
      int workManagerLockMinutes,
      Path repoRootOverride) {
    this.workManagerPasswordHash = normalizeText(workManagerPasswordHash, "");
    this.workManagerSessionTtl = Duration.ofMinutes(Math.max(1, workManagerSessionTtlMinutes));
    this.workManagerMaxFailedAttempts = Math.max(1, workManagerMaxFailedAttempts);
    this.workManagerLockDuration = Duration.ofMinutes(Math.max(1, workManagerLockMinutes));
    this.repoRoot = repoRootOverride == null ? locateRepoRoot() : repoRootOverride.toAbsolutePath().normalize();
    this.workManagerStorePath = repoRoot == null ? null : repoRoot.resolve("gateway").resolve("data").resolve("work-manager-store.json");

    services.add(new ServiceDescriptor(
        "elevator-service",
        "Elevator Service",
        "/api/services/elevator-service",
        elevatorServiceUrl,
        elevatorServiceUrl + "/health",
        "Simulated elevator service used in the v0.2.0 preview to keep the sample slot concrete.",
        "ion2",
        "light"));
    services.add(new ServiceDescriptor(
        "sample-spring-service",
        "Sample Spring Service",
        "/api/services/sample-spring-service",
        sampleSpringServiceUrl,
        sampleSpringServiceUrl + "/health",
        "Independently dockerized Spring service used to prove the gateway can coordinate another Java service without owning its business logic.",
        "ion2",
        "light"));
    services.add(new ServiceDescriptor(
        "ion2-worker",
        "Ion2 Worker",
        "/api/services/ion2-worker",
        "worker://ion2-worker",
        "worker://ion2-worker/health",
        "Worker node that polls the gateway, executes tickets, and proves the local execution loop.",
        "ion2",
        "heavy"));

    seedTickets();
    loadPersistedWorkManagerState();
  }

  List<ServiceDescriptor> services() {
    return List.copyOf(services);
  }

  private synchronized void loadPersistedWorkManagerState() {
    if (workManagerStorePath == null || !Files.exists(workManagerStorePath)) {
      return;
    }

    try {
      Map<String, Object> payload = objectMapper.readValue(
          Files.readString(workManagerStorePath, StandardCharsets.UTF_8),
          new TypeReference<>() {});
      boolean scrubbedPersistedSecrets = false;

      workManagerCommandHistory.clear();
      List<Map<String, Object>> sanitizedCommandHistory = sanitizePersistedWorkManagerMapList(
          readMapList(payload.get("commandHistory")));
      scrubbedPersistedSecrets = scrubbedPersistedSecrets
          || !sanitizedCommandHistory.equals(readMapList(payload.get("commandHistory")));
      for (Map<String, Object> item : sanitizedCommandHistory) {
        workManagerCommandHistory.add(new WorkManagerCommandRun(
            String.valueOf(item.getOrDefault("id", "")),
            String.valueOf(item.getOrDefault("action", "")),
            String.valueOf(item.getOrDefault("label", "")),
            String.valueOf(item.getOrDefault("note", "")),
            String.valueOf(item.getOrDefault("status", "")),
            String.valueOf(item.getOrDefault("actor", "")),
            String.valueOf(item.getOrDefault("createdAt", "")),
            String.valueOf(item.getOrDefault("relatedTicketId", "")),
            String.valueOf(item.getOrDefault("workerTicketId", "")),
            String.valueOf(item.getOrDefault("message", ""))));
      }

      workManagerDynamicFeed.clear();
      List<Map<String, Object>> sanitizedFeed = sanitizePersistedWorkManagerFeed(
          readMapList(payload.get("activityFeed")));
      scrubbedPersistedSecrets = scrubbedPersistedSecrets
          || !sanitizedFeed.equals(readMapList(payload.get("activityFeed")));
      workManagerDynamicFeed.addAll(sanitizedFeed);

      workManagerAuditLog.clear();
      List<Map<String, Object>> sanitizedAuditLog = sanitizePersistedWorkManagerMapList(
          readMapList(payload.get("auditLog")));
      scrubbedPersistedSecrets = scrubbedPersistedSecrets
          || !sanitizedAuditLog.equals(readMapList(payload.get("auditLog")));
      workManagerAuditLog.addAll(sanitizedAuditLog);
      if (scrubbedPersistedSecrets) {
        persistWorkManagerState();
      }
    } catch (Exception ignored) {
      workManagerCommandHistory.clear();
      workManagerDynamicFeed.clear();
      workManagerAuditLog.clear();
    }
  }

  private synchronized void persistWorkManagerState() {
    if (workManagerStorePath == null) {
      return;
    }

    try {
      Files.createDirectories(workManagerStorePath.getParent());
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("savedAt", Instant.now().toString());
      payload.put("mode", "file-backed");
      payload.put("targetDatabase", "embedded-h2");
      payload.put("commandHistory", sanitizePersistedWorkManagerMapList(workManagerCommandHistory()));
      payload.put("activityFeed", sanitizePersistedWorkManagerFeed(List.copyOf(workManagerDynamicFeed)));
      payload.put("auditLog", sanitizePersistedWorkManagerMapList(List.copyOf(workManagerAuditLog)));
      objectMapper.writerWithDefaultPrettyPrinter().writeValue(workManagerStorePath.toFile(), payload);
    } catch (Exception ignored) {
      // Keep the board readable even when audit persistence fails.
    }
  }

  ResponseEntity<String> proxyService(String method, String serviceId, String requestUri, String queryString, String body) {
    ServiceDescriptor service = services.stream()
        .filter(candidate -> candidate.serviceId().equals(serviceId))
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found"));

    if (!service.baseUrl().startsWith("http")) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Service is not HTTP routable");
    }

    String prefix = "/api/services/" + serviceId;
    String downstreamPath = requestUri.startsWith(prefix) ? requestUri.substring(prefix.length()) : "/";
    if (downstreamPath.isBlank()) {
      downstreamPath = "/";
    }
    String downstreamUrl = service.baseUrl() + downstreamPath + (queryString == null || queryString.isBlank() ? "" : "?" + queryString);

    try {
      HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(URI.create(downstreamUrl))
          .timeout(Duration.ofSeconds(3));
      HttpRequest downstreamRequest = "POST".equals(method)
          ? requestBuilder
              .header(HttpHeaders.CONTENT_TYPE, "application/json; charset=utf-8")
              .POST(HttpRequest.BodyPublishers.ofString(body == null || body.isBlank() ? "{}" : body))
              .build()
          : requestBuilder.GET().build();
      HttpResponse<String> downstreamResponse = client.send(downstreamRequest, HttpResponse.BodyHandlers.ofString());
      String contentType = downstreamResponse.headers().firstValue(HttpHeaders.CONTENT_TYPE).orElse("application/json; charset=utf-8");
      return ResponseEntity.status(downstreamResponse.statusCode())
          .header(HttpHeaders.CONTENT_TYPE, contentType)
          .body(downstreamResponse.body());
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Service proxy failed");
    }
  }

  List<PlatformTicket> tickets() {
    return tickets.values().stream()
        .sorted(Comparator.comparing(PlatformTicket::createdAt).reversed())
        .toList();
  }

  PlatformTicket ticket(String ticketId) {
    PlatformTicket ticket = tickets.get(ticketId);
    if (ticket == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found");
    }
    return ticket;
  }

  synchronized PlatformTicket createTicket(TicketCreateRequest request) {
    TicketCreateRequest safeRequest = request == null
        ? new TicketCreateRequest(null, null, null, null, null, null, null)
        : request;
    String type = normalizeText(safeRequest.type(), "job.platform.dev-ticket");
    String requestedBy = normalizeText(safeRequest.requestedBy(), "frontend");
    String targetNode = normalizeText(safeRequest.targetNode(), "ion2");
    String serviceId = normalizeText(safeRequest.serviceId(), "elevator-service");
    String summary = normalizeText(safeRequest.summary(), type);
    int priority = safeRequest.priority() == null ? 5 : safeRequest.priority();
    Map<String, Object> payload = safeRequest.payload() == null ? Map.of() : new LinkedHashMap<>(safeRequest.payload());

    PlatformTicket ticket = new PlatformTicket(
        UUID.randomUUID().toString(),
        type,
        payload,
        "queued",
        priority,
        requestedBy,
        Instant.now().toString(),
        Instant.now().toString(),
        0,
        3,
        null,
        null,
        serviceId,
        targetNode,
        summary);
    tickets.put(ticket.id(), ticket);
    return ticket;
  }

  synchronized PlatformTicket claimTicket(String ticketId) {
    PlatformTicket ticket = ticket(ticketId);
    if (!ticket.status().equals("queued") && !ticket.status().equals("retrying") && !ticket.status().equals("waiting_llm")) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket is not claimable");
    }
    PlatformTicket updated = ticket.withStatus("running").withAttempts(ticket.attempts() + 1);
    tickets.put(ticketId, updated);
    return updated;
  }

  synchronized PlatformTicket completeTicket(String ticketId, Object result) {
    PlatformTicket ticket = ticket(ticketId);
    PlatformTicket updated = ticket.withStatus("completed").withResult(result).withError(null);
    tickets.put(ticketId, updated);
    return updated;
  }

  synchronized PlatformTicket failTicket(String ticketId, String error) {
    PlatformTicket ticket = ticket(ticketId);
    String nextStatus = ticket.attempts() + 1 >= ticket.maxAttempts() ? "failed" : "retrying";
    PlatformTicket updated = ticket.withStatus(nextStatus).withError(normalizeText(error, "worker execution failed"));
    tickets.put(ticketId, updated);
    return updated;
  }

  synchronized PlatformTicket waitingForLlm(String ticketId, Object result, String error) {
    PlatformTicket ticket = ticket(ticketId);
    if (ticket.status().equals("completed") || ticket.status().equals("failed") || ticket.status().equals("cancelled")) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket cannot transition to waiting_llm");
    }
    PlatformTicket updated = ticket.withStatus("waiting_llm")
        .withResult(result)
        .withError(normalizeText(error, "ollama unavailable"));
    tickets.put(ticketId, updated);
    return updated;
  }

  synchronized Map<String, Object> authenticateWorkManager(String remoteAddress, WorkManagerAuthRequest request) {
    cleanupExpiredWorkManagerSessions();
    String normalizedRemoteAddress = normalizeText(remoteAddress, "unknown");
    WorkManagerAuthAttempt attempt = workManagerAuthAttempts.getOrDefault(
        normalizedRemoteAddress,
        WorkManagerAuthAttempt.unlocked());
    Instant now = Instant.now();
    if (attempt.isLocked(now) || workManagerGlobalAuthAttempt.isLocked(now)) {
      throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed password attempts");
    }

    String password = request == null ? "" : normalizeText(request.password(), "");
    if (password.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shared password is required");
    }

    if (!matchesWorkManagerPassword(password)) {
      workManagerAuthAttempts.put(
          normalizedRemoteAddress,
          attempt.registerFailure(now, workManagerMaxFailedAttempts, workManagerLockDuration));
      workManagerGlobalAuthAttempt = workManagerGlobalAuthAttempt.registerFailure(
          now,
          workManagerMaxFailedAttempts,
          workManagerLockDuration);
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid shared password");
    }

    workManagerAuthAttempts.remove(normalizedRemoteAddress);
    workManagerGlobalAuthAttempt = WorkManagerAuthAttempt.unlocked();
    String token = UUID.randomUUID().toString() + UUID.randomUUID().toString().replace("-", "");
    Instant expiresAt = now.plus(workManagerSessionTtl);
    workManagerSessions.put(token, new WorkManagerSession(token, "work-manager", normalizedRemoteAddress, expiresAt));

    recordWorkManagerFeed(
        "auth",
        "gateway",
        "Work Manager command gate unlocked",
        "Protected ticket moves and preset commands are available until the session expires.",
        List.of());
    recordWorkManagerAudit(
        "auth",
        "gateway",
        "",
        Map.of("remoteAddress", normalizedRemoteAddress, "expiresAt", expiresAt.toString()));

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("token", token);
    response.put("expiresAt", expiresAt.toString());
    response.put("sessionTtlMinutes", workManagerSessionTtl.toMinutes());
    response.put("message", "Command gate unlocked");
    return response;
  }

  synchronized String requireWorkManagerSession(String token) {
    cleanupExpiredWorkManagerSessions();
    if (token == null || token.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing X-Work-Manager-Token");
    }

    WorkManagerSession session = workManagerSessions.get(token);
    if (session == null || session.isExpired(Instant.now())) {
      workManagerSessions.remove(token);
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Work Manager session expired");
    }

    return session.actor();
  }

  synchronized Map<String, Object> transitionWorkTicket(
      String ticketId,
      WorkManagerTransitionRequest request,
      String actor) {
    String targetStatus = normalizeText(request == null ? null : request.targetStatus(), "");
    String note = normalizeText(request == null ? null : request.note(), "");
    if (!WORK_MANAGER_STATUSES.contains(targetStatus)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown target status");
    }

    Path ticketPath = locateTicketPath(ticketId);
    if (ticketPath == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Work ticket not found");
    }

    String currentStatus = inferStatusFromTicketPath(ticketPath);
    validateWorkManagerTransition(currentStatus, targetStatus);
    validateTransitionGate(ticketPath, targetStatus);

    Path updatedTicketPath = persistWorkManagerTransition(ticketId, ticketPath, targetStatus);

    PlatformTicket workerTicket = null;
    if ("started".equals(targetStatus)) {
      workerTicket = enqueueWorkManagerOperationTicket(
          "job.work-manager.start-ticket",
          "Start work on " + ticketId,
          note,
          ticketId,
          actor,
          Map.of(
              "ticketId", ticketId,
              "fromStatus", currentStatus,
              "targetStatus", targetStatus,
              "ticketPath", normalizeRelativePath(updatedTicketPath)));
    }

    String feedType = "started".equals(targetStatus) ? "ticket_issued" : "review";
    String summary = note.isBlank()
        ? ticketId + " moved from " + currentStatus + " to " + targetStatus + "."
        : ticketId + " moved from " + currentStatus + " to " + targetStatus + ". Note: " + note;
    recordWorkManagerFeed(
        feedType,
        actor,
        ticketId + " moved to " + workManagerColumnLabel(targetStatus),
        summary,
        List.of(ticketId));
    recordWorkManagerAudit(
        "status_transition",
        actor,
        ticketId,
        Map.of(
            "fromStatus", currentStatus,
            "toStatus", targetStatus,
            "workerTicketId", workerTicket == null ? "" : workerTicket.id(),
            "ticketPath", normalizeRelativePath(updatedTicketPath)));

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("message", workerTicket == null
        ? ticketId + " moved to " + workManagerColumnLabel(targetStatus)
        : ticketId + " moved to " + workManagerColumnLabel(targetStatus) + " and worker ticket " + workerTicket.id() + " was queued");
    response.put("workerTicket", workerTicket == null ? null : workManagerWorkerTicket(workerTicket));
    response.put("board", workManagerBoard());
    return response;
  }

  synchronized Map<String, Object> updateWorkTicketMetadata(
      String ticketId,
      WorkManagerMetadataUpdateRequest request,
      String actor) {
    Path ticketPath = locateTicketPath(ticketId);
    if (ticketPath == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Work ticket not found");
    }

    Map<String, String> metadata = readTicketMetadata(ticketPath);
    String currentTargetVersion = normalizeText(metadata.get(TICKET_FIELD_TARGET_VERSION), "");
    String currentPriority = normalizeText(metadata.get(TICKET_FIELD_PRIORITY), "");
    String currentProgressDecision = normalizeText(metadata.get(TICKET_FIELD_PROGRESS_DECISION), "");
    Map<String, String> sections = readTicketSections(ticketPath);
    String currentDependencies = normalizeText(
        sections.getOrDefault(TICKET_SECTION_DEPENDENCIES, sections.getOrDefault("\uC120\uD589 \uC870\uAC74", TICKET_NONE)),
        TICKET_NONE);

    String nextTargetVersion = normalizeWorkTicketTargetVersion(request == null ? null : request.targetVersion(), currentTargetVersion);
    String nextPriority = normalizeWorkTicketPriority(request == null ? null : request.priority(), currentPriority);
    String nextDependencies = normalizeWorkTicketDependencies(request == null ? null : request.dependencies(), currentDependencies);
    String nextProgressDecision = syncProgressDecisionWithTargetVersion(
        currentProgressDecision,
        currentTargetVersion,
        nextTargetVersion);

    Path updatedTicketPath = persistWorkTicketMetadata(
        ticketPath,
        nextTargetVersion,
        nextPriority,
        nextProgressDecision,
        nextDependencies);

    updateBoardTicketMetadata(ticketId, nextPriority, nextTargetVersion, nextProgressDecision);

    List<String> changes = new ArrayList<>();
    if (!Objects.equals(currentTargetVersion, nextTargetVersion)) {
      changes.add("target version");
    }
    if (!Objects.equals(currentPriority, nextPriority)) {
      changes.add("priority");
    }
    if (!Objects.equals(currentDependencies, nextDependencies)) {
      changes.add("dependencies");
    }

    String summary = changes.isEmpty()
        ? ticketId + " metadata save was requested with no field changes."
        : ticketId + " metadata updated: " + String.join(", ", changes) + ".";
    recordWorkManagerFeed(
        "review",
        actor,
        ticketId + " metadata updated",
        summary,
        List.of(ticketId));
    recordWorkManagerAudit(
        "metadata_update",
        actor,
        ticketId,
        Map.of(
            "targetVersion", nextTargetVersion,
            "priority", nextPriority,
            "dependencies", nextDependencies,
            "ticketPath", normalizeRelativePath(updatedTicketPath)));

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("message", changes.isEmpty()
        ? ticketId + " metadata is already up to date"
        : ticketId + " metadata was updated");
    response.put("ticketPath", normalizeRelativePath(updatedTicketPath));
    response.put("board", workManagerBoard());
    return response;
  }

  synchronized Map<String, Object> runWorkManagerCommand(WorkManagerCommandRequest request, String actor) {
    String action = normalizeText(request == null ? null : request.action(), "");
    String note = normalizeText(request == null ? null : request.note(), "");
    String relatedTicketId = normalizeText(request == null ? null : request.relatedTicketId(), "");
    WorkManagerPreset preset = findWorkManagerPreset(action);
    if (preset == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown command preset");
    }

    if (preset.requiresTicket() && relatedTicketId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This command requires a related ticket");
    }

    if (!relatedTicketId.isBlank() && locateTicketPath(relatedTicketId) == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Related work ticket not found");
    }

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("action", preset.action());
    payload.put("note", note);
    payload.put("relatedTicketId", relatedTicketId);
    payload.put("requestedBy", actor);

    PlatformTicket workerTicket = enqueueWorkManagerOperationTicket(
        preset.ticketType(),
        preset.summary(relatedTicketId),
        note,
        relatedTicketId,
        actor,
        payload);

    WorkManagerCommandRun commandRun = new WorkManagerCommandRun(
        "wm-command-" + UUID.randomUUID().toString().substring(0, 8),
        preset.action(),
        preset.label(),
        note,
        "queued",
        actor,
        Instant.now().toString(),
        relatedTicketId,
        workerTicket.id(),
        "Preset command was queued through the platform ticket bridge.");
    recordWorkManagerCommand(commandRun);
    recordWorkManagerFeed(
        "command",
        actor,
        preset.label(),
        note.isBlank()
            ? "Preset command was queued through worker ticket " + workerTicket.id() + "."
            : note,
        relatedTicketId.isBlank() ? List.of() : List.of(relatedTicketId));
    recordWorkManagerAudit(
        "command_run",
        actor,
        relatedTicketId,
        Map.of(
            "action", preset.action(),
            "workerTicketId", workerTicket.id(),
            "commandId", commandRun.id()));

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("message", preset.label() + " was queued");
    response.put("commandRun", commandRun.toMap());
    response.put("board", workManagerBoard());
    return response;
  }

  Map<String, Object> healthSnapshot(String ollamaBaseUrl) {
    List<Map<String, Object>> serviceHealth = services.stream()
        .map(this::probeService)
        .toList();
    List<Map<String, Object>> httpServiceHealth = serviceHealth.stream()
        .filter(entry -> "http".equals(entry.get("healthMode")))
        .toList();

    String ollamaStatus = ollamaBaseUrl == null || ollamaBaseUrl.isBlank()
        ? "unavailable"
        : probeUrl(ollamaBaseUrl + "/api/tags");

    String overallStatus = httpServiceHealth.stream().allMatch(entry -> "ok".equals(entry.get("status")))
        && !"unavailable".equals(ollamaStatus)
        ? "ok"
        : "degraded";

    Map<String, Object> components = new LinkedHashMap<>();
    components.put("gateway", "ok");
    components.put("redis", "planned");
    components.put("worker", tickets.values().stream().anyMatch(ticket -> "running".equals(ticket.status())) ? "active" : "idle");
    components.put("ollama", ollamaStatus);

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("status", overallStatus);
    response.put("timestamp", Instant.now().toString());
    response.put("components", components);
    response.put("services", serviceHealth);
    response.put("tickets", Map.of(
        "queued", tickets.values().stream().filter(ticket -> "queued".equals(ticket.status())).count(),
        "running", tickets.values().stream().filter(ticket -> "running".equals(ticket.status())).count(),
        "waiting_llm", tickets.values().stream().filter(ticket -> "waiting_llm".equals(ticket.status())).count(),
        "retrying", tickets.values().stream().filter(ticket -> "retrying".equals(ticket.status())).count(),
        "completed", tickets.values().stream().filter(ticket -> "completed".equals(ticket.status())).count()));
    return response;
  }

  Map<String, Object> runtimeSnapshot(String ollamaBaseUrl) {
    String ollamaStatus = ollamaBaseUrl == null || ollamaBaseUrl.isBlank()
        ? "unavailable"
        : probeUrl(ollamaBaseUrl + "/api/tags");

    List<Map<String, Object>> nodes = List.of(
        runtimeNode(
            "ion2",
            "local-control",
            "online",
            List.of("gateway", "worker execution", "light service routing"),
            List.of("light services", "non-llm tickets", "fallback control path")),
        runtimeNode(
            "rtx5070",
            "external-inference",
            ollamaStatus,
            List.of("ollama inference", "heavy model jobs", "code assistance drafts"),
            List.of("llm tickets", "heavy offload requests", "gpu-backed inference")));

    List<Map<String, Object>> routingRules = List.of(
        Map.of(
            "when", "service.loadProfile=light",
            "preferNode", "ion2",
            "requiresOllama", false,
            "degradedFallback", "keep serving on ion2"),
        Map.of(
            "when", "ticket.targetNode=rtx5070",
            "preferNode", "rtx5070",
            "requiresOllama", false,
            "degradedFallback", "worker may keep ticket queued or retry"),
        Map.of(
            "when", "type=job.llm.* or payload.requiresLlm=true",
            "preferNode", "rtx5070",
            "requiresOllama", true,
            "degradedFallback", "transition ticket to waiting_llm"));

    Map<String, Object> ticketExample = new LinkedHashMap<>();
    ticketExample.put("type", "job.llm.summary");
    ticketExample.put("serviceId", "elevator-service");
    ticketExample.put("targetNode", "rtx5070");
    ticketExample.put("summary", "Draft a report when the GPU runtime is available");
    ticketExample.put("payload", Map.of(
        "requiresLlm", true,
        "inferenceProvider", "ollama",
        "targetRuntime", "ollama"));

    Map<String, Object> ollama = new LinkedHashMap<>();
    ollama.put("baseUrlConfigured", ollamaBaseUrl != null && !ollamaBaseUrl.isBlank());
    ollama.put("baseUrl", ollamaBaseUrl == null || ollamaBaseUrl.isBlank() ? "" : ollamaBaseUrl);
    ollama.put("healthPath", "/api/tags");
    ollama.put("status", ollamaStatus);
    ollama.put("waitingState", "waiting_llm");
    ollama.put("retryHintSeconds", 30);

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("status", "ok");
    response.put("generatedAt", Instant.now().toString());
    response.put("defaultTargetNode", "ion2");
    response.put("offloadTargetNode", "rtx5070");
    response.put("nodes", nodes);
    response.put("routingRules", routingRules);
    response.put("ticketCreateExample", ticketExample);
    response.put("ollama", ollama);
    return response;
  }

  Map<String, Object> workManagerBoard() {
    cleanupExpiredWorkManagerSessions();
    if (repoRoot == null) {
      return fallbackWorkManagerBoard("repo root unavailable");
    }

    Path boardPath = repoRoot.resolve("docs").resolve("tickets").resolve("board.md");
    if (!Files.exists(boardPath)) {
      return fallbackWorkManagerBoard("board.md not found");
    }

    try {
      Map<String, List<Map<String, Object>>> ticketsByStatus = new LinkedHashMap<>();
      for (String status : WORK_MANAGER_STATUSES) {
        ticketsByStatus.put(status, new ArrayList<>());
      }

      String currentStatus = null;
      for (String rawLine : Files.readAllLines(boardPath, StandardCharsets.UTF_8)) {
        String line = rawLine.trim();
        if (line.equals("## Backlog")) {
          currentStatus = "backlog";
          continue;
        }
        if (line.equals("## Started")) {
          currentStatus = "started";
          continue;
        }
        if (line.equals("## Need Review")) {
          currentStatus = "need_review";
          continue;
        }
        if (line.equals("## Finished")) {
          currentStatus = "finished";
          continue;
        }

        if (currentStatus != null && line.startsWith("- `TKT-")) {
          ticketsByStatus.get(currentStatus).add(parseBoardTicket(line, currentStatus));
        }
      }

      List<Map<String, Object>> columns = new ArrayList<>();
      for (Map.Entry<String, List<Map<String, Object>>> entry : ticketsByStatus.entrySet()) {
        Map<String, Object> column = new LinkedHashMap<>();
        column.put("status", entry.getKey());
        column.put("label", workManagerColumnLabel(entry.getKey()));
        column.put("tickets", entry.getValue());
        columns.add(column);
      }

      Map<String, Object> response = new LinkedHashMap<>();
      response.put("source", "docs");
      response.put("generatedAt", Instant.now().toString());
      response.put("activityFeed", workManagerActivityFeed(ticketsByStatus));
      response.put("commandHistory", workManagerCommandHistory());
      response.put("columns", columns);
      response.put("workerSummary", workManagerWorkerSummary(ticketsByStatus));
      response.put("priorityPolicy", workManagerPriorityPolicy(ticketsByStatus));
      response.put("persistence", workManagerPersistenceSummary());
      response.put("actions", workManagerActionDescriptor(false));
      return response;
    } catch (Exception ex) {
      return fallbackWorkManagerBoard(ex.getClass().getSimpleName());
    }
  }

  private Map<String, Object> runtimeNode(
      String nodeId,
      String role,
      String availability,
      List<String> handles,
      List<String> defaultFor) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("nodeId", nodeId);
    response.put("role", role);
    response.put("availability", availability);
    response.put("handles", handles);
    response.put("defaultFor", defaultFor);
    return response;
  }

  private Map<String, Object> parseBoardTicket(String line, String status) {
    List<String> tokens = new ArrayList<>();
    Matcher matcher = TICKET_META_PATTERN.matcher(line);
    int titleStart = 0;
    while (matcher.find()) {
      tokens.add(matcher.group(1));
      titleStart = matcher.end();
    }

    String id = tokens.size() > 0 ? tokens.get(0) : "TKT-UNKNOWN";
    String priority = tokens.size() > 1 ? tokens.get(1) : "P?";
    String targetVersion = tokens.size() > 2 ? tokens.get(2) : "unknown";
    String progressDecision = tokens.size() > 3 ? tokens.get(3) : inferProgressDecision(status);
    String title = line.substring(Math.min(titleStart, line.length())).trim();

    Path ticketPath = locateTicketPath(id);
    Map<String, String> sections = ticketPath == null ? Map.of() : readTicketSections(ticketPath);
    String prerequisites = sections.getOrDefault("\uC120\uD589 \uC870\uAC74", "");

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("id", id);
    response.put("title", title);
    response.put("priority", priority);
    response.put("targetVersion", targetVersion);
    response.put("status", status);
    response.put("progressDecision", progressDecision);
    response.put("path", ticketPath == null ? "" : normalizeRelativePath(ticketPath));
    response.put("assignedWorker", "started".equals(status) ? "ion2-worker" : "");
    response.put("ownershipState", "started".equals(status) ? "worker-owned" : "queue-visible");
    response.put("dependencies", sections.getOrDefault("\uC758\uC874\uC131", prerequisites));
    response.put("prPreparationMemo", sections.getOrDefault("PR \uC900\uBE44 \uBA54\uBAA8", ""));
    response.put("goal", sections.getOrDefault("목표", ""));
    response.put("workItems", sections.getOrDefault("작업 내용", ""));
    response.put("scope", sections.getOrDefault("범위", ""));
    response.put("prerequisites", sections.getOrDefault("선행 조건", ""));
    response.put("questions", sections.getOrDefault("질문/결정 기록", ""));
    response.put("reviewMemo", sections.getOrDefault("검토 메모", ""));
    response.put("notes", sections.getOrDefault("Notes", ""));
    response.put("deliverables", sections.getOrDefault("작업자 산출물", ""));
    return response;
  }

  private Map<String, String> readTicketSections(Path ticketPath) {
    try {
      Map<String, StringBuilder> buffers = new LinkedHashMap<>();
      String currentSection = null;
      for (String rawLine : Files.readAllLines(ticketPath, StandardCharsets.UTF_8)) {
        if (rawLine.startsWith("## ")) {
          currentSection = rawLine.substring(3).trim();
          buffers.putIfAbsent(currentSection, new StringBuilder());
          continue;
        }

        if (currentSection != null) {
          buffers.get(currentSection).append(rawLine).append(System.lineSeparator());
        }
      }

      Map<String, String> sections = new LinkedHashMap<>();
      for (Map.Entry<String, StringBuilder> entry : buffers.entrySet()) {
        sections.put(entry.getKey(), entry.getValue().toString().trim());
      }
      return sections;
    } catch (Exception ex) {
      return Map.of();
    }
  }

  private Map<String, String> readTicketMetadata(Path ticketPath) {
    try {
      Map<String, String> metadata = new LinkedHashMap<>();
      boolean inMetadata = false;
      for (String rawLine : Files.readAllLines(ticketPath, StandardCharsets.UTF_8)) {
        String line = rawLine.trim();
        if (line.equals("## 메타데이터")) {
          inMetadata = true;
          continue;
        }
        if (inMetadata && line.startsWith("## ")) {
          break;
        }
        if (!inMetadata || !line.startsWith("- ") || !line.contains(":")) {
          continue;
        }

        String[] parts = line.substring(2).split(":", 2);
        metadata.put(parts[0].trim(), cleanBacktickValue(parts[1]));
      }
      return metadata;
    } catch (Exception ex) {
      return Map.of();
    }
  }

  private String normalizeWorkTicketTargetVersion(String requestedValue, String fallback) {
    String normalized = normalizeText(requestedValue, fallback).replace("`", "").trim();
    if (normalized.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target version is required");
    }
    if ("infra".equals(normalized) || "chore".equals(normalized)) {
      return normalized;
    }
    if (!normalized.matches("v\\d+\\.\\d+\\.\\d+")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported target version format");
    }
    return normalized;
  }

  private String normalizeWorkTicketPriority(String requestedValue, String fallback) {
    String normalized = normalizeText(requestedValue, fallback).replace("`", "").trim().toUpperCase();
    if (!normalized.matches("P[1-5]")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Priority must be P1 to P5");
    }
    return normalized;
  }

  private String normalizeWorkTicketDependencies(String requestedValue, String fallback) {
    String normalized = normalizeText(requestedValue, fallback).trim();
    return normalized.isBlank() ? TICKET_NONE : normalized;
  }

  private String syncProgressDecisionWithTargetVersion(
      String currentProgressDecision,
      String currentTargetVersion,
      String nextTargetVersion) {
    if (currentProgressDecision == null || currentProgressDecision.isBlank()) {
      return currentProgressDecision;
    }
    String expectedCurrent = currentTargetVersion == null || currentTargetVersion.isBlank()
        ? ""
        : currentTargetVersion + " 진행 시 가능";
    if (!expectedCurrent.isBlank() && currentProgressDecision.equals(expectedCurrent)) {
      return nextTargetVersion + " 진행 시 가능";
    }
    return currentProgressDecision;
  }

  private Path persistWorkTicketMetadata(
      Path ticketPath,
      String targetVersion,
      String priority,
      String progressDecision,
      String dependencies) {
    try {
      List<String> lines = Files.readAllLines(ticketPath, StandardCharsets.UTF_8);
      List<String> updatedLines = replaceTicketMetadataValues(
          lines,
          Map.of(
              TICKET_FIELD_TARGET_VERSION, targetVersion,
              TICKET_FIELD_PRIORITY, priority,
              TICKET_FIELD_PROGRESS_DECISION, progressDecision));
      updatedLines = upsertTicketSection(
          updatedLines,
          TICKET_SECTION_DEPENDENCIES,
          dependencies,
          TICKET_SECTION_DECISIONS);

      Path nextPath = renameTicketPathForTargetVersion(ticketPath, targetVersion);
      writeUtf8BomDocument(nextPath, updatedLines);
      if (!nextPath.equals(ticketPath) && Files.exists(ticketPath)) {
        Files.delete(ticketPath);
      }
      return nextPath;
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update work ticket metadata");
    }
  }

  private List<String> replaceTicketMetadataValues(List<String> lines, Map<String, String> nextValues) {
    List<String> updated = new ArrayList<>();
    boolean inMetadata = false;
    for (String rawLine : lines) {
      String trimmed = rawLine.trim();
      if (trimmed.equals("## " + TICKET_METADATA_HEADER)) {
        inMetadata = true;
        updated.add(rawLine);
        continue;
      }
      if (inMetadata && trimmed.startsWith("## ")) {
        inMetadata = false;
      }

      if (inMetadata && trimmed.startsWith("- ") && trimmed.contains(":")) {
        String[] parts = trimmed.substring(2).split(":", 2);
        String key = parts[0].trim();
        if (nextValues.containsKey(key)) {
          String indent = rawLine.substring(0, Math.max(0, rawLine.indexOf('-')));
          updated.add(indent + "- " + key + ": `" + nextValues.get(key) + "`");
          continue;
        }
      }

      updated.add(rawLine);
    }
    return updated;
  }

  private List<String> upsertTicketSection(
      List<String> lines,
      String sectionTitle,
      String content,
      String insertBeforeTitle) {
    List<String> contentLines = splitTicketSectionContent(content);
    int sectionStart = -1;
    int sectionEnd = lines.size();
    int insertBeforeIndex = -1;

    for (int index = 0; index < lines.size(); index++) {
      String trimmed = lines.get(index).trim();
      if (trimmed.equals("## " + sectionTitle)) {
        sectionStart = index;
        continue;
      }
      if (trimmed.equals("## " + insertBeforeTitle) && insertBeforeIndex < 0) {
        insertBeforeIndex = index;
      }
      if (sectionStart >= 0 && index > sectionStart && trimmed.startsWith("## ")) {
        sectionEnd = index;
        break;
      }
    }

    List<String> rewritten = new ArrayList<>();
    if (sectionStart >= 0) {
      rewritten.addAll(lines.subList(0, sectionStart + 1));
      rewritten.add("");
      rewritten.addAll(contentLines);
      rewritten.add("");
      rewritten.addAll(lines.subList(sectionEnd, lines.size()));
      return rewritten;
    }

    int insertionIndex = insertBeforeIndex >= 0 ? insertBeforeIndex : lines.size();
    rewritten.addAll(lines.subList(0, insertionIndex));
    if (!rewritten.isEmpty() && !rewritten.get(rewritten.size() - 1).isBlank()) {
      rewritten.add("");
    }
    rewritten.add("## " + sectionTitle);
    rewritten.add("");
    rewritten.addAll(contentLines);
    rewritten.add("");
    rewritten.addAll(lines.subList(insertionIndex, lines.size()));
    return rewritten;
  }

  private List<String> splitTicketSectionContent(String content) {
    String normalized = normalizeText(content, TICKET_NONE).replace("\r\n", "\n").replace('\r', '\n').trim();
    if (normalized.isBlank()) {
      return List.of(TICKET_NONE);
    }
    return Arrays.asList(normalized.split("\n", -1));
  }

  private Path renameTicketPathForTargetVersion(Path ticketPath, String targetVersion) {
    String fileName = ticketPath.getFileName().toString();
    Matcher matcher = TICKET_FILENAME_PATTERN.matcher(fileName);
    if (!matcher.matches()) {
      return ticketPath;
    }
    String nextFileName = matcher.group(1) + "-" + targetVersion + "-" + matcher.group(3);
    return ticketPath.resolveSibling(nextFileName);
  }

  private void writeUtf8BomDocument(Path path, List<String> lines) {
    try {
      Files.createDirectories(path.getParent());
      List<String> normalizedLines = new ArrayList<>(lines);
      if (!normalizedLines.isEmpty()) {
        normalizedLines.set(0, normalizedLines.get(0).replace("\uFEFF", ""));
      }
      String content = String.join(System.lineSeparator(), normalizedLines);
      if (!content.endsWith(System.lineSeparator())) {
        content = content + System.lineSeparator();
      }
      Files.writeString(path, "\uFEFF" + content, StandardCharsets.UTF_8);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to write UTF-8 BOM document");
    }
  }

  private Path locateTicketPath(String ticketId) {
    if (repoRoot == null) {
      return null;
    }

    Path ticketsRoot = repoRoot.resolve("docs").resolve("tickets");
    for (String folder : WORK_MANAGER_STATUSES) {
      Path folderPath = ticketsRoot.resolve(folder);
      if (!Files.isDirectory(folderPath)) {
        continue;
      }
      try (var stream = Files.list(folderPath)) {
        Path match = stream
            .filter(path -> path.getFileName().toString().startsWith(ticketId))
            .findFirst()
            .orElse(null);
        if (match != null) {
          return match;
        }
      } catch (Exception ignored) {
        // Ignore one broken folder and keep scanning other statuses.
      }
    }
    return null;
  }

  private void validateWorkManagerTransition(String currentStatus, String targetStatus) {
    if (Objects.equals(currentStatus, targetStatus)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket is already in " + targetStatus);
    }

    boolean allowed = switch (currentStatus) {
      case "backlog" -> "started".equals(targetStatus);
      case "started" -> "need_review".equals(targetStatus);
      case "need_review" -> "finished".equals(targetStatus);
      default -> false;
    };

    if (!allowed) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Transition not allowed: " + currentStatus + " -> " + targetStatus);
    }
  }

  private void validateTransitionGate(Path ticketPath, String targetStatus) {
    if (!"started".equals(targetStatus)) {
      return;
    }

    Map<String, String> metadata = readTicketMetadata(ticketPath);
    String progressDecision = metadata.getOrDefault("진행 판정", "");
    String targetVersion = metadata.getOrDefault("대상 버전", "");
    if (progressDecision.isBlank()) {
      return;
    }

    boolean allowed = "진행 가능".equals(progressDecision)
        || (targetVersion != null && !targetVersion.isBlank() && progressDecision.equals(targetVersion + " 진행 시 가능"));
    if (!allowed) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ticket is blocked by progress decision: " + progressDecision);
    }
  }

  private Path persistWorkManagerTransition(String ticketId, Path ticketPath, String targetStatus) {
    updateTicketMetadataStatus(ticketPath, targetStatus);

    Path targetDirectory = ticketPath.getParent().getParent().resolve(targetStatus);
    Path targetPath = targetDirectory.resolve(ticketPath.getFileName());
    try {
      Files.createDirectories(targetDirectory);
      if (!ticketPath.equals(targetPath)) {
        Files.move(ticketPath, targetPath, StandardCopyOption.REPLACE_EXISTING);
      }
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to move work ticket");
    }

    updateBoardTicketStatus(ticketId, targetStatus);
    return targetPath;
  }

  private void updateTicketMetadataStatus(Path ticketPath, String targetStatus) {
    try {
      List<String> lines = Files.readAllLines(ticketPath, StandardCharsets.UTF_8);
      List<String> updated = new ArrayList<>();
      for (String rawLine : lines) {
        String line = rawLine.trim();
        if (line.startsWith("- 상태:")) {
          String indent = rawLine.substring(0, Math.max(0, rawLine.indexOf('-')));
          updated.add(indent + "- 상태: `" + targetStatus + "`");
          continue;
        }
        updated.add(rawLine);
      }
      writeUtf8BomDocument(ticketPath, updated);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update work ticket metadata");
    }
  }

  private void updateBoardTicketStatus(String ticketId, String targetStatus) {
    if (repoRoot == null) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "repo root unavailable");
    }

    Path boardPath = repoRoot.resolve("docs").resolve("tickets").resolve("board.md");
    try {
      List<String> lines = Files.readAllLines(boardPath, StandardCharsets.UTF_8);
      Map<String, List<String>> sectionTickets = new LinkedHashMap<>();
      for (String status : WORK_MANAGER_STATUSES) {
        sectionTickets.put(status, new ArrayList<>());
      }

      int rulesIndex = lines.indexOf(BOARD_RULES_HEADER);
      if (rulesIndex < 0) {
        rulesIndex = lines.size();
      }

      String movingLine = null;
      String currentSection = null;
      for (int index = 0; index < rulesIndex; index++) {
        String trimmed = lines.get(index).trim();
        if (trimmed.equals("## Backlog")) {
          currentSection = "backlog";
          continue;
        }
        if (trimmed.equals("## Started")) {
          currentSection = "started";
          continue;
        }
        if (trimmed.equals("## Need Review")) {
          currentSection = "need_review";
          continue;
        }
        if (trimmed.equals("## Finished")) {
          currentSection = "finished";
          continue;
        }

        if (currentSection != null && trimmed.startsWith("- `TKT-")) {
          if (trimmed.startsWith("- `" + ticketId + "`")) {
            movingLine = trimmed;
          } else {
            sectionTickets.get(currentSection).add(trimmed);
          }
        }
      }

      if (movingLine == null) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket line not found on board");
      }

      sectionTickets.get(targetStatus).add(0, movingLine);

      List<String> rewritten = new ArrayList<>();
      rewritten.add("# 티켓 보드");
      rewritten.add("");
      rewritten.add("## Backlog");
      rewritten.add("");
      rewritten.addAll(sectionTickets.get("backlog"));
      rewritten.add("");
      rewritten.add("## Started");
      rewritten.add("");
      rewritten.addAll(sectionTickets.get("started"));
      rewritten.add("");
      rewritten.add("## Need Review");
      rewritten.add("");
      rewritten.addAll(sectionTickets.get("need_review"));
      rewritten.add("");
      rewritten.add("## Finished");
      rewritten.add("");
      rewritten.addAll(sectionTickets.get("finished"));
      rewritten.add("");
      if (rulesIndex < lines.size()) {
        rewritten.addAll(lines.subList(rulesIndex, lines.size()));
      }

      writeUtf8BomDocument(boardPath, rewritten);
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update board.md");
    }
  }

  private void updateBoardTicketMetadata(
      String ticketId,
      String priority,
      String targetVersion,
      String progressDecision) {
    if (repoRoot == null) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "repo root unavailable");
    }

    Path boardPath = repoRoot.resolve("docs").resolve("tickets").resolve("board.md");
    try {
      List<String> lines = Files.readAllLines(boardPath, StandardCharsets.UTF_8);
      int boardStartIndex = findTrimmedLineIndex(lines, "## Backlog");
      int rulesIndex = findTrimmedLineIndex(lines, BOARD_RULES_HEADER);
      if (boardStartIndex < 0) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "board sections unavailable");
      }
      if (rulesIndex < 0) {
        rulesIndex = lines.size();
      }

      Map<String, List<String>> sectionTickets = extractBoardSectionTickets(lines, boardStartIndex, rulesIndex);
      boolean updated = false;
      for (List<String> ticketLines : sectionTickets.values()) {
        for (int index = 0; index < ticketLines.size(); index++) {
          String line = ticketLines.get(index);
          if (!line.startsWith("- `" + ticketId + "`")) {
            continue;
          }
          ticketLines.set(index, rewriteBoardTicketLine(line, priority, targetVersion, progressDecision));
          updated = true;
        }
      }

      if (!updated) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket line not found on board");
      }

      writeUtf8BomDocument(boardPath, rebuildBoardLines(lines, boardStartIndex, rulesIndex, sectionTickets));
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update board metadata");
    }
  }

  private int findTrimmedLineIndex(List<String> lines, String target) {
    for (int index = 0; index < lines.size(); index++) {
      if (target.equals(lines.get(index).trim())) {
        return index;
      }
    }
    return -1;
  }

  private Map<String, List<String>> extractBoardSectionTickets(List<String> lines, int boardStartIndex, int rulesIndex) {
    Map<String, List<String>> sectionTickets = new LinkedHashMap<>();
    for (String status : WORK_MANAGER_STATUSES) {
      sectionTickets.put(status, new ArrayList<>());
    }

    String currentSection = null;
    for (int index = boardStartIndex; index < rulesIndex; index++) {
      String trimmed = lines.get(index).trim();
      if (trimmed.equals("## Backlog")) {
        currentSection = "backlog";
        continue;
      }
      if (trimmed.equals("## Started")) {
        currentSection = "started";
        continue;
      }
      if (trimmed.equals("## Need Review")) {
        currentSection = "need_review";
        continue;
      }
      if (trimmed.equals("## Finished")) {
        currentSection = "finished";
        continue;
      }
      if (currentSection != null && trimmed.startsWith("- `TKT-")) {
        sectionTickets.get(currentSection).add(trimmed);
      }
    }
    return sectionTickets;
  }

  private String rewriteBoardTicketLine(
      String line,
      String priority,
      String targetVersion,
      String progressDecision) {
    List<String> tokens = new ArrayList<>();
    Matcher matcher = TICKET_META_PATTERN.matcher(line);
    int titleStart = 0;
    while (matcher.find()) {
      tokens.add(matcher.group(1));
      titleStart = matcher.end();
    }

    String id = tokens.size() > 0 ? tokens.get(0) : "TKT-UNKNOWN";
    String title = line.substring(Math.min(titleStart, line.length())).trim();
    return "- `" + id + "` `" + priority + "` `" + targetVersion + "` `" + progressDecision + "` " + title;
  }

  private List<String> rebuildBoardLines(
      List<String> originalLines,
      int boardStartIndex,
      int rulesIndex,
      Map<String, List<String>> sectionTickets) {
    List<String> rewritten = new ArrayList<>(originalLines.subList(0, boardStartIndex));
    if (!rewritten.isEmpty() && !rewritten.get(rewritten.size() - 1).isBlank()) {
      rewritten.add("");
    }
    appendBoardSection(rewritten, "Backlog", sectionTickets.get("backlog"));
    appendBoardSection(rewritten, "Started", sectionTickets.get("started"));
    appendBoardSection(rewritten, "Need Review", sectionTickets.get("need_review"));
    appendBoardSection(rewritten, "Finished", sectionTickets.get("finished"));
    if (rulesIndex < originalLines.size()) {
      rewritten.addAll(originalLines.subList(rulesIndex, originalLines.size()));
    }
    return rewritten;
  }

  private void appendBoardSection(List<String> lines, String title, List<String> ticketLines) {
    lines.add("## " + title);
    lines.add("");
    if (ticketLines != null) {
      lines.addAll(ticketLines);
    }
    lines.add("");
  }

  private PlatformTicket enqueueWorkManagerOperationTicket(
      String type,
      String summary,
      String note,
      String relatedTicketId,
      String actor,
      Map<String, Object> extraPayload) {
    Map<String, Object> payload = new LinkedHashMap<>(extraPayload);
    payload.put("requiresBridge", true);
    if (!note.isBlank()) {
      payload.put("note", note);
    }
    if (!relatedTicketId.isBlank()) {
      payload.put("relatedTicketId", relatedTicketId);
    }

    return createTicket(new TicketCreateRequest(
        type,
        payload,
        1,
        actor,
        "ion2-worker",
        "ion2",
        summary));
  }

  private Map<String, Object> workManagerWorkerTicket(PlatformTicket ticket) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("id", ticket.id());
    response.put("type", ticket.type());
    response.put("status", ticket.status());
    response.put("summary", ticket.summary());
    response.put("targetNode", ticket.targetNode());
    return response;
  }

  private String inferStatusFromTicketPath(Path ticketPath) {
    String folder = ticketPath.getParent().getFileName().toString();
    return WORK_MANAGER_STATUSES.contains(folder) ? folder : "backlog";
  }

  private String inferProgressDecision(String status) {
    return "finished".equals(status) ? "완료" : "진행 가능";
  }

  private String workManagerColumnLabel(String status) {
    return switch (status) {
      case "backlog" -> "Backlog";
      case "started" -> "Started";
      case "need_review" -> "Need Review";
      case "finished" -> "Finished";
      default -> status;
    };
  }

  private List<Map<String, Object>> workManagerActivityFeed(Map<String, List<Map<String, Object>>> ticketsByStatus) {
    List<Map<String, Object>> feed = new ArrayList<>(workManagerSeedActivityFeed(ticketsByStatus));
    synchronized (this) {
      feed.addAll(workManagerDynamicFeed);
    }
    feed.sort((left, right) -> String.valueOf(right.get("timestamp")).compareTo(String.valueOf(left.get("timestamp"))));
    return feed.stream().limit(WORK_MANAGER_FEED_LIMIT).toList();
  }

  private List<Map<String, Object>> workManagerSeedActivityFeed(Map<String, List<Map<String, Object>>> ticketsByStatus) {
    Instant now = Instant.now();
    boolean boardReadyForReview = ticketsByStatus.getOrDefault("need_review", List.of()).stream()
        .anyMatch(ticket -> "TKT-031".equals(ticket.get("id")));
    boolean feedReadyForReview = ticketsByStatus.getOrDefault("need_review", List.of()).stream()
        .anyMatch(ticket -> "TKT-034".equals(ticket.get("id")));

    List<String> nextBacklogTickets = ticketsByStatus.getOrDefault("backlog", List.of()).stream()
        .map(ticket -> String.valueOf(ticket.get("id")))
        .filter(ticketId -> ticketId.startsWith("TKT-03"))
        .limit(3)
        .toList();

    return List.of(
        workManagerFeedItem(
            "feed-001",
            "user_request",
            "user",
            "기존 포털 안에 Work Manager 운영 레인 추가 요청",
            "별도 관리자 앱 없이 같은 웹사이트 안에서 Jira 스타일 보드와 오른쪽 운영 패널을 함께 보고 싶다는 요구를 반영했다.",
            now.minusSeconds(60 * 40),
            "wm-seed-01",
            List.of("TKT-031", "TKT-032", "TKT-033", "TKT-034")),
        workManagerFeedItem(
            "feed-002",
            "orchestrator_decision",
            "orchestrator",
            "조회 공개, 실행 액션만 게이트 뒤로 두는 운영 판단",
            "read-only 보드는 공개로 두고, 실제 이동과 command 실행만 비밀번호 게이트와 worker 브리지 뒤로 두기로 정리했다.",
            now.minusSeconds(60 * 28),
            "wm-seed-02",
            List.of("TKT-032", "TKT-033")),
        workManagerFeedItem(
            "feed-003",
            "ticket_issued",
            "worker",
            "활동 로그/대화 피드용 후속 티켓 분리",
            "오른쪽 패널을 placeholder가 아니라 재현 가능한 운영 피드로 만들기 위해 TKT-034를 유지하고 seed feed 구조를 먼저 붙였다.",
            now.minusSeconds(60 * 18),
            "wm-seed-03",
            List.of("TKT-034")),
        workManagerFeedItem(
            "feed-004",
            "review",
            "worker",
            boardReadyForReview ? "TKT-031이 need_review로 이동" : "TKT-031 구현 검토 대기",
            "Work Manager 보드, 티켓 상세 패널, gateway 조회 경로, frontend build 검증까지 반영된 상태다.",
            now.minusSeconds(60 * 10),
            "wm-seed-04",
            List.of("TKT-031")),
        workManagerFeedItem(
            "feed-005",
            "follow_up",
            "worker",
            feedReadyForReview ? "activity feed는 live, command bridge는 후속" : "activity feed를 먼저 붙이고 command bridge를 잇는 순서",
            nextBacklogTickets.isEmpty()
                ? "다음 연결 지점은 command bridge와 command gate다."
                : "다음 연결 지점은 " + String.join(", ", nextBacklogTickets) + " 이다.",
            now.minusSeconds(60 * 3),
            "wm-seed-05",
            nextBacklogTickets));
  }

  private Map<String, Object> workManagerFeedItem(
      String id,
      String type,
      String actor,
      String title,
      String summary,
      Instant timestamp,
      String runId,
      List<String> relatedTickets) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("id", id);
    response.put("type", type);
    response.put("actor", actor);
    response.put("title", title);
    response.put("summary", summary);
    response.put("timestamp", timestamp.toString());
    response.put("runId", runId);
    response.put("relatedTickets", relatedTickets);
    return response;
  }

  private synchronized void recordWorkManagerFeed(
      String type,
      String actor,
      String title,
      String summary,
      List<String> relatedTickets) {
    workManagerDynamicFeed.add(0, workManagerFeedItem(
        "feed-" + UUID.randomUUID().toString().substring(0, 8),
        type,
        actor,
        title,
        summary,
        Instant.now(),
        newWorkManagerFeedRunId(),
        relatedTickets));
    while (workManagerDynamicFeed.size() > WORK_MANAGER_HISTORY_LIMIT) {
      workManagerDynamicFeed.remove(workManagerDynamicFeed.size() - 1);
    }
    persistWorkManagerState();
  }

  private synchronized void recordWorkManagerCommand(WorkManagerCommandRun commandRun) {
    workManagerCommandHistory.add(0, commandRun);
    while (workManagerCommandHistory.size() > WORK_MANAGER_HISTORY_LIMIT) {
      workManagerCommandHistory.remove(workManagerCommandHistory.size() - 1);
    }
    persistWorkManagerState();
  }

  private synchronized List<Map<String, Object>> workManagerCommandHistory() {
    return workManagerCommandHistory.stream()
        .map(WorkManagerCommandRun::toMap)
        .toList();
  }

  private List<Map<String, Object>> workManagerWorkerSummary(Map<String, List<Map<String, Object>>> ticketsByStatus) {
    List<Map<String, Object>> startedTickets = ticketsByStatus.getOrDefault("started", List.of());
    List<Map<String, Object>> reviewTickets = ticketsByStatus.getOrDefault("need_review", List.of());
    return List.of(
        Map.of(
            "workerId", "ion2-worker",
            "status", startedTickets.isEmpty() ? "idle" : "active",
            "currentTicketIds", startedTickets.stream().map(ticket -> String.valueOf(ticket.get("id"))).toList(),
            "focus", startedTickets.isEmpty() ? "Ready pick 대기" : "Started lane ownership"),
        Map.of(
            "workerId", "orchestrator",
            "status", reviewTickets.isEmpty() ? "watching" : "reviewing",
            "currentTicketIds", reviewTickets.stream().map(ticket -> String.valueOf(ticket.get("id"))).limit(4).toList(),
            "focus", "Need Review / release gate"));
  }

  private Map<String, Object> workManagerPriorityPolicy(Map<String, List<Map<String, Object>>> ticketsByStatus) {
    List<Map<String, Object>> candidates = new ArrayList<>();
    candidates.addAll(ticketsByStatus.getOrDefault("backlog", List.of()));
    candidates.sort(Comparator
        .comparing((Map<String, Object> ticket) -> prioritySortValue(String.valueOf(ticket.get("priority"))))
        .thenComparing(ticket -> String.valueOf(ticket.get("id"))));

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("queueSource", "docs/tickets/board.md backlog");
    response.put("executionOwner", "worker");
    response.put("automaticRange", List.of("priority sort hint", "started ownership visibility", "audit logging"));
    response.put("manualRange", List.of("actual worker pickup", "need_review approval", "release gate decision"));
    response.put("nextCandidates", candidates.stream()
        .limit(4)
        .map(ticket -> ticket.get("id") + " " + ticket.get("priority"))
        .toList());
    return response;
  }

  private Map<String, Object> workManagerPersistenceSummary() {
    String lastAuditAt = workManagerAuditLog.isEmpty()
        ? ""
        : String.valueOf(workManagerAuditLog.get(0).getOrDefault("timestamp", ""));
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("mode", workManagerStorePath == null ? "memory-fallback" : "file-backed");
    response.put("filePath", workManagerStorePath == null ? "gateway/data/work-manager-store.json" : normalizeRelativePath(workManagerStorePath));
    response.put("auditEventCount", workManagerAuditLog.size());
    response.put("lastAuditAt", lastAuditAt);
    response.put("targetDatabase", "embedded-h2");
    response.put("targetSchema", List.of(
        "ticket_state_events(ticket_id, from_status, to_status, actor, created_at)",
        "ticket_metadata_changes(ticket_id, priority, target_version, dependencies, created_at)",
        "command_runs(command_id, action, worker_ticket_id, actor, created_at)"));
    return response;
  }

  private synchronized void recordWorkManagerAudit(
      String eventType,
      String actor,
      String ticketId,
      Map<String, Object> payload) {
    Map<String, Object> event = new LinkedHashMap<>();
    event.put("id", "audit-" + UUID.randomUUID().toString().substring(0, 8));
    event.put("type", eventType);
    event.put("actor", actor);
    event.put("ticketId", ticketId);
    event.put("timestamp", Instant.now().toString());
    event.put("payload", payload);
    workManagerAuditLog.add(0, event);
    while (workManagerAuditLog.size() > WORK_MANAGER_FEED_LIMIT) {
      workManagerAuditLog.remove(workManagerAuditLog.size() - 1);
    }
    persistWorkManagerState();
  }

  private Map<String, Object> workManagerActionDescriptor(boolean previewOnly) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("movePreviewOnly", previewOnly);
    response.put("commandBridgeReady", !previewOnly);
    response.put("commandGateReady", !previewOnly);
    response.put("authRequired", true);
    response.put("sessionTtlMinutes", workManagerSessionTtl.toMinutes());
    response.put("tokenHeader", "X-Work-Manager-Token");
    response.put("commandPresets", workManagerPresetResponses());
    response.put("transitionRules", List.of(
        Map.of("from", "backlog", "to", "started", "triggersWorker", true),
        Map.of("from", "started", "to", "need_review", "triggersWorker", false),
        Map.of("from", "need_review", "to", "finished", "triggersWorker", false)));
    return response;
  }

  private List<Map<String, Object>> workManagerPresetResponses() {
    return workManagerPresets().stream()
        .map(WorkManagerPreset::toMap)
        .toList();
  }

  private List<WorkManagerPreset> workManagerPresets() {
    return List.of(
        new WorkManagerPreset(
            "resume_worker",
            "Resume worker sync",
            "Queue a worker-side sync ticket for the selected work item.",
            true,
            "job.work-manager.resume-worker"),
        new WorkManagerPreset(
            "summarize_blockers",
            "Summarize blockers",
            "Queue a worker/orchestrator-side blocker summary run.",
            false,
            "job.work-manager.summarize-blockers"),
        new WorkManagerPreset(
            "prepare_review_handoff",
            "Prepare review handoff",
            "Queue a review handoff helper ticket for the selected work item.",
            true,
            "job.work-manager.prepare-review"));
  }

  private WorkManagerPreset findWorkManagerPreset(String action) {
    return workManagerPresets().stream()
        .filter(preset -> preset.action().equals(action))
        .findFirst()
        .orElse(null);
  }

  private String normalizeRelativePath(Path path) {
    return repoRoot.relativize(path).toString().replace('\\', '/');
  }

  private Path locateRepoRoot() {
    Path current = Path.of("").toAbsolutePath().normalize();
    Path probe = current;
    for (int depth = 0; depth < 6 && probe != null; depth++) {
      if (Files.exists(probe.resolve("docs").resolve("tickets").resolve("board.md"))) {
        return probe;
      }
      probe = probe.getParent();
    }
    return null;
  }

  private synchronized void cleanupExpiredWorkManagerSessions() {
    Instant now = Instant.now();
    workManagerSessions.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
    workManagerAuthAttempts.entrySet().removeIf(entry -> !entry.getValue().isLocked(now) && entry.getValue().failureCount() == 0);
    if (!workManagerGlobalAuthAttempt.isLocked(now) && workManagerGlobalAuthAttempt.failureCount() == 0) {
      workManagerGlobalAuthAttempt = WorkManagerAuthAttempt.unlocked();
    }
  }

  private boolean matchesWorkManagerPassword(String password) {
    if (workManagerPasswordHash.isBlank()) {
      return false;
    }

    byte[] actual = sha256Bytes(password);
    byte[] expected = decodeHexDigest(workManagerPasswordHash);
    if (expected == null) {
      return false;
    }
    return MessageDigest.isEqual(actual, expected);
  }

  private byte[] sha256Bytes(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return digest.digest(value.getBytes(StandardCharsets.UTF_8));
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SHA-256 is unavailable");
    }
  }

  private byte[] decodeHexDigest(String hexDigest) {
    String normalizedHex = normalizeText(hexDigest, "").toLowerCase();
    if (normalizedHex.isBlank() || normalizedHex.length() % 2 != 0) {
      return null;
    }

    byte[] bytes = new byte[normalizedHex.length() / 2];
    for (int index = 0; index < normalizedHex.length(); index += 2) {
      int high = Character.digit(normalizedHex.charAt(index), 16);
      int low = Character.digit(normalizedHex.charAt(index + 1), 16);
      if (high < 0 || low < 0) {
        return null;
      }
      bytes[index / 2] = (byte) ((high << 4) + low);
    }
    return bytes;
  }

  private String cleanBacktickValue(String rawValue) {
    String value = rawValue == null ? "" : rawValue.trim();
    if (value.startsWith("`") && value.endsWith("`") && value.length() >= 2) {
      return value.substring(1, value.length() - 1).trim();
    }
    return value;
  }

  private int prioritySortValue(String priority) {
    if (priority == null || !priority.matches("P[1-5]")) {
      return 9;
    }
    return Integer.parseInt(priority.substring(1));
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> readMapList(Object value) {
    if (!(value instanceof List<?> list)) {
      return List.of();
    }

    List<Map<String, Object>> normalized = new ArrayList<>();
    for (Object item : list) {
      if (item instanceof Map<?, ?> map) {
        normalized.add(new LinkedHashMap<>((Map<String, Object>) map));
      }
    }
    return normalized;
  }

  private List<Map<String, Object>> sanitizePersistedWorkManagerMapList(List<Map<String, Object>> items) {
    List<Map<String, Object>> sanitized = new ArrayList<>();
    for (Map<String, Object> item : items) {
      sanitized.add(scrubSensitiveWorkManagerMap(item));
    }
    return sanitized;
  }

  private List<Map<String, Object>> sanitizePersistedWorkManagerFeed(List<Map<String, Object>> items) {
    List<Map<String, Object>> sanitized = new ArrayList<>();
    for (Map<String, Object> item : items) {
      Map<String, Object> sanitizedItem = scrubSensitiveWorkManagerMap(item);
      String runId = normalizeText(String.valueOf(sanitizedItem.getOrDefault("runId", "")), "");
      if (!runId.startsWith("wm-feed-run-")) {
        sanitizedItem.put("runId", newWorkManagerFeedRunId());
      }
      sanitized.add(sanitizedItem);
    }
    return sanitized;
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> scrubSensitiveWorkManagerMap(Map<String, Object> source) {
    Map<String, Object> sanitized = new LinkedHashMap<>();
    for (Map.Entry<String, Object> entry : source.entrySet()) {
      String key = entry.getKey();
      if (isSensitiveWorkManagerKey(key)) {
        continue;
      }

      Object value = entry.getValue();
      if (value instanceof Map<?, ?> nestedMap) {
        sanitized.put(key, scrubSensitiveWorkManagerMap((Map<String, Object>) nestedMap));
      } else if (value instanceof List<?> nestedList) {
        List<Object> sanitizedList = new ArrayList<>();
        for (Object item : nestedList) {
          if (item instanceof Map<?, ?> nestedItemMap) {
            sanitizedList.add(scrubSensitiveWorkManagerMap((Map<String, Object>) nestedItemMap));
          } else {
            sanitizedList.add(item);
          }
        }
        sanitized.put(key, sanitizedList);
      } else {
        sanitized.put(key, value);
      }
    }
    return sanitized;
  }

  private boolean isSensitiveWorkManagerKey(String key) {
    String normalizedKey = normalizeText(key, "").toLowerCase();
    return normalizedKey.contains("token");
  }

  private String newWorkManagerFeedRunId() {
    return "wm-feed-run-" + UUID.randomUUID().toString().replace("-", "");
  }

  private Map<String, Object> fallbackWorkManagerBoard(String reason) {
    List<Map<String, Object>> backlog = List.of();

    List<Map<String, Object>> started = List.of(
        fallbackWorkTicket("TKT-018", "릴리스 후보 검증과 PR 수용 게이트", "P1", "v0.2.0", "started", "진행 가능"));

    List<Map<String, Object>> needReview = List.of(
        fallbackWorkTicket("TKT-032", "Work Manager 티켓 이동과 command 브리지", "P1", "v0.4.0", "need_review", "진행 가능"),
        fallbackWorkTicket("TKT-033", "command 비밀번호 게이트와 secret 해시 처리", "P1", "v0.4.0", "need_review", "진행 가능"),
        fallbackWorkTicket("TKT-031", "Work Manager 메뉴와 Jira 스타일 티켓 보드", "P1", "v0.4.0", "need_review", "진행 가능"),
        fallbackWorkTicket("TKT-034", "Work Manager 활동 로그와 사용자-AI 대화 피드", "P2", "v0.4.0", "need_review", "진행 가능"),
        fallbackWorkTicket("TKT-011", "엘리베이터 시뮬레이터 통합 프리뷰 연결", "P2", "v0.3.0", "need_review", "진행 가능"));

    List<Map<String, Object>> columns = List.of(
        Map.of("status", "backlog", "label", "Backlog", "tickets", backlog),
        Map.of("status", "started", "label", "Started", "tickets", started),
        Map.of("status", "need_review", "label", "Need Review", "tickets", needReview),
        Map.of("status", "finished", "label", "Finished", "tickets", List.of()));

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("source", "fallback");
    response.put("generatedAt", Instant.now().toString());
    response.put("reason", reason);
    response.put("activityFeed", workManagerActivityFeed(Map.of(
        "backlog", backlog,
        "started", started,
        "need_review", needReview,
        "finished", List.of())));
    response.put("commandHistory", workManagerCommandHistory());
    response.put("columns", columns);
    response.put("workerSummary", workManagerWorkerSummary(Map.of(
        "backlog", backlog,
        "started", started,
        "need_review", needReview,
        "finished", List.of())));
    response.put("priorityPolicy", workManagerPriorityPolicy(Map.of(
        "backlog", backlog,
        "started", started,
        "need_review", needReview,
        "finished", List.of())));
    response.put("persistence", workManagerPersistenceSummary());
    response.put("actions", workManagerActionDescriptor(true));
    return response;
  }

  private Map<String, Object> fallbackWorkTicket(
      String id,
      String title,
      String priority,
      String targetVersion,
      String status,
      String progressDecision) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("id", id);
    response.put("title", title);
    response.put("priority", priority);
    response.put("targetVersion", targetVersion);
    response.put("status", status);
    response.put("progressDecision", progressDecision);
    response.put("path", "");
    response.put("dependencies", "");
    response.put("prPreparationMemo", "");
    response.put("goal", "");
    response.put("workItems", "");
    response.put("scope", "");
    response.put("prerequisites", "");
    response.put("questions", "");
    response.put("reviewMemo", "");
    response.put("notes", "");
    response.put("deliverables", "");
    return response;
  }

  private Map<String, Object> probeService(ServiceDescriptor service) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("serviceId", service.serviceId());
    response.put("name", service.name());
    response.put("routePrefix", service.routePrefix());
    response.put("baseUrl", service.baseUrl());
    response.put("healthUrl", service.healthUrl());
    response.put("node", service.node());
    response.put("loadProfile", service.loadProfile());
    if (service.healthUrl().startsWith("http")) {
      response.put("healthMode", "http");
      response.put("status", probeUrl(service.healthUrl()));
    } else {
      response.put("healthMode", "descriptor");
      response.put("status", "skipped");
    }
    return response;
  }

  private String probeUrl(String url) {
    try {
      HttpRequest request = HttpRequest.newBuilder(URI.create(url))
          .timeout(Duration.ofSeconds(2))
          .GET()
          .build();
      HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
      return response.statusCode() >= 200 && response.statusCode() < 300 ? "ok" : "degraded";
    } catch (Exception ex) {
      return "unavailable";
    }
  }

  private void seedTickets() {
    if (!tickets.isEmpty()) {
      return;
    }

    PlatformTicket first = new PlatformTicket(
        "TKT-BOOT-001",
        "job.platform.healthcheck",
        Map.of("source", "seed"),
        "queued",
        1,
        "codex",
        Instant.now().toString(),
        Instant.now().toString(),
        0,
        3,
        null,
        null,
        "elevator-service",
        "ion2",
        "Confirm gateway and elevator simulator are alive.");
    PlatformTicket second = new PlatformTicket(
        "TKT-BOOT-002",
        "job.elevator.connectivity",
        Map.of("source", "seed"),
        "queued",
        2,
        "codex",
        Instant.now().toString(),
        Instant.now().toString(),
        0,
        3,
        null,
        null,
        "sample-spring-service",
        "ion2",
        "Run the elevator preview smoke loop.");
    tickets.put(first.id(), first);
    tickets.put(second.id(), second);
  }

  private String normalizeText(String value, String fallback) {
    if (value == null || value.isBlank()) {
      return fallback;
    }
    return value.trim();
  }
}

record ServiceDescriptor(
    String serviceId,
    String name,
    String routePrefix,
    String baseUrl,
    String healthUrl,
    String description,
    String node,
    String loadProfile) {}

record TicketCreateRequest(
    String type,
    Map<String, Object> payload,
    Integer priority,
    String requestedBy,
    String serviceId,
    String targetNode,
    String summary) {}

record TicketCompleteRequest(Object result) {}

record TicketFailRequest(String error) {}

record TicketWaitingRequest(Object result, String error) {}

record WorkManagerAuthRequest(String password) {}

record WorkManagerTransitionRequest(String targetStatus, String note) {}

record WorkManagerMetadataUpdateRequest(String targetVersion, String priority, String dependencies) {}

record WorkManagerCommandRequest(String action, String note, String relatedTicketId) {}

record WorkManagerSession(String token, String actor, String remoteAddress, Instant expiresAt) {
  boolean isExpired(Instant now) {
    return expiresAt.isBefore(now);
  }
}

record WorkManagerAuthAttempt(int failureCount, Instant lockedUntil) {
  static WorkManagerAuthAttempt unlocked() {
    return new WorkManagerAuthAttempt(0, Instant.EPOCH);
  }

  boolean isLocked(Instant now) {
    return lockedUntil != null && lockedUntil.isAfter(now);
  }

  WorkManagerAuthAttempt registerFailure(Instant now, int maxFailedAttempts, Duration lockDuration) {
    int nextFailureCount = failureCount + 1;
    if (nextFailureCount >= maxFailedAttempts) {
      return new WorkManagerAuthAttempt(0, now.plus(lockDuration));
    }
    return new WorkManagerAuthAttempt(nextFailureCount, Instant.EPOCH);
  }
}

record WorkManagerPreset(
    String action,
    String label,
    String description,
    boolean requiresTicket,
    String ticketType) {
  String summary(String relatedTicketId) {
    if (requiresTicket && relatedTicketId != null && !relatedTicketId.isBlank()) {
      return label + " for " + relatedTicketId;
    }
    return label;
  }

  Map<String, Object> toMap() {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("action", action);
    response.put("label", label);
    response.put("description", description);
    response.put("requiresTicket", requiresTicket);
    return response;
  }
}

record WorkManagerCommandRun(
    String id,
    String action,
    String label,
    String note,
    String status,
    String requestedBy,
    String requestedAt,
    String relatedTicketId,
    String workerTicketId,
    String message) {
  Map<String, Object> toMap() {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("id", id);
    response.put("action", action);
    response.put("label", label);
    response.put("note", note);
    response.put("status", status);
    response.put("requestedBy", requestedBy);
    response.put("requestedAt", requestedAt);
    response.put("relatedTicketId", relatedTicketId);
    response.put("workerTicketId", workerTicketId);
    response.put("message", message);
    return response;
  }
}

record PlatformTicket(
    String id,
    String type,
    Map<String, Object> payload,
    String status,
    int priority,
    String requestedBy,
    String createdAt,
    String updatedAt,
    int attempts,
    int maxAttempts,
    Object result,
    String error,
    String serviceId,
    String targetNode,
    String summary) {
  PlatformTicket withStatus(String status) {
    return new PlatformTicket(id, type, payload, status, priority, requestedBy, createdAt, Instant.now().toString(), attempts, maxAttempts, result, error, serviceId, targetNode, summary);
  }

  PlatformTicket withAttempts(int attempts) {
    return new PlatformTicket(id, type, payload, status, priority, requestedBy, createdAt, Instant.now().toString(), attempts, maxAttempts, result, error, serviceId, targetNode, summary);
  }

  PlatformTicket withResult(Object result) {
    return new PlatformTicket(id, type, payload, status, priority, requestedBy, createdAt, Instant.now().toString(), attempts, maxAttempts, result, error, serviceId, targetNode, summary);
  }

  PlatformTicket withError(String error) {
    return new PlatformTicket(id, type, payload, status, priority, requestedBy, createdAt, Instant.now().toString(), attempts, maxAttempts, result, error, serviceId, targetNode, summary);
  }
}
