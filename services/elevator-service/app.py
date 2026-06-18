import json
import os
import random
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from urllib.parse import parse_qs, urlparse


SERVICE_NAME = os.getenv("SERVICE_NAME", "elevator-service")
PORT = int(os.getenv("PORT", "8003"))
MIN_FLOOR = int(os.getenv("MIN_FLOOR", "1"))
MAX_FLOOR = int(os.getenv("MAX_FLOOR", "23"))
ELEVATOR_COUNT = int(os.getenv("ELEVATOR_COUNT", "4"))
ELEVATOR_CAPACITY = int(os.getenv("ELEVATOR_CAPACITY", "20"))
AUTO_STEP_SECONDS = float(os.getenv("AUTO_STEP_SECONDS", "0.35"))
MOVE_STEP_PER_TICK = float(os.getenv("MOVE_STEP_PER_TICK", "0.25"))
BOARDING_DWELL_TICKS = int(os.getenv("BOARDING_DWELL_TICKS", "2"))
STATE_LOCK = Lock()
RNG = random.Random()

DEMAND_PRESETS = {
    "quiet": {"label": "한산", "multiplier": 0.55},
    "normal": {"label": "보통", "multiplier": 1.0},
    "busy": {"label": "혼잡", "multiplier": 1.7},
}


def build_start_floors():
    if ELEVATOR_COUNT <= 1:
        return [MIN_FLOOR]
    span = MAX_FLOOR - MIN_FLOOR
    floors = []
    for index in range(ELEVATOR_COUNT):
        ratio = index / (ELEVATOR_COUNT - 1)
        floor = round(MIN_FLOOR + (span * ratio))
        if floor not in floors:
            floors.append(floor)
            continue
        candidate = floor
        while candidate in floors and candidate < MAX_FLOOR:
            candidate += 1
        floors.append(candidate)
    return floors


START_FLOORS = build_start_floors()


def now_monotonic():
    return time.monotonic()


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def normalize_direction_for_floor(floor, direction):
    if direction in {"up", "down"}:
        return direction
    if floor <= MIN_FLOOR:
        return "up"
    if floor >= MAX_FLOOR:
        return "down"
    return "up"


def pick_random_destination(origin_floor, direction):
    if direction == "up":
        return RNG.randint(origin_floor + 1, MAX_FLOOR)
    return RNG.randint(MIN_FLOOR, origin_floor - 1)


def build_elevator(index, start_floor):
    return {
        "id": f"E{index + 1}",
        "currentFloor": start_floor,
        "position": float(start_floor),
        "direction": "idle",
        "doorState": "closed",
        "status": "idle",
        "queue": [],
        "assignedPassengerIds": [],
        "passengers": [],
        "capacity": ELEVATOR_CAPACITY,
        "currentLoad": 0,
        "lastStop": start_floor,
        "nextTarget": None,
        "dwellTicksRemaining": 0,
    }


def initial_state():
    return {
        "tick": 0,
        "mode": "live-traffic-loop",
        "building": {
            "minFloor": MIN_FLOOR,
            "maxFloor": MAX_FLOOR,
            "totalFloors": (MAX_FLOOR - MIN_FLOOR) + 1,
        },
        "elevators": [build_elevator(index, floor) for index, floor in enumerate(START_FLOORS)],
        "waitingPassengers": [],
        "completedPassengers": [],
        "hallCalls": [],
        "completedCalls": [],
        "lastCommand": "boot",
        "sequence": {"passenger": 0},
        "demand": {
            "preset": "normal",
            "presetLabel": DEMAND_PRESETS["normal"]["label"],
            "intensity": 55,
            "autoMode": True,
            "pendingSpawnBudget": 0.0,
            "stepSeconds": AUTO_STEP_SECONDS,
        },
        "runtime": {"lastAdvancedAt": now_monotonic()},
    }


STATE = initial_state()


def next_passenger_id():
    STATE["sequence"]["passenger"] += 1
    return f"P-{STATE['sequence']['passenger']:05d}"


