import json
import os
import socketserver
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
PYTHON_EXE = sys.executable


def parse_resp(reader):
    prefix = reader.read(1)
    if not prefix:
        return None
    if prefix == b"*":
        return [parse_resp(reader) for _ in range(int(reader.readline().strip()))]
    if prefix == b"$":
        length = int(reader.readline().strip())
        if length == -1:
            return None
        payload = reader.read(length)
        reader.read(2)
        return payload.decode("utf-8")
    if prefix == b":":
        return int(reader.readline().strip())
    if prefix == b"+":
        return reader.readline().strip().decode("utf-8")
    raise RuntimeError(f"unsupported RESP prefix: {prefix!r}")


def encode_error(value):
    return f"-{value}\r\n".encode("utf-8")


def encode_int(value):
    return f":{value}\r\n".encode("utf-8")


def encode_bulk(value):
    payload = str(value).encode("utf-8")
    return b"$" + str(len(payload)).encode("utf-8") + b"\r\n" + payload + b"\r\n"


def encode_any(value):
    if value is None:
        return b"*-1\r\n"
    if isinstance(value, int):
        return encode_int(value)
    if isinstance(value, list):
        return b"*" + str(len(value)).encode("utf-8") + b"\r\n" + b"".join(encode_any(item) for item in value)
    return encode_bulk(value)


class FakeRedisState:
    def __init__(self):
        self.lock = threading.Lock()
        self.streams = {}
        self.groups = {}
        self.pending = {}
        self.next_id = 1

    def xgroup_create(self, stream, group):
        with self.lock:
            self.streams.setdefault(stream, [])
            key = (stream, group)
            if key in self.groups:
                return False
            self.groups[key] = {"delivered": set()}
            self.pending[key] = set()
            return True

    def xadd(self, stream, fields):
        with self.lock:
            entry_id = f"{self.next_id}-0"
            self.next_id += 1
            self.streams.setdefault(stream, []).append((entry_id, dict(fields)))
            return entry_id

    def xreadgroup(self, stream, group, count):
        with self.lock:
            key = (stream, group)
            delivered = self.groups.setdefault(key, {"delivered": set()})["delivered"]
            pending = self.pending.setdefault(key, set())
            entries = []
            for entry_id, fields in self.streams.get(stream, []):
                if entry_id in delivered:
                    continue
                delivered.add(entry_id)
                pending.add(entry_id)
                flat = []
                for key_name, value in fields.items():
                    flat.extend([key_name, value])
                entries.append([entry_id, flat])
                if len(entries) >= count:
                    break
            return None if not entries else [[stream, entries]]

    def xack(self, stream, group, entry_id):
        with self.lock:
            pending = self.pending.setdefault((stream, group), set())
            if entry_id in pending:
                pending.remove(entry_id)
                return 1
            return 0


class FakeRedisHandler(socketserver.StreamRequestHandler):
    state = None

    def handle(self):
        while True:
            command = parse_resp(self.rfile)
            if command is None:
                return
            verb = command[0].upper()
            if verb == "SELECT":
                self.wfile.write(b"+OK\r\n")
            elif verb == "XGROUP":
                created = self.state.xgroup_create(command[2], command[3])
                if created:
                    self.wfile.write(b"+OK\r\n")
                else:
                    self.wfile.write(encode_error("BUSYGROUP Consumer Group name already exists"))
            elif verb == "XADD":
                fields = dict(zip(command[3::2], command[4::2]))
                self.wfile.write(encode_bulk(self.state.xadd(command[1], fields)))
            elif verb == "XREADGROUP":
                payload = self.state.xreadgroup(command[9], command[2], int(command[5]))
                self.wfile.write(encode_any(payload))
            elif verb == "XACK":
                self.wfile.write(encode_int(self.state.xack(command[1], command[2], command[3])))
            else:
                self.wfile.write(encode_error(f"ERR unsupported {verb}"))


class HealthHandler(BaseHTTPRequestHandler):
    payload = {"status": "ok"}

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(self.payload).encode("utf-8"))

    def log_message(self, format, *args):
        return


def start_http(payload):
    handler = type("PayloadHandler", (HealthHandler,), {"payload": payload})
    server = HTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def main():
    worker_dir = ROOT_DIR / "workers" / "ion2-worker"
    state = FakeRedisState()
    handler = type("BoundFakeRedisHandler", (FakeRedisHandler,), {"state": state})
    redis_server = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=redis_server.serve_forever, daemon=True).start()

    elevator_server = start_http({"status": "ok", "service": "elevator-service"})
    sample_server = start_http({"status": "ok", "service": "sample-spring-service"})
    gateway_server = start_http({"status": "ok", "service": "gateway"})

    try:
        env = dict(os.environ)
        env.update(
            {
                "PYTHONPATH": str(worker_dir),
                "WORKER_ONCE": "true",
                "WORKER_RUNTIME_MODE": "redis-streams",
                "REDIS_HOST": "127.0.0.1",
                "REDIS_PORT": str(redis_server.server_address[1]),
                "REDIS_STREAM_KEY": "platform:tickets",
                "REDIS_RESULTS_STREAM_KEY": "platform:tickets:results",
                "REDIS_CONSUMER_GROUP": "platform-workers",
                "REDIS_CONSUMER_NAME": "ion2-worker-smoke",
                "REDIS_READ_BLOCK_MS": "10",
                "ELEVATOR_SERVICE_URL": f"http://127.0.0.1:{elevator_server.server_port}",
                "SAMPLE_SPRING_SERVICE_URL": f"http://127.0.0.1:{sample_server.server_port}",
                "GATEWAY_BASE_URL": f"http://127.0.0.1:{gateway_server.server_port}",
            }
        )

        ticket_process = subprocess.run(
            [PYTHON_EXE, str(worker_dir / "enqueue_mock_ticket.py")],
            cwd=str(ROOT_DIR),
            env=env,
            capture_output=True,
            text=True,
            timeout=20,
            check=True,
        )

        worker_process = subprocess.run(
            [PYTHON_EXE, str(worker_dir / "worker.py")],
            cwd=str(ROOT_DIR),
            env=env,
            capture_output=True,
            text=True,
            timeout=20,
            check=True,
        )

        with state.lock:
            result_entries = state.streams.get("platform:tickets:results", [])
            pending = sorted(state.pending.get(("platform:tickets", "platform-workers"), set()))

        print(
            json.dumps(
                {
                    "ticketProcess": json.loads(ticket_process.stdout),
                    "workerProcess": json.loads(worker_process.stdout),
                    "resultEntryCount": len(result_entries),
                    "pendingAfterAck": pending,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    finally:
        elevator_server.shutdown()
        sample_server.shutdown()
        gateway_server.shutdown()
        redis_server.shutdown()


if __name__ == "__main__":
    main()
