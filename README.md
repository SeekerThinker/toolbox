# DeskKit · 日常效率工具箱

> 不登录、不上传、打开即用。

DeskKit 是一个轻量、开源、Local-first 的日常效率工具集合。它不试图替代 Office、Notion 或项目管理软件，而是专门解决那些一天会遇到很多次、每次只浪费几十秒到几分钟的小麻烦。

## 在线使用

GitHub Pages：`https://seekerthinker.github.io/toolbox/`

## V2 工具清单

目前包含 **21 个工具**：

### 文件
- PDF 合并 / 拆分：合并多个 PDF，按 `1-3,5,8` 这类页码提取页面

### 图片
- 图片压缩 / 缩放：修改尺寸、质量，输出 WebP / JPEG / PNG
- 图片 OCR：识别简体中文、英文、日文
- 二维码生成 / 识别

### 文本
- 文本清理
- 英文大小写
- 文本 Diff 对比

### 计算
- 百分比 / 涨跌幅 / 折扣计算
- 单位转换：长度、重量、面积、容量、温度、数据大小

### 日期时间
- 日期间隔 / 工作日计算 / N 天后日期
- Unix 时间戳转换

### 数据
- CSV / TSV 清洗、去重、转 JSON
- 行处理器：去重、排序、反转

### 写作
- 字数统计
- Markdown 预览
- 会议议程生成器

### 开发
- JSON 格式化 / 压缩 / 校验
- URL 编解码
- Base64 编解码

### 隐私
- 敏感信息打码：邮箱、手机号、身份证号、银行卡号、IP
- 密码 / UUID / 随机字符串生成器

## 工作台功能

- 全局搜索，按 `/` 快速聚焦
- 9 个场景分类
- 收藏工具
- 最近使用
- 深色模式
- 移动端响应式布局
- 无账号、无后端数据库

## 隐私说明

DeskKit 的核心原则是 **Local-first**：文本、表格、图片和 PDF 尽量直接在浏览器本地处理。

PDF、二维码和 OCR 为了避免把大型第三方库打包进仓库，会在用户第一次打开相应工具时，从 jsDelivr CDN 下载开源 JavaScript 组件。用户选择的 PDF、图片或文本不会因此主动上传到 DeskKit 的服务器。

OCR 还需要在线下载识别引擎/语言模型，因此第一次使用速度会明显慢一些。

对于极度敏感的数据，无论使用任何浏览器工具，都建议在处理后进行人工复核。

## 第三方开源组件（按需加载）

- [pdf-lib](https://github.com/Hopding/pdf-lib) — PDF 处理
- [Tesseract.js](https://github.com/naptha/tesseract.js) — OCR
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — 二维码生成
- [jsQR](https://github.com/cozmo/jsQR) — 二维码识别

这些组件只在对应功能打开后加载，首页本身仍然保持零框架、无构建步骤。

## 本地运行

不需要安装 npm 依赖：

```bash
python3 -m http.server 8080
```

然后打开 `http://localhost:8080`。

> 建议通过 HTTP/HTTPS 运行，而不是直接使用 `file://`，这样剪贴板等浏览器 API 的兼容性更好。

## 发布

项目可以直接部署到 GitHub Pages：

1. Settings → Pages
2. Source 选择 `Deploy from a branch`
3. Branch 选择 `main`
4. Folder 选择 `/(root)`

## 产品方向

DeskKit 的定位不是“办公软件”，而是：

**一个随手打开、几秒钟解决问题的日常效率工作台。**

后续优先考虑：

- PDF 压缩、旋转、图片转 PDF
- 图片裁剪、批量压缩
- 时区会议转换
- 正则表达式测试器
- JSON / YAML 互转
- 文件 SHA-256 校验
- 中文标点规范化
- 自定义工具入口
- PWA / 离线安装

## License

MIT
