from backend.app import app
from backend.db import start_db


if __name__ == "__main__":
    start_db()
    app.run(host="127.0.0.1", port=5000, debug=False)
