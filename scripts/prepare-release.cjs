const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const packageJsonFile = "package.json";
const packageLockFile = "package-lock.json";
const changelogFile = "CHANGELOG.md";
const validBumps = new Set(["major", "minor", "patch"]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseStableVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || ""));
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function getNextVersion(version, bump) {
  if (!validBumps.has(bump)) {
    throw new Error("RELEASE_BUMP 只支持 major、minor 或 patch。");
  }

  const parsed = parseStableVersion(version);
  if (!parsed) {
    throw new Error(`当前版本必须是稳定的 SemVer 版本，实际为 ${version || "空"}。`);
  }

  if (bump === "major") return `${parsed.major + 1}.0.0`;
  if (bump === "minor") return `${parsed.major}.${parsed.minor + 1}.0`;
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}

function getReleaseDate(value = process.env.RELEASE_DATE) {
  if (value !== undefined) {
    const normalized = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      throw new Error("RELEASE_DATE 必须使用 YYYY-MM-DD 格式。");
    }

    const date = new Date(`${normalized}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) {
      throw new Error("RELEASE_DATE 不是有效日期。");
    }

    return normalized;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const values = Object.fromEntries(formatter.formatToParts(new Date())
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function getUnreleasedSection(changelog) {
  const normalized = String(changelog).replace(/\r\n/g, "\n");
  const heading = /^## \[Unreleased\][^\n]*$/m.exec(normalized);
  if (!heading || heading.index === undefined) {
    throw new Error("CHANGELOG.md 必须包含 ## [Unreleased] 标题。");
  }

  const contentStart = heading.index + heading[0].length;
  const afterHeading = normalized.slice(contentStart);
  const nextHeading = /^## \[[^\]\n]+\][^\n]*$/m.exec(afterHeading);
  const contentEnd = nextHeading?.index ?? afterHeading.length;
  const content = afterHeading.slice(0, contentEnd).trim();
  const suffix = afterHeading.slice(contentEnd).trim();
  const meaningfulContent = content
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^#{1,6}\s+/.test(line));

  if (meaningfulContent.length === 0) {
    throw new Error("CHANGELOG.md 的 [Unreleased] 内容不能为空。");
  }

  return {
    before: normalized.slice(0, heading.index).trimEnd(),
    content,
    suffix
  };
}

function finalizeChangelog(changelog, version, date) {
  const section = getUnreleasedSection(changelog);
  const parts = [
    section.before,
    "## [Unreleased]",
    `## [${version}] - ${date}`,
    section.content
  ];

  if (section.suffix) parts.push(section.suffix);
  return `${parts.join("\n\n")}\n`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertReleasedVersionInChangelog(changelog, version) {
  const heading = new RegExp(`^## \\[${escapeRegex(version)}\\] - \\d{4}-\\d{2}-\\d{2}$`, "m");
  if (!heading.test(changelog)) {
    throw new Error(`CHANGELOG.md 中缺少 ${version} 的正式版本记录。`);
  }
}

function splitLines(content) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

function createDiff(fileName, before, after) {
  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);
  let prefixLength = 0;

  while (
    prefixLength < beforeLines.length
    && prefixLength < afterLines.length
    && beforeLines[prefixLength] === afterLines[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < beforeLines.length - prefixLength
    && suffixLength < afterLines.length - prefixLength
    && beforeLines[beforeLines.length - suffixLength - 1] === afterLines[afterLines.length - suffixLength - 1]
  ) {
    suffixLength += 1;
  }

  const removed = beforeLines.slice(prefixLength, beforeLines.length - suffixLength);
  const added = afterLines.slice(prefixLength, afterLines.length - suffixLength);
  const start = prefixLength + 1;

  return [
    `diff --git a/${fileName} b/${fileName}`,
    `--- a/${fileName}`,
    `+++ b/${fileName}`,
    `@@ -${start},${removed.length} +${start},${added.length} @@`,
    ...removed.map((line) => `-${line}`),
    ...added.map((line) => `+${line}`)
  ].join("\n");
}

function prepareRelease({ root = projectRoot, bump, date = getReleaseDate(), dryRun = false } = {}) {
  const packageJsonPath = path.join(root, packageJsonFile);
  const packageLockPath = path.join(root, packageLockFile);
  const changelogPath = path.join(root, changelogFile);
  const packageJson = readJson(packageJsonPath);
  const packageLock = readJson(packageLockPath);
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const version = getNextVersion(packageJson.version, bump);

  if (!packageLock.packages?.[""]) {
    throw new Error("package-lock.json 缺少根包记录。");
  }

  const nextPackageJson = { ...packageJson, version };
  const nextPackageLock = {
    ...packageLock,
    name: nextPackageJson.name,
    version,
    packages: {
      ...packageLock.packages,
      "": {
        ...packageLock.packages[""],
        name: nextPackageJson.name,
        version
      }
    }
  };
  const nextChangelog = finalizeChangelog(changelog, version, date);
  const changes = [
    {
      fileName: packageJsonFile,
      filePath: packageJsonPath,
      before: `${JSON.stringify(packageJson, null, 2)}\n`,
      after: `${JSON.stringify(nextPackageJson, null, 2)}\n`
    },
    {
      fileName: packageLockFile,
      filePath: packageLockPath,
      before: `${JSON.stringify(packageLock, null, 2)}\n`,
      after: `${JSON.stringify(nextPackageLock, null, 2)}\n`
    },
    {
      fileName: changelogFile,
      filePath: changelogPath,
      before: changelog,
      after: nextChangelog
    }
  ];

  if (!dryRun) {
    writeJson(packageJsonPath, nextPackageJson);
    writeJson(packageLockPath, nextPackageLock);
    fs.writeFileSync(changelogPath, nextChangelog, "utf8");
  }

  return {
    currentVersion: packageJson.version,
    version,
    tagName: `v${version}`,
    date,
    changes
  };
}

function parseArguments(argumentsList) {
  const unknownArguments = argumentsList.filter((argument) => argument !== "--dry-run");
  if (unknownArguments.length > 0) {
    throw new Error(`不支持的参数: ${unknownArguments.join(" ")}`);
  }

  return { dryRun: argumentsList.includes("--dry-run") };
}

function printPreview(result, dryRun) {
  console.log(dryRun ? "发布预览（未修改文件）" : "版本准备完成");
  console.log(`当前版本: ${result.currentVersion}`);
  console.log(`目标版本: ${result.version}`);
  console.log(`目标 Git Tag: ${result.tagName}`);
  console.log(`发布日期: ${result.date}`);

  for (const change of result.changes) {
    console.log(createDiff(change.fileName, change.before, change.after));
  }
}

function main() {
  try {
    const { dryRun } = parseArguments(process.argv.slice(2));
    const bump = String(process.env.RELEASE_BUMP || "").trim().toLowerCase();
    const result = prepareRelease({ bump, dryRun });
    printPreview(result, dryRun);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`版本准备失败: ${message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  assertReleasedVersionInChangelog,
  createDiff,
  finalizeChangelog,
  getNextVersion,
  getReleaseDate,
  prepareRelease
};
