import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

SERVICE_NAME = os.getenv("SERVICE_NAME", "sample-python-service")
PORT = int(os.getenv("PORT", "8001"))


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._send_json(
                200,
                {
                    "status": "ok",
                    "service": SERVICE_NAME,
                    "port": PORT,
                },
            )
            return

        if parsed.path == "/api/ping":
            self._send_json(
                200,
                {
                    "message": "python sample is ready",
                    "service": SERVICE_NAME,
                },
            )
            return

        if parsed.path == "/api/echo":
            query = parse_qs(parsed.query)
            message = query.get("message", ["hello"])[0]
            self._send_json(
                200,
                {
                    "message": message,
                    "service": SERVICE_NAME,
                },
            )
            return

        self._send_json(404, {"error": "not found"})

    def log_message(self, format, *args):  # noqa: A003
        return


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"{SERVICE_NAME} listening on {PORT}")
    server.serve_forever()