def sort_queue(elevator):
    current_position = elevator["position"]
    direction = elevator["direction"]
    if direction == "up":
        elevator["queue"] = sorted(
            elevator["queue"],
            key=lambda floor: (0 if floor >= current_position else 1, abs(floor - current_position), floor),
        )
        return
    if direction == "down":
        elevator["queue"] = sorted(
            elevator["queue"],
            key=lambda floor: (0 if floor <= current_position else 1, abs(floor - current_position), -floor),
        )
        return
    elevator["queue"] = sorted(elevator["queue"], key=lambda floor: abs(floor - current_position))


def set_elevator_direction(elevator):
    elevator["currentLoad"] = len(elevator["passengers"])
    if elevator["doorState"] == "open":
        elevator["status"] = "boarding"
        elevator["direction"] = "idle"
    if not elevator["queue"]:
        elevator["nextTarget"] = None
        if elevator["doorState"] != "open":
            elevator["status"] = "idle"
            elevator["direction"] = "idle"
        return

    target = elevator["queue"][0]
    elevator["nextTarget"] = target
    if target > elevator["position"]:
        elevator["direction"] = "up"
        elevator["status"] = "moving"
    elif target < elevator["position"]:
        elevator["direction"] = "down"
        elevator["status"] = "moving"
    else:
        elevator["direction"] = "idle"
        if elevator["doorState"] != "open":
            elevator["status"] = "boarding"


def score_elevator(elevator, floor, direction):
    distance = abs(elevator["position"] - floor)
    queue_penalty = len(elevator["queue"]) * 1.6
    load_penalty = (len(elevator["passengers"]) / max(elevator["capacity"], 1)) * 6

    if elevator["direction"] == "idle":
        return distance + queue_penalty + load_penalty

    directional_bonus = 0
    if elevator["direction"] == direction:
        if direction == "up" and floor >= elevator["position"]:
            directional_bonus = -2.2
        elif direction == "down" and floor <= elevator["position"]:
            directional_bonus = -2.2

    return distance + queue_penalty + load_penalty + 3.8 + directional_bonus


def pick_elevator_for_request(floor, direction):
    ranked = sorted(
        STATE["elevators"],
        key=lambda elevator: (score_elevator(elevator, floor, direction), elevator["id"]),
    )
    return ranked[0]


def ensure_floor_in_queue(elevator, floor):
    if floor == round(elevator["position"]) and elevator["doorState"] == "open":
        return
    if floor not in elevator["queue"]:
        elevator["queue"].append(floor)
        sort_queue(elevator)
    set_elevator_direction(elevator)


def create_passenger(origin_floor, direction, destination_floor=None, source="manual"):
    normalized_direction = normalize_direction_for_floor(origin_floor, direction)
    destination = destination_floor or pick_random_destination(origin_floor, normalized_direction)
    passenger = {
        "id": next_passenger_id(),
        "originFloor": origin_floor,
        "destinationFloor": destination,
        "direction": normalized_direction,
        "status": "waiting",
        "assignedElevatorId": None,
        "requestedAtTick": STATE["tick"],
        "source": source,
    }
    return passenger


def register_waiting_passenger(passenger):
    assigned = pick_elevator_for_request(passenger["originFloor"], passenger["direction"])
    passenger["assignedElevatorId"] = assigned["id"]
    STATE["waitingPassengers"].append(passenger)
    if passenger["id"] not in assigned["assignedPassengerIds"]:
        assigned["assignedPassengerIds"].append(passenger["id"])
    ensure_floor_in_queue(assigned, passenger["originFloor"])
    STATE["lastCommand"] = (
        f"passenger:{passenger['originFloor']}:{passenger['direction']}:{assigned['id']}"
    )
    return passenger


def waiting_passengers_at_floor(floor, elevator_id=None):
    return [
        passenger
        for passenger in STATE["waitingPassengers"]
        if passenger["originFloor"] == floor
        and (elevator_id is None or passenger["assignedElevatorId"] == elevator_id)
    ]


