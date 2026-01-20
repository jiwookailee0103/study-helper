"use client";

import React, { useMemo, useState } from "react";
import nerdamer from "nerdamer";
import "nerdamer/Algebra";
import "nerdamer/Solve";

type ViewMode = "none" | "hint" | "steps" | "full";

function normalizeInput(raw: string) {
  return (
    raw
      .trim()
      // common symbol cleanups
      .replace(/\u2212/g, "-") // unicode minus
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      // remove spaces
      .replace(/\s+/g, "")
  );
}

function prettyEq(s: string) {
  return s
    .replace(/\*/g, "·")
    .replace(/-/g, "−");
}

export default function Page() {
  const [problem, setProblem] = useState<string>("x^2-5x+6=0");
  const [view, setView] = useState<ViewMode>("steps");

  const [hint, setHint] = useState<string>("");
  const [steps, setSteps] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [error, setError] = useState<string>("");

  const ui = useMemo(() => {
    const cardBg = "#ffffff";
    const pageBg = "#eef2f7";
    const text = "#0f172a";
    const muted = "#475569";
    const border = "#cbd5e1";
    const blue = "#2563eb";
    const greenBg = "#dcfce7";
    const greenBorder = "#22c55e";
    const blueBg = "#dbeafe";
    const blueBorder = "#3b82f6";
    const warnBg = "#fee2e2";
    const warnBorder = "#ef4444";
    const panelBg = "#f8fafc";
    return {
      cardBg,
      pageBg,
      text,
      muted,
      border,
      blue,
      greenBg,
      greenBorder,
      blueBg,
      blueBorder,
      warnBg,
      warnBorder,
      panelBg,
    };
  }, []);

  function clearOutput() {
    setHint("");
    setSteps([]);
    setAnswer("");
    setError("");
  }

  function handleSolve() {
    clearOutput();

    const cleaned = normalizeInput(problem);
    if (!cleaned) {
      setError("Type an equation, like 2x+7=25 or x^2-5x+6=0");
      return;
    }

    try {
      let left = "";
      let right = "";

      if (cleaned.includes("=")) {
        const parts = cleaned.split("=");
        if (parts.length !== 2 || parts[0] === "" || parts[1] === "") {
          setError("Please enter a valid equation with ONE '=' sign.");
          return;
        }
        left = parts[0];
        right = parts[1];
      } else {
        // If they don't type '=', assume expression = 0
        left = cleaned;
        right = "0";
      }

      // Build equation: left - (right) = 0
      const eq0 = nerdamer(`${left}-(${right})`).expand().toString();

      // Solve for x (this is the IMPORTANT part that fixes your Vercel error)
      const sols = nerdamer.solve(eq0, "x").toString();

      // Set hint + steps
      setHint("Tip: Move everything to one side (so it equals 0), then solve for x.");

      const stepList: string[] = [];
      stepList.push(`Start: ${prettyEq(left)} = ${prettyEq(right)}`);
      stepList.push(`Move everything to one side: ${prettyEq(eq0)} = 0`);
      stepList.push(`Solve for x: x = ${prettyEq(sols)}`);

      setSteps(stepList);
      setAnswer(`Solutions: ${sols}`);
    } catch (e: any) {
      // Nerdamer throws different shapes of errors; keep message readable
      setError("Couldn’t solve that. Try rewriting it more clearly (use ^ for powers, * for multiply).");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: ui.pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        color: ui.text,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
      }}
    >
      <div
        style={{
          width: "min(920px, 100%)",
          background: ui.cardBg,
          border: `1px solid ${ui.border}`,
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 18, borderBottom: `1px solid ${ui.border}` }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Study Helper</div>
          <div style={{ marginTop: 4, color: ui.muted, fontSize: 13 }}>
            Bright + readable • Algebra 1 → Algebra 2
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Type an equation (ex: 2x+7=25, x/4=30, x^2-5x+6=0)"
              style={{
                flex: 1,
                padding: "12px 12px",
                borderRadius: 10,
                border: `1px solid ${ui.border}`,
                outline: "none",
                fontSize: 15,
                background: "#ffffff",
                color: ui.text,
              }}
            />
            <button
              onClick={handleSolve}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: ui.blue,
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Solve
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {(
              [
                ["hint", "Hint"],
                ["steps", "Steps"],
                ["full", "Full Solution"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: `1px solid ${ui.border}`,
                  cursor: "pointer",
                  background: view === k ? "#e2e8f0" : "#ffffff",
                  color: ui.text,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setView("none")}
              style={{
                marginLeft: "auto",
                padding: "8px 12px",
                borderRadius: 999,
                border: `1px solid ${ui.border}`,
                cursor: "pointer",
                background: view === "none" ? "#e2e8f0" : "#ffffff",
                color: ui.text,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Hide
            </button>
          </div>
        </div>

        <div style={{ padding: 18, background: ui.panelBg }}>
          {error && (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: ui.warnBg,
                border: `1px solid ${ui.warnBorder}`,
                color: ui.text,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          {(view === "hint" || view === "steps" || view === "full") && hint && (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: ui.blueBg,
                border: `1px solid ${ui.blueBorder}`,
                color: ui.text,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Hint</div>
              <div style={{ color: ui.text, lineHeight: 1.6 }}>{hint}</div>
            </div>
          )}

          {(view === "steps" || view === "full") && steps.length > 0 && (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: "#ffffff",
                border: `1px solid ${ui.border}`,
                color: ui.text,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Steps</div>
              <ol style={{ margin: 0, paddingLeft: 18, color: ui.text, lineHeight: 1.8 }}>
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {view === "full" && answer && (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: ui.greenBg,
                border: `1px solid ${ui.greenBorder}`,
                color: ui.text,
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              {answer}
            </div>
          )}

          {view === "none" && (
            <div style={{ color: ui.muted, fontSize: 14 }}>
              Type an equation and click <b>Solve</b>. Then choose Hint / Steps / Full Solution.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}