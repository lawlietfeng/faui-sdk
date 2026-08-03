# 云效 SDK 正式发布流水线配置指南

适用范围：`@faui/react` 首次发布 `1.0.0`，以及后续稳定版本发布。  
制品仓库：云效 npm 私有制品库。  
本次任务：只操作云效代码仓库与云效 npm 私有制品库。

## 配置前提

先完成项目侧改造，再配置流水线：

- 存在 `scripts/prepare-release.cjs`，支持 `RELEASE_BUMP=major|minor|patch` 与 `--dry-run`。
- 存在根目录 `CHANGELOG.md`，本次变更已写入非空的 `[Unreleased]`；准备脚本会将其固化为正式版本，并重新创建空的 `[Unreleased]`。
- `npm run release` 可通过 `RELEASE_VERSION_MODE=current` 发布已写入 `package.json` 的版本。
- 云效构建镜像提供 Node.js 22 或以上版本。

## 创建流水线与触发限制

1. 在云效项目中进入本仓库的流水线页面，创建一条“SDK 正式发布”流水线。
2. 代码源选择云效仓库 `origin`，默认分支选择 `master`。
3. 关闭自动触发，仅保留手动运行。
4. 设置分支限制：只有 `master` 可以运行此流水线。
5. 为运行身份授予云效仓库的 `master` 推送和 Tag 创建权限。

## 添加变量与凭证

在流水线的“运行时参数”或“流水线变量”区域添加以下配置。页面名称可能因云效版本略有不同。

| 名称 | 配置方式 | 值或说明 |
| --- | --- | --- |
| `RELEASE_BUMP` | 手动运行时单选参数，必填 | `major`、`minor`、`patch`；首次发布选择 `major`。 |
| `RELEASE_TAG` | 普通变量 | 固定为 `latest`。 |
| `RELEASE_VERSION_MODE` | 普通变量 | 固定为 `current`。 |
| `NPMRC_CONTENT` | 私密变量 | 云效 npm 制品库的完整 `.npmrc` 内容。保持掩码，不在日志输出。 |
| `GIT_USER_NAME` | 普通变量 | 例如 `faui-release-bot`。 |
| `GIT_USER_EMAIL` | 普通变量 | 发布机器人的邮箱地址。 |

云效仓库服务连接负责 `origin` 的检出、提交、推送和 Tag 创建。

## 节点顺序

流水线按以下顺序配置。每个 Shell 节点都使用 Node.js 22 或更高版本。

将“发布预览”和“质量校验”配置在同一个构建阶段内串行运行，保证两者校验的是同一源提交。后续节点可能运行在不同工作区，因此要将源提交 SHA 作为流水线制品上传，并在“生成并提交版本元数据”节点下载；不要依赖前一节点的本地文件或 Git 工作区。

### 1. 发布预览与质量校验

作用：不修改仓库，展示本次会发布的版本和文件 Diff，并完成发布前质量校验。

```bash
set -euo pipefail
git fetch origin master --tags
git checkout -B master origin/master
test -z "$(git status --porcelain)"
git rev-parse HEAD > release-source-sha.txt
RELEASE_BUMP="$RELEASE_BUMP" node scripts/prepare-release.cjs --dry-run
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm pack --dry-run
```

首次发布选择 `major` 时，输出必须显示目标版本 `1.0.0` 和 Tag `v1.0.0`。在该构建阶段的输出制品中添加文件 `release-source-sha.txt`，并在后续“生成并提交版本元数据”节点下载该制品。

### 2. 人工审核

在质量校验之后添加“人工审核”或“人工卡点”节点。

审核人应确认：

- `RELEASE_BUMP` 选择正确；首次为 `major`。
- 发布预览中的目标版本与 Tag 正确。
- `[Unreleased]` 的内容完整，且包含升级建议和破坏性变更说明。
- 质量校验全部通过。
- 本次只会修改 `package.json`、`package-lock.json` 和 `CHANGELOG.md`。

审核未通过时终止流水线；此时不得提交、发布或创建 Tag。

### 3. 生成并提交版本元数据

作用：审核通过后，重新从云效 `master` 检出，确认分支未在审核期间变化，再写入版本和 CHANGELOG。

```bash
set -euo pipefail
git fetch origin master --tags
git checkout -B master origin/master
test -z "$(git status --porcelain --untracked-files=no)"
sourceCommit="$(tr -d '\r\n' < release-source-sha.txt)"
test "$(git rev-parse HEAD)" = "$sourceCommit" || {
  echo '人工审核期间 master 已变化，请重新运行发布流水线。'
  exit 1
}

RELEASE_BUMP="$RELEASE_BUMP" node scripts/prepare-release.cjs

releaseVersion="$(node -p "require('./package.json').version")"
git diff --check
unexpectedChanges="$(git diff --name-only | grep -Ev '^(package\.json|package-lock\.json|CHANGELOG\.md)$' || true)"
test -z "$unexpectedChanges" || { echo "发现意外文件变更：$unexpectedChanges"; exit 1; }
git config user.name "$GIT_USER_NAME"
git config user.email "$GIT_USER_EMAIL"
git add package.json package-lock.json CHANGELOG.md
git diff --cached --quiet && { echo '未生成版本变更，终止发布。'; exit 1; }
git commit -m "chore(release): v${releaseVersion}"
git push origin HEAD:master
```

若审核到此节点之间 `master` 已有新提交，停止流水线并重新开始，避免把审核过的变更说明应用到不同源码。

### 4. 发布云效 npm 制品

作用：仅发布已提交的目标版本，不再修改版本文件。

```bash
set -euo pipefail
git fetch origin master
git checkout -B master origin/master
umask 077
npmrcPath="$(mktemp)"
trap 'rm -f "$npmrcPath"' EXIT
printf '%s' "$NPMRC_CONTENT" > "$npmrcPath"
export NPM_CONFIG_USERCONFIG="$npmrcPath"

RELEASE_TAG=latest RELEASE_VERSION_MODE=current npm run release
```

发布前后都不得输出 `.npmrc` 内容、令牌或认证头。

### 5. 创建云效 Git Tag

作用：制品发布成功后，只在 `origin` 创建带注释 Tag。

```bash
set -euo pipefail
git fetch origin master --tags
git checkout -B master origin/master
releaseVersion="$(node -p "require('./package.json').version")"
tagName="v${releaseVersion}"
if git show-ref --verify --quiet "refs/tags/${tagName}"; then
  echo "Tag ${tagName} 已存在，终止。"
  exit 1
fi
git tag -a "$tagName" -m "Release ${tagName}"
git push origin "$tagName"
```

## 首次发布操作清单

1. 审核 `CHANGELOG.md` 的 `[Unreleased]` 中 `1.0.0` 基线能力说明、升级建议和破坏性变更说明。
2. 手动启动“SDK 正式发布”流水线，选择 `RELEASE_BUMP=major`。
3. 确认发布预览显示 `1.0.0` 与 `v1.0.0`。
4. 确认质量校验通过后，在人工审核节点批准。
5. 确认云效制品库存在 `@faui/react@1.0.0`，dist-tag 为 `latest`。
6. 确认 `origin` 存在带注释 Tag `v1.0.0`。

## 异常处理

- 审核或质量校验失败：直接终止，无需清理远端。
- 制品发布失败：版本提交会保留在 `master`，但不会创建 Tag；修复后使用同一版本重新运行发布和 Tag 步骤。
- Tag 创建失败但制品已发布：不要重复发布相同版本；修复权限或网络后，仅重试 Tag 节点。