def unload_passengers(elevator, floor):
    remaining = []
    dropped = []
    for passenger in elevator["passengers"]:
        if passenger["destinationFloor"] != floor:
            remaining.append(passenger)
            continue
        dropped.append(passenger)

    if not dropped:
        elevator["passengers"] = remaining
        elevator["currentLoad"] = len(remaining)
        return []

    elevator["passengers"] = remaining
    elevator["currentLoad"] = len(remaining)
    for passenger in dropped:
        passenger["status"] = "completed"
        passenger["servedAtTick"] = STATE["tick"]
        passenger["servedByElevatorId"] = elevator["id"]
        STATE["completedPassengers"].append(passenger)
        STATE["completedCalls"].append(
            {
                "id": passenger["id"],
                "floor": floor,
                "direction": passenger["direction"],
                "assignedElevatorId": elevator["id"],
                "servedAtTick": STATE["tick"],
                "destinationFloor": passenger["destinationFloor"],
            }
        )
    STATE["completedPassengers"] = STATE["completedPassengers"][-24:]
    STATE["completedCalls"] = STATE["completedCalls"][-12:]
    return dropped


def pickup_passengers(elevator, floor):
    available = max(elevator["capacity"] - len(elevator["passengers"]), 0)
    if available <= 0:
        return []

    candidates = waiting_passengers_at_floor(floor, elevator["id"])
    if not candidates:
        return []

    candidates.sort(key=lambda passenger: (passenger["requestedAtTick"], passenger["id"]))
    boarded = candidates[:available]
    if not boarded:
        return []

    boarded_ids = {passenger["id"] for passenger in boarded}
    remaining_waiting = []
    for passenger in STATE["waitingPassengers"]:
        if passenger["id"] not in boarded_ids:
            remaining_waiting.append(passenger)
            continue
        passenger["status"] = "onboard"
        passenger["boardedAtTick"] = STATE["tick"]
        passenger["assignedElevatorId"] = elevator["id"]
        elevator["passengers"].append(passenger)
        ensure_floor_in_queue(elevator, passenger["destinationFloor"])

    STATE["waitingPassengers"] = remaining_waiting
    elevator["currentLoad"] = len(elevator["passengers"])
    elevator["assignedPassengerIds"] = [
        passenger_id for passenger_id in elevator["assignedPassengerIds"] if passenger_id not in boarded_ids
    ]
    return boarded


def reassign_waiting_passengers():
    for elevator in STATE["elevators"]:
        elevator["assignedPassengerIds"] = []

    for passenger in STATE["waitingPassengers"]:
        elevator = pick_elevator_for_request(passenger["originFloor"], passenger["direction"])
        passenger["assignedElevatorId"] = elevator["id"]
        elevator["assignedPassengerIds"].append(passenger["id"])
        ensure_floor_in_queue(elevator, passenger["originFloor"])


def service_floor(elevator, floor):
    dropped = unload_passengers(elevator, floor)
    boarded = pickup_passengers(elevator, floor)
    elevator["doorState"] = "open"
    elevator["status"] = "boarding"
    elevator["direction"] = "idle"
    elevator["lastStop"] = floor
    elevator["dwellTicksRemaining"] = BOARDING_DWELL_TICKS
    reassign_waiting_passengers()
    set_elevator_direction(elevator)
    return dropped, boarded


