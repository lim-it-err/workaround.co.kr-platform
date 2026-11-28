#!/usr/bin/env python3
"""Advisor 실습 채점: surefire 리포트 -> .grade/result.json (표준 라이브러리만)."""
import argparse
import datetime
import json
import os
import sys
import xml.etree.ElementTree as ET

MESSAGE_LIMIT = 300
TAIL_LINES = 40


def parse_surefire(reports_dir):
    """target/surefire-reports/*.xml -> 케이스 목록. 파싱 못 하는 파일은 건너뛴다."""
    cases = []
    if not os.path.isdir(reports_dir):
        return cases
    for name in sorted(os.listdir(reports_dir)):
        if not (name.startswith("TEST-") and name.endswith(".xml")):
            continue
        try:
            root = ET.parse(os.path.join(reports_dir, name)).getroot()
        except ET.ParseError:
            continue
        for tc in root.iter("testcase"):
            status, message = "passed", ""
            for tag, st in (("error", "error"), ("failure", "failed"), ("skipped", "skipped")):
                node = tc.find(tag)
                if node is not None:
                    status = st
                    message = (node.get("message") or node.text or "").strip()
                    break
            cases.append(
                {
                    "class": tc.get("classname") or root.get("name") or "",
                    "name": tc.get("name") or "",
                    "status": status,
                    "message": message[:MESSAGE_LIMIT],
                }
            )
    return cases


def tail_lines(path, n=TAIL_LINES):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return "".join(f.readlines()[-n:])
    except OSError:
        return ""


def build_result(mission_dir, commit, mvn_exit, build_log=None, now=None):
    meta_path = os.path.join(mission_dir, ".advisor", "mission.json")
    try:
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)
    except (OSError, ValueError):
        meta = {}
    cases = parse_surefire(os.path.join(mission_dir, "target", "surefire-reports"))
    log_tail = tail_lines(build_log) if build_log else ""
    # 테스트가 하나라도 돌았거나 mvn 이 0 으로 끝났으면 컴파일은 된 것. 컴파일 오류 문구가 있으면 아님.
    compiled = (bool(cases) or mvn_exit == 0) and "COMPILATION ERROR" not in log_tail
    count = lambda s: sum(1 for c in cases if c["status"] == s)
    result = {
        "missionId": meta.get("id") or os.path.basename(os.path.normpath(mission_dir)),
        "level": meta.get("level", ""),
        "commit": commit,
        "gradedAt": now or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "compiled": compiled,
        "tests": len(cases),
        "passed": count("passed"),
        "failed": count("failed"),
        "errors": count("error"),
        "skipped": count("skipped"),
        "cases": cases,
    }
    if not compiled:
        result["buildTail"] = log_tail
    return result


def summary_row(r):
    mark = "O" if r["compiled"] else "X"
    return "| %s | %s | %s | %d/%d | %d | %d | %d |\n" % (
        r["missionId"], r["level"] or "-", mark, r["passed"], r["tests"], r["failed"], r["errors"], r["skipped"],
    )


SUMMARY_HEADER = "| 미션 | 난이도 | 컴파일 | 통과/전체 | 실패 | 오류 | 건너뜀 |\n|---|---|---|---|---|---|---|\n"


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--mission-dir", required=True)
    p.add_argument("--commit", default="")
    p.add_argument("--mvn-exit", type=int, default=0)
    p.add_argument("--build-log")
    p.add_argument("--out-dir", help="기본: <mission-dir>/.grade")
    p.add_argument("--summary", help="표 한 줄을 덧붙일 파일 (예: $GITHUB_STEP_SUMMARY)")
    a = p.parse_args(argv)
    result = build_result(a.mission_dir, a.commit, a.mvn_exit, a.build_log)
    out = a.out_dir or os.path.join(a.mission_dir, ".grade")
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "result.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        f.write("\n")
    if a.summary:
        with open(a.summary, "a", encoding="utf-8") as f:
            f.write(summary_row(result))
    print("%s: %d/%d 통과 (컴파일 %s)" % (result["missionId"], result["passed"], result["tests"], "성공" if result["compiled"] else "실패"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
