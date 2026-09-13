# Toolbox

一个轻量、开源、Local-first 的个人工作方法工具集，偏向长期使用的 **思维、专注与复盘**。

**在线使用：** https://seekerthinker.github.io/toolbox/

## 定位

Toolbox 不追求工具数量，也不收录“偶尔用一次就结束”的一步式转换工具。

一个功能更适合进入 Toolbox，通常需要满足下面至少一项：

- 会被反复使用，并形成稳定的个人工作习惯；
- 能帮助澄清目标、拆解任务、做判断或复盘；
- 会持续产生个人数据、历史记录或可复用的方法；
- 能减少注意力切换，而不只是少点几下鼠标。

因此，图片处理、二维码、OCR、文本转换、百分比、单位换算、CSV 清洗、脱敏、PDF 等低频工具不再属于主产品方向。

## 工具

目前共 **10 个核心工具**。

| 分类 | 工具 |
| --- | --- |
| **思维** | Brain Dump、任务拆解、艾森豪威尔矩阵、加权决策矩阵、5 Whys、事前风险推演、每日 / 每周复盘、费曼学习卡 |
| **专注** | 番茄钟、深度工作计时 |

## 相关独立项目

相关项目保持独立仓库，不计入 Toolbox 的核心工具数量；Toolbox 可以提供轻量入口或辅助页面。

- **[Word 结构化写作模板集](https://github.com/SeekerThinker/word-writing-templates)**：Windows / macOS 的书籍与文章 Word 模板。普通用户可直接打开 **[在线模板选择向导](https://seekerthinker.github.io/toolbox/word-writing-templates/)**，回答三个问题后下载合适模板。

## 使用体验

- `/` 快捷键聚焦搜索
- 分类筛选、收藏、最近使用
- 深色模式与响应式布局
- 无账号也可以完整使用
- 数据优先保存在当前浏览器

## 数据与 Local-first

Toolbox 使用统一的 `toolbox:data:v1` 本地数据结构保存偏好、收藏、最近使用以及部分专注 / 思维工具状态。旧版 `deskkit:*` 数据会自动迁移。

统一数据层已经为后续的数据导入 / 导出和可选云同步留出接口。未来即使加入账号，也应保持：**不登录可以完整使用，登录只用于同步、迁移和备份。**

## 技术结构

```text
index.html                    # Toolbox 页面结构
styles.css                    # Toolbox 样式
core.js                       # 工具注册、搜索、收藏、主题、统一存储
tools-focus.js                # 番茄钟、深度工作
tools-thinking.js             # 拆解、决策、复盘、学习等思维工具
word-writing-templates/       # 独立 Word 模板项目的在线选择向导
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
node --check tools-focus.js
node --check tools-thinking.js
node --check word-writing-templates/app.js
node tests/smoke.mjs
```

GitHub Actions 会在 push 和 pull request 时自动执行这些检查。

## Roadmap

当前优先级不是增加更多工具，而是增强长期使用价值：

- 数据导入 / 导出 UI
- 可选账号与跨设备同步
- 专注历史与趋势
- 复盘历史与检索
- 个人模板与常用结构
- 决策记录与回看
- PWA / 离线安装

## License

MIT
