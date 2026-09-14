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

must(page.includes('./app.js') && page.includes('./styles.css'), 'homepage assets missing');
must(!root.includes('word-writing-templates'), 'Word homepage must stay outside the core task UI');
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
must(!app.includes('/structured/'), 'homepage must not expose historical structured paths');
must(page.includes('用 Word 整理思路') && page.includes('把思路变成看得见的结构'), 'ordinary-user value proposition missing');
must(page.includes('导航窗格'), 'thinking-first Navigation Pane guidance missing');
must(page.includes('选一个适合你的模板') && page.includes('不需要登录'), 'ordinary-user download funnel missing');
must(page.includes('成稿需要的东西，也已经在文件里'), 'optional manuscript structure guidance missing');
must(!page.includes('word_quick_success.yml') && !page.includes('word_compatibility_report.yml'), 'homepage should not solicit Word feedback');
must(app.includes('url.searchParams.delete("variant")'), 'legacy two-variant query cleanup missing');

console.log('Word ordinary-user homepage contract OK');
