# 🤖 AI 开发者与智能体维护指南 (AI Collaboration Guide)

> **给 AI 助手（Cursor / Claude / ChatGPT / Copilot / Antigravity）的上下文与架构指令**

如果你正在使用 AI 辅助开发或让 AI 帮你扩展《X-Opto Lab 课题组模拟器》，请直接将本指南提供给 AI，或在 Cursor / VS Code 中作为全局 Rules。

---

## 📐 核心架构与设计规范

1. **零构建原生设计 (Zero-Build Pure Vanilla JS)**：
   - 本项目纯原生（ES6+ Vanilla JS + HTML5 + CSS3），**禁止引入 Node 打包依赖、Webpack、React 或外部 MP3 文件**；
   - 音效全部由 `js/soundEngine.js` 纯 Web Audio 算法实时合成。

2. **数据驱动体系 (Data-Driven in `js/gameData.js`)**：
   - **仪器设备**：在 `GAME_DATA.equipmentList` 中声明（字段：`id`, `name`, `icon`, `price`, `stageReq`, `productKey`, `productName`, `inputRecipe`, `baseYield`, `desc`）；
   - **论文课题**：在 `GAME_DATA.paperTopics` 中声明（字段：`id`, `title`, `icon`, `stageReq`, `equipCost`, `basePrestige`, `reqData`, `journalNames`, `desc`）；
   - **核心天骄博士**：在 `GAME_DATA.legendaryMembers` 中声明（字段：`id`, `name`, `grade`, `tier`, `stipend`, `unlockConditions`, `apt`, `traits`, `desc`）；
   - **月度劳务费标准**：在 `GAME_DATA.stipendConfig` 中配置阶梯薪酬。

3. **命名与脱敏准则 (Privacy & Homophone Policy)**：
   - 任何人名必须使用规范且生动的**学术谐音名**（如：`初唯宏`、`颂科新`、`霖率领`、`章仕朋`、`夏政豪`、`章梦遥`、`季欣振`、`汪猛`），杜绝使用真实未经脱敏的人名。

---

## 💬 一键给 AI 下达指令的 Prompt 提示词模板

直接复制以下 Prompt 给你的 AI：

### 模板 1：添加新科研仪器
```text
请阅读 js/gameData.js，帮我为《X-Opto Lab 课题组模拟器》新增一台科研仪器：
- 仪器名称：【例如：共聚焦显微拉曼光谱仪】
- 图标：🔬
- 售价：80 万元
- 解锁阶段：第 2 阶段
- 产出资源：拉曼图谱 (ramanData)
- 消耗原料：1 份钙钛矿薄膜 (films)
- 描述文案：原位微区结构与晶格振动模式解析。
请按现有 equipmentList 格式在 js/gameData.js 中添加对应代码，并确保语法完全正确。
```

### 模板 2：添加新顶刊研究课题
```text
请阅读 js/gameData.js，帮我在 paperTopics 中新增一个前沿攻关课题：
- 课题名称：【例如：室温常压超快光电动力学解析】
- 图标：⚡
- 难度与阶段：第 3 阶段
- 消耗实验数据：前驱体 30 份，薄膜 20 份，变温光谱 15 份
- 匹配期刊：Nature Photonics / Science / JACS
请按现有格式输出代码。
```

### 模板 3：添加新博士角色与特质
```text
请阅读 js/gameData.js，帮我在 legendaryMembers 中新增一位天骄博士：
- 名字：【例如：苏致纯】
- 阶位：直博二年级 (SR)
- 专长：理论机理与高通量计算
- 签约科研津贴：50 万元
- 解锁条件：拥有 Xeon 超算 + 发表 1 篇 2 区以上论文
- 专属特质：全组理论计算速度 +40%
请按现有格式输出代码。
```
