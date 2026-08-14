from .db import start_db
from .medical import load_data
from .medline import search_topics


def update():
    start_db()
    data = load_data()
    symptoms = {item["id"]: item for item in data["symptoms"]}
    count = 0
    for condition in data["conditions"]:
        query = " ".join(symptoms[item]["labels"]["en"] for item in condition["symptoms"])
        result = search_topics(query)
        count += len(result)
    print(f"Medical index ready: {len(data['conditions'])} conditions, {count} cached MedlinePlus results")


if __name__ == "__main__":
    update()
