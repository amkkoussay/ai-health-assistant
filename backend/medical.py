import json
import re
from pathlib import Path


DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "medical_data.json"


def load_data():
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def clean(text):
    return re.sub(r"\s+", " ", str(text or "").strip().lower())


def find_ids(text, data):
    value = clean(text)
    found = []
    for item in data["symptoms"]:
        terms = [term for words in item["terms"].values() for term in words]
        if any(clean(term) in value for term in terms):
            found.append(item["id"])
    return found


def check_now(form):
    data = load_data()
    text = " ".join([
        str(form.get("symptoms", "")),
        str(form.get("history", "")),
        str(form.get("allergies", "")),
    ])
    found = find_ids(text, data)
    danger_ids = {"shortness-of-breath", "chest-pain", "fainting", "severe-bleeding", "sudden-weakness", "confusion", "facial-swelling"}
    lang = form.get("lang", "ar") if form.get("lang") in {"ar", "fr", "en"} else "ar"
    symptoms = {item["id"]: item for item in data["symptoms"]}
    cases = []

    for condition in data["conditions"]:
        matched = [item for item in condition["symptoms"] if item in found]
        if not matched:
            continue
        coverage = round(len(matched) / len(condition["symptoms"]), 2)
        score = round((coverage * 0.75) + (float(condition.get("prior", 0.5)) * 0.25), 2)
        cases.append({
            "id": condition["id"],
            "name": condition["names"][lang],
            "level": "likely" if score >= 0.62 else "possible",
            "tone": "green" if score >= 0.62 else "orange",
            "matched": [symptoms[item]["labels"][lang] for item in matched],
            "coverage": coverage,
            "score": score,
            "source": condition["source"],
        })

    cases.sort(key=lambda item: (-item["score"], item["name"]))
    return {
        "danger": bool(danger_ids.intersection(found)),
        "dangerSymptoms": [symptoms[item]["labels"][lang] for item in found if item in danger_ids],
        "matchedSymptoms": [symptoms[item]["labels"][lang] for item in found],
        "cases": cases[:4],
        "meta": {"duration": form.get("days") or None, "severity": form.get("severity") or None},
        "source": {"name": "MedlinePlus", "url": "https://medlineplus.gov/about/developers/webservices/", "version": data["version"]},
    }
