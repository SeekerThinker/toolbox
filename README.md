# Toolbox

一个轻量、开源、Local-first 的实用工具集合。

**在线使用：** https://seekerthinker.github.io/toolbox/

## 工具

目前共 **31 个工具**。

| 分类 | 工具 |
| --- | --- |
| **文件** | PDF 合并 / 拆分 |
| **图片** | 图片压缩 / 缩放、图片 OCR、二维码生成 / 识别 |
| **文本** | 文本清理、英文大小写、文本 Diff 对比 |
| **计算** | 百分比 / 涨跌幅 / 折扣、单位转换 |
| **日期时间** | 日期间隔 / 工作日 / N 天后日期、Unix 时间戳 |
| **数据** | CSV / TSV 清洗与转 JSON、行处理器 |
| **写作** | 字数统计、Markdown 预览、会议议程生成器 |
| **开发** | JSON 格式化、URL 编解码、Base64 编解码 |
| **隐私** | 敏感信息打码、密码 / UUID / 随机字符串 |
| **思维** | Brain Dump、任务拆解、艾森豪威尔矩阵、加权决策矩阵、5 Whys、事前风险推演、每日 / 每周复盘、费曼学习卡 |
| **专注** | 番茄钟、深度工作计时 |

## 使用体验

- `/` 快捷键聚焦搜索
- 分类筛选、收藏、最近使用
- 深色模式与响应式布局
- 无账号也可以完整使用
- 大多数数据保存在当前浏览器

## 数据与 Local-first

Toolbox 使用统一的 `toolbox:data:v1` 本地数据结构保存偏好、收藏、最近使用和部分工具状态。旧版 `deskkit:*` 数据会自动迁移，不会因为项目改名而丢失。

统一数据层同时提供导入 / 导出能力，后续如果加入可选账号，可以在不改变工具逻辑的前提下增加云同步适配器。

PDF、图片、文本、表格和思维输入默认在浏览器中处理。少数功能会在打开时从 jsDelivr 按需加载固定版本的开源组件：

| 组件 | 用途 |
| --- | --- |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | PDF 处理 |
| [Tesseract.js](https://github.com/naptha/tesseract.js) | OCR |
| [QRCode.js](https://github.com/davidshimjs/qrcodejs) | 二维码生成 |
| [jsQR](https://github.com/cozmo/jsQR) | 二维码识别 |

OCR 还需要在线下载识别引擎和语言模型。

## 技术结构

```text
index.html          # 页面结构
styles.css          # 全部样式
core.js             # 工具注册、搜索、收藏、主题、统一存储
├─ tools-basic.js   # 文本、写作、基础开发工具
├─ tools-utility.js # 计算、日期、数据、隐私工具
├─ tools-media.js   # PDF、图片、OCR、二维码
├─ tools-focus.js   # 番茄钟、深度工作
└─ tools-thinking.js# 拆解、决策、复盘等思维工具
```

技术栈：**HTML + CSS + Vanilla JavaScript**。无框架、无 npm 依赖、无构建流程。

## 本地运行

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 静态检查

```bash
node --check core.js
node --check tools-basic.js
node --check tools-utility.js
node --check tools-media.js
node --check tools-focus.js
node --check tools-thinking.js
node tests/smoke.mjs
```

GitHub Actions 会在 push 和 pull request 时自动执行这些检查。

## Roadmap

当前优先级是稳定性和数据模型，而不是继续堆工具：

- 数据导入 / 导出 UI
- 可选账号与跨设备同步
- PWA / 离线安装
- 第三方脚本完整性与更严格的安全策略
- 在确有高频需求时再补充新工具

## License

MIT