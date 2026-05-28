import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react";

// ─── Types & Constants ────────────────────────────────────────────────────────

const ONBOARDING_TYPES = [
  { id: "personal_banking", label: "Personal Banking", icon: "🏦", desc: "Retail customer account opening" },
  { id: "business_banking", label: "Business Banking", icon: "🏢", desc: "SME & corporate account onboarding" },
  { id: "fintech_wallet", label: "Fintech Wallet", icon: "💳", desc: "Digital wallet & payments setup" },
  { id: "lending_credit", label: "Lending / Credit", icon: "📋", desc: "Loan & credit product application" },
  { id: "crypto_investment", label: "Crypto / Investment", icon: "📈", desc: "Trading & investment platform" },
];

const FOCUS_AREAS = [
  { id: "trust_transparency", label: "Trust & Transparency" },
  { id: "friction_reduction", label: "Friction Reduction" },
  { id: "ux_clarity", label: "UX Clarity" },
  { id: "accessibility", label: "Accessibility" },
  { id: "kyc_experience", label: "KYC Experience" },
  { id: "conversion_optimization", label: "Conversion Optimization" },
];

const STEP_TYPES = [
  { id: "value_explanation", label: "Value Explanation" },
  { id: "phone_verification", label: "Phone Verification" },
  { id: "email_verification", label: "Email Verification" },
  { id: "personal_details", label: "Personal Details" },
  { id: "business_details", label: "Business Details" },
  { id: "document_upload", label: "Document Upload" },
  { id: "selfie_verification", label: "Selfie Verification" },
  { id: "address_details", label: "Address Details" },
  { id: "consent", label: "Consent" },
  { id: "financial_information", label: "Financial Information" },
  { id: "tax_information", label: "Tax Information" },
  { id: "review_submit", label: "Review & Submit" },
  { id: "success_screen", label: "Success Screen" },
  { id: "other", label: "Other" },
];

const DEFAULT_FLOWS = {
  personal_banking: [
    { stepType: "value_explanation", stepName: "Value Explanation" },
    { stepType: "phone_verification", stepName: "Phone Verification" },
    { stepType: "email_verification", stepName: "Email Verification" },
    { stepType: "personal_details", stepName: "Personal Details" },
    { stepType: "document_upload", stepName: "Document Upload" },
    { stepType: "selfie_verification", stepName: "Selfie Verification" },
    { stepType: "address_details", stepName: "Address Details" },
    { stepType: "consent", stepName: "Consent" },
    { stepType: "success_screen", stepName: "Success Screen" },
  ],
  business_banking: [
    { stepType: "value_explanation", stepName: "Value Explanation" },
    { stepType: "business_details", stepName: "Business Details" },
    { stepType: "personal_details", stepName: "Personal Details" },
    { stepType: "document_upload", stepName: "Document Upload" },
    { stepType: "financial_information", stepName: "Financial Information" },
    { stepType: "tax_information", stepName: "Tax Information" },
    { stepType: "consent", stepName: "Consent" },
    { stepType: "review_submit", stepName: "Review & Submit" },
    { stepType: "success_screen", stepName: "Success Screen" },
  ],
  fintech_wallet: [
    { stepType: "value_explanation", stepName: "Value Explanation" },
    { stepType: "phone_verification", stepName: "Phone Verification" },
    { stepType: "email_verification", stepName: "Email Verification" },
    { stepType: "personal_details", stepName: "Personal Details" },
    { stepType: "consent", stepName: "Consent" },
    { stepType: "success_screen", stepName: "Success Screen" },
  ],
  lending_credit: [
    { stepType: "value_explanation", stepName: "Value Explanation" },
    { stepType: "personal_details", stepName: "Personal Details" },
    { stepType: "financial_information", stepName: "Financial Information" },
    { stepType: "document_upload", stepName: "Document Upload" },
    { stepType: "consent", stepName: "Consent" },
    { stepType: "review_submit", stepName: "Review & Submit" },
    { stepType: "success_screen", stepName: "Success Screen" },
  ],
  crypto_investment: [
    { stepType: "value_explanation", stepName: "Value Explanation" },
    { stepType: "email_verification", stepName: "Email Verification" },
    { stepType: "personal_details", stepName: "Personal Details" },
    { stepType: "document_upload", stepName: "Document Upload" },
    { stepType: "selfie_verification", stepName: "Selfie Verification" },
    { stepType: "tax_information", stepName: "Tax Information" },
    { stepType: "consent", stepName: "Consent" },
    { stepType: "success_screen", stepName: "Success Screen" },
  ],
};

