const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");

function readPackageJson() {
  const content = fs.readFileSync(packageJsonPath, "utf8");
  return JSON.parse(content);
}

function writePackageJson(pkg) {
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
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

function getNextStable(version) {
  const parsed = parseVersion(version);
  if (!parsed) return "0.0.1";
  if (parsed.prerelease) {
    return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  }
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}

function getNextBeta(version) {
  const parsed = parseVersion(version);
  if (!parsed) return "0.0.1-beta.0";

  const betaMatch = /^beta\.(\d+)$/.exec(parsed.prerelease);
  if (betaMatch) {
    return `${parsed.major}.${parsed.minor}.${parsed.patch}-beta.${Number(betaMatch[1]) + 1}`;
  }

  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-beta.0`;
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

function run(command) {
  execSync(command, {
    cwd: projectRoot,
    stdio: "inherit"
  });
}

async function main() {
  const pkg = readPackageJson();
  const currentVersion = pkg.version || "0.0.0";
  const releaseTag = await askReleaseTag();
  const nextVersion = releaseTag === "beta" ? getNextBeta(currentVersion) : getNextStable(currentVersion);

  console.log(`当前版本: ${currentVersion}`);
  console.log(`发布类型: ${releaseTag}`);
  console.log(`目标版本: ${nextVersion}`);

  pkg.version = nextVersion;
  writePackageJson(pkg);

  try {
    run("npm run build");
    run(`npm publish --tag ${releaseTag}`);
    console.log(`发布成功: ${pkg.name}@${nextVersion} (${releaseTag})`);
  } catch (error) {
    pkg.version = currentVersion;
    writePackageJson(pkg);
    console.error(`发布失败，版本号已回滚到 ${currentVersion}。`);
    process.exit(1);
  }
}

main();
