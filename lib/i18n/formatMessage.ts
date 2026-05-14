/**
 * Replaces {{key}} placeholders in UI strings.
 */
export function formatMessage(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = vars[key];
    return v !== undefined && v !== null ? String(v) : "";
  });
}