const STEP_RISK_MAP = {
  value_explanation: { friction: "Low", trust: "Low", complexity: "Low", dropoff: "Low", comment: "Establishes initial user alignment and introduces platform values." },
  phone_verification: { friction: "Medium", trust: "Low", complexity: "Low", dropoff: "Medium", comment: "Requires active SMS retrieval; slight drop-off observed via cell delays." },
  email_verification: { friction: "Medium", trust: "Low", complexity: "Low", dropoff: "Medium", comment: "Forces app switching to inbox; creates high structural friction." },
  personal_details: { friction: "Medium", trust: "Medium", complexity: "Medium", dropoff: "Medium", comment: "Data entry fatigue points can develop quickly without smart address autofill." },
  business_details: { friction: "High", trust: "Medium", complexity: "High", dropoff: "High", comment: "Requires legal records lookups; documentation data mismatches are common." },
  document_upload: { friction: "High", trust: "High", complexity: "High", dropoff: "High", comment: "Highest point of drop-off due to poor camera capture or missing physical IDs." },
  selfie_verification: { friction: "High", trust: "High", complexity: "High", dropoff: "High", comment: "High psychological friction; biometrics generate strong privacy anxiety." },
  address_details: { friction: "Medium", trust: "Low", complexity: "Medium", dropoff: "Medium", comment: "Manual typing of postal parameters induces validation errors." },
  consent: { friction: "Low", trust: "High", complexity: "Low", dropoff: "Low", comment: "High trust requirements; clear terminology choices are essential here." },
  financial_information: { friction: "High", trust: "High", complexity: "Medium", dropoff: "High", comment: "Highly sensitive parameters; necessitates complete clarity regarding security." },
  tax_information: { friction: "High", trust: "High", complexity: "High", dropoff: "High", comment: "Requires lookup of tax IDs; causes session suspension if details are missing." },
  review_submit: { friction: "Low", trust: "Low", complexity: "Medium", dropoff: "Medium", comment: "Critical transition screen; user anxiety peaks prior to finalizing submissions." },
  success_screen: { friction: "Low", trust: "Low", complexity: "Low", dropoff: "Low", comment: "Maintains confirmation layout; crucial for setting operational next steps." },
  other: { friction: "Medium", trust: "Medium", complexity: "Medium", dropoff: "Medium", comment: "Unclassified workflow process block; ensure contextual styling matches rest." },
};

// ─── Audit Engine ─────────────────────────────────────────────────────────────