def active_hall_calls():
    grouped = {}
    for passenger in STATE["waitingPassengers"]:
        key = (passenger["originFloor"], passenger["direction"])
        bucket = grouped.setdefault(
            key,
            {
                "id": f"H-{passenger['originFloor']}-{passenger['direction']}",
                "floor": passenger["originFloor"],
                "direction": passenger["direction"],
                "assignedElevatorIds": [],
                "assignedElevatorId": passenger["assignedElevatorId"],
                "status": "assigned",
                "passengerCount": 0,
                "requestedAtTick": passenger["requestedAtTick"],
            },
        )
        bucket["passengerCount"] += 1
        bucket["requestedAtTick"] = min(bucket["requestedAtTick"], passenger["requestedAtTick"])
        assigned_id = passenger["assignedElevatorId"]
        if assigned_id and assigned_id not in bucket["assignedElevatorIds"]:
            bucket["assignedElevatorIds"].append(assigned_id)
            bucket["assignedElevatorId"] = bucket["assignedElevatorIds"][0]
    return sorted(grouped.values(), key=lambda call: (-call["floor"], call["direction"]))


def floor_queue_summary():
    queue_map = {
        floor: {
            "floor": floor,
            "up": 0,
            "down": 0,
            "topDestinations": {"up": [], "down": []},
        }
        for floor in range(MIN_FLOOR, MAX_FLOOR + 1)
    }
    destination_counts = {}

    for passenger in STATE["waitingPassengers"]:
        queue_map[passenger["originFloor"]][passenger["direction"]] += 1
        bucket = destination_counts.setdefault((passenger["originFloor"], passenger["direction"]), {})
        bucket[passenger["destinationFloor"]] = bucket.get(passenger["destinationFloor"], 0) + 1

    for (floor, direction), counts in destination_counts.items():
        ordered = sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:3]
        queue_map[floor]["topDestinations"][direction] = [
            {"floor": destination_floor, "count": count}
            for destination_floor, count in ordered
        ]

    return [queue_map[floor] for floor in range(MAX_FLOOR, MIN_FLOOR - 1, -1)]


def summarize_state():
    active_calls = active_hall_calls()
    moving = sum(1 for elevator in STATE["elevators"] if elevator["status"] == "moving")
    idle = sum(1 for elevator in STATE["elevators"] if elevator["status"] == "idle")
    onboard = sum(len(elevator["passengers"]) for elevator in STATE["elevators"])
    waiting = len(STATE["waitingPassengers"])
    load_ratio = onboard / max(ELEVATOR_COUNT * ELEVATOR_CAPACITY, 1)
    return {
        "activeHallCalls": len(active_calls),
        "movingElevators": moving,
        "idleElevators": idle,
        "waitingPassengers": waiting,
        "onboardPassengers": onboard,
        "loadRatio": round(load_ratio, 3),
        "autoMode": STATE["demand"]["autoMode"],
        "demandPreset": STATE["demand"]["preset"],
        "demandIntensity": STATE["demand"]["intensity"],
    }


def snapshot():
    halls = active_hall_calls()
    STATE["hallCalls"] = halls
    return {
        "service": SERVICE_NAME,
        "mode": STATE["mode"],
        "tick": STATE["tick"],
        "building": dict(STATE["building"]),
        "floors": list(range(MAX_FLOOR, MIN_FLOOR - 1, -1)),
        "elevators": [
            {
                **elevator,
                "queue": list(elevator["queue"]),
                "assignedPassengerIds": list(elevator["assignedPassengerIds"]),
                "passengers": [dict(passenger) for passenger in elevator["passengers"]],
            }
            for elevator in STATE["elevators"]
        ],
        "waitingPassengers": [dict(passenger) for passenger in STATE["waitingPassengers"]],
        "completedPassengers": [dict(passenger) for passenger in STATE["completedPassengers"][-24:]],
        "hallCalls": halls,
        "completedCalls": [dict(call) for call in STATE["completedCalls"][-12:]],
        "floorQueues": floor_queue_summary(),
        "demand": dict(STATE["demand"]),
        "lastCommand": STATE["lastCommand"],
        "summary": summarize_state(),
    }


