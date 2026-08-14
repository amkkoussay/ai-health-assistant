import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "medical_data.json"), "utf8"));
const output = `export const medicalData = ${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(path.join(root, "client", "src", "medical_data.js"), output);
