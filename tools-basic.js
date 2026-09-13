(() => {
  "use strict";
  const { registerTool, $, escapeHtml, copyText, button, baseEditor } = Toolbox;

  registerTool({ id:"counter", icon:"文", name:"字数统计", category:"写作", desc:"字符、汉字、词数、段落和阅读时长。", keywords:"字数 字符 词数 阅读 写作" }, root => {
    root.innerHTML = `<textarea class="input-area" placeholder="开始输入或粘贴文章…" spellcheck="true"></textarea><div class="metrics spaced"></div><p class="stat-note">阅读时长按中文约 300 字/分钟、英文约 200 词/分钟粗略估算。</p>`;
    const input = $(".input-area", root), metrics = $(".metrics", root);
    const update = () => {
      const s = input.value;
      const noSpace = s.replace(/\s/g, "");
      const chinese = (s.match(/[\u4e00-\u9fff]/g) || []).length;
      const words = (s.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
      const paragraphs = s.trim() ? s.trim().split(/\n\s*\n/).length : 0;
      const mins = Math.max(0, Math.ceil(chinese / 300 + words / 200));
      const rows = [["字符",s.length],["不含空格",noSpace.length],["汉字",chinese],["英文词",words],["段落",paragraphs],["预计阅读",mins ? `${mins} 分钟` : "0 分钟"]];
      metrics.innerHTML = rows.map(([k,v]) => `<div class="metric"><strong>${v}</strong><span>${k}</span></div>`).join("");
    };
    input.addEventListener("input", update); update();
  });

  registerTool({ id:"cleaner", icon:"✦", name:"文本清理", category:"文本", desc:"清理多余空格、空行和行首尾空白。", keywords:"空格 空行 清理 排版 文本" }, root => {
    const { input, toolbar, output } = baseEditor(root);
    const clean = mode => {
      let s = input.value;
      if (mode === "spaces") s = s.split("\n").map(x => x.replace(/[ \t]+/g, " ").trim()).join("\n");
      if (mode === "blank") s = s.replace(/\n{3,}/g, "\n\n").trim();
      if (mode === "all") s = s.split("\n").map(x => x.replace(/[ \t]+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
      output.textContent = s;
    };
    toolbar.append(button("清理空格", () => clean("spaces")), button("压缩空行", () => clean("blank")), button("全部清理", () => clean("all"), "primary-btn"), button("复制", () => copyText(output.textContent)));
    output.textContent = "处理结果会显示在这里。";
  });

  registerTool({ id:"case", icon:"Aa", name:"英文大小写", category:"文本", desc:"UPPER、lower、Title Case 与句首大写。", keywords:"英文 大小写 case title" }, root => {
    const { input, toolbar, output } = baseEditor(root, "输入英文文本…");
    const title = s => s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
    const sentence = s => s.toLowerCase().replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, c => c.toUpperCase());
    const act = fn => { output.textContent = fn(input.value); };
    toolbar.append(button("UPPER", () => act(s => s.toUpperCase())), button("lower", () => act(s => s.toLowerCase())), button("Title Case", () => act(title)), button("Sentence case", () => act(sentence)), button("复制", () => copyText(output.textContent), "primary-btn"));
    output.textContent = "转换结果会显示在这里。";
  });

  registerTool({ id:"lines", icon:"≡", name:"行处理器", category:"数据", desc:"逐行去重、排序和反转。", keywords:"行 去重 排序 名单 Excel" }, root => {
    const { input, toolbar, output } = baseEditor(root, "每行一条内容，例如姓名、邮箱、关键词…");
    const lines = () => input.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    toolbar.append(
      button("去重", () => { output.textContent = [...new Set(lines())].join("\n"); }),
      button("A → Z", () => { output.textContent = lines().sort((a,b) => a.localeCompare(b, "zh-CN")).join("\n"); }),
      button("Z → A", () => { output.textContent = lines().sort((a,b) => b.localeCompare(a, "zh-CN")).join("\n"); }),
      button("反转", () => { output.textContent = lines().reverse().join("\n"); }),
      button("复制", () => copyText(output.textContent), "primary-btn")
    );
    output.textContent = "处理结果会显示在这里。";
  });

  registerTool({ id:"markdown", icon:"M↓", name:"Markdown 预览", category:"写作", desc:"边写边预览常用 Markdown。", keywords:"markdown md readme 预览" }, root => {
    root.innerHTML = `<div class="two-col"><textarea class="input-area" placeholder="# 标题\n\n**加粗**、*斜体*、\`代码\`、列表…" spellcheck="true"></textarea><div class="preview"></div></div>`;
    const input = $(".input-area", root), preview = $(".preview", root);
    const md = s => {
      let x = escapeHtml(s);
      x = x.replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^# (.+)$/gm,"<h1>$1</h1>");
      x = x.replace(/^> (.+)$/gm,"<blockquote>$1</blockquote>");
      x = x.replace(/^\- (.+)$/gm,"<li>$1</li>");
      x = x.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
      x = x.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/`([^`]+)`/g,"<code>$1</code>");
      return x.split(/\n{2,}/).map(p => /^\s*<(h\d|ul|blockquote)/.test(p) ? p : `<p>${p.replace(/\n/g,"<br>")}</p>`).join("");
    };
    const update = () => { preview.innerHTML = md(input.value || "# Markdown 预览\n\n在左侧输入内容。"); };
    input.addEventListener("input", update); update();
  });

  registerTool({ id:"json", icon:"{}", name:"JSON 格式化", category:"开发", desc:"美化、压缩和校验 JSON。", keywords:"json 格式化 校验 开发" }, root => {
    const { input, toolbar, output } = baseEditor(root, '粘贴 JSON，例如 {"name":"Toolbox"}');
    const parse = () => JSON.parse(input.value);
    toolbar.append(
      button("格式化", () => { try { output.textContent = JSON.stringify(parse(), null, 2); } catch (e) { output.textContent = "错误：" + e.message; } }, "primary-btn"),
      button("压缩", () => { try { output.textContent = JSON.stringify(parse()); } catch (e) { output.textContent = "错误：" + e.message; } }),
      button("校验", () => { try { parse(); output.textContent = "✓ JSON 有效"; } catch (e) { output.textContent = "✕ " + e.message; } }),
      button("复制", () => copyText(output.textContent))
    );
    output.textContent = "结果会显示在这里。";
  });

  registerTool({ id:"url", icon:"↗", name:"URL 编解码", category:"开发", desc:"编码或解码 URL 参数与文本。", keywords:"url encode decode 编码 解码" }, root => {
    const { input, toolbar, output } = baseEditor(root, "输入 URL 或需要编码的文本…");
    toolbar.append(
      button("编码", () => { try { output.textContent = encodeURIComponent(input.value); } catch (e) { output.textContent = e.message; } }, "primary-btn"),
      button("解码", () => { try { output.textContent = decodeURIComponent(input.value); } catch (e) { output.textContent = "解码失败：" + e.message; } }),
      button("复制", () => copyText(output.textContent))
    );
    output.textContent = "结果会显示在这里。";
  });

  registerTool({ id:"timestamp", icon:"◷", name:"时间戳转换", category:"日期时间", desc:"Unix 时间戳与本地日期时间双向转换。", keywords:"时间戳 unix date 时间" }, root => {
    root.innerHTML = `<div class="two-col"><div class="field"><label>Unix 时间戳（秒或毫秒）</label><input id="tsInput" class="text-input" placeholder="例如 1767225600"></div><div class="field"><label>本地日期时间</label><input id="dateInput" class="text-input" type="datetime-local"></div></div><div class="toolbar spaced"><button id="tsToDate" class="primary-btn" type="button">时间戳 → 日期</button><button id="dateToTs" class="secondary-btn" type="button">日期 → 时间戳</button><button id="nowTs" class="secondary-btn" type="button">当前时间</button></div><div class="output-panel spaced">转换结果会显示在这里。</div>`;
    const ts = $("#tsInput", root), date = $("#dateInput", root), out = $(".output-panel", root);
    $("#tsToDate", root).onclick = () => { let n = Number(ts.value.trim()); if (!Number.isFinite(n)) return out.textContent = "请输入有效数字"; if (Math.abs(n) < 1e12) n *= 1000; const d = new Date(n); out.textContent = Number.isNaN(d.getTime()) ? "无效时间戳" : `${d.toLocaleString()}\nISO: ${d.toISOString()}`; };
    $("#dateToTs", root).onclick = () => { const d = new Date(date.value); if (Number.isNaN(d.getTime())) return out.textContent = "请选择有效日期时间"; out.textContent = `秒：${Math.floor(d.getTime()/1000)}\n毫秒：${d.getTime()}`; };
    $("#nowTs", root).onclick = () => { const d = new Date(); ts.value = Math.floor(d.getTime()/1000); out.textContent = `${d.toLocaleString()}\n秒：${Math.floor(d.getTime()/1000)}`; };
  });

  registerTool({ id:"agenda", icon:"✓", name:"会议议程生成器", category:"写作", desc:"用主题、目标和要点生成会议议程。", keywords:"会议 议程 agenda meeting 模板" }, root => {
    root.innerHTML = `<div class="editor-stack"><div class="field"><label>会议主题</label><input id="aTitle" class="text-input" placeholder="例如：Q4 内容计划评审"></div><div class="two-col"><div class="field"><label>目标</label><input id="aGoal" class="text-input" placeholder="这次会议要达成什么？"></div><div class="field"><label>时长（分钟）</label><input id="aTime" class="text-input" type="number" min="10" value="30"></div></div><div class="field"><label>讨论要点（每行一条）</label><textarea id="aPoints" class="input-area short-area" placeholder="现状回顾\n方案选择\n下一步分工"></textarea></div><div class="toolbar"><button id="aGen" class="primary-btn" type="button">生成议程</button><button id="aCopy" class="secondary-btn" type="button">复制</button></div><div class="output-panel"></div></div>`;
    const out = $(".output-panel", root);
    const build = () => {
      const title = $("#aTitle", root).value.trim() || "未命名会议";
      const goal = $("#aGoal", root).value.trim() || "明确结论与下一步行动";
      const mins = Math.max(10, Number($("#aTime", root).value) || 30);
      const points = $("#aPoints", root).value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      const body = points.length ? points.map((p,i) => `${i+1}. ${p}`).join("\n") : "1. 背景与现状\n2. 核心讨论\n3. 决策与下一步";
      return `# ${title}\n\n目标：${goal}\n时长：${mins} 分钟\n\n## 议程\n${body}\n\n## 会后确认\n- [ ] 结论\n- [ ] Owner\n- [ ] 截止时间`;
    };
    $("#aGen", root).onclick = () => { out.textContent = build(); };
    $("#aCopy", root).onclick = () => copyText(out.textContent || build());
    out.textContent = "填写信息后生成议程。";
  });
})();