from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from .check import check_now
from .db import save_check, start_db
from .medline import search_topics


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
app = Flask(__name__, static_folder=str(DIST), static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024


def _bounded_text(value, limit):
    """Accept only short text fields so requests cannot store arbitrary payloads."""
    if not isinstance(value, str):
        return ""
    return value.strip()[:limit]


@app.post("/api/check")
def check():
    form = request.get_json(silent=True)
    if not isinstance(form, dict):
        return jsonify({"error": "أرسل بيانات بصيغة JSON."}), 400

    symptoms = _bounded_text(form.get("symptoms"), 4000)
    if not symptoms:
        return jsonify({"error": "اكتب الأعراض أولاً."}), 400

    form = {
        "symptoms": symptoms,
        "history": _bounded_text(form.get("history"), 2000),
        "allergies": _bounded_text(form.get("allergies"), 1000),
        "days": _bounded_text(form.get("days"), 20),
        "severity": _bounded_text(form.get("severity"), 20),
        "lang": form.get("lang") if form.get("lang") in {"ar", "fr", "en"} else "ar",
    }
    answer = check_now(form)
    save_check(
        "high" if answer["danger"] else "low",
        len(answer["cases"]),
        form["lang"],
        len(answer["matchedSymptoms"]),
    )
    if not answer["cases"]:
        answer["liveSources"] = search_topics(symptoms)
    return jsonify(answer)


@app.get("/api/medical-search")
def medical_search():
    query = _bounded_text(request.args.get("q", ""), 160)
    if not query:
        return jsonify({"items": []})
    return jsonify({"items": search_topics(query)})


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "name": "نبض", "data": "MedlinePlus + Disease Ontology metadata"})


@app.get("/")
def home():
    return send_from_directory(DIST, "index.html")


@app.get("/<path:name>")
def files(name):
    return send_from_directory(DIST, name)


if __name__ == "__main__":
    start_db()
    app.run(host="127.0.0.1", port=5000, debug=False)
