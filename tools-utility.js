(() => {
  "use strict";
  const { registerTool, $, $$, escapeHtml, copyText, button, baseEditor } = Toolbox;

  const pad2 = n => String(n).padStart(2, "0");
  const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  };
  const parseYmdUtc = value => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!m) return null;
    const y = +m[1], mon = +m[2], day = +m[3];
    const ms = Date.UTC(y, mon - 1, day);
    const d = new Date(ms);
    if (d.getUTCFullYear() !== y || d.getUTCMonth() !== mon - 1 || d.getUTCDate() !== day) return null;
    return d;
  };
  const formatYmdUtc = d => `${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}-${pad2(d.getUTCDate())}`;
  const weekdays = ["周日","周一","周二","周三","周四","周五","周六"];

  registerTool({ id:"datecalc", icon:"日", name:"日期 / 工作日计算", category:"日期时间", desc:"日期间隔、工作日和 N 天后日期。", keywords:"日期 天数 工作日 间隔 期限 截止" }, root => {
    const today = todayLocal();
    root.innerHTML = `<div class="editor-stack"><div class="two-col"><div class="field"><label>开始日期</label><input id="dateA" class="text-input" type="date" value="${today}"></div><div class="field"><label>结束日期</label><input id="dateB" class="text-input" type="date" value="${today}"></div></div><div class="toolbar"><button id="dateDiff" class="primary-btn" type="button">计算间隔</button><button id="workdays" class="secondary-btn" type="button">计算工作日</button></div><div class="two-col"><div class="field"><label>基准日期</label><input id="baseDate" class="text-input" type="date" value="${today}"></div><div class="field"><label>加 / 减天数</label><input id="addDays" class="text-input" type="number" value="30"></div></div><button id="dateAdd" class="secondary-btn" type="button">计算目标日期</button><div class="output-panel">按日历日期计算，不受夏令时切换影响。</div></div>`;
    const out = $(".output-panel", root);
    const get = id => parseYmdUtc($(id, root).value);
    $("#dateDiff", root).onclick = () => {
      const a = get("#dateA"), b = get("#dateB");
      if (!a || !b) return out.textContent = "请选择有效日期。";
      const days = Math.round((b.getTime() - a.getTime()) / 86400000);
      out.textContent = `相差 ${Math.abs(days)} 天\n若首尾两天都计入：${Math.abs(days)+1} 天`;
    };
    $("#workdays", root).onclick = () => {
      let a = get("#dateA"), b = get("#dateB");
      if (!a || !b) return out.textContent = "请选择有效日期。";
      if (a > b) [a,b] = [b,a];
      let count = 0;
      for (const d = new Date(a); d <= b; d.setUTCDate(d.getUTCDate()+1)) if (![0,6].includes(d.getUTCDay())) count++;
      out.textContent = `周一至周五共 ${count} 个工作日（未扣除法定节假日）。`;
    };
    $("#dateAdd", root).onclick = () => {
      const d = get("#baseDate");
      if (!d) return out.textContent = "请选择有效日期。";
      d.setUTCDate(d.getUTCDate() + (Number($("#addDays", root).value) || 0));
      out.textContent = `目标日期：${formatYmdUtc(d)}（${weekdays[d.getUTCDay()]}）`;
    };
  });

  registerTool({ id:"percentage", icon:"%", name:"百分比 / 涨跌幅", category:"计算", desc:"百分比、折扣和变化率。", keywords:"百分比 涨幅 跌幅 折扣 增长 计算" }, root => {
    root.innerHTML = `<div class="editor-stack"><div class="three-col"><div class="field"><label>X</label><input id="pX" class="text-input" type="number" value="20"></div><div class="field"><label>Y</label><input id="pY" class="text-input" type="number" value="100"></div><div class="field"><label>变化率 %</label><input id="pR" class="text-input" type="number" value="10"></div></div><div class="toolbar"><button id="percentOf" class="primary-btn" type="button">X% 的 Y</button><button id="change" class="secondary-btn" type="button">X → Y 涨跌幅</button><button id="increase" class="secondary-btn" type="button">X 增加 R%</button><button id="decrease" class="secondary-btn" type="button">X 减少 R%</button></div><div class="output-panel">例：20% 的 100 = 20。</div></div>`;
    const out = $(".output-panel", root), n = id => Number($(id, root).value);
    $("#percentOf", root).onclick = () => { out.textContent = `结果：${n("#pX")/100*n("#pY")}`; };
    $("#change", root).onclick = () => { const a=n("#pX"), b=n("#pY"); out.textContent = a===0 ? "起始值不能为 0" : `变化率：${((b-a)/Math.abs(a)*100).toFixed(2)}%\n绝对变化：${b-a}`; };
    $("#increase", root).onclick = () => { out.textContent = `结果：${n("#pX")*(1+n("#pR")/100)}`; };
    $("#decrease", root).onclick = () => { out.textContent = `结果：${n("#pX")*(1-n("#pR")/100)}`; };
  });

  registerTool({ id:"units", icon:"⇄", name:"单位转换", category:"计算", desc:"长度、重量、面积、容量、温度和数据大小。", keywords:"单位 换算 长度 重量 温度 面积 容量 MB GB" }, root => {
    const groups = {
      "长度": {m:1,km:1000,cm:.01,mm:.001,mi:1609.344,ft:.3048,inch:.0254},
      "重量": {kg:1,g:.001,mg:.000001,lb:.45359237,oz:.0283495231},
      "面积": {"m²":1,"km²":1e6,"cm²":.0001,ha:10000,acre:4046.8564224,"ft²":.09290304},
      "容量": {L:1,mL:.001,"m³":1000,gal:3.785411784,cup:.2365882365},
      "数据": {B:1,KB:1024,MB:1048576,GB:1073741824,TB:1099511627776}
    };
    root.innerHTML = `<div class="editor-stack"><div class="three-col"><div class="field"><label>类型</label><select id="uGroup" class="select-input">${[...Object.keys(groups),"温度"].map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>从</label><select id="uFrom" class="select-input"></select></div><div class="field"><label>到</label><select id="uTo" class="select-input"></select></div></div><div class="field"><label>数值</label><input id="uValue" class="text-input" type="number" value="1"></div><button id="uConvert" class="primary-btn" type="button">转换</button><div class="output-panel"></div></div>`;
    const group = $("#uGroup", root), from = $("#uFrom", root), to = $("#uTo", root), out = $(".output-panel", root);
    const fill = () => { const units = group.value === "温度" ? ["°C","°F","K"] : Object.keys(groups[group.value]); from.innerHTML = units.map(x=>`<option>${x}</option>`).join(""); to.innerHTML = from.innerHTML; if (units[1]) to.value = units[1]; };
    group.onchange = fill; fill();
    $("#uConvert", root).onclick = () => {
      const v = Number($("#uValue", root).value); let r;
      if (group.value === "温度") { const c = from.value === "°C" ? v : from.value === "°F" ? (v-32)*5/9 : v-273.15; r = to.value === "°C" ? c : to.value === "°F" ? c*9/5+32 : c+273.15; }
      else { const m = groups[group.value]; r = v*m[from.value]/m[to.value]; }
      out.textContent = `${v} ${from.value} = ${Number(r.toPrecision(12))} ${to.value}`;
    };
  });

  registerTool({ id:"diff", icon:"±", name:"文本 Diff 对比", category:"文本", desc:"逐行比较两个版本。", keywords:"diff 对比 比较 版本 文本 合同 文案" }, root => {
    root.innerHTML = `<div class="editor-stack"><div class="diff-grid"><div class="field"><label>版本 A</label><textarea id="diffA" class="input-area" placeholder="旧版本"></textarea></div><div class="field"><label>版本 B</label><textarea id="diffB" class="input-area" placeholder="新版本"></textarea></div></div><button id="diffRun" class="primary-btn" type="button">开始对比</button><div class="output-panel diff-output">对比结果会显示在这里。</div></div>`;
    const out = $(".output-panel", root);
    $("#diffRun", root).onclick = () => {
      const A = $("#diffA", root).value.split("\n"), B = $("#diffB", root).value.split("\n");
      if (A.length * B.length > 250000) return out.textContent = "文本过长，请控制在约 500 行以内。";
      const dp = Array.from({length:A.length+1}, () => new Uint16Array(B.length+1));
      for (let i=A.length-1;i>=0;i--) for (let j=B.length-1;j>=0;j--) dp[i][j] = A[i]===B[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
      let i=0,j=0,html="";
      while (i<A.length || j<B.length) {
        if (i<A.length && j<B.length && A[i]===B[j]) { html += `<span class="diff-line diff-same">  ${escapeHtml(A[i])}</span>`; i++; j++; }
        else if (j<B.length && (i===A.length || dp[i][j+1]>=dp[i+1][j])) html += `<span class="diff-line diff-add">+ ${escapeHtml(B[j++])}</span>`;
        else html += `<span class="diff-line diff-del">− ${escapeHtml(A[i++])}</span>`;
      }
      out.innerHTML = html;
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
    return value.includes(delimiter) || /["\r\n]/.test(value) ? `"${value.replace(/"/g,'""')}"` : value;
  };
  const serializeRows = (rows, delimiter) => rows.map(r => r.map(c => quoteCell(c, delimiter)).join(delimiter)).join("\n");

  registerTool({ id:"csv", icon:"表", name:"CSV / 表格清洗", category:"数据", desc:"清理 CSV/TSV、去重并转 JSON。", keywords:"csv tsv excel 表格 去重 json 数据 清洗" }, root => {
    root.innerHTML = `<div class="editor-stack"><textarea id="csvInput" class="input-area" placeholder="粘贴 CSV 或 TSV 数据…"></textarea><div class="toolbar"><button data-csv="clean" class="primary-btn" type="button">清理空白</button><button data-csv="dedupe" class="secondary-btn" type="button">整行去重</button><button data-csv="tsv" class="secondary-btn" type="button">转 TSV</button><button data-csv="json" class="secondary-btn" type="button">转 JSON</button><button data-csv="copy" class="secondary-btn" type="button">复制</button></div><div class="output-panel">结果会显示在这里。</div></div>`;
    const input = $("#csvInput", root), out = $(".output-panel", root);
    const detect = text => text.includes("\t") ? "\t" : ",";
    $$('[data-csv]', root).forEach(btn => btn.onclick = () => {
      if (btn.dataset.csv === "copy") return copyText(out.textContent);
      const delimiter = detect(input.value), rows = parseDelimited(input.value, delimiter), mode = btn.dataset.csv;
      if (mode === "clean") out.textContent = serializeRows(rows.map(r => r.map(x => x.trim())), delimiter);
      if (mode === "dedupe") out.textContent = serializeRows([...new Map(rows.map(r => [JSON.stringify(r), r])).values()], delimiter);
      if (mode === "tsv") out.textContent = serializeRows(rows, "\t");
      if (mode === "json") { const [head=[], ...body] = rows; out.textContent = JSON.stringify(body.map(r => Object.fromEntries(head.map((h,i) => [h.trim() || `col_${i+1}`, r[i] ?? ""]))), null, 2); }
    });
  });

  registerTool({ id:"mask", icon:"隐", name:"敏感信息打码", category:"隐私", desc:"遮盖邮箱、手机号、长数字和 IP。", keywords:"隐私 脱敏 打码 手机 邮箱 数字 IP" }, root => {
    const { input, toolbar, output } = baseEditor(root, "粘贴需要脱敏的文本…");
    const run = () => {
      let s = input.value;
      s = s.replace(/([\w.+-]{1,3})[\w.+-]*(@[\w.-]+\.[A-Za-z]{2,})/g,"$1***$2")
        .replace(/\b1\d{10}\b/g, value => `${value.slice(0,3)}****${value.slice(-4)}`)
        .replace(/\b\d{12,19}\b/g, value => `${value.slice(0,4)}${"*".repeat(Math.max(4,value.length-8))}${value.slice(-4)}`)
        .replace(/\b(\d{1,3}\.\d{1,3})\.\d{1,3}\.\d{1,3}\b/g,"$1.*.*");
      output.textContent = s;
    };
    toolbar.append(button("一键打码", run, "primary-btn"), button("复制", () => copyText(output.textContent)));
    output.textContent = "建议人工复核后再对外发送。";
  });

  registerTool({ id:"base64", icon:"64", name:"Base64 编解码", category:"开发", desc:"UTF-8 文本与 Base64 双向转换。", keywords:"base64 编码 解码 开发" }, root => {
    const { input, toolbar, output } = baseEditor(root, "输入需要编码或解码的文本…");
    const enc = s => { const bytes = new TextEncoder().encode(s); let bin=""; for (let i=0;i<bytes.length;i+=32768) bin += String.fromCharCode(...bytes.subarray(i,i+32768)); return btoa(bin); };
    const dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.trim()), c => c.charCodeAt(0)));
    toolbar.append(button("编码", () => { try { output.textContent = enc(input.value); } catch(e) { output.textContent = "编码失败："+e.message; } }, "primary-btn"), button("解码", () => { try { output.textContent = dec(input.value); } catch(e) { output.textContent = "解码失败："+e.message; } }), button("复制", () => copyText(output.textContent)));
  });

  registerTool({ id:"random", icon:"#", name:"密码 / 随机生成器", category:"隐私", desc:"生成密码、UUID 和随机字符串。", keywords:"密码 password uuid 随机 字符串" }, root => {
    root.innerHTML = `<div class="editor-stack"><div class="three-col"><div class="field"><label>长度</label><input id="rLen" class="text-input" type="number" min="4" max="256" value="20"></div><div class="field"><label>数量</label><input id="rCount" class="text-input" type="number" min="1" max="50" value="5"></div><div class="field"><label>字符集</label><select id="rSet" class="select-input"><option value="password">强密码</option><option value="alnum">字母数字</option><option value="hex">十六进制</option></select></div></div><div class="toolbar"><button id="rGen" class="primary-btn" type="button">生成随机字符串</button><button id="rUuid" class="secondary-btn" type="button">生成 UUID</button><button id="rCopy" class="secondary-btn" type="button">复制</button></div><div class="output-panel"></div></div>`;
    const out = $(".output-panel", root);
    const rand = chars => { const len=Math.min(256,Math.max(4,Number($("#rLen",root).value)||20)), arr=new Uint32Array(len); crypto.getRandomValues(arr); return [...arr].map(n => chars[n%chars.length]).join(""); };
    $("#rGen", root).onclick = () => { const sets={password:"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=",alnum:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",hex:"0123456789abcdef"}, count=Math.min(50,Math.max(1,Number($("#rCount",root).value)||5)); out.textContent=Array.from({length:count},()=>rand(sets[$("#rSet",root).value])).join("\n"); };
    $("#rUuid", root).onclick = () => { const count=Math.min(50,Math.max(1,Number($("#rCount",root).value)||5)); out.textContent=Array.from({length:count},()=>crypto.randomUUID()).join("\n"); };
    $("#rCopy", root).onclick = () => copyText(out.textContent);
  });
})();