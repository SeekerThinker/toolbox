(() => {
  "use strict";
  const { registerTool, $, $$, escapeHtml, copyText, button, baseEditor, download, formatBytes, loadScript } = Toolbox;

  registerTool({ id:"pdf", icon:"PDF", name:"PDF 合并 / 拆分", category:"文件", desc:"合并多个 PDF，或提取指定页码。", keywords:"pdf 合并 拆分 提取 页面 文件" }, root => {
    root.innerHTML = `<div class="editor-stack"><div class="inline-note">PDF 在浏览器本地读取和生成；首次使用会加载 pdf-lib。</div><div class="field"><label>合并多个 PDF</label><input id="pdfFiles" class="file-drop" type="file" accept="application/pdf" multiple><div id="pdfList" class="file-list"></div></div><button id="mergePdf" class="primary-btn" type="button">合并并下载</button><hr class="divider"><div class="field"><label>拆分 / 提取页码</label><input id="splitPdfFile" class="file-drop" type="file" accept="application/pdf"></div><div class="two-col"><div class="field"><label>页码，例如 1-3,5</label><input id="pdfPages" class="text-input" placeholder="1-3,5"></div><div class="field"><label>文件名</label><input id="pdfName" class="text-input" value="extracted.pdf"></div></div><button id="splitPdf" class="secondary-btn" type="button">提取并下载</button><div class="output-panel">选择 PDF 后开始处理。</div></div>`;
    const out = $(".output-panel", root), files = $("#pdfFiles", root), list = $("#pdfList", root);
    const ensure = async () => { out.textContent = "正在加载 PDF 组件…"; await loadScript("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js", () => window.PDFLib); };
    files.onchange = () => { list.innerHTML = [...files.files].map(f => `<div class="file-item"><span>${escapeHtml(f.name)}</span><span>${formatBytes(f.size)}</span></div>`).join(""); };
    $("#mergePdf", root).onclick = async () => {
      try {
        if (!files.files.length) throw new Error("请先选择 PDF");
        await ensure();
        const merged = await PDFLib.PDFDocument.create();
        for (const file of files.files) {
          const source = await PDFLib.PDFDocument.load(await file.arrayBuffer());
          (await merged.copyPages(source, source.getPageIndices())).forEach(page => merged.addPage(page));
        }
        download(new Blob([await merged.save()], { type:"application/pdf" }), "merged.pdf");
        out.textContent = `✓ 已合并 ${files.files.length} 个 PDF，共 ${merged.getPageCount()} 页。`;
      } catch (error) { out.textContent = `错误：${error.message}`; }
    };
    $("#splitPdf", root).onclick = async () => {
      try {
        const file = $("#splitPdfFile", root).files[0];
        if (!file) throw new Error("请选择一个 PDF");
        await ensure();
        const source = await PDFLib.PDFDocument.load(await file.arrayBuffer()), max = source.getPageCount(), pages = new Set();
        for (const part of $("#pdfPages", root).value.split(",")) {
          if (part.includes("-")) {
            let [a,b] = part.split("-").map(Number); if (a > b) [a,b] = [b,a];
            for (let i=a;i<=b;i++) pages.add(i);
          } else pages.add(Number(part));
        }
        const indices = [...pages].filter(n => Number.isInteger(n) && n >= 1 && n <= max).sort((a,b) => a-b).map(n => n-1);
        if (!indices.length) throw new Error(`请输入 1-${max} 内的页码`);
        const target = await PDFLib.PDFDocument.create();
        (await target.copyPages(source, indices)).forEach(page => target.addPage(page));
        download(new Blob([await target.save()], { type:"application/pdf" }), $("#pdfName", root).value.trim() || "extracted.pdf");
        out.textContent = `✓ 已提取 ${indices.length} 页。`;
      } catch (error) { out.textContent = `错误：${error.message}`; }
    };
  });

  const parseDelimited = (text, delimiter) => {
    const rows = []; let row = [], cell = "", quoted = false;
    for (let i=0;i<text.length;i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i+1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === delimiter) { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    row.push(cell.replace(/\r$/, ""));
    if (row.length > 1 || row[0] !== "" || rows.length === 0) rows.push(row);
    return rows;
  };
  const quoteCell = (cell, delimiter) => {
    const value = String(cell ?? "");
    return value.includes(delimiter) || /["\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  };
  const serializeRows = (rows, delimiter) => rows.map(row => row.map(cell => quoteCell(cell, delimiter)).join(delimiter)).join("\n");

  registerTool({ id:"csv", icon:"表", name:"CSV / 表格清洗", category:"数据", desc:"清理 CSV/TSV、去重并转 JSON。", keywords:"csv tsv excel 表格 去重 json 数据 清洗" }, root => {
    root.innerHTML = `<div class="editor-stack"><textarea id="csvInput" class="input-area" placeholder="粘贴 CSV 或 TSV 数据…"></textarea><div class="toolbar"><button data-csv="clean" class="primary-btn" type="button">清理空白</button><button data-csv="dedupe" class="secondary-btn" type="button">整行去重</button><button data-csv="tsv" class="secondary-btn" type="button">转 TSV</button><button data-csv="json" class="secondary-btn" type="button">转 JSON</button><button data-csv="copy" class="secondary-btn" type="button">复制</button></div><div class="output-panel">结果会显示在这里。</div></div>`;
    const input = $("#csvInput", root), out = $(".output-panel", root);
    const detect = text => text.includes("\t") ? "\t" : ",";
    $$('[data-csv]', root).forEach(btn => btn.onclick = () => {
      if (btn.dataset.csv === "copy") return copyText(out.textContent);
      const delimiter = detect(input.value), rows = parseDelimited(input.value, delimiter), mode = btn.dataset.csv;
      if (mode === "clean") out.textContent = serializeRows(rows.map(row => row.map(value => value.trim())), delimiter);
      if (mode === "dedupe") out.textContent = serializeRows([...new Map(rows.map(row => [JSON.stringify(row), row])).values()], delimiter);
      if (mode === "tsv") out.textContent = serializeRows(rows, "\t");
      if (mode === "json") {
        const [head = [], ...body] = rows;
        out.textContent = JSON.stringify(body.map(row => Object.fromEntries(head.map((name, i) => [name.trim() || `col_${i+1}`, row[i] ?? ""]))), null, 2);
      }
    });
  });

  registerTool({ id:"mask", icon:"隐", name:"敏感信息打码", category:"隐私", desc:"批量遮盖邮箱、手机号、长数字和 IP。", keywords:"隐私 脱敏 打码 手机 邮箱 数字 IP" }, root => {
    const { input, toolbar, output } = baseEditor(root, "粘贴需要脱敏的文本…");
    const run = () => {
      let text = input.value;
      text = text
        .replace(/([\w.+-]{1,3})[\w.+-]*(@[\w.-]+\.[A-Za-z]{2,})/g, "$1***$2")
        .replace(/(?<!\d)(1[3-9]\d)(\d{4})(\d{4})(?!\d)/g, "$1****$3")
        .replace(/(?<!\d)(\d{4})(\d{8,12})(\d{4})(?!\d)/g, "$1********$3")
        .replace(/\b(\d{1,3}\.\d{1,3})\.\d{1,3}\.\d{1,3}\b/g, "$1.*.*");
      output.textContent = text;
    };
    toolbar.append(button("一键打码", run, "primary-btn"), button("复制", () => copyText(output.textContent)));
    output.textContent = "建议人工复核后再对外发送。";
  });
})();