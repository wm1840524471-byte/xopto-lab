/**
 * 《论如何建立一个课题组 · X-Opto Lab 模拟器》 - 核心数据层
 * 保留全部世界观资产，重建数值体系：资源/资质/评级/设备差异化/论文配方/月报事件
 */
const GAME_DATA = {

    // ==================== 资源类型定义 ====================
    resources: {
        precursors: { name: '前驱体溶液',   icon: '🧪', color: '#10b981' },
        films:      { name: '钙钛矿薄膜',   icon: '🧤', color: '#4ade80' },
        xrdData:    { name: '晶体XRD谱',    icon: '📐', color: '#f59e0b' },
        absData:    { name: 'UV-Vis吸收谱', icon: '☀️', color: '#06b6d4' },
        uvData:     { name: '紫外响应数据', icon: '🟣', color: '#a855f7' },
        spectra:    { name: '变温荧光光谱', icon: '🌈', color: '#ec4899' },
        compute:    { name: '理论机理算力', icon: '💻', color: '#3b82f6' },
        devices:    { name: '光电器件能级', icon: '⚡', color: '#ef4444' },
        imaging:    { name: '闪烁体成像',   icon: '☢️', color: '#8b5cf6' },
        coffee:     { name: '浓缩咖啡豆',   icon: '☕', color: '#92400e' },
    },

    // ==================== 时间流速基准 ====================
    timeConfig: {
        baseSecPerDay: 2.5, // 1天 = 2.5秒，从容舒适的学术研究与沉浸管理节奏
    },

    // ==================== 产学研全品类回收与样品技术转让阶梯价格 ====================
    // 定位为辅助耗材补贴与零钱周转，核心大额科研经费必须通过发表顶刊论文获得！
    recyclePrices: {
        precursors: { name: '前驱体溶液',   icon: '🧪', unitYuan: 1,   unitWan: 0.00010, desc: '基础配制溶液回收补贴（1元/份）' },
        films:      { name: '钙钛矿薄膜',   icon: '🧤', unitYuan: 2,   unitWan: 0.00020, desc: '标准实验薄膜样品补贴' },
        coffee:     { name: '浓缩咖啡豆',   icon: '☕', unitYuan: 3,   unitWan: 0.00030, desc: '特配提神咖啡豆补贴' },
        xrdData:    { name: '晶体XRD谱',    icon: '📐', unitYuan: 5,   unitWan: 0.00050, desc: '晶相衍射测试样补贴' },
        absData:    { name: 'UV-Vis吸收谱', icon: '☀️', unitYuan: 8,   unitWan: 0.00080, desc: '带隙光学吸收数据包' },
        uvData:     { name: '紫外响应数据', icon: '🟣', unitYuan: 15,  unitWan: 0.00150, desc: '日盲光电探测响应集' },
        spectra:    { name: '变温荧光光谱', icon: '🌈', unitYuan: 25,  unitWan: 0.00250, desc: '低温PL激子发光光谱' },
        compute:    { name: '理论机理算力', icon: '💻', unitYuan: 40,  unitWan: 0.00400, desc: 'DFT/Gaussian机理算力' },
        devices:    { name: '光电器件能级', icon: '⚡', unitYuan: 60,  unitWan: 0.00600, desc: '高能级完整光电器件' },
        imaging:    { name: '闪烁体成像',   icon: '☢️', unitYuan: 100, unitWan: 0.01000, desc: '高能X射线成像闪烁屏' },
    },

    // ==================== 资质系统 ====================
    // 4项资质，每项可从 D 培养到 SS
    aptitudes: {
        lab:      { name: '实验动手力', icon: '🔧', desc: '影响实验数据产出速度' },
        theory:   { name: '理论计算力', icon: '🧮', desc: '影响算力产出与论文理论分' },
        analysis: { name: '数据分析力', icon: '📊', desc: '影响论文撰写速度' },
        insight:  { name: '文献洞察力', icon: '📖', desc: '影响构思推进与课题解锁' },
    },
    // 资质等级 → 乘数
    aptGrades: ['D', 'C', 'B', 'A', 'S', 'SS'],
    aptMult: { D: 1.0, C: 1.15, B: 1.35, A: 1.6, S: 2.0, SS: 2.5 },

    // 阶梯式能力境界提升与突破概率体系配置 (越高越难 · 概率考核 · 幸运保底)
    aptRanksConfig: {
        ranks: ['D', 'C', 'B', 'A', 'S', 'SS'],
        rankDetails: {
            'D': { next: 'C', maxExp: 80,  baseSuccess: 0.90, trainCost: 0.05, trainExp: 20, failLuck: 0.10, name: '入门级', color: '#94a3b8' },
            'C': { next: 'B', maxExp: 140, baseSuccess: 0.75, trainCost: 0.10, trainExp: 25, failLuck: 0.15, name: '熟练级', color: '#60a5fa' },
            'B': { next: 'A', maxExp: 220, baseSuccess: 0.55, trainCost: 0.25, trainExp: 30, failLuck: 0.20, name: '精通级', color: '#34d399' },
            'A': { next: 'S', maxExp: 340, baseSuccess: 0.35, trainCost: 0.60, trainExp: 35, failLuck: 0.25, name: '骨干级', color: '#fbbf24' },
            'S': { next: 'SS', maxExp: 500, baseSuccess: 0.18, trainCost: 1.50, trainExp: 40, failLuck: 0.30, name: '专家级', color: '#f97316' },
            'SS': { next: null, maxExp: 999, baseSuccess: 0.00, trainCost: 0.00, trainExp: 0,  failLuck: 0.00, name: '宗师化境', color: '#ef4444' }
        }
    },

    // ==================== 课题组评级 ====================
    // 靠声望推进，解锁成员上限/设备/论文
    labGrades: [
        { grade: 'F',  prestigeReq: 0,    memberCap: 2,  desc: '初创小隔间' },
        { grade: 'E',  prestigeReq: 30,   memberCap: 3,  desc: '学院初认课题组' },
        { grade: 'D',  prestigeReq: 80,   memberCap: 4,  desc: '校级重点课题组' },
        { grade: 'C',  prestigeReq: 180,  memberCap: 5,  desc: '市级重点实验室' },
        { grade: 'B',  prestigeReq: 350,  memberCap: 6,  desc: '省级重点实验室' },
        { grade: 'A',  prestigeReq: 600,  memberCap: 8,  desc: '前沿重点实验室' },
        { grade: 'S',  prestigeReq: 1000, memberCap: 10, desc: '国家级工程中心' },
        { grade: 'SS', prestigeReq: 1600, memberCap: 12, desc: '国际顶尖工程中心' },
        { grade: 'EX', prestigeReq: 2500, memberCap: 15, desc: '世界世纪巅峰' },
    ],

    // ==================== 初始新手成员 ====================
    starterMember: {
        id: 'starter_rookie',
        name: '研一科研小白',
        grade: '硕士一年级',
        gradeYear: 1,
        avatar: '🧑‍🎓',
        tier: 'Normal',
        apt: { lab: 0, theory: 0, analysis: 0, insight: 0 }, // 经验值，对应 D 级
        traits: [{ id: 'rookie_diligent', name: '《勤勉洗试管》', desc: '积极打基础，洗移液枪和整理实验台' }],
        desc: '刚进组的萌新，怀揣科研梦想，从最基础的配试剂做起。'
    },

    // ==================== 主线任务链 ====================
    mainQuests: [
        { id: 0, title: '白手起家', desc: '手动配制 10 份前驱体溶液并回收变现', targetType: 'inventory_precursors', targetVal: 10, rewardFunding: 0.5, rewardPrestige: 3, rewardText: '经费0.5万 + 声望3' },
        { id: 1, title: '添置首台设备', desc: '在商城购置第 1 台通风橱或仪器', targetType: 'stations_count', targetVal: 1, rewardFunding: 1.0, rewardPrestige: 5, rewardText: '经费1万 + 声望5' },
        { id: 2, title: '立项处女作', desc: '发表首篇小论文', targetType: 'papers_count', targetVal: 1, rewardFunding: 2.0, rewardPrestige: 10, rewardText: '经费2万 + 声望10，解锁招生与人际网' },
        { id: 3, title: '开门招徒', desc: '录取 1 位同门入组', targetType: 'members_count', targetVal: 2, rewardFunding: 3.0, rewardPrestige: 10, rewardText: '经费3万 + 声望10' },
        { id: 4, title: '引进专业仪器', desc: '购置 3 台设备', targetType: 'stations_count', targetVal: 3, rewardFunding: 6.0, rewardPrestige: 15, rewardText: '经费6万 + 声望15' },
        { id: 5, title: '前沿攻坚', desc: '部署超算或变温光谱仪', targetType: 'has_advanced_eq', targetVal: 1, rewardFunding: 15.0, rewardPrestige: 25, rewardText: '经费15万 + 声望25' },
        { id: 6, title: '顶刊破局', desc: '发表首篇顶刊论文', targetType: 'has_top_paper', targetVal: 1, rewardFunding: 50.0, rewardPrestige: 50, rewardText: '迎回创世神卡汪猛！' },
        { id: 7, title: '世纪巅峰', desc: '攻坚 Nature/Science 正刊', targetType: 'grand_theory', targetVal: 1, rewardFunding: 120.0, rewardPrestige: 180, rewardText: '世界顶尖工程中心！' },
    ],

    // ==================== 50+ 同门花名册 (全量深度谐音名) ====================
    labRosterPool: [
        '艾鸣','边鹤','卞紫枫','毕续彤','程馨荟','初世文','耿鹰恺','郭青','孔翎羽',
        '梁涛','梁正均','李辉','李精淮','李乐昕','历隆博','李盟雅','李清','刘凯',
        '柳天年','刘擎航','刘铄','柳天缘','李云龙','罗长乐','芦雅如','马俊延','缪梦然',
        '宁伟强','彭皓杰','浦晓睿','屈佳音','颂景豪','宿致纯','汪浩','汪家家','汪森森',
        '汪泽文','温星婷','巫欣悦','杨元','严嘉宜','姚歌','翟永捷','赵蒙松','赵阳杰',
        '小李','小王','小张','小陈','小刘','小杨','小赵','小孙','小周','小吴','研一萌新','科研小白'
    ],

    // ==================== 八大核心天骄博士 (严格学术门槛 + 签约津贴) ====================
    legendaryMembers: [
        {
            id: 'chuweihong', name: '初唯宏', grade: '博士一年级', gradeYear: 1, avatar: '☕', tier: 'R+',
            stageReq: 1, stipend: 10,
            unlockConditions: [
                { type: 'lab_grade', grade: 2, desc: '评级升至 D 级（校级重点）' },
                { type: 'facility', facId: 'fume_hood', count: 1, desc: '配备化学通风橱' },
                { type: 'facility', facId: 'glovebox_spin', count: 1, desc: '配备手套箱旋涂仪' }
            ],
            apt: { lab: 35, theory: 25, analysis: 25, insight: 20 },
            traits: [
                { id: 'coffee_warrior', name: '《咖啡提神战神》', desc: '驻守咖啡机产出效率翻倍' },
                { id: 'all_helper', name: '《全能实验辅助》', desc: '测试与前驱液配制极细致' }
            ],
            desc: '博一活力新星，自备手冲咖啡，是全组不可或缺的精力源泉。'
        },
        {
            id: 'songkexin', name: '颂科新', grade: '直博一年级', gradeYear: 1, avatar: '🌟', tier: 'R+',
            stageReq: 2, stipend: 25,
            unlockConditions: [
                { type: 'paper_count', count: 2, desc: '累计发表 2 篇论文' },
                { type: 'resource', resKey: 'absData', count: 20, desc: '储备 20 份 UV-Vis 吸收数据' }
            ],
            apt: { lab: 20, theory: 55, analysis: 35, insight: 45 },
            traits: [
                { id: 'math_theory', name: '《数理理论扎实》', desc: '物理机制与能级理论极其透彻' },
                { id: 'five_year_plan', name: '《五年从容规划》', desc: '专心打牢学术地基' }
            ],
            desc: '直博一年级新星。数理功底扎实，专心深耕前沿机制。'
        },
        {
            id: 'linshuailing', name: '霖率领', grade: '博士二年级', gradeYear: 2, avatar: '🥋', tier: 'SR',
            stageReq: 2, stipend: 50,
            unlockConditions: [
                { type: 'equip_level', eqId: 'glovebox_spin', level: 3, desc: '手套箱旋涂仪升至 Lv.3' },
                { type: 'resource', resKey: 'films', count: 100, desc: '储备 100 份高质量薄膜' }
            ],
            apt: { lab: 65, theory: 25, analysis: 35, insight: 25 },
            traits: [
                { id: 'spin_master', name: '《旋涂制膜大师》', desc: '旋涂仪与薄膜产出 ×1.5' },
                { id: 'vasp_debug', name: '《超胞排障卷王》', desc: '通宵排查实验与计算 Bug 神速' }
            ],
            desc: '博二核心先锋。旋涂制膜质量顶级，实验室通宵卷王。'
        },
        {
            id: 'zhangshipeng', name: '章仕朋', grade: '博士二年级', gradeYear: 2, avatar: '🔭', tier: 'SR',
            stageReq: 2, stipend: 80,
            unlockConditions: [
                { type: 'facility', facId: 'uv_station', count: 1, desc: '配备紫外探测测试站' },
                { type: 'resource', resKey: 'uvData', count: 40, desc: '储备 40 份紫外响应数据' }
            ],
            apt: { lab: 50, theory: 35, analysis: 40, insight: 50 },
            traits: [
                { id: 'uv_detector', name: '《紫外日盲光电探测》', desc: '紫外测试台产出 ×2.0' },
                { id: 'paper_radar', name: '《前沿文献雷达》', desc: '追踪热点极快，擅长发掘新赛道' }
            ],
            desc: '博二灵感担当。紫外探测与文献雷达，点子极多。'
        },
        {
            id: 'xiazhenghao', name: '夏政豪', grade: '直博三年级', gradeYear: 3, avatar: '🤖', tier: 'SSR',
            stageReq: 3, stipend: 150,
            unlockConditions: [
                { type: 'facility', facId: 'xrd_diffractometer', count: 1, desc: '配备 X 射线粉末衍射仪 XRD' },
                { type: 'paper_zone', zoneKey: 'zone2', desc: '成功发表 SCI 2区以上成果' }
            ],
            apt: { lab: 60, theory: 70, analysis: 55, insight: 60 },
            traits: [
                { id: 'gaussian_pro', name: '《Gaussian16 配体计算》', desc: '专攻非铅双钙钛矿与闪烁体' },
                { id: 'deep_patience', name: '《深藏不露》', desc: '长线攻关大课题后劲极强' }
            ],
            desc: '直博三年级中坚力量。潜心深耕非铅金属卤化物与闪烁体大课题。'
        },
        {
            id: 'zhangmengyao', name: '章梦遥', grade: '博士三年级', gradeYear: 3, avatar: '👩‍🔬', tier: 'SSR',
            stageReq: 3, stipend: 250,
            unlockConditions: [
                { type: 'facility', facId: 'qe_pro_spec', count: 1, desc: '配备 QE Pro 变温荧光光谱仪' },
                { type: 'facility', facId: 'thermal_evap', count: 1, desc: '配备超高真空热蒸镀系统' },
                { type: 'resource', resKey: 'spectra', count: 40, desc: '储备 40 份变温荧光光谱' }
            ],
            apt: { lab: 65, theory: 75, analysis: 60, insight: 55 },
            traits: [
                { id: 'dft_queen', name: '《双钙钛矿 DFT 计算》', desc: '专攻 BDASbBr5/PVDF 体系与 STE 机理' },
                { id: 'seminar_star', name: '《组会之星》', desc: '配体工程与发光专家，汇报逻辑滴水不漏' }
            ],
            desc: '博三中流砥柱，组会台柱子。精通材料合成与变温 PL 动力学。'
        },
        {
            id: 'jixinzhen', name: '季欣振', grade: '博士四年级', gradeYear: 4, avatar: '⚡', tier: 'SSR',
            stageReq: 3, stipend: 400,
            unlockConditions: [
                { type: 'facility', facId: 'xeon_server', count: 1, desc: '配备双路 Xeon 超算节点' },
                { type: 'resource', resKey: 'compute', count: 200, desc: '累计产出 200 理论算力' },
                { type: 'paper_zone', zoneKey: 'zone1', desc: '发表 SCI 1区顶级论文' }
            ],
            apt: { lab: 50, theory: 85, analysis: 65, insight: 55 },
            traits: [
                { id: 'server_boss', name: '《算力霸主》', desc: '超算产出 ×2.0' },
                { id: 'led_pioneer', name: '《LED 器件大牛》', desc: '深耕高 EQE 钙钛矿 LED' }
            ],
            desc: '博四扛把子，服务器与大型仪器总管。攻坚 LED 器件快准狠。'
        },
        {
            id: 'wangmeng', name: '汪猛', grade: '博士四年级 (创组大当家)', gradeYear: 4, avatar: '🧑‍💻', tier: 'SSSSSR',
            stageReq: 4, stipend: 1000,
            unlockConditions: [
                { type: 'lab_grade', grade: 6, desc: '课题组评级升至 S 级（国家级工程中心）' },
                { type: 'paper_zone', zoneKey: 'supreme', desc: '成功攻克 Nature/Science 顶刊正刊' }
            ],
            apt: { lab: 98, theory: 98, analysis: 98, insight: 98 },
            traits: [
                { id: 'leader_god', name: '《开山拓荒》', desc: '全员科研产出效率 +50%' },
                { id: 'device_master', name: '《代码与器件通神》', desc: '顶刊研发速度翻倍' },
                { id: 'coffee_body', name: '《晨起黑咖啡圣体》', desc: '喝咖啡效率额外 +50%' }
            ],
            desc: '全场唯一创世神卡大当家！带领全组攻坚重大顶尖项目，战力天花板。'
        }
    ],

    // ==================== 仪器学科专业分类定义 ====================
    equipmentCategories: [
        { id: 'all', name: '全部仪器', icon: '🌟' },
        { id: 'synthesis', name: '材料制备', icon: '🧪', desc: '化学合成、旋涂成膜、真空蒸镀与超净间' },
        { id: 'spectroscopy', name: '光学表征', icon: '📐', desc: 'XRD、紫外吸收、变温荧光与飞秒激光' },
        { id: 'device', name: '器件测试', icon: '⚡', desc: '日盲紫外探测、PeLED 与 X 射线闪烁成像' },
        { id: 'hpc', name: '超算机理', icon: '💻', desc: 'Xeon 节点、GPU 智算与 DFT 高通量计算' },
        { id: 'bigscience', name: '世纪重器', icon: '🔬', desc: '球差校正透射电镜与国家同步辐射专用线站' },
        { id: 'facility', name: '后勤动力', icon: '☕', desc: '提神续命与组会研讨工作站' }
    ],

    // ==================== 15 大科研重器产业链 ====================
    equipmentList: [
        {
            id: 'fume_hood',
            name: '防腐防爆化学通风橱',
            category: 'synthesis',
            icon: '🧪',
            price: 3,
            stageReq: 1,
            type: 'station',
            productKey: 'precursors',
            productName: '前驱体溶液',
            inputRecipe: {},
            recipeDesc: '🧪 化学合成（基础原料） ➔ 产出前驱体溶液',
            baseYield: 2.0,
            mechanic: 'synthesis',
            mechanicDesc: '化学合成源头。产出前驱液与配体溶液，供旋涂成膜与测试供料。',
            maxLevel: 5,
            upgradeBaseCost: 1.5,
            desc: '负压排风与恒温磁力搅拌，合成高纯有机胺盐与金属卤化物前驱液。'
        },
        {
            id: 'coffee_machine',
            name: '瑞士全自动双泵意式咖啡机',
            category: 'facility',
            icon: '☕',
            price: 5,
            stageReq: 1,
            type: 'station',
            productKey: 'coffee',
            productName: '浓缩咖啡豆',
            inputRecipe: {},
            recipeDesc: '☕ 自动萃取 ➔ 浓缩咖啡豆',
            baseYield: 0.6,
            mechanic: 'coffee',
            mechanicDesc: '后勤动力源。产出咖啡豆，可激活全组效率翻倍或组会文献精读！',
            maxLevel: 5,
            upgradeBaseCost: 2.0,
            desc: '9 Bar 恒压萃取，初唯宏的快乐源泉，全组提神续命神器。'
        },
        {
            id: 'glovebox_spin',
            name: '高纯手套箱旋涂仪',
            category: 'synthesis',
            icon: '🧤',
            price: 8,
            stageReq: 1,
            type: 'station',
            productKey: 'films',
            productName: '钙钛矿薄膜',
            inputRecipe: { precursors: 1 },
            recipeDesc: '🧪 前驱液×1 ➔ 🧤 钙钛矿薄膜×1',
            baseYield: 1.5,
            mechanic: 'spin',
            mechanicDesc: '稳产主力。消耗前驱液旋涂成高质量致密薄膜，供表征与器件使用！',
            maxLevel: 5,
            upgradeBaseCost: 3.0,
            desc: '水氧低于 0.1 ppm，霖率领招牌工位，产出高质量致密钙钛矿薄膜。'
        },
        {
            id: 'xrd_diffractometer',
            name: 'X 射线粉末衍射仪 (XRD)',
            category: 'spectroscopy',
            icon: '📐',
            price: 20,
            stageReq: 1,
            type: 'station',
            productKey: 'xrdData',
            productName: '晶体XRD谱',
            inputRecipe: { films: 1 },
            recipeDesc: '🧤 钙钛矿薄膜×1 ➔ 📐 晶体XRD谱×1',
            baseYield: 1.2,
            mechanic: 'diffraction',
            mechanicDesc: '晶体结构相测定。取样薄膜解析晶格取向与相纯度，大论文必备硬核数据。',
            maxLevel: 5,
            upgradeBaseCost: 6.0,
            desc: 'Cu-Kα 靶衍射系统，精准解析单晶与薄膜微观晶体结构相变。'
        },
        {
            id: 'uv_vis_spec',
            name: 'UV-Vis 紫外可见分光光度计',
            category: 'spectroscopy',
            icon: '☀️',
            price: 35,
            stageReq: 2,
            type: 'station',
            productKey: 'absData',
            productName: 'UV-Vis吸收谱',
            inputRecipe: { films: 1 },
            recipeDesc: '🧤 钙钛矿薄膜×1 ➔ ☀️ UV-Vis吸收谱×1',
            baseYield: 1.0,
            mechanic: 'absorption',
            mechanicDesc: '光学带隙表征。取样薄膜测定吸收边与 Tauc Plot，颂科新招牌工位。',
            maxLevel: 5,
            upgradeBaseCost: 10.0,
            desc: '双光束全波段吸收光谱系统，测定半导体光学带隙与能级跃迁。'
        },
        {
            id: 'uv_station',
            name: '紫外/日盲光电测试台',
            category: 'device',
            icon: '🟣',
            price: 60,
            stageReq: 2,
            type: 'station',
            productKey: 'uvData',
            productName: '紫外响应数据',
            inputRecipe: { films: 1 },
            recipeDesc: '🧤 钙钛矿薄膜×1 ➔ 🟣 紫外响应数据×1',
            baseYield: 1.0,
            mechanic: 'switch',
            mechanicDesc: '可切换模式。日盲模式产紫外数据；可见光模式兼产薄膜。',
            maxLevel: 5,
            upgradeBaseCost: 18.0,
            desc: '深紫外 DUV 光源与皮安计测试系统，章仕朋招牌工位。'
        },
        {
            id: 'qe_pro_spec',
            name: 'QE Pro 变温荧光光谱仪',
            category: 'spectroscopy',
            icon: '🌈',
            price: 90,
            stageReq: 2,
            type: 'station',
            productKey: 'spectra',
            productName: '变温荧光光谱',
            inputRecipe: { films: 1 },
            recipeDesc: '🧤 钙钛矿薄膜×1 ➔ 🌈 变温荧光光谱×1',
            baseYield: 0.8,
            mechanic: 'tradeoff',
            mechanicDesc: '速度与质量权衡。低温档：产出稳但论文分高；高温档：快速产出。',
            maxLevel: 5,
            upgradeBaseCost: 25.0,
            desc: '变温原位 PL 稳态/瞬态动力学测试台，章梦遥招牌工位。'
        },
        {
            id: 'xeon_server',
            name: '双路 Xeon 超算计算节点',
            category: 'hpc',
            icon: '💻',
            price: 150,
            stageReq: 3,
            type: 'station',
            productKey: 'compute',
            productName: '理论机理算力',
            inputRecipe: {},
            recipeDesc: '⚡ 算力集群 ➔ 💻 理论机理算力',
            baseYield: 1.2,
            mechanic: 'inject',
            mechanicDesc: '产出理论算力，可「注入」在写论文直接缩短撰写 DDL。',
            maxLevel: 5,
            upgradeBaseCost: 40.0,
            desc: '32核/64线程 · VASP/Gaussian 建模集群，季欣振招牌工位。'
        },
        {
            id: 'thermal_evap',
            name: '超高真空多源热蒸镀系统',
            category: 'synthesis',
            icon: '⚡',
            price: 250,
            stageReq: 3,
            type: 'station',
            productKey: 'devices',
            productName: '光电器件能级',
            inputRecipe: { films: 2 },
            recipeDesc: '🧤 钙钛矿薄膜×2 ➔ ⚡ 光电器件能级×1',
            baseYield: 0.6,
            mechanic: 'batch',
            mechanicDesc: '批次制。将优质薄膜蒸镀金属电极，制成高能级完整光电器件！',
            maxLevel: 5,
            upgradeBaseCost: 65.0,
            desc: '真空热蒸镀系统，制备高 EQE LED 与高性能光敏器件。'
        },
        {
            id: 'xray_imaging_station',
            name: '高灵敏 X 射线动态闪烁体成像台',
            category: 'device',
            icon: '☢️',
            price: 400,
            stageReq: 3,
            type: 'station',
            productKey: 'imaging',
            productName: '闪烁体成像数据',
            inputRecipe: { devices: 1, spectra: 1 },
            recipeDesc: '⚡ 光电器件×1 + 🌈 荧光光谱×1 ➔ ☢️ 闪烁体成像×1',
            baseYield: 0.5,
            mechanic: 'rampup',
            mechanicDesc: '连续运转产出递增。结合完整器件与光谱表征，攻坚顶刊大图！',
            maxLevel: 5,
            upgradeBaseCost: 100.0,
            desc: '微剂量闪烁体发光产额与高空间分辨率动态成像系统。'
        },
        {
            id: 'cleanroom_iso5',
            name: '千级恒温恒湿无尘超净实验室工程',
            category: 'synthesis',
            icon: '🏛️',
            price: 650,
            stageReq: 4,
            type: 'station',
            productKey: 'films',
            productName: '超净高纯钙钛矿薄膜',
            inputRecipe: { precursors: 2 },
            recipeDesc: '🧪 前驱液×2 ➔ 🏛️ 超净无缺陷薄膜×2',
            baseYield: 3.5,
            mechanic: 'spin',
            mechanicDesc: '超净化间无尘环境，薄膜缺陷密度大幅降低，产速翻倍！',
            maxLevel: 5,
            upgradeBaseCost: 180.0,
            desc: '国家级重点实验室超净基建工程，恒温恒湿高效送风，微纳米级光电器件制造保障。'
        },
        {
            id: 'femtosecond_laser',
            name: '飞秒超快瞬态吸收激光光谱系统 (fs-TA)',
            category: 'spectroscopy',
            icon: '⚡',
            price: 1200,
            stageReq: 4,
            type: 'station',
            productKey: 'spectra',
            productName: '飞秒超快动力学谱',
            inputRecipe: { films: 1 },
            recipeDesc: '🧤 钙钛矿薄膜×1 ➔ ⚡ 飞秒动力学谱×1',
            baseYield: 2.0,
            mechanic: 'tradeoff',
            mechanicDesc: '飞秒级光激发载流子捕获与界面电荷转移解析，顶刊必备核心动力学证据。',
            maxLevel: 5,
            upgradeBaseCost: 300.0,
            desc: '超快钛宝石飞秒激光放大系统，探测微观激子弛豫与超快能量转移。'
        },
        {
            id: 'hpc_gpu_cluster',
            name: '百卡 A100/H100 AI+DFT 智算超算集群',
            category: 'hpc',
            icon: '🌐',
            price: 2000,
            stageReq: 4,
            type: 'station',
            productKey: 'compute',
            productName: '超阶超胞机理算力',
            inputRecipe: {},
            recipeDesc: '🌐 异构集群 ➔ 💻 超阶机理算力',
            baseYield: 4.5,
            mechanic: 'inject',
            mechanicDesc: '海量超算算力支持！可极速注入在写论文，瞬间缩短论文撰写周期！',
            maxLevel: 5,
            upgradeBaseCost: 500.0,
            desc: '千核异构智算集群，毫秒级模拟双钙钛矿相变与机器学习逆向材料分子设计。'
        },
        {
            id: 'tem_cs_corrected',
            name: '球差校正透射电子显微镜 (Titan Cs-TEM)',
            category: 'bigscience',
            icon: '🔬',
            price: 3500,
            stageReq: 5,
            type: 'station',
            productKey: 'imaging',
            productName: '原子级超高分辨相',
            inputRecipe: { films: 2 },
            recipeDesc: '🧤 优质薄膜×2 ➔ 🔬 原子级晶格微观像×1',
            baseYield: 1.8,
            mechanic: 'diffraction',
            mechanicDesc: '亚埃级超高分辨率原子成像，晶体八面体倾斜与点缺陷直接观测，Nature/Science 压舱石。',
            maxLevel: 5,
            upgradeBaseCost: 800.0,
            desc: '300 kV 场发射球差校正透射电镜，直接观测原子尺度结构演化。'
        },
        {
            id: 'synchrotron_beamline',
            name: '国家重大科技基础设施 · 同步辐射专用线站',
            category: 'bigscience',
            icon: '🌀',
            price: 6500,
            stageReq: 5,
            type: 'station',
            productKey: 'imaging',
            productName: '同步辐射高能相图',
            inputRecipe: { devices: 1, spectra: 1 },
            recipeDesc: '⚡ 光电器件×1 + 🌈 荧光×1 ➔ 🌀 同步辐射原位大图×1',
            baseYield: 3.5,
            mechanic: 'rampup',
            mechanicDesc: '世纪重器。极高亮度同步辐射 X 射线原位实时探测，全实验室科研效能整体倍增！',
            maxLevel: 5,
            upgradeBaseCost: 1500.0,
            desc: '第四代高能同步辐射光源原位线站，终极世纪重器，全组战力天花板！'
        }
    ],

    // ==================== 论文投递分区 (立项时手选) ====================
    paperZones: [
        { id: 'zone4', name: '4区',   mult: 1,    requireCombo: 0,   baseSuccess: 0.95, icon: '📗',
          desc: 'SCI 4区 · 普通期刊，校级课题启动资助', rewardPrestigeMult: 0.5 },
        { id: 'zone3', name: '3区',   mult: 3,    requireCombo: 20,  baseSuccess: 0.70, icon: '📘',
          desc: 'SCI 3区 · 中级期刊，市级/青年科学基金重点资助', rewardPrestigeMult: 1.5 },
        { id: 'zone2', name: '2区',   mult: 8,    requireCombo: 45,  baseSuccess: 0.45, icon: '📙',
          desc: 'SCI 2区 · 权威期刊，国家自然科学面上项目资助', rewardPrestigeMult: 4 },
        { id: 'zone1', name: '1区',   mult: 25,   requireCombo: 70,  baseSuccess: 0.22, icon: '📕',
          desc: 'SCI 1区 · 顶尖期刊，国家重点研发计划千万级战略资助', rewardPrestigeMult: 10 },
        { id: 'supreme', name: '顶刊', mult: 80,  requireCombo: 100, baseSuccess: 0.08, icon: '👑',
          desc: 'Nature/Science 正刊，国家战略科技领军大奖（数千万经费+领袖声望）！', rewardPrestigeMult: 30 }
    ],

    // ==================== 论文课题库 (配方 + 分区投递) ====================
    paperTopics: [
        {
            id: 'precursor_solubility_paper',
            title: '金属卤化物前驱体配位化学与室温溶解平衡初探',
            icon: '🧪',
            stageReq: 1,
            equipCost: 8,
            basePrestige: 3,
            reqData: { precursors: 10 },
            journalNames: { 4: '学院学报(自科版)', 3: '化学通报', 2: 'Inorg. Chem. Commun.', 1: 'Dalton Trans.', supreme: 'Inorg. Chem.' },
            desc: '建组第一篇启蒙小论文！仅需移液配制前驱液即可撰写，验证溶液化学稳定性，赚取学术声望与第一笔论文奖金！'
        },
        {
            id: 'additive_precursor_paper',
            title: '有机铵阳离子添加剂对前驱体胶体粒径的调控机制',
            icon: '⚗️',
            stageReq: 1,
            equipCost: 15,
            basePrestige: 5,
            reqData: { precursors: 25 },
            journalNames: { 4: '化工进展', 3: 'Colloids Surf. A', 2: 'J. Colloid Interface Sci.', 1: 'Langmuir', supreme: 'Chem. Sci.' },
            desc: '深入摸索前驱体抗团聚胶束动力学，纯化学合成即可投递，为高质量结晶打牢地基。'
        },
        {
            id: 'spin_dynamics_paper',
            title: '反溶剂辅助旋涂动力学与钙钛矿薄膜结晶初探',
            icon: '🧤',
            stageReq: 1,
            equipCost: 20,
            basePrestige: 7,
            reqData: { precursors: 15, films: 10 },
            journalNames: { 4: '应用物理学进展', 3: 'Thin Solid Films', 2: 'Appl. Surf. Sci.', 1: 'ACS Appl. Mater. Interfaces', supreme: 'JACS Au' },
            desc: '拥有通风橱与手套箱旋涂仪即可立项！摸索旋涂转速与滴加时机对薄膜形态的影响。'
        },
        {
            id: 'film_passivation_paper',
            title: '多功能配体分子对多晶钙钛矿薄膜的表面钝化效应',
            icon: '✨',
            stageReq: 1,
            equipCost: 28,
            basePrestige: 10,
            reqData: { precursors: 20, films: 18 },
            journalNames: { 4: '材料导报', 3: 'Mater. Res. Bull.', 2: 'Solar RRL', 1: 'Adv. Funct. Mater.', supreme: 'Energy Environ. Sci.' },
            desc: '前驱液配方与成膜表面钝化，显著抑制非辐射复合，大幅提升薄膜荧光产额！'
        },
        {
            id: 'starter_paper',
            title: '高取向钙钛矿发光薄膜微观相结构与相纯度解析',
            icon: '📐',
            stageReq: 1,
            equipCost: 35,
            basePrestige: 14,
            reqData: { precursors: 20, films: 15, xrdData: 8 },
            journalNames: { 4: '发光学报', 3: 'J. Appl. Phys.', 2: 'ACS Appl. Mater.', 1: 'Adv. Funct. Mater.', supreme: 'Nature Commun.' },
            desc: '结合 XRD 结晶度与取向分析，深度剖析微观晶体结构相变，奠定扎实物理表征。'
        },
        {
            id: 'uv_vis_bandgap_paper',
            title: '全无机低维钙钛矿光学带隙调控与激子结合能解析',
            icon: '☀️',
            stageReq: 2,
            equipCost: 45,
            basePrestige: 18,
            reqData: { precursors: 20, films: 18, absData: 10 },
            journalNames: { 4: '物理学报', 3: 'J. Phys. Chem. Lett.', 2: 'Opt. Lett.', 1: 'Nano Energy', supreme: 'Nat. Commun.' },
            desc: '测定双光束全波段吸收边与 Tauc Plot，颂科新招牌工位带隙表征大作。'
        },
        {
            id: 'uv_blind_paper',
            title: '超快响应无铅日盲深紫外光电探测器',
            icon: '🟣',
            stageReq: 2,
            equipCost: 60,
            basePrestige: 25,
            reqData: { precursors: 25, films: 20, absData: 12, uvData: 10 },
            journalNames: { 4: 'Mater. Lett.', 3: 'IEEE Electron Dev. Lett.', 2: 'ACS Photonics', 1: 'Light: Sci. Appl.', supreme: 'Nature Photonics' },
            desc: '吸收带隙调控与微秒级日盲探测响应，章仕朋招牌工位代表作。'
        },
        {
            id: 'pl_dynamics_paper',
            title: '宽温域原位 PL 荧光动力学与自限域激子超快复合机制',
            icon: '🌈',
            stageReq: 2,
            equipCost: 75,
            basePrestige: 32,
            reqData: { precursors: 25, films: 20, spectra: 12, xrdData: 10 },
            journalNames: { 4: 'Spectrochim. Acta A', 3: 'J. Mater. Chem. C', 2: 'Laser Photonics Rev.', 1: 'ACS Nano', supreme: 'Chem' },
            desc: '变温原位瞬态 PL 光谱与动力学分析，章梦遥招牌工位硬核论文。'
        },
        {
            id: 'peled_green_paper',
            title: '28% 外量子效率超高亮钙钛矿绿光 PeLED',
            icon: '⚡',
            stageReq: 3,
            equipCost: 110,
            basePrestige: 42,
            reqData: { precursors: 30, films: 25, devices: 12, spectra: 12 },
            journalNames: { 4: 'Org. Electron.', 3: 'ACS Energy Lett.', 2: 'Adv. Opt. Mater.', 1: 'Adv. Mater.', supreme: 'Science' },
            desc: '界面能级调控与缺陷纯化，刷新钙钛矿发光器件世界纪录！'
        },
        {
            id: 'bdasbbr5_ste_paper',
            title: '非铅双钙钛矿 BDASbBr5/PVDF 缺陷钝化与超胞 DFT 机理',
            icon: '💻',
            stageReq: 3,
            equipCost: 130,
            basePrestige: 55,
            reqData: { precursors: 35, xrdData: 18, spectra: 18, compute: 15 },
            journalNames: { 4: 'J. Phys. Chem. C', 3: 'Chem. Sci.', 2: 'Chem. Mater.', 1: 'JACS', supreme: 'Nature' },
            desc: '超算集群 DFT 理论建模与原位变温 PL 完美印证，季欣振与章梦遥联袂攻坚！'
        },
        {
            id: 'xray_scintillator_paper',
            title: '超低检测限高分辨 X 射线动态闪烁体成像系统',
            icon: '☢️',
            stageReq: 3,
            equipCost: 180,
            basePrestige: 80,
            reqData: { precursors: 40, xrdData: 20, imaging: 15, spectra: 15 },
            journalNames: { 4: 'Radiat. Meas.', 3: 'Phys. Med. Biol.', 2: 'Med. Phys.', 1: 'Nat. Photonics', supreme: 'Science' },
            desc: '微剂量医用与工业探伤动态成像，受到国际光学与医学成像界高度瞩目！'
        },
        {
            id: 'grand_theory_paper',
            title: '面向全光谱发光与射线探测的通用无铅金属卤化物设计范式',
            icon: '👑',
            stageReq: 4,
            equipCost: 350,
            basePrestige: 250,
            reqData: { precursors: 50, films: 40, xrdData: 20, absData: 20, uvData: 20, spectra: 20, compute: 20, devices: 20, imaging: 20 },
            journalNames: { 4: 'J. Phys. Chem. C', 3: 'JACS', 2: 'Nature Sci. Rep.', 1: 'Nature Mater.', supreme: 'Nature / Science 正刊' },
            desc: 'X-Opto 实验室世纪巅峰巨作，猛哥牵头全员攻坚，轰动全球学界！'
        }
    ],

    // ==================== 月报事件池 ====================
    // 每月底随机抽1-2个，带选择，影响下月
    monthlyEvents: [
        {
            id: 'nsfc_review',
            title: '📋 国家自然科学基金评审结果',
            desc: '本年度国自然评审结果出炉，评审委员会正在考察课题组实力。',
            type: 'auto',
            resolve(eng) {
                const grade = eng.getLabGrade();
                if (grade >= 2) {
                    const grant = 4 + grade * 3;
                    eng.funding += grant;
                    return { text: `✅ 课题组评级达 ${GAME_DATA.labGrades[grade].grade} 级，成功获批国自然基金 ${grant} 万元！`, type: 'good' };
                }
                return { text: '❌ 课题组评级不足，国自然基金申请未通过，继续努力！', type: 'bad' };
            }
        },
        {
            id: 'conference_invite',
            title: '🎤 国际学术会议邀请',
            desc: '收到国际学术会议邀请，可派 1 名成员参会交流，大幅提升某项资质。',
            type: 'choice',
            choices: [
                { label: '派实验最强的去', effect(eng) {
                    const cm = window.characterManager;
                    const m = eng.members.reduce((a,b) => (cm.getMemberAptGrade(a,'lab') > cm.getMemberAptGrade(b,'lab') ? a : b));
                    if (m) { eng.addAptExp(m.id, 'lab', 9); return `🎤 ${m.name} 参会后实验动手力大涨！`; }
                    return '无人可派。';
                }},
                { label: '派理论最强的去', effect(eng) {
                    const cm = window.characterManager;
                    const m = eng.members.reduce((a,b) => (cm.getMemberAptGrade(a,'theory') > cm.getMemberAptGrade(b,'theory') ? a : b));
                    if (m) { eng.addAptExp(m.id, 'theory', 9); return `🎤 ${m.name} 参会后理论计算力大涨！`; }
                    return '无人可派。';
                }},
                { label: '派洞察最强的去', effect(eng) {
                    const cm = window.characterManager;
                    const m = eng.members.reduce((a,b) => (cm.getMemberAptGrade(a,'insight') > cm.getMemberAptGrade(b,'insight') ? a : b));
                    if (m) { eng.addAptExp(m.id, 'insight', 9); return `🎤 ${m.name} 参会后文献洞察力大涨！`; }
                    return '无人可派。';
                }},
                { label: '这次不去了', effect(eng) { return '本次未参会。'; } }
            ]
        },
        {
            id: 'equipment_fault',
            title: '🔧 设备年检故障',
            desc: '一台设备年检发现隐患，需花钱维修，否则下月停工。',
            type: 'choice',
            choices: [
                { label: '花 5 万维修', cost: 5, effect(eng) {
                    if (eng.funding < 5) return '经费不足，无法维修！该设备下月停工。';
                    eng.funding -= 5;
                    return '✅ 已维修，设备运转正常。';
                }},
                { label: '不修硬扛', effect(eng) {
                    const stations = eng.stationInstances.filter(s => s.eqId !== 'coffee_machine');
                    if (stations.length > 0) {
                        const target = stations[Math.floor(Math.random() * stations.length)];
                        target.brokenUntilDay = eng._absDay() + 15; // 停工15天
                        const eq = GAME_DATA.equipmentList.find(e => e.id === target.eqId);
                        return `⚠️ ${eq.name} 故障停工 15 天！`;
                    }
                    return '没有可故障的设备。';
                }}
            ]
        },
        {
            id: 'lab_inspection',
            title: '🏫 校领导实验室视察',
            desc: '校领导来视察实验室建设成果，评级达标有奖励。',
            type: 'auto',
            resolve(eng) {
                const grade = eng.getLabGrade();
                const papers = eng.publishedPapers.length;
                if (grade >= 1 && papers >= 1) {
                    const reward = Math.round(2 + Math.min(8, papers * 0.8));
                    eng.funding += reward;
                    eng.prestige += 5;
                    return { text: `✅ 校领导对课题组成果表示赞赏！奖励津贴 ${reward} 万 + 声望 5！`, type: 'good' };
                }
                return { text: '⚠️ 校领导认为课题组成果不足，需加把劲！', type: 'bad' };
            }
        },
        {
            id: 'team_building',
            title: '🍻 课题组团建活动',
            desc: '组织一次课题组团建，花费经费但提升全组下月产出。',
            type: 'choice',
            choices: [
                { label: '花 2 万搞团建', cost: 2, effect(eng) {
                    if (eng.funding < 2) return '经费不足，团建取消。';
                    eng.funding -= 2;
                    eng.buffs.teamBuilding = 6;
                    return '🍻 团建圆满！全组产出 +15%（持续6天）！';
                }},
                { label: '省了吧', effect(eng) { return '本次未组织团建。'; } }
            ]
        },
        {
            id: 'reviewer_chase',
            title: '📬 期刊审稿催稿',
            desc: '编辑催促补充实验数据，需要回应。',
            type: 'auto',
            resolve(eng) {
                if (eng.currentPaperProject && eng.currentPaperProject.phase === 'review') {
                    eng.currentPaperProject.reviewProgress += 5;
                    return { text: '📬 回复编辑「正在补充实验」，审稿进度推进 5%！', type: 'good' };
                }
                return { text: '📭 当前没有在审论文，虚惊一场。', type: 'normal' };
            }
        },
        {
            id: 'recruit_offer',
            title: '🎓 保研学生主动联系',
            desc: '一位优秀的保研生主动联系想加入课题组！',
            type: 'auto',
            resolve(eng) {
                if (eng.members.length < eng.getMemberCap() && eng.rosterAvailable.length > 0) {
                    const grade = eng.getLabGrade();
                    if (grade >= 1) {
                        eng.prestige += 3;
                        return { text: '🎓 课题组声望提升，有保研生关注到你！声望 +3（前往人事 tab 招生）', type: 'good' };
                    }
                }
                return { text: '📭 暂无学生主动联系。', type: 'normal' };
            }
        },
        {
            id: 'grant_policy',
            title: '🏛️ 国家科研新政激励',
            desc: '国家发布新一轮基础研究激励政策，符合条件的课题组可获补贴。',
            type: 'auto',
            resolve(eng) {
                const grade = eng.getLabGrade();
                if (grade >= 2 && eng.publishedPapers.length >= 2) {
                    const grant = 6 + grade * 3;
                    eng.funding += grant;
                    return { text: `✅ 本组符合新政条件，获批激励补贴 ${grant} 万元！`, type: 'good' };
                }
                return { text: '⚠️ 硬性门槛（评级/论文数）不足，本次补贴未拿到。', type: 'normal' };
            }
        },
        {
            id: 'power_outage',
            title: '⚡ 突发停电事故',
            desc: '校园电网突发停摆，几台设备处于运行中，需要处理。',
            type: 'choice',
            choices: [
                { label: '启用备用电源（花 3 万）', cost: 3, effect(eng) {
                    if (eng.funding < 3) return '经费不足！只能硬扛。';
                    eng.funding -= 3;
                    return '🔋 备用电源顶上，设备无一受损！';
                }},
                { label: '硬扛（数据可能受损）', effect(eng) {
                    const lost = {};
                    for (let [k] of Object.entries(GAME_DATA.resources)) {
                        const have = eng.inventory[k] || 0;
                        if (have > 5 && k !== 'coffee') {
                            const loss = have * 0.1;
                            eng.inventory[k] = have - loss;
                            lost[k] = loss;
                        }
                    }
                    const names = Object.keys(lost).map(k => `${GAME_DATA.resources[k].icon}${Math.floor(lost[k])}`).join('、');
                    return `🌩️ 停电损失部分数据（${names}），下次记得备电！`;
                }}
            ]
        },
        {
            id: 'instrument_subsidy',
            title: '🛠️ 仪器平台购置补贴',
            desc: '校大型仪器共享平台推出补贴，按已购设备给予一定返现。',
            type: 'auto',
            resolve(eng) {
                const stationCount = eng.stationInstances.filter(s => s.eqId !== 'coffee_machine').length;
                if (stationCount >= 2) {
                    const rebate = stationCount * 2;
                    eng.funding += rebate;
                    return { text: `✅ 平台补贴兑现！按 ${stationCount} 台设备返现 ${rebate} 万元。`, type: 'good' };
                }
                return { text: '📭 设备还太少，够不上补贴门槛（需≥2台）。', type: 'normal' };
            }
        },
        {
            id: 'journal_review_invite',
            title: '📚 期刊邀约写综述',
            desc: '本领域权威期刊邀你撰写一篇综述，需要投入数据分析时间。',
            type: 'choice',
            choices: [
                { label: '接下（消耗部分数据）', effect(eng) {
                    const need = { spectra: 5, films: 8 };
                    for (let [k, v] of Object.entries(need)) {
                        if ((eng.inventory[k] || 0) < v) return `数据不足（需薄膜8/光谱5），只能婉拒。`;
                    }
                    for (let [k, v] of Object.entries(need)) eng.inventory[k] -= v;
                    eng.prestige += 8;
                    return `✅ 综述发表！声望 +8（消耗薄膜8份+光谱5份）。`;
                }},
                { label: '婉拒（专心搞研究）', effect(eng) { return '📄 婉拒邀约，专注自己的课题。'; } }
            ]
        },
        {
            id: 'talent_project',
            title: '🌟 青年人才计划申报',
            desc: '学校青年人才计划开放申报，可派一名优秀学生冲击荣誉。',
            type: 'choice',
            choices: [
                { label: '派理论最强去申报', effect(eng) {
                    const cm = window.characterManager;
                    const m = eng.members.reduce((a,b) => (cm.getMemberAptGrade(a,'theory') > cm.getMemberAptGrade(b,'theory') ? a : b));
                    if (!m) return '无人可派。';
                    const grade = cm.getMemberAptGrade(m, 'theory');
                    const hitRate = { SS: 0.9, S: 0.7, A: 0.5, B: 0.3, C: 0.1, D: 0.05 }[grade] || 0.05;
                    if (Math.random() < hitRate) {
                        eng.prestige += 12;
                        eng.funding += 8;
                        return `🏆 ${m.name} 成功入选青年人才计划！声望+12，经费+8万！`;
                    }
                    return `😔 ${m.name} 遗憾落选（理论资质${grade}，成功率低也不丢人）。`;
                }},
                { label: '不申报', effect(eng) { return '本次未申报。'; } }
            ]
        },
        {
            id: 'key_project_bid',
            title: '🏗️ 国家重点研发项目招标',
            desc: '国家发布重大项目招标，投标准备需要投入设备数据，中了有大奖。',
            type: 'choice',
            choices: [
                { label: '投标（压上算力+光谱）', effect(eng) {
                    if ((eng.inventory.compute || 0) < 10 || (eng.inventory.spectra || 0) < 5) return '算力/光谱不足（需算力10+光谱5），无法投。';
                    eng.inventory.compute -= 10;
                    eng.inventory.spectra -= 5;
                    const win = eng.prestige > 150 && Math.random() < 0.5;
                    if (win) {
                        eng.funding += 15;
                        eng.prestige += 20;
                        return `🎯 中标国家重点研发项目！经费+15万，声望+20！`;
                    }
                    return '💸 遗憾未中标，投入的数据打了水漂（教训值借此提醒）。';
                }},
                { label: '观望', effect(eng) { return '静观其变，不冒险。'; } }
            ]
        },
        {
            id: 'budget_audit',
            title: '💰 年度预算审计',
            desc: '学校审计处来核查经费使用情况，账目清晰有奖励。',
            type: 'auto',
            resolve(eng) {
                const papers = eng.publishedPapers.length;
                if (papers >= 1) {
                    const bonus = Math.min(5, Math.round(1 + papers * 0.5));
                    eng.funding += bonus;
                    return { text: `✅ 经费使用有进有出、科研产出清晰，审计通过，结余津贴 ${bonus} 万！`, type: 'good' };
                }
                return { text: '⚠️ 全年产出一片空白，审计提出质询，点名批评。', type: 'bad' };
            }
        },
        {
            id: 'funding_cut',
            title: '📉 院系经费紧缩',
            desc: '学院统筹预算缩减，各课题组经费被统一压缩。',
            type: 'auto',
            resolve(eng) {
                const cut = Math.min(eng.funding * 0.05, 12);
                eng.funding -= cut;
                return { text: `😖 经费紧缩，被压缩 ${Math.floor(cut)} 万元预算（从经费中扣除）。`, type: 'bad' };
            }
        },
        {
            id: 'breakthrough_hotspot',
            title: '🔥 领域重大热点发酵',
            desc: '无铅钙钛矿领域爆出重大实验热点，全组文献灵感迸发。',
            type: 'auto',
            resolve(eng) {
                const sd = eng.members.find(m => m.id === 'zhangshipeng') || eng.members[0];
                if (sd) {
                    eng.addAptExp(sd.id, 'insight', 6);
                    return { text: `🔥 热点发酵！${sd.name} 文献雷达捕获先机，洞察力大涨！`, type: 'good' };
                }
                return { text: '🔥 领域热点发酵，但组内暂时无人脉接住。', type: 'normal' };
            }
        }
    ],

    // ==================== 成就系统 ====================
    // 达成奖励（聚焦声望与轻度津贴，克制膨胀）
    achievements: [
        { id: 'paper_1',    icon: '📄', name: '初出茅庐', desc: '发表第1篇论文', cat: '论文', type: 'papers_count', target: 1,  rewardFunding: 0.5, rewardPrestige: 3 },
        { id: 'paper_5',    icon: '📚', name: '笔耕不辍', desc: '累计发表5篇论文', cat: '论文', type: 'papers_count', target: 5,  rewardFunding: 1.5, rewardPrestige: 5 },
        { id: 'paper_10',   icon: '🗂️', name: '著作等身', desc: '累计发表10篇论文', cat: '论文', type: 'papers_count', target: 10, rewardFunding: 3.0, rewardPrestige: 8 },

        { id: 'zone4_first',   icon: '📗', name: '稳扎稳打', desc: '首次发表在4区期刊', cat: '分区', type: 'publish_zone', target: 'zone4', rewardFunding: 0.5,  rewardPrestige: 2 },
        { id: 'zone3_first',   icon: '📘', name: '更上层楼', desc: '首次发表在3区期刊', cat: '分区', type: 'publish_zone', target: 'zone3', rewardFunding: 1.0,  rewardPrestige: 4 },
        { id: 'zone2_first',   icon: '📙', name: '出类拔萃', desc: '首次发表在2区期刊', cat: '分区', type: 'publish_zone', target: 'zone2', rewardFunding: 2.5,  rewardPrestige: 8 },
        { id: 'zone1_first',   icon: '📕', name: '顶刊得主', desc: '首次发表在1区期刊', cat: '分区', type: 'publish_zone', target: 'zone1', rewardFunding: 5.0, rewardPrestige: 15 },
        { id: 'supreme_first', icon: '👑', name: '名震学界', desc: '首次发表顶刊', cat: '分区', type: 'publish_zone', target: 'supreme', rewardFunding: 10.0, rewardPrestige: 30 },

        { id: 'apt_b_first', icon: '🔧', name: '后起之秀', desc: '培养出首个B级资质', cat: '资质', type: 'apt_grade', target: 'B', rewardFunding: 0.5,  rewardPrestige: 2 },
        { id: 'apt_a_first', icon: '🎯', name: '出类拔萃', desc: '培养出首个A级资质', cat: '资质', type: 'apt_grade', target: 'A', rewardFunding: 1.0,  rewardPrestige: 4 },
        { id: 'apt_s_first', icon: '💎', name: '人中龙凤', desc: '培养出首个S级资质', cat: '资质', type: 'apt_grade', target: 'S', rewardFunding: 3.0,  rewardPrestige: 10 },
        { id: 'apt_ss_first', icon: '⚡', name: '天赋异禀', desc: '培养出首个SS级资质', cat: '资质', type: 'apt_grade', target: 'SS', rewardFunding: 8.0, rewardPrestige: 20 },

        { id: 'grade_e', icon: '🏛️', name: '学院认可', desc: '课题组升至E级', cat: '评级', type: 'lab_grade', target: 1, rewardFunding: 0.5,  rewardPrestige: 2 },
        { id: 'grade_d', icon: '🏢', name: '校级重点', desc: '课题组升至D级', cat: '评级', type: 'lab_grade', target: 2, rewardFunding: 1.0,  rewardPrestige: 4 },
        { id: 'grade_c', icon: '💼', name: '市级重点', desc: '课题组升至C级', cat: '评级', type: 'lab_grade', target: 3, rewardFunding: 2.0,  rewardPrestige: 6 },
        { id: 'grade_b', icon: '🏬', name: '省级重点', desc: '课题组升至B级', cat: '评级', type: 'lab_grade', target: 4, rewardFunding: 3.5,  rewardPrestige: 8 },
        { id: 'grade_a', icon: '🚀', name: '前沿实验室', desc: '课题组升至A级', cat: '评级', type: 'lab_grade', target: 5, rewardFunding: 6.0, rewardPrestige: 12 },
        { id: 'grade_s', icon: '🏆', name: '国家级工程中心', desc: '课题组升至S级', cat: '评级', type: 'lab_grade', target: 6, rewardFunding: 10.0, rewardPrestige: 18 },
        { id: 'grade_ss', icon: '🏅', name: '国际顶尖', desc: '课题组升至SS级', cat: '评级', type: 'lab_grade', target: 7, rewardFunding: 15.0, rewardPrestige: 25 },
        { id: 'grade_ex', icon: '🌍', name: '世界之巅', desc: '课题组升至EX级', cat: '评级', type: 'lab_grade', target: 8, rewardFunding: 30.0, rewardPrestige: 50 },

        { id: 'equip_1',   icon: '🔬', name: '第一台设备', desc: '购置第1台设备', cat: '设备', type: 'station_count', target: 1, rewardFunding: 0.5, rewardPrestige: 1 },
        { id: 'equip_3',   icon: '🧪', name: '实验室小栈', desc: '拥有3台设备', cat: '设备', type: 'station_count', target: 3, rewardFunding: 1.0, rewardPrestige: 3 },
        { id: 'equip_5',   icon: '⚙️', name: '装备齐全', desc: '拥有5台设备', cat: '设备', type: 'station_count', target: 5, rewardFunding: 2.5, rewardPrestige: 6 },
        { id: 'equip_max', icon: '⬆️', name: '神机妙算', desc: '首台设备升到满级', cat: '设备', type: 'equip_max_level', target: 1, rewardFunding: 3.0, rewardPrestige: 5 },

        { id: 'member_3', icon: '👥', name: '三人成众', desc: '团队成员达到3人', cat: '人事', type: 'member_count', target: 3, rewardFunding: 1.0, rewardPrestige: 3 },
        { id: 'member_8', icon: '🎓', name: '门庭若市', desc: '团队成员达到8人', cat: '人事', type: 'member_count', target: 8, rewardFunding: 4.0, rewardPrestige: 8 },

        // 点击与连击专属成就
        { id: 'combo_25', icon: '⚡', name: '通宵攻坚', desc: '手动点击达到 25 连击', cat: '点击', type: 'max_combo', target: 25, rewardFunding: 0.5, rewardPrestige: 2 },
        { id: 'combo_50', icon: '👑', name: '灵感狂飙', desc: '手动点击达到 50 连击 MAX', cat: '点击', type: 'max_combo', target: 50, rewardFunding: 1.5, rewardPrestige: 5 },
        { id: 'manual_clicks_100', icon: '👆', name: '勤勉导师', desc: '累计手动指导实验 100 次', cat: '点击', type: 'manual_clicks', target: 100, rewardFunding: 1.0, rewardPrestige: 3 },
        { id: 'auto_cps_10', icon: '🤖', name: '自动实验流水线', desc: '全组自动点击达到 10 次/秒', cat: '点击', type: 'auto_cps', target: 10, rewardFunding: 2.0, rewardPrestige: 5 }
    ],

    // ==================== 点击与自动点击配置 ====================
    clickConfig: {
        baseManualPower: 1.0, // 导师单次手动点击基础威力 (1.0份/击，配合长按数字清晰暴涨)
        baseManualPaperSpeed: 0.8, // 导师单次点击推进论文进度 (%)
        baseCritChance: 0.06,  // 基础暴击率 6%
        tierBaseCPS: {
            Normal: 1.0,
            'R+': 2.0,
            SR: 3.0,
            SSR: 5.0,
            SSSSSR: 10.0
        },
        tierBasePower: {
            Normal: 1.50,
            'R+': 3.50,
            SR: 6.00,
            SSR: 10.00,
            SSSSSR: 25.00
        },
        comboDecayTime: 2.0, // 停止点击 2 秒后连击开始衰减
        comboStages: [
            { threshold: 50, mult: 3.0, critBonus: 0.30, name: '👑 灵感爆发 MAX', color: '#ffd700', badgeClass: 'combo-max' },
            { threshold: 25, mult: 2.0, critBonus: 0.15, name: '⚡ 通宵攻坚', color: '#00e5ff', badgeClass: 'combo-high' },
            { threshold: 10, mult: 1.5, critBonus: 0.05, name: '🔥 专注科研', color: '#ff7043', badgeClass: 'combo-mid' },
            { threshold: 0,  mult: 1.0, critBonus: 0.00, name: '常规科研', color: '#94a3b8', badgeClass: 'combo-normal' }
        ],
        mentorUpgrades: [
            { level: 1, name: '基础实验示教', desc: '手把手教移液与称量规范', cost: 0, baseSuccess: 1.00, failLuck: 0.00, powerMult: 1.0, critBonus: 0.00, paperBoostMult: 1.0, expChance: 0.15 },
            { level: 2, name: '规范化实验 SOP', desc: '点击威力+50%，暴击率+2%', cost: 3, baseSuccess: 0.85, failLuck: 0.15, powerMult: 1.5, critBonus: 0.02, paperBoostMult: 1.2, expChance: 0.22 },
            { level: 3, name: '组会头脑风暴', desc: '点击威力+120%，论文推进+50%，传授经验翻倍', cost: 10, baseSuccess: 0.70, failLuck: 0.20, powerMult: 2.2, critBonus: 0.04, paperBoostMult: 1.5, expChance: 0.32 },
            { level: 4, name: '精准科研直觉', desc: '点击威力+220%，暴击率+6%，传授高额经验', cost: 30, baseSuccess: 0.55, failLuck: 0.20, powerMult: 3.2, critBonus: 0.06, paperBoostMult: 1.8, expChance: 0.45 },
            { level: 5, name: '前沿方法学创制', desc: '点击威力+400%，论文推进翻倍，暴击率+10%', cost: 80, baseSuccess: 0.40, failLuck: 0.25, powerMult: 5.0, critBonus: 0.10, paperBoostMult: 2.2, expChance: 0.60 },
            { level: 6, name: '顶级学术道场', desc: '点击威力+700%，暴击率+15%，极速推进 DDL', cost: 200, baseSuccess: 0.28, failLuck: 0.25, powerMult: 8.0, critBonus: 0.15, paperBoostMult: 3.0, expChance: 0.75 },
            { level: 7, name: '宗师级科研化境', desc: '点击威力+1200%，暴击率+20%，手把手教学必定顿悟', cost: 500, baseSuccess: 0.15, failLuck: 0.30, powerMult: 13.0, critBonus: 0.20, paperBoostMult: 4.0, expChance: 0.95 },
        ]
    },

    // ==================== 研究生月度劳务补助与津贴标准 (万元/月) ====================
    stipendConfig: {
        Normal: 0.05,  // 500元/月 (普通硕士生基础劳务补助)
        'R+': 0.10,    // 1000元/月 (潜力新秀/高年级硕士)
        SR: 0.20,      // 2000元/月 (骨干博士生)
        SSR: 0.40,     // 4000元/月 (天骄博士生)
        SSSSSR: 0.80   // 8000元/月 (创世大当家)
    },

    // ==================== 口令码礼包 ====================
    secretCodes: {
        'WANGMENG666': { name: '创世大当家专项基金', funding: 1000, coffee: 99, desc: '经费 1000 万 + 99 份咖啡豆！' },
        'XOPTO888': { name: '高纯试剂原料包', films: 30, spectra: 30, uvData: 30, desc: '薄膜、光谱与紫外数据各 30 份！' },
        'NATURE2026': { name: 'Reviewer #2 绝杀令', instantAccept: true, desc: '下篇论文直接免审 100% 录用！' },
        'VASP666': { name: '双路超算满载加速', compute: 50, desc: '获得 50 份理论算力数据！' }
    }
};
