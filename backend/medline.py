import json
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

from .db import get_cache, put_cache
from .medical import find_ids, load_data


def english_query(text):
    data = load_data()
    found = find_ids(text, data)
    symptoms = {item["id"]: item for item in data["symptoms"]}
    labels = [symptoms[item]["labels"]["en"] for item in found]
    return " OR ".join(labels[:4])


def search_topics(text):
    term = english_query(text)
    if not term:
        return []
    key = f"medlineplus:{term}"
    cached = get_cache(key)
    if cached is not None:
        return cached
    query = urllib.parse.urlencode({
        "db": "healthTopics",
        "term": term,
        "retmax": "5",
        "rettype": "brief",
        "tool": "nabd_health_assistant",
    })
    url = f"https://wsearch.nlm.nih.gov/ws/query?{query}"
    request = urllib.request.Request(url, headers={"User-Agent": "nabd-health-assistant/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            root = ET.fromstring(response.read())
    except (OSError, ET.ParseError):
        return []

    items = []
    for document in root.findall(".//document"):
        values = {}
        for content in document.findall("content"):
            name = content.attrib.get("name")
            if name and name not in values:
                values[name] = "".join(content.itertext()).strip()
        items.append({
            "title": values.get("title", ""),
            "summary": values.get("fullSummary", values.get("snippet", "")),
            "url": document.attrib.get("url", ""),
            "source": "MedlinePlus",
        })
    put_cache(key, items)
    return items
