(() => {
  "use strict";
  const { registerTool, $, escapeHtml, download, formatBytes, loadScript } = Toolbox;

  registerTool({ id:"pdf", icon:"PDF", name:"PDF 合并 / 拆分", category:"文件", desc:"合并多个 PDF，或提取指定页码。", keywords:"pdf 合并 拆分 提取 页面 文件" }, root => {
    root.innerHTML = `<div class="editor-stack"><div class="inline-note">PDF 在浏览器本地读取和生成；首次使用会加载 pdf-lib。</div><div class="field"><label>合并多个 PDF</label><input id="pdfFiles" class="file-drop" type="file" accept="application/pdf" multiple><div id="pdfList" class="file-list"></div></div><button id="mergePdf" class="primary-btn" type="button">合并并下载</button><hr class="divider"><div class="field"><label>拆分 / 提取页码</label><input id="splitPdfFile" class="file-drop" type="file" accept="application/pdf"></div><div class="two-col"><div class="field"><label>页码，例如 1-3,5</label><input id="pdfPages" class="text-input" placeholder="1-3,5"></div><div class="field"><label>文件名</label><input id="pdfName" class="text-input" value="extracted.pdf"></div></div><button id="splitPdf" class="secondary-btn" type="button">提取并下载</button><div class="output-panel">选择 PDF 后开始处理。</div></div>`;
    const out = $(".output-panel", root), files = $("#pdfFiles", root), list = $("#pdfList", root);
    const ensure = async () => {
      out.textContent = "正在加载 PDF 组件…";
      await loadScript("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js", () => window.PDFLib);
    };

    files.onchange = () => {
      list.innerHTML = [...files.files].map(file => `<div class="file-item"><span>${escapeHtml(file.name)}</span><span>${formatBytes(file.size)}</span></div>`).join("");
    };

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
      } catch (error) {
        out.textContent = `错误：${error.message}`;
      }
    };

    $("#splitPdf", root).onclick = async () => {
      try {
        const file = $("#splitPdfFile", root).files[0];
        if (!file) throw new Error("请选择一个 PDF");
        await ensure();
        const source = await PDFLib.PDFDocument.load(await file.arrayBuffer());
        const max = source.getPageCount();
        const pages = new Set();
        for (const part of $("#pdfPages", root).value.split(",")) {
          if (part.includes("-")) {
            let [a,b] = part.split("-").map(Number);
            if (a > b) [a,b] = [b,a];
            for (let i=a;i<=b;i++) pages.add(i);
          } else {
            pages.add(Number(part));
          }
        }
        const indices = [...pages].filter(n => Number.isInteger(n) && n >= 1 && n <= max).sort((a,b) => a-b).map(n => n-1);
        if (!indices.length) throw new Error(`请输入 1-${max} 内的页码`);
        const target = await PDFLib.PDFDocument.create();
        (await target.copyPages(source, indices)).forEach(page => target.addPage(page));
        download(new Blob([await target.save()], { type:"application/pdf" }), $("#pdfName", root).value.trim() || "extracted.pdf");
        out.textContent = `✓ 已提取 ${indices.length} 页。`;
      } catch (error) {
        out.textContent = `错误：${error.message}`;
      }
    };
  });
})();
