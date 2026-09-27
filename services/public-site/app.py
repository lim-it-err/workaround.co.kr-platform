import json
import mimetypes
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


PORT = int(os.getenv("PORT", "8010"))
SERVICE_NAME = os.getenv("SERVICE_NAME", "public-site")
CANONICAL_DOMAIN = os.getenv("CANONICAL_DOMAIN", "workaround.co.kr")
ALIAS_DOMAIN = os.getenv("ALIAS_DOMAIN", "workaround.kr")
STATIC_DIR = Path(__file__).resolve().parent / "static"


class PublicSiteHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self._write_json(
                HTTPStatus.OK,
                {
                    "status": "ok",
                    "service": SERVICE_NAME,
                    "canonicalDomain": CANONICAL_DOMAIN,
                    "aliasDomain": ALIAS_DOMAIN,
                },
            )
            return

        if self.path in ("/", "/index.html"):
            self._serve_file("index.html")
            return

        if self.path == "/styles.css":
            self._serve_file("styles.css")
            return

        if self.path == "/site.webmanifest":
            self._serve_file("site.webmanifest")
            return

        self._write_json(
            HTTPStatus.NOT_FOUND,
            {
                "status": "not_found",
                "path": self.path,
            },
        )

    def log_message(self, format, *args):
        return

    def _serve_file(self, file_name: str):
        file_path = STATIC_DIR / file_name
        if not file_path.exists():
            self._write_json(
                HTTPStatus.NOT_FOUND,
                {
                    "status": "missing_asset",
                    "asset": file_name,
                },
            )
            return

        mime_type, _ = mimetypes.guess_type(str(file_path))
        content_type = mime_type or "application/octet-stream"
        body = file_path.read_bytes()

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "public, max-age=300")
        self.end_headers()
        self.wfile.write(body)

    def _write_json(self, status_code: HTTPStatus, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def main():
    server = ThreadingHTTPServer(("0.0.0.0", PORT), PublicSiteHandler)
    print(f"{SERVICE_NAME} listening on {PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
