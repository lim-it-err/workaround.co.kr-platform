import argparse
import json
import re
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


SECTION_COUNTS = {
    "## Backlog": "backlog",
    "## Started": "started",
    "## Need Review": "needReview",
    "## Finished": "finished",
}

METADATA_FIELD_ORDER = [
    "title",
    "priority",
    "targetVersion",
    "status",
    "documentStatus",
    "progressDecision",
    "ownerType",
    "recommendedBranch",
]


@dataclass
class HeartbeatConfig:
    repo_root: Path
    interval_seconds: int
    once: bool
    log_path: Path | None


def parse_args() -> HeartbeatConfig:
    repo_root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(
        description="Poll docs/tickets state and print an orchestrator heartbeat report."
    )
    parser.add_argument(
        "--interval-seconds",
        type=int,
        default=600,
        help="Polling interval in seconds when --once is not set.",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run one heartbeat check and exit.",
    )
    parser.add_argument(
        "--log-path",
        type=Path,
        default=None,
        help="Optional path to append NDJSON heartbeat logs.",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=repo_root,
        help="Repository root that contains docs/ and workers/.",
    )
    args = parser.parse_args()
    return HeartbeatConfig(
        repo_root=args.repo_root.resolve(),
        interval_seconds=max(1, args.interval_seconds),
        once=args.once,
        log_path=args.log_path.resolve() if args.log_path else None,
    )


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def clean_value(raw_value: str) -> str:
    value = raw_value.strip()
    if value.startswith("`") and value.endswith("`") and len(value) >= 2:
        value = value[1:-1]
    return value.strip()


def parse_ticket(ticket_path: Path, repo_root: Path) -> dict:
    metadata = {}
    lines = read_text(ticket_path).splitlines()
    metadata_header_index = next(
        (index for index, line in enumerate(lines) if line.strip().startswith("## ")),
        None,
    )

    if metadata_header_index is not None:
        metadata_lines = []
        for line in lines[metadata_header_index + 1 :]:
            stripped = line.strip()
            if stripped.startswith("## "):
                break
            if stripped.startswith("- ") and ":" in stripped:
                metadata_lines.append(stripped)

        for index, line in enumerate(metadata_lines):
            if index >= len(METADATA_FIELD_ORDER):
                break
            _, value = line[2:].split(":", 1)
            metadata[METADATA_FIELD_ORDER[index]] = clean_value(value)

    stem_parts = ticket_path.stem.split("-")
    ticket_id = "-".join(stem_parts[:2]) if len(stem_parts) >= 2 else ticket_path.stem

    return {
        "id": ticket_id,
        "path": ticket_path.relative_to(repo_root).as_posix(),
        "title": metadata.get("title", ticket_path.stem),
        "priority": metadata.get("priority", "unknown"),
        "targetVersion": metadata.get("targetVersion", "unknown"),
        "status": metadata.get("status", "unknown"),
        "progressDecision": metadata.get("progressDecision", "unknown"),
        "ownerType": metadata.get("ownerType", "unknown"),
        "recommendedBranch": metadata.get("recommendedBranch", ""),
    }


def parse_board_counts(board_path: Path) -> dict:
    counts = {value: 0 for value in SECTION_COUNTS.values()}
    current_section = None

    for line in read_text(board_path).splitlines():
        stripped = line.strip()
        if stripped in SECTION_COUNTS:
            current_section = SECTION_COUNTS[stripped]
            continue
        if current_section and stripped.startswith("- `TKT-"):
            counts[current_section] += 1

    return counts


def parse_roadmap_window(roadmap_path: Path) -> dict:
    current_upper = "unknown"
    next_minor = "unknown"
    version_lines = []

    for line in read_text(roadmap_path).splitlines():
        stripped = line.strip()
        if not stripped.startswith("- "):
            continue

        versions = re.findall(r"v\d+\.\d+\.\d+", stripped)
        if versions:
            version_lines.append(versions[0])
            continue

        if version_lines:
            break

    if len(version_lines) >= 3:
        current_upper = version_lines[1]
        next_minor = version_lines[2]

    return {
        "currentUpperBound": current_upper,
        "nextMinor": next_minor,
    }


