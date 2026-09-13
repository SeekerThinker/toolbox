(() => {
  "use strict";
  const { registerTool } = Toolbox;

  registerTool({ id:"word-writing-templates", icon:"W", name:"Word 写作模板", category:"写作", desc:"Windows / macOS 的书籍与文章结构化写作模板，下载后双击即用。", keywords:"word 模板 写作 写书 文章 排版 标题 章节 论文 windows mac macos" }, root => {
    root.innerHTML = `<div class="editor-stack"><div class="output-panel"><strong>Word 结构化写作模板集</strong><br><br>不确定该选哪一个？打开选择向导，回答“写什么、喜欢哪种编号、用什么电脑”三个问题，就会直接给你最合适的模板。</div><div class="toolbar spaced"><a class="primary-btn" href="./word-writing-templates/">帮我选择模板</a><a class="secondary-btn" href="https://github.com/SeekerThinker/word-writing-templates/releases/latest/download/Word-Writing-Templates-Windows.zip">直接下载 Windows 全部模板</a><a class="secondary-btn" href="https://github.com/SeekerThinker/word-writing-templates/releases/latest/download/Word-Writing-Templates-macOS.zip">直接下载 macOS 全部模板</a><a class="secondary-btn" href="https://github.com/SeekerThinker/word-writing-templates" target="_blank" rel="noreferrer">查看开源项目 ↗</a></div><p class="stat-note">模板项目独立维护；Toolbox 提供选择向导和下载入口。</p></div>`;
  });
})();
