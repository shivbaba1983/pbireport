import React, { useState } from "react";

/**
 * OracleToDatabricksConverter.tsx
 *
 * Simple utility component to convert Oracle SQL snippets to Databricks-friendly SQL.
 *
 * Notes:
 *  - This uses regex-based transforms for common patterns.
 *  - It attempts to preserve intent and inserts comments where manual review is recommended.
 *  - For PL/SQL procedural blocks and very complex expressions, rewrite manually in PySpark/Scala.
 */

const exampleOracle = `-- Example Oracle script
CREATE TABLE employees (
  emp_id NUMBER(10) PRIMARY KEY,
  emp_name VARCHAR2(100),
  hire_date DATE DEFAULT SYSDATE,
  salary NUMBER(10,2),
  notes CLOB
);

INSERT INTO employees (emp_id, emp_name, hire_date, salary)
VALUES (emp_seq.NEXTVAL, NVL('John Doe', 'Unknown'), SYSDATE, 5000);

SELECT emp_name || ' - ' || TO_CHAR(hire_date, 'YYYY-MM-DD') AS emp_info,
       DECODE(status, 'A', 'Active', 'I', 'Inactive', 'Unknown') as status_text
FROM employees;
`;

export default function OracleToDatabricksConverter(): JSX.Element {
  const [input, setInput] = useState<string>(exampleOracle);
  const [output, setOutput] = useState<string>("");
  const [log, setLog] = useState<string>("");

  function addLog(msg: string) {
    setLog((l) => (l ? l + "\n" + msg : msg));
  }

  function convertAll(sql: string): string {
    setLog("");
    addLog("Starting conversion...");
    let s = sql;

    // 1) Normalize whitespace a little
    s = s.replace(/\r\n/g, "\n");

    // 2) Replace data types
    addLog("Mapping data types...");
    // NUMBER(p,s) -> DECIMAL(p,s)
    s = s.replace(/NUMBER\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, (_m, p, sc) => `DECIMAL(${p},${sc})`);
    // NUMBER -> DECIMAL(38,0) (generic) - often replaced with BIGINT/DOUBLE depending on usage
    s = s.replace(/\bNUMBER\b/gi, "DECIMAL(38,0)");
    // VARCHAR2(n) and CHAR -> STRING
    s = s.replace(/VARCHAR2\s*\(\s*\d+\s*\)/gi, "STRING");
    s = s.replace(/\bCHAR\s*\(\s*\d+\s*\)/gi, "STRING");
    // CLOB -> STRING, BLOB -> BINARY
    s = s.replace(/\bCLOB\b/gi, "STRING");
    s = s.replace(/\bBLOB\b/gi, "BINARY");
    // DATE -> TIMESTAMP (Databricks often uses TIMESTAMP; if you want DATE change manually)
    s = s.replace(/\bDATE\b/gi, "TIMESTAMP");
    addLog("Data types mapped (verify DATE vs TIMESTAMP choices).");

    // 3) SYSDATE / SYSTIMESTAMP
    addLog("Replacing SYSDATE / SYSTIMESTAMP...");
    s = s.replace(/\bSYSDATE\b/gi, "CURRENT_TIMESTAMP()");
    s = s.replace(/\bSYSTIMESTAMP\b/gi, "CURRENT_TIMESTAMP()");
    addLog("Replaced SYSDATE -> CURRENT_TIMESTAMP()");

    // 4) NVL -> COALESCE
    addLog("Converting NVL(...) -> coalesce(...)");
    // NVL(expr, val) -> coalesce(expr, val)
    s = s.replace(/\bNVL\s*\(/gi, "coalesce(");

    // 5) TO_DATE / TO_CHAR simplifications
    addLog("Transforming TO_DATE/TO_CHAR patterns where possible...");
    // TO_DATE('2024-09-18','YYYY-MM-DD') -> TO_DATE('2024-09-18')
    s = s.replace(/TO_DATE\s*\(\s*'([^']*)'\s*,\s*'[^']*'\s*\)/gi, (_m, dateStr) => `TO_DATE('${dateStr}')`);
    // TO_CHAR(date, 'YYYY-MM-DD') -> date_format(date, 'yyyy-MM-dd')
    s = s.replace(/TO_CHAR\s*\(\s*([^)]+?)\s*,\s*'([^']*)'\s*\)/gi, (_m, expr, fmt) => {
      // convert common format letters to Java style used by date_format if needed (simple)
      const fmtConverted = fmt.replace(/YYYY/gi, "yyyy").replace(/DD/gi, "dd").replace(/MM/gi, "MM");
      return `date_format(${expr.trim()}, '${fmtConverted}')`;
    });
    addLog("TO_DATE/TO_CHAR conversions done (review format strings).");

    // 6) DECODE(...) -> CASE WHEN ... THEN ... [ELSE ...] END
    addLog("Attempting basic DECODE(...) -> CASE ... END conversions (simple cases)...");
    s = s.replace(/DECODE\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/gi, (_m, expr, rest) => {
      // naive split by commas - will fail on complex nested commas/expressions — mark for review
      const parts = rest.split(",").map((p) => p.trim());
      let i = 0;
      let caseSql = `CASE WHEN ${expr.trim()} `;
      while (i + 1 < parts.length) {
        const whenVal = parts[i];
        const thenVal = parts[i + 1];
        // If last token remains unpaired -> that's ELSE
        if (i + 2 >= parts.length) {
          // treat thenVal as ELSE
          caseSql = `CASE ${parts.slice(0, parts.length).length ? "" : ""}`;
          break;
        } else {
          caseSql += `WHEN ${expr.trim()} = ${whenVal} THEN ${thenVal} `;
        }
        i += 2;
      }
      // Attempt simpler approach: rebuild with fallback comment
      // Because perfect decode parsing is complex, we annotate conversion needed.
      return `/* REVIEW: Converted DECODE - verify correctness manually */ CASE ${expr.trim()} /* manual CASE logic required */ END`;
    });
    addLog("Inserted review comment for DECODE conversions (manual check required).");

    // 7) String concatenation: a || b || c -> concat(a, b, c)
    addLog("Converting string concatenation (a || b) -> concat(a, b) (best-effort)");
    // We'll try a line-by-line approach to convert simple concatenations
    s = s.replace(/([^\n;]+?\|\|[^\n;]+)/g, (m) => {
      // take expression with ||, split on || while preserving tokens
      const tokens = m.split("||").map((t) => t.trim());
      if (tokens.length > 1) {
        return `concat(${tokens.join(", ")})`;
      }
      return m;
    });
    addLog("String concatenation converted where pattern matched (check complex expressions).");

    // 8) Sequences: seq.NEXTVAL -> GENERATE_UUID() (or placeholder)
    addLog("Handling sequences NEXTVAL -> generate id placeholder");
    s = s.replace(/([A-Za-z0-9_]+)\.NEXTVAL/gi, (_m, seqName) => {
      // We provide a comment and default to GENERATE_UUID() which gives a unique string id.
      addLog(`Sequence ${seqName}.NEXTVAL replaced with GENERATE_UUID() (verify semantics)`);
      return `GENERATE_UUID() /* replaced ${seqName}.NEXTVAL - verify if numeric ID needed */`;
    });

    // 9) Merge/Upsert: Oracle MERGE -> Databricks MERGE (syntax similar); keep but add USING DELTA if missing
    // minimal approach: if CREATE TABLE exists without USING DELTA add comment
    s = s.replace(/CREATE\s+TABLE\s+([A-Za-z0-9_\."]+)\s*\(([\s\S]*?)\);?/gi, (m, tableName, cols) => {
      // Add USING DELTA suggestion if not present near create
      if (!/USING\s+DELTA/i.test(m)) {
        return `${m}\n/* Suggestion: Consider using 'USING DELTA' for Databricks: ALTER or recreate as: CREATE TABLE ${tableName} (...) USING DELTA */`;
      }
      return m;
    });

    // 10) Generic function name replacements and improvements
    addLog("Standard function replacements...");
    s = s.replace(/\bNVL2\s*\(/gi, "/* NVL2 detected: convert to CASE WHEN ... THEN ... ELSE ... END */ (");
    s = s.replace(/\bDECODE\b/gi, "/* DECODE - reviewed above */ DECODE");
    // Replace Oracle-specific outer join operator (+) by recommending LEFT JOIN - add comment where it's used
    if (/\(\s*\w+\s*\)\s*=\s*\w+\s*\+/.test(s) || /\+\s*=\s*/.test(s)) {
      addLog("Detected Oracle outer-join (+) syntax - needs manual rewrite to LEFT/RIGHT JOIN.");
      s = s.replace(/\s*\+\s*=/g, " = /* Oracle (+) outer join found - convert to LEFT JOIN manually */ ");
      // conservative: don't attempt auto rewrite
    }

    // 11) Final cleanup: add header comment
    const header = `/* Converted by Oracle->Databricks quick converter
   - This is an automated conversion. Please REVIEW manually.
   - PL/SQL blocks, complex DECODE, and sequence semantics may need manual rewrite.
*/\n\n`;
    s = header + s;
    addLog("Conversion finished. Please review commented areas.");

    return s;
  }

  function handleConvert() {
    try {
      const res = convertAll(input);
      setOutput(res);
    } catch (err) {
      setOutput("");
      addLog("Conversion failed: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output).then(
      () => addLog("Copied converted SQL to clipboard."),
      () => addLog("Copy to clipboard failed.")
    );
  }

  function handleDownload() {
    const blob = new Blob([output], { type: "text/sql;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted_databricks.sql";
    a.click();
    URL.revokeObjectURL(url);
    addLog("Download started: converted_databricks.sql");
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Oracle → Databricks SQL Converter (quick utility)</h2>

      <div style={styles.row}>
        <div style={styles.column}>
          <label style={styles.label}>Oracle SQL (input)</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={styles.textarea}
            rows={18}
          />
        </div>

        <div style={styles.column}>
          <label style={styles.label}>Databricks SQL (output)</label>
          <textarea value={output} readOnly style={styles.textarea} rows={18} />
        </div>
      </div>

      <div style={styles.buttons}>
        <button onClick={handleConvert} style={styles.buttonPrimary}>Convert</button>
        <button onClick={handleCopy} style={styles.button}>Copy</button>
        <button onClick={handleDownload} style={styles.button}>Download .sql</button>
        <button
          onClick={() => {
            setInput(exampleOracle);
            setOutput("");
            setLog("");
          }}
          style={styles.button}
        >
          Reset Example
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={styles.label}>Conversion Log / Notes</label>
        <textarea value={log} readOnly style={styles.log} rows={8} />
      </div>

      <div style={{ marginTop: 12 }}>
        <b>Important:</b>
        <ul>
          <li>
            This tool handles common patterns but <b>cannot</b> fully convert complex PL/SQL procedures — rewrite them in PySpark/Scala.
          </li>
          <li>Verify: DATE vs TIMESTAMP, sequence numeric requirements, and DECODE translations.</li>
          <li>Enhancement idea: integrate a SQL parser (ANTLR, sql-parse) for robust AST-based transforms.</li>
        </ul>
      </div>
    </div>
  );
}

/* Inline CSS styles — keep minimal and portable */
const styles: { [k: string]: React.CSSProperties } = {
  container: {
    fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
    maxWidth: 1100,
    margin: "20px auto",
    padding: 16,
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    background: "#fff",
  },
  h2: { margin: "4px 0 10px 0", fontSize: 20 },
  row: { display: "flex", gap: 12 },
  column: { flex: 1, display: "flex", flexDirection: "column" },
  label: { fontSize: 13, marginBottom: 6, color: "#333" },
  textarea: {
    fontFamily: "monospace",
    fontSize: 13,
    padding: 8,
    borderRadius: 6,
    border: "1px solid #cfcfcf",
    resize: "vertical",
    width: "100%",
    boxSizing: "border-box",
  },
  buttons: { marginTop: 12, display: "flex", gap: 8 },
  buttonPrimary: {
    background: "#0b69ff",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
  },
  button: {
    background: "#f4f6f8",
    color: "#222",
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #e0e0e0",
    cursor: "pointer",
  },
  log: {
    width: "100%",
    fontFamily: "monospace",
    fontSize: 12,
    padding: 8,
    borderRadius: 6,
    border: "1px solid #eee",
    background: "#fafafa",
    boxSizing: "border-box",
  },
};
