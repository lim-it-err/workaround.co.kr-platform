package com.workaround.platform.gateway;

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

import jakarta.servlet.http.HttpServletRequest;

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
class PlatformApiController {
  private final PlatformStore store;
  private final String platformApiKey;
  private final String ollamaBaseUrl;

  PlatformApiController(
      @Value("${app.platform.api-key:dev-key}") String platformApiKey,
      @Value("${app.ollama.base-url:}") String ollamaBaseUrl,
      @Value("${app.platform.elevator-service-url:http://localhost:8003}") String elevatorServiceUrl,
      @Value("${app.platform.sample-spring-service-url:http://localhost:8002}") String sampleSpringServiceUrl) {
    this.platformApiKey = platformApiKey;
    this.ollamaBaseUrl = ollamaBaseUrl;
    this.store = new PlatformStore(elevatorServiceUrl, sampleSpringServiceUrl);
  }

  @GetMapping("/health")
  Map<String, Object> health() {
    return store.healthSnapshot(ollamaBaseUrl);
  }

  @GetMapping("/services")
  Map<String, Object> services() {
    return Map.of("services", store.services());
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

  private void requireApiKey(String requestKey) {
    if (!Objects.equals(platformApiKey, requestKey)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid X-Platform-Key");
    }
  }
}

final class PlatformStore {
  private final ConcurrentHashMap<String, PlatformTicket> tickets = new ConcurrentHashMap<>();
  private final List<ServiceDescriptor> services = new ArrayList<>();
  private final HttpClient client = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(2))
      .build();

  PlatformStore(String elevatorServiceUrl, String sampleSpringServiceUrl) {
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
  }

  List<ServiceDescriptor> services() {
    return List.copyOf(services);
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
    TicketCreateRequest safeRequest = request == null ? new TicketCreateRequest(null, null, null, null, null, null, null) : request;
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
    if (!ticket.status().equals("queued") && !ticket.status().equals("retrying")) {
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
        "completed", tickets.values().stream().filter(ticket -> "completed".equals(ticket.status())).count()));
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
