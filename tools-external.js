(() => {
  "use strict";
  const { registerTool } = Toolbox;

  registerTool({ id:"word-writing-templates", icon:"W", name:"Word 写作模板", category:"写作", desc:"Windows / macOS 的书籍与文章结构化写作模板，下载后双击即用。", keywords:"word 模板 写作 写书 文章 排版 标题 章节 论文 windows mac macos" }, root => {
    root.innerHTML = `<div class="editor-stack"><div class="output-panel"><strong>Word 结构化写作模板集</strong><br><br>无需配置 Word。提供 Windows 与 macOS 成品模板，可选择书籍、文章和多种常用章节编号。</div><div class="toolbar spaced"><a class="primary-btn" href="https://github.com/SeekerThinker/word-writing-templates/releases/latest" target="_blank" rel="noreferrer">下载最新版 ↗</a><a class="secondary-btn" href="https://github.com/SeekerThinker/word-writing-templates" target="_blank" rel="noreferrer">查看开源项目 ↗</a></div><p class="stat-note">项目独立维护于 GitHub；Toolbox 只提供入口。</p></div>`;
  });
})();
