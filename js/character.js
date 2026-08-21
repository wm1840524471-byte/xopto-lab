/**
 * 《论如何建立一个课题组》 - 角色与资质管理器
 * 核心：4项资质(D→SS) + 突破升级 + 师承带教 + 人际关系
 */
class CharacterManager {

    // 确保成员的数据结构支持阶梯式 rank、exp 与 luck
    ensureMemberApt(member) {
        if (!member) return;
        if (!member.aptRanks) member.aptRanks = {};
        if (!member.aptExp) member.aptExp = {};
        if (!member.aptLuck) member.aptLuck = {};

        const keys = Object.keys(GAME_DATA.aptitudes || { lab: 1, theory: 1, analysis: 1, insight: 1 });
        for (let key of keys) {
            if (!member.aptRanks[key]) {
                const oldVal = (member.apt && member.apt[key]) || 0;
                if (oldVal >= 90) member.aptRanks[key] = 'SS';
                else if (oldVal >= 75) member.aptRanks[key] = 'S';
                else if (oldVal >= 55) member.aptRanks[key] = 'A';
                else if (oldVal >= 35) member.aptRanks[key] = 'B';
                else if (oldVal >= 15) member.aptRanks[key] = 'C';
                else member.aptRanks[key] = 'D';
            }
            if (member.aptExp[key] === undefined) member.aptExp[key] = 0;
            if (member.aptLuck[key] === undefined) member.aptLuck[key] = 0;
        }
    }

    // 从经验值获取资质等级 (兼容旧调用)
    getAptGradeFromExp(exp) {
        if (exp >= 100) return 'SS';
        if (exp >= 80)  return 'S';
        if (exp >= 60)  return 'A';
        if (exp >= 40)  return 'B';
        if (exp >= 20)  return 'C';
        return 'D';
    }

    // 获取等级乘数
    getAptMult(grade) {
        return (GAME_DATA.aptMult && GAME_DATA.aptMult[grade]) || 1.0;
    }

    // 获取成员某项资质的等级 (D/C/B/A/S/SS)
    getMemberAptGrade(member, aptKey) {
        if (!member) return 'D';
        this.ensureMemberApt(member);
        return member.aptRanks[aptKey] || 'D';
    }

    // 获取成员某项资质的乘数
    getMemberAptMult(member, aptKey) {
        return this.getAptMult(this.getMemberAptGrade(member, aptKey));
    }

    // 获取成员某项资质的详细晋升状态信息 (包含当前阶、熟练度、下一阶、成功率、保底幸运值)
    getMemberAptDetail(member, aptKey) {
        if (!member) return null;
        this.ensureMemberApt(member);
        const rank = member.aptRanks[aptKey] || 'D';
        const exp = Math.floor(member.aptExp[aptKey] || 0);
        const luck = member.aptLuck[aptKey] || 0;

        const config = (GAME_DATA.aptRanksConfig && GAME_DATA.aptRanksConfig.rankDetails[rank]) || {
            next: null, maxExp: 999, baseSuccess: 0, trainCost: 0, trainExp: 0, failLuck: 0, name: '宗师化境', color: '#ef4444'
        };

        const maxExp = config.maxExp;
        const canBreak = (config.next !== null && exp >= maxExp);

        // 导师指导等级额外提供学术道场加成
        const mentorLvl = (window.gameEngine && window.gameEngine.mentorLevel) || 1;
        const mentorBonus = (mentorLvl - 1) * 0.03; // 每级+3%

        const totalChance = Math.min(1.0, config.baseSuccess + luck + mentorBonus);

        return {
            rank,
            exp,
            maxExp,
            luck,
            mentorBonus,
            canBreak,
            nextRank: config.next,
            baseSuccess: config.baseSuccess,
            totalChance,
            trainCost: config.trainCost,
            trainExp: config.trainExp,
            failLuck: config.failLuck,
            rankName: config.name,
            color: config.color,
            isMax: (config.next === null)
        };
    }

