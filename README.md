# Toolbox

一个轻量、开源、Local-first 的个人思考与执行系统。

**在线使用：** https://seekerthinker.github.io/toolbox/

## 核心原则

Toolbox 的核心是一件具体要做的事，但**不规定用户必须经过固定流程**。

任务可以只写几个字，然后立刻开始番茄钟。完成标准、下一步、估时、计划时间、优先级、风险分析、Decision Journal、复盘、目标和周期计划都只是可选能力。

产品遵循三个原则：

- **Optional · 可选**：任何环节都不是前置条件；
- **Contextual · 带上下文**：从任务进入任何方法时自动携带已有信息；
- **Composable · 可组合**：某个方法产生的信息可以回到同一个任务，继续被其他能力使用。

任务的复杂度由事情本身决定，而不是由软件决定。

## 产品结构

```text
年 / 月 / 周 / 日方向
          ↕
目标  ↔  任务  ↔  思考方法
          ↕
   番茄钟 / 深度工作
          ↓
       历史记录
          ↓
      长期校准
          ↕
     可选账号同步
```

这些节点都可以缺失。最简单的使用方式始终可以是：

```text
写报告
→ 番茄钟
→ 完成
```

## 年 / 月 / 周 / 日计划

年月周日不是四套待办列表，而是 **Focus Horizons（时间视野）**。

每个周期只按需记录：

- 这个周期最重要的方向 / 结果；
- 计划或提醒；
- 周期结束后的回顾 / 调整。

任务仍然只有一份。系统会自动读取该周期真实产生的数据，包括完成任务数、专注时间、目标打卡和实际完成的任务。

长期校准层可以把这些真实事实一键写入日 / 周 / 月 / 年回顾，用户只需要继续补充自己的判断和下一轮调整。

## 目标与打卡

目标是任务之上的可选对象。

可以创建长期目标、今日打卡、关联已有任务、查看关联任务完成情况和实际专注投入，也可以可选设置“每周目标次数”，例如运动 3 次 / 周。没有目标也不会影响任务、番茄钟或任何思维方法。

## 长期元认知与校准

Toolbox 不把“洞察”做成生产力评分，而是把长期记录变成一面镜子。

估时校准只使用 **已经完成 + 有估时 + 有实际专注记录** 的任务作为样本；重复出现的障碍只提示为“值得验证的模式”，不会直接解释成根因；专注时间分布只描述什么时候更常发生专注，不把它包装成效率因果结论。

长期校准层会同时展示当前日 / 周 / 月 / 年原来的方向、实际完成任务、实际专注投入、目标打卡和可比较估时样本，并允许把事实写回周期回顾。

到达回看日期的 Decision Journal 也会进入校准层，记录后来实际发生了什么、结果与原判断的符合程度、现在最重要的学习，以及当时的置信度。

## 任务详情

打开任务后，默认只强调最直接的操作：

- 开始番茄钟；
- 开始深度工作；
- 标记完成；
- 删除。

其他能力按需展开：任务信息、深入思考、完成后复盘和历史。元认知提示只是建议层，不会阻止用户继续执行。

## 捕获与优先级

首页输入框支持一行一件事，可以一次粘贴多行形成多个待办。

四象限是待办集合的一种可选视图。只有用户主动设置优先级后，任务才进入四象限；没有设置的任务保持“未分类”。

## 当前方法能力

方法库默认折叠，更推荐从具体任务中按需调用。目前共 **8 个方法**：

| 分类 | 方法 |
| --- | --- |
| **思维** | 任务拆解、Decision Journal、原因探索、事前风险推演、阶段复盘、解释与学习 |
| **专注** | 番茄钟、深度工作计时 |

Brain Dump 已吸收到捕获层，艾森豪威尔矩阵已吸收到任务视图，不再作为独立工具。

## 数据、账号与跨设备同步

默认仍是 Local-first：数据保存在浏览器的 `toolbox:data:v1` 中，并支持完整 JSON 导入 / 导出。

账号与同步层已经实现，但**只有站点维护者配置 Supabase 项目后才会真正启用云端**。未配置时，本地模式不受影响。

同步原则：

- 不登录也能完整使用；
- 登录本身不会上传本地数据，用户必须再明确点一次“开始同步”；
- 同步任务、计划、目标、打卡、方法记录、专注历史、周期回顾、决策回看和偏好；
- 只有本机变化时上传，只有云端变化时恢复；
- 两边都变化时不自动覆盖，要求用户选择“保留本机”或“使用云端”；
- 云端使用 `revision` 做乐观并发控制；
- 用户可以只删除云端同步数据，也可以永久删除登录身份及云端数据；
- 两种删除操作都不会删除当前浏览器里的本地工作台。

浏览器端采用 Supabase OAuth + PKCE，并只使用 publishable key。数据库通过 Row Level Security 将每个用户限制在自己的 `user_id`。永久删除账号通过 `supabase/functions/delete-account` Edge Function 完成，管理员 secret key 不进入前端源码。

部署步骤见 [`supabase/README.md`](./supabase/README.md)，数据库结构见 [`supabase/schema.sql`](./supabase/schema.sql)。

> 当前公开站点的 `cloud-config.js` 仍为空配置，所以账号面板只会提示“云同步尚未配置”；这不是把本地备份冒充成已上线的云同步。

## 技术结构

```text
index.html                              # 待办优先的页面结构
styles.css                              # 主界面样式
horizons.css                            # 时间视野 / 目标 / 快速洞察样式
calibration.css                         # 长期校准样式
core.js                                 # 方法注册、统一存储、任务上下文、数据备份
cloud-config.js                         # 可公开的云端浏览器配置
sync.js                                 # 登录、显式开启同步、冲突处理与自动同步
account-lifecycle.js                    # 永久删除账号入口与本地会话清理
tasks.js                                # 捕获、待办、四象限、可选能力、任务历史与复盘
horizons.js                             # 年月周日计划、目标打卡、关联任务与快速洞察
calibration.js                          # 估时、障碍、专注模式、周期事实、目标节奏与决策回看
tools-focus.js                          # taskId / nextAction 关联的番茄钟与深度工作
tools-thinking.js                       # 拆解、Decision Journal、原因探索、风险、复盘、学习
supabase/schema.sql                     # 每用户云数据、RLS 与乐观并发函数
supabase/functions/delete-account/      # 服务端永久删除身份与云端数据
tests/smoke.mjs                         # 核心产品模型检查
```

技术栈：**HTML + CSS + Vanilla JavaScript**。无框架、无 npm 依赖、无构建流程。Supabase JS 只在云同步真正配置并需要登录 / 同步时按需加载。

## 本地运行

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080/`。

## 静态检查

```bash
node --check core.js
node --check cloud-config.js
node --check sync.js
node --check account-lifecycle.js
node --check tools-focus.js
node --check tools-thinking.js
node --check tasks.js
node --check horizons.js
node --check calibration.js
node tests/smoke.mjs
```

GitHub Actions 会在 push 和 pull request 时执行这些检查。

## 下一阶段

1. 创建并配置实际 Supabase 项目，使公开站点的 OAuth / 同步真正上线；
2. 让目标、任务和周期方向之间的关联更无感；
3. 随样本积累，增加更稳健的估时、延期和判断校准趋势；
4. 将计划开始时间与 Google / Outlook / Apple Calendar 等日历打通；
5. PWA / 离线安装。

## License

MIT
