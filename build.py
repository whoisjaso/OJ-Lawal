#!/usr/bin/env python3
"""Assemble site/*.html from src/partials + src/pages. No dependencies.

Each page in src/pages starts with a front-matter comment:
<!--
title: ...
description: ...
page: home
og: ribbon-1600.webp
-->
Tokens: {{title}} {{description}} {{page}} {{path}} {{og}}
        {{cur:key}}         -> aria-current="page" when key == page
"""
import re
from pathlib import Path

ROOT = Path.cwd()  # run from the project root (the folder holding src/ and site/)
SRC, OUT = ROOT / "src", ROOT / "site"
part = lambda n: (SRC / "partials" / f"{n}.html").read_text(encoding="utf-8")


def render(tpl, meta):
    tpl = re.sub(r"\{\{cur:(\w+)\}\}",
                 lambda m: ' aria-current="page"' if m.group(1) == meta["page"] else "", tpl)
    return re.sub(r"\{\{(\w+)\}\}", lambda m: meta.get(m.group(1), m.group(0)), tpl)


for page in sorted((SRC / "pages").glob("*.html")):
    raw = page.read_text(encoding="utf-8")
    fm = re.match(r"\s*<!--(.*?)-->", raw, re.S)
    meta = dict(re.findall(r"^\s*(\w+):\s*(.+?)\s*$", fm.group(1), re.M))
    meta.setdefault("og", "ribbon-1600.webp")
    meta["path"] = "" if page.stem == "index" else page.name
    body = raw[fm.end():]
    contract = re.match(r"\s*(<!--.*?-->)", body, re.S)  # direction contract travels to the top of <body>
    if contract:
        body = body[contract.end():]
    if "<main" not in body:
        body = '<main id="main">' + body + "</main>\n"
    html = render(part("head") + part("header") + body + part("footer"), meta)
    if contract:
        html = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + "\n" + contract.group(1), html, count=1)
    if page.stem == "404":  # served from arbitrary paths; anchor relative URLs at the root
        html = html.replace("<head>\n", '<head>\n<base href="/">\n', 1)
    (OUT / page.name).write_text(html, encoding="utf-8")
    print("built", page.name)
