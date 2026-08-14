import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.check import check_now


def test_common_symptoms():
    answer = check_now({"lang": "ar", "symptoms": "حمى، سعال، تعب", "days": "3", "severity": "moderate"})
    assert answer["danger"] is False
    assert len(answer["cases"]) >= 1
    assert answer["cases"][0]["source"]["name"] == "MedlinePlus"


def test_danger_wins():
    answer = check_now({"lang": "ar", "symptoms": "سعال وألم صدر وضيق تنفس", "days": "1", "severity": "severe"})
    assert answer["danger"] is True
    assert len(answer["dangerSymptoms"]) >= 2


def test_french_results():
    answer = check_now({"lang": "fr", "symptoms": "fièvre, toux et fatigue", "days": "2", "severity": "moderate"})
    assert answer["cases"][0]["name"] == "Grippe" or answer["cases"][0]["name"] == "Rhume courant"


if __name__ == "__main__":
    test_common_symptoms()
    test_danger_wins()
    print("Python checks passed")