def relevant_target_version(target_version: str) -> bool:
    if target_version == "infra":
        return True
    if not target_version.startswith("v"):
        return False

    try:
        major, minor, patch = (int(part) for part in target_version[1:].split("."))
    except ValueError:
        return False

    return (major, minor, patch) <= (0, 3, 0)


def parse_open_checklist_items(ticket_path: Path) -> list[dict]:
    items = []
    current_section = "document"
    in_code_block = False

    for line in read_text(ticket_path).splitlines():
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue
        if stripped.startswith("## "):
            current_section = stripped[3:].strip()
            continue
        if not stripped.startswith("- [ ] "):
            continue

        items.append(
            {
                "section": current_section,
                "text": stripped[6:].strip(),
            }
        )

    return items


def collect_tickets(directory: Path, repo_root: Path) -> list[dict]:
    return [
        parse_ticket(ticket_path, repo_root)
        for ticket_path in sorted(directory.glob("TKT-*.md"))
    ]


def collect_started_tickets(directory: Path, repo_root: Path) -> list[dict]:
    tickets = []
    for ticket_path in sorted(directory.glob("TKT-*.md")):
        ticket = parse_ticket(ticket_path, repo_root)
        if not relevant_target_version(ticket["targetVersion"]):
            continue

        open_checklist_items = parse_open_checklist_items(ticket_path)
        ticket["openChecklistItems"] = open_checklist_items
        ticket["hasOpenChecklistItems"] = bool(open_checklist_items)
        tickets.append(ticket)

    return tickets


def latest_history_paths(history_dir: Path, repo_root: Path, limit: int = 3) -> list[str]:
    candidates = [
        path for path in history_dir.glob("*.md") if path.name.lower() != "readme.md"
    ]
    latest = sorted(candidates, key=lambda path: path.stat().st_mtime, reverse=True)[:limit]
    return [path.relative_to(repo_root).as_posix() for path in latest]


def discover_git_executable() -> str | None:
    bundled = shutil.which("git")
    if bundled:
        return bundled

    windows_candidates = [
        Path(r"C:\Program Files\Git\cmd\git.exe"),
        Path(r"C:\Program Files\Git\bin\git.exe"),
    ]
    for candidate in windows_candidates:
        if candidate.exists():
            return str(candidate)

    return None


def discover_command_executable(command_name: str, windows_candidates: list[Path] | None = None) -> str | None:
    bundled = shutil.which(command_name)
    if bundled:
        return bundled

    for candidate in windows_candidates or []:
        if candidate.exists():
            return str(candidate)

    return None


def run_git_command(repo_root: Path, git_executable: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [git_executable, *args],
        cwd=repo_root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )


def parse_git_status_branch(status_line: str) -> dict:
    details = {
        "branch": "unknown",
        "tracking": None,
        "ahead": 0,
        "behind": 0,
    }

    normalized = status_line.removeprefix("## ").strip()
    branch_segment, separator, tracking_segment = normalized.partition("...")
    if branch_segment:
        details["branch"] = branch_segment.strip()

    if not separator:
        return details

    tracking_part = tracking_segment.strip()
    if "[" in tracking_part:
        tracking_name, _, relation_part = tracking_part.partition("[")
        details["tracking"] = tracking_name.strip() or None
        relation_part = relation_part.rstrip("]").strip()
        for relation in relation_part.split(","):
            relation = relation.strip()
            if relation.startswith("ahead "):
                details["ahead"] = int(relation.split(" ", 1)[1])
            if relation.startswith("behind "):
                details["behind"] = int(relation.split(" ", 1)[1])
    else:
        details["tracking"] = tracking_part or None

    return details


def summarize_git_changes(status_lines: list[str]) -> dict:
    counts = {
        "modified": 0,
        "added": 0,
        "deleted": 0,
        "renamed": 0,
        "copied": 0,
        "unmerged": 0,
        "untracked": 0,
        "other": 0,
    }
    sample_paths = []

    for line in status_lines:
        code = line[:2]
        path = line[3:].strip() if len(line) > 3 else ""
        if len(sample_paths) < 10 and path:
            sample_paths.append(path)

        if code == "??":
            counts["untracked"] += 1
            continue
        if "U" in code or code in {"AA", "DD"}:
            counts["unmerged"] += 1
            continue
        if "R" in code:
            counts["renamed"] += 1
            continue
        if "C" in code:
            counts["copied"] += 1
            continue
        if "D" in code:
            counts["deleted"] += 1
            continue
        if "A" in code:
            counts["added"] += 1
            continue
        if "M" in code:
            counts["modified"] += 1
            continue

        counts["other"] += 1

    return {
        "totalChanges": len(status_lines),
        "changeCounts": counts,
        "samplePaths": sample_paths,
    }


