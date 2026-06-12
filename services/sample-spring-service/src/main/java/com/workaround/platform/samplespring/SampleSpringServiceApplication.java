package com.workaround.platform.samplespring;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@SpringBootApplication
public class SampleSpringServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(SampleSpringServiceApplication.class, args);
  }
}

@RestController
@RequestMapping
class SampleSpringController {
  private final String serviceName;

  SampleSpringController(@Value("${service.name:sample-spring-service}") String serviceName) {
    this.serviceName = serviceName;
  }

  @GetMapping("/health")
  Map<String, Object> health() {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("status", "ok");
    response.put("service", serviceName);
    response.put("timestamp", Instant.now().toString());
    return response;
  }

  @GetMapping("/api/ping")
  Map<String, Object> ping() {
    return Map.of(
        "message", "spring sample is ready",
        "service", serviceName);
  }

  @GetMapping("/api/echo")
  Map<String, Object> echo(@RequestParam(defaultValue = "hello") String message) {
    return Map.of(
        "message", message,
        "service", serviceName);
  }
}
