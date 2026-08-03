const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execFileSync } = require("child_process");
const { assertReleasedVersionInChangelog } = require("./prepare-release.cjs");

const projectRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");
const changelogPath = path.join(projectRoot, "CHANGELOG.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readPackageJson() {
  return readJson(packageJsonPath);
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || ""
  };
}

function assertReleaseTagMatchesVersion(releaseTag, version) {
  const parsed = parseVersion(version);
  if (!parsed) {
    throw new Error(`版本号不符合 SemVer 规范: ${version}`);
  }

  if (releaseTag === "latest" && parsed.prerelease) {
    throw new Error(`latest 只能发布正式版本，当前版本为 ${version}。`);
  }

  if (releaseTag === "beta" && !/^beta\.\d+$/.test(parsed.prerelease)) {
    throw new Error(`beta 必须发布 -beta.N 版本，当前版本为 ${version}。`);
  }
}

function askReleaseTag() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question("选择发布类型: [1] 正式(latest) [2] beta: ", (answer) => {
      rl.close();
      const normalized = String(answer || "").trim().toLowerCase();
      if (normalized === "2" || normalized === "beta" || normalized === "b") {
        resolve("beta");
        return;
      }
      resolve("latest");
    });
  });
}

function parseReleaseTag(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "1" || normalized === "latest") return "latest";
  if (normalized === "2" || normalized === "beta" || normalized === "b") return "beta";
  return null;
}

async function getReleaseTag() {
  const tagArgument = process.argv.slice(2).find((argument) => argument.startsWith("--tag="));
  const configuredTag = tagArgument ? tagArgument.slice("--tag=".length) : process.env.RELEASE_TAG;

  if (configuredTag !== undefined) {
    const releaseTag = parseReleaseTag(configuredTag);
    if (!releaseTag) {
      throw new Error("RELEASE_TAG 或 --tag 只支持 latest 或 beta。");
    }
    return releaseTag;
  }

  if (!process.stdin.isTTY) {
    throw new Error("非交互环境必须设置 RELEASE_TAG=latest 或 RELEASE_TAG=beta。");
  }

  return askReleaseTag();
}

function getReleaseVersionMode() {
  const mode = String(process.env.RELEASE_VERSION_MODE || "current").trim().toLowerCase();
  if (mode === "current") return mode;
  throw new Error("发布前请先执行版本准备脚本；RELEASE_VERSION_MODE 只支持 current。");
}

function getRegistry(pkg) {
  const registry = process.env.NPM_CONFIG_REGISTRY || pkg.publishConfig?.registry;
  if (!registry) {
    throw new Error("未配置制品仓库地址。请设置 package.json 的 publishConfig.registry 或 NPM_CONFIG_REGISTRY。");
  }

  let url;
  try {
    url = new URL(registry);
  } catch {
    throw new Error(`制品仓库地址无效: ${registry}`);
  }

  if (url.protocol !== "https:") {
    throw new Error("制品仓库地址必须使用 HTTPS。");
  }

  if (url.hostname === "registry.npmjs.org") {
    throw new Error("禁止发布到 npm 公网仓库，请配置云效制品仓库地址。");
  }

  return url.toString();
}

function run(command, args) {
  execFileSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit"
  });
}

async function main() {
  try {
    const pkg = readPackageJson();
    const currentVersion = pkg.version || "0.0.0";
    const releaseTag = await getReleaseTag();
    const versionMode = getReleaseVersionMode();
    assertReleaseTagMatchesVersion(releaseTag, currentVersion);
    assertReleasedVersionInChangelog(fs.readFileSync(changelogPath, "utf8"), currentVersion);
    const registry = getRegistry(pkg);

    console.log(`当前制品: ${pkg.name}@${currentVersion}`);
    console.log(`发布类型: ${releaseTag}`);
    console.log(`版本模式: ${versionMode}`);
    console.log(`目标版本: ${currentVersion}`);
    console.log(`制品仓库: ${registry}`);

    run("npm", ["run", "lint"]);
    run("npm", ["run", "typecheck"]);
    run("npm", ["run", "test"]);
    run("npm", ["run", "build"]);
    run("npm", ["pack", "--dry-run"]);
    run("npm", ["publish", "--tag", releaseTag, "--registry", registry]);
    console.log(`发布成功: ${pkg.name}@${currentVersion} (${releaseTag})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`发布失败: ${message}`);
    process.exitCode = 1;
  }
}

main();
