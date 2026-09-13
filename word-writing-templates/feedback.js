(() => {
  "use strict";

  const PROJECT = "https://github.com/SeekerThinker/word-writing-templates";
  const QUICK = `${PROJECT}/issues/new?template=word_quick_success.yml`;
  const FULL = `${PROJECT}/issues/new?template=word_compatibility_report.yml`;
  const MATRIX = `${PROJECT}/blob/main/docs/%E5%85%BC%E5%AE%B9%E6%80%A7%E9%AA%8C%E8%AF%81%E8%AE%B0%E5%BD%95.md`;

  const faq = document.querySelector(".faq");
  if (!faq || document.querySelector(".feedback-panel")) return;

  const panel = document.createElement("section");
  panel.className = "feedback-panel";
  panel.setAttribute("aria-label", "Word 模板使用反馈");
  panel.innerHTML = `
    <div class="feedback-copy">
      <p class="eyebrow">可选 · 帮我们验证真实 Word 体验</p>
      <h2>已经用过模板？告诉我们是否正常</h2>
      <p>不需要懂技术，也不需要上传你的写作内容。只是用过且没发现问题，几十秒就能完成；愿意多检查几项，也有 3～5 分钟的完整验证。</p>
    </div>
    <div class="feedback-actions">
      <a class="btn primary" href="${QUICK}" target="_blank" rel="noreferrer">几十秒：使用正常</a>
      <a class="btn secondary" href="${FULL}" target="_blank" rel="noreferrer">3～5 分钟：完整验证</a>
      <a class="feedback-record" href="${MATRIX}" target="_blank" rel="noreferrer">查看公开兼容性记录 ↗</a>
    </div>`;

  faq.insertAdjacentElement("afterend", panel);
})();
