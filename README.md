# Toolbox

一个轻量、开源、Local-first 的效率与思维工具集合。

**在线使用：** https://seekerthinker.github.io/toolbox/

## 选择原则

Toolbox 不追求工具数量。一个功能只有在满足下面至少一项时才值得保留：

- 能明显减少一个原本需要多步完成的任务；
- 适合反复使用，并能积累个人数据或习惯；
- 对专注、任务拆解、判断和复盘有持续价值。

因此，不再收录大小写转换、二维码、百分比、单位换算、基础格式转换等低频的一步小工具。

## 工具

目前共 **14 个工具**。

| 分类 | 工具 |
| --- | --- |
| **文件** | PDF 合并 / 拆分 |
| **数据** | CSV / TSV 清洗与转 JSON |
| **隐私** | 敏感信息打码 |
| **写作** | Word 写作模板 |
| **思维** | Brain Dump、任务拆解、艾森豪威尔矩阵、加权决策矩阵、5 Whys、事前风险推演、每日 / 每周复盘、费曼学习卡 |
| **专注** | 番茄钟、深度工作计时 |

其中 **Word 写作模板** 是独立维护的开源项目，Toolbox 提供索引入口：<https://github.com/SeekerThinker/word-writing-templates>。

## 使用体验

- `/` 快捷键聚焦搜索
- 分类筛选、收藏、最近使用
- 深色模式与响应式布局
- 无账号也可以完整使用
- 大多数数据保存在当前浏览器

## 数据与 Local-first

Toolbox 使用统一的 `toolbox:data:v1` 本地数据结构保存偏好、收藏、最近使用和部分工具状态。旧版 `deskkit:*` 数据会自动迁移。

统一数据层同时提供导入 / 导出能力，后续加入可选账号时可以继续沿用同一数据结构做云同步。

PDF、表格、思维输入和专注记录默认在浏览器中处理。PDF 工具首次打开时会从 jsDelivr 加载固定版本的 [pdf-lib](https://github.com/Hopding/pdf-lib)。

## 技术结构

```text
index.html           # 页面结构
styles.css           # 全部样式
core.js              # 工具注册、搜索、收藏、主题、统一存储
├─ tools-practical.js# PDF、CSV、脱敏
├─ tools-focus.js    # 番茄钟、深度工作
├─ tools-thinking.js # 拆解、决策、复盘等思维工具
└─ tools-external.js # 独立开源项目索引入口
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
node --check tools-practical.js
node --check tools-focus.js
node --check tools-thinking.js
node --check tools-external.js
node tests/smoke.mjs
```

GitHub Actions 会在 push 和 pull request 时自动执行这些检查。

## Roadmap

当前优先级不是继续增加工具，而是提升少量核心能力的长期价值：

- 数据导入 / 导出 UI
- 可选账号与跨设备同步
- 专注与复盘的历史视图
- PWA / 离线安装
- 第三方脚本完整性与更严格的安全策略
- 只有在确有高频需求时才增加新工具

## License

MIT