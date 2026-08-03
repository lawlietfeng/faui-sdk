import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  assertReleasedVersionInChangelog,
  getNextVersion,
  prepareRelease
} = require("../../scripts/prepare-release.cjs") as {
  assertReleasedVersionInChangelog: (changelog: string, version: string) => void;
  getNextVersion: (version: string, bump: string) => string;
  prepareRelease: (options: {
    root: string;
    bump: string;
    date: string;
    dryRun?: boolean;
  }) => {
    version: string;
    tagName: string;
    changes: Array<{ fileName: string; before: string; after: string }>;
  };
};

const temporaryDirectories: string[] = [];

function createFixture(changelog = defaultChangelog()) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "faui-release-"));
  temporaryDirectories.push(root);
  const packageJson = {
    name: "@faui/react",
    version: "0.0.2"
  };
  const packageLock = {
    name: "@faui/react",
    version: "0.0.2",
    lockfileVersion: 3,
    packages: {
      "": {
        name: "@faui/react",
        version: "0.0.2"
      }
    }
  };

  fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
  fs.writeFileSync(path.join(root, "package-lock.json"), `${JSON.stringify(packageLock, null, 2)}\n`);
  fs.writeFileSync(path.join(root, "CHANGELOG.md"), changelog);
  return root;
}

function defaultChangelog() {
  return `# Changelog

## [Unreleased]

### Added

- 发布第一个正式版本。

### 升级建议

- 建议升级。

## [0.0.2] - 2026-07-01

### Fixed

- 修复一个问题。
`;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("getNextVersion", () => {
  it.each([
    ["major", "1.0.0"],
    ["minor", "0.1.0"],
    ["patch", "0.0.3"]
  ])("calculates the %s release version", (bump, expected) => {
    expect(getNextVersion("0.0.2", bump)).toBe(expected);
  });

  it("rejects invalid bumps and prerelease source versions", () => {
    expect(() => getNextVersion("0.0.2", "beta")).toThrow("RELEASE_BUMP");
    expect(() => getNextVersion("1.0.0-beta.1", "patch")).toThrow("稳定的 SemVer");
  });
});

describe("prepareRelease", () => {
  it("previews a major release without modifying files", () => {
    const root = createFixture();
    const beforePackage = fs.readFileSync(path.join(root, "package.json"), "utf8");
    const beforeChangelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");

    const result = prepareRelease({
      root,
      bump: "major",
      date: "2026-07-30",
      dryRun: true
    });

    expect(result.version).toBe("1.0.0");
    expect(result.tagName).toBe("v1.0.0");
    expect(result.changes.map(({ fileName }) => fileName)).toEqual([
      "package.json",
      "package-lock.json",
      "CHANGELOG.md"
    ]);
    expect(result.changes[2].after).toContain("## [Unreleased]\n\n## [1.0.0] - 2026-07-30");
    expect(fs.readFileSync(path.join(root, "package.json"), "utf8")).toBe(beforePackage);
    expect(fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8")).toBe(beforeChangelog);
  });

  it("writes package metadata and finalizes the changelog", () => {
    const root = createFixture();
    prepareRelease({ root, bump: "minor", date: "2026-07-30" });

    expect(JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version).toBe("0.1.0");
    expect(JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8")).version).toBe("0.1.0");

    const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
    expect(changelog).toContain("## [Unreleased]\n\n## [0.1.0] - 2026-07-30");
    expect(changelog).toContain("## [0.0.2] - 2026-07-01");
    expect(() => assertReleasedVersionInChangelog(changelog, "0.1.0")).not.toThrow();
  });

  it("rejects an empty unreleased section without changing package metadata", () => {
    const root = createFixture("# Changelog\n\n## [Unreleased]\n\n### Added\n\n");
    const beforePackage = fs.readFileSync(path.join(root, "package.json"), "utf8");

    expect(() => prepareRelease({ root, bump: "patch", date: "2026-07-30" })).toThrow("内容不能为空");
    expect(fs.readFileSync(path.join(root, "package.json"), "utf8")).toBe(beforePackage);
  });
});