def pick_auto_passenger_trip():
    intensity_ratio = STATE["demand"]["intensity"] / 100
    roll = RNG.random()
    if roll < 0.38 + (intensity_ratio * 0.16):
        origin = RNG.randint(MIN_FLOOR, min(MIN_FLOOR + 3, MAX_FLOOR - 1))
        destination = RNG.randint(max(origin + 1, 5), MAX_FLOOR)
        return origin, destination
    if roll < 0.62 + (intensity_ratio * 0.1):
        origin = RNG.randint(max(MIN_FLOOR + 5, MIN_FLOOR), MAX_FLOOR)
        destination = RNG.randint(MIN_FLOOR, min(origin - 1, MIN_FLOOR + 4))
        return origin, destination
    if roll < 0.82:
        origin = RNG.randint(MIN_FLOOR + 1, MAX_FLOOR - 1)
        destination = RNG.randint(origin + 1, MAX_FLOOR)
        return origin, destination
    origin = RNG.randint(MIN_FLOOR + 1, MAX_FLOOR - 1)
    destination = RNG.randint(MIN_FLOOR, origin - 1)
    return origin, destination


def auto_spawn_passengers():
    demand = STATE["demand"]
    if not demand["autoMode"]:
        return

    preset = DEMAND_PRESETS.get(demand["preset"], DEMAND_PRESETS["normal"])
    intensity_ratio = clamp(demand["intensity"], 0, 100) / 100
    demand["pendingSpawnBudget"] += (0.06 + (intensity_ratio * 0.22)) * preset["multiplier"]

    spawn_count = int(demand["pendingSpawnBudget"])
    if spawn_count <= 0:
        return

    demand["pendingSpawnBudget"] -= spawn_count
    for _ in range(min(spawn_count, 4)):
        origin, destination = pick_auto_passenger_trip()
        direction = "up" if destination > origin else "down"
        register_waiting_passenger(
            create_passenger(origin, direction, destination_floor=destination, source="auto")
        )


def advance_elevator(elevator):
    if elevator["doorState"] == "open" and elevator["dwellTicksRemaining"] > 0:
        elevator["dwellTicksRemaining"] -= 1
        elevator["status"] = "boarding"
        elevator["direction"] = "idle"
        elevator["currentLoad"] = len(elevator["passengers"])
        if elevator["dwellTicksRemaining"] <= 0:
            elevator["doorState"] = "closed"
            set_elevator_direction(elevator)
        return

    if elevator["doorState"] == "open":
        elevator["doorState"] = "closed"

    if not elevator["queue"]:
        set_elevator_direction(elevator)
        return

    target = elevator["queue"][0]
    elevator["nextTarget"] = target
    delta = target - elevator["position"]
    if abs(delta) <= MOVE_STEP_PER_TICK:
        elevator["position"] = float(target)
        elevator["currentFloor"] = target
        elevator["queue"].pop(0)
        service_floor(elevator, target)
        return

    step = MOVE_STEP_PER_TICK if delta > 0 else -MOVE_STEP_PER_TICK
    elevator["position"] = round(elevator["position"] + step, 3)
    elevator["currentFloor"] = int(round(elevator["position"]))
    elevator["direction"] = "up" if step > 0 else "down"
    elevator["status"] = "moving"
    elevator["doorState"] = "closed"
    elevator["currentLoad"] = len(elevator["passengers"])


def step_once(command_label="auto"):
    STATE["tick"] += 1
    auto_spawn_passengers()
    for elevator in STATE["elevators"]:
        advance_elevator(elevator)
    reassign_waiting_passengers()
    STATE["lastCommand"] = f"{command_label}:{STATE['tick']}"
    return snapshot()


def sync_state():
    now = now_monotonic()
    elapsed = now - STATE["runtime"]["lastAdvancedAt"]
    if elapsed < AUTO_STEP_SECONDS:
        return
    steps = int(elapsed / AUTO_STEP_SECONDS)
    steps = clamp(steps, 1, 96)
    for _ in range(int(steps)):
        step_once("auto")
    STATE["runtime"]["lastAdvancedAt"] += steps * AUTO_STEP_SECONDS