function calculateAudit(steps, onboardingType, focusAreas) {
  let trustConfidence = 85;
  let uxReadiness = 85;
  let frictionRisk = 20;
  let complexityRisk = 20;
  const recommendations = [];

  const types = steps.map(s => s.stepType);
  const total = steps.length;

  const clamp = (v) => Math.max(0, Math.min(100, v));

  // Rule Group 1: Step Counts
  if (total > 7 && !(onboardingType === "business_banking" && total <= 9)) {
    complexityRisk += 10; frictionRisk += 5;
    recommendations.push({ id: "r1a", severity: "Medium", category: "Complexity", title: "Onboarding Length Exceeds Friction Threshold", whyItMatters: "Cognitive overload increases dramatically when flows require too many context switches without clear segmentation.", recommendationText: "Group related fields into unified wizard steps or use progressive disclosure." });
  }
  if (total > 9) {
    complexityRisk += 20; frictionRisk += 10; uxReadiness -= 10;
    recommendations.push({ id: "r1b", severity: "High", category: "Friction", title: "High Vulnerability to Abandonment", whyItMatters: "A long multi-page workflow causes user fatigue and direct drop-offs in commercial acquisition funnels.", recommendationText: "Defer non-essential data collection past the initial account activation gate." });
  }
  if (total < 4) {
    trustConfidence -= 10;
    recommendations.push({ id: "r1c", severity: "Medium", category: "Trust", title: "Insufficient Verification Transparency", whyItMatters: "Failing to collect verification markers or context blocks early can make a financial platform appear un-credible or unsafe.", recommendationText: "Introduce structural trust indicators or verify baseline user information during setup." });
  }

  // Rule Group 2: Contextual Sequencing
  const sensitiveIdx = types.findIndex(t => t === "document_upload" || t === "selfie_verification");
  const valueIdx = types.indexOf("value_explanation");
  if ((types.includes("document_upload") || types.includes("selfie_verification")) && (valueIdx === -1 || (sensitiveIdx !== -1 && valueIdx > sensitiveIdx))) {
    frictionRisk += 15; trustConfidence -= 10;
    recommendations.push({ id: "r2a", severity: "High", category: "Trust", title: "Premature Sensitive Data Request", whyItMatters: "Users show immense friction when prompted for government IDs or biometrics before the platform establishes clear regulatory and feature value.", recommendationText: "Inject a clear value explanation screen directly before prompting for official documentation." });
  }
  if (sensitiveIdx === 0 || sensitiveIdx === 1) {
    frictionRisk += 20; uxReadiness -= 10;
    recommendations.push({ id: "r2b", severity: "Critical", category: "Friction", title: "Critical Upfront Friction Wall", whyItMatters: "Demanding immediate high-friction operations like identity documentation immediately at entry destroys sign-up conversion.", recommendationText: "Move heavy verification tasks to the middle or end of the setup sequence." });
  }
  const docIdx = types.indexOf("document_upload");
  const selfieIdx = types.indexOf("selfie_verification");
  if (docIdx !== -1 && selfieIdx !== -1 && Math.abs(docIdx - selfieIdx) === 1) {
    frictionRisk += 10;
    recommendations.push({ id: "r2c", severity: "Medium", category: "Friction", title: "Consecutive High-Friction Tasks", whyItMatters: "Stacking two heavy physical tasks consecutively compound user frustration and abandonment.", recommendationText: "Separate document upload and biometric verification with contextual feedback pages or status breaks." });
  }

  // Rule Group 3: Core Compliance
  if (!types.includes("consent")) {
    trustConfidence -= 15;
    recommendations.push({ id: "r3a", severity: "High", category: "Trust", title: "Missing Explicit Data Consent Gate", whyItMatters: "Modern fintech consumers expect transparent disclosure of data usage and privacy statements before sharing details.", recommendationText: "Incorporate a dedicated legal consent and privacy authorization step." });
  }
  if (types[total - 1] !== "success_screen") {
    uxReadiness -= 10;
    recommendations.push({ id: "r3b", severity: "Medium", category: "UX Clarity", title: "Ambiguous Completion State", whyItMatters: "Failing to definitively confirm submission leaves users anxious regarding verification wait times and clear next actions.", recommendationText: "Implement a definitive success screen detailing review SLAs and initial platform features." });
  }

  // Rule Group 4: Segment Restrictions
  if (onboardingType === "crypto_investment" && !types.includes("value_explanation")) {
    trustConfidence -= 20;
    recommendations.push({ id: "r4a", severity: "High", category: "Trust", title: "Missing Financial Risk Disclosures", whyItMatters: "Investment platforms without explicit hazard or risk breakdowns appear less professional and invite compliance scrutiny.", recommendationText: "Add a dedicated risk disclosure or investment profile experience step." });
  }
  if (onboardingType === "lending_credit" && !types.includes("consent")) {
    trustConfidence -= 15;
    recommendations.push({ id: "r4b", severity: "High", category: "Trust", title: "Missing Hard Credit Pull Authorization", whyItMatters: "Failing to explicitly clear credit file check permissions violates core trust patterns and creates regulatory liability.", recommendationText: "Insert clear credit evaluation authorization check boxes prior to final application submission." });
  }

  // Rule Group 5: Focus Domain Fillers
  if (focusAreas.includes("accessibility")) {
    recommendations.push({ id: "r5a", severity: "Medium", category: "Accessibility", title: "Enhance Form Recovery Assist", whyItMatters: "Complex KYC verification elements frequently fail validation, creating dead-ends for users relying on screen readers or adaptive inputs.", recommendationText: "Ensure plain-language inline validation errors and actionable remediation states are configured." });
  }
  if (focusAreas.includes("conversion_optimization")) {
    recommendations.push({ id: "r5b", severity: "Low", category: "Conversion", title: "Implement Inline Data Validation", whyItMatters: "Form submission errors discovered only at the end of long verification processes increase abandonment rates significantly.", recommendationText: "Deploy asynchronous inline field confirmation to trap formatting issues dynamically." });
  }
  if (focusAreas.includes("ux_clarity")) {
    recommendations.push({ id: "r5c", severity: "Medium", category: "UX Clarity", title: "Strengthen Step Labelling & Progress Indicators", whyItMatters: "Users who cannot gauge their position in a multi-step flow report higher abandonment intent, particularly at the midpoint of long KYC sequences.", recommendationText: "Add a persistent progress bar or step indicator to every screen in the onboarding sequence, showing both current position and total steps remaining." });
  }
  if (focusAreas.includes("friction_reduction")) {
    recommendations.push({ id: "r5d", severity: "Medium", category: "Friction", title: "Introduce Smart Field Pre-fill", whyItMatters: "Requiring users to manually type data that could be inferred or pre-filled — such as address from postcode or name from a document scan — significantly inflates completion time and error rates.", recommendationText: "Evaluate opportunities to pre-populate fields using device data, verified identity providers, or prior session inputs." });
  }
  if (focusAreas.includes("trust_transparency")) {
    recommendations.push({ id: "r5e", severity: "Low", category: "Trust", title: "Surface Security & Compliance Signals Early", whyItMatters: "Trust indicators such as regulatory body logos, encryption badges, and brief security copy reduce hesitation before sensitive data requests.", recommendationText: "Place trust signals on the landing and pre-KYC screens rather than only in the footer or consent step." });
  }
  if (focusAreas.includes("kyc_experience")) {
    recommendations.push({ id: "r5f", severity: "Medium", category: "KYC", title: "Add Pre-KYC Expectation Setting", whyItMatters: "Users who arrive at document upload or biometric steps without prior context — what to prepare, how long it takes, why it is required — abandon at significantly higher rates.", recommendationText: "Insert a brief KYC preparation screen before document upload or selfie steps, listing required documents, estimated time, and why verification is necessary." });
  }

  // Sort & limit
  const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const sorted = recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]).slice(0, 6);

  // Clamp & score
  trustConfidence = clamp(trustConfidence);
  uxReadiness = clamp(uxReadiness);
  frictionRisk = clamp(frictionRisk);
  complexityRisk = clamp(complexityRisk);
  const overallHealth = Math.round((trustConfidence + uxReadiness + (100 - frictionRisk) + (100 - complexityRisk)) / 4);

  const scores = { overallHealth, trustConfidence, frictionRisk, complexityRisk, uxReadiness };

  // Step analysis
  const stepAnalysis = steps.map(s => ({
    stepId: s.id,
    stepName: s.stepName,
    stepType: s.stepType,
    ...STEP_RISK_MAP[s.stepType] || STEP_RISK_MAP.other,
  }));

  // Best-practice matrix
  const firstSensitive = Math.min(
    types.indexOf("document_upload") === -1 ? 999 : types.indexOf("document_upload"),
    types.indexOf("selfie_verification") === -1 ? 999 : types.indexOf("selfie_verification")
  );
  const consentIdx = types.indexOf("consent");
  const lastIdx = total - 1;

  const bestPractices = [
    {
      principle: "Explain value before sensitive data requests",
      score: valueIdx !== -1 && (firstSensitive === 999 || valueIdx < firstSensitive) ? "Strong"
        : valueIdx !== -1 && valueIdx > firstSensitive ? "Needs Attention"
        : "Missing"
    },
    {
      principle: "Provide multi-stage progress visibility",
      score: total > 4 ? "Strong" : total === 3 || total === 4 ? "Needs Attention" : "Missing"
    },
    {
      principle: "Isolate intense KYC procedures with transitional feedback",
      score: docIdx !== -1 && selfieIdx !== -1 && Math.abs(docIdx - selfieIdx) > 1 ? "Strong"
        : (docIdx !== -1 && selfieIdx !== -1 && Math.abs(docIdx - selfieIdx) === 1) ? "Needs Attention"
        : (docIdx === -1 || selfieIdx === -1) ? "Strong"
        : "Missing"
    },
    {
      principle: "Expose data handling security credentials early",
      score: consentIdx !== -1 && consentIdx < total * 0.4 ? "Strong"
        : consentIdx !== -1 ? "Needs Attention"
        : "Missing"
    },
    {
      principle: "Deliver unambiguous completion milestones",
      score: types[lastIdx] === "success_screen" ? "Strong"
        : types.includes("review_submit") && !types.includes("success_screen") ? "Needs Attention"
        : "Missing"
    },
  ];

  return { scores, recommendations: sorted, stepAnalysis, bestPractices };
}