def collect_git_status(repo_root: Path) -> dict:
    git_executable = discover_git_executable()
    if not git_executable:
        return {
            "available": False,
            "executable": None,
            "branch": None,
            "tracking": None,
            "ahead": 0,
            "behind": 0,
            "dirty": None,
            "statusLine": None,
            "totalChanges": 0,
            "changeCounts": {},
            "samplePaths": [],
            "error": "git executable not found",
        }

    version_result = run_git_command(repo_root, git_executable, "--version")
    status_result = run_git_command(repo_root, git_executable, "status", "--short", "--branch")
    if status_result.returncode != 0:
        return {
            "available": False,
            "executable": git_executable,
            "branch": None,
            "tracking": None,
            "ahead": 0,
            "behind": 0,
            "dirty": None,
            "statusLine": None,
            "totalChanges": 0,
            "changeCounts": {},
            "samplePaths": [],
            "error": status_result.stderr.strip() or status_result.stdout.strip() or "git status failed",
        }

    lines = [line for line in status_result.stdout.splitlines() if line.strip()]
    status_line = lines[0] if lines else ""
    branch_details = parse_git_status_branch(status_line) if status_line else {}
    change_summary = summarize_git_changes(lines[1:]) if len(lines) > 1 else summarize_git_changes([])

    return {
        "available": True,
        "executable": git_executable,
        "version": version_result.stdout.strip() or version_result.stderr.strip() or None,
        "branch": branch_details.get("branch"),
        "tracking": branch_details.get("tracking"),
        "ahead": branch_details.get("ahead", 0),
        "behind": branch_details.get("behind", 0),
        "dirty": bool(lines[1:]),
        "statusLine": status_line.removeprefix("## ").strip() if status_line else None,
        "totalChanges": change_summary["totalChanges"],
        "changeCounts": change_summary["changeCounts"],
        "samplePaths": change_summary["samplePaths"],
        "error": None,
    }


def run_command(repo_root: Path, executable: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [executable, *args],
        cwd=repo_root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )


def collect_toolchain_status(repo_root: Path) -> dict:
    tool_specs = [
        {
            "name": "java",
            "args": ["-version"],
            "windowsCandidates": [],
        },
        {
            "name": "mvn",
            "args": ["-version"],
            "windowsCandidates": [],
        },
        {
            "name": "docker",
            "args": ["--version"],
            "windowsCandidates": [],
        },
    ]

    status = {}
    for spec in tool_specs:
        executable = discover_command_executable(
            spec["name"],
            spec.get("windowsCandidates"),
        )
        if not executable:
            status[spec["name"]] = {
                "available": False,
                "executable": None,
                "version": None,
                "error": f"{spec['name']} executable not found",
            }
            continue

        result = run_command(repo_root, executable, *spec["args"])
        if result.returncode != 0:
            status[spec["name"]] = {
                "available": False,
                "executable": executable,
                "version": None,
                "error": result.stderr.strip() or result.stdout.strip() or f"{spec['name']} command failed",
            }
            continue

        version_text = result.stdout.strip() or result.stderr.strip() or None
        status[spec["name"]] = {
            "available": True,
            "executable": executable,
            "version": version_text,
            "error": None,
        }

    return status


def extract_started_gate_blockers(started_tickets: list[dict]) -> list[dict]:
    blockers = []
    for ticket in started_tickets:
        for item in ticket.get("openChecklistItems", []):
            blockers.append(
                {
                    "ticketId": ticket["id"],
                    "ticketTitle": ticket["title"],
                    "targetVersion": ticket["targetVersion"],
                    "path": ticket["path"],
                    "section": item["section"],
                    "text": item["text"],
                }
            )
    return blockers


