# 脚本目录

## 发布

执行：

```bash
npm run release
```

发布脚本会校验登录身份、运行 lint、类型检查、测试、构建和制品预览，然后发布。

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

`RELEASE_VERSION_MODE=current` 会发布 `package.json` 中已提交的版本号；适用于流水线，避免每次从相同源码重复计算版本号。未设置时为 `bump`，脚本会自动递增版本号，适用于本地手动发布。

`latest` 只能发布正式版本，例如 `0.0.1`；`beta` 只能发布 `-beta.N` 版本，例如 `0.0.2-beta.0`。
