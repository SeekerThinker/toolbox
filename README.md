# Toolbox · 效率与思维工具箱

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
| **思维** | Brain Dump、任务拆解、艾森豪威尔矩阵、加权决策矩阵、5 Whys、Pre-mortem、每日 / 每周复盘、费曼学习卡 |
| **专注** | 番茄钟、深度工作计时 |

## 使用体验

- `/` 快捷键聚焦搜索
- 分类筛选
- 收藏
- 最近使用
- 深色模式
- 响应式布局
- 思维与专注记录使用 `localStorage` 保存在当前浏览器

## Local-first

大多数工具直接使用浏览器能力运行，文本、表格、图片、PDF、思维记录和专注记录尽量在本地处理。

少数功能会在打开对应工具时从 jsDelivr CDN 按需加载开源组件：

| 组件 | 用途 |
| --- | --- |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | PDF 处理 |
| [Tesseract.js](https://github.com/naptha/tesseract.js) | OCR |
| [QRCode.js](https://github.com/davidshimjs/qrcodejs) | 二维码生成 |
| [jsQR](https://github.com/cozmo/jsQR) | 二维码识别 |

OCR 还需要在线下载识别引擎和语言模型。

## 技术结构

```text
index.html          # 首页与工具容器
styles.css          # 基础视觉与响应式布局
compact.css         # 首页紧凑布局
app.js              # 基础工具与工作台逻辑
v2-core.js          # 数据、计算、隐私等工具
v2-media.js         # PDF、图片、OCR、二维码
v2-fixes.js         # 兼容性修正
v3-register.js      # 思维 / 专注工具注册
v3-focus.js         # 番茄钟、深度工作
v3-thinking-a.js    # Brain Dump、任务拆解、优先级、决策
v3-thinking-b.js    # 根因分析、风险推演、复盘、费曼学习
```

技术栈：**HTML + CSS + Vanilla JavaScript**。无框架、无 npm 依赖、无构建流程。

## 本地运行

```bash
python3 -m http.server 8080
```

访问：

```text
http://localhost:8080
```

## GitHub Pages

1. `Settings → Pages`
2. Source：`Deploy from a branch`
3. Branch：`main`
4. Folder：`/(root)`

## Roadmap

- PDF 压缩、旋转、图片转 PDF
- 图片裁剪与批量压缩
- 时区 / 跨时区会议转换
- 正则表达式测试器
- JSON / YAML 互转
- 文件 SHA-256 校验
- 中文标点规范化
- PWA / 离线安装
- 可选账号与跨设备数据同步

## License

MIT
