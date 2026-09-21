#!/usr/bin/env python3
"""打一份给同事用的运行包（不含 git、src、node_modules、DSH 源码）。"""
from __future__ import annotations

import json
import subprocess
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "dist"
ZIP_NAME = "meeting-brain.zip"

ALLOW_FILES = ("package.json", "package-lock.json", "README.md")
ALLOW_DIRS = ("server", "lib", "public", "scripts")
SKIP_DIR_NAMES = {"node_modules", ".git", "__pycache__", "dist"}
SKIP_FILE_NAMES = {".DS_Store", "lib/client.js", "scripts/start.command"}
SKIP_SUFFIXES = {".log"}


def git_short() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return ""


def git_repo() -> str:
    try:
        url = subprocess.check_output(
            ["git", "remote", "get-url", "origin"],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return "lin927/meeting-brain-dashboard"
    url = url.replace("git@github.com:", "").replace("https://github.com/", "").replace("ssh://git@github.com/", "")
    if url.endswith(".git"):
        url = url[:-4]
    url = url.strip("/")
    parts = [p for p in url.split("/") if p]
    if len(parts) >= 2:
        return parts[-2] + "/" + parts[-1]
    return "lin927/meeting-brain-dashboard"


def should_skip(rel: Path) -> bool:
    parts = rel.parts
    if any(p in SKIP_DIR_NAMES for p in parts):
        return True
    if rel.name in {".DS_Store"}:
        return True
    if rel.suffix in SKIP_SUFFIXES:
        return True
    if str(rel).replace("\\", "/") in SKIP_FILE_NAMES:
        return True
    if rel.name.startswith("pack.") and rel.parent.name == "scripts":
        return True
    return False


def iter_files():
    for name in ALLOW_FILES:
        p = ROOT / name
        if p.is_file():
            yield p, Path(name)
    for dirname in ALLOW_DIRS:
        base = ROOT / dirname
        if not base.is_dir():
            continue
        for p in base.rglob("*"):
            if not p.is_file():
                continue
            rel = p.relative_to(ROOT)
            if should_skip(rel):
                continue
            yield p, rel


def main() -> None:
    pkg = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    release = {
        "name": "meeting-brain",
        "version": pkg.get("version") or "0.0.0",
        "git": git_short(),
        "repo": git_repo(),
        "channel": "zip",
        "packedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = OUT_DIR / ZIP_NAME
    rel_path = OUT_DIR / "release.json"
    rel_text = json.dumps(release, ensure_ascii=False, indent=2) + "\n"
    rel_path.write_text(rel_text, encoding="utf-8")
    if zip_path.exists():
        zip_path.unlink()
    count = 0
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("release.json", rel_text)
        count += 1
        for src, rel in iter_files():
            zf.write(src, rel.as_posix())
            count += 1
    kb = zip_path.stat().st_size / 1024
    print(f"已打包 {zip_path}  （{count} 个文件，{kb:.0f} KB）")
    print("发给同事：解压后运行 scripts/install.sh 或 scripts/install.ps1")
    print(f"版本 {release['version']}  {release['git'] or '（无 git）'}")


if __name__ == "__main__":
    main()
