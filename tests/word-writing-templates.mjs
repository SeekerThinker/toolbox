import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('word-writing-templates/app.js');
const page = read('word-writing-templates/index.html');
const root = read('index.html');
const readme = read('README.md');
const catalog = read('catalog.yml');

const must = (condition, message) => {
  if (!condition) throw new Error(message);
};

must(page.includes('./app.js') && page.includes('./styles.css'), 'selector page assets missing');
must(!root.includes('word-writing-templates'), 'Word selector must stay outside the core task UI');
must(readme.includes('word-writing-templates') && readme.includes('在线选择器'), 'README does not document the independent Word project');
must(catalog.includes('word-writing-templates') && catalog.includes('SeekerThinker/word-writing-templates'), 'catalog does not index independent Word project');

for (const filename of [
  '书籍-中文传统.dotx',
  '书籍-章节数字.dotx',
  '书籍-纯数字.dotx',
  '文章-中文论文.dotx',
  '文章-数字层级.dotx',
  '文章-中文简洁.dotx'
]) {
  must(app.includes(filename), `missing public template mapping: ${filename}`);
}

must(app.includes('Word-Writing-Templates-Windows.zip'), 'stable Windows package link missing');
must(app.includes('Word-Writing-Templates-macOS.zip'), 'stable macOS package link missing');
must(!app.includes('/structured/'), 'v4 selector must not expose historical structured paths');
must(app.includes('v4 只有一套模板'), 'unified v4 product message missing');
must(app.includes('导航窗格'), 'thinking-first Navigation Pane guidance missing');
must(app.includes('word_quick_success.yml') && app.includes('word_compatibility_report.yml'), 'real Word feedback links missing');
must(app.includes('url.searchParams.delete("variant")'), 'legacy two-variant query cleanup missing');

console.log('Word template selector contract OK');
