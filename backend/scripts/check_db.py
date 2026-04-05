"""Run from the `backend/` folder: `python scripts/check_db.py`"""

from __future__ import annotations

import sys
from pathlib import Path

# Script lives in backend/scripts/; add backend/ to path for `import database`
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from database import client, DATABASE_URL


def main() -> int:
    try:
        # Ping the MongoDB server
        client.admin.command('ping')
        print("Database connection OK:", DATABASE_URL)
        return 0
    except Exception as e:
        print("Database connection failed:", e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
