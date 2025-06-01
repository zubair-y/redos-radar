// @ts-check

const vscode = require("vscode");
const path = require("path");
const fs = require("fs-extra");

/**
 * Walk up from startDir until we find cli/detected/all.json.
 * Returns absolute path or null.
 */
function findResults(startDir) {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    // at most 6 levels
    const p = path.join(dir, "cli", "detected", "all.json");
    if (fs.existsSync(p)) return p;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** @typedef {{file:string,line?:number,pattern:string,flags:string,
 *             issues:string[],severity:"low"|"medium"|"high",
 *             runtimeMs:number,worstInput:number}} Finding
 */

/** @param {vscode.ExtensionContext} ctx */
function activate(ctx) {
  /* locate scan results irrespective of which folder VS Code opened */
  const jsonPath = findResults(ctx.extensionPath);
  if (!jsonPath) {
    vscode.window.showWarningMessage(
      "ReDoS-Radar: run ‘npm run scan’ first so cli/detected/all.json exists."
    );
    return;
  }

  /** @type {Finding[]} */
  const findings = fs.readJsonSync(jsonPath);

  /* Diagnostic collection */
  const collection = vscode.languages.createDiagnosticCollection("redos-radar");
  ctx.subscriptions.push(collection);

  /** @type {Map<string,vscode.Diagnostic[]>} */
  const perFile = new Map();

  for (const f of findings) {
    const rng = new vscode.Range((f.line ?? 1) - 1, 0, (f.line ?? 1) - 1, 0);

    const msg =
      `⚠️ ${f.severity.toUpperCase()} – ${f.issues.join(", ")}` +
      (f.runtimeMs >= 0
        ? `\nWorst-case: ${f.runtimeMs.toFixed(1)} ms on ${f.worstInput} chars`
        : "");

    const sev =
      f.severity === "high"
        ? vscode.DiagnosticSeverity.Error
        : f.severity === "medium"
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information;

    const diag = new vscode.Diagnostic(rng, msg, sev);
    diag.code = "redos-radar";
    diag.source = "ReDoS-Radar";

    const list = perFile.get(f.file) ?? [];
    list.push(diag);
    perFile.set(f.file, list);
  }

  for (const [file, diags] of perFile) {
    collection.set(vscode.Uri.file(file), diags);
  }

  /* Hover provider reusing the diagnostic message */
  ctx.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: "file" },
      {
        provideHover(doc, pos) {
          const diags = collection.get(doc.uri) ?? [];
          const hit = diags.find((d) => d.range.contains(pos));
          return hit ? new vscode.Hover(hit.message) : undefined;
        },
      }
    )
  );

  /* Simple log */
  const ch = vscode.window.createOutputChannel("ReDoS-Radar");
  ch.appendLine(`Loaded ${findings.length} findings from ${jsonPath}`);
  ch.show(true);
}

function deactivate() {}

module.exports = { activate, deactivate };
