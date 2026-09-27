import socket


class RedisCommandError(RuntimeError):
    pass


def encode_command(*parts):
    chunks = [f"*{len(parts)}\r\n".encode("utf-8")]
    for part in parts:
        if isinstance(part, bytes):
            value = part
        else:
            value = str(part).encode("utf-8")
        chunks.append(f"${len(value)}\r\n".encode("utf-8"))
        chunks.append(value + b"\r\n")
    return b"".join(chunks)


class RedisStreamClient:
    def __init__(self, host, port=6379, timeout_seconds=5, database=0):
        self.host = host
        self.port = int(port)
        self.timeout_seconds = timeout_seconds
        self.database = int(database)
        self.socket = None
        self.reader = None

    def connect(self):
        if self.socket is not None:
            return
        self.socket = socket.create_connection((self.host, self.port), timeout=self.timeout_seconds)
        self.reader = self.socket.makefile("rb")
        if self.database:
            self.execute("SELECT", self.database)

    def close(self):
        if self.reader is not None:
            self.reader.close()
        if self.socket is not None:
            self.socket.close()
        self.reader = None
        self.socket = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()

    def execute(self, *parts):
        self.connect()
        self.socket.sendall(encode_command(*parts))
        return self._read_response()

    def xgroup_create_mkstream(self, stream, group, start_id="$"):
        try:
            return self.execute("XGROUP", "CREATE", stream, group, start_id, "MKSTREAM")
        except RedisCommandError as exc:
            if "BUSYGROUP" in str(exc):
                return "BUSYGROUP"
            raise

    def xadd(self, stream, fields, entry_id="*"):
        command = ["XADD", stream, entry_id]
        for key, value in fields.items():
            command.extend([key, value])
        return self.execute(*command)

    def xack(self, stream, group, entry_id):
        return self.execute("XACK", stream, group, entry_id)

    def xreadgroup(self, stream, group, consumer, count=1, block_ms=1000, latest_id=">"):
        payload = self.execute(
            "XREADGROUP",
            "GROUP",
            group,
            consumer,
            "COUNT",
            count,
            "BLOCK",
            block_ms,
            "STREAMS",
            stream,
            latest_id,
        )
        if payload is None:
            return []

        results = []
        for stream_entry in payload:
            stream_name = self._decode(stream_entry[0])
            entries = []
            for raw_entry in stream_entry[1]:
                entry_id = self._decode(raw_entry[0])
                field_values = raw_entry[1]
                fields = {}
                for index in range(0, len(field_values), 2):
                    key = self._decode(field_values[index])
                    value = self._decode(field_values[index + 1])
                    fields[key] = value
                entries.append((entry_id, fields))
            results.append({"stream": stream_name, "entries": entries})
        return results

    def _read_response(self):
        prefix = self.reader.read(1)
        if not prefix:
            raise ConnectionError("redis connection closed")

        if prefix == b"+":
            return self._readline().decode("utf-8")
        if prefix == b"-":
            raise RedisCommandError(self._readline().decode("utf-8"))
        if prefix == b":":
            return int(self._readline())
        if prefix == b"$":
            length = int(self._readline())
            if length == -1:
                return None
            payload = self.reader.read(length)
            self.reader.read(2)
            return payload
        if prefix == b"*":
            length = int(self._readline())
            if length == -1:
                return None
            return [self._read_response() for _ in range(length)]

        raise RuntimeError(f"unsupported redis response prefix: {prefix!r}")

    def _readline(self):
        line = self.reader.readline()
        if not line:
            raise ConnectionError("redis connection closed while reading line")
        return line[:-2]

    @staticmethod
    def _decode(value):
        if isinstance(value, bytes):
            return value.decode("utf-8")
        if isinstance(value, list):
            return [RedisStreamClient._decode(item) for item in value]
        return value
