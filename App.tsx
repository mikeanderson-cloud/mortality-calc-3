import { useState } from "react";

const CAUSES = [
  "Heart disease (coronary artery disease, heart failure, arrhythmia)",
  "Cancer (all malignant neoplasms)",
  "COVID-19 & influenza / pneumonia",
  "Stroke (cerebrovascular disease)",
  "Chronic lower respiratory disease (COPD, emphysema, asthma)",
  "Alzheimer's disease & other dementias",
  "Diabetes mellitus (Type 1 & Type 2)",
  "Chronic kidney disease & renal failure",
  "Sepsis & systemic infections",
  "Hypertensive diseases (hypertensive heart & renal disease)",
  "Liver disease & cirrhosis",
  "Drug overdose & poisoning (unintentional)",
  "Parkinson's disease & movement disorders",
  "Motor vehicle accidents (occupant)",
  "Atherosclerosis & peripheral vascular disease",
  "Aortic aneurysm & dissection",
  "Pneumonitis & aspiration",
  "Falls (unintentional)",
  "Suicide — firearm (self-inflicted gunshot)",
  "Suicide — non-firearm (hanging, overdose, other)",
  "Homicide — firearm",
  "Homicide — non-firearm",
  "Drowning (unintentional)",
  "Fire & burn injuries",
  "Viral hepatitis (A, B, C, D, E)",
  "Nutritional deficiencies & malnutrition",
  "Blood & lymphatic disorders (anemia, coagulation)",
  "Perinatal & congenital conditions",
  "Intestinal obstruction, hernia & GI complications",
  "Iatrogenic injury & medical error"
];

