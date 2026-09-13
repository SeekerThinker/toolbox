(() => {
  window.$$ = (selector, root=document) => [...root.querySelectorAll(selector)];

  renderers.ocr = root => {
    root.innerHTML=`<div class="editor-stack"><div class="inline-note">首次使用需下载 OCR 引擎与语言模型，速度会慢一些；图片仍在浏览器本地识别。</div><div class="two-col"><div class="field"><label>图片</label><input id="ocrFile" class="file-drop" type="file" accept="image/*"></div><div class="field"><label>语言</label><select id="ocrLang" class="select-input"><option value="chi_sim+eng">简体中文 + 英文</option><option value="eng">英文</option><option value="jpn+eng">日文 + 英文</option></select></div></div><div class="toolbar"><button id="ocrStart" class="primary-btn" type="button">开始识别</button><button id="ocrCopy" class="secondary-btn" type="button">复制结果</button></div><div class="progress"><span></span></div><div class="output-panel">选择图片开始识别。</div></div>`;
    const out=$(".output-panel",root),bar=$(".progress span",root);
    $("#ocrStart",root).onclick=async()=>{
      let worker;
      try {
        const f=$("#ocrFile",root).files[0]; if(!f)throw new Error("请选择图片");
        out.textContent="正在加载 OCR…";
        await deskkitLoadScript("https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js",()=>window.Tesseract);
        worker=await Tesseract.createWorker($("#ocrLang",root).value,1,{logger:m=>{if(m.progress!=null)bar.style.width=`${Math.round(m.progress*100)}%`;if(m.status)out.textContent=`${m.status} ${m.progress!=null?Math.round(m.progress*100)+"%":""}`;}});
        const {data:{text}}=await worker.recognize(f); out.textContent=text.trim()||"未识别到文字"; bar.style.width="100%";
      } catch(e) { out.textContent=`错误：${e.message}`; bar.style.width="0%"; }
      finally { if(worker) await worker.terminate(); }
    };
    $("#ocrCopy",root).onclick=()=>copyText(out.textContent);
  };
})();
