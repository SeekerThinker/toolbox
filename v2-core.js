(() => {
  const extras = [
    { id:"pdf", icon:"PDF", name:"PDF 合并 / 拆分", category:"文件", desc:"合并多个 PDF，或从一个 PDF 提取指定页码。", keywords:"pdf 合并 拆分 提取 页面 文件", local:true },
    { id:"image", icon:"▧", name:"图片压缩 / 缩放", category:"图片", desc:"调整尺寸、质量和格式，直接在浏览器生成新图片。", keywords:"图片 压缩 缩放 jpg png webp 格式 转换", local:true },
    { id:"ocr", icon:"识", name:"图片 OCR 识字", category:"图片", desc:"从截图、照片和扫描图中提取中文、英文或日文文字。", keywords:"ocr 截图 识字 图片 转文字 扫描", local:true },
    { id:"qr", icon:"▦", name:"二维码生成 / 识别", category:"图片", desc:"把文字或链接生成二维码，也可识别本地二维码图片。", keywords:"二维码 qr code 生成 识别 链接", local:true },
    { id:"datecalc", icon:"日", name:"日期 / 工作日计算", category:"日期时间", desc:"计算日期间隔、工作日数量，或快速推算 N 天后的日期。", keywords:"日期 天数 工作日 间隔 期限 截止", local:true },
    { id:"percentage", icon:"%", name:"百分比 / 涨跌幅", category:"计算", desc:"算百分比、折扣、增长率、下降率和 A 到 B 的变化。", keywords:"百分比 涨幅 跌幅 折扣 增长 计算", local:true },
    { id:"units", icon:"⇄", name:"单位转换", category:"计算", desc:"长度、重量、面积、容量、温度和数据大小快速换算。", keywords:"单位 换算 长度 重量 温度 面积 容量 MB GB", local:true },
    { id:"diff", icon:"±", name:"文本 Diff 对比", category:"文本", desc:"逐行比较两个版本，快速找到新增、删除和修改位置。", keywords:"diff 对比 比较 版本 文本 合同 文案", local:true },
    { id:"csv", icon:"表", name:"CSV / 表格清洗", category:"数据", desc:"CSV/TSV 转换、去重、清理空白并转换为 JSON。", keywords:"csv tsv excel 表格 去重 json 数据 清洗", local:true },
    { id:"mask", icon:"隐", name:"敏感信息打码", category:"隐私", desc:"批量遮盖邮箱、手机号、身份证号、银行卡号和 IP。", keywords:"隐私 脱敏 打码 手机 邮箱 身份证 银行卡", local:true },
    { id:"base64", icon:"64", name:"Base64 编解码", category:"开发", desc:"文本与 Base64 双向转换，支持 UTF-8 中文。", keywords:"base64 编码 解码 开发", local:true },
    { id:"random", icon:"#", name:"密码 / 随机生成器", category:"隐私", desc:"生成密码、UUID 和随机字符串，不经过服务器。", keywords:"密码 password uuid 随机 字符串", local:true },
  ];

  tools.forEach(t => {
    t.local = true;
    if (t.id === "lines") t.category = "数据";
    if (t.id === "timestamp") t.category = "日期时间";
    if (t.id === "agenda") t.category = "写作";
  });
  tools.unshift(...extras);
  categories.splice(0, categories.length, "全部","文件","图片","文本","计算","日期时间","数据","写作","开发","隐私","收藏");
  state.recent = JSON.parse(localStorage.getItem("deskkit:recent") || "[]");

  window.deskkitLoadScript = (src, test) => {
    window.__deskkitScripts ||= new Map();
    if (test?.()) return Promise.resolve();
    if (window.__deskkitScripts.has(src)) return window.__deskkitScripts.get(src);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = resolve; s.onerror = () => reject(new Error("外部组件加载失败")); document.head.appendChild(s);
    });
    window.__deskkitScripts.set(src, p); return p;
  };
  window.deskkitDownload = (blob, filename) => {
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  };
  window.deskkitFormatBytes = bytes => {
    if (!bytes) return "0 B"; const u=["B","KB","MB","GB"];let i=0,n=bytes;while(n>=1024&&i<u.length-1){n/=1024;i++;}return `${n.toFixed(i?1:0)} ${u[i]}`;
  };

  filteredTools = function() {
    const q=state.query.trim().toLowerCase();
    let source=state.category==="最近"?state.recent.map(id=>tools.find(t=>t.id===id)).filter(Boolean):tools;
    return source.filter(t=>{
      const catOk=state.category==="全部"||state.category==="最近"||(state.category==="收藏"?state.favorites.has(t.id):t.category===state.category);
      return catOk && (!q || `${t.name} ${t.desc} ${t.keywords} ${t.category}`.toLowerCase().includes(q));
    });
  };
  render = function() {
    renderTabs(); const list=filteredTools();
    $("#sectionTitle").textContent=state.category==="全部"?"全部工具":state.category==="收藏"?"我的收藏":state.category==="最近"?"最近使用":`${state.category}工具`;
    $("#resultCount").textContent=`${list.length} 个工具`; const count=$("#heroToolCount"); if(count)count.textContent=`${tools.length} 个工具`;
    $("#emptyState").hidden=list.length>0;
    grid.innerHTML=list.map(t=>`<article class="tool-card" data-id="${t.id}" tabindex="0" role="button"><div class="card-top"><span class="tool-icon">${t.icon}</span><button class="favorite ${state.favorites.has(t.id)?"on":""}" data-fav="${t.id}" type="button" aria-label="收藏 ${t.name}">★</button></div><h3>${t.name}</h3><p>${t.desc}</p><div class="card-meta"><span><span class="tag">${t.category}</span>${t.local?'<span class="local-dot">● 本地</span>':''}</span><span class="open-hint">打开 →</span></div></article>`).join("");
  };
  openTool = function(id) {
    const t=tools.find(x=>x.id===id); if(!t||!renderers[id])return;
    state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,8);localStorage.setItem("deskkit:recent",JSON.stringify(state.recent));
    $("#dialogIcon").textContent=t.icon;$("#dialogTitle").textContent=t.name;$("#dialogDesc").textContent=t.desc;const badge=$("#dialogLocalBadge");if(badge)badge.hidden=!t.local;mount.innerHTML="";renderers[id](mount);dialog.showModal();
  };
  $("#recentBtn")?.addEventListener("click",()=>{state.category="最近";render();document.querySelector(".workspace").scrollIntoView();});

  renderers.datecalc = root => {
    const today=new Date().toISOString().slice(0,10);root.innerHTML=`<div class="editor-stack"><div class="two-col"><div class="field"><label>开始日期</label><input id="dateA" class="text-input" type="date" value="${today}"></div><div class="field"><label>结束日期</label><input id="dateB" class="text-input" type="date" value="${today}"></div></div><div class="toolbar"><button id="dateDiff" class="primary-btn" type="button">计算间隔</button><button id="workdays" class="secondary-btn" type="button">计算工作日</button></div><div class="two-col"><div class="field"><label>基准日期</label><input id="baseDate" class="text-input" type="date" value="${today}"></div><div class="field"><label>加 / 减天数</label><input id="addDays" class="text-input" type="number" value="30"></div></div><button id="dateAdd" class="secondary-btn" type="button">计算目标日期</button><div class="output-panel">可计算自然日、工作日，以及 N 天后的日期。</div></div>`;
    const out=$(".output-panel",root),parse=id=>new Date(`${$(id,root).value}T00:00:00`),days=(a,b)=>Math.round((b-a)/86400000);
    $("#dateDiff",root).onclick=()=>{const a=parse("#dateA"),b=parse("#dateB"),d=days(a,b);out.textContent=`相差 ${Math.abs(d)} 天\n若首尾两天都计入：${Math.abs(d)+1} 天`;};
    $("#workdays",root).onclick=()=>{let a=parse("#dateA"),b=parse("#dateB");if(a>b)[a,b]=[b,a];let n=0,d=new Date(a);while(d<=b){if(![0,6].includes(d.getDay()))n++;d.setDate(d.getDate()+1);}out.textContent=`周一至周五共 ${n} 个工作日（未扣除法定节假日）。`;};
    $("#dateAdd",root).onclick=()=>{const d=parse("#baseDate");d.setDate(d.getDate()+(Number($("#addDays",root).value)||0));out.textContent=`目标日期：${d.toLocaleDateString()}（${["周日","周一","周二","周三","周四","周五","周六"][d.getDay()]}）`;};
  };
  renderers.percentage = root => {
    root.innerHTML=`<div class="editor-stack"><div class="three-col"><div class="field"><label>X</label><input id="pX" class="text-input" type="number" value="20"></div><div class="field"><label>Y</label><input id="pY" class="text-input" type="number" value="100"></div><div class="field"><label>变化率 %</label><input id="pR" class="text-input" type="number" value="10"></div></div><div class="toolbar"><button id="percentOf" class="primary-btn" type="button">X% 的 Y</button><button id="change" class="secondary-btn" type="button">X → Y 涨跌幅</button><button id="increase" class="secondary-btn" type="button">X 增加 R%</button><button id="decrease" class="secondary-btn" type="button">X 减少 R%</button></div><div class="output-panel">例：20% 的 100 = 20。</div></div>`;const out=$(".output-panel",root),n=id=>Number($(id,root).value);$("#percentOf",root).onclick=()=>out.textContent=`结果：${n("#pX")/100*n("#pY")}`;$("#change",root).onclick=()=>{const a=n("#pX"),b=n("#pY");out.textContent=a===0?"起始值不能为 0":`变化率：${((b-a)/Math.abs(a)*100).toFixed(2)}%\n绝对变化：${b-a}`;};$("#increase",root).onclick=()=>out.textContent=`结果：${n("#pX")*(1+n("#pR")/100)}`;$("#decrease",root).onclick=()=>out.textContent=`结果：${n("#pX")*(1-n("#pR")/100)}`;
  };
  renderers.units = root => {
    const groups={"长度":{m:1,km:1000,cm:.01,mm:.001,mi:1609.344,ft:.3048,inch:.0254},"重量":{kg:1,g:.001,mg:.000001,lb:.45359237,oz:.0283495231},"面积":{"m²":1,"km²":1e6,"cm²":.0001,ha:10000,acre:4046.8564224,"ft²":.09290304},"容量":{L:1,mL:.001,"m³":1000,gal:3.785411784,cup:.2365882365},"数据":{B:1,KB:1024,MB:1048576,GB:1073741824,TB:1099511627776}};
    root.innerHTML=`<div class="editor-stack"><div class="three-col"><div class="field"><label>类型</label><select id="uGroup" class="select-input">${[...Object.keys(groups),"温度"].map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>从</label><select id="uFrom" class="select-input"></select></div><div class="field"><label>到</label><select id="uTo" class="select-input"></select></div></div><div class="field"><label>数值</label><input id="uValue" class="text-input" type="number" value="1"></div><button id="uConvert" class="primary-btn" type="button">转换</button><div class="output-panel"></div></div>`;const g=$("#uGroup",root),from=$("#uFrom",root),to=$("#uTo",root),out=$(".output-panel",root);const fill=()=>{const us=g.value==="温度"?["°C","°F","K"]:Object.keys(groups[g.value]);from.innerHTML=us.map(x=>`<option>${x}</option>`).join("");to.innerHTML=from.innerHTML;if(us[1])to.value=us[1];};g.onchange=fill;fill();$("#uConvert",root).onclick=()=>{const v=Number($("#uValue",root).value);let r;if(g.value==="温度"){let c=from.value==="°C"?v:from.value==="°F"?(v-32)*5/9:v-273.15;r=to.value==="°C"?c:to.value==="°F"?c*9/5+32:c+273.15;}else{const m=groups[g.value];r=v*m[from.value]/m[to.value];}out.textContent=`${v} ${from.value} = ${Number(r.toPrecision(12))} ${to.value}`;};
  };
  renderers.diff = root => {
    root.innerHTML=`<div class="editor-stack"><div class="diff-grid"><div class="field"><label>版本 A</label><textarea id="diffA" class="input-area" placeholder="旧版本"></textarea></div><div class="field"><label>版本 B</label><textarea id="diffB" class="input-area" placeholder="新版本"></textarea></div></div><button id="diffRun" class="primary-btn" type="button">开始对比</button><div class="output-panel diff-output">对比结果会显示在这里。</div></div>`;const out=$(".output-panel",root);$("#diffRun",root).onclick=()=>{const A=$("#diffA",root).value.split("\n"),B=$("#diffB",root).value.split("\n");if(A.length*B.length>250000)return out.textContent="文本过长，请控制在约 500 行以内。";const dp=Array.from({length:A.length+1},()=>new Uint16Array(B.length+1));for(let i=A.length-1;i>=0;i--)for(let j=B.length-1;j>=0;j--)dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);let i=0,j=0,h="";while(i<A.length||j<B.length){if(i<A.length&&j<B.length&&A[i]===B[j]){h+=`<span class="diff-line diff-same">  ${escapeHtml(A[i])}</span>`;i++;j++;}else if(j<B.length&&(i===A.length||dp[i][j+1]>=dp[i+1][j])){h+=`<span class="diff-line diff-add">+ ${escapeHtml(B[j++])}</span>`;}else h+=`<span class="diff-line diff-del">− ${escapeHtml(A[i++])}</span>`;}out.innerHTML=h;};
  };
  renderers.csv = root => {
    root.innerHTML=`<div class="editor-stack"><textarea id="csvInput" class="input-area" placeholder="粘贴 CSV 或 TSV 数据…"></textarea><div class="toolbar"><button data-csv="clean" class="primary-btn" type="button">清理空白</button><button data-csv="dedupe" class="secondary-btn" type="button">整行去重</button><button data-csv="tsv" class="secondary-btn" type="button">转 TSV</button><button data-csv="json" class="secondary-btn" type="button">转 JSON</button><button data-csv="copy" class="secondary-btn" type="button">复制结果</button></div><div class="output-panel">结果会显示在这里。</div></div>`;const input=$("#csvInput",root),out=$(".output-panel",root),detect=s=>s.includes("\t")?"\t":",";const parse=(s,d)=>s.trim().split(/\r?\n/).map(line=>line.split(d));$$('[data-csv]',root).forEach(b=>b.onclick=()=>{const d=detect(input.value),rows=parse(input.value,d),m=b.dataset.csv;if(m==="clean")out.textContent=rows.map(r=>r.map(x=>x.trim()).join(d)).join("\n");if(m==="dedupe")out.textContent=[...new Set(rows.map(r=>r.join(d)))].join("\n");if(m==="tsv")out.textContent=rows.map(r=>r.join("\t")).join("\n");if(m==="json"){const [head,...body]=rows;out.textContent=JSON.stringify(body.map(r=>Object.fromEntries(head.map((h,i)=>[h.trim()||`col_${i+1}`,r[i]??""]))),null,2);}if(m==="copy")copyText(out.textContent);});
  };
  renderers.mask = root => {
    const {input,toolbar,output}=baseEditor(root,"粘贴包含邮箱、手机号、身份证、银行卡或 IP 的文本…");const run=()=>{let s=input.value;s=s.replace(/([\w.+-]{1,3})[\w.+-]*(@[\w.-]+\.[A-Za-z]{2,})/g,"$1***$2").replace(/(?<!\d)(1[3-9]\d)(\d{4})(\d{4})(?!\d)/g,"$1****$3").replace(/(?<!\d)(\d{6})(\d{8})(\d{3}[\dXx])(?!\d)/g,"$1********$3").replace(/(?<!\d)(\d{4})(\d{8,12})(\d{4})(?!\d)/g,"$1********$3").replace(/\b(\d{1,3}\.\d{1,3})\.\d{1,3}\.\d{1,3}\b/g,"$1.*.*");output.textContent=s;};toolbar.append(button("一键打码",run,"primary-btn"),button("复制结果",()=>copyText(output.textContent)));output.textContent="打码结果会显示在这里。建议人工复核后再对外发送。";
  };
  renderers.base64 = root => {
    const {input,toolbar,output}=baseEditor(root,"输入需要编码或解码的文本…");const enc=s=>{const bytes=new TextEncoder().encode(s);let bin="";for(let i=0;i<bytes.length;i+=32768)bin+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(bin);},dec=s=>new TextDecoder().decode(Uint8Array.from(atob(s.trim()),c=>c.charCodeAt(0)));toolbar.append(button("编码",()=>{try{output.textContent=enc(input.value)}catch(e){output.textContent="编码失败："+e.message}},"primary-btn"),button("解码",()=>{try{output.textContent=dec(input.value)}catch(e){output.textContent="解码失败："+e.message}}),button("复制",()=>copyText(output.textContent)));
  };
  renderers.random = root => {
    root.innerHTML=`<div class="editor-stack"><div class="three-col"><div class="field"><label>长度</label><input id="rLen" class="text-input" type="number" min="4" max="256" value="20"></div><div class="field"><label>数量</label><input id="rCount" class="text-input" type="number" min="1" max="50" value="5"></div><div class="field"><label>字符集</label><select id="rSet" class="select-input"><option value="password">强密码</option><option value="alnum">字母数字</option><option value="hex">十六进制</option></select></div></div><div class="toolbar"><button id="rGen" class="primary-btn" type="button">生成随机字符串</button><button id="rUuid" class="secondary-btn" type="button">生成 UUID</button><button id="rCopy" class="secondary-btn" type="button">复制</button></div><div class="output-panel"></div></div>`;const out=$(".output-panel",root),rand=chars=>{const len=Math.min(256,Math.max(4,Number($("#rLen",root).value)||20)),arr=new Uint32Array(len);crypto.getRandomValues(arr);return [...arr].map(n=>chars[n%chars.length]).join("");};$("#rGen",root).onclick=()=>{const sets={password:"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=",alnum:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",hex:"0123456789abcdef"},count=Math.min(50,Math.max(1,Number($("#rCount",root).value)||5));out.textContent=Array.from({length:count},()=>rand(sets[$("#rSet",root).value])).join("\n");};$("#rUuid",root).onclick=()=>{const count=Math.min(50,Math.max(1,Number($("#rCount",root).value)||5));out.textContent=Array.from({length:count},()=>crypto.randomUUID()).join("\n");};$("#rCopy",root).onclick=()=>copyText(out.textContent);
  };
})();
