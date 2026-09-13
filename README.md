# DeskKit · 办公写作工具箱

一个轻量、无后端、隐私友好的日常办公与写作小工具集合。

## 已有工具

- 字数统计：字符、汉字、英文词数、段落、阅读时长
- 文本清理：多余空格、空行、行首尾空白
- 英文大小写：UPPER / lower / Title Case / Sentence case
- 行处理器：去重、排序、反转
- Markdown 预览
- JSON 格式化 / 压缩 / 校验
- URL 编解码
- Unix 时间戳转换
- 会议议程生成器

同时支持工具搜索、分类筛选、本地收藏、深色模式和移动端布局。

## 隐私

DeskKit 是纯前端静态站点。文本处理逻辑在浏览器本地执行，默认不会将输入内容上传到服务器。

## 本地运行

无需安装依赖：

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## GitHub Pages

仓库已按静态站点方式组织。进入 **Settings → Pages**，在 **Build and deployment** 中选择 **Deploy from a branch**，分支选择 `main`，目录选择 `/(root)` 即可发布。

## License

MIT
