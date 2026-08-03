# 脚本目录

## 准备正式版本

先在 `CHANGELOG.md` 的 `[Unreleased]` 中写入本次变更、升级建议和破坏性变更说明。

预览 `major`、`minor` 或 `patch` 的目标版本与 Diff，不修改文件：

```bash
RELEASE_BUMP=major npm run release:prepare -- --dry-run
```

确认后执行准备脚本。它只会更新 `package.json`、`package-lock.json` 和 `CHANGELOG.md`；不会执行 Git 操作或发布制品：

```bash
RELEASE_BUMP=major npm run release:prepare
```

发布后会保留一个新的空 `[Unreleased]` 区块，供下一次版本继续记录变更。

## 发布

执行：

```bash
npm run release
```

发布脚本会校验正式版本已写入 `CHANGELOG.md`，再运行 lint、类型检查、测试、构建和制品预览，然后发布。它不会修改版本号。

当前云效制品仓库地址已配置为：

```json
{
  "publishConfig": {
    "registry": "https://packages.aliyun.com/5f278b52d248146039338d7b/npm/npm-registry/"
  }
}
```

执行时可用 `NPM_CONFIG_REGISTRY` 临时覆盖。本地可先手动登录：

```bash
npm login --registry=https://packages.aliyun.com/5f278b52d248146039338d7b/npm/npm-registry/
```

不要把账号、密码或令牌写入仓库和发布脚本。流水线应将已认证的 `.npmrc` 内容保存为私密变量 `NPMRC_CONTENT`，并通过 `NPM_CONFIG_USERCONFIG` 指向临时配置文件。

流水线是非交互环境，必须传入发布渠道：

```bash
RELEASE_TAG=latest RELEASE_VERSION_MODE=current npm run release
# 或 RELEASE_TAG=beta RELEASE_VERSION_MODE=current npm run release
```

`RELEASE_VERSION_MODE=current` 会发布 `package.json` 中已提交的版本号；这是唯一支持的发布模式。请先使用 `release:prepare` 准备版本，再执行发布。

`latest` 只能发布正式版本，例如 `0.0.1`；`beta` 只能发布 `-beta.N` 版本，例如 `0.0.2-beta.0`。
