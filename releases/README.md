# 1.0 基线

归档文件：`message-center-v1.0.0.tar.gz`，在通用任务改造前保存。
SHA-256：`a2e912f0e265b76dfdc603787765c731719314c2133bf3f94d04be2a397c582d`

包含源代码、静态问卷文件、依赖锁文件、设计文档。此备份不是 Git 标签，不包含 node_modules、构建产物和浏览器数据。

恢复：在独立空目录运行 `tar -xzf /归档的绝对路径/message-center-v1.0.0.tar.gz`，再执行 `npm ci` 和 `npm run dev`。不要直接覆盖当前开发目录。

1.0 浏览器存储键为 suitability-demo-v2；1.1 使用 message-center-v1.1。首次打开 1.1 时复制旧数据并兼容为回访问卷，不覆盖旧键。QA 模式均增加 -qa 后缀。浏览器数据本身未包含在源码归档中。
