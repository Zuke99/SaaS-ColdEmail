export const MAX_SEQUENCE_STEPS = 4;

export const REPLY_TO_PREVIOUS_KEY = "__reply_to_previous";

export const SPREADSHEET_VARIABLES = new Set(["name", "email", "company"]);

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

export function extractVariables(text: string): string[] {
  const found = new Set<string>();
  const regex = new RegExp(VARIABLE_REGEX.source, VARIABLE_REGEX.flags);
  let match = regex.exec(text);
  while (match) {
    found.add(match[1]);
    match = regex.exec(text);
  }
  return Array.from(found);
}

/** Merge variables from multiple fields, preserving first-seen casing per name. */
export function extractVariablesFromTexts(...texts: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const text of texts) {
    for (const variable of extractVariables(text)) {
      const key = variable.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(variable);
      }
    }
  }

  return merged;
}

export function getCustomVariables(text: string): string[] {
  return extractVariables(text).filter(
    (v) => !SPREADSHEET_VARIABLES.has(v.toLowerCase()) && v !== REPLY_TO_PREVIOUS_KEY
  );
}

export function getCustomVariablesFromTexts(...texts: string[]): string[] {
  return extractVariablesFromTexts(...texts).filter(
    (v) => !SPREADSHEET_VARIABLES.has(v.toLowerCase()) && v !== REPLY_TO_PREVIOUS_KEY
  );
}

export function substituteVariables(
  text: string,
  customVars: Record<string, string>
): string {
  return text.replace(VARIABLE_REGEX, (_, key: string) => {
    const lower = key.toLowerCase();
    if (lower === "name") return "John";
    if (lower === "email") return "john@example.com";
    if (lower === "company") return "Acme Corp";
    return customVars[key] ?? customVars[lower] ?? `{{${key}}}`;
  });
}

export function buildReplySubject(step1Subject: string): string {
  const base = step1Subject.replace(/^Re:\s*/i, "").trim();
  return base ? `Re: ${base}` : "Re:";
}

export function parseReplyToPrevious(
  customVars: Record<string, string> | null | undefined
): boolean {
  return customVars?.[REPLY_TO_PREVIOUS_KEY] === "true";
}

export function stripInternalCustomVars(
  customVars: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(customVars).filter(([key]) => key !== REPLY_TO_PREVIOUS_KEY)
  );
}