const SYSTEM_PROMPT = `You are a mortality risk analyst with deep expertise in epidemiology, actuarial science, and CDC mortality statistics.

Given a detailed personal profile, calculate PERSONALIZED annual and lifetime probabilities of death for each of the 30 causes listed. Your numbers must be grounded in real published data:

DATA SOURCES TO USE:
- CDC WONDER all-cause and cause-specific mortality data
- SAMHSA drug overdose statistics (substance-specific: opioid, fentanyl, meth, cocaine, alcohol, benzodiazepine fatality rates)
- VA/DoD veteran suicide and mortality studies (veterans have ~1.5x general population suicide rate; combat exposure and TBI increase this further)
- Autism mortality research (autistic adults have 2-3x all-cause mortality vs. general pop; drowning is leading cause in children but accident/suicide risk persists in adults; elopement risk)
- ADHD mortality literature (ADHD associated with 2x accident mortality, elevated overdose risk, ~4-9 year reduced life expectancy in some studies due to risk-taking behavior)
- BPD (Borderline Personality Disorder) mortality: suicide attempt rate ~70%, completed suicide ~10% lifetime; elevated self-harm mortality
- Framingham risk equations for cardiovascular disease
- NHTSA data for motorcycle fatality rates vs. car (per mile, motorcycles are ~29x more deadly than cars)
- Rock climbing, skydiving, BASE jumping, free solo climbing specific fatality rate data from American Alpine Club and USPA
- Actuarial life tables (SSA 2020 period tables)

THE 30 CAUSES TO ANALYZE:
${CAUSES.map((c, i) => `${i + 1}. ${c}`).join("\n")}

RISK FACTOR WEIGHTING GUIDANCE:
- Recreational drugs: weight by SUBSTANCE. Fentanyl/heroin: very high overdose mortality rate (roughly 1-2% annual for active users). Methamphetamine: elevated cardiac and overdose mortality. Cocaine: cardiac event risk. Benzodiazepines (especially combined with opioids): high overdose risk. Cannabis: minimal direct mortality. MDMA: low but not zero.
- Veteran status: apply VA suicide mortality data; adjust for combat exposure and PTSD if indicated; also adjust for occupational injury history
- Autism (ASD): adjust accident/drowning risk, consider wandering/elopement, elevated suicide risk especially in adults with co-occurring depression
- ADHD: elevate accident risk (car, falls, occupational), elevate overdose risk, elevate suicide risk (2-3x in adults)
- BPD: dramatically elevate suicide probability (10% lifetime completed suicide); elevate self-harm and overdose risk
- Recreational activities: motorcycles (29x per-mile fatality vs. car), skydiving (~1 per 100,000 jumps), BASE jumping (~1 per 500-2,000 jumps), free solo climbing (very high), rock climbing (low per outing but cumulative risk), whitewater kayaking, backcountry skiing
- Firearm suicide vs. firearm homicide MUST be calculated separately. Firearm suicide: weight heavily by mental health (depression, BPD, bipolar, PTSD), unsecured firearm access, veteran status, male sex, rural residence. Firearm homicide: weight by neighborhood violence, occupation, demographics, state.
- Non-firearm suicide: includes hanging, overdose-as-suicide, jumping; still elevated by mental health factors but lower lethality per attempt than firearm
- Atherosclerosis & peripheral vascular disease: weight by smoking, diabetes, hypertension, high cholesterol, age, male sex, family history
- Aortic aneurysm: weight by smoking (strongest risk factor), hypertension, male sex, age 65+, family history, connective tissue disorders
- Pneumonitis & aspiration: weight by age, neurological conditions, dementia, alcohol use, swallowing disorders, bed-bound status
- Fire & burn injuries: weight by smoking (especially in bed), alcohol use, age extremes, housing instability
- Viral hepatitis: weight by IV drug use, unprotected sex, incarceration history, healthcare worker exposure
- Nutritional deficiencies: weight by eating disorder, heavy alcohol use, homelessness, malabsorption, bariatric surgery
- Blood & lymphatic disorders: weight by family history, autoimmune conditions, chemotherapy history, chronic disease burden
- Perinatal & congenital conditions: near-zero for adults 18+
- Intestinal obstruction & GI complications: weight by prior abdominal surgeries, IBD, hernias, age, opioid use
- Iatrogenic / medical error: weight by number of chronic conditions, complex polypharmacy, prior hospitalizations, surgical history
- Polysubstance use (especially opioid + benzo, or stimulant + depressant combinations): dramatically elevate overdose risk

OUTPUT RULES:
- Be statistically precise. Use real numbers, not vague descriptors.
- Express annual risk as a percentage (e.g. 0.048%) AND as odds (e.g. "1 in 2,083")
- Express lifetime remaining risk as a percentage
- Rank all 30 causes from highest to lowest annual risk for THIS specific person
- Flag causes where this person's risk is 2x+ above population average for their age/sex as elevated: true
- Each "note" should be one specific, personalized sentence explaining why their number is what it is — cite the specific risk factors driving it
- Be direct and honest. This tool exists to help people make rational, data-informed personal decisions about their lives.

Respond ONLY with a valid JSON object, no markdown fences, no preamble:
{
  "profile_summary": "One sentence describing who this person is demographically and by key risk factors",
  "causes": [
    {
      "rank": 1,
      "name": "exact cause name from the list above",
      "annual_percent": 0.15,
      "annual_odds": "1 in 667",
      "lifetime_percent": 18.2,
      "elevated": true,
      "note": "one specific sentence explaining what drives this number for this person"
    }
  ],
  "narrative": "2-3 sentence synthesis of the most important insights and highest-leverage risk factors for this specific person",
  "life_expectancy_note": "One sentence estimating remaining life expectancy given their full profile, and how it compares to population average"
}`;

const FONT = '"Helvetica Neue", Helvetica, "Neue Haas Grotesk Display", Arial, sans-serif';

