import json
import os
import socket
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urljoin

from redis_stream import RedisStreamClient


@dataclass
class WorkerConfig:
    gateway_base_url: str = os.getenv("GATEWAY_BASE_URL", "http://localhost:8080")
    platform_api_key: str = os.getenv("PLATFORM_API_KEY", "dev-key")
    elevator_service_url: str = os.getenv("ELEVATOR_SERVICE_URL", "http://localhost:8003")
    sample_spring_service_url: str = os.getenv("SAMPLE_SPRING_SERVICE_URL", "http://localhost:8002")
    poll_interval_seconds: int = int(os.getenv("WORKER_POLL_INTERVAL_SECONDS", "5"))
    once: bool = os.getenv("WORKER_ONCE", "false").lower() in {"1", "true", "yes", "on"}
    runtime_mode: str = os.getenv("WORKER_RUNTIME_MODE", "gateway-polling")
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_database: int = int(os.getenv("REDIS_DATABASE", "0"))
    redis_stream_key: str = os.getenv("REDIS_STREAM_KEY", "platform:tickets")
    redis_results_stream_key: str = os.getenv("REDIS_RESULTS_STREAM_KEY", "platform:tickets:results")
    redis_consumer_group: str = os.getenv("REDIS_CONSUMER_GROUP", "platform-workers")
    redis_consumer_name: str = os.getenv("REDIS_CONSUMER_NAME", "ion2-worker")
    redis_read_block_ms: int = int(os.getenv("REDIS_READ_BLOCK_MS", "1000"))
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "")
    ollama_health_path: str = os.getenv("OLLAMA_HEALTH_PATH", "/api/tags")
    ollama_timeout_seconds: float = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "2"))
    ollama_retry_after_seconds: int = int(os.getenv("OLLAMA_RETRY_AFTER_SECONDS", "30"))