function generateExecutiveSummary(auditResult, onboardingType, focusAreas, steps) {
  const { scores, recommendations, bestPractices } = auditResult;
  const typeLabel = ONBOARDING_TYPES.find(t => t.id === onboardingType)?.label || onboardingType;
  const focusLabels = focusAreas.map(f => FOCUS_AREAS.find(a => a.id === f)?.label || f).join(", ");

  let assessment = "";
  if (scores.overallHealth >= 75) assessment = "The audited flow demonstrates a solid onboarding structure with targeted areas for improvement.";
  else if (scores.overallHealth >= 50) assessment = "The audited flow presents moderate onboarding risk. Several friction and trust gaps require attention before launch.";
  else assessment = "The audited flow presents significant onboarding risk. Critical issues should be resolved before user acquisition begins.";

  const top3 = recommendations.slice(0, 3);

  return `## FinTech Onboarding Audit — Executive Summary

**Product Type:** ${typeLabel}
**Steps Audited:** ${steps.length}
**Focus Areas:** ${focusLabels}
**Overall Health Score:** ${scores.overallHealth}/100

---

### Overall Assessment

${assessment}

---

### Key Findings

${top3.map(r => `- ${r.title}: ${r.whyItMatters.split(".")[0]}.`).join("\n")}

---

### Priority Actions

${top3.map((r, i) => `${i + 1}. ${r.recommendationText.split(".")[0]}.`).join("\n")}

---

### Score Breakdown

| Dimension        | Score   |
|------------------|---------|
| Overall Health   | ${scores.overallHealth}/100 |
| Trust Confidence | ${scores.trustConfidence}/100 |
| Friction Risk    | ${scores.frictionRisk}/100 |
| Complexity Risk  | ${scores.complexityRisk}/100 |
| UX Readiness     | ${scores.uxReadiness}/100 |

---

*Generated by FinTech Onboarding Audit. For reference only — not a compliance, legal, or regulatory assessment.*`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuditContext = createContext(null);

function AuditProvider({ children }) {
  const [currentStep, setCurrentStepState] = useState("landing");
  const [onboardingType, setOnboardingType] = useState(null);
  const [steps, setSteps] = useState([]);
  const [focusAreas, setFocusAreas] = useState([]);
  const [auditResult, setAuditResult] = useState(null);

  const setStep = useCallback((s) => setCurrentStepState(s), []);

  const updateOnboardingType = useCallback((type) => {
    setOnboardingType(type);
    const defaults = (DEFAULT_FLOWS[type] || []).map((s, i) => ({ ...s, id: `step-${Date.now()}-${i}` }));
    setSteps(defaults);
  }, []);

  const toggleFocusArea = useCallback((f) => {
    setFocusAreas(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }, []);

  const runAudit = useCallback(() => {
    const result = calculateAudit(steps, onboardingType, focusAreas);
    setAuditResult(result);
  }, [steps, onboardingType, focusAreas]);

  const resetAudit = useCallback(() => {
    setOnboardingType(null);
    setSteps([]);
    setFocusAreas([]);
    setAuditResult(null);
    setCurrentStepState("landing");
  }, []);

  return (
    <AuditContext.Provider value={{ currentStep, setStep, onboardingType, steps, setSteps, focusAreas, toggleFocusArea, updateOnboardingType, auditResult, runAudit, resetAudit }}>
      {children}
    </AuditContext.Provider>
  );
}

function useAudit() { return useContext(AuditContext); }

// ─── UI Primitives ────────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  Critical: "bg-red-100 text-red-800 border border-red-200",
  High: "bg-orange-100 text-orange-800 border border-orange-200",
  Medium: "bg-amber-100 text-amber-800 border border-amber-200",
  Low: "bg-slate-100 text-slate-600 border border-slate-200",
};

const RISK_STYLES = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-500",
};

