import { checkNow } from "../client/src/check.js";

const normal = checkNow({ lang: "ar", symptoms: "حمى، سعال، تعب", days: "3", severity: "moderate" });
if (normal.danger || normal.cases.length < 1 || !normal.cases[0].source.url) throw new Error("normal case failed");

const urgent = checkNow({ lang: "ar", symptoms: "سعال وألم صدر وضيق تنفس", days: "1", severity: "severe" });
if (!urgent.danger || urgent.dangerSymptoms.length < 2) throw new Error("urgent case failed");

const french = checkNow({ lang: "fr", symptoms: "fièvre, toux et fatigue", days: "2", severity: "moderate" });
if (!french.cases[0].name || french.cases[0].name === normal.cases[0].name) throw new Error("language case failed");

console.log("JavaScript checks passed");
