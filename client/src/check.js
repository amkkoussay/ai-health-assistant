import { medicalData } from "./medical_data.js";

const clean = (text) => String(text || "").trim().toLocaleLowerCase();

function findIds(text) {
  const value = clean(text);
  return medicalData.symptoms.filter((item) => Object.values(item.terms).flat().some((term) => value.includes(clean(term)))).map((item) => item.id);
}

export function checkNow(form) {
  const lang = ["ar", "fr", "en"].includes(form.lang) ? form.lang : "ar";
  const text = `${form.symptoms || ""} ${form.history || ""} ${form.allergies || ""}`;
  const found = findIds(text);
  const dangerIds = new Set(["shortness-of-breath", "chest-pain", "fainting", "severe-bleeding", "sudden-weakness", "confusion", "facial-swelling"]);
  const symptoms = Object.fromEntries(medicalData.symptoms.map((item) => [item.id, item]));
  const cases = medicalData.conditions
    .map((condition) => {
      const matched = condition.symptoms.filter((id) => found.includes(id));
      if (!matched.length) return null;
      const coverage = Number((matched.length / condition.symptoms.length).toFixed(2));
      const score = Number(((coverage * 0.75) + ((condition.prior || 0.5) * 0.25)).toFixed(2));
      return { id: condition.id, name: condition.names[lang], level: score >= 0.62 ? "likely" : "possible", tone: score >= 0.62 ? "green" : "orange", matched: matched.map((id) => symptoms[id].labels[lang]), coverage, score, source: condition.source };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 4);

  return {
    danger: found.some((id) => dangerIds.has(id)),
    dangerSymptoms: found.filter((id) => dangerIds.has(id)).map((id) => symptoms[id].labels[lang]),
    matchedSymptoms: found.map((id) => symptoms[id].labels[lang]),
    cases,
    meta: { duration: form.days || null, severity: form.severity || null },
    source: { name: "MedlinePlus", url: "https://medlineplus.gov/about/developers/webservices/", version: medicalData.version }
  };
}