    // 检查是否可以突破升级
    canBreakthrough(member, aptKey) {
        const detail = this.getMemberAptDetail(member, aptKey);
        return detail ? detail.canBreak : false;
    }

    // 候选人专长原型池
    getCandidateArchetypes() {
        return [
            {
                archetype: 'lab_master',
                title: '实验动手型',
                icon: '🧤',
                aptBias: { lab: [30, 52], theory: [10, 24], analysis: [12, 28], insight: [10, 24] },
                traits: [
                    { id: 'spin_hand', name: '《旋涂快手》', desc: '实验产出效率 +25%' },
                    { id: 'reagent_master', name: '《试剂配制大师》', desc: '薄膜与材料合成良率显著提高' }
                ],
                statements: [
                    '“本科进过光电实验室，旋涂和手套箱操作行云流水！”',
                    '“喜欢泡在实验室做实验，手感极佳！”',
                    '“对晶体生长和退火结晶有敏锐的观察力。”'
                ]
            },
            {
                archetype: 'theory_guru',
                title: '理论计算型',
                icon: '💻',
                aptBias: { lab: [10, 24], theory: [30, 52], analysis: [15, 30], insight: [12, 28] },
                traits: [
                    { id: 'dft_fan', name: '《DFT 脚本大师》', desc: '算力产出与理论分推进 +25%' },
                    { id: 'linux_hacker', name: '《Linux 极客》', desc: '超算作业排队与脚本自动化极熟练' }
                ],
                statements: [
                    '“熟练掌握 VASP / Gaussian 建模，会写 Python 批处理！”',
                    '“喜欢钻研能带结构与跃迁机理，理论逻辑严密。”',
                    '“算力就是战斗力，愿为课题组写自动化排障脚本！”'
                ]
            },
            {
                archetype: 'analysis_expert',
                title: '数据分析型',
                icon: '📊',
                aptBias: { lab: [12, 28], theory: [12, 28], analysis: [30, 52], insight: [15, 30] },
                traits: [
                    { id: 'origin_pro', name: '《Origin 美化大师》', desc: '论文图表质量高，论文综合度 +10' },
                    { id: 'spectra_fitting', name: '《光谱动力学拟合》', desc: 'TRPL 与荧光寿命分析快准狠' }
                ],
                statements: [
                    '“精通 Origin 和 Python 数据可视化，图表达到顶刊标准！”',
                    '“擅长从变温光谱与寿命衰减中深挖物理机制与陷阱态。”',
                    '“对数据异常极度敏锐，能在海量数据中揪出核心发光峰。”'
                ]
            },
            {
                archetype: 'insight_scholar',
                title: '文献洞察型',
                icon: '📖',
                aptBias: { lab: [12, 28], theory: [15, 30], analysis: [12, 28], insight: [30, 52] },
                traits: [
                    { id: 'paper_scanner', name: '《文献速读机》', desc: '论文构思推进速度 +30%' },
                    { id: 'trend_radar', name: '《前沿嗅觉》', desc: '容易捕捉到最新国际学术热点' }
                ],
                statements: [
                    '“每天精读 Nature/JACS/Adv. Mater. 最新成果，文献检索极快！”',
                    '“擅长撰写综述与立项构思，紧跟非铅发光与探测前沿。”',
                    '“组会汇报逻辑严谨，文献引用滴水不漏。”'
                ]
            },
            {
                archetype: 'all_rounder',
                title: '全能学霸型',
                icon: '🌟',
                aptBias: { lab: [24, 42], theory: [24, 42], analysis: [24, 42], insight: [24, 42] },
                traits: [
                    { id: 'all_nighter', name: '《通宵战神》', desc: '全资质均衡，各项科研产出 +15%' },
                    { id: 'top_student', name: '《绩点第一名》', desc: '基础扎实，所有资质经验获取 +20%' }
                ],
                statements: [
                    '“专业第一保研，精力极度充沛，服从导师所有科研安排！”',
                    '“实验、理论、作图、写文章全能，渴望冲刺高分区 SCI！”',
                    '“自备浓缩黑咖啡，愿意陪课题组通宵攻坚赶 DDL！”'
                ]
            }
        ];
    }

