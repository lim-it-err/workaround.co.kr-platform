package com.workaround.platform.gateway;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PlatformGatewayAdvisorTest {

  private HttpServer downstream;

  @AfterEach
  void stopDownstream() {
    if (downstream != null) {
      downstream.stop(0);
    }
  }

  @Test
  void healthSnapshotIncludesAdvisorContractAndLiveStatus() throws IOException {
    String downstreamBaseUrl = startHealthyDownstream();
    PlatformStore store = new PlatformStore(
        downstreamBaseUrl,
        downstreamBaseUrl,
        downstreamBaseUrl,
        "unused",
        30,
        5,
        5,
        null);

    Map<String, Object> snapshot = store.healthSnapshot("");
    @SuppressWarnings("unchecked")
    List<Map<String, Object>> services = (List<Map<String, Object>>) snapshot.get("services");

    assertThat(services)
        .anySatisfy(service -> {
          assertThat(service.get("serviceId")).isEqualTo("advisor");
          assertThat(service.get("routePrefix")).isEqualTo("/api/services/advisor");
          assertThat(service.get("healthUrl")).isEqualTo(downstreamBaseUrl + "/health");
          assertThat(service.get("status")).isEqualTo("ok");
        });
  }

  private String startHealthyDownstream() throws IOException {
    downstream = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    downstream.createContext("/health", exchange -> {
      byte[] body = "{\"status\":\"ok\"}".getBytes(StandardCharsets.UTF_8);
      exchange.getResponseHeaders().set("Content-Type", "application/json");
      exchange.sendResponseHeaders(200, body.length);
      exchange.getResponseBody().write(body);
      exchange.close();
    });
    downstream.start();
    return "http://127.0.0.1:" + downstream.getAddress().getPort();
  }
}
