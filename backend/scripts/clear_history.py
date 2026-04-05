"""Clear portfolio history collection to fix date format issues."""

import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from database import portfolio_history_collection


def main():
    result = portfolio_history_collection.delete_many({})
    print(f"Deleted {result.deleted_count} portfolio history records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
