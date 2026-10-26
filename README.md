# Family Finance — 公开前端仓库（不含明文数据）

部署地址：`https://finance.yano.blog`。

## 架构

本仓库为纯静态网站：**原生 HTML、CSS、JavaScript + Web Crypto**，不依赖 npm、数据库、后端服务或第三方脚本。

- `site/`：直接交给 GitHub Pages 发布的文件。
- `site/finance.js`：收支、净资产、流动性计算。
- `site/crypto.js`：浏览器本地 AES-256-GCM 解密。
- `site/demo.js`：完全虚构的演示数字；与真实数据无关。
- `site/data/finance.enc.json`：仅由私有仓库的 Actions 生成和更新，**只能是密文**。
- `.github/workflows/deploy.yml`：发布静态网站。

访问者都可以加载公开网页和密文文件，但**不知道高强度共享口令时不能解密财务数据**。这不是双人账号认证；不能防止密码被分享或猜测。

## GitHub Free 部署

1. 创建名为 `family-finance-web` 的 **Public** 仓库，将本项目所有文件提交至 `main`。
2. 在 Settings → Pages → Build and deployment 选择 **GitHub Actions**。
3. Workflow `Deploy encrypted finance dashboard to GitHub Pages` 会发布 `site/`。
4. Settings → Pages → Custom domain 填写 `finance.yano.blog`。
5. DNS 为 `finance` 建立 CNAME，指向 `ljyyano.github.io`；启用 Enforce HTTPS。已有 `site/CNAME`。
6. 部署前的网站只有演示模式可用，直到私有数据仓库生成 `site/data/finance.enc.json`。

## 与私有数据仓库同步

私有仓库的 Actions 使用专用 SSH Deploy Key（**只授权本仓库的 Contents 写权限**）更新密文文件，并自动触发本站 Pages 部署。不要将明文账单、密码、私钥放到本仓库，也不要放到 GitHub Actions 日志。

## 本地预览

```bash
python3 -m http.server 8000 --directory site
# 打开 http://localhost:8000，点击「体验演示看板」
```

如需预览真实加密数据，可以先在本机生成 `site/data/finance.enc.json`（本项目忽略该文件以外的所有真实数据）；**不要把未经加密的文件复制到 `site`**。

## 安全边界

- 页面本身和演示数据公开，但真实财务 JSON 只能出现在 Private 仓库。
- 密钥不嵌入网页、Git 历史或构建产物。
- HTTPS 是必要条件；建议密码管理器生成 32 位以上随机口令。
- 不在浏览器 `localStorage`、Cookie 中保存密码或明文账本；点击「锁定」销毁应用的当前数据引用。
- 网站脚本同样由 GitHub Pages 公开提供；不受信任的代码修改可能窃取密码，因此需要保护公开仓库的写权限并审查变更。
- 已发布密文会存在于 Git 历史；如旧密码泄漏，更换当前密码不能保护已公开的历史密文。

## 数据口径

个人消费只汇总到人/月；共同支出保留逐笔明细；资产在各月按**最近一次可靠快照**展示，缺失数据用「—」表示，不猜测填充。
