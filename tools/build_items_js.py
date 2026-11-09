#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""items.json -> items.js (window.ITEM_PHOTOS) so the site works from file:// too."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
data = json.loads((root / "site/assets/data/items.json").read_text(encoding="utf-8"))
out = root / "site/assets/js/items.js"
body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
out.write_text("window.ITEM_PHOTOS=" + body + ";\n", encoding="utf-8")
print("wrote", out, len(data), "items")
