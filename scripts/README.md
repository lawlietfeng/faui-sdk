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

不要把账号、密码或令牌写入仓库和发布脚本。

## 流水线账号登录

在云效流水线变量组中新增以下私密字符变量：

- `NPM_USERNAME`：仓库指南中显示的 NPM 用户名。
- `NPM_PASSWORD`：仓库指南中显示的 NPM 密码。
- `NPM_EMAIL`：NPM 登录邮箱。

三个变量同时存在时，发布脚本会使用 `npm adduser --auth-type=legacy` 登录云效仓库。登录生成的 `.npmrc` 仅存放在临时目录，脚本结束后会删除；无需配置 `NPMRC_CONTENT`。

流水线是非交互环境，必须传入发布渠道：

```bash
RELEASE_TAG=latest RELEASE_VERSION_MODE=current npm run release
# 或 RELEASE_TAG=beta RELEASE_VERSION_MODE=current npm run release
```

`RELEASE_VERSION_MODE=current` 会发布 `package.json` 中已提交的版本号；适用于流水线，避免每次从相同源码重复计算版本号。未设置时为 `bump`，脚本会自动递增版本号，适用于本地手动发布。

`latest` 只能发布正式版本，例如 `0.0.1`；`beta` 只能发布 `-beta.N` 版本，例如 `0.0.2-beta.0`。
