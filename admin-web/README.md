# 订单后台 admin-web

独立网页后台,通过云函数 `getOrders` 读取所有用户上报的订单。鉴权靠一个 ADMIN_TOKEN,不进代码仓库。

## 一共要做 4 件事

1. 部署云函数 `getOrders`(在 `cloudfunctions/getOrders/`)
2. 给云函数配 `ADMIN_TOKEN` 环境变量
3. 开启云函数 HTTP 触发,拿到触发 URL,填进 `index.html`
4. 把 `admin-web/` 上传到云开发的静态网站托管

---

## 1. 部署云函数

在微信开发者工具左侧目录树:

- 右键 `cloudfunctions/getOrders` 文件夹
- 选「**上传并部署:云端安装依赖(不上传 node_modules)**」
- 等待右下角提示部署成功

> ⚠️ 第一次部署前,可能需要先在项目根目录的 `project.config.json` 里确认 `cloudfunctionRoot` 字段。微信开发者工具通常会自动写入 `cloudfunctions/`,如果没写,手动加上 `"cloudfunctionRoot": "cloudfunctions/"`。

## 2. 配 ADMIN_TOKEN 环境变量

生成一个 32 位随机串(可以用浏览器控制台 `crypto.randomUUID().replace(/-/g,'')` 或者 https://www.uuidgenerator.net)。

然后:

- 微信开发者工具 → 云开发控制台 → 云函数 → `getOrders` → **版本与配置 / 配置**
- 「环境变量」→ 新增:
  - key: `ADMIN_TOKEN`
  - value: 你刚生成的随机串
- 保存,**重新部署** 一次云函数让变量生效

把这个 token 记好,登录网页后台要用。

## 3. 拿 HTTP 触发 URL

云函数默认没有 HTTP 入口,需要开启「云接入」:

- 云开发控制台 → 云函数 → `getOrders` → **触发器 / 云接入**
- 开启「云接入」,平台选「云开发」
- 复制生成的 URL,形如:
  `https://cloud1-d5gaguanke825f14e.service.tcloudbase.com/getOrders`

把这个 URL 填到 `index.html` 顶部的:

```js
const CLOUD_FUNCTION_URL = 'YOUR_CLOUD_FUNCTION_HTTP_URL'
```

## 4. 上传到静态托管

- 云开发控制台 → 静态网站托管 → 开通(个人主体 OK,免费额度够用)
- 「文件管理」→ 上传文件 → 把 `admin-web/index.html` 传上去
- 拿到访问域名,形如 `https://cloud1-d5gaguanke825f14e.tcloudbaseapp.com/index.html`
- 浏览器打开,输 token,看到订单流水 ✅

---

## 验证

打开网页后台 → 输入 ADMIN_TOKEN → 应该看到小程序里下过的订单。**注意:** 状态变更(待制作 → 已完成)和删除不会同步到云端,这个后台展示的是**下单时刻快照**,这一点 UI 上也标注了。

## 安全注意

- ADMIN_TOKEN 只存浏览器 `sessionStorage`,关 tab 就失效
- token 在仓库的 `index.html` 里是占位符,你本地的真实 token 不要 commit 到任何公开仓库
- 云数据库 `orders` 集合权限保持「仅创建者可读写」,这样普通用户即便能在小程序里写自己的订单,也读不到别人的
