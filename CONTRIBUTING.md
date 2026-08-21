# 🤝 《X-Opto Lab 课题组模拟器》开源贡献指南 (Contributing Guide)

欢迎加入《X-Opto Lab 课题组模拟器》的开源共建！无论你是提建议、修改 Bug、调整数值平衡，还是为游戏增加新的仪器设备、论文课题或同门角色，我们都非常欢迎！

---

## 🛠️ 极简开发指引（零依赖）

本项目为**纯原生前端工程**，无需安装 Node.js、Webpack、React 等任何复杂的脚手架环境：

1. **Fork 本仓库** 到你的个人 GitHub 账号；
2. **克隆代码到本地**：
   ```bash
   git clone https://github.com/<你的用户名>/xopto-lab.git
   cd xopto-lab
   ```
3. **本地预览与测试**：
   - 方式 A：直接在浏览器双击打开 `index.html`；
   - 方式 B：启动轻量 Python 静态服务：
     ```bash
     python3 -m http.server 8090
     ```
     浏览器访问 `http://localhost:8090` 即可实时调试。

---

## 🔬 数据驱动模块对照表（如何快速加新内容）

所有游戏数据均采用声明式配置，位于 `js/gameData.js`：

### 1. 增加新仪器 / 重型实验设备
在 `GAME_DATA.equipmentList` 中追加新对象：
```javascript
{
    id: 'laser_raman',
    name: '共聚焦显微拉曼光谱仪',
    icon: '🔬',
    price: 80,                       // 购买价格 (万元)
    stageReq: 2,                     // 解锁阶段门槛
    type: 'station',
    productKey: 'ramanData',         // 产出资源类型
    productName: '分子拉曼图谱',
    inputRecipe: { films: 1 },       // 输入消耗配方
    recipeDesc: '🧤 钙钛矿薄膜×1 ➔ 🔬 分子拉曼图谱×1',
    baseYield: 1.0,
    desc: '高空间分辨率原位微区结构与振动模式解析。'
}
```

### 2. 增加全新 SCI 论文研究课题
在 `GAME_DATA.paperTopics` 中追加：
```javascript
{
    id: 'terahertz_paper',
    title: '太赫兹超宽频段非铅金属卤化物光电响应动力学',
    icon: '⚡',
    stageReq: 3,
    equipCost: 120,
    basePrestige: 60,
    reqData: { precursors: 30, films: 25, spectra: 15, compute: 15 },
    journalNames: { 4: 'Phys. Rev. B', 3: 'Optica', 2: 'Adv. Funct. Mater.', 1: 'Nature Materials', supreme: 'Nature' },
    desc: '探索微观极化激元超快耦合机理，开辟太赫兹光电子前沿赛道！'
}
```

### 3. 增加新博士天骄 / 同门特质
- **博士天骄**：在 `GAME_DATA.legendaryMembers` 中定义资质、专属特质与多维学术解锁条件；
- **同门特质**：在 `GAME_DATA.traits` 中添加新的特质加成效果。

---

## 📮 提交 Pull Request 标准流程

1. 在你的分支上修改并测试无误；
2. 运行 `node -c js/*.js` 确保无语法报错；
3. 提交 Commit 并推送到你的分支：
   ```bash
   git commit -am "feat: add Confocal Raman equipment and Terahertz paper topic"
   git push origin main
   ```
4. 在 GitHub 仓库页面点击 **New Pull Request** 提交，我们会及时 Review 并合并！

🎉 感谢每一位为科研模拟器添砖加瓦的学术合伙人！
