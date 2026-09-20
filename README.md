# 词力星球 · 背单词闯关（vocab-master）

面向小学 / 初中 / 高中三学段的背单词记录 Web App：跟读、拼写、中英考试、打卡激励与熟练度追踪。
纯前端单页应用（React + TypeScript + Vite + Tailwind + ECharts），数据用浏览器 `localStorage` 持久化，无需后端。

## 功能

- **跟读评分**：Web Speech API 实时识别发音，编辑距离计算相似度（≥70 记为正确）
- **拼写练习**：听音 / 看义两种模式
- **中英考试**：按学段与题型自动出题、逐题计时、结算积分
- **熟练度追踪**：按正确率 + 速度综合计算 0~100，薄弱词优先
- **激励体系**：连续打卡、里程碑解锁、称号升级
- **数据可视化**：ECharts 呈现熟练度分布、近 14 天打卡、各学段掌握对比

## 本地运行

```bash
npm install
npm run dev        # http://localhost:5173
# 或构建后预览
npm run build && npm run preview
```

> 跟读语音识别依赖浏览器支持（推荐 Chrome / Edge）；发音朗读所有现代浏览器均支持。

## 部署

通过 GitHub Pages 自动部署（见 `.github/workflows/deploy.yml`）：
推送到 `main` 分支即触发构建并发布。
在仓库 **Settings → Pages → Source** 选择 **GitHub Actions** 即可。

线上地址：`https://<你的用户名>.github.io/vocab-master/`
