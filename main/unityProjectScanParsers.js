/**
 * Unity project scan parsers (pure functions).
 *
 * Kept in a separate module so it can be unit-tested and reused by the Electron IPC handler.
 */

/**
 * Parse Unity `ProjectSettings/ProjectVersion.txt` content.
 *
 * Expected format contains a line like: `m_EditorVersion: 2022.3.10f1`
 *
 * @param {string} content - Raw file content.
 * @returns {{ unityVersion: string }} Parsed unity version (empty string if not found).
 * @throws {Error} If content is not a string.
 *
 * @example
 * const { unityVersion } = parseProjectVersionTxt("m_EditorVersion: 6000.3.2f1\\n");
 * // unityVersion === "6000.3.2f1"
 */
function parseProjectVersionTxt(content) {
  if (typeof content !== "string") {
    throw new Error("content must be a string");
  }

  const match = content.match(/m_EditorVersion:\s*([^\r\n]+)/);
  return { unityVersion: match?.[1]?.trim() || "" };
}

/**
 * Parse Unity `Packages/manifest.json` content and return dependency keys.
 *
 * @param {string} content - Raw JSON string.
 * @returns {{ packages: string[] }} Package names (sorted, unique).
 * @throws {Error} If content is not a string or invalid JSON.
 *
 * @example
 * const { packages } = parseManifestJson("{\"dependencies\":{\"com.unity.textmeshpro\":\"3.0.6\"}}");
 * // packages === ["com.unity.textmeshpro"]
 */
function parseManifestJson(content) {
  if (typeof content !== "string") {
    throw new Error("content must be a string");
  }
  const parsed = JSON.parse(content);
  const deps = parsed?.dependencies;
  if (!deps || typeof deps !== "object") return { packages: [] };

  const names = Object.keys(deps).filter((k) => typeof k === "string" && k.trim().length > 0);
  const uniqueSorted = Array.from(new Set(names.map((s) => s.trim()))).sort((a, b) => a.localeCompare(b));
  return { packages: uniqueSorted };
}

module.exports = {
  parseProjectVersionTxt,
  parseManifestJson,
};