class WorkerClient:
    def __init__(self, config: WorkerConfig):
        self.config = config

    def request_json(self, method, url, body=None, require_key=True, timeout=5):
        headers = {"Content-Type": "application/json"}
        if require_key:
            headers["X-Platform-Key"] = self.config.platform_api_key
        data = None if body is None else json.dumps(body).encode("utf-8")
        request = urllib.request.Request(url, data=data, method=method, headers=headers)
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload) if payload else None

    def get_json(self, url, require_key=False, timeout=5):
        request = urllib.request.Request(url, method="GET")
        if require_key:
            request.add_header("X-Platform-Key", self.config.platform_api_key)
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload) if payload else None

    def list_tickets(self):
        payload = self.get_json(f"{self.config.gateway_base_url}/api/tickets")
        return payload.get("tickets", []) if isinstance(payload, dict) else []

    def list_services(self):
        payload = self.get_json(f"{self.config.gateway_base_url}/api/services")
        return payload.get("services", []) if isinstance(payload, dict) else []

    def stream_services(self):
        return [
            {
                "serviceId": "elevator-service",
                "healthUrl": f"{self.config.elevator_service_url}/health",
            },
            {
                "serviceId": "sample-spring-service",
                "healthUrl": f"{self.config.sample_spring_service_url}/health",
            },
            {
                "serviceId": "gateway",
                "healthUrl": f"{self.config.gateway_base_url}/api/health",
            },
        ]

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

    def mark_ticket_waiting_llm(self, ticket_id, result, error):
        return self.request_json(
            "POST",
            f"{self.config.gateway_base_url}/api/tickets/{ticket_id}/waiting-llm",
            {"result": result, "error": error},
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

    def build_result(self, ticket, claimed_status, probes, ollama=None):
        return {
            "executedAt": datetime.now(timezone.utc).isoformat(),
            "ticketType": ticket.get("type"),
            "ticketId": ticket.get("id"),
            "runtimeMode": self.config.runtime_mode,
            "claimedStatus": claimed_status,
            "servicesChecked": probes,
            "ollama": ollama,
        }

    def probe_ollama(self):
        base_url = (self.config.ollama_base_url or "").strip()
        if not base_url:
            return {
                "status": "unavailable",
                "category": "config_missing",
                "detail": "OLLAMA_BASE_URL is not configured",
            }

        health_url = urljoin(base_url.rstrip("/") + "/", self.config.ollama_health_path.lstrip("/"))
        try:
            payload = self.get_json(health_url, timeout=self.config.ollama_timeout_seconds)
            models = payload.get("models", []) if isinstance(payload, dict) else []
            return {
                "status": "ok",
                "category": "ok",
                "detail": payload,
                "healthUrl": health_url,
                "modelCount": len(models),
            }
        except urllib.error.HTTPError as exc:
            return {
                "status": "degraded",
                "category": "response_error",
                "detail": f"{exc.code} {exc.reason}",
                "healthUrl": health_url,
                "httpStatus": exc.code,
            }
        except urllib.error.URLError as exc:
            reason = getattr(exc, "reason", exc)
            if isinstance(reason, (socket.timeout, TimeoutError)):
                return {
                    "status": "degraded",
                    "category": "timeout",
                    "detail": str(reason),
                    "healthUrl": health_url,
                }
            return {
                "status": "unavailable",
                "category": "connection_failed",
                "detail": str(reason),
                "healthUrl": health_url,
            }
        except (socket.timeout, TimeoutError) as exc:
            return {
                "status": "degraded",
                "category": "timeout",
                "detail": str(exc),
                "healthUrl": health_url,
            }
        except Exception as exc:
            return {
                "status": "degraded",
                "category": "unexpected_error",
                "detail": str(exc),
                "healthUrl": health_url,
            }

    def ticket_requires_llm(self, ticket):
        payload = ticket.get("payload") if isinstance(ticket.get("payload"), dict) else {}
        ticket_type = str(ticket.get("type", ""))
        return (
            bool(ticket.get("requiresLlm"))
            or bool(payload.get("requiresLlm"))
            or ticket_type.startswith("job.llm.")
            or payload.get("inferenceProvider") == "ollama"
            or payload.get("targetRuntime") == "ollama"
        )

    def ticket_ready_for_waiting_retry(self, ticket):
        result = ticket.get("result") if isinstance(ticket.get("result"), dict) else {}
        retry_not_before = result.get("retryNotBefore")
        if not retry_not_before:
            return True

        try:
            scheduled = datetime.fromisoformat(retry_not_before.replace("Z", "+00:00"))
            return datetime.now(timezone.utc) >= scheduled
        except ValueError:
            return True

    def build_waiting_llm_result(self, ticket, ollama_probe):
        retry_after = max(1, self.config.ollama_retry_after_seconds)
        retry_not_before = datetime.fromtimestamp(
            time.time() + retry_after,
            tz=timezone.utc,
        ).isoformat()
        return {
            "executedAt": datetime.now(timezone.utc).isoformat(),
            "ticketType": ticket.get("type"),
            "ticketId": ticket.get("id"),
            "runtimeMode": self.config.runtime_mode,
            "requiredRuntime": "ollama",
            "retryAfterSeconds": retry_after,
            "retryNotBefore": retry_not_before,
            "ollama": ollama_probe,
        }

    def waiting_llm_error(self, ollama_probe):
        return f"ollama {ollama_probe.get('category', ollama_probe.get('status', 'unavailable'))}"

    def run_ticket(self, ticket):
        ticket_id = ticket["id"]
        if self.ticket_requires_llm(ticket):
            ollama_probe = self.probe_ollama()
            if ollama_probe.get("status") != "ok":
                result = self.build_waiting_llm_result(ticket, ollama_probe)
                waiting = self.mark_ticket_waiting_llm(ticket_id, result, self.waiting_llm_error(ollama_probe))
                return {
                    "ticketId": ticket_id,
                    "status": waiting.get("status") if isinstance(waiting, dict) else "waiting_llm",
                    "result": result,
                }
        else:
            ollama_probe = None

        claimed = self.claim_ticket(ticket_id)
        services = self.list_services()
        probes = [self.probe_service(service) for service in services if service.get("serviceId") != "ion2-worker"]
        failing = [probe for probe in probes if probe.get("status") not in {"ok", "skipped"}]
        result = self.build_result(
            ticket,
            claimed.get("status") if isinstance(claimed, dict) else "running",
            probes,
            ollama=ollama_probe,
        )

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

    def normalize_stream_ticket(self, entry_id, fields):
        if "ticket" in fields:
            ticket = json.loads(fields["ticket"])
        else:
            ticket = dict(fields)
            if "payload" in ticket and isinstance(ticket["payload"], str):
                try:
                    ticket["payload"] = json.loads(ticket["payload"])
                except json.JSONDecodeError:
                    pass

        ticket.setdefault("id", entry_id)
        ticket.setdefault("type", "job.platform.stream-ticket")
        ticket.setdefault("summary", ticket.get("type"))
        ticket.setdefault("serviceId", "elevator-service")
        return ticket

    def process_stream_entry(self, redis_client, entry_id, fields):
        ticket = self.normalize_stream_ticket(entry_id, fields)
        if self.ticket_requires_llm(ticket):
            ollama_probe = self.probe_ollama()
            if ollama_probe.get("status") != "ok":
                result = self.build_waiting_llm_result(ticket, ollama_probe)
                result["claimedStatus"] = "waiting_llm"
                result["error"] = self.waiting_llm_error(ollama_probe)
                redis_client.xadd(
                    self.config.redis_results_stream_key,
                    {
                        "ticketId": ticket["id"],
                        "status": "waiting_llm",
                        "summary": ticket.get("summary", ticket.get("type", "ticket")),
                        "result": json.dumps(result, ensure_ascii=False),
                    },
                )
                redis_client.xack(self.config.redis_stream_key, self.config.redis_consumer_group, entry_id)
                return {
                    "ticketId": ticket["id"],
                    "status": "waiting_llm",
                    "result": result,
                }
        else:
            ollama_probe = None

        probes = [self.probe_service(service) for service in self.stream_services()]
        failing = [probe for probe in probes if probe.get("status") not in {"ok", "skipped"}]
        status = "completed" if not failing else "failed"
        error_message = "; ".join(f"{probe.get('serviceId')}: {probe.get('status')}" for probe in failing) if failing else None
        result = self.build_result(ticket, "running", probes, ollama=ollama_probe)
        if error_message:
            result["error"] = error_message

        redis_client.xadd(
            self.config.redis_results_stream_key,
            {
                "ticketId": ticket["id"],
                "status": status,
                "summary": ticket.get("summary", ticket.get("type", "ticket")),
                "result": json.dumps(result, ensure_ascii=False),
            },
        )
        redis_client.xack(self.config.redis_stream_key, self.config.redis_consumer_group, entry_id)
        return {
            "ticketId": ticket["id"],
            "status": status,
            "result": result,
        }

    def run_stream_once(self):
        with RedisStreamClient(
            self.config.redis_host,
            self.config.redis_port,
            database=self.config.redis_database,
        ) as redis_client:
            redis_client.xgroup_create_mkstream(
                self.config.redis_stream_key,
                self.config.redis_consumer_group,
                "$",
            )
            batches = redis_client.xreadgroup(
                self.config.redis_stream_key,
                self.config.redis_consumer_group,
                self.config.redis_consumer_name,
                count=1,
                block_ms=self.config.redis_read_block_ms,
            )
            if not batches:
                return []

            summaries = []
            for batch in batches:
                for entry_id, fields in batch["entries"]:
                    summaries.append(self.process_stream_entry(redis_client, entry_id, fields))
            return summaries

    def run_gateway_once(self):
        eligible = []
        for ticket in self.list_tickets():
            status = ticket.get("status")
            if status in {"queued", "retrying"}:
                eligible.append(ticket)
            elif status == "waiting_llm" and self.ticket_ready_for_waiting_retry(ticket):
                eligible.append(ticket)
        return [self.run_ticket(ticket) for ticket in eligible]

    def run_once(self):
        if self.config.runtime_mode == "redis-streams":
            return self.run_stream_once()
        return self.run_gateway_once()

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