    // 生成候选人简历列表 (1~3人，能力各异)
    generateCandidates(names, isSummerCamp = false) {
        const archetypes = this.getCandidateArchetypes();
        const avatars = ['🧑‍🔬', '👩‍🔬', '🧑‍🎓', '👩‍🎓', '🤓', '👩‍💻', '👨‍💻'];
        const candidates = [];

        // 洗牌专长原型，确保同批候选人专长尽量不重复
        const shuffledArch = [...archetypes].sort(() => Math.random() - 0.5);

        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const id = 'cand_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            const arch = shuffledArch[i % shuffledArch.length];
            const avatar = avatars[Math.floor(Math.random() * avatars.length)];
            
            const boost = isSummerCamp ? 12 : 0;
            const apt = {};
            for (let [k, range] of Object.entries(arch.aptBias)) {
                const min = range[0] + boost;
                const max = range[1] + boost;
                apt[k] = Math.floor(min + Math.random() * (max - min));
            }

            const trait = arch.traits[Math.floor(Math.random() * arch.traits.length)];
            const statement = arch.statements[Math.floor(Math.random() * arch.statements.length)];
            
            let tier = 'Normal';
            if (isSummerCamp) {
                tier = Math.random() < 0.45 ? 'SR' : 'R+';
            } else {
                tier = Math.random() < 0.25 ? 'R+' : 'Normal';
            }

            candidates.push({
                id,
                name,
                grade: '硕士一年级',
                gradeYear: 1,
                avatar,
                tier,
                archetypeTitle: arch.title,
                archetypeIcon: arch.icon,
                statement,
                apt,
                traits: [trait],
                desc: `${arch.title}硕士生。${statement}`
            });
        }
        return candidates;
    }

    // 从简历实例化正式成员
    createMemberFromCandidate(candidate) {
        const id = 'roster_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        return {
            id: id,
            name: candidate.name,
            grade: candidate.grade || '硕士一年级',
            gradeYear: candidate.gradeYear || 1,
            avatar: candidate.avatar || '🧑‍🔬',
            tier: candidate.tier || 'Normal',
            archetypeTitle: candidate.archetypeTitle,
            apt: { ...(candidate.apt || { lab: 20, theory: 20, analysis: 20, insight: 20 }) },
            traits: candidate.traits || [{ id: 'eager_newbie', name: '《求知若渴》', desc: '积极参与课题组日常科研与测试' }],
            desc: candidate.desc || '新加入 X-Opto 课题组的同门，正在勤奋开展科研实验。',
            assignedStationId: null,
            mentorId: null,
            coAuthorId: null,
            rivalId: null,
            mealBuddyId: null,
            isGraduated: false,
            moodBonus: 0,
            breakthroughReady: []
        };
    }

    // 创建普通同门
    createRosterMember(name) {
        const cands = this.generateCandidates([name]);
        return this.createMemberFromCandidate(cands[0]);
    }

    // 创建天骄
    createLegendaryMember(preset) {
        return {
            id: preset.id,
            name: preset.name,
            grade: preset.grade,
            gradeYear: preset.gradeYear,
            avatar: preset.avatar,
            tier: preset.tier,
            apt: { ...(preset.apt || { lab: 30, theory: 30, analysis: 30, insight: 30 }) },
            traits: preset.traits,
            desc: preset.desc,
            assignedStationId: null,
            mentorId: null,
            coAuthorId: null,
            rivalId: null,
            mealBuddyId: null,
            isGraduated: false,
            moodBonus: 0,
            breakthroughReady: []
        };
    }

    // 创建初始成员
    createStarter() {
        const s = { ...GAME_DATA.starterMember };
        s.apt = { ...(GAME_DATA.starterMember.apt || { lab: 0, theory: 0, analysis: 0, insight: 0 }) };
        s.assignedStationId = null;
        s.mentorId = null;
        s.coAuthorId = null;
        s.rivalId = null;
        s.mealBuddyId = null;
        s.isGraduated = false;
        s.moodBonus = 0;
        s.breakthroughReady = [];
        return s;
    }

    // 尝试突破升级某项资质
    tryBreakthrough(member, aptKey) {
        if (!this.canBreakthrough(member, aptKey)) {
            return { success: false, error: '资质经验不足，无法突破！' };
        }
        const oldGrade = this.getMemberAptGrade(member, aptKey);
        member.apt[aptKey] = 100; // 锁定在 SS
        // 已到 SS 顶级，不再升
        if (oldGrade === 'SS') {
            return { success: false, error: '已达 SS 顶级，无法继续突破！' };
        }
        return { success: true, oldGrade, newGrade: 'SS', aptKey };
    }

    // 获取成员学术定位与岗位契合度推荐
    getMemberArchetype(member) {
        const apt = member.apt || { lab: 0, theory: 0, analysis: 0, insight: 0 };
        const lab = apt.lab || 0;
        const theory = apt.theory || 0;
        const analysis = apt.analysis || 0;
        const insight = apt.insight || 0;

        if (lab >= 80 && theory >= 80 && analysis >= 80 && insight >= 80) {
            return { title: '👑 全能神仙', icon: '👑', color: '#ef4444', recEq: '全能适配（任一台柱设备均可触发超频）', desc: '文理兼修，实验制备与机理建模俱臻化境！' };
        }

        const maxVal = Math.max(lab, theory, analysis, insight);
        if (maxVal === lab) {
            return { title: '🧪 实验神仙手', icon: '🧤', color: '#4ade80', recEq: '化学通风橱、手套箱旋涂仪、热蒸镀', desc: '动手制备极稳，材料合成与薄膜良率超群！' };
        } else if (maxVal === theory) {
            return { title: '💻 理论先锋', icon: '🧮', color: '#38bdf8', recEq: '双路 Xeon 超算', desc: '第一性原理与能带计算大师，论文理论分柱石！' };
        } else if (maxVal === analysis) {
            return { title: '📊 谱图分析手', icon: '📐', color: '#f59e0b', recEq: 'XRD 衍射仪、UV-Vis 吸收光谱仪', desc: '晶相结构与吸收带隙拟合精准无误！' };
        } else {
            return { title: '💡 顶刊智囊', icon: '📖', color: '#ec4899', recEq: 'QE Pro 变温荧光仪、紫外测试台、成像台', desc: '前沿动力学与机理洞察深刻，善克审稿人！' };
        }
    }

    // 研讨会与突破特质领悟池
    getRandomAwakeningTrait(member) {
        const existing = new Set((member.traits || []).map(t => t.id));
        const pool = [
            { id: 'spin_hand', name: '《旋涂微操快手》', desc: '手套箱旋涂与通风橱产出效率 +30%' },
            { id: 'dft_fan', name: '《DFT 建模推导直觉》', desc: '超算机理产出 +35%，论文理论分显著提升' },
            { id: 'peak_deconv', name: '《光谱分峰拟合专家》', desc: 'XRD与光谱分析产出 +35%' },
            { id: 'referee_shield', name: '《审稿人第六感》', desc: '作为论文一作时，盲审阶段加速 +50%' },
            { id: 'reagent_master', name: '《试剂纯化大师》', desc: '前驱体与薄膜良率提高，耗材消耗降低' },
            { id: 'coffee_affinity', name: '《咖啡通宵战神》', desc: '咖啡提神状态下个人自动点击速度翻倍' },
            { id: 'meticulous_sop', name: '《精密 SOP 规范》', desc: '执勤设备故障率归零，连续运转加成提升' }
        ].filter(t => !existing.has(t.id));

        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // 获取资质等级对应的显示颜色
    getAptGradeColor(grade) {
        const colors = {
            'D': '#94a3b8', 'C': '#60a5fa', 'B': '#34d399',
            'A': '#fbbf24', 'S': '#f97316', 'SS': '#ef4444'
        };
        return colors[grade] || '#94a3b8';
    }
}

window.characterManager = new CharacterManager();
