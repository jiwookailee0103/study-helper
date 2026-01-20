"use client";

import React, { useMemo, useState } from "react";
import nerdamer from "nerdamer";
import "nerdamer/Algebra";
import "nerdamer/Solve";

type ViewMode = "none" | "hint" | "steps" | "full";

function normalizeInput(raw: string) {
  return raw
    .trim()
    .replace(/\s+/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/[×]/g, "*")
    .replace(/[÷]/g, "/");
}

function isSimpleLinear(eq: string) {
  // Very basic check: contains x, and not x^2 or higher powers, and not trig/log/etc.
  const lowered = eq.toLowerCase();
  if (!lowered.includes("x")) return false;
  if (lowered.includes("x^")) return false;
  if (/[a-wyz]/i.test(lowered.replace(/x/gi, ""))) return false; // other letters
  if (lowered.includes("sin") || lowered.includes("cos") || lowered.includes("tan")) return false;
  if (lowered.includes("log") || lowered.includes("ln") || lowered.includes("sqrt")) return false;
  return true;
}

function safeSolveWithNerdamer(input: string) {
  const steps: string[] = [];
  const cleaned = normalizeInput(input);

  if (!cleaned.includes("=")) {
    return {
      ok: false,
      hint: `Please enter an equation like 2x+3=7 (include "=").`,
      steps: [],
      answer: "",
    };
  }

  const [L, R] = cleaned.split("=");
  if (!L || !R) {
    return {
      ok: false,
      hint: `That "=" looks incomplete. Try something like x/4=30`,
      steps: [],
      answer: "",
    };
  }

  // Build equation as "L-(R)" so we can solve L-R = 0
  // (Avoid .simplify() to prevent the TS error you saw on Vercel)
  const eq0 = nerdamer(`(${L})-(${R})`).expand().toString();

  steps.push(`Start: ${L} = ${R}`);
  steps.push(`Move everything to one side: (${L}) - (${R}) = 0`);
  steps.push(`Expanded form: ${eq0} = 0`);
  steps.push(`Solve for x`);

  let solsRaw = "";
  try {
    solsRaw = nerdamer.solve(eq0, "x").toString(); // returns something like [2,3] or 9
  } catch (e: any) {
    return {
      ok: false,
      hint: `Couldn't solve that (check your equation formatting).`,
      steps,
      answer: "",
    };
  }

  // Make it look nicer
  const prettySols = solsRaw.startsWith("[") ? solsRaw : `[${solsRaw}]`;

  return {
    ok: true,
    hint: isSimpleLinear(cleaned)
      ? "Goal: isolate x (move terms, then divide)."
      : "Advanced solver used (Algebra 1–2).",
    steps,
    answer: `Solutions: ${prettySols}`,
  };
}

export default function Page() {
  const [problem, setProblem] = useState("x^2-5x+6=0");
  const [hint, setHint] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [view, setView] = useState<ViewMode>("none");
  const [error, setError] = useState("");

  const canShow = useMemo(() => view !== "none", [view]);

  function handleSolve() {
    setError("");
    setHint("");
    setSteps([]);
    setAnswer("");

    const res = safeSolveWithNerdamer(problem);

    if (!res.ok) {
      setError(res.hint);
      setView("none");
      return;
    }

    setHint(res.hint);
    setSteps(res.steps);
    setAnswer(res.answer);

    // Keep whatever tab they selected; if none, default to "full"
    setView((prev) => (prev === "none" ? "full" : prev));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "linear-gradient(180deg, #f6f8ff 0%, #eef3ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0f172a",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <div
        style={{
          width: "min(780px, 92vw)",
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 18, borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Study Helper</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
            Bright • readable • Algebra 1 → Algebra 2
          </div>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Type an equation (ex: x/4=30 or x^2-5x+6=0)"
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(15,23,42,0.18)",
                outline: "none",
                fontSize: 14,
                background: "white",
              }}
            />
            <button
              onClick={handleSolve}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(37,99,235,0.25)",
                background: "#2563eb",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Solve
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: "#fff1f2",
                border: "1px solid rgba(225,29,72,0.25)",
                color: "#9f1239",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(["hint", "steps", "full"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(15,23,42,0.14)",
                  background: view === m ? "#0f172a" : "white",
                  color: view === m ? "white" : "#0f172a",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {m === "hint" ? "Hint" : m === "steps" ? "Steps" : "Full Solution"}
              </button>
            ))}
          </div>

          {canShow && hint && (view === "hint" || view === "full") && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 14,
                background: "#eff6ff",
                border: "1px solid rgba(37,99,235,0.20)",
                borderLeft: "6px solid #2563eb",
                color: "#0f172a",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Hint</div>
              <div style={{ color: "#1e293b", lineHeight: 1.5 }}>{hint}</div>
            </div>
          )}

          {canShow && steps.length > 0 && (view === "steps" || view === "full") && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 14,
                background: "#f0fdf4",
                border: "1px solid rgba(34,197,94,0.22)",
                borderLeft: "6px solid #22c55e",
                color: "#0f172a",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Steps</div>
              <ol style={{ margin: 0, paddingLeft: 18, color: "#1e293b", lineHeight: 1.7 }}>
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {canShow && answer && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 14,
                background: "#ecfeff",
                border: "1px solid rgba(6,182,212,0.22)",
                borderLeft: "6px solid #06b6d4",
                color: "#0f172a",
              }}
            >
              <div style={{ fontWeight: 900 }}>Answer</div>
              <div style={{ marginTop: 6, fontSize: 15, color: "#0f172a" }}>{answer}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}