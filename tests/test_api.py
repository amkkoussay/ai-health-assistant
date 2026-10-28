import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.app import app


def test_check_rejects_non_object_payload():
    response = app.test_client().post("/api/check", json=["unexpected"])
    assert response.status_code == 400


def test_check_rejects_missing_symptoms():
    response = app.test_client().post("/api/check", json={"symptoms": "   "})
    assert response.status_code == 400


def test_check_bounds_text_and_normalizes_language(monkeypatch):
    captured = {}

    def fake_check(form):
        captured.update(form)
        return {
            "danger": False,
            "cases": [{"id": "example"}],
            "matchedSymptoms": [],
        }

    monkeypatch.setattr("backend.app.check_now", fake_check)
    monkeypatch.setattr("backend.app.save_check", lambda *args: None)

    response = app.test_client().post(
        "/api/check",
        json={
            "symptoms": "s" * 5000,
            "history": "h" * 3000,
            "allergies": "a" * 2000,
            "days": "d" * 100,
            "severity": "x" * 100,
            "lang": "unsupported",
        },
    )

    assert response.status_code == 200
    assert len(captured["symptoms"]) == 4000
    assert len(captured["history"]) == 2000
    assert len(captured["allergies"]) == 1000
    assert len(captured["days"]) == 20
    assert len(captured["severity"]) == 20
    assert captured["lang"] == "ar"


def test_medical_search_rejects_empty_query(monkeypatch):
    monkeypatch.setattr("backend.app.search_topics", lambda query: (_ for _ in ()).throw(AssertionError()))
    response = app.test_client().get("/api/medical-search?q=%20%20")
    assert response.status_code == 200
    assert response.get_json() == {"items": []}


# Natural phrasings that the old phrase-only index missed (audit 2026-10-22):
# each must now raise the emergency flag instead of returning a reassuring
# no-match. The curly-apostrophe case covers phone-keyboard input.
import pytest


@pytest.mark.parametrize(
    "symptoms,lang",
    [
        ("I can't breathe", "en"),
        ("I can’t breathe", "en"),
        ("I cannot breathe", "en"),
        ("I have difficulty breathing", "en"),
        ("my chest hurts a bit", "en"),
        ("I have severe chest pain", "en"),
        ("I am about to faint", "en"),
        ("I am bleeding heavily", "en"),
        ("لا أستطيع التنفس", "ar"),
        ("عندي ضيق في التنفس", "ar"),
        ("ألم شديد في الصدر", "ar"),
        ("نزيف حاد", "ar"),
    ],
)
def test_natural_emergency_phrasings_raise_danger(symptoms, lang):
    # The test client never runs run.py's start_db(), but the real /api/check
    # path calls save_check(), so initialise the schema the same way run.py does.
    from backend.db import start_db

    start_db()
    response = app.test_client().post(
        "/api/check", json={"symptoms": symptoms, "lang": lang}
    )
    assert response.status_code == 200
    assert response.get_json()["danger"] is True
