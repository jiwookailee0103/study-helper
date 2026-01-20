"use client";

import React, { useState } from "react";
import nerdamer from "nerdamer";
import "nerdamer/Algebra";
import "nerdamer/Solve";
import Tesseract from "tesseract.js";

type ViewMode = "none" | "hint" | "steps" | "full";

function normalizeInput(s: string) {
  let x = s.replace(/\s+/g, "");

  // Replace common OCR mistakes:
  x = x
    .replace(/÷/g, "/")
    .replace(/×/g, "*")
    .replace(/—|–/g, "-")
    .replace(/=/g, "=");

  // Make implicit multiplication explicit for nerdamer:
  x = x
    .replace(/(\d)([a-zA-Z])/g, "$1*$2")
    .replace(/(\))(\()/g, "$1*$2")
    .replace(/([a-zA-Z])(\()/g, "$1*$2")
    .replace(/(\))([a-zA-Z])/g, "$1*$2");

  return x;
}

function cleanOCRTextToEquation(text: string) {
  // Keep it simple: pull the most "equation-looking" line.
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Prefer a line with "="
  const eqLine = lines.find((l) => l.includes("="));
  const best = eqLine ?? lines[0] ?? "";

  // Remove spaces, fix common OCR symbol issues
  return best
    .replace(/\s+/g, "")
    .replace(/÷/g, "/")
    .replace(/×/g, "*")
    .replace(/—|–/g, "-");
}

