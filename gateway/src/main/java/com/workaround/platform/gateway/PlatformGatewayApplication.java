package com.workaround.platform.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
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
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@SpringBootApplication
public class PlatformGatewayApplication {
  public static void main(String[] args) {
    SpringApplication.run(PlatformGatewayApplication.class, args);
  }
}

@RestController
@RequestMapping("/api")
class PlatformController {
  private final PlatformStore store;
  private final String platformApiKey;
  private final String ollamaBaseUrl;

  PlatformController(
      @Value("${platform.api-key:dev-platform-key}") String platformApiKey,
      @Value("${platform.ollama-base-url:}") String ollamaBaseUrl,
      @Value("${platform.sample-python-service-url:http://localhost:8001}") String samplePythonServiceUrl,
      @Value("${platform.sample-spring-service-url:http://localhost:8002}") String sampleSpringServiceUrl) {
    this.platformApiKey = platformApiKey;
    this.ollamaBaseUrl = ollamaBaseUrl;
    this.store = new PlatformStore(samplePythonServiceUrl, sampleSpringServiceUrl);
  }

  @GetMapping("/health")
  Map<String, Object> health() {
    return store.healthSnapshot(ollamaBaseUrl);
  }

  @GetMapping("/services")
  Map<String, Object> services() {
    return Map.of("services", store.services());
  }

  @GetMapping("/tickets")
  Map<String, Object> tickets() {
    return Map.of("tickets", store.tickets());
  }

  @GetMapping("/tickets/{ticketId}")
  Ticket ticket(@PathVariable String ticketId) {
    return store.ticket(ticketId);
  }

  @PostMapping("/tickets")
  ResponseEntity<Ticket> createTicket(
      @RequestHeader(value = "X-Platform-Key", required = false) String requestKey,
      @RequestBody TicketRequest request) {
    requireApiKey(requestKey);
    return ResponseEntity.status(HttpStatus.CREATED).body(store.createTicket(request));
  }

  @PostMapping("/tickets/{ticketId}/claim")
  Ticket claimTicket(
      @RequestHeader(value = "X-Platform-Key", required = false) String requestKey,
      @PathVariable String ticketId) {
    requireApiKey(requestKey);
    return store.claimTicket(ticketId);
  }

  @PostMapping("/tickets/{ticketId}/complete")
  Ticket completeTicket(
      @RequestHeader(value = "X-Platform-Key", required = false) String requestKey,
      @PathVariable String ticketId,
      @RequestBody(required = false) TicketCompletionRequest request) {
    requireApiKey(requestKey);
    return store.completeTicket(ticketId, request == null ? null : request.result());
  }

  @PostMapping("/tickets/{ticketId}/fail")
  Ticket failTicket(
      @RequestHeader(value = "X-Platform-Key", required = false) String requestKey,
      @PathVariable String ticketId,
      @RequestBody(required = false) TicketFailureRequest request) {
    requireApiKey(requestKey);
    return store.failTicket(ticketId, request == null ? null : request.error());
  }

  private void requireApiKey(String requestKey) {
    if (!Objects.equals(platformApiKey, requestKey)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid X-Platform-Key");
    }
  }
}

final class PlatformStore {
  static final PlatformStore INSTANCE = new PlatformStore(
      "http://localhost:8001",
      "http://localhost:8002");

