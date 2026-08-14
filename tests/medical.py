from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.db import open_db, start_db


def test_database():
    start_db()
    with open_db() as db:
        sources = db.execute("SELECT COUNT(*) FROM medical_sources").fetchone()[0]
        symptoms = db.execute("SELECT COUNT(*) FROM medical_symptoms").fetchone()[0]
        conditions = db.execute("SELECT COUNT(*) FROM medical_conditions").fetchone()[0]
        links = db.execute("SELECT COUNT(*) FROM condition_symptoms").fetchone()[0]
    assert sources >= 2
    assert symptoms >= 10
    assert conditions >= 7
    assert links >= 20


if __name__ == "__main__":
    test_database()
    print("SQLite medical index passed")
