import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


FILE = Path(__file__).resolve().parent.parent / "data" / "nabd.sqlite3"
DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "medical_data.json"


def open_db():
    FILE.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(FILE)
    db.row_factory = sqlite3.Row
    return db


def start_db():
    with open_db() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS medical_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                url TEXT NOT NULL,
                license TEXT NOT NULL,
                refresh_note TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS medical_symptoms (
                id TEXT PRIMARY KEY,
                labels TEXT NOT NULL,
                terms TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS medical_conditions (
                id TEXT PRIMARY KEY,
                names TEXT NOT NULL,
                source_name TEXT NOT NULL,
                source_url TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS condition_symptoms (
                condition_id TEXT NOT NULL,
                symptom_id TEXT NOT NULL,
                PRIMARY KEY (condition_id, symptom_id)
            );
            CREATE TABLE IF NOT EXISTS checks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                risk TEXT NOT NULL,
                result_count INTEGER NOT NULL,
                language TEXT NOT NULL,
                matched_count INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS source_cache (
                cache_key TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                saved_at TEXT NOT NULL
            );
        """)
        sync_data(db)


def sync_data(db=None):
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    own_db = db is None
    db = db or open_db()
    for source in data["sources"]:
        db.execute(
            "INSERT OR REPLACE INTO medical_sources (name, url, license, refresh_note) VALUES (?, ?, ?, ?)",
            (source["name"], source["url"], source["license"], source["refresh"]),
        )
    for item in data["symptoms"]:
        db.execute(
            "INSERT OR REPLACE INTO medical_symptoms (id, labels, terms) VALUES (?, ?, ?)",
            (item["id"], json.dumps(item["labels"], ensure_ascii=False), json.dumps(item["terms"], ensure_ascii=False)),
        )
    for condition in data["conditions"]:
        db.execute(
            "INSERT OR REPLACE INTO medical_conditions (id, names, source_name, source_url) VALUES (?, ?, ?, ?)",
            (condition["id"], json.dumps(condition["names"], ensure_ascii=False), condition["source"]["name"], condition["source"]["url"]),
        )
        db.execute("DELETE FROM condition_symptoms WHERE condition_id = ?", (condition["id"],))
        db.executemany(
            "INSERT OR IGNORE INTO condition_symptoms (condition_id, symptom_id) VALUES (?, ?)",
            [(condition["id"], symptom_id) for symptom_id in condition["symptoms"]],
        )
    if own_db:
        db.commit()
        db.close()


def save_check(risk, result_count, language, matched_count):
    with open_db() as db:
        db.execute(
            "INSERT INTO checks (created_at, risk, result_count, language, matched_count) VALUES (?, ?, ?, ?, ?)",
            (datetime.now(timezone.utc).isoformat(), risk, result_count, language, matched_count),
        )


def get_cache(key, max_age_hours=24):
    with open_db() as db:
        row = db.execute("SELECT payload, saved_at FROM source_cache WHERE cache_key = ?", (key,)).fetchone()
    if not row:
        return None
    saved = datetime.fromisoformat(row["saved_at"])
    age = datetime.now(timezone.utc) - saved
    if age.total_seconds() > max_age_hours * 3600:
        return None
    return json.loads(row["payload"])


def put_cache(key, payload):
    with open_db() as db:
        db.execute(
            "INSERT OR REPLACE INTO source_cache (cache_key, payload, saved_at) VALUES (?, ?, ?)",
            (key, json.dumps(payload, ensure_ascii=False), datetime.now(timezone.utc).isoformat()),
        )