  private final ConcurrentHashMap<String, Ticket> ticketStore = new ConcurrentHashMap<>();
  private final List<ServiceDescriptor> services = new ArrayList<>();
  private final HttpClient client = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(2))
      .build();

  PlatformStore(String samplePythonServiceUrl, String sampleSpringServiceUrl) {
    services.add(new ServiceDescriptor(
        "sample-python-service",
        "Sample Python Service",
        "/api/services/sample-python-service",
        samplePythonServiceUrl,
        samplePythonServiceUrl + "/health",
        "Independently dockerized Python service used to prove the platform can host non-Java services.",
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
  }

  List<ServiceDescriptor> services() {
    return List.copyOf(services);
  }

  List<Ticket> tickets() {
    return ticketStore.values().stream()
        .sorted(Comparator.comparing(Ticket::createdAt).reversed())
        .toList();
  }

  Ticket ticket(String ticketId) {
    Ticket ticket = ticketStore.get(ticketId);
    if (ticket == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found");
    }
    return ticket;
  }

  synchronized Ticket createTicket(TicketRequest request) {
    String type = normalizeText(request.type(), "job.platform.dev-ticket");
    String requestedBy = normalizeText(request.requestedBy(), "frontend");
    String targetNode = normalizeText(request.targetNode(), "ion2");
    String serviceId = normalizeText(request.serviceId(), "sample-python-service");
    String summary = normalizeText(request.summary(), type);
    int priority = request.priority() == null ? 5 : request.priority();
    Map<String, Object> payload = request.payload() == null ? Map.of() : new LinkedHashMap<>(request.payload());

    Ticket ticket = new Ticket(
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
    ticketStore.put(ticket.id(), ticket);
    return ticket;
  }

  synchronized Ticket claimTicket(String ticketId) {
    Ticket ticket = ticket(ticketId);
    if (!ticket.status().equals("queued") && !ticket.status().equals("retrying")) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket is not claimable");
    }
    Ticket updated = ticket.withStatus("running").withAttempts(ticket.attempts() + 1);
    ticketStore.put(ticketId, updated);
    return updated;
  }

  synchronized Ticket completeTicket(String ticketId, Object result) {
    Ticket ticket = ticket(ticketId);
    Ticket updated = ticket.withStatus("completed").withResult(result).withError(null);
    ticketStore.put(ticketId, updated);
    return updated;
  }

  synchronized Ticket failTicket(String ticketId, String error) {
    Ticket ticket = ticket(ticketId);
    String nextStatus = ticket.attempts() + 1 >= ticket.maxAttempts() ? "failed" : "retrying";
    Ticket updated = ticket.withStatus(nextStatus).withError(normalizeText(error, "worker execution failed"));
    ticketStore.put(ticketId, updated);
    return updated;
  }

  Map<String, Object> healthSnapshot(String ollamaBaseUrl) {
    List<Map<String, Object>> serviceHealth = services.stream()
        .map(this::probeService)
        .toList();

    String ollamaStatus = ollamaBaseUrl == null || ollamaBaseUrl.isBlank()
        ? "unavailable"
        : probeUrl(ollamaBaseUrl + "/api/tags");

    String overallStatus = serviceHealth.stream().allMatch(entry -> "ok".equals(entry.get("status")))
        && !"unavailable".equals(ollamaStatus)
        ? "ok"
        : "degraded";

    Map<String, Object> components = new LinkedHashMap<>();
    components.put("gateway", "ok");
    components.put("redis", "planned");
    components.put("worker", ticketStore.values().stream().anyMatch(ticket -> "running".equals(ticket.status())) ? "active" : "idle");
    components.put("ollama", ollamaStatus);

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("status", overallStatus);
    response.put("timestamp", Instant.now().toString());
    response.put("components", components);
    response.put("services", serviceHealth);
    response.put("tickets", Map.of(
        "queued", ticketStore.values().stream().filter(ticket -> "queued".equals(ticket.status())).count(),
        "running", ticketStore.values().stream().filter(ticket -> "running".equals(ticket.status())).count(),
        "completed", ticketStore.values().stream().filter(ticket -> "completed".equals(ticket.status())).count()));
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
    response.put("status", probeUrl(service.healthUrl()));
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
    if (!ticketStore.isEmpty()) {
      return;
    }

    Ticket first = new Ticket(
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
        "sample-python-service",
        "ion2",
        "Confirm gateway and sample services are alive.");
    Ticket second = new Ticket(
        "TKT-BOOT-002",
        "job.sample.connectivity",
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
        "Run the sample service smoke loop.");
    ticketStore.put(first.id(), first);
    ticketStore.put(second.id(), second);
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

record TicketRequest(
    String type,
    Map<String, Object> payload,
    Integer priority,
    String requestedBy,
    String serviceId,
    String targetNode,
    String summary) {}

record TicketCompletionRequest(Object result) {}

record TicketFailureRequest(String error) {}

record Ticket(
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
  Ticket withStatus(String status) {
    return new Ticket(id, type, payload, status, priority, requestedBy, createdAt, Instant.now().toString(), attempts, maxAttempts, result, error, serviceId, targetNode, summary);
  }

  Ticket withAttempts(int attempts) {
    return new Ticket(id, type, payload, status, priority, requestedBy, createdAt, Instant.now().toString(), attempts, maxAttempts, result, error, serviceId, targetNode, summary);
  }

  Ticket withResult(Object result) {
    return new Ticket(id, type, payload, status, priority, requestedBy, createdAt, Instant.now().toString(), attempts, maxAttempts, result, error, serviceId, targetNode, summary);
  }

  Ticket withError(String error) {
    return new Ticket(id, type, payload, status, priority, requestedBy, createdAt, Instant.now().toString(), attempts, maxAttempts, result, error, serviceId, targetNode, summary);
  }
}
