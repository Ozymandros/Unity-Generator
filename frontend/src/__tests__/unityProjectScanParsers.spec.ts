import { describe, it, expect } from "vitest";
import * as parsers from "main/unityProjectScanParsers.js";

describe("unityProjectScanParsers", () => {
  it("parses ProjectVersion.txt unity version", () => {
    const content = "m_EditorVersion: 2022.3.10f1\r\nm_EditorVersionWithRevision: 2022.3.10f1 (abc)\r\n";
    const res = parsers.parseProjectVersionTxt(content);
    expect(res.unityVersion).toBe("2022.3.10f1");
  });

  it("returns empty unity version when missing", () => {
    const res = parsers.parseProjectVersionTxt("foo: bar\n");
    expect(res.unityVersion).toBe("");
  });

  it("parses manifest.json dependencies keys", () => {
    const content = JSON.stringify({
      dependencies: {
        "com.unity.textmeshpro": "3.0.6",
        "com.unity.render-pipelines.universal": "17.0.0",
      },
    });
    const res = parsers.parseManifestJson(content);
    expect(res.packages).toEqual(["com.unity.render-pipelines.universal", "com.unity.textmeshpro"]);
  });

  it("returns empty packages when dependencies missing", () => {
    const res = parsers.parseManifestJson(JSON.stringify({}));
    expect(res.packages).toEqual([]);
  });
});

