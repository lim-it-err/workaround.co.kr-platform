import json
import os
from datetime import datetime, timezone
from uuid import uuid4

from redis_stream import RedisStreamClient


def build_ticket():
    return {
        "id": f"stream-{uuid4()}",
        "type": os.getenv("MOCK_TICKET_TYPE", "job.platform.healthcheck"),
        "status": "queued",
        "priority": int(os.getenv("MOCK_TICKET_PRIORITY", "5")),
        "requestedBy": os.getenv("MOCK_TICKET_REQUESTED_BY", "worker-smoke"),
        "targetNode": os.getenv("MOCK_TICKET_TARGET_NODE", "ion2"),
        "serviceId": os.getenv("MOCK_TICKET_SERVICE_ID", "elevator-service"),
        "summary": os.getenv("MOCK_TICKET_SUMMARY", "Redis stream smoke ticket"),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "payload": {
            "source": "enqueue_mock_ticket.py",
            "mode": "redis-streams",
        },
    }


def main():
    host = os.getenv("REDIS_HOST", "localhost")
    port = int(os.getenv("REDIS_PORT", "6379"))
    stream = os.getenv("REDIS_STREAM_KEY", "platform:tickets")

    ticket = build_ticket()
    with RedisStreamClient(host, port) as client:
        entry_id = client.xadd(stream, {"ticket": json.dumps(ticket, ensure_ascii=False)})

    print(
        json.dumps(
            {
                "stream": stream,
                "entryId": entry_id if isinstance(entry_id, str) else entry_id.decode("utf-8"),
                "ticketId": ticket["id"],
                "serviceId": ticket["serviceId"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
