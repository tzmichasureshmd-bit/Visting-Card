/**
 * SQL syntax gate.
 *
 * There is no local Postgres in this environment, so the migrations cannot be
 * executed before they reach Supabase. This parses every statement with a real
 * PostgreSQL grammar and fails on anything malformed, which catches typos,
 * unbalanced quotes and bad clause structure before deployment.
 *
 * It does NOT check semantics — foreign-key ordering, RLS policy validity and
 * plpgsql bodies are validated when the migration is applied to a real database.
 * PL/pgSQL bodies live inside dollar-quoted strings, so they are deliberately
 * skipped here.
 *
 *   node scripts/validate-sql.mjs
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "pgsql-ast-parser";

const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

/** Split on semicolons that are not inside a dollar-quoted block, a string, or a comment. */
function splitStatements(sql) {
  const statements = [];
  let current = "";
  let inDollar = false;
  let dollarTag = "";
  let inLineComment = false;
  let inBlockComment = false;
  let inString = false;
  let inIdent = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];

    // Single-quoted literal. Doubled quotes ('') stay inside the string.
    if (inString) {
      current += ch;
      if (ch === "'") {
        if (next === "'") {
          current += next;
          i++;
        } else {
          inString = false;
        }
      }
      continue;
    }
    if (inIdent) {
      current += ch;
      if (ch === '"') inIdent = false;
      continue;
    }
    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      current += ch;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        current += "*/";
        i++;
        continue;
      }
      current += ch;
      continue;
    }
    if (!inDollar && ch === "'") {
      inString = true;
      current += ch;
      continue;
    }
    if (!inDollar && ch === '"') {
      inIdent = true;
      current += ch;
      continue;
    }
    if (!inDollar && ch === "-" && next === "-") {
      inLineComment = true;
      current += ch;
      continue;
    }
    if (!inDollar && ch === "/" && next === "*") {
      inBlockComment = true;
      current += "/*";
      i++;
      continue;
    }
    if (!inDollar && ch === "$") {
      const match = /^\$[A-Za-z_]*\$/.exec(sql.slice(i));
      if (match) {
        if (!inDollar) {
          inDollar = true;
          dollarTag = match[0];
          current += match[0];
          i += match[0].length - 1;
          continue;
        }
        if (match[0] === dollarTag) {
          inDollar = false;
          current += match[0];
          i += match[0].length - 1;
          continue;
        }
      }
    }
    if (ch === ";" && !inDollar) {
      statements.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) statements.push(current);
  return statements.map((s) => s.trim()).filter(Boolean);
}

/** Strip leading comments so the parser sees a real statement. */
function stripComments(sql) {
  return sql
    .replace(/^\s*--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

let failures = 0;
let checked = 0;
let skipped = 0;

for (const file of files) {
  const raw = readFileSync(join(dir, file), "utf8");
  const statements = splitStatements(raw);

  for (const statement of statements) {
    const sql = stripComments(statement);
    if (!sql) continue;

    // Dollar-quoted bodies are opaque to the grammar (and to this checker).
    if (/^\s*(create|do)\b/i.test(sql) && /\$\$/.test(sql)) {
      skipped++;
      continue;
    }
    // `do $$ ... $$` loops that generate policies are covered above.
    try {
      parse(sql);
      checked++;
    } catch (error) {
      failures++;
      const line = statement.slice(0, 160).replace(/\s+/g, " ");
      console.error(`\n✗ ${file}\n  ${sql.slice(0, 100).replace(/\s+/g, " ")}...`);
      console.error(`  ${error.message}`);
      void line;
    }
  }
}

console.log(
  `\nParsed ${checked} statement(s) across ${files.length} migration file(s).` +
    `${skipped ? ` Skipped ${skipped} dollar-quoted block(s).` : ""}`,
);

if (failures > 0) {
  console.error(`\n${failures} statement(s) failed to parse.\n`);
  process.exit(1);
}
console.log("No syntax errors found.\n");