const BP_STYLES = {
  Strong: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "Needs Attention": "bg-amber-100 text-amber-700 border border-amber-200",
  Missing: "bg-red-100 text-red-700 border border-red-200",
};

function Badge({ children, className = "" }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>{children}</span>;
}

function ScoreRing({ value, label, sub, color = "text-slate-900" }) {
  const pct = Math.round(value);
  const scoreColor = pct >= 70 ? "text-emerald-600" : pct >= 45 ? "text-amber-600" : "text-red-600";
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center">
      <div className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{pct}<span className="text-base font-normal text-slate-400">/100</span></div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage() {
  const { setStep } = useAudit();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">FO</span>
            </div>
            <span className="font-semibold text-slate-800 text-sm tracking-tight">FinTech Onboarding Audit</span>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">UX Diagnostic Tool</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 max-w-4xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Heuristic UX Audit Engine · v2
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
          Diagnose your<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-400">onboarding flow</span>
        </h1>

        <p className="text-lg text-slate-500 max-w-xl mb-10 leading-relaxed">
          A structured UX audit tool for fintech product teams. Identify friction, trust gaps, and drop-off risks before they cost you customers.
        </p>

        <button
          onClick={() => setStep("select_type")}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md text-sm"
        >
          Start onboarding audit →
        </button>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full text-left">
          {[
            { icon: "⚡", title: "Instant heuristic analysis", desc: "Deterministic scoring engine built on fintech UX best practices." },
            { icon: "🔍", title: "Step-by-step risk mapping", desc: "Friction, trust, and drop-off risk assessed per onboarding step." },
            { icon: "📊", title: "Consulting-grade report", desc: "Export-ready executive summary with prioritised recommendations." },
          ].map(f => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="text-sm font-semibold text-slate-800 mb-1">{f.title}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400">
        For reference only — not a compliance, legal, or regulatory assessment.
      </footer>
    </div>
  );
}

// ─── Step 2: Select Type ──────────────────────────────────────────────────────

function TypeSelection() {
  const { setStep, updateOnboardingType, onboardingType } = useAudit();
  const [selected, setSelected] = useState(onboardingType);

  const handleNext = () => {
    if (!selected) return;
    updateOnboardingType(selected);
    setStep("build_flow");
  };

  return (
    <WizardShell step={1} title="Select onboarding type" sub="Choose the financial product category you are auditing." onBack={() => setStep("landing")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ONBOARDING_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${selected === t.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className={`text-sm font-semibold mb-1 ${selected === t.id ? "text-white" : "text-slate-800"}`}>{t.label}</div>
            <div className={`text-xs ${selected === t.id ? "text-slate-300" : "text-slate-400"}`}>{t.desc}</div>
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!selected}
          className="bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all"
        >
          Continue →
        </button>
      </div>
    </WizardShell>
  );
}

// ─── Step 3: Build Flow ───────────────────────────────────────────────────────

function StepBuilder() {
  const { setStep, steps, setSteps } = useAudit();
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("builder");

  const addStep = () => {
    const newStep = { id: `step-${Date.now()}`, stepName: "New Step", stepType: "other" };
    setSteps(prev => [...prev, newStep]);
    setEditingId(newStep.id);
  };

  const updateStep = (id, field, value) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteStep = (id) => setSteps(prev => prev.filter(s => s.id !== id));

  const moveStep = (id, dir) => {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if ((dir === -1 && idx === 0) || (dir === 1 && idx === prev.length - 1)) return prev;
      const next = [...prev];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return next;
    });
  };

  return (
    <WizardShell step={2} title="Define your onboarding flow" sub="Build the step sequence you want to audit." onBack={() => setStep("select_type")}>
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-5 w-fit">
        {["builder", "screenshots"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "builder" ? "Step builder" : "Screenshot upload"}
          </button>
        ))}
      </div>

      {activeTab === "builder" ? (
        <>
          {steps.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
              <div className="text-3xl mb-3">🔧</div>
              <p className="text-slate-500 text-sm mb-4">Add your first step to begin building the flow.</p>
              <button onClick={addStep} className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-all">+ Add step</button>
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">{i + 1}</div>
                  {editingId === s.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                      <input
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        value={s.stepName}
                        onChange={e => updateStep(s.id, "stepName", e.target.value)}
                        onBlur={() => setEditingId(null)}
                        autoFocus
                      />
                      <select
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                        value={s.stepType}
                        onChange={e => updateStep(s.id, "stepType", e.target.value)}
                      >
                        {STEP_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="flex-1 cursor-pointer" onClick={() => setEditingId(s.id)}>
                      <span className="text-sm font-medium text-slate-800">{s.stepName}</span>
                      <span className="ml-2 text-xs text-slate-400">{STEP_TYPES.find(t => t.id === s.stepType)?.label}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => moveStep(s.id, -1)} disabled={i === 0} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 text-xs transition-all">↑</button>
                    <button onClick={() => moveStep(s.id, 1)} disabled={i === steps.length - 1} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 text-xs transition-all">↓</button>
                    <button onClick={() => deleteStep(s.id)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all text-xs">✕</button>
                  </div>
                </div>
              ))}
              <button onClick={addStep} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all">+ Add step</button>
            </div>
          )}
        </>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <div className="text-3xl mb-3">🖼️</div>
          <p className="text-sm font-medium text-slate-700 mb-1">Drop screenshots here for visual reference</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Images are for reference purposes only and are not processed, analyzed, or stored. Audit logic runs exclusively from the step configuration above.</p>
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <span className="text-xs text-slate-400">{steps.length} step{steps.length !== 1 ? "s" : ""} configured</span>
        <button
          onClick={() => setStep("configure_focus")}
          disabled={steps.length === 0}
          title={steps.length === 0 ? "Add at least one step to run the audit." : ""}
          className="bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all"
        >
          Continue →
        </button>
      </div>
      {steps.length === 0 && <p className="text-xs text-amber-600 mt-2 text-right">Add at least one step to run the audit.</p>}
    </WizardShell>
  );
}

