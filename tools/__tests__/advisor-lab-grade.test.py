"""advisor-lab-grade.py / advisor-lab-review.py 단위 테스트.
실행: python3 tools/__tests__/advisor-lab-grade.test.py  (파일명에 하이픈이 있어 -m unittest·discover 는 못 쓴다)
"""
import importlib.util
import io
import json
import os
import tempfile
import unittest
import urllib.error
from contextlib import redirect_stdout

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), os.path.join(HERE, "..", name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


grade = load("advisor-lab-grade")
review = load("advisor-lab-review")

PASS_XML = """<testsuite name="com.x.AppTest" tests="2"><testcase classname="com.x.AppTest" name="a"/><testcase classname="com.x.AppTest" name="b"/></testsuite>"""
FAIL_XML = """<testsuite name="com.x.AppTest" tests="4">
<testcase classname="com.x.AppTest" name="ok"/>
<testcase classname="com.x.AppTest" name="bad"><failure message="expected 1 but was 2" type="AssertionFailedError">trace</failure></testcase>
<testcase classname="com.x.AppTest" name="boom"><error message="%s" type="X">trace</error></testcase>
<testcase classname="com.x.AppTest" name="skip"><skipped/></testcase>
</testsuite>""" % ("e" * 500)
META = {"id": "m-01", "title": "제목", "level": "easy", "rubric": [{"name": "정확성", "weight": 50}], "requirements": ["하나"]}


def make_mission(root, xmls=None):
    d = os.path.join(root, "m-01")
    os.makedirs(os.path.join(d, ".advisor"))
    with open(os.path.join(d, ".advisor", "mission.json"), "w", encoding="utf-8") as f:
        json.dump(META, f, ensure_ascii=False)
    if xmls is not None:
        rep = os.path.join(d, "target", "surefire-reports")
        os.makedirs(rep)
        for i, x in enumerate(xmls):
            with open(os.path.join(rep, "TEST-%d.xml" % i), "w", encoding="utf-8") as f:
                f.write(x)
    return d


class GradeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def test_all_pass(self):
        r = grade.build_result(make_mission(self.tmp.name, [PASS_XML]), "abc", 0, now="T")
        self.assertEqual((r["compiled"], r["tests"], r["passed"], r["failed"], r["errors"], r["skipped"]), (True, 2, 2, 0, 0, 0))
        self.assertEqual((r["missionId"], r["level"], r["commit"], r["gradedAt"]), ("m-01", "easy", "abc", "T"))
        self.assertNotIn("buildTail", r)

    def test_failures_errors_skips_and_message_cut(self):
        r = grade.build_result(make_mission(self.tmp.name, [FAIL_XML]), "abc", 1)
        self.assertEqual((r["tests"], r["passed"], r["failed"], r["errors"], r["skipped"]), (4, 1, 1, 1, 1))
        self.assertTrue(r["compiled"])
        by = {c["name"]: c for c in r["cases"]}
        self.assertEqual(by["bad"]["status"], "failed")
        self.assertEqual(by["bad"]["message"], "expected 1 but was 2")
        self.assertEqual(len(by["boom"]["message"]), 300)

    def test_compile_failure_has_build_tail(self):
        d = make_mission(self.tmp.name)
        log = os.path.join(self.tmp.name, "mvn.log")
        with open(log, "w", encoding="utf-8") as f:
            f.write("\n".join("line %d" % i for i in range(100)) + "\n[ERROR] COMPILATION ERROR\n")
        r = grade.build_result(d, "abc", 1, log)
        self.assertFalse(r["compiled"])
        self.assertEqual((r["tests"], r["passed"]), (0, 0))
        self.assertEqual(len(r["buildTail"].splitlines()), 40)
        self.assertIn("COMPILATION ERROR", r["buildTail"])

    def test_cli_writes_result_and_summary(self):
        d = make_mission(self.tmp.name, [PASS_XML])
        summ = os.path.join(self.tmp.name, "sum.md")
        with redirect_stdout(io.StringIO()):
            self.assertEqual(grade.main(["--mission-dir", d, "--commit", "c", "--summary", summ]), 0)
        r = json.load(open(os.path.join(d, ".grade", "result.json"), encoding="utf-8"))
        self.assertEqual(r["passed"], 2)
        self.assertIn("| m-01 | easy | O | 2/2 |", open(summ, encoding="utf-8").read())


class ReviewTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = make_mission(self.tmp.name, [PASS_XML])
        src = os.path.join(self.dir, "src", "main", "java")
        os.makedirs(src)
        for n, size in (("A.java", 40 * 1024), ("B.java", 30 * 1024), ("C.java", 100)):
            with open(os.path.join(src, n), "w", encoding="utf-8") as f:
                f.write("x" * size)
        os.makedirs(os.path.join(self.dir, ".grade"))
        json.dump(grade.build_result(self.dir, "c", 0), open(os.path.join(self.dir, ".grade", "result.json"), "w"))
        self.changed = os.path.join(self.tmp.name, "changed.txt")
        with open(self.changed, "w") as f:
            f.write("\n".join("labs/advisor/m-01/src/main/java/%s" % n for n in ("A.java", "B.java", "C.java")) +
                    "\nlabs/advisor/m-01/src/test/java/T.java\nlabs/advisor/other/src/main/java/Z.java\n")

    def test_collect_respects_budget_and_scope(self):
        files, skipped = review.collect_files(self.dir, "m-01", open(self.changed).read().splitlines())
        self.assertEqual([r.rsplit("/", 1)[1] for r, _ in files], ["A.java", "C.java"])  # B(30KB) 는 60KB 상한 초과
        self.assertEqual([s.rsplit("/", 1)[1] for s in skipped], ["B.java"])

    def test_unsafe_paths_are_dropped(self):
        outside = os.path.join(self.tmp.name, "outside")
        os.makedirs(outside)
        with open(os.path.join(outside, "secret.txt"), "w") as f:
            f.write("SECRET")
        link = os.path.join(self.dir, "src", "main", "java", "evil")
        os.symlink(outside, link)  # 디렉터리 심볼릭 링크 -> mission 밖
        os.symlink(os.path.join(outside, "secret.txt"), os.path.join(self.dir, "src", "main", "java", "file-link.java"))
        base = "labs/advisor/m-01/src/main/"
        bad = [
            base + "../../../../../../../../proc/self/environ",
            base + "java/../../../../pom.xml",
            "/etc/passwd",
            base + "java//A.java",
            base + "java/evil/secret.txt",
            base + "java/file-link.java",
        ]
        files, _ = review.collect_files(self.dir, "m-01", bad + [base + "java/C.java"])
        self.assertEqual([r.rsplit("/", 1)[1] for r, _ in files], ["C.java"])
        self.assertNotIn("SECRET", "".join(t for _, t in files))

    def test_dry_run_makes_no_call_and_needs_no_key(self):
        def boom(*a, **k):
            raise AssertionError("네트워크 호출 금지")
        buf = io.StringIO()
        os.environ.pop("ANTHROPIC_API_KEY", None)
        with redirect_stdout(buf):
            self.assertEqual(review.main(["--mission-dir", self.dir, "--changed-files", self.changed, "--dry-run"], opener=boom), 0)
        out = buf.getvalue()
        self.assertIn("프롬프트 길이:", out)
        self.assertIn("A.java", out)
        self.assertIn("claude-opus-5-5", out)
        self.assertFalse(os.path.exists(os.path.join(self.dir, ".grade", "review.md")))

    def test_no_key_skips(self):
        os.environ.pop("ANTHROPIC_API_KEY", None)
        buf = io.StringIO()
        with redirect_stdout(buf):
            review.main(["--mission-dir", self.dir, "--changed-files", self.changed])
        self.assertIn("키 없음", buf.getvalue())
        self.assertFalse(os.path.exists(os.path.join(self.dir, ".grade", "review.md")))

    def test_request_shape_and_key_not_leaked(self):
        seen = {}

        class Resp(io.BytesIO):
            def __enter__(self): return self
            def __exit__(self, *a): return False

        def opener(req, timeout=None):
            seen["req"] = req
            return Resp(json.dumps({"content": [{"type": "text", "text": "## 총평\n좋음"}], "stop_reason": "end_turn"}).encode())

        os.environ["ANTHROPIC_API_KEY"] = "TEST-KEY-NOT-REAL"
        os.environ["ADVISOR_REVIEW_MODEL"] = "claude-test-model"
        try:
            buf = io.StringIO()
            with redirect_stdout(buf):
                review.main(["--mission-dir", self.dir, "--changed-files", self.changed], opener=opener)
        finally:
            os.environ.pop("ANTHROPIC_API_KEY"); os.environ.pop("ADVISOR_REVIEW_MODEL")
        req = seen["req"]
        self.assertEqual(req.full_url, "https://api.anthropic.com/v1/messages")
        h = {k.lower(): v for k, v in req.header_items()}
        self.assertEqual(h["x-api-key"], "TEST-KEY-NOT-REAL")
        self.assertIn("anthropic-version", h)
        self.assertEqual(h["anthropic-beta"], "server-side-fallback-2026-07-01")
        body = json.loads(req.data)
        self.assertEqual(body["model"], "claude-test-model")
        self.assertNotIn("temperature", body)
        self.assertEqual(body["fallbacks"], "default")
        self.assertEqual(body["messages"][0]["role"], "user")
        text = open(os.path.join(self.dir, ".grade", "review.md"), encoding="utf-8").read()
        self.assertIn("총평", text)
        self.assertNotIn("TEST-KEY", text + buf.getvalue() + req.data.decode())

    def test_http_error_writes_code_only(self):
        def opener(req, timeout=None):
            raise urllib.error.HTTPError(req.full_url, 529, "overloaded", {}, io.BytesIO(b"secret-body"))
        os.environ["ANTHROPIC_API_KEY"] = "k"
        try:
            with redirect_stdout(io.StringIO()):
                review.main(["--mission-dir", self.dir, "--changed-files", self.changed], opener=opener)
        finally:
            os.environ.pop("ANTHROPIC_API_KEY")
        self.assertEqual(open(os.path.join(self.dir, ".grade", "review.md"), encoding="utf-8").read().strip(), "리뷰 실패: 529")


if __name__ == "__main__":
    unittest.main()