function Disclaimer() {
  return (
    <div className="disclaimer">
      <div className="disclaimer-title">Important Disclaimers & Limitations</div>
      <div className="disclaimer-grid">
        <div className="disclaimer-block">
          <strong>Not Medical Advice</strong>
          These estimates are statistical probabilities derived from population-level epidemiological data — they are not a clinical diagnosis, a medical prediction, or a substitute for professional medical evaluation. Nothing in this tool should be used to make health, treatment, or lifestyle decisions without consulting a licensed physician, mental health professional, or qualified healthcare provider.
        </div>
        <div className="disclaimer-block">
          <strong>Statistical Limitations</strong>
          All figures are model-generated estimates grounded in published CDC, SAMHSA, VA, and actuarial data, but they carry inherent uncertainty. Population averages may not reflect your individual biology, genetics, environment, or circumstances. Risk multipliers for conditions like ADHD, ASD, and BPD are drawn from research literature that itself has wide confidence intervals. Treat all numbers as order-of-magnitude approximations, not precise predictions.
        </div>
        <div className="disclaimer-block">
          <strong>Data Currency</strong>
          Underlying mortality statistics reflect CDC WONDER and SSA actuarial tables primarily from 2019–2022. Mortality trends shift over time due to medical advances, drug supply changes, public health interventions, and other factors. Your actual risk environment may differ from what historical population data reflects.
        </div>
        <div className="disclaimer-block">
          <strong>Mental Health & Crisis Resources</strong>
          If reviewing this information has raised concerns about suicide, self-harm, or substance use — for yourself or someone you know — please reach out for support. <strong>988 Suicide & Crisis Lifeline: call or text 988.</strong> SAMHSA National Helpline (substance use): 1-800-662-4357. Crisis Text Line: text HOME to 741741. You are not alone, and help is available.
        </div>
        <div className="disclaimer-block">
          <strong>Privacy</strong>
          Your profile data is sent directly to the Anthropic API to generate your results and is not stored, logged, or retained by this application. Review Anthropic's privacy policy at anthropic.com for details on how API data is handled.
        </div>
        <div className="disclaimer-block">
          <strong>Purpose of This Tool</strong>
          This calculator is designed to support rational, data-informed reflection on personal risk — the same kind of actuarial reasoning used by insurers, epidemiologists, and public health researchers. Understanding your relative risks is a legitimate and valuable input to decisions about lifestyle, healthcare, and harm reduction. It is not intended to cause distress, and results should be interpreted in context with the full complexity of your life.
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    age: "", sex: "", height: "", weight: "",
    smoking: "never", alcohol: "light",
    exercise: "moderate", diet: "average",
    conditions: [], mentalHealth: [],
    neurodevelopmental: [], demographics: [],
    gunAccess: "no", state: "",
    occupation: "", seatbelt: "always",
    drugs: [], recreation: [], familyHistory: []
  });

  const conditions = ["Hypertension","Type 2 Diabetes","Heart Disease","COPD/Asthma","Cancer (history)","Kidney Disease","Liver Disease","Sleep Apnea","High Cholesterol","Autoimmune disorder","Epilepsy / seizure disorder","HIV/AIDS"];
  const mentalHealthOpts = ["Depression","Bipolar I","Bipolar II","Anxiety disorder","PTSD","Schizophrenia","Borderline Personality Disorder (BPD)","Eating disorder","OCD","Psychosis","None"];
  const neurodevelopmentalOpts = ["ADHD","Autism Spectrum Disorder (ASD)","Intellectual disability","Traumatic Brain Injury (TBI)","None"];
  const demographicOpts = ["Veteran (non-combat)","Veteran (combat-deployed)","First responder / EMT","Unhoused / unstable housing","Incarcerated (history of)","Caregiver / healthcare worker"];
  const drugOpts = [
    { label: "Opioids (prescription)", key: "opioids_rx" },
    { label: "Heroin", key: "heroin" },
    { label: "Fentanyl / illicit opioids", key: "fentanyl" },
    { label: "Methamphetamine", key: "meth" },
    { label: "Cocaine / crack", key: "cocaine" },
    { label: "Benzodiazepines (non-rx)", key: "benzo" },
    { label: "MDMA / ecstasy", key: "mdma" },
    { label: "Cannabis", key: "cannabis" },
    { label: "Psychedelics (LSD, psilocybin)", key: "psychedelics" },
    { label: "Alcohol (heavy/binge)", key: "alcohol_heavy" },
    { label: "Polysubstance (mixing)", key: "polysubstance" },
    { label: "None", key: "none" },
  ];
  const recreationOpts = ["Motorcycles (regular rider)","Motorcycles (occasional rider)","Rock climbing / mountaineering","Free solo climbing","Skydiving","BASE jumping","Backcountry skiing / avalanche terrain","Whitewater kayaking / rafting","Hunting (regular)","Scuba diving","Racing / motorsports","Extreme sports (general)"];
  const familyOpts = ["Heart disease (early onset)","Cancer","Diabetes","Stroke","Alzheimer's","Suicide","Substance use disorder","None"];

  const toggle = (field, val) => {
    setForm(f => {
      const cur = f[field];
      if (val === "None" || val === "none") return { ...f, [field]: cur.includes(val) ? [] : [val] };
      const without = cur.filter(x => x !== "None" && x !== "none");
      return { ...f, [field]: without.includes(val) ? without.filter(x => x !== val) : [...without, val] };
    });
  };

  const handleSubmit = () => {
    if (!form.age || !form.sex) return;
    const bmi = form.height && form.weight ? ((form.weight / (form.height * form.height)) * 703).toFixed(1) : null;
    onSubmit({ ...form, bmi });
  };

  const sel = (field, val) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="form-container">
      <div className="form-grid">
        <div className="form-section">
          <h3 className="section-label">Demographics</h3>
          <div className="field-row">
            <div className="field"><label>Age</label><input type="number" placeholder="e.g. 38" value={form.age} onChange={e => sel("age", e.target.value)} min="18" max="99" /></div>
            <div className="field"><label>Biological Sex</label><div className="pill-row">{["Male","Female"].map(s => <button key={s} className={`pill ${form.sex===s?"active":""}`} onClick={() => sel("sex",s)}>{s}</button>)}</div></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Height (inches)</label><input type="number" placeholder="e.g. 70" value={form.height} onChange={e => sel("height", e.target.value)} /></div>
            <div className="field"><label>Weight (lbs)</label><input type="number" placeholder="e.g. 185" value={form.weight} onChange={e => sel("weight", e.target.value)} /></div>
          </div>
          <div className="field"><label>State of Residence</label><input type="text" placeholder="e.g. California" value={form.state} onChange={e => sel("state", e.target.value)} /></div>
          <div className="field"><label>Occupation</label><input type="text" placeholder="e.g. office worker, nurse, construction..." value={form.occupation} onChange={e => sel("occupation", e.target.value)} /></div>
        </div>

        <div className="form-section">
          <h3 className="section-label">Core Lifestyle</h3>
          {[
            { label: "Smoking", field: "smoking", opts: ["never","former","occasional","daily"] },
            { label: "Alcohol", field: "alcohol", opts: ["none","light","moderate","heavy"] },
            { label: "Exercise", field: "exercise", opts: ["none","light","moderate","vigorous"] },
            { label: "Diet Quality", field: "diet", opts: ["poor","average","good","excellent"] },
            { label: "Seatbelt Use", field: "seatbelt", opts: ["always","usually","rarely"] },
          ].map(({ label, field, opts }) => (
            <div className="field" key={field}>
              <label>{label}</label>
              <div className="pill-row">{opts.map(o => <button key={o} className={`pill ${form[field]===o?"active":""}`} onClick={() => sel(field,o)}>{o}</button>)}</div>
            </div>
          ))}
          <div className="field">
            <label>Firearm Access at Home</label>
            <div className="pill-row">{["no","yes — secured","yes — unsecured"].map(o => <button key={o} className={`pill ${form.gunAccess===o?"active":""}`} onClick={() => sel("gunAccess",o)}>{o}</button>)}</div>
          </div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Substance Use <span className="label-sub">— select all that apply; specificity matters for overdose risk</span></h3>
          <div className="chip-grid">{drugOpts.map(({ label, key }) => <button key={key} className={`chip ${form.drugs.includes(key)?"active":""}`} onClick={() => toggle("drugs",key)}>{label}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">High-Risk Recreation <span className="label-sub">— select any that apply regularly</span></h3>
          <div className="chip-grid">{recreationOpts.map(r => <button key={r} className={`chip ${form.recreation.includes(r)?"active":""}`} onClick={() => toggle("recreation",r)}>{r}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Physical Health Conditions</h3>
          <div className="chip-grid">{conditions.map(c => <button key={c} className={`chip ${form.conditions.includes(c)?"active":""}`} onClick={() => toggle("conditions",c)}>{c}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Mental Health History</h3>
          <div className="chip-grid">{mentalHealthOpts.map(c => <button key={c} className={`chip ${form.mentalHealth.includes(c)?"active":""}`} onClick={() => toggle("mentalHealth",c)}>{c}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Neurodevelopmental Profile</h3>
          <div className="chip-grid">{neurodevelopmentalOpts.map(c => <button key={c} className={`chip ${form.neurodevelopmental.includes(c)?"active":""}`} onClick={() => toggle("neurodevelopmental",c)}>{c}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Background & Identity <span className="label-sub">— select any that apply; these have specific mortality data</span></h3>
          <div className="chip-grid">{demographicOpts.map(c => <button key={c} className={`chip ${form.demographics.includes(c)?"active":""}`} onClick={() => toggle("demographics",c)}>{c}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Family History</h3>
          <div className="chip-grid">{familyOpts.map(c => <button key={c} className={`chip ${form.familyHistory.includes(c)?"active":""}`} onClick={() => toggle("familyHistory",c)}>{c}</button>)}</div>
        </div>
      </div>

      <Disclaimer />

      <button className="analyze-btn" onClick={handleSubmit} disabled={loading || !form.age || !form.sex}>
        {loading ? <span className="spinner" /> : null}
        {loading ? "Analyzing your profile…" : "Calculate My Risk Profile"}
      </button>
    </div>
  );
}

function RiskBar({ percent, max }) {
  const width = Math.min((percent / max) * 100, 100);
  const color = percent >= max * 0.5 ? "#b84040" : percent >= max * 0.2 ? "#c0732a" : percent >= max * 0.05 ? "#9a7f3c" : "#4a7a6a";
  return (
    <div className="risk-bar-track">
      <div className="risk-bar-fill" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

function Results({ data, onReset }) {
  const maxAnnual = Math.max(...data.causes.map(c => c.annual_percent));
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="results-container">
      <div className="results-header">
        <div className="profile-badge">{data.profile_summary}</div>
        <p className="life-exp-note">{data.life_expectancy_note}</p>
      </div>
      <div className="narrative-box">
        <div className="narrative-label">Risk Analysis</div>
        <p>{data.narrative}</p>
      </div>
      <div className="causes-table">
        <div className="table-header">
          <span>Rank</span><span>Cause of Death</span><span>Annual Risk</span><span>Odds</span><span>Lifetime</span><span></span>
        </div>
        {data.causes.map((c, i) => (
          <div key={i}>
            <div className={`table-row ${c.elevated?"elevated":""} ${expanded===i?"open":""}`} onClick={() => setExpanded(expanded===i?null:i)}>
              <span className="rank-num">{c.rank}</span>
              <span className="cause-name">{c.name}{c.elevated && <span className="elevated-badge">↑ Elevated</span>}</span>
              <span className="annual-pct">{c.annual_percent.toFixed(3)}%</span>
              <span className="odds-text">{c.annual_odds}</span>
              <span className="lifetime-pct">{c.lifetime_percent.toFixed(1)}%</span>
              <span className="expand-icon">{expanded===i?"▲":"▼"}</span>
            </div>
            <div className="bar-row"><RiskBar percent={c.annual_percent} max={maxAnnual} /></div>
            {expanded===i && <div className="note-row">{c.note}</div>}
          </div>
        ))}
      </div>
      <Disclaimer />
      <button className="reset-btn" onClick={onReset}>← Start Over</button>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("form");
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const analyze = async (profile) => {
    setPhase("loading");
    const userMsg = `Here is my health profile. Please analyze my personalized mortality risk:

Age: ${profile.age}
Biological sex: ${profile.sex}
${profile.bmi ? `BMI: ${profile.bmi} (height: ${profile.height}", weight: ${profile.weight} lbs)` : ""}
State of residence: ${profile.state || "Not specified"}
Occupation: ${profile.occupation || "Not specified"}

CORE LIFESTYLE:
- Smoking: ${profile.smoking}
- Alcohol: ${profile.alcohol}
- Exercise: ${profile.exercise}
- Diet quality: ${profile.diet}
- Seatbelt use: ${profile.seatbelt}
- Firearm access at home: ${profile.gunAccess}

SUBSTANCE USE: ${profile.drugs?.length ? profile.drugs.join(", ") : "None reported"}
HIGH-RISK RECREATIONAL ACTIVITIES: ${profile.recreation?.length ? profile.recreation.join(", ") : "None reported"}
PHYSICAL HEALTH CONDITIONS: ${profile.conditions?.length ? profile.conditions.join(", ") : "None reported"}
MENTAL HEALTH HISTORY: ${profile.mentalHealth?.length ? profile.mentalHealth.join(", ") : "None reported"}
NEURODEVELOPMENTAL PROFILE: ${profile.neurodevelopmental?.length ? profile.neurodevelopmental.join(", ") : "None reported"}
BACKGROUND & IDENTITY: ${profile.demographics?.length ? profile.demographics.join(", ") : "None reported"}
FAMILY HISTORY: ${profile.familyHistory?.length ? profile.familyHistory.join(", ") : "None reported"}

Please return my complete personalized risk analysis as the JSON object specified.`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
       headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMsg }]
        })
      });
      const data = await resp.json();
      if (data.error) { setErrorMsg(`API error: ${data.error.type} — ${data.error.message}`); setPhase("error"); return; }
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      parsed.causes.sort((a, b) => b.annual_percent - a.annual_percent);
      parsed.causes.forEach((c, i) => c.rank = i + 1);
      setResults(parsed);
      setPhase("results");
    } catch (e) {
      setErrorMsg(`Error: ${e.message}`);
      setPhase("error");
    }
  };

  const f = FONT;

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #f5f2ec;
          --surface: #ffffff;
          --surface2: #f0ece3;
          --border: #ddd8cc;
          --text: #1a2540;
          --muted: #6b7280;
          --accent: #9a7f3c;
          --accent-hover: #7d6530;
          --danger: #b84040;
          --warn: #c0732a;
          --radius: 8px;
          --font: "Helvetica Neue", Helvetica, "Neue Haas Grotesk Display", Arial, sans-serif;
        }
        body { background: var(--bg); color: var(--text); font-family: var(--font); }
        .app { min-height: 100vh; font-family: var(--font); background: var(--bg); color: var(--text); padding: 0 16px 80px; }
        .app-header { text-align: left; padding: 52px 0 40px; border-bottom: 1px solid var(--border); margin-bottom: 40px; max-width: 780px; margin-left: auto; margin-right: auto; }
        .app-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; }
        .app-title { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(32px, 5vw, 52px); font-weight: 400; color: var(--text); line-height: 1.12; margin-bottom: 18px; }
        .app-title em { font-style: italic; color: var(--accent); }
        .app-sub { font-size: 15px; color: var(--muted); max-width: 520px; line-height: 1.7; font-weight: 300; }
        .form-container { max-width: 780px; margin: 0 auto; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
        .form-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px; }
        .form-section.full-width { grid-column: 1 / -1; }
        .section-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; display: block; }
        .label-sub { font-size: 10px; letter-spacing: 0; text-transform: none; color: var(--muted); font-weight: 400; }
        .field { margin-bottom: 14px; }
        .field:last-child { margin-bottom: 0; }
        .field label { display: block; font-size: 11px; font-weight: 600; color: var(--muted); margin-bottom: 6px; letter-spacing: 0.06em; text-transform: uppercase; }
        .field input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; color: var(--text); padding: 9px 12px; font-size: 14px; font-family: var(--font); outline: none; transition: border-color 0.15s; }
        .field input:focus { border-color: var(--accent); }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pill-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .pill { padding: 5px 13px; border-radius: 4px; border: 1px solid var(--border); background: var(--surface2); color: var(--muted); font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: var(--font); }
        .pill:hover { border-color: var(--accent); color: var(--accent); background: #f7f3ea; }
        .pill.active { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }
        .chip-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip { padding: 6px 13px; border-radius: 4px; border: 1px solid var(--border); background: var(--surface2); color: var(--muted); font-size: 12px; cursor: pointer; transition: all 0.15s; font-family: var(--font); }
        .chip:hover { border-color: var(--accent); color: var(--accent); background: #f7f3ea; }
        .chip.active { background: #f0e8d0; border-color: var(--accent); color: var(--accent); font-weight: 600; }
        .analyze-btn { width: 100%; padding: 16px; background: var(--accent); border: none; border-radius: var(--radius); color: #fff; font-family: var(--font); font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; display: flex; align-items: center; justify-content: center; gap: 10px; letter-spacing: 0.03em; margin-top: 24px; }
        .analyze-btn:hover:not(:disabled) { background: var(--accent-hover); }
        .analyze-btn:active:not(:disabled) { transform: scale(0.99); }
        .analyze-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-screen { max-width: 480px; margin: 80px auto; text-align: center; }
        .loading-title { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 400; color: var(--text); margin-bottom: 12px; }
        .loading-sub { font-size: 14px; color: var(--muted); line-height: 1.7; font-weight: 300; }
        .dna-animation { margin: 32px auto; display: flex; justify-content: center; gap: 5px; align-items: center; height: 40px; }
        .dna-bar { width: 3px; background: var(--accent); border-radius: 2px; animation: pulse 1.2s ease-in-out infinite; }
        .dna-bar:nth-child(even) { animation-delay: 0.15s; background: var(--text); opacity: 0.25; }
        .dna-bar:nth-child(3) { animation-delay: 0.2s; }
        .dna-bar:nth-child(5) { animation-delay: 0.4s; }
        .dna-bar:nth-child(7) { animation-delay: 0.6s; }
        @keyframes pulse { 0%, 100% { height: 10px; opacity: 0.3; } 50% { height: 36px; opacity: 1; } }
        .results-container { max-width: 860px; margin: 0 auto; }
        .results-header { margin-bottom: 24px; }
        .profile-badge { display: inline-block; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 8px 14px; font-size: 12px; color: var(--muted); margin-bottom: 10px; font-weight: 500; letter-spacing: 0.01em; }
        .life-exp-note { font-size: 14px; color: var(--muted); font-style: italic; font-family: 'Playfair Display', Georgia, serif; }
        .narrative-box { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: var(--radius); padding: 20px 22px; margin-bottom: 28px; }
        .narrative-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
        .narrative-box p { font-size: 14px; line-height: 1.75; color: var(--text); font-weight: 300; }
        .causes-table { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 24px; }
        .table-header { display: grid; grid-template-columns: 42px 1fr 90px 90px 80px 28px; padding: 10px 16px; background: var(--surface2); border-bottom: 1px solid var(--border); font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); gap: 8px; }
        .table-row { display: grid; grid-template-columns: 42px 1fr 90px 90px 80px 28px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; gap: 8px; cursor: pointer; transition: background 0.12s; }
        .table-row:hover { background: var(--surface2); }
        .table-row.elevated { background: rgba(184,64,64,0.03); }
        .table-row.elevated:hover { background: rgba(184,64,64,0.07); }
        .table-row.open { background: var(--surface2); }
        .rank-num { font-size: 12px; font-weight: 500; color: var(--muted); }
        .cause-name { font-size: 13px; font-weight: 400; color: var(--text); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .elevated-badge { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; background: rgba(184,64,64,0.08); color: var(--danger); border: 1px solid rgba(184,64,64,0.25); border-radius: 3px; padding: 2px 6px; text-transform: uppercase; }
        .annual-pct { font-size: 12px; font-weight: 600; color: var(--accent); }
        .odds-text { font-size: 10px; color: var(--muted); }
        .lifetime-pct { font-size: 11px; font-weight: 500; color: var(--text); }
        .expand-icon { font-size: 9px; color: var(--muted); text-align: right; }
        .bar-row { padding: 0 16px 5px; border-bottom: 1px solid var(--border); }
        .risk-bar-track { height: 3px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
        .risk-bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
        .note-row { padding: 10px 16px 12px 58px; font-size: 13px; color: var(--muted); line-height: 1.7; border-bottom: 1px solid var(--border); font-style: italic; font-family: 'Playfair Display', Georgia, serif; }
        .disclaimer { font-size: 12px; color: var(--muted); line-height: 1.7; padding: 22px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 24px; }
        .disclaimer-title { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; }
        .disclaimer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .disclaimer-block { background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 14px 16px; }
        .disclaimer-block strong { display: block; color: var(--text); font-size: 11px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .reset-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 10px 22px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: var(--font); }
        .reset-btn:hover { border-color: var(--accent); color: var(--accent); }
        .error-box { max-width: 480px; margin: 80px auto; text-align: center; }
        .error-box p { color: var(--danger); margin-bottom: 20px; word-break: break-word; text-align: left; font-size: 12px; font-family: monospace; }
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
          .form-section.full-width { grid-column: 1; }
          .table-header, .table-row { grid-template-columns: 32px 1fr 70px 0 60px 24px; }
          .table-header span:nth-child(4), .table-row .odds-text { display: none; }
          .field-row { grid-template-columns: 1fr; }
          .disclaimer-grid { grid-template-columns: 1fr; }
          .app-header { text-align: left; }
        }
      `}</style>

      <header className="app-header">
        <div className="app-eyebrow">Mortality Risk Calculator</div>
        <h1 className="app-title">What are the <em>real odds</em><br />of how you might die?</h1>
        <p className="app-sub">Enter your personal health profile. Get a data-driven breakdown of your top 30 causes of death — annual probability, lifetime risk, and what's elevated for you specifically.</p>
      </header>

      {phase === "form" && <ProfileForm onSubmit={analyze} loading={false} />}

      {phase === "loading" && (
        <div className="loading-screen">
          <div className="dna-animation">{[...Array(8)].map((_, i) => <div key={i} className="dna-bar" />)}</div>
          <div className="loading-title">Analyzing your profile…</div>
          <p className="loading-sub">Comparing your risk factors against CDC mortality data, actuarial tables, and epidemiological studies for all 30 causes.</p>
        </div>
      )}

      {phase === "results" && results && <Results data={results} onReset={() => { setResults(null); setPhase("form"); }} />}

      {phase === "error" && (
        <div className="error-box">
          <p>{errorMsg}</p>
          <button className="reset-btn" onClick={() => setPhase("form")}>← Try Again</button>
        </div>
      )}
    </div>
  );
}
