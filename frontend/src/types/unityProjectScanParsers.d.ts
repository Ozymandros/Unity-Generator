declare module "main/unityProjectScanParsers.js" {
  /**
   * Parse Unity `ProjectSettings/ProjectVersion.txt` content.
   *
   * @param content - Raw file content.
   * @returns Parsed unity version (empty string if not found).
   * @throws {Error} If content is not a string.
   */
  export function parseProjectVersionTxt(content: string): { unityVersion: string };

  /**
   * Parse Unity `Packages/manifest.json` content and return dependency keys.
   *
   * @param content - Raw JSON string.
   * @returns Package names (sorted, unique).
   * @throws {Error} If content is not a string or invalid JSON.
   */
  export function parseManifestJson(content: string): { packages: string[] };
}