// ─── Step 4: Focus Configuration ─────────────────────────────────────────────

function FocusConfiguration() {
  const { setStep, focusAreas, toggleFocusArea } = useAudit();
  const [showError, setShowError] = useState(false);

  const handleNext = () => {
    if (focusAreas.length === 0) { setShowError(true); return; }
    setStep("review");
  };

  return (
    <WizardShell step={3} title="Configure audit focus" sub="Select the areas you want the audit to prioritise." onBack={() => setStep("build_flow")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FOCUS_AREAS.map(f => {
          const active = focusAreas.includes(f.id);
          return (
            <button key={f.id} onClick={() => { toggleFocusArea(f.id); setShowError(false); }}
              className={`text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${active ? "border-white bg-white" : "border-slate-300"}`}>
                {active && <span className="text-slate-900 text-xs font-bold">✓</span>}
              </div>
              <span className={`text-sm font-medium ${active ? "text-white" : "text-slate-800"}`}>{f.label}</span>
            </button>
          );
        })}
      </div>
      {showError && <p className="text-xs text-red-500 mt-3">Select at least one focus area to tailor your audit.</p>}
      <div className="mt-6 flex justify-end">
        <button onClick={handleNext} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all">
          Continue →
        </button>
      </div>
    </WizardShell>
  );
}

// ─── Step 5: Review & Run ─────────────────────────────────────────────────────

