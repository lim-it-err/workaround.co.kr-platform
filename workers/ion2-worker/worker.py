import json
import os
import time
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class WorkerConfig:
    gateway_base_url: str = os.getenv("GATEWAY_BASE_URL", "http://localhost:8080")
    platform_api_key: str = os.getenv("PLATFORM_API_KEY", "dev-platform-key")
    sample_python_service_url: str = os.getenv("SAMPLE_PYTHON_SERVICE_URL", "http://localhost:8001")
    sample_spring_service_url: str = os.getenv("SAMPLE_SPRING_SERVICE_URL", "http://localhost:8002")
    poll_interval_seconds: int = int(os.getenv("WORKER_POLL_INTERVAL_SECONDS", "5"))
    once: bool = os.getenv("WORKER_ONCE", "false").lower() in {"1", "true", "yes", "on"}


class WorkerClient:
    def __init__(self, config: WorkerConfig):
        self.config = config

    def request_json(self, method, url, body=None, require_key=True):
        headers = {"Content-Type": "application/json"}
        if require_key:
            headers["X-Platform-Key"] = self.config.platform_api_key
        data = None if body is None else json.dumps(body).encode("utf-8")
        request = urllib.request.Request(url, data=data, method=method, headers=headers)
        with urllib.request.urlopen(request, timeout=5) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload) if payload else None

    def get_json(self, url, require_key=False):
        request = urllib.request.Request(url, method="GET")
        if require_key:
            request.add_header("X-Platform-Key", self.config.platform_api_key)
        with urllib.request.urlopen(request, timeout=5) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload) if payload else None

    def list_tickets(self):
        payload = self.get_json(f"{self.config.gateway_base_url}/api/tickets")
        return payload.get("tickets", []) if isinstance(payload, dict) else []

    def list_services(self):
        payload = self.get_json(f"{self.config.gateway_base_url}/api/services")
        return payload.get("services", []) if isinstance(payload, dict) else []

    def claim_ticket(self, ticket_id):
        return self.request_json("POST", f"{self.config.gateway_base_url}/api/tickets/{ticket_id}/claim")

    def complete_ticket(self, ticket_id, result):
        return self.request_json(
            "POST",
            f"{self.config.gateway_base_url}/api/tickets/{ticket_id}/complete",
            {"result": result},
        )

    def fail_ticket(self, ticket_id, error):
        return self.request_json(
            "POST",
            f"{self.config.gateway_base_url}/api/tickets/{ticket_id}/fail",
            {"error": error},
        )

    def probe_service(self, service):
        health_url = service.get("healthUrl") or service.get("baseUrl")
        if not health_url or not health_url.startswith("http"):
            return {
                "serviceId": service.get("serviceId"),
                "status": "skipped",
                "detail": "non-http service descriptor",
            }

        try:
            payload = self.get_json(health_url)
            return {
                "serviceId": service.get("serviceId"),
                "status": payload.get("status", "ok") if isinstance(payload, dict) else "ok",
                "detail": payload,
            }
        except Exception as exc:
            return {
                "serviceId": service.get("serviceId"),
                "status": "unavailable",
                "detail": str(exc),
            }

    def run_ticket(self, ticket):
        ticket_id = ticket["id"]
        claimed = self.claim_ticket(ticket_id)
        services = self.list_services()
        probes = [self.probe_service(service) for service in services if service.get("serviceId") != "ion2-worker"]
        failing = [probe for probe in probes if probe.get("status") not in {"ok", "skipped"}]

        result = {
            "executedAt": datetime.now(timezone.utc).isoformat(),
            "ticketType": ticket.get("type"),
            "ticketId": ticket_id,
            "claimedStatus": claimed.get("status") if isinstance(claimed, dict) else "running",
            "servicesChecked": probes,
        }

        if failing:
            error_message = "; ".join(f"{probe.get('serviceId')}: {probe.get('status')}" for probe in failing)
            self.fail_ticket(ticket_id, error_message)
            return {"ticketId": ticket_id, "status": "retrying", "error": error_message}

        completed = self.complete_ticket(ticket_id, result)
        return {
            "ticketId": ticket_id,
            "status": completed.get("status") if isinstance(completed, dict) else "completed",
            "result": result,
        }

    def run_once(self):
        queued = [ticket for ticket in self.list_tickets() if ticket.get("status") == "queued"]
        summaries = []
        for ticket in queued:
            summaries.append(self.run_ticket(ticket))
        return summaries

    def run_forever(self):
        while True:
            summaries = self.run_once()
            if summaries:
                print(json.dumps(summaries, indent=2, ensure_ascii=False))
            if self.config.once:
                return summaries
            time.sleep(self.config.poll_interval_seconds)


def main():
    config = WorkerConfig()
    client = WorkerClient(config)
    try:
        client.run_forever()
    except KeyboardInterrupt:
        print("worker stopped")


if __name__ == "__main__":
    main()
