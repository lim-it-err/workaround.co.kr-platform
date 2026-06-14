import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from urllib.parse import parse_qs, urlparse


SERVICE_NAME = os.getenv("SERVICE_NAME", "elevator-service")
PORT = int(os.getenv("PORT", "8003"))
CURRENT_FLOOR = int(os.getenv("CURRENT_FLOOR", "7"))
TARGET_FLOORS = [1, 3, 5, 7, 9]
STATE_LOCK = Lock()
STATE = {
    "currentFloor": CURRENT_FLOOR,
    "targetFloors": TARGET_FLOORS,
    "queue": [],
    "direction": "idle",
    "mode": "interactive",
    "lastCommand": "boot",
}


def snapshot():
    return {
        "service": SERVICE_NAME,
        "currentFloor": STATE["currentFloor"],
        "targetFloors": list(STATE["targetFloors"]),
        "queue": list(STATE["queue"]),
        "direction": STATE["direction"],
        "mode": STATE["mode"],
        "lastCommand": STATE["lastCommand"],
        "moving": STATE["direction"] != "idle",
        "nextTarget": STATE["queue"][0] if STATE["queue"] else None,
    }


def set_idle_if_empty():
    if not STATE["queue"]:
        STATE["direction"] = "idle"
        return
    target = STATE["queue"][0]
    if target > STATE["currentFloor"]:
        STATE["direction"] = "up"
    elif target < STATE["currentFloor"]:
        STATE["direction"] = "down"
    else:
        STATE["queue"].pop(0)
        set_idle_if_empty()


def call_floor(floor):
    if floor not in TARGET_FLOORS:
        return False, {"error": "unsupported floor", "targetFloors": TARGET_FLOORS}
    if floor != STATE["currentFloor"] and floor not in STATE["queue"]:
        STATE["queue"].append(floor)
    STATE["lastCommand"] = f"call:{floor}"
    set_idle_if_empty()
    return True, snapshot()


def step_once():
    if not STATE["queue"]:
        STATE["direction"] = "idle"
        STATE["lastCommand"] = "step:idle"
        return snapshot()

    target = STATE["queue"][0]
    if target > STATE["currentFloor"]:
        STATE["currentFloor"] += 1
        STATE["direction"] = "up"
    elif target < STATE["currentFloor"]:
        STATE["currentFloor"] -= 1
        STATE["direction"] = "down"

    if STATE["currentFloor"] == target:
        STATE["queue"].pop(0)
        STATE["lastCommand"] = f"arrived:{target}"
    else:
        STATE["lastCommand"] = "step:moving"

    set_idle_if_empty()
    return snapshot()


def reset_state():
    STATE["currentFloor"] = CURRENT_FLOOR
    STATE["queue"] = []
    STATE["direction"] = "idle"
    STATE["mode"] = "interactive"
    STATE["lastCommand"] = "reset"
    return snapshot()


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            with STATE_LOCK:
                current_state = snapshot()
            self._send_json(
                200,
                {
                    "status": "ok",
                    "service": SERVICE_NAME,
                    "port": PORT,
                    "currentFloor": current_state["currentFloor"],
                    "direction": current_state["direction"],
                    "queueLength": len(current_state["queue"]),
                },
            )
            return
        if parsed.path == "/api/ping":
            self._send_json(200, {"message": "elevator simulator is ready", "service": SERVICE_NAME})
            return
        if parsed.path == "/api/echo":
            query = parse_qs(parsed.query)
            message = query.get("message", ["hello"])[0]
            self._send_json(200, {"message": message, "service": SERVICE_NAME})
            return
        if parsed.path == "/api/state":
            with STATE_LOCK:
                self._send_json(200, snapshot())
            return
        self._send_json(404, {"error": "not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        body = self._read_json()
        if parsed.path == "/api/call":
            try:
                floor = int(body.get("floor"))
            except (TypeError, ValueError):
                self._send_json(400, {"error": "floor is required"})
                return
            with STATE_LOCK:
                ok, payload = call_floor(floor)
            self._send_json(200 if ok else 400, payload)
            return
        if parsed.path == "/api/step":
            with STATE_LOCK:
                self._send_json(200, step_once())
            return
        if parsed.path == "/api/reset":
            with STATE_LOCK:
                self._send_json(200, reset_state())
            return
        self._send_json(404, {"error": "not found"})

    def log_message(self, format, *args):  # noqa: A003
        return


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"{SERVICE_NAME} listening on {PORT}")
    server.serve_forever()