def build_blocking_issues(
    started_gate_blockers: list[dict],
    toolchain_status: dict,
    git_status: dict,
) -> list[dict]:
    issues = []

    for blocker in started_gate_blockers:
        issue = {
            "ticketId": blocker["ticketId"],
            "section": blocker["section"],
            "text": blocker["text"],
            "category": "checklist",
            "reasons": [],
        }

        blocker_text = blocker["text"]
        if "Java/Maven" in blocker_text:
            java_status = toolchain_status.get("java", {})
            mvn_status = toolchain_status.get("mvn", {})
            if not java_status.get("available", False):
                issue["reasons"].append("java unavailable")
            if not mvn_status.get("available", False):
                issue["reasons"].append("mvn unavailable")
        elif "Docker build" in blocker_text:
            docker_status = toolchain_status.get("docker", {})
            if not docker_status.get("available", False):
                issue["reasons"].append("docker unavailable")
        elif "Git branch/diff" in blocker_text:
            if git_status.get("available") is False:
                issue["reasons"].append("git unavailable")
            else:
                if git_status.get("dirty"):
                    issue["reasons"].append("working tree dirty")
                if (git_status.get("behind") or 0) > 0:
                    issue["reasons"].append(f"behind {git_status['behind']}")

        issues.append(issue)

    if git_status.get("available") and git_status.get("dirty"):
        issues.append(
            {
                "ticketId": None,
                "section": "gitStatus",
                "text": "로컬 작업 트리에 변경이 남아 있다",
                "category": "environment",
                "reasons": [
                    f"dirty changes={git_status.get('totalChanges', 0)}",
                    f"branch={git_status.get('branch')}",
                ],
            }
        )

    return issues


def format_powershell_invocation(executable: str, *args: str) -> str:
    escaped = executable.replace("'", "''")
    quoted_args = " ".join(args)
    return f"& '{escaped}' {quoted_args}".strip()


def add_command(
    commands: list[dict],
    label: str,
    command: str,
    runnable: bool,
    reason: str | None = None,
) -> None:
    entry = {
        "label": label,
        "command": command,
        "runnable": runnable,
    }
    if reason:
        entry["reason"] = reason
    commands.append(entry)


def build_next_commands(
    started_gate_blockers: list[dict],
    toolchain_status: dict,
    git_status: dict,
) -> list[dict]:
    commands: list[dict] = []
    seen_labels: set[str] = set()

    def push(label: str, command: str, runnable: bool, reason: str | None = None) -> None:
        if label in seen_labels:
            return
        seen_labels.add(label)
        add_command(commands, label, command, runnable, reason)

    for blocker in started_gate_blockers:
        blocker_text = blocker["text"]

        if "Java/Maven" in blocker_text:
            java_info = toolchain_status.get("java", {})
            mvn_info = toolchain_status.get("mvn", {})
            java_available = java_info.get("available", False)
            mvn_available = mvn_info.get("available", False)

            push(
                "java version",
                format_powershell_invocation(java_info["executable"], "-version")
                if java_available and java_info.get("executable")
                else "java -version",
                java_available,
                None if java_available else java_info.get("error"),
            )
            push(
                "maven version",
                format_powershell_invocation(mvn_info["executable"], "-version")
                if mvn_available and mvn_info.get("executable")
                else "mvn -version",
                mvn_available,
                None if mvn_available else mvn_info.get("error"),
            )
            push(
                "gateway maven package",
                "Set-Location gateway\nmvn -q -DskipTests package",
                mvn_available,
                None if mvn_available else "mvn executable not found",
            )

        if "Docker build" in blocker_text:
            docker_info = toolchain_status.get("docker", {})
            docker_available = docker_info.get("available", False)
            push(
                "docker version",
                format_powershell_invocation(docker_info["executable"], "--version")
                if docker_available and docker_info.get("executable")
                else "docker --version",
                docker_available,
                None if docker_available else docker_info.get("error"),
            )
            push(
                "gateway docker build",
                "docker build -t workaround-gateway:local gateway",
                docker_available,
                None if docker_available else "docker executable not found",
            )

        if "Git branch/diff" in blocker_text:
            git_available = git_status.get("available", False)
            push(
                "git status",
                format_powershell_invocation(
                    git_status["executable"],
                    "status",
                    "--short",
                    "--branch",
                )
                if git_available and git_status.get("executable")
                else "git status --short --branch",
                git_available,
                None if git_available else git_status.get("error"),
            )

    if git_status.get("available", False):
        push(
            "git status",
            format_powershell_invocation(
                git_status["executable"],
                "status",
                "--short",
                "--branch",
            ),
            True,
        )

    push(
        "heartbeat once",
        "powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/run-heartbeat.ps1 -Once",
        True,
    )

    return commands


