import json
import time
import urllib.parse
import urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread

ROOT_DIR = Path(__file__).resolve().parents[2]
import sys

sys.path.insert(0, str(ROOT_DIR / "workers" / "ion2-worker"))

from worker import WorkerClient, WorkerConfig


class JsonHandler(BaseHTTPRequestHandler):
    routes = {}

    def do_GET(self):
        route = self.routes.get(self.path)
        if route is None:
            self.send_response(404)
            self.end_headers()
            return

        status, payload, delay_seconds = route
        if delay_seconds:
            time.sleep(delay_seconds)

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        try:
            self.wfile.write(json.dumps(payload).encode("utf-8"))
        except OSError:
            return

    def log_message(self, format, *args):
        return


def start_json_server(routes):
    handler = type("DynamicJsonHandler", (JsonHandler,), {"routes": routes})
    server = HTTPServer(("127.0.0.1", 0), handler)
    Thread(target=server.serve_forever, daemon=True).start()
    return server


class FakeGatewayHandler(BaseHTTPRequestHandler):
    store = None

    def do_GET(self):
        if self.path == "/api/tickets":
            return self.write_json({"tickets": list(self.store["tickets"].values())})
        if self.path == "/api/services":
            return self.write_json({"services": self.store["services"]})
        if self.path.startswith("/api/tickets/"):
            ticket_id = self.path.rsplit("/", 1)[-1]
            return self.write_json(self.store["tickets"][ticket_id])
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        ticket_id, action = self.parse_ticket_action()
        if ticket_id is None:
            self.send_response(404)
            self.end_headers()
            return

        body = self.read_json_body()
        ticket = self.store["tickets"][ticket_id]

        if action == "claim":
            ticket["status"] = "running"
            ticket["attempts"] += 1
        elif action == "complete":
            ticket["status"] = "completed"
            ticket["result"] = body.get("result")
            ticket["error"] = None
        elif action == "fail":
            ticket["status"] = "retrying"
            ticket["error"] = body.get("error")
        elif action == "waiting-llm":
            ticket["status"] = "waiting_llm"
            ticket["result"] = body.get("result")
            ticket["error"] = body.get("error")
        else:
            self.send_response(404)
            self.end_headers()
            return

        self.write_json(ticket)

    def parse_ticket_action(self):
        parsed = urllib.parse.urlparse(self.path)
        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) != 4 or parts[0] != "api" or parts[1] != "tickets":
            return (None, None)
        return (parts[2], parts[3])

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def write_json(self, payload, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def log_message(self, format, *args):
        return


def start_gateway_server(store):
    handler = type("BoundGatewayHandler", (FakeGatewayHandler,), {"store": store})
    server = HTTPServer(("127.0.0.1", 0), handler)
    Thread(target=server.serve_forever, daemon=True).start()
    return server


class ConnectionFailedWorkerClient(WorkerClient):
    def get_json(self, url, require_key=False, timeout=5):
        raise urllib.error.URLError(ConnectionRefusedError("connection refused"))


def build_probe_summary(ok_server, error_server, slow_server):
    return {
        "ok": WorkerClient(
            WorkerConfig(
                ollama_base_url=f"http://127.0.0.1:{ok_server.server_port}",
                ollama_timeout_seconds=1,
            )
        ).probe_ollama(),
        "response_error": WorkerClient(
            WorkerConfig(
                ollama_base_url=f"http://127.0.0.1:{error_server.server_port}",
                ollama_timeout_seconds=1,
            )
        ).probe_ollama(),
        "timeout": WorkerClient(
            WorkerConfig(
                ollama_base_url=f"http://127.0.0.1:{slow_server.server_port}",
                ollama_timeout_seconds=0.1,
            )
        ).probe_ollama(),
        "unavailable": ConnectionFailedWorkerClient(
            WorkerConfig(
                ollama_base_url="http://127.0.0.1:65535",
                ollama_timeout_seconds=0.1,
            )
        ).probe_ollama(),
    }


def main():
    elevator_server = start_json_server({"/health": (200, {"status": "ok", "service": "elevator-service"}, 0)})
    sample_server = start_json_server({"/health": (200, {"status": "ok", "service": "sample-spring-service"}, 0)})
    ok_ollama_server = start_json_server({"/api/tags": (200, {"models": [{"name": "qwen2.5-coder:7b"}]}, 0)})
    error_ollama_server = start_json_server({"/api/tags": (503, {"error": "warming up"}, 0)})
    slow_ollama_server = start_json_server({"/api/tags": (200, {"models": []}, 0.3)})

    gateway_store = {
        "services": [
            {
                "serviceId": "elevator-service",
                "healthUrl": f"http://127.0.0.1:{elevator_server.server_port}/health",
                "baseUrl": f"http://127.0.0.1:{elevator_server.server_port}",
            },
            {
                "serviceId": "sample-spring-service",
                "healthUrl": f"http://127.0.0.1:{sample_server.server_port}/health",
                "baseUrl": f"http://127.0.0.1:{sample_server.server_port}",
            },
        ],
        "tickets": {
            "GW-TKT-001": {
                "id": "GW-TKT-001",
                "type": "job.platform.healthcheck",
                "payload": {"source": "smoke"},
                "status": "queued",
                "priority": 1,
                "requestedBy": "smoke",
                "attempts": 0,
                "maxAttempts": 3,
                "result": None,
                "error": None,
                "serviceId": "elevator-service",
                "targetNode": "ion2",
                "summary": "non llm ticket",
            },
            "GW-TKT-002": {
                "id": "GW-TKT-002",
                "type": "job.llm.summary",
                "payload": {"requiresLlm": True, "prompt": "Summarize system health"},
                "status": "queued",
                "priority": 1,
                "requestedBy": "smoke",
                "attempts": 0,
                "maxAttempts": 3,
                "result": None,
                "error": None,
                "serviceId": "elevator-service",
                "targetNode": "rtx5070",
                "summary": "llm ticket",
            },
        },
    }
    gateway_server = start_gateway_server(gateway_store)
    try:
        worker = WorkerClient(
            WorkerConfig(
                gateway_base_url=f"http://127.0.0.1:{gateway_server.server_port}",
                elevator_service_url=f"http://127.0.0.1:{elevator_server.server_port}",
                sample_spring_service_url=f"http://127.0.0.1:{sample_server.server_port}",
                ollama_base_url="http://127.0.0.1:9",
                ollama_timeout_seconds=0.1,
                ollama_retry_after_seconds=15,
            )
        )
        summaries = worker.run_gateway_once()

        llm_ticket = gateway_store["tickets"]["GW-TKT-002"]
        non_llm_ticket = gateway_store["tickets"]["GW-TKT-001"]
        if llm_ticket["status"] != "waiting_llm":
            raise RuntimeError("expected GW-TKT-002 to move into waiting_llm")
        if non_llm_ticket["status"] != "completed":
            raise RuntimeError("expected GW-TKT-001 to complete while Ollama is unavailable")

        print(
            json.dumps(
                {
                    "ollamaProbes": build_probe_summary(ok_ollama_server, error_ollama_server, slow_ollama_server),
                    "gatewayRun": summaries,
                    "tickets": gateway_store["tickets"],
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    finally:
        gateway_server.shutdown()
        elevator_server.shutdown()
        sample_server.shutdown()
        ok_ollama_server.shutdown()
        error_ollama_server.shutdown()
        slow_ollama_server.shutdown()


if __name__ == "__main__":
    main()