function ReviewRun() {
  const { setStep, onboardingType, steps, focusAreas, runAudit } = useAudit();
  const typeLabel = ONBOARDING_TYPES.find(t => t.id === onboardingType)?.label || "";

  const handleRun = () => {
    runAudit();
    setStep("loading");
  };

  return (
    <WizardShell step={4} title="Review & run audit" sub="Confirm your configuration before running the analysis." onBack={() => setStep("configure_focus")}>
      <div className="space-y-4">
        <ReviewSection label="Onboarding type">
          <span className="text-sm font-medium text-slate-800">{typeLabel}</span>
        </ReviewSection>
        <ReviewSection label={`Flow steps (${steps.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {steps.map((s, i) => (
              <span key={s.id} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full">
                <span className="text-slate-400">{i + 1}.</span> {s.stepName}
              </span>
            ))}
          </div>
        </ReviewSection>
        <ReviewSection label="Focus areas">
          <div className="flex flex-wrap gap-1.5">
            {focusAreas.map(f => (
              <span key={f} className="bg-slate-900 text-white text-xs px-2.5 py-1 rounded-full">
                {FOCUS_AREAS.find(a => a.id === f)?.label}
              </span>
            ))}
          </div>
        </ReviewSection>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleRun}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
        >
          Run audit →
        </button>
      </div>
    </WizardShell>
  );
}

function ReviewSection({ label, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
      {children}
    </div>
  );
}

// ─── Step 6: Loading ──────────────────────────────────────────────────────────

function LoadingState() {
  const { setStep } = useAudit();
  const messages = [
    "Checking onboarding friction patterns...",
    "Reviewing step complexity...",
    "Comparing against fintech onboarding best practices...",
    "Detecting trust and transparency gaps...",
    "Preparing recommendations...",
  ];
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(prev => Math.min(prev + 1, messages.length - 1));
      setProgress(prev => Math.min(prev + 20, 100));
    }, 550);
    const timer = setTimeout(() => {
      clearInterval(interval);
      setStep("dashboard");
    }, 2800);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-8">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-8"></div>
        <div className="text-sm font-medium text-slate-700 mb-6 min-h-[20px] transition-all duration-300">{messages[msgIdx]}</div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div className="bg-slate-900 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="text-xs text-slate-400 mt-3">{progress}% complete</div>
      </div>
    </div>
  );
}

// ─── Step 7: Dashboard ────────────────────────────────────────────────────────

function Dashboard() {
  const { setStep, resetAudit, auditResult, onboardingType, focusAreas, steps } = useAudit();
  const { scores, recommendations, stepAnalysis, bestPractices } = auditResult;

  const criticalHigh = recommendations.filter(r => r.severity === "Critical" || r.severity === "High");
  const shortFlow = steps.length < 3;

  const execSummary = generateExecutiveSummary(auditResult, onboardingType, focusAreas, steps);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(execSummary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-bold">FO</div>
                <span className="text-xs text-slate-400">Audit Report</span>
              </div>
              <h1 className="text-xl font-bold">Onboarding Audit — {ONBOARDING_TYPES.find(t => t.id === onboardingType)?.label}</h1>
              <p className="text-sm text-slate-400 mt-0.5">{steps.length} steps · {focusAreas.length} focus areas</p>
            </div>
            <button onClick={resetAudit} className="text-sm border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-all flex-shrink-0">
              + Start new audit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Short flow warning */}
        {shortFlow && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            ⚠ Very short flows may not trigger all audit rules — consider adding more steps for a complete analysis.
          </div>
        )}

        {/* A: Score Summary */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Score summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <ScoreRing value={scores.overallHealth} label="Overall Health" sub="Combined" />
            <ScoreRing value={scores.trustConfidence} label="Trust Confidence" sub="Higher is better" />
            <ScoreRing value={scores.frictionRisk} label="Friction Risk" sub="Lower is better" />
            <ScoreRing value={scores.complexityRisk} label="Complexity Risk" sub="Lower is better" />
            <ScoreRing value={scores.uxReadiness} label="UX Readiness" sub="Higher is better" />
          </div>
        </section>

        {/* C: Critical Issues */}
        {criticalHigh.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Critical & high severity issues</h2>
            <div className="space-y-3">
              {criticalHigh.slice(0, 3).map(r => (
                <div key={r.id} className={`border rounded-xl p-4 ${r.severity === "Critical" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{r.severity === "Critical" ? "🚨" : "⚠️"}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={SEVERITY_STYLES[r.severity]}>{r.severity}</Badge>
                        <Badge className="bg-slate-100 text-slate-600 border border-slate-200">{r.category}</Badge>
                        <span className="text-sm font-semibold text-slate-900">{r.title}</span>
                      </div>
                      <p className="text-xs text-slate-600">{r.whyItMatters}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* B: Drop-off Risk Heatmap */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Drop-off risk heatmap</h2>
          <div className="bg-slate-900 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-4 text-xs">
                {["High", "Medium", "Low"].map(l => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${l === "High" ? "bg-red-400" : l === "Medium" ? "bg-amber-400" : "bg-slate-500"}`}></div>
                    <span className="text-slate-400">{l} risk</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 space-y-2">
              {stepAnalysis.map((s, i) => {
                const barColor = s.dropoff === "High" ? "bg-red-400" : s.dropoff === "Medium" ? "bg-amber-400" : "bg-slate-600";
                const barPct = s.dropoff === "High" ? 85 : s.dropoff === "Medium" ? 55 : 25;
                return (
                  <div key={s.stepId} className="flex items-center gap-3">
                    <div className="w-5 text-right text-xs text-slate-500 flex-shrink-0">{i + 1}</div>
                    <div className="w-28 sm:w-40 text-xs text-slate-300 truncate flex-shrink-0">{s.stepName}</div>
                    <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div className={`h-3 rounded-full transition-all ${barColor}`} style={{ width: `${barPct}%` }}></div>
                    </div>
                    <Badge className={`${s.dropoff === "High" ? "bg-red-900 text-red-200 border-red-700" : s.dropoff === "Medium" ? "bg-amber-900 text-amber-200 border-amber-700" : "bg-slate-700 text-slate-300 border-slate-600"} border text-xs flex-shrink-0`}>{s.dropoff}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* D: Step Analysis Table */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Step analysis</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  {["#", "Step", "Step Type", "Friction", "Trust", "Complexity", "Drop-off", "Notes"].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-300 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {stepAnalysis.map((s, i) => (
                  <tr key={s.stepId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-3 py-3 text-xs font-medium text-slate-800 whitespace-nowrap">{s.stepName}</td>
                    <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{STEP_TYPES.find(t => t.id === s.stepType)?.label}</td>
                    <td className="px-3 py-3"><Badge className={RISK_STYLES[s.friction]}>{s.friction}</Badge></td>
                    <td className="px-3 py-3"><Badge className={RISK_STYLES[s.trust]}>{s.trust}</Badge></td>
                    <td className="px-3 py-3"><Badge className={RISK_STYLES[s.complexity]}>{s.complexity}</Badge></td>
                    <td className="px-3 py-3"><Badge className={RISK_STYLES[s.dropoff]}>{s.dropoff}</Badge></td>
                    <td className="px-3 py-3 text-xs text-slate-500 max-w-xs">{s.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* E: Recommendations */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recommendations</h2>
          <div className="space-y-3">
            {recommendations.map(r => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className={SEVERITY_STYLES[r.severity]}>{r.severity}</Badge>
                  <Badge className="bg-slate-100 text-slate-600 border border-slate-200">{r.category}</Badge>
                  <h3 className="text-sm font-semibold text-slate-900">{r.title}</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Why it matters</span>
                    <p className="text-sm text-slate-600 mt-0.5">{r.whyItMatters}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recommended action</span>
                    <p className="text-sm text-slate-800 mt-0.5">{r.recommendationText}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* F: Best-Practice Matrix */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Best-practice assessment</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {bestPractices.map((bp, i) => (
              <div key={i} className={`flex items-center justify-between gap-4 px-5 py-4 ${i < bestPractices.length - 1 ? "border-b border-slate-100" : ""}`}>
                <span className="text-sm text-slate-700">{bp.principle}</span>
                <Badge className={`${BP_STYLES[bp.score]} flex-shrink-0`}>{bp.score}</Badge>
              </div>
            ))}
          </div>
        </section>

        {/* G: Executive Summary */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Executive summary</h2>
            <button
              onClick={handleCopy}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${copied ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}
            >
              {copied ? "✓ Copied!" : "Copy to clipboard"}
            </button>
          </div>
          <pre className="bg-slate-900 text-slate-200 text-xs leading-relaxed p-6 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap">
            {execSummary}
          </pre>
        </section>
      </div>

      <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400 mt-4">
        FinTech Onboarding Audit · For reference only — not a compliance, legal, or regulatory assessment.
      </footer>
    </div>
  );
}

// ─── Wizard Shell ─────────────────────────────────────────────────────────────

function WizardShell({ step, title, sub, onBack, children }) {
  const STEPS = ["Select type", "Build flow", "Focus areas", "Review"];
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">FO</span>
            </div>
            <span className="font-semibold text-slate-800 text-sm">FinTech Onboarding Audit</span>
          </div>
          {onBack && (
            <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
              ← Back
            </button>
          )}
        </div>
      </nav>

      {/* Progress */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${i + 1 === step ? "text-slate-900" : i + 1 < step ? "text-slate-400" : "text-slate-300"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${i + 1 === step ? "bg-slate-900 text-white" : i + 1 < step ? "bg-slate-200 text-slate-500" : "bg-slate-100 text-slate-300"}`}>
                    {i + 1 < step ? "✓" : i + 1}
                  </div>
                  <span className="hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`h-px w-6 sm:w-12 ${i + 1 < step ? "bg-slate-300" : "bg-slate-100"}`}></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── App Router ───────────────────────────────────────────────────────────────

function AppRouter() {
  const { currentStep } = useAudit();
  switch (currentStep) {
    case "landing": return <LandingPage />;
    case "select_type": return <TypeSelection />;
    case "build_flow": return <StepBuilder />;
    case "configure_focus": return <FocusConfiguration />;
    case "review": return <ReviewRun />;
    case "loading": return <LoadingState />;
    case "dashboard": return <Dashboard />;
    default: return <LandingPage />;
  }
}

export default function App() {
  return (
    <AuditProvider>
      <AppRouter />
    </AuditProvider>
  );
}