export default function Home() {
  const [problem, setProblem] = useState("");
  const [hint, setHint] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [view, setView] = useState<ViewMode>("none");

  const [ocrStatus, setOcrStatus] = useState<string>("");
  const [ocrLoading, setOcrLoading] = useState(false);

  function isAdvanced(p: string) {
    const s = normalizeInput(p);
    return s.includes("^") || s.includes("(") || s.includes(")") || s.includes("*") || s.includes("/");
  }

  function solveAdvanced(p: string) {
    try {
      const cleaned = normalizeInput(p);
      const [L, R] = cleaned.split("=");
      if (!L || !R) {
        setHint("Make sure it looks like: left = right");
        return;
      }

   const eq0 = nerdamer(`${L}-(${R})`)
  .expand()
  .toString();

      setHint("Advanced solver used (Algebra 2+).");
      setSteps([
        `Start: ${L} = ${R}`,
        `Move everything to one side: ${eq0} = 0`,
        `Solve for x.`,
      ]);
      setAnswer(`Solutions: ${sols}`);
    } catch {
      setHint("Couldn't solve this advanced equation.");
    }
  }

  function handleSolve() {
    setHint("");
    setSteps([]);
    setAnswer("");
    setView("none");

    const raw = problem.trim();
    if (!raw) {
      setHint("Type something first (example: 2x + 3 = 7).");
      setView("hint");
      return;
    }

    if (!raw.includes("=")) {
      setHint("Please enter an equation with '=' (example: 2x + 3 = 7).");
      setView("hint");
      return;
    }

    if (isAdvanced(raw)) {
      solveAdvanced(raw);
      setView("hint");
      return;
    }

    // Simple Algebra 1: ax + b = c
    try {
      const clean = raw.replace(/\s/g, "");
      const [left, right] = clean.split("=");

      const m = left.match(/^([0-9]*)x([\+\-][0-9]+)?$/);
      if (!m) {
        setHint(
          "Try something like 5x-9=81 or 2x+7=25. For harder ones (parentheses/powers), it will switch to Algebra 2 mode."
        );
        setView("hint");
        return;
      }

      const a = m[1] === "" ? 1 : Number(m[1]);
      const b = m[2] ? Number(m[2]) : 0;
      const c = Number(right);

      if (Number.isNaN(c)) {
        setHint("Right side must be a number.");
        setView("hint");
        return;
      }

      const x = (c - b) / a;

      setHint("Goal: isolate x. Move the constant, then divide.");
      setSteps([
        `Start: ${left} = ${right}`,
        b !== 0
          ? `Subtract ${b} from both sides → ${a}x = ${c - b}`
          : `No constant to move → ${a}x = ${c}`,
        `Divide both sides by ${a} → x = ${x}`,
      ]);
      setAnswer(`x = ${x}`);
      setView("hint");
    } catch {
      setHint("Couldn't solve this equation.");
      setView("hint");
    }
  }

  async function handleImageUpload(file: File) {
    setOcrLoading(true);
    setOcrStatus("Reading image...");
    setHint("");
    setSteps([]);
    setAnswer("");
    setView("none");

    try {
      const {
        data: { text },
      } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrStatus(`OCR: ${Math.round((m.progress ?? 0) * 100)}%`);
          } else {
            setOcrStatus(`OCR: ${m.status}`);
          }
        },
      });

      const eq = cleanOCRTextToEquation(text);
      if (!eq) {
        setOcrStatus("OCR finished, but I couldn't find an equation.");
        return;
      }

      setProblem(eq);
      setOcrStatus("OCR finished ✅ (Equation placed into the box)");
      // Optional: auto-solve after OCR:
      // setTimeout(handleSolve, 50);
    } catch {
      setOcrStatus("OCR failed. Try a clearer photo (good light, straight, close-up).");
    } finally {
      setOcrLoading(false);
    }
  }

  // ----- Styles (forced light theme)
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f4f8ff, #e9efff)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    colorScheme: "light",
  };

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 820,
    background: "#ffffff",
    borderRadius: 18,
    boxShadow: "0 20px 40px rgba(0,0,0,0.10)",
    border: "1px solid #dbe4ff",
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    borderRadius: 999,
    border: `2px solid ${active ? "#2563eb" : "#c7d2fe"}`,
    background: active ? "#dbeafe" : "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 700,
    cursor: "pointer",
  });

  return (
    <div style={page}>
      <div style={card}>
        <div style={{ padding: 20, borderBottom: "1px solid #dbe4ff" }}>
          <h1 style={{ margin: 0, color: "#1e3a8a" }}>Study Helper</h1>
          <p style={{ marginTop: 6, color: "#334155", fontSize: 14 }}>
            Type or take a photo • Algebra 1 → Algebra 2
          </p>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Type: x^2-5x+6=0   or   5x-9=81"
              style={{
                flex: "1 1 340px",
                padding: 12,
                borderRadius: 12,
                border: "2px solid #c7d2fe",
                fontSize: 16,
                color: "#0f172a",
                background: "#ffffff",
                outline: "none",
              }}
            />

            <button
              onClick={handleSolve}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                border: "none",
                background: "#2563eb",
                color: "white",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Solve
            </button>
          </div>

          {/* Photo upload */}
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label
              style={{
                display: "inline-block",
                padding: "10px 14px",
                borderRadius: 12,
                border: "2px solid #c7d2fe",
                background: "#eef2ff",
                color: "#1e3a8a",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {ocrLoading ? "Reading..." : "Take/Upload Photo"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <span style={{ color: "#475569", fontSize: 13 }}>
              {ocrStatus || "Tip: take a straight, close-up photo with good light."}
            </span>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setView("hint")} style={chip(view === "hint")}>
              Hint
            </button>
            <button onClick={() => setView("steps")} style={chip(view === "steps")}>
              Steps
            </button>
            <button onClick={() => setView("full")} style={chip(view === "full")}>
              Full Solution
            </button>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {view === "none" && (
            <p style={{ color: "#334155" }}>
              You can type an equation or use a photo. Click <strong>Solve</strong>, then reveal Hint / Steps / Full Solution.
            </p>
          )}

          {(view === "hint" || view === "steps" || view === "full") && hint && (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#eef2ff",
                borderLeft: "6px solid #2563eb",
                color: "#0f172a",
                marginBottom: 12,
              }}
            >
              <strong>Hint:</strong> {hint}
            </div>
          )}

          {(view === "steps" || view === "full") && steps.length > 0 && (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderLeft: "6px solid #22c55e",
                color: "#0f172a",
                marginBottom: 12,
              }}
            >
              <strong>Steps</strong>
              <ol style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.6 }}>
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {view === "full" && answer && (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "#dcfce7",
                border: "1px solid #bbf7d0",
                borderLeft: "6px solid #16a34a",
                color: "#065f46",
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              {answer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}