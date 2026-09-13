(() => {
  "use strict";
  const { registerTool } = Toolbox;

  registerTool({ id:"word-writing-templates", icon:"W", name:"Word 写作模板", category:"写作", desc:"Windows / macOS 的书籍与文章结构化写作模板，下载后双击即用。", keywords:"word 模板 写作 写书 文章 排版 标题 章节 论文 windows mac macos" }, root => {
    root.innerHTML = `<div class="editor-stack"><div class="output-panel"><strong>Word 结构化写作模板集</strong><br><br>无需配置 Word。选择电脑系统，下载后解压，双击 .dotx 模板即可开始写作。提供书籍、文章和多种常用章节编号。</div><div class="toolbar spaced"><a class="primary-btn" href="https://github.com/SeekerThinker/word-writing-templates/releases/latest/download/Word-Writing-Templates-Windows.zip">下载 Windows 版</a><a class="primary-btn" href="https://github.com/SeekerThinker/word-writing-templates/releases/latest/download/Word-Writing-Templates-macOS.zip">下载 macOS 版</a><a class="secondary-btn" href="https://github.com/SeekerThinker/word-writing-templates" target="_blank" rel="noreferrer">查看模板预览与开源项目 ↗</a></div><p class="stat-note">项目独立维护于 GitHub；Toolbox 提供直接下载入口。</p></div>`;
  });
})();
