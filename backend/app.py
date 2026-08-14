from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from .check import check_now
from .db import save_check, start_db
from .medline import search_topics


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
app = Flask(__name__, static_folder=str(DIST), static_url_path="")


@app.post("/api/check")
def check():
    form = request.get_json(silent=True) or {}
    if not str(form.get("symptoms", "")).strip():
        return jsonify({"error": "اكتب الأعراض أولاً."}), 400
    answer = check_now(form)
    save_check("high" if answer["danger"] else "low", len(answer["cases"]), form.get("lang", "ar"), len(answer["matchedSymptoms"]))
    if not answer["cases"]:
        answer["liveSources"] = search_topics(form.get("symptoms", ""))
    return jsonify(answer)


@app.get("/api/medical-search")
def medical_search():
    return jsonify({"items": search_topics(request.args.get("q", ""))})


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
    app.run(host="127.0.0.1", port=5000, debug=True)