def call_floor(floor, direction):
    if floor < MIN_FLOOR or floor > MAX_FLOOR:
        return False, {
            "error": "unsupported floor",
            "building": {"minFloor": MIN_FLOOR, "maxFloor": MAX_FLOOR},
        }
    normalized_direction = normalize_direction_for_floor(floor, direction)
    if normalized_direction == "up" and floor >= MAX_FLOOR:
        return False, {"error": "top floor cannot request up"}
    if normalized_direction == "down" and floor <= MIN_FLOOR:
        return False, {"error": "bottom floor cannot request down"}

    passenger = create_passenger(floor, normalized_direction, source="legacy-call")
    register_waiting_passenger(passenger)
    return True, snapshot()


def add_manual_passenger(floor, direction, destination_floor=None):
    if floor < MIN_FLOOR or floor > MAX_FLOOR:
        return False, {"error": "unsupported floor"}
    normalized_direction = normalize_direction_for_floor(floor, direction)
    if normalized_direction == "up" and floor >= MAX_FLOOR:
        return False, {"error": "top floor cannot request up"}
    if normalized_direction == "down" and floor <= MIN_FLOOR:
        return False, {"error": "bottom floor cannot request down"}
    passenger = create_passenger(
        floor,
        normalized_direction,
        destination_floor=destination_floor,
        source="manual",
    )
    register_waiting_passenger(passenger)
    return True, snapshot()


def update_demand(preset=None, intensity=None, auto_mode=None):
    if preset:
        normalized = str(preset).strip().lower()
        if normalized not in DEMAND_PRESETS:
            return False, {"error": "unsupported preset"}
        STATE["demand"]["preset"] = normalized
        STATE["demand"]["presetLabel"] = DEMAND_PRESETS[normalized]["label"]

    if intensity is not None:
        try:
            parsed = int(intensity)
        except (TypeError, ValueError):
            return False, {"error": "intensity must be an integer"}
        STATE["demand"]["intensity"] = clamp(parsed, 0, 100)

    if auto_mode is not None:
        STATE["demand"]["autoMode"] = bool(auto_mode)

    STATE["lastCommand"] = (
        f"demand:{STATE['demand']['preset']}:{STATE['demand']['intensity']}"
    )
    return True, snapshot()


def reset_state():
    fresh_state = initial_state()
    STATE.clear()
    STATE.update(fresh_state)
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
                sync_state()
                current_state = snapshot()
            self._send_json(
                200,
                {
                    "status": "ok",
                    "service": SERVICE_NAME,
                    "port": PORT,
                    "tick": current_state["tick"],
                    "activeHallCalls": current_state["summary"]["activeHallCalls"],
                    "movingElevators": current_state["summary"]["movingElevators"],
                    "waitingPassengers": current_state["summary"]["waitingPassengers"],
                    "onboardPassengers": current_state["summary"]["onboardPassengers"],
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
                sync_state()
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
            direction = body.get("direction")
            with STATE_LOCK:
                sync_state()
                ok, payload = call_floor(floor, direction)
            self._send_json(200 if ok else 400, payload)
            return
        if parsed.path == "/api/passenger":
            try:
                floor = int(body.get("floor"))
            except (TypeError, ValueError):
                self._send_json(400, {"error": "floor is required"})
                return
            direction = body.get("direction")
            destination_floor = body.get("destinationFloor")
            with STATE_LOCK:
                sync_state()
                ok, payload = add_manual_passenger(floor, direction, destination_floor)
            self._send_json(200 if ok else 400, payload)
            return
        if parsed.path == "/api/demand":
            with STATE_LOCK:
                sync_state()
                ok, payload = update_demand(
                    preset=body.get("preset"),
                    intensity=body.get("intensity"),
                    auto_mode=body.get("autoMode"),
                )
            self._send_json(200 if ok else 400, payload)
            return
        if parsed.path == "/api/step":
            with STATE_LOCK:
                sync_state()
                self._send_json(200, step_once("debug-step"))
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