def choose_next_action(
    need_review_tickets: list[dict],
    started_gate_blockers: list[dict],
    backlog_tickets: list[dict],
    toolchain_status: dict,
) -> str:
    if started_gate_blockers:
        blocker = started_gate_blockers[0]
        blocker_text = blocker["text"]
        if "Java/Maven" in blocker_text:
            java_available = toolchain_status.get("java", {}).get("available", False)
            mvn_available = toolchain_status.get("mvn", {}).get("available", False)
            if not java_available or not mvn_available:
                return (
                    f"started 게이트 {blocker['ticketId']} 미완료: {blocker_text} "
                    f"(java={java_available}, mvn={mvn_available})"
                )
        if "Docker build" in blocker_text:
            docker_available = toolchain_status.get("docker", {}).get("available", False)
            if not docker_available:
                return (
                    f"started 게이트 {blocker['ticketId']} 미완료: {blocker_text} "
                    f"(docker={docker_available})"
                )
        return f"started 게이트 {blocker['ticketId']} 미완료: {blocker_text}"

    if need_review_tickets:
        return "need_review 티켓 검토 필요"

    if backlog_tickets:
        top = backlog_tickets[0]
        return f"다음 후보 {top['id']} {top['title']}"

    return "진행 가능한 infra/v0.3.0 이하 티켓 없음"


def build_report(config: HeartbeatConfig) -> dict:
    docs_dir = config.repo_root / "docs"
    board_counts = parse_board_counts(docs_dir / "tickets" / "board.md")
    roadmap_window = parse_roadmap_window(docs_dir / "roadmap.md")
    git_status = collect_git_status(config.repo_root)
    toolchain_status = collect_toolchain_status(config.repo_root)
    need_review_tickets = collect_tickets(
        docs_dir / "tickets" / "need_review",
        config.repo_root,
    )
    backlog_tickets = [
        ticket
        for ticket in collect_tickets(docs_dir / "tickets" / "backlog", config.repo_root)
        if relevant_target_version(ticket["targetVersion"])
        and ticket["progressDecision"] == "진행 가능"
    ]
    started_tickets = collect_started_tickets(
        docs_dir / "tickets" / "started",
        config.repo_root,
    )
    started_gate_blockers = extract_started_gate_blockers(started_tickets)
    blocking_issues = build_blocking_issues(
        started_gate_blockers,
        toolchain_status,
        git_status,
    )
    next_commands = build_next_commands(
        started_gate_blockers,
        toolchain_status,
        git_status,
    )

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "board": board_counts,
        "roadmap": roadmap_window,
        "gitStatus": git_status,
        "toolchainStatus": toolchain_status,
        "latestHistory": latest_history_paths(docs_dir / "history", config.repo_root),
        "needReviewTickets": need_review_tickets,
        "activeBacklogUpToV030": backlog_tickets,
        "startedTickets": started_tickets,
        "startedGateBlockers": started_gate_blockers,
        "blockingIssues": blocking_issues,
        "nextCommands": next_commands,
        "reviewReady": bool(need_review_tickets),
        "nextAction": choose_next_action(
            need_review_tickets,
            started_gate_blockers,
            backlog_tickets,
            toolchain_status,
        ),
    }


def emit_report(report: dict, log_path: Path | None) -> None:
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    if hasattr(sys.stdout, "buffer"):
        sys.stdout.buffer.write(rendered.encode("utf-8"))
        sys.stdout.buffer.write(b"\n")
        sys.stdout.flush()
    else:
        print(rendered, flush=True)

    if not log_path:
        return

    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(report, ensure_ascii=False))
        handle.write("\n")


def run(config: HeartbeatConfig) -> None:
    while True:
        report = build_report(config)
        emit_report(report, config.log_path)
        if config.once:
            return
        time.sleep(config.interval_seconds)


def main() -> None:
    config = parse_args()
    try:
        run(config)
    except KeyboardInterrupt:
        print("orchestrator heartbeat stopped")


if __name__ == "__main__":
    main()






