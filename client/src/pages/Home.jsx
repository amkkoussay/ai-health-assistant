/* Style: صفحة «عيادة هادئة» تجمع الهدوء التحريري مع تبديل لغة واضح ومصادر قابلة للتحقق. */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpLeft, Check, ChevronDown, CircleHelp, Clock3, Download, LockKeyhole, MapPin, Menu, NotebookPen, ShieldCheck, Sparkles, Stethoscope, X } from "lucide-react";
import Mark from "../components/Mark.jsx";
import Notice from "../components/Notice.jsx";
import PulseLine from "../components/PulseLine.jsx";
import { checkNow } from "../check.js";
import { getCopy, languages } from "../copy.js";
import { medicalData } from "../medical_data.js";

const starter = ["fever", "cough", "fatigue", "sore-throat"];
const emptyForm = { symptoms: "", days: "", severity: "moderate", age: "", history: "", allergies: "", meds: "" };

async function runAnalysis(form, lang) {
  const payload = { ...form, lang };
  try {
    const response = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (response.ok) return response.json();
  } catch {
    return checkNow(payload);
  }
  return checkNow(payload);
}

function getLabel(id, lang) {
  return medicalData.symptoms.find((item) => item.id === id)?.labels[lang] || id;
}

export default function Home() {
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  const [lang, setLang] = useState(() => ["ar", "fr", "en"].includes(urlLang) ? urlLang : window.localStorage.getItem("nabd-lang") || "ar");
  const [form, setForm] = useState(emptyForm);
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [menu, setMenu] = useState(false);
  const [locationNote, setLocationNote] = useState("");
  const reportRef = useRef(null);
  const t = getCopy(lang);
  const language = languages[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = language.dir;
    document.title = language.title;
    window.localStorage.setItem("nabd-lang", lang);
  }, [lang, language.dir, language.title]);

  const set = (name, value) => setForm((old) => ({ ...old, [name]: value }));

  const changeLanguage = (value) => {
    setLang(value);
    setMenu(false);
    if (answer) setAnswer(null);
  };

  const addStarter = (id) => {
    const next = form.symptoms ? `${form.symptoms}, ${getLabel(id, lang)}` : getLabel(id, lang);
    set("symptoms", next);
  };

  const runCheck = (event) => {
    event.preventDefault();
    if (!form.symptoms.trim()) return;
    setBusy(true);
    window.setTimeout(async () => {
      setAnswer(await runAnalysis(form, lang));
      setBusy(false);
      window.setTimeout(() => document.getElementById("answer")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }, 240);
  };

  const findCare = () => {
    setLocationNote(t.openMap);
    if (!navigator.geolocation) {
      window.open("https://www.google.com/maps/search/hospital", "_blank", "noopener,noreferrer");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => window.open(`https://www.google.com/maps/search/hospital/@${coords.latitude},${coords.longitude},14z`, "_blank", "noopener,noreferrer"),
      () => window.open("https://www.google.com/maps/search/hospital", "_blank", "noopener,noreferrer"),
      { enableHighAccuracy: false, timeout: 5000 }
    );
  };

  const savePdf = async () => {
    if (!reportRef.current || savingPdf) return;
    setSavingPdf(true);
    setPdfError("");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#fffdfa", logging: false });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;
      const image = canvas.toDataURL("image/jpeg", 0.94);
      let left = imageHeight;
      let position = 0;
      pdf.addImage(image, "JPEG", 0, position, pageWidth, imageHeight);
      left -= pageHeight;
      while (left > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(image, "JPEG", 0, position, pageWidth, imageHeight);
        left -= pageHeight;
      }
      pdf.save(`nabd-report-${lang}.pdf`);
    } catch {
      setPdfError(t.pdfError);
    } finally {
      setSavingPdf(false);
    }
  };

  const displayCases = answer?.cases?.length ? answer.cases : answer ? [{ id: "unknown", name: t.insufficient, level: "notClear", tone: "blue", matched: [t.insufficientWhy], source: null }] : [];
  const severityText = form.severity === "mild" ? t.mild : form.severity === "severe" ? t.severe : t.moderate;

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Nabd home"><Mark small /><span>نبض</span></a>
        <button className="menu-button" onClick={() => setMenu(!menu)} aria-label={t.how}>{menu ? <X size={20} /> : <Menu size={20} />}</button>
        <nav className={menu ? "nav-links nav-open" : "nav-links"}>
          <a href="#how">{t.how}</a>
          <a href="#safety">{t.safety}</a>
          <a href="#check">{t.analyze}</a>
        </nav>
        <div className="top-actions"><label className="language-picker"><span>{t.chooseLanguage}</span><select value={lang} onChange={(event) => changeLanguage(event.target.value)} aria-label={t.chooseLanguage}>{Object.entries(languages).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}</select><ChevronDown size={14} /></label><div className="top-note"><span className="live-dot" /> {t.demo}</div></div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> {t.heroEyebrow}</div>
            <h1>{t.heroA}<br /><em>{t.heroB}</em></h1>
            <p className="hero-lede">{t.heroLead}</p>
            <div className="hero-actions"><a className="button button-main" href="#check">{t.start} <ArrowLeft size={18} /></a><a className="text-link" href="#how">{t.seeHow} <ArrowUpLeft size={16} /></a></div>
            <div className="hero-trust"><ShieldCheck size={16} /> {t.noStore}</div>
          </div>
          <div className="hero-art">
            <div className="hero-art-paint" aria-hidden="true" />
            <PulseLine className="hero-pulse" />
            <div className="art-label art-label-top"><span className="mini-pulse" /> {t.clearBefore}</div>
            <div className="art-label art-label-bottom"><ShieldCheck size={16} /> {t.safetyFirst}</div>
          </div>
          <div className="hero-side-note">01 / 03<br /><span>{t.responsible}</span></div>
        </section>

        <section className="strip" id="how"><div className="strip-label"><span>01</span> {t.compass}</div><p>{t.compassText}</p><PulseLine className="strip-pulse" /></section>

        <section className="work" id="check">
          <aside className="steps">
            <div className="steps-head"><span>{t.shortPath}</span><span>{t.threeSteps}</span></div>
            <div className="step step-active"><span className="step-number">01</span><div><strong>{t.stepOne}</strong><small>{t.stepOneSmall}</small></div></div>
            <div className="step"><span className="step-number">02</span><div><strong>{t.stepTwo}</strong><small>{t.stepTwoSmall}</small></div></div>
            <div className="step"><span className="step-number">03</span><div><strong>{t.stepThree}</strong><small>{t.stepThreeSmall}</small></div></div>
            <div className="side-quote"><span>“</span><p>{t.quote}</p></div>
          </aside>

          <div className="form-side">
            <div className="section-heading"><div><span className="kicker">{t.firstStep}</span><h2>{t.whatNow}</h2></div><CircleHelp size={20} /></div>
            <p className="muted">{t.moreUseful}</p>
            <form onSubmit={runCheck}>
              <label className="field-label" htmlFor="symptoms">{t.symptomsNow} <span>{t.required}</span></label>
              <textarea id="symptoms" value={form.symptoms} onChange={(event) => set("symptoms", event.target.value)} placeholder={t.symptomPlaceholder} rows="4" />
              <div className="chips">{starter.map((id) => <button type="button" key={id} className="chip" onClick={() => addStarter(id)}>+ {getLabel(id, lang)}</button>)}</div>

              <div className="field-grid">
                <label className="field"><span>{t.since}</span><div className="input-wrap"><input type="number" min="1" max="365" value={form.days} onChange={(event) => set("days", event.target.value)} placeholder="—" /><small>{t.day}</small></div></label>
                <label className="field"><span>{t.severity}</span><div className="select-wrap"><select value={form.severity} onChange={(event) => set("severity", event.target.value)}><option value="mild">{t.mild}</option><option value="moderate">{t.moderate}</option><option value="severe">{t.severe}</option></select><ChevronDown size={16} /></div></label>
                <label className="field"><span>{t.age} <b>{t.optional}</b></span><div className="input-wrap"><input type="number" min="0" max="120" value={form.age} onChange={(event) => set("age", event.target.value)} placeholder="—" /><small>{lang === "ar" ? "سنة" : lang === "fr" ? "ans" : "years"}</small></div></label>
              </div>

              <details className="extra"><summary>{t.addContext} <ChevronDown size={16} /></summary><div className="extra-fields"><label className="field"><span>{t.history}</span><input value={form.history} onChange={(event) => set("history", event.target.value)} placeholder={t.historyPlaceholder} /></label><label className="field"><span>{t.allergies}</span><input value={form.allergies} onChange={(event) => set("allergies", event.target.value)} placeholder={t.allergiesPlaceholder} /></label><label className="field"><span>{t.meds}</span><input value={form.meds} onChange={(event) => set("meds", event.target.value)} placeholder={t.medsPlaceholder} /></label></div></details>

              <div className="form-bottom"><div className="privacy"><LockKeyhole size={15} /> {t.noIdentity}</div><button className="button button-main button-submit" type="submit" disabled={busy || !form.symptoms.trim()}>{busy ? t.analyzing : t.analyzeButton} <ArrowLeft size={18} /></button></div>
            </form>
          </div>
        </section>

        {answer && <section className="answer" id="answer">
          <div className="report-actions"><button className="button button-report" type="button" onClick={savePdf} disabled={savingPdf}><Download size={17} /> {savingPdf ? t.exporting : t.exportPdf}</button>{pdfError && <span className="pdf-note">{pdfError}</span>}</div>
          <div className="report-paper" ref={reportRef}>
          <div className="report-topline"><strong>{t.reportTitle}</strong><span>{t.reportDate}: {new Date().toLocaleDateString(lang === "ar" ? "ar" : lang === "fr" ? "fr-FR" : "en-US")}</span></div>
          <div className="answer-top"><div><span className="kicker">{t.secondStep}</span><h2>{t.picture}</h2></div><div className="answer-side"><PulseLine className="answer-pulse" /><div className="answer-meta"><span><Clock3 size={15} /> {answer.meta.duration ? `${answer.meta.duration} ${t.day}` : t.durationUnknown}</span><span><NotebookPen size={15} /> {answer.meta.severity === "mild" ? t.mild : answer.meta.severity === "severe" ? t.severe : answer.meta.severity === "moderate" ? t.moderate : t.severityUnknown}</span></div></div></div>
          {answer.danger ? <Notice kind="danger" title={t.dangerTitle}>{t.dangerText} {answer.dangerSymptoms?.join(", ")}</Notice> : <Notice kind="success" title={t.noEmergencyTitle}>{t.noEmergencyText}</Notice>}
          <div className="answer-grid">
            <div className="case-list"><div className="subhead"><span>{t.educational}</span><small>{t.notDiagnosis}</small></div>{displayCases.map((item, index) => <article className="case" key={item.id}><span className={`case-dot ${item.tone}`} /><div className="case-main"><div className="case-title"><h3>{item.name}</h3><span>{item.level === "likely" ? t.likely : item.level === "possible" ? t.possible : t.notClear}</span></div><p>{item.matched?.join(", ")}</p><div className="why"><Check size={14} /> {t.why}</div>{item.source && <a className="case-source" href={item.source.url} target="_blank" rel="noreferrer">{t.source}: {item.source.name} <ArrowUpLeft size={12} /></a>}</div><span className="case-index">0{index + 1}</span></article>)}<div className="source-note"><ShieldCheck size={14} /> {t.sourceNote} <a href="https://medlineplus.gov/" target="_blank" rel="noreferrer">{t.sourceLabel}</a> · {medicalData.version}</div></div>
            <div className="next-card"><div className="next-icon"><Stethoscope size={21} /></div><span className="kicker">{t.thirdStep}</span><h3>{t.whatNext}</h3><p>{answer.danger ? t.dangerText : t.noEmergencyText}</p>{answer.danger && <button className="button button-warm" onClick={findCare}><MapPin size={17} /> {t.map}</button>}<small className="next-foot"><ShieldCheck size={14} /> {locationNote || t.locationNote}</small></div>
          </div>
          </div>
        </section>}

        <section className="safety" id="safety"><div className="safety-visual"><div className="safety-art-paint" aria-hidden="true" /><PulseLine className="safety-pulse" /><div className="safety-stamp"><ShieldCheck size={17} /> {t.safetyFirst}</div></div><div className="safety-copy"><span className="kicker">{t.boundaries}</span><h2>{t.smartHelps}<br /><em>{t.doctorDecides}</em></h2><p>{t.safetyText}</p><div className="rule"><span>01</span><p>{t.ruleOne}</p></div><div className="rule"><span>02</span><p>{t.ruleTwo}</p></div></div></section>
        <section className="closing"><div><span className="kicker">{t.smallStep}</span><h2>{t.ready}</h2></div><a className="button button-outline" href="#check">{t.writeSymptoms} <ArrowLeft size={18} /></a></section>
      </main>

      <footer className="footer"><div className="brand"><Mark small /><span>نبض</span></div><p>{t.footer}</p><span className="footer-note">{t.footerNote}</span></footer>
    </div>
  );
}
