/**
 * 《论如何建立一个课题组 · X-Opto Lab》 - 核心数值闭环引擎
 * 产出公式 / 设备差异化 / 设备升级 / 论文配方+概率 / 资质成长 / 滚雪球
 */
class GameEngine {
    constructor() {
        this.saveKey = 'xopto_engine_v3';
        this.hasStarted = true;
        this.labName = 'X-Opto 课题组';
        this.labStage = 1;
        this.currentQuestIndex = 0;

        this.funding = 0.2; // 初始启动津贴 0.2 万元 (2000元)
        this.prestige = 0;

        this.members = [];
        this.rosterAvailable = [...GAME_DATA.labRosterPool];
        this.activeCandidates = []; // 当前待面试候选人简历
        this.unlockedLegendary = [];
        this.allUnlocked = false; // 全前置解锁令标志
        this.stationInstances = []; // 初始无设备，纯手动白手起家

        this.inventory = { precursors: 0, films: 0, xrdData: 0, absData: 0, uvData: 0, spectra: 0, compute: 0, devices: 0, imaging: 0, coffee: 0 };

        this.currentPaperProject = null;
        this.publishedPapers = [];

        this.time = { year: 1, month: 9, day: 1, speed: 1 };
        this.timeAccumulator = 0;

        // 点击与连击系统
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.manualClicks = 0;
        this.autoClicks = 0;
        this.mentorLevel = 1; // 导师科研指导等级 (Lv.1 ~ Lv.7)
        this.activeClickTarget = 'precursors'; // 初始默认为手动移液配制前驱体溶液

        this.buffs = { coffee: 0, teamBuilding: 0 };
        this.lessonPoints = 0;
        this.reviewBonus = 0;
        this.instantAcceptReady = false;
        this.achievements = [];

        this.lastMonthStats = { produced: {}, funding: 0, papers: 0, aptGains: 0 };
        this._resetMonthStats();
    }

    _resetMonthStats() {
        this.lastMonthStats = { produced: {}, funding: 0, papers: 0, aptGains: 0 };
    }

    // ==================== 工具方法 ====================
    getDateStr() {
        const d = this.time.day || 1;
        return `第${d}日`;
    }

    // 绝对时间戳（用于跨月比较）
    _absDay() { return this.time.year * 1000 + this.time.month * 100 + (this.time.day || 1); }

    // 兼容旧引用
    getTenDayStr() { return this.getDateStr(); }

    getLabGrade() {
        let g = 0;
        for (let i = 0; i < GAME_DATA.labGrades.length; i++) {
            if (this.prestige >= GAME_DATA.labGrades[i].prestigeReq) g = i;
        }
        return g;
    }

    getLabGradeObj() { return GAME_DATA.labGrades[this.getLabGrade()]; }

    getMemberCap() { return this.getLabGradeObj().memberCap; }

    getLabStageName() { return this.getLabGradeObj().desc; }

    // 设备对应资质
    getAptKeyForEquipment(eqId) {
        if (eqId === 'xeon_server' || eqId === 'hpc_gpu_cluster') return 'theory';
        if (eqId === 'xrd_diffractometer' || eqId === 'uv_vis_spec' || eqId === 'tem_cs_corrected') return 'analysis';
        if (eqId === 'qe_pro_spec' || eqId === 'xray_imaging_station' || eqId === 'uv_station' || eqId === 'femtosecond_laser' || eqId === 'synchrotron_beamline') return 'insight';
        return 'lab';
    }

    // 人岗匹配与专精共振加成计算体系
    getStationFitInfo(member, eqId) {
        if (!member) {
            return {
                grade: 'None',
                baseAptMult: 0,
                resonanceBonus: 0,
                totalFitMult: 0,
                traitMult: 1.0,
                fitLevel: 'none',
                fitTag: '⚪ 工位空置',
                badgeClass: 'fit-none',
                fitDesc: '未指派操作员，设备处于停运待机状态',
                hasTraitSynergy: false
            };
        }

        const aptKey = this.getAptKeyForEquipment(eqId);
        const aptInfo = GAME_DATA.aptitudes[aptKey] || { name: '实验动手力', icon: '🔧' };
        const grade = window.characterManager.getMemberAptGrade(member, aptKey);
        const baseAptMult = window.characterManager.getAptMult(grade);
        const traitMult = this.getTraitMult(member, eqId);

        // 人岗契合度加成体系：
        // 专精契合（S / SS 级）触发专精共振超频！
        // 错配/生疏（D 级 或 非擅长领域）略有惩罚
        let resonanceBonus = 1.0;
        let fitLevel = 'normal';
        let fitTag = '';
        let badgeClass = 'fit-normal';
        let fitDesc = '';

        if (grade === 'SS') {
            resonanceBonus = 1.50; // SS级专精共振额外 +50%
            fitLevel = 'grandmaster';
            fitTag = '👑 宗师共振';
            badgeClass = 'fit-grandmaster';
            fitDesc = `【${aptInfo.name}】已臻化境！人岗完美契合，触发超频共振！`;
        } else if (grade === 'S') {
            resonanceBonus = 1.25; // S级专精额外 +25%
            fitLevel = 'master';
            fitTag = '🌟 卓越专精';
            badgeClass = 'fit-master';
            fitDesc = `【${aptInfo.name}】造诣深厚，操作行云流水，效能显著！`;
        } else if (grade === 'A') {
            resonanceBonus = 1.10; // A级良好 +10%
            fitLevel = 'skilled';
            fitTag = '🟢 熟练骨干';
            badgeClass = 'fit-skilled';
            fitDesc = `【${aptInfo.name}】熟练自如，能够充分发挥设备设计性能。`;
        } else if (grade === 'B') {
            resonanceBonus = 1.0;
            fitLevel = 'competent';
            fitTag = '🟡 稳妥胜任';
            badgeClass = 'fit-competent';
            fitDesc = `【${aptInfo.name}】合格在勤，设备稳定运转。`;
        } else if (grade === 'C') {
            resonanceBonus = 0.95;
            fitLevel = 'rookie';
            fitTag = '⚪ 进修新手';
            badgeClass = 'fit-rookie';
            fitDesc = `【${aptInfo.name}】略显生疏，需要导师指导或同门带教。`;
        } else { // D 级
            resonanceBonus = 0.85;
            fitLevel = 'mismatch';
            fitTag = '⚠️ 人岗生疏/需带教';
            badgeClass = 'fit-mismatch';
            fitDesc = `【${aptInfo.name}】尚处入门，操作精密仪器效率受限，建议换人或导师带教！`;
        }

        const totalFitMult = baseAptMult * resonanceBonus;

        return {
            aptKey,
            aptName: aptInfo.name,
            aptIcon: aptInfo.icon,
            grade,
            baseAptMult,
            resonanceBonus,
            totalFitMult,
            traitMult,
            fitLevel,
            fitTag,
            badgeClass,
            fitDesc,
            hasTraitSynergy: traitMult > 1.0
        };
    }

    // 特质倍率
    getTraitMult(member, eqId) {
        let mult = 1.0;
        if (!member.traits) return mult;
        for (let t of member.traits) {
            if (t.id === 'spin_master' && (eqId === 'glovebox_spin' || eqId === 'fume_hood')) mult *= 1.5;
            if (t.id === 'uv_detector' && eqId === 'uv_station') mult *= 2.0;
            if (t.id === 'server_boss' && eqId === 'xeon_server') mult *= 2.0;
            if (t.id === 'coffee_warrior' && eqId === 'coffee_machine') mult *= 2.0;
            if (t.id === 'dft_queen' && (eqId === 'qe_pro_spec' || eqId === 'xeon_server')) mult *= 1.8;
            if (t.id === 'gaussian_pro' && (eqId === 'xrd_diffractometer' || eqId === 'xray_imaging_station')) mult *= 1.8;
            if (t.id === 'device_master' && (eqId === 'thermal_evap' || eqId === 'glovebox_spin')) mult *= 2.0;
        }
        return mult;
    }

    // 声望全局加成
    getPrestigeMult() { return 1 + Math.floor(this.prestige / 50) * 0.05; }

    // 王猛全局加成
    hasWangMeng() { return this.members.some(m => m.id === 'wangmeng'); }

    // ==================== 初始化 ====================
    init() {
        if (!this.loadGame()) this.setupInitialLab();
    }

    setupInitialLab() {
        const starter = window.characterManager.createStarter();
        this.members = [starter];
        this.stationInstances = []; // 初始零设备，空空如也！
        this.activeClickTarget = 'precursors'; // 默认配前驱体溶液
        this.funding = 0.2; // 启动经费 0.2 万元 (2000元)
        this.prestige = 0;
        this.currentQuestIndex = 0;
        this.inventory = { precursors: 0, films: 0, xrdData: 0, absData: 0, uvData: 0, spectra: 0, compute: 0, devices: 0, imaging: 0, coffee: 0 };
        this.saveGame();
        window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
            `🎉 【${this.labName}】初创成立！实验室一穷二白、尚无任何设备，导师带领 <b>${starter.name}</b> 从手动配制前驱体溶液、回收卖钱筹措第一桶金起步！`, 'accept');
    }

    // 资源显露判定（未解锁的资源不会出现在顶部资源面板与点击靶向中）
    isResourceUnlocked(key) {
        if (key === 'precursors') return true; // 前驱体溶液永续开放
        if ((this.inventory[key] || 0) > 0) return true; // 已有库存可见
        const eq = GAME_DATA.equipmentList.find(e => e.productKey === key);
        if (eq && this.stationInstances.some(s => s.eqId === eq.id)) return true; // 拥有对应设备
        return false;
    }

    // 商城设备渐进显露判定（达到一定经费或前置产业链拥有后方可看到与购买）
    isEquipmentVisibleInShop(eq) {
        if (this.allUnlocked) return true;

        // 1. 通风橱与咖啡机：基础设备始终在商城可见
        if (eq.id === 'fume_hood' || eq.id === 'coffee_machine') return true;

        // 2. 如果实验室已经拥有该设备，始终可见
        if (this.stationInstances.some(s => s.eqId === eq.id)) return true;

        // 3. 经费显露门槛：当前经费达到该设备售价的 35% 即可在商城探知
        if (this.funding >= eq.price * 0.35) return true;

        // 4. 前置产业链拥有或阶段判定
        if (eq.id === 'glovebox_spin' && (this.funding >= 2.0 || this.stationInstances.some(s => s.eqId === 'fume_hood'))) return true;
        if (eq.id === 'xrd_diffractometer' && (this.funding >= 5.0 || this.stationInstances.some(s => s.eqId === 'glovebox_spin'))) return true;
        if (eq.id === 'uv_vis_spec' && (this.funding >= 10.0 || this.stationInstances.some(s => s.eqId === 'xrd_diffractometer'))) return true;
        if (eq.id === 'uv_station' && (this.funding >= 15.0 || this.stationInstances.some(s => s.eqId === 'uv_vis_spec'))) return true;
        if (eq.id === 'qe_pro_spec' && (this.funding >= 25.0 || this.stationInstances.some(s => s.eqId === 'uv_station'))) return true;
        if (eq.id === 'xeon_server' && (this.funding >= 40.0 || this.publishedPapers.length >= 2)) return true;
        if (eq.id === 'thermal_evap' && (this.funding >= 60.0 || this.stationInstances.some(s => s.eqId === 'qe_pro_spec'))) return true;
        if (eq.id === 'xray_imaging_station' && (this.funding >= 100.0 || this.publishedPapers.length >= 3)) return true;
        if (eq.id === 'cleanroom_iso5' && (this.funding >= 180.0 || this.getLabGrade() >= 4)) return true;
        if (eq.id === 'femtosecond_laser' && (this.funding >= 300.0 || this.getLabGrade() >= 5)) return true;
        if (eq.id === 'hpc_gpu_cluster' && (this.funding >= 500.0 || this.getLabGrade() >= 5)) return true;
        if (eq.id === 'tem_cs_corrected' && (this.funding >= 800.0 || this.getLabGrade() >= 6)) return true;
        if (eq.id === 'synchrotron_beamline' && (this.funding >= 1500.0 || this.getLabGrade() >= 7)) return true;

        return false;
    }

    _createStationInstance(eqId) {
        const count = this.stationInstances.filter(s => s.eqId === eqId).length;
        return {
            instanceId: `${eqId}_${count}`,
            eqId, operatorId: null, level: 1,
            switchMode: eqId === 'uv_station' ? 'uvData' : null,
            tradeoffMode: eqId === 'qe_pro_spec' ? 'high' : null,
            batchCountdown: 0, rampupStreak: 0, brokenUntilDay: 0
        };
    }

    // ==================== 倍速解锁与查询 ====================
    getSpeedUnlockInfo() {
        if (this.allUnlocked) {
            return [
                { speed: 1, label: '1x 正常', desc: '默认开放 (2.5s/天)', unlocked: true },
                { speed: 2, label: '2x 专注', desc: '全前置解锁令开放 (1.25s/天)', unlocked: true },
                { speed: 4, label: '4x 通宵', desc: '全前置解锁令开放 (0.625s/天)', unlocked: true },
                { speed: 8, label: '8x 极速', desc: '全前置解锁令开放 (0.31s/天)', unlocked: true }
            ];
        }
        return [
            { speed: 1, label: '1x 正常', desc: '默认开放 (2.5s/天)', unlocked: true },
            { speed: 2, label: '2x 专注', desc: '发表首篇论文或评级达E级解锁 (1.25s/天)', 
              unlocked: this.publishedPapers.length >= 1 || this.getLabGrade() >= 1 },
            { speed: 4, label: '4x 通宵', desc: '配备超算/光谱仪或评级达C级解锁 (0.625s/天)', 
              unlocked: this.stationInstances.some(s => s.eqId === 'xeon_server' || s.eqId === 'qe_pro_spec') || this.getLabGrade() >= 3 },
            { speed: 8, label: '8x 极速', desc: '发表1区/顶刊或迎回创世汪猛解锁 (0.31s/天)', 
              unlocked: this.hasWangMeng() || this.publishedPapers.some(p => ['zone1', 'supreme'].includes(p.zoneKey)) || this.getLabGrade() >= 5 }
        ];
    }

    getNextUnlockedSpeed() {
        const info = this.getSpeedUnlockInfo();
        const unlockedList = info.filter(s => s.unlocked).map(s => s.speed);
        const current = this.time.speed || 1;
        const idx = unlockedList.indexOf(current);
        if (idx === -1) return 1;
        return unlockedList[(idx + 1) % unlockedList.length];
    }

    // ==================== 仿真主循环 ====================
    tick(deltaSec) {
        const secPerDay = (GAME_DATA.timeConfig && GAME_DATA.timeConfig.baseSecPerDay) || 2.5;
        const speed = this.time.speed || 1;
        const scaledSec = deltaSec * speed;
        const deltaDays = scaledSec / secPerDay;

        if (this.currentPaperProject) this._tickPaper(deltaDays);
        this._tickAutoClick(scaledSec);
        
        this.timeAccumulator += scaledSec;
        while (this.timeAccumulator >= secPerDay) {
            this.timeAccumulator -= secPerDay;
            this._advanceDay();
        }
    }

    // 按天推进：2.5秒=1天（更从容沉浸），每月30天，每天一轮产出
    _advanceDay() {
        this.time.day = (this.time.day || 1) + 1;
        const y = this.time.year, m = this.time.month, td = this.getDateStr();

        // 1. 设备产出（每天一轮）
        for (let inst of this.stationInstances) {
            this._processStation(inst, y, m, td);
        }

        // 2. buff递减
        if (this.buffs.coffee > 0) this.buffs.coffee--;
        if (this.buffs.teamBuilding > 0) this.buffs.teamBuilding--;

        // 3. 随机学术事件：每天低概率触发，等价于每旬约一次
        if (this.getLabGrade() >= 1 && this.members.length >= 2) {
            if (Math.random() < 0.02) {
                window.eventEngine.triggerRandomAcademicEvent(y, m, td, this.members, this);
            }
        }

        // 4. 跨月结算与月度劳务费发放
        if (this.time.day > 30) {
            this.time.day = 1;
            const curYear = this.time.year;
            const curMonth = this.time.month;

            // 发放同门研究生月度劳务津贴
            const payroll = this.getTotalMonthlyPayroll();
            if (this.members.length > 0 && payroll > 0) {
                if (this.funding >= payroll) {
                    this.funding -= payroll;
                    this.lastMonthStats.salaryPaid = payroll;
                    window.eventEngine.addLog(curYear, curMonth, '月末',
                        `💸 月度劳务补助结算：向全组 ${this.members.length} 名同门发放津贴共 <b>${payroll.toFixed(2)} 万元</b>（约人均 ${(payroll / this.members.length * 10000).toFixed(0)} 元）。同门干劲满满！`, 'normal');
                } else {
                    const actualPaid = Math.max(0, this.funding);
                    this.funding = 0;
                    this.lastMonthStats.salaryPaid = actualPaid;
                    window.eventEngine.addLog(curYear, curMonth, '月末',
                        `⚠️ 课题组经费不足！本月劳务补助出现缺口（应发 ${payroll.toFixed(2)} 万 / 实发 ${actualPaid.toFixed(2)} 万），请尽快发表论文或变现样品补充经费！`, 'warning');
                }
            }

            this.time.month++;
            if (this.time.month > 12) { this.time.month = 1; this.time.year++; }

            // 报告：每4个月一次（1/5/9月月初），一年3次
            if ([1, 5, 9].includes(this.time.month)) {
                this._triggerQuarterlyReport();
            }
        }

        // 5. 检查主线
        this._checkQuestProgress();
        this.checkAchievements();
        this._checkMilestoneUnlocks();
    }

    // ==================== 产出计算（纯连点流核心公式：份/秒） ====================
    _calcYield(inst) {
        const eq = GAME_DATA.equipmentList.find(e => e.id === inst.eqId);
        if (!eq || eq.type !== 'station') return { amount: 0, productKey: eq ? eq.productKey : 'precursors' };

        const op = this.members.find(m => m.id === inst.operatorId);
        if (!op) return { amount: 0, productKey: eq.productKey };

        const fitInfo = this.getStationFitInfo(op, eq.id);
        const opCPS = this.getMemberAutoCPS(op);
        const opPower = this.getMemberAutoPower(op) * (1 + (inst.level - 1) * 0.25) * fitInfo.totalFitMult;
        let amount = opCPS * opPower;

        // 专属特质倍率
        amount *= fitInfo.traitMult;

        // 师承带教
        if (op.mentorId) amount *= 1.25;

        // 差异化机制
        let productKey = eq.productKey;
        const mechResult = this._applyMechanic(inst, eq, amount);
        amount = mechResult.amount;
        productKey = mechResult.productKey || productKey;

        return { amount, productKey };
    }

    // 差异化机制实现
    _applyMechanic(inst, eq, amount) {
        let result = { amount, productKey: eq.productKey };

        switch (eq.mechanic) {
            case 'switch':
                // 紫外台：日盲→uvData，可见光→films(×0.5)
                if (inst.switchMode === 'films') {
                    result.amount = amount * 0.5;
                    result.productKey = 'films';
                }
                break;

            case 'tradeoff':
                // QE Pro：低温档×0.6但质量高，高温档×1.5
                if (inst.tradeoffMode === 'low') {
                    result.amount = amount * 0.6;
                } else {
                    result.amount = amount * 1.5;
                }
                break;

            case 'batch':
                // 蒸镀：批次制，预热攒料29天后第30天一次性大量产出
                if (inst.batchCountdown > 0) {
                    inst.batchCountdown--;
                    result.amount = 0;
                } else {
                    result.amount = amount * 30; // 一次性放出攒的30天量
                    inst.batchCountdown = 29;    // 重新预热29天
                }
                break;

            case 'rampup':
                // X射线：连续运转每天+1.5%，中断重置
                result.amount = amount * (1 + inst.rampupStreak * 0.015);
                inst.rampupStreak++;
                break;

            // steady, coffee, inject: 直接产出
        }
        return result;
    }

    _processStation(inst, y, m, td) {
        // 故障检查（按天）
        if (inst.brokenUntilDay) {
            const cur = this._absDay();
            if (cur < inst.brokenUntilDay) return;
            inst.brokenUntilDay = 0; // 到期恢复
        }

        const eq = GAME_DATA.equipmentList.find(e => e.id === inst.eqId);
        if (!eq || eq.type !== 'station' || !inst.operatorId) return;

        const op = this.members.find(m => m.id === inst.operatorId);
        if (!op) return;

        const fitInfo = this.getStationFitInfo(op, eq.id);
        const aptKey = fitInfo.aptKey || 'lab';

        // 每天在岗操作员积累资质经验（从实操中稳步精进）
        this.addAptExp(op.id, aptKey, 0.4);
        this.lastMonthStats.aptGains = (this.lastMonthStats.aptGains || 0) + 0.4;
    }

    // ==================== 资质经验积累（受阶梯上限约束） ====================
    addAptExp(memberId, aptKey, exp) {
        const m = this.members.find(x => x.id === memberId);
        if (!m) return;
        const cm = window.characterManager;
        cm.ensureMemberApt(m);
        const detail = cm.getMemberAptDetail(m, aptKey);
        if (!detail || detail.isMax) return;

        m.aptExp[aptKey] = Math.min(detail.maxExp, (m.aptExp[aptKey] || 0) + exp);
    }

    // ==================== 设备升级 ====================
    // 获取设备升级详细概率与保底
    getStationUpgradeDetail(instanceId) {
        const inst = this.stationInstances.find(s => s.instanceId === instanceId);
        if (!inst) return null;
        const eq = GAME_DATA.equipmentList.find(e => e.id === inst.eqId);
        if (!eq) return null;

        const isMax = inst.level >= eq.maxLevel;
        const cost = Math.round(eq.upgradeBaseCost * Math.pow(1.6, inst.level - 1));
        const luck = inst.upgradeLuck || 0;

        // 基础概率表: Lv.1->2: 85%, Lv.2->3: 70%, Lv.3->4: 50%, Lv.4->5: 30%
        const baseProbMap = { 1: 0.85, 2: 0.70, 3: 0.50, 4: 0.30 };
        const failLuckMap = { 1: 0.15, 2: 0.20, 3: 0.25, 4: 0.30 };

        const baseSuccess = baseProbMap[inst.level] || 0.30;
        const failLuck = failLuckMap[inst.level] || 0.25;

        // 导师指导道场加成
        const mentorBonus = ((this.mentorLevel || 1) - 1) * 0.02; // 每级导师加成+2%
        const totalChance = Math.min(1.0, baseSuccess + luck + mentorBonus);

        return {
            inst,
            eq,
            isMax,
            currentLevel: inst.level,
            nextLevel: inst.level + 1,
            cost,
            baseSuccess,
            luck,
            mentorBonus,
            totalChance,
            failLuck
        };
    }

    // ==================== 设备概率强化升级 ====================
    upgradeStation(instanceId) {
        const detail = this.getStationUpgradeDetail(instanceId);
        if (!detail) return { error: '未找到设备！' };
        if (detail.isMax) return { error: '该设备已达最高等级！' };

        if (this.funding < detail.cost) {
            return { error: `经费不足！升级需要 ${detail.cost} 万元科研经费。` };
        }

        this.funding -= detail.cost;

        const roll = Math.random();
        const success = (roll < detail.totalChance);

        if (success) {
            detail.inst.level++;
            detail.inst.upgradeLuck = 0;

            window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
                `⬆️ 调试大吉！【${detail.eq.name}】成功强化升级至 <b>Lv.${detail.inst.level}</b>！连点流速大幅提升 25%！`, 'upgrade');
            this.checkAchievements();
            this.saveGame();
            return {
                success: true,
                inst: detail.inst,
                eq: detail.eq,
                newLevel: detail.inst.level
            };
        } else {
            // 升级失败（硬件公差或光路调试偏差）
            const newLuck = Math.min(0.85, (detail.inst.upgradeLuck || 0) + detail.failLuck);
            detail.inst.upgradeLuck = newLuck;
            const nextTotalChance = Math.min(1.0, detail.baseSuccess + newLuck + detail.mentorBonus);

            const msg = `⚠️ 硬件调试未达标！【${detail.eq.name}】升级攻关未果，累积 <b>+${Math.round(detail.failLuck * 100)}% 调试幸运保底</b>！下次升级成功率攀升至 <b>${Math.round(nextTotalChance * 100)}%</b>！`;
            window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(), msg, 'warning');
            this.saveGame();
            return {
                success: false,
                inst: detail.inst,
                eq: detail.eq,
                luckAdded: detail.failLuck,
                nextChance: nextTotalChance
            };
        }
    }

    // 设备模式切换
    switchStationMode(instanceId) {
        const inst = this.stationInstances.find(s => s.instanceId === instanceId);
        if (!inst) return;
        const eq = GAME_DATA.equipmentList.find(e => e.id === inst.eqId);
        if (eq.mechanic === 'switch') {
            inst.switchMode = inst.switchMode === 'uvData' ? 'films' : 'uvData';
            const modeName = inst.switchMode === 'uvData' ? '日盲模式' : '可见光模式';
            window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
                `🔄 【${eq.name}】切换至${modeName}！`, 'normal');
        } else if (eq.mechanic === 'tradeoff') {
            inst.tradeoffMode = inst.tradeoffMode === 'low' ? 'high' : 'low';
            const modeName = inst.tradeoffMode === 'low' ? '低温高质量档' : '高温高产档';
            window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
                `🔄 【${eq.name}】切换至${modeName}！`, 'normal');
        }
        this.saveGame();
    }

    // ==================== 咖啡加速 ====================
    activateCoffee() {
        if (this.inventory.coffee < 1) return { error: '咖啡豆不足！需要咖啡机产出。' };
        this.inventory.coffee -= 1;
        this.buffs.coffee = 10; // 持续10天
        if (window.soundEngine) window.soundEngine.playCoffee();
        window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
            `☕ 全组喝上特浓黑咖啡！产出 ×1.5 加速 buff 持续 10 天！`, 'coffee');
        this.saveGame();
        return { success: true };
    }

    // ==================== 算力注入论文 ====================
    injectCompute() {
        if (!this.currentPaperProject) return { error: '没有正在进行的论文项目！' };
        if (this.currentPaperProject.phase !== 'writing') return { error: '仅在撰写阶段可注入！' };
        if ((this.inventory.compute || 0) < 5) return { error: '算力不足！需 5 份算力。' };
        this.inventory.compute -= 5;
        this.currentPaperProject.writingProgress += 8;
        if (window.soundEngine) window.soundEngine.playComputeInject();
        window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
            `💻 注入 5 份算力！论文【${this.currentPaperProject.title}】进度 +8%！`, 'normal');
        this.saveGame();
        return { success: true };
    }

    // 获取设备当前购买价格（第 k 台 = base * 1.15^k 递增阶梯定价）
    getEquipmentPrice(eqId) {
        const eq = GAME_DATA.equipmentList.find(e => e.id === eqId);
        if (!eq) return 0;
        const count = this.stationInstances.filter(s => s.eqId === eqId).length;
        return Math.round(eq.price * Math.pow(1.15, count) * 100) / 100;
    }

    // ==================== 购买设备 ====================
    buyEquipment(eqId) {
        const eq = GAME_DATA.equipmentList.find(e => e.id === eqId);
        if (!eq) return { error: '未找到设备！' };
        const price = this.getEquipmentPrice(eqId);
        if (this.funding < price) return { error: `经费不足！需 ${price} 万元。` };

        this.funding -= price;
        const inst = this._createStationInstance(eqId);
        this.stationInstances.push(inst);
        const ownedNow = this.stationInstances.filter(s => s.eqId === eqId).length;
        window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
            `🔬 添置【${eq.name}】（第 ${ownedNow} 台）！指派成员入驻操作！`, 'normal');
        this._checkQuestProgress();
        this.checkAchievements();
        this._checkMilestoneUnlocks();
        this.saveGame();
        return { success: true };
    }

    // ==================== 二手设备处置/转让折现 ====================
    sellStation(instanceId) {
        const idx = this.stationInstances.findIndex(s => s.instanceId === instanceId);
        if (idx === -1) return { error: '未找到该设备！' };
        const inst = this.stationInstances[idx];
        const eq = GAME_DATA.equipmentList.find(e => e.id === inst.eqId);
        if (!eq) return { error: '设备数据异常！' };

        // 计算折旧退款金额 (原价80% + 历史升级投入80%)
        let totalInvested = eq.price;
        if (inst.level > 1 && eq.upgradeBaseCost) {
            for (let lvl = 1; lvl < inst.level; lvl++) {
                totalInvested += eq.upgradeBaseCost * lvl;
            }
        }
        const refund = Math.round(totalInvested * 0.8 * 100) / 100;

        // 释放可能在岗的操作员
        if (inst.operatorId) {
            const oldOp = this.members.find(m => m.id === inst.operatorId);
            if (oldOp) oldOp.assignedStationId = null;
        }

        // 移除设备实例
        this.stationInstances.splice(idx, 1);
        this.funding += refund;

        window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
            `♻️ 二手处置【${eq.name}】(Lv.${inst.level})，折旧回笼科研经费 +${refund} 万元！`, 'normal');

        this._checkQuestProgress();
        this.saveGame();
        return { success: true, refund, eqName: eq.name, level: inst.level };
    }
    assignOperator(instanceId, memberId) {
        const inst = this.stationInstances.find(s => s.instanceId === instanceId);
        if (!inst) return;
        if (!memberId) {
            if (inst.operatorId) {
                const old = this.members.find(m => m.id === inst.operatorId);
                if (old) old.assignedStationId = null;
            }
            inst.operatorId = null;
            // rampup 中断重置
            if (inst.rampupStreak) inst.rampupStreak = 0;
            this.saveGame();
            return;
        }
        const mem = this.members.find(m => m.id === memberId);
        if (!mem) return;
        // 释放旧工位
        if (mem.assignedStationId) {
            const old = this.stationInstances.find(s => s.instanceId === mem.assignedStationId);
            if (old) { old.operatorId = null; if (old.rampupStreak) old.rampupStreak = 0; }
        }
        // 释放旧操作员
        if (inst.operatorId) {
            const oldOp = this.members.find(m => m.id === inst.operatorId);
            if (oldOp) oldOp.assignedStationId = null;
        }
        inst.operatorId = memberId;
        mem.assignedStationId = instanceId;
        this.saveGame();
    }

    // ==================== 成员月度劳务津贴与工资接口 ====================
    getMemberMonthlySalary(member) {
        if (!member) return 0;
        const config = GAME_DATA.stipendConfig || {};
        return config[member.tier] !== undefined ? config[member.tier] : 0.05;
    }

    getTotalMonthlyPayroll() {
        let total = 0;
        for (let m of this.members) {
            total += this.getMemberMonthlySalary(m);
        }
        return total;
    }

    // ==================== 招生发布与简历面试 ====================
    // 发布招生帖子 / 宣讲会 (降低招人门槛：校内简章 0.1万，夏令营 0.6万)
    postRecruitment(channelType = 'campus') {
        if (this.members.length >= this.getMemberCap()) {
            return { error: `课题组工位已满 (${this.members.length}/${this.getMemberCap()})！请先升级实验室或提升声望评级以扩充工位。` };
        }
        const cost = channelType === 'summer_camp' ? 0.6 : 0.1;
        if (this.funding < cost) {
            return { error: `经费不足！发布【${channelType === 'summer_camp' ? '全国优秀大学生夏令营' : '校园保研简章'}】需 ${cost} 万元经费。` };
        }
        if (channelType === 'summer_camp' && this.labStage < 2) {
            return { error: '举办全国夏令营需课题组晋升至阶段 2（前沿实验室）以上！' };
        }
        if (this.rosterAvailable.length === 0) {
            return { error: '招生名册池已空，暂无更多未毕业申请者！' };
        }

        this.funding -= cost;

        // 随机产生 1~3 名候选人（夏令营固定 3 名高素质生源）
        let count = 3;
        if (channelType === 'campus') {
            count = Math.floor(Math.random() * 3) + 1; // 1, 2, 或 3 人
        }
        count = Math.min(count, this.rosterAvailable.length);

        // 随机洗牌抽取名字
        const shuffled = [...this.rosterAvailable].sort(() => Math.random() - 0.5);
        const pickedNames = shuffled.slice(0, count);

        // 生成候选人简历（专长、资质、特质各异）
        const candidates = window.characterManager.generateCandidates(pickedNames, channelType === 'summer_camp');
        this.activeCandidates = candidates;

        const channelName = channelType === 'summer_camp' ? '全国优秀大学生夏令营' : '校园保研招生简章';
        window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
            `📢 成功发布【${channelName}】！收到 ${candidates.length} 份候选人简历，请在人事区进行面试遴选！`, 'normal');
        
        this.saveGame();
        return { success: true, candidates };
    }

    // 正式录取候选人入组
    admitCandidate(candidateId) {
        if (this.members.length >= this.getMemberCap()) {
            return { error: `课题组工位已满 (${this.members.length}/${this.getMemberCap()})！` };
        }
        const cand = (this.activeCandidates || []).find(c => c.id === candidateId);
        if (!cand) return { error: '未找到该候选人简历！' };

        const newMem = window.characterManager.createMemberFromCandidate(cand);
        this.members.push(newMem);

        // 从未招生池中移除此人
        const idx = this.rosterAvailable.indexOf(cand.name);
        if (idx !== -1) this.rosterAvailable.splice(idx, 1);

        // 清空当前批次候选人
        this.activeCandidates = [];

        window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
            `🎉 录取通知书已送达！<b>${newMem.name} [${newMem.tier} · ${newMem.archetypeTitle || '硕士生'}]</b> 正式加入课题组！`, 'accept');
        
        this._checkQuestProgress();
        this.checkAchievements();
        this.saveGame();
        return { success: true, member: newMem };
    }

    // 婉拒本批候选人
    dismissCandidates() {
        this.activeCandidates = [];
        window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
            `📋 婉拒了本批简历，可重新发布招生宣讲。`, 'normal');
        this.saveGame();
        return { success: true };
    }

    // ==================== 学生能力培养与阶梯式资质进阶体系 ====================
    // 1. 导师手把手示范特训（受当前阶梯消耗与熟练度上限约束）
    trainMemberOneOnOne(memberId, aptKey) {
        const mem = this.members.find(m => m.id === memberId);
        if (!mem) return { error: '未找到该同门！' };
        const aptInfo = GAME_DATA.aptitudes[aptKey];
        if (!aptInfo) return { error: '无效的资质类别！' };
        
        const cm = window.characterManager;
        cm.ensureMemberApt(mem);
        const detail = cm.getMemberAptDetail(mem, aptKey);

        if (detail.isMax) return { error: '该资质已达最高 SS 级宗师化境！' };
        if (detail.canBreak) return { error: `熟练度已达上限 (${detail.exp}/${detail.maxExp})，请点击【⚡ 境界突破】开启考核！` };

        if (this.funding < detail.trainCost) {
            return { error: `经费不足！特训需要投入 ${detail.trainCost} 万元实验耗材。` };
        }

        this.funding -= detail.trainCost;

        // 导师特训有 15% 几率触发「顿悟灵感 (Critical Training)」获得双倍 EXP
        const isCrit = Math.random() < 0.15;
        const gainedExp = isCrit ? detail.trainExp * 2 : detail.trainExp;

        mem.aptExp[aptKey] = Math.min(detail.maxExp, (mem.aptExp[aptKey] || 0) + gainedExp);
        const newDetail = cm.getMemberAptDetail(mem, aptKey);

        const logMsg = isCrit
            ? `💥 灵感顿悟！导师对 <b>${mem.name}</b> 深度示教【${aptInfo.name}】，顿悟获得 <b>+${gainedExp} EXP</b>！(${newDetail.exp}/${newDetail.maxExp})`
            : `👨‍🏫 导师对 <b>${mem.name}</b> 进行【${aptInfo.name}】专项示教，获得 <b>+${gainedExp} EXP</b>！(${newDetail.exp}/${newDetail.maxExp})`;

        window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(), logMsg, isCrit ? 'coffee' : 'normal');
        this.saveGame();
        return { success: true, member: mem, isCrit, gainedExp, detail: newDetail };
    }

    // 2. 派驻学术研讨会 / 暑期学校 (全属性阶梯式增长)
    sendMemberToConference(memberId) {
        const mem = this.members.find(m => m.id === memberId);
        if (!mem) return { error: '未找到该同门！' };
        const cost = 0.8; // 0.8 万元
        if (this.funding < cost) return { error: `经费不足！派驻学术研讨会需 ${cost} 万元差旅与注册费。` };

        this.funding -= cost;
        const cm = window.characterManager;
        cm.ensureMemberApt(mem);

        for (let k of ['lab', 'theory', 'analysis', 'insight']) {
            const detail = cm.getMemberAptDetail(mem, k);
            if (detail && !detail.isMax) {
                mem.aptExp[k] = Math.min(detail.maxExp, (mem.aptExp[k] || 0) + 15);
            }
        }

        // 35% 概率领悟新科研特质
        let awakenedTrait = null;
        if (Math.random() < 0.35) {
            awakenedTrait = cm.getRandomAwakeningTrait(mem);
            if (awakenedTrait) {
                mem.traits = mem.traits || [];
                mem.traits.push(awakenedTrait);
            }
        }

        let logMsg = `🛫 派遣 <b>${mem.name}</b> 参加全国光电材料前沿学术研讨会！全资质 +15 EXP！`;
        if (awakenedTrait) {
            logMsg += ` 💡 在研讨会中顿悟，领悟新特质 <b>${awakenedTrait.name}</b>！`;
        }

        window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(), logMsg, 'accept');
        this.saveGame();
        return { success: true, member: mem, awakenedTrait };
    }

    // 3. 组会顶刊精读汇报
    hostJournalClub(memberId) {
        const mem = this.members.find(m => m.id === memberId);
        if (!mem) return { error: '未找到该同门！' };
        
        let costCoffee = 0;
        let costFunding = 0;
        if ((this.inventory.coffee || 0) >= 1) {
            this.inventory.coffee -= 1;
            costCoffee = 1;
        } else if (this.funding >= 0.2) {
            this.funding -= 0.2;
            costFunding = 0.2;
        } else {
            return { error: '举办组会文献精读需 1 颗咖啡豆 或 0.2 万元经费购买茶歇！' };
        }

        const cm = window.characterManager;
        cm.ensureMemberApt(mem);

        for (let k of ['theory', 'insight']) {
            const detail = cm.getMemberAptDetail(mem, k);
            if (detail && !detail.isMax) {
                mem.aptExp[k] = Math.min(detail.maxExp, (mem.aptExp[k] || 0) + 20);
            }
        }

        window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
            `☕ 组织周度组会顶刊精读！<b>${mem.name}</b> 汇报 Nature/Science 经典文献，【理论计算力】与【文献洞察力】各 +20 EXP！`, 'accept');
        this.saveGame();
        return { success: true, member: mem };
    }

    // 4. 阶梯式资质突破考核（概率考核 · 幸运保底 · 特质觉醒）
    breakthroughMemberApt(memberId, aptKey) {
        const mem = this.members.find(m => m.id === memberId);
        if (!mem) return { error: '未找到该同门！' };
        const aptInfo = GAME_DATA.aptitudes[aptKey];
        if (!aptInfo) return { error: '无效的资质类别！' };
        
        const cm = window.characterManager;
        cm.ensureMemberApt(mem);
        const detail = cm.getMemberAptDetail(mem, aptKey);

        if (detail.isMax) return { error: '该资质已达最高 SS 级宗师化境！' };
        if (!detail.canBreak) return { error: `熟练度未满（当前 ${detail.exp}/${detail.maxExp}），尚无法开启突破！` };

        const roll = Math.random();
        const success = (roll < detail.totalChance);

        if (success) {
            // 突破成功！
            const oldRank = detail.rank;
            const newRank = detail.nextRank;
            mem.aptRanks[aptKey] = newRank;
            mem.aptExp[aptKey] = 0;
            mem.aptLuck[aptKey] = 0;

            const prestigeGained = newRank === 'SS' ? 5 : newRank === 'S' ? 3 : newRank === 'A' ? 2 : 1;
            this.prestige += prestigeGained;

            // 冲入 S 或 SS 级时，高概率领悟专属学术特质！
            let awakenedTrait = null;
            if ((newRank === 'S' || newRank === 'SS') && Math.random() < 0.65) {
                awakenedTrait = cm.getRandomAwakeningTrait(mem);
                if (awakenedTrait) {
                    mem.traits = mem.traits || [];
                    mem.traits.push(awakenedTrait);
                }
            }

            const traitMsg = awakenedTrait ? `，并顿悟领悟了专属特质<b>${awakenedTrait.name}</b>（${awakenedTrait.desc}）` : '';
            window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
                `👑 突破大吉！<b>${mem.name}</b> 的【${aptInfo.name}】成功从 <b>${oldRank} 级</b> 突破至 <b>${newRank} 级</b>${traitMsg}！课题组声望 +${prestigeGained}！`, 'accept');

            this.checkAchievements();
            this.saveGame();
            return {
                success: true,
                member: mem,
                oldRank,
                newRank,
                prestigeGained,
                awakenedTrait
            };
        } else {
            // 突破失败（学术瓶颈）：累积幸运保底，返还 70% 熟练度
            const newLuck = Math.min(0.85, (mem.aptLuck[aptKey] || 0) + detail.failLuck);
            mem.aptLuck[aptKey] = newLuck;
            mem.aptExp[aptKey] = Math.floor(detail.maxExp * 0.70);

            const nextChance = Math.min(1.0, detail.baseSuccess + newLuck + detail.mentorBonus);
            const failMsg = `⚠️ 遇到学术瓶颈！<b>${mem.name}</b> 冲击【${aptInfo.name} ${detail.nextRank} 级】未果，返还 70% 熟练度，并获得 <b>+${Math.round(detail.failLuck * 100)}% 幸运保底</b>！下次成功率升至 <b>${Math.round(nextChance * 100)}%</b>！`;

            window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(), failMsg, 'warning');
            this.saveGame();
            return {
                success: false,
                member: mem,
                luckAdded: detail.failLuck,
                nextChance
            };
        }
    }

    // ==================== 产学研多品类转化回收与技术转让 ====================
    recycleResource(resKey, amount = 'all') {
        const priceTable = GAME_DATA.recyclePrices || {};
        const priceInfo = priceTable[resKey];
        if (!priceInfo) return { error: '该品类不支持回收转化！' };

        const currentStock = Math.floor(this.inventory[resKey] || 0);
        if (currentStock <= 0) return { error: `当前没有可供回收的【${priceInfo.name}】！` };

        let count = currentStock;
        if (amount !== 'all') {
            const num = parseInt(amount, 10);
            if (num > 0 && num < currentStock) count = num;
        }

        const yuanGained = count * priceInfo.unitYuan;
        const fundingGained = count * priceInfo.unitWan;

        this.inventory[resKey] -= count;
        this.funding += fundingGained;

        window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
            `📦 产学研转化：出库 <b>${count}</b> 份【${priceInfo.name}】（${priceInfo.unitYuan}元/份），获得经费 <b>+${yuanGained.toLocaleString()} 元</b>（+${fundingGained.toFixed(4)} 万元）！`, 'accept');

        this.checkAchievements();
        this.saveGame();
        return { success: true, resKey, name: priceInfo.name, count, yuan: yuanGained, funding: fundingGained };
    }

    recycleAllResources() {
        const priceTable = GAME_DATA.recyclePrices || {};
        let totalYuan = 0;
        let totalFunding = 0;
        let recycledItems = [];

        for (let [resKey, priceInfo] of Object.entries(priceTable)) {
            const stock = Math.floor(this.inventory[resKey] || 0);
            if (stock > 0) {
                const yuan = stock * priceInfo.unitYuan;
                const funding = stock * priceInfo.unitWan;
                this.inventory[resKey] -= stock;
                totalYuan += yuan;
                totalFunding += funding;
                recycledItems.push(`${priceInfo.icon}${priceInfo.name}×${stock}`);
            }
        }

        if (totalYuan <= 0) {
            return { error: '当前没有任何可供回收变现的实验样品或数据！' };
        }

        this.funding += totalFunding;
        window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
            `📦 产学研全品类转让：成功出库 [${recycledItems.join('、')}]，共获科研经费 <b>+${totalYuan.toLocaleString()} 元</b>（+${totalFunding.toFixed(4)} 万元）！`, 'accept');

        this.checkAchievements();
        this.saveGame();
        return { success: true, totalYuan, totalFunding, itemsCount: recycledItems.length };
    }

    // 兼容原接口
    recycleFilms(amount = 'all') {
        return this.recycleResource('films', amount);
    }

    recruitRosterMember(name) {
        return this.postRecruitment('campus');
    }

    // 检查博士天骄是否达成全部学术条件
    isLegendaryUnlocked(legendaryId) {
        if (this.allUnlocked) return true;
        const leg = GAME_DATA.legendaryMembers.find(m => m.id === legendaryId);
        if (!leg) return false;
        if (!leg.unlockConditions || leg.unlockConditions.length === 0) return true;
        for (let c of leg.unlockConditions) {
            let ok = false;
            if (c.type === 'lab_grade') ok = this.getLabGrade() >= c.grade;
            else if (c.type === 'paper_count') ok = this.publishedPapers.length >= c.count;
            else if (c.type === 'paper_zone') {
                if (c.zoneKey === 'supreme') ok = this.publishedPapers.some(p => p.zoneKey === 'supreme');
                else if (c.zoneKey === 'zone1') ok = this.publishedPapers.some(p => ['zone1', 'supreme'].includes(p.zoneKey));
                else if (c.zoneKey === 'zone2') ok = this.publishedPapers.some(p => ['zone2', 'zone1', 'supreme'].includes(p.zoneKey));
                else ok = this.publishedPapers.some(p => p.zoneKey === c.zoneKey);
            }
            else if (c.type === 'facility') ok = this.stationInstances.some(s => s.eqId === c.facId);
            else if (c.type === 'resource') ok = (this.inventory[c.resKey] || 0) >= c.count;
            else if (c.type === 'equip_level') ok = this.stationInstances.some(s => s.eqId === c.eqId && s.level >= c.level);
            if (!ok) return false;
        }
        return true;
    }

    recruitLegendaryMember(legendaryId) {
        if (this.members.length >= this.getMemberCap())
            return { error: `课题组工位已满 (${this.members.length}/${this.getMemberCap()})！提升评级可扩容。` };
        const preset = GAME_DATA.legendaryMembers.find(m => m.id === legendaryId);
        if (!preset) return { error: '未找到天骄档案！' };
        if (this.members.some(m => m.id === legendaryId)) return { error: '该博士已在课题组中！' };
        if (!this.isLegendaryUnlocked(legendaryId)) {
            return { error: '尚未达成该博士的全部学术引荐条件！' };
        }
        const stipend = preset.stipend || 0;
        if (this.funding < stipend) {
            return { error: `经费不足！签约聘请 ${preset.name} 需要 ${stipend} 万元博士科研津贴。` };
        }
        this.funding -= stipend;
        const newMem = window.characterManager.createLegendaryMember(preset);
        this.members.push(newMem);
        window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
            `👑 签约成功！<b>${newMem.name} [${newMem.tier} · ${newMem.grade}]</b> 正式加盟课题组！（扣除津贴 ${stipend}万）`, 'accept');
        this._checkQuestProgress();
        this.checkAchievements();
        this.saveGame();
        return { success: true, member: newMem };
    }

    // ==================== 里程碑解锁 ====================
    _checkMilestoneUnlocks() {
        for (let leg of GAME_DATA.legendaryMembers) {
            if (this.members.some(m => m.id === leg.id) || this.unlockedLegendary.includes(leg.id)) continue;
            if (leg.stageReq > this.labStage) continue;
            if (this.isLegendaryUnlocked(leg.id)) {
                this.unlockedLegendary.push(leg.id);
                window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
                    `⚡ 达成全部学术引荐条件！已可签约天骄 <b>${leg.name} [${leg.tier}]</b>！`, 'accept');
            }
        }
    }

    // ==================== 成就系统 ====================
    // 检测所有未达成成就；达成则记录+奖励+通知
    checkAchievements() {
        if (!GAME_DATA.achievements) return;
        for (let ach of GAME_DATA.achievements) {
            if (this.achievements.includes(ach.id)) continue;
            let ok = false;
            switch (ach.type) {
                case 'papers_count': ok = this.publishedPapers.length >= ach.target; break;
                case 'publish_zone': ok = this.publishedPapers.some(p => p.zoneKey === ach.target); break;
                case 'apt_grade': ok = this.members.some(m => ['lab', 'theory', 'analysis', 'insight'].some(k => window.characterManager.getMemberAptGrade(m, k) === ach.target)); break;
                case 'lab_grade': ok = this.getLabGrade() >= ach.target; break;
                case 'station_count': ok = this.stationInstances.length >= ach.target; break;
                case 'member_count': ok = this.members.length >= ach.target; break;
                case 'equip_max_level': ok = this.stationInstances.some(s => { const eq = GAME_DATA.equipmentList.find(e => e.id === s.eqId); return eq && s.level >= eq.maxLevel; }); break;
                case 'max_combo': ok = (this.maxCombo || 0) >= ach.target; break;
                case 'manual_clicks': ok = (this.manualClicks || 0) >= ach.target; break;
                case 'auto_cps': ok = this.getLabAutoCPS() >= ach.target; break;
            }
            if (ok) {
                this.achievements.push(ach.id);
                if (ach.rewardFunding) this.funding += ach.rewardFunding;
                if (ach.rewardPrestige) this.prestige += ach.rewardPrestige;
                if (window.soundEngine) window.soundEngine.playAchievement();
                window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
                    `🏆 解锁成就【${ach.name}】！${ach.rewardFunding ? `经费+${ach.rewardFunding}万 ` : ''}${ach.rewardPrestige ? `声望+${ach.rewardPrestige}` : ''}`, 'upgrade');
                if (window.ui && window.ui.notifyAchievement) window.ui.notifyAchievement(ach);
                this.saveGame();
            }
        }
    }

    // ==================== 点击与自动点击系统 ====================
    getComboStage() {
        const stages = GAME_DATA.clickConfig.comboStages;
        const current = this.combo || 0;
        for (let s of stages) {
            if (current >= s.threshold) return s;
        }
        return stages[stages.length - 1];
    }

    // 单个成员的自动点击频次 (CPS)
    getMemberAutoCPS(member) {
        if (!member) return 0;
        const baseCPS = (GAME_DATA.clickConfig.tierBaseCPS && GAME_DATA.clickConfig.tierBaseCPS[member.tier]) || 1.0;
        const cm = window.characterManager;
        const bestGrade = Math.max(
            cm.getMemberAptMult(member, 'lab'),
            cm.getMemberAptMult(member, 'theory'),
            cm.getMemberAptMult(member, 'analysis'),
            cm.getMemberAptMult(member, 'insight')
        );
        let cps = baseCPS * bestGrade;
        if (this.buffs.coffee > 0) cps *= 2.0; // 咖啡提神狂暴自动点击
        return cps;
    }

    // 单个成员的单次自动点击威力
    getMemberAutoPower(member) {
        if (!member) return 0;
        const basePower = (GAME_DATA.clickConfig.tierBasePower && GAME_DATA.clickConfig.tierBasePower[member.tier]) || 1.5;
        const cm = window.characterManager;
        const avgMult = (cm.getMemberAptMult(member, 'lab') + cm.getMemberAptMult(member, 'theory')) / 2;
        let power = basePower * avgMult * this.getPrestigeMult();
        if (this.hasWangMeng() && member.id !== 'wangmeng') power *= 1.5;
        if (this.buffs.teamBuilding > 0) power *= 1.2;
        return power;
    }

    // 全组总自动点击频次 (CPS)
    getLabAutoCPS() {
        let totalCPS = 0;
        for (let m of this.members) {
            totalCPS += this.getMemberAutoCPS(m);
        }
        return totalCPS;
    }

    // 全组总自动点击威力 (每秒产出贡献)
    getLabAutoClickPower() {
        let totalPower = 0;
        for (let m of this.members) {
            totalPower += this.getMemberAutoCPS(m) * this.getMemberAutoPower(m);
        }
        return totalPower;
    }

    // ==================== 导师科研指导升级体系 ====================
    getMentorTier(level = null) {
        const lvl = level || this.mentorLevel || 1;
        const tiers = (GAME_DATA.clickConfig && GAME_DATA.clickConfig.mentorUpgrades) || [];
        return tiers.find(t => t.level === lvl) || tiers[0] || { level: 1, name: '基础实验示教', powerMult: 1.0, cost: 0, desc: '手把手教移液与称量规范' };
    }

    getNextMentorTier() {
        const curLvl = this.mentorLevel || 1;
        const tiers = (GAME_DATA.clickConfig && GAME_DATA.clickConfig.mentorUpgrades) || [];
        return tiers.find(t => t.level === curLvl + 1) || null;
    }

    getMentorUpgradeDetail() {
        const nextTier = this.getNextMentorTier();
        if (!nextTier) return null;

        const luck = this.mentorUpgradeLuck || 0;
        const baseSuccess = nextTier.baseSuccess || 0.85;
        const failLuck = nextTier.failLuck || 0.20;
        const totalChance = Math.min(1.0, baseSuccess + luck);

        return {
            nextTier,
            cost: nextTier.cost,
            baseSuccess,
            luck,
            failLuck,
            totalChance
        };
    }

    upgradeMentorGuidance() {
        const nextTier = this.getNextMentorTier();
        if (!nextTier) return { error: '导师科研指导已达宗师最高境界！' };
        if (this.funding < nextTier.cost) {
            return { error: `经费不足！升级需要 ${nextTier.cost} 万元科研经费。` };
        }

        const detail = this.getMentorUpgradeDetail();
        this.funding -= nextTier.cost;

        const roll = Math.random();
        const success = (roll < detail.totalChance);

        if (success) {
            this.mentorLevel = nextTier.level;
            this.mentorUpgradeLuck = 0;

            window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
                `👑 导师科研指导顿悟晋升至 <b>Lv.${this.mentorLevel}【${nextTier.name}】</b>！${nextTier.desc}`, 'upgrade');
            this.checkAchievements();
            this.saveGame();
            return { success: true, level: this.mentorLevel, tier: nextTier };
        } else {
            // 导师升级未果：积累幸运保底
            const newLuck = Math.min(0.85, (this.mentorUpgradeLuck || 0) + detail.failLuck);
            this.mentorUpgradeLuck = newLuck;
            const nextChance = Math.min(1.0, detail.baseSuccess + newLuck);

            const msg = `⚠️ 科研指导瓶颈！冲击<b>【${nextTier.name}】</b>未果，积累 <b>+${Math.round(detail.failLuck * 100)}% 领悟幸运保底</b>！下次升级成功率攀升至 <b>${Math.round(nextChance * 100)}%</b>！`;
            window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(), msg, 'warning');
            this.saveGame();
            return { success: false, luckAdded: detail.failLuck, nextChance, tier: nextTier };
        }
    }

    // ==================== 导师指导手动点击靶向选择 ====================
    getAvailableClickTargets() {
        const ownedEqIds = new Set(this.stationInstances.map(s => s.eqId));
        const targets = [];

        // 1. 前驱体溶液：作为化学基础合成原料始终可用
        targets.push({
            productKey: 'precursors',
            name: '前驱体溶液',
            icon: '🧪',
            color: '#38bdf8',
            eqName: ownedEqIds.has('fume_hood') ? '化学通风橱' : '手动移液配制'
        });

        // 2. 只有已购置部署对应设备的产物才加入靶向列表
        for (let eq of GAME_DATA.equipmentList) {
            if (eq.type === 'station' && eq.productKey && eq.productKey !== 'precursors' && ownedEqIds.has(eq.id)) {
                if (!targets.some(t => t.productKey === eq.productKey)) {
                    const res = GAME_DATA.resources[eq.productKey] || {};
                    targets.push({
                        productKey: eq.productKey,
                        name: eq.productName || res.name || eq.productKey,
                        icon: res.icon || eq.icon,
                        color: res.color || '#38bdf8',
                        eqName: eq.name
                    });
                }
            }
        }
        return targets;
    }

    setClickTarget(productKey) {
        const available = this.getAvailableClickTargets();
        if (available.some(t => t.productKey === productKey)) {
            this.activeClickTarget = productKey;
            this.saveGame();
            return { success: true, target: productKey };
        }
        return { error: '该产物对应的前置设备尚未购置部署！' };
    }

    // 执行导师手动点击与示教（支持主动高频连点与长按持续科研）
    performManualClick(targetEqId = null, isHoldStream = false) {
        this.manualClicks = (this.manualClicks || 0) + 1;
        // 连击积累：手动主动点击 +1.0，持续按住 +0.6
        this.combo = (this.combo || 0) + (isHoldStream ? 0.6 : 1.0);
        const intCombo = Math.floor(this.combo);
        if (intCombo > (this.maxCombo || 0)) this.maxCombo = intCombo;
        this.comboTimer = GAME_DATA.clickConfig.comboDecayTime;

        const stage = this.getComboStage();
        const mentorTier = this.getMentorTier();

        const baseCrit = GAME_DATA.clickConfig.baseCritChance + stage.critBonus + (mentorTier.critBonus || 0) + (this.hasWangMeng() ? 0.15 : 0);
        const isCrit = Math.random() < baseCrit;
        const critMult = isCrit ? (2.0 + Math.random() * 2.0) : 1.0;

        let clickPower = GAME_DATA.clickConfig.baseManualPower * (mentorTier.powerMult || 1.0) * stage.mult * critMult * this.getPrestigeMult();
        if (this.buffs.coffee > 0) clickPower *= 1.5;
        if (this.hasWangMeng()) clickPower *= 1.5;

        // 主动点击有微量额外爆发加成 (1.20x)，按住保持平稳流畅产出 (0.95x)
        if (!isHoldStream) {
            clickPower *= 1.20;
        } else {
            clickPower *= 0.95;
        }

        // 1. 如果正在攻坚论文，点击直接加速推进论文进度
        let paperSpeedup = 0;
        if (this.currentPaperProject) {
            const p = this.currentPaperProject;
            paperSpeedup = GAME_DATA.clickConfig.baseManualPaperSpeed * (mentorTier.paperBoostMult || 1.0) * stage.mult * (isCrit ? 2.5 : 1.0);
            if (p.phase === 'ideation') {
                p.ideationProgress = Math.min(100, p.ideationProgress + paperSpeedup * 1.5);
            } else if (p.phase === 'writing') {
                p.writingProgress = Math.min(100, p.writingProgress + paperSpeedup);
            } else if (p.phase === 'review') {
                p.reviewProgress = Math.min(100, p.reviewProgress + paperSpeedup * 0.8);
            }
        }

        // 2. 根据玩家选择的设备产物靶向产生实验数据
        const availableTargets = this.getAvailableClickTargets();
        let chosenKey = this.activeClickTarget || 'films';
        if (!availableTargets.some(t => t.productKey === chosenKey)) {
            chosenKey = availableTargets[0] ? availableTargets[0].productKey : 'films';
            this.activeClickTarget = chosenKey;
        }
        if (targetEqId) {
            const eq = GAME_DATA.equipmentList.find(e => e.id === targetEqId);
            if (eq && eq.productKey) chosenKey = eq.productKey;
        }

        // 难易度产出系数（基础易产出的如前驱体/薄膜多爆，高阶如超算/器件/成像单次产出紧凑精准）
        const targetYieldRatios = {
            precursors: 1.2,
            films: 1.0,
            coffee: 0.6,
            xrdData: 0.6,
            absData: 0.5,
            uvData: 0.4,
            spectra: 0.35,
            compute: 0.3,
            devices: 0.25,
            imaging: 0.2
        };

        const ratio = targetYieldRatios[chosenKey] || 1.0;
        let yieldAmount = clickPower * ratio;
        let notice = '';

        // 有机转化：点击若消耗上游原料，检查库存
        if (chosenKey === 'films') {
            const reqPrecursors = yieldAmount;
            if ((this.inventory.precursors || 0) >= reqPrecursors) {
                this.inventory.precursors -= reqPrecursors;
                this.inventory.films = (this.inventory.films || 0) + yieldAmount;
            } else if ((this.inventory.precursors || 0) > 0) {
                const actual = this.inventory.precursors;
                this.inventory.precursors = 0;
                this.inventory.films = (this.inventory.films || 0) + actual;
                yieldAmount = actual;
            } else {
                // 前驱液为0，导师自适应回退为配制前驱液
                chosenKey = 'precursors';
                yieldAmount = clickPower * targetYieldRatios.precursors;
                this.inventory.precursors = (this.inventory.precursors || 0) + yieldAmount;
                notice = '前驱液耗尽，导师正在紧急移液配制前驱液原料！';
            }
        } else if (['xrdData', 'absData', 'uvData', 'spectra'].includes(chosenKey)) {
            const reqFilms = yieldAmount;
            if ((this.inventory.films || 0) >= reqFilms) {
                this.inventory.films -= reqFilms;
                this.inventory[chosenKey] = (this.inventory[chosenKey] || 0) + yieldAmount;
            } else if ((this.inventory.films || 0) > 0) {
                const actual = this.inventory.films;
                this.inventory.films = 0;
                this.inventory[chosenKey] = (this.inventory[chosenKey] || 0) + actual;
                yieldAmount = actual;
            } else {
                chosenKey = 'precursors';
                yieldAmount = clickPower * targetYieldRatios.precursors;
                this.inventory.precursors = (this.inventory.precursors || 0) + yieldAmount;
                notice = '薄膜样品耗尽，导师正在优先配制前驱体溶液！';
            }
        } else if (chosenKey === 'devices') {
            const reqFilms = yieldAmount * 2;
            if ((this.inventory.films || 0) >= reqFilms) {
                this.inventory.films -= reqFilms;
                this.inventory.devices = (this.inventory.devices || 0) + yieldAmount;
            } else {
                chosenKey = 'precursors';
                yieldAmount = clickPower * targetYieldRatios.precursors;
                this.inventory.precursors = (this.inventory.precursors || 0) + yieldAmount;
                notice = '优质薄膜不足，导师正在从头配制前驱体！';
            }
        } else {
            this.inventory[chosenKey] = (this.inventory[chosenKey] || 0) + yieldAmount;
        }

        // 3. 概率为操作员增加微量资质经验 (手把手指导教学)
        const expChance = mentorTier.expChance || 0.15;
        if (Math.random() < expChance && this.members.length > 0) {
            const randomMember = this.members[Math.floor(Math.random() * this.members.length)];
            this.addAptExp(randomMember.id, 'lab', 0.2 + (this.mentorLevel * 0.1));
        }

        this.checkAchievements();
        return {
            isCrit,
            critMult,
            yieldAmount,
            productKey: chosenKey,
            productName: (GAME_DATA.resources[chosenKey] && GAME_DATA.resources[chosenKey].name) || chosenKey,
            combo: Math.floor(this.combo),
            comboStage: stage,
            paperSpeedup,
            mentorTier,
            notice
        };
    }

    // 自动点击仿真推进（操作员在各工位持续自动连点代打）
    _tickAutoClick(deltaSec) {
        let totalLabCPS = 0;
        let totalLabPower = 0;

        // 1. 各设备工位上的操作员专属连点产出
        const activeStations = this.stationInstances.filter(s => s.operatorId && !s.brokenUntilDay);

        for (let inst of activeStations) {
            const op = this.members.find(m => m.id === inst.operatorId);
            if (!op) continue;
            const eq = GAME_DATA.equipmentList.find(e => e.id === inst.eqId);
            if (!eq || eq.type !== 'station') continue;

            const fitInfo = this.getStationFitInfo(op, eq.id);
            const opCPS = this.getMemberAutoCPS(op);
            const opPower = this.getMemberAutoPower(op) * (1 + (inst.level - 1) * 0.25) * fitInfo.totalFitMult;

            totalLabCPS += opCPS;
            totalLabPower += opCPS * opPower;

            const yieldThisTick = opPower * opCPS * deltaSec;

            // 原料消耗检查
            const inputs = eq.inputRecipe || {};
            let canProduce = true;
            for (let [inKey, reqAmountPerUnit] of Object.entries(inputs)) {
                const totalReq = yieldThisTick * reqAmountPerUnit;
                if ((this.inventory[inKey] || 0) < totalReq) {
                    canProduce = false;
                    break;
                }
            }

            if (canProduce) {
                for (let [inKey, reqAmountPerUnit] of Object.entries(inputs)) {
                    this.inventory[inKey] = Math.max(0, (this.inventory[inKey] || 0) - (yieldThisTick * reqAmountPerUnit));
                }
                this.inventory[eq.productKey] = (this.inventory[eq.productKey] || 0) + yieldThisTick;
                inst.isLackingMaterials = false;
            } else {
                inst.isLackingMaterials = true;
            }
        }

        // 2. 如果还有未上岗的机动同门，协助导师手动移液配制前驱液
        const idleMembers = this.members.filter(m => !this.stationInstances.some(s => s.operatorId === m.id));
        for (let m of idleMembers) {
            const mCPS = this.getMemberAutoCPS(m);
            const mPower = this.getMemberAutoPower(m);
            totalLabCPS += mCPS;
            totalLabPower += mCPS * mPower;
            this.inventory.precursors = (this.inventory.precursors || 0) + (mPower * mCPS * deltaSec);
        }

        // 3. 全组操作员自动连点维持与积累连击槽 (保持全组处于科研心流状态)
        if (totalLabCPS > 0) {
            this.combo = Math.min(50, (this.combo || 0) + (totalLabCPS * deltaSec * 0.12));
            this.comboTimer = GAME_DATA.clickConfig.comboDecayTime;
        } else {
            // 连击计时衰减
            if (this.comboTimer > 0) {
                this.comboTimer -= deltaSec;
                if (this.comboTimer <= 0 && this.combo > 0) {
                    this.combo = Math.max(0, Math.floor(this.combo * 0.7) - 1);
                    if (this.combo > 0) this.comboTimer = 0.4;
                }
            }
        }

        // 4. 统计自动点击总次数
        this.autoClicks = (this.autoClicks || 0) + totalLabCPS * deltaSec;

        // 5. 如果在攻坚论文，全组操作员自动连点大幅协同加速论文进展
        if (this.currentPaperProject && this.currentPaperProject.phase !== 'decision') {
            const p = this.currentPaperProject;
            const autoPaperBoost = deltaSec * 0.35 * (totalLabCPS / 3);
            if (p.phase === 'ideation') p.ideationProgress = Math.min(100, p.ideationProgress + autoPaperBoost);
            else if (p.phase === 'writing') p.writingProgress = Math.min(100, p.writingProgress + autoPaperBoost);
            else if (p.phase === 'review') p.reviewProgress = Math.min(100, p.reviewProgress + autoPaperBoost * 0.7);
        }
    }

    // ==================== 论文系统 ====================
    startPaperProject(topicId, zoneKey, leadId, coId, theoryId, testingId, extraData) {
        if (this.currentPaperProject) return { error: '已有正在进行的论文！' };
        const topic = GAME_DATA.paperTopics.find(t => t.id === topicId);
        if (!topic) return { error: '未找到课题！' };
        if (topic.stageReq > this.labStage) return { error: `需阶段 ${topic.stageReq} 解锁！` };
        const zone = GAME_DATA.paperZones.find(z => z.id === zoneKey);
        if (!zone) return { error: '未找到投递分区！' };

        // 检查数据配方（含超额投入）
        const need = { ...topic.reqData };
        let totalExtra = 0;
        for (let [k, v] of Object.entries(extraData || {})) {
            need[k] = (need[k] || 0) + v;
            totalExtra += v;
        }
        for (let [k, v] of Object.entries(need)) {
            if ((this.inventory[k] || 0) < v) {
                const res = GAME_DATA.resources[k];
                return { error: `${res ? res.name : k} 不足！共需 ${v} 份（当前 ${Math.floor(this.inventory[k] || 0)}）。` };
            }
        }
        // 扣除数据
        for (let [k, v] of Object.entries(need)) this.inventory[k] -= v;

        const lead = this.members.find(m => m.id === leadId);
        if (!lead) return { error: '请指派第一作者！' };

        // 计算综合度（决定能否投此分区 + 成功后奖励）
        const comboScore = this._calcComboScore(topic, zone, leadId, coId, theoryId, testingId, totalExtra);
        if (comboScore < zone.requireCombo) {
            return { error: `综合度 ${Math.floor(comboScore)} 不足！投【${zone.name}】需综合度 ${zone.requireCombo}。请降档或提升团队/数据投入。` };
        }

        const funding = Math.round(topic.equipCost * 0.6 * Math.pow(zone.mult, 0.8));
        const prestige = Math.round(topic.basePrestige * zone.rewardPrestigeMult);

        this.currentPaperProject = {
            topicId: topic.id, title: topic.title, zoneKey, zoneName: zone.name,
            equipCost: topic.equipCost, themeId: topic.id,
            rewardFunding: funding, rewardPrestige: prestige,
            comboScore,
            leadId, coId: coId || null, theoryId: theoryId || null, testingId: testingId || null,
            phase: 'ideation', ideationProgress: 0,
            writingProgress: 0, writingStage: 'theory',
            reviewProgress: 0, reviewScore: 0, reviewEventPending: false, reviewEventFired: false
        };

        window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
            `📝 立项【${topic.title}】投【${zone.name}】！一作：<b>${lead.name}</b>，综合度 ${Math.floor(comboScore)}，进入构思阶段。`, 'normal');
        this.saveGame();
        return { success: true };
    }

    // 综合度 = 数据富余(超额投入) + 团队资质 + 构思(占位，完成后补) + 声誉加成
    _calcComboScore(topic, zone, leadId, coId, theoryId, testingId, totalExtra) {
        const cm = window.characterManager;
        let score = 0;

        // 1. 团队资质 (最大 ~45)
        const lead = this.members.find(m => m.id === leadId);
        if (lead) score += cm.getMemberAptMult(lead, 'analysis') * 12;
        const co = this.members.find(m => m.id === coId);
        if (co) score += cm.getMemberAptMult(co, 'lab') * 6;
        const theory = this.members.find(m => m.id === theoryId);
        if (theory) score += cm.getMemberAptMult(theory, 'theory') * 6;
        const testing = this.members.find(m => m.id === testingId);
        if (testing) score += cm.getMemberAptMult(testing, 'lab') * 6;
        if (co && lead && (lead.coAuthorId === co.id || co.coAuthorId === lead.id)) score *= 1.1;

        // 2. 数据富余（超额投入，最高 ~30）
        // 额外每 1% 关重数据给 0.5，封顶30
        score += Math.min(30, totalExtra * 0.7);

        // 3. 声誉加成（最高 ~15）
        score += Math.min(15, Math.floor(this.prestige / 50) * 3);

        // 4. 构思完成度占位（实际在_combineIdeation时动态加，这里先算基准分）
        return Math.min(110, score);
    }

    // 投递给定分区时，把构思完成度并入综合度（用于最终成功率）
    _getFinalCombo() {
        const p = this.currentPaperProject;
        if (!p) return p.comboScore;
        const ideationBonus = (p.ideationProgress / 100) * 15;
        return Math.min(115, p.comboScore + ideationBonus);
    }

    _tickPaper(deltaDays) {
        const p = this.currentPaperProject;
        if (!p) return;

        if (p.phase === 'ideation') {
            // 构思阶段：洞察力推进
            const insightMember = this.members.find(m => m.id === p.leadId);
            let speed = 7.0; // 每天基准进度
            if (insightMember) {
                speed *= window.characterManager.getMemberAptMult(insightMember, 'insight');
            }
            // 理论支持者也帮忙构思
            const theoryMember = this.members.find(m => m.id === p.theoryId);
            if (theoryMember) speed *= 1.2;

            p.ideationProgress += deltaDays * speed;
            if (p.ideationProgress >= 100) {
                p.ideationProgress = 100;
                p.phase = 'writing';
                window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
                    `💡 【${p.title}】构思完成！进入撰写阶段。`, 'normal');
                // 涨洞察力经验
                if (insightMember) this.addAptExp(insightMember.id, 'insight', 5);
                if (theoryMember) this.addAptExp(theoryMember.id, 'insight', 3);
            }
        } else if (p.phase === 'writing') {
            // 撰写阶段：数据分析力推进
            const lead = this.members.find(m => m.id === p.leadId);
            let speed = 6.0; // 每天基准进度
            if (lead) speed *= window.characterManager.getMemberAptMult(lead, 'analysis');
            // 共同一作加速
            const co = this.members.find(m => m.id === p.coId);
            if (co) {
                speed *= 1.2;
                if (lead && (lead.coAuthorId === co.id || co.coAuthorId === lead.id)) speed *= 1.15;
            }

            p.writingProgress += deltaDays * speed;

            // 阶段切换
            if (p.writingProgress >= 35 && p.writingStage === 'theory') {
                p.writingStage = 'plotting';
                window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
                    `📊 【${p.title}】理论推导完成，进入图表排版阶段！`, 'normal');
            } else if (p.writingProgress >= 70 && p.writingStage === 'plotting') {
                p.writingStage = 'review';
                window.eventEngine.addLog(this.time.year, this.time.month, this.getDateStr(),
                    `📬 【${p.title}】投稿《${this._getJournalName(p)}》（${p.zoneName}），进入同行盲审！`, 'normal');
            } else if (p.writingProgress >= 100) {
                p.writingProgress = 100;
                p.phase = 'review';
                p.reviewProgress = 0;
                // 涨分析力经验
                if (lead) this.addAptExp(lead.id, 'analysis', 8);
                if (co) this.addAptExp(co.id, 'lab', 5);
            }
        } else if (p.phase === 'review') {
            // 审稿阶段：推进审稿进度
            p.reviewProgress += deltaDays * 5.0;

            const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

            // 审稿进度过半时，触发一次抢手随机决策事件（借鉴读博模拟器）
            if (!p.reviewEventFired && p.reviewProgress >= 50) {
                p.reviewEventFired = true;
                p.reviewEventPending = true;
                p.reviewEventAt = now;
                const evt = this._rollReviewEvent(p);
                p.reviewEventData = evt;
                window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
                    `⚡ 审稿风暴！《${this._getJournalName(p)}》审稿人提出状况，需你决策！`, 'normal');
                if (window.ui && window.ui.showReviewEvent) {
                    window.ui.showReviewEvent(evt);
                }
            }

            // 审稿事件超时保护：15秒未处理自动解除挂起（玩家可能忽略了弹窗）
            if (p.reviewEventPending && p.reviewEventAt && (now - p.reviewEventAt) > 15000) {
                p.reviewEventPending = false;
            }

            // 进度满 100 必须强制结算（无论是否有挂起事件，防止卡死超100%）
            if (p.reviewProgress >= 100) {
                p.reviewProgress = 100;
                if (p.reviewEventPending) p.reviewEventPending = false;
                this._finishPaper();
                return;
            }

            // 有挂起审稿事件则等待处理
            if (p.reviewEventPending) return;
        }
    }

    _getJournalName(p) {
        const topic = GAME_DATA.paperTopics.find(t => t.id === p.topicId);
        if (!topic || !topic.journalNames) return p.zoneName;
        const key = p.zoneKey === 'supreme' ? 'supreme' : String({ 'zone4': 4, 'zone3': 3, 'zone2': 2, 'zone1': 1 }[p.zoneKey]);
        return topic.journalNames[key] || p.zoneName;
    }

    // 随机抽一个审稿抢手事件
    _rollReviewEvent(p) {
        const events = [
            { id: 'rev_supplement', title: '📊 审稿人要求补关键实验', desc: `编辑要求补充一组关键对比数据，才能继续审稿。`,
              choices: [
                { label: '花 5 万买试剂补数据', cost: 5, effect: () => ({ boost: 20, text: '✅ 补上数据，综合评价大涨！' }) },
                { label: '用现有数据硬解释', effect: () => ({ boost: -10, text: '⚠️ 解释略显牵强，评价略受损。' }) }
              ]},
            { id: 'rev_rival', title: '🔥 撞车！有人刚发表同类工作', desc: '审稿人告知有课题组发表了高度相似工作，问你如何回应。',
              choices: [
                { label: '据理力争，强调机理创新', effect: () => ({ boost: 15, text: '✅ 强调机理差异，编委认可创新点！' }) },
                { label: '低调回应，听天由命', effect: () => ({ boost: -5, text: '😔 回应平淡，优势被削弱。' }) }
              ]},
            { id: 'rev_mentor', title: '👨‍🏫 审稿人建议换理论框架', desc: '资深审稿人建议换个理论框架重写部分内容。',
              choices: [
                { label: '花 2 万重跑部分计算', cost: 2, effect: () => ({ boost: 18, text: '✅ 按建议加强理论，评价上升！' }) },
                { label: '坚持原方案', effect: () => ({ boost: 0, text: '↔️ 维持原样，评价不变。' }) }
              ]},
            { id: 'rev_typo', title: '✍️ 审稿人批注大量文字错误', desc: '审稿人指出图表配色与行文多处问题，认为不够严谨。',
              choices: [
                { label: '花 1 万精修重排', cost: 1, effect: () => ({ boost: 12, text: '✅ 精修后观感大好！' }) },
                { label: '敷衍改几处就提交', effect: () => ({ boost: -8, text: '😖 敷衍应对，观感不佳。' }) }
              ]},
            { id: 'rev_plot', title: '🧪 关键机理被质疑', desc: '审稿人质疑数据解释的物理机制，要求更强证据链。',
              choices: [
                { label: '花 4 万做原位表征', cost: 4, effect: () => ({ boost: 22, text: '✅ 原位数据一锤定音，机制坐实！' }) },
                { label: '引用文献硬撑', effect: () => ({ boost: 3, text: '📚 引用文献补了补，勉强过关。' }) }
              ]}
        ];
        return events[Math.floor(Math.random() * events.length)];
    }

    // 处理审稿事件选择
    resolveReviewEvent(choiceIndex) {
        const p = this.currentPaperProject;
        if (!p || !p.reviewEventPending) return;
        const event = p.reviewEventData;
        if (!event) { p.reviewEventPending = false; return; }
        const choice = event.choices[choiceIndex];
        if (!choice) { p.reviewEventPending = false; return; }
        if (choice.cost && this.funding < choice.cost) {
            if (window.ui) window.ui.toast('经费不足！');
            return;
        }
        if (choice.cost) this.funding -= choice.cost;
        const result = choice.effect(this);
        p.reviewEventPending = false;
        p.reviewEventBoost = (p.reviewEventBoost || 0) + result.boost;
        window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
            `⚡ [${event.title}] ${result.text} 综合度 ${result.boost >= 0 ? '+' : ''}${result.boost}`, 'normal');
        this.saveGame();
        if (window.ui) window.ui.closeModal('modal-revevent');
    }

    _calcPaperScore() {
        const p = this.currentPaperProject;
        if (!p) return 0;
        let combo = this._getFinalCombo();
        combo += (p.reviewEventBoost || 0);
        return Math.min(115, combo);
    }

    _finishPaper() {
        const p = this.currentPaperProject;
        if (!p) return;
        const combo = this._calcPaperScore();
        p.reviewScore = Math.round(combo);

        const accepted = this._getReviewAccepted(p);
        const journalName = this._getJournalName(p);
        const lead = this.members.find(m => m.id === p.leadId);

        if (accepted) {
            this.funding += p.rewardFunding;
            this.prestige += p.rewardPrestige;
            this.lastMonthStats.funding += p.rewardFunding;
            this.lastMonthStats.papers++;
            this.publishedPapers.push({
                id: 'paper_' + Date.now(), title: p.title, zoneKey: p.zoneKey, zoneName: p.zoneName,
                journal: journalName, score: Math.round(combo),
                leadName: lead ? lead.name : '?',
                coName: p.coId ? (this.members.find(m => m.id === p.coId) || {}).name : null,
                year: this.time.year, month: this.time.month
            });
            if (window.soundEngine) window.soundEngine.playPaperAccept(p.zoneKey);
            window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
                `🎉 【${p.title}】以【${p.zoneName}】发表于《${journalName}》！经费 +${p.rewardFunding}万，声望 +${p.rewardPrestige}！(综合度${Math.round(combo)})`, 'accept');
            if (lead) this.addAptExp(lead.id, 'insight', 10);
        } else {
            this.lessonPoints += 3;
            if (this.lessonPoints >= 10) {
                this.lessonPoints -= 10;
                this.reviewBonus += 3;
                window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
                    `📚 教训值兑换审稿加成 +3！`, 'normal');
            }
            const zone = GAME_DATA.paperZones.find(z => z.id === p.zoneKey);
            if (window.soundEngine) window.soundEngine.playPaperReject();
            window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
                `💔 【${p.title}】冲【${p.zoneName}】被拒（综合度${Math.round(combo)}/需${zone ? zone.requireCombo : 0}），教训值 +3。下次可降档提升成功率。`, 'reject');
            if (lead) this.addAptExp(lead.id, 'analysis', 3);
        }

        this.currentPaperProject = null;
        this._checkQuestProgress();
        this.checkAchievements();
        this._checkMilestoneUnlocks();
        this.saveGame();
    }

    // 按投递分区 + 综合度 计算录用（有不确定性，能力越强概率越高）
    _getReviewAccepted(p) {
        if (this.instantAcceptReady) {
            this.instantAcceptReady = false;
            return true;
        }
        const zone = GAME_DATA.paperZones.find(z => z.id === p.zoneKey);
        if (!zone) return false;
        let rate = zone.baseSuccess;
        rate += (p.reviewScore - zone.requireCombo) * 0.012; // 每超1点综合度 +1.2% 概率
        rate = Math.max(0.02, Math.min(0.99, rate));
        return Math.random() < rate;
    }

    // ==================== 季度报告 ====================
    _triggerQuarterlyReport() {
        const report = window.eventEngine.generateMonthlyReport(this);

        // 汇总写入日志（安静记录，不弹窗）
        for (let line of report.summary) {
            window.eventEngine.addLog(this.time.year, this.time.month, '报告', `📊 ${line}`, 'normal');
        }

        // 处理自动事件
        for (let evt of report.events) {
            if (evt.type === 'auto') {
                window.eventEngine.resolveAutoEvent(evt, this);
            }
        }

        // 有需要选择的事件才弹窗，否则仅 toast 轻提示
        if (window.ui && window.ui.showMonthlyReport) {
            window.ui.showMonthlyReport(report);
        }
        this._resetMonthStats();
    }

    // ==================== 主线任务 ====================
    _checkQuestProgress() {
        const quest = GAME_DATA.mainQuests[this.currentQuestIndex];
        if (!quest) return;
        let done = false;
        if (quest.targetType === 'inventory_precursors' && (this.inventory.precursors || 0) >= quest.targetVal) done = true;
        else if (quest.targetType === 'inventory_films' && (this.inventory.films || 0) >= quest.targetVal) done = true;
        else if (quest.targetType === 'papers_count' && this.publishedPapers.length >= quest.targetVal) done = true;
        else if (quest.targetType === 'members_count' && this.members.length >= quest.targetVal) done = true;
        else if (quest.targetType === 'stations_count' && this.stationInstances.length >= quest.targetVal) done = true;
        else if (quest.targetType === 'has_advanced_eq' && this.stationInstances.some(i => i.eqId === 'xeon_server' || i.eqId === 'qe_pro_spec')) done = true;
        else if (quest.targetType === 'has_top_paper' && this.publishedPapers.some(p => p.zoneKey === 'zone1' || p.zoneKey === 'supreme')) done = true;
        else if (quest.targetType === 'grand_theory' && this.publishedPapers.some(p => p.zoneKey === 'supreme')) done = true;
        if (done) this._completeQuest();
    }

    _completeQuest() {
        const q = GAME_DATA.mainQuests[this.currentQuestIndex];
        if (!q) return;
        if (q.rewardFunding) this.funding += q.rewardFunding;
        if (q.rewardPrestige) this.prestige += q.rewardPrestige;

        // 阶段升级
        if (this.currentQuestIndex === 1 && this.labStage < 2) {
            this.labStage = 2;
            window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
                `🎉 晋升【阶段2】！解锁招生与人际网！`, 'accept');
        } else if (this.currentQuestIndex === 4 && this.labStage < 3) {
            this.labStage = 3;
            window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
                `🌟 晋升【阶段3：前沿重点实验室】！`, 'accept');
        } else if (this.currentQuestIndex === 5 && this.labStage < 4) {
            this.labStage = 4;
            window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
                `👑 晋升【阶段4：国家级工程中心】！`, 'accept');
        }

        window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
            `🎯 达成【${q.title}】！${q.rewardText}`, 'accept');
        this.currentQuestIndex++;
        this.saveGame();
    }

    // ==================== 口令码 ====================
    redeemCode(rawCode) {
        const code = (rawCode || '').trim().toUpperCase();
        const gift = GAME_DATA.secretCodes[code];
        if (!gift) return { error: '无效口令码！' };
        if (gift.funding) this.funding += gift.funding;
        if (gift.coffee) this.inventory.coffee += gift.coffee;
        if (gift.films) this.inventory.films += gift.films;
        if (gift.spectra) this.inventory.spectra += gift.spectra;
        if (gift.uvData) this.inventory.uvData += gift.uvData;
        if (gift.compute) this.inventory.compute += gift.compute;
        if (gift.instantAccept) this.instantAcceptReady = true;
        if (gift.unlockAll) {
            this.allUnlocked = true;
            for (let leg of GAME_DATA.legendaryMembers) {
                if (!this.unlockedLegendary.includes(leg.id)) {
                    this.unlockedLegendary.push(leg.id);
                }
            }
            this._checkMilestoneUnlocks();
        }
        window.eventEngine.addLog(this.time.year, this.time.month, this.getTenDayStr(),
            `🎁 兑换口令码【${code}】！${gift.desc}`, 'accept');
        this.saveGame();
        return { success: true };
    }

    // ==================== 存档 ====================
    saveGame() {
        if (this._isResetting) return;
        try {
            localStorage.setItem(this.saveKey, JSON.stringify({
                labName: this.labName, labStage: this.labStage, currentQuestIndex: this.currentQuestIndex,
                funding: this.funding, prestige: this.prestige,
                members: this.members, rosterAvailable: this.rosterAvailable,
                unlockedLegendary: this.unlockedLegendary, allUnlocked: this.allUnlocked || false,
                stationInstances: this.stationInstances,
                inventory: this.inventory, currentPaperProject: this.currentPaperProject,
                publishedPapers: this.publishedPapers,
                time: this.time, buffs: this.buffs,
                lessonPoints: this.lessonPoints, reviewBonus: this.reviewBonus,
                instantAcceptReady: this.instantAcceptReady,
                manualClicks: this.manualClicks || 0,
                maxCombo: this.maxCombo || 0,
                autoClicks: this.autoClicks || 0,
                mentorLevel: this.mentorLevel || 1,
                activeClickTarget: this.activeClickTarget || 'films',
                activeCandidates: this.activeCandidates || [],
                achievements: this.achievements || [],
                logs: window.eventEngine ? window.eventEngine.recentLogs : []
            }));
        } catch (e) { console.error('存档失败', e); }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem(this.saveKey);
            if (!raw) return false;
            const d = JSON.parse(raw);
            if (!d) return false;
            Object.assign(this, d);
            this.allUnlocked = d.allUnlocked || false;
            this.mentorLevel = d.mentorLevel || 1;
            this.activeClickTarget = d.activeClickTarget || 'films';
            this.achievements = d.achievements || [];
            this.manualClicks = d.manualClicks || 0;
            this.maxCombo = d.maxCombo || 0;
            this.autoClicks = d.autoClicks || 0;
            this.activeCandidates = d.activeCandidates || [];
            this._migrateRosterNames();
            if (window.eventEngine && d.logs) window.eventEngine.recentLogs = d.logs;
            return true;
        } catch (e) { console.error('读档失败', e); return false; }
    }

    _migrateRosterNames() {
        const nameMap = {
            '艾明': '艾铭', '边鹤': '边贺', '边紫风': '边紫枫', '毕旭同': '毕旭彤',
            '成欣慧': '成馨慧', '褚士文': '褚仕文', '耿英凯': '耿英恺', '郭青': '郭卿',
            '孔令雨': '孔令羽', '梁涛': '梁滔', '梁正军': '梁政军', '李辉': '李晖',
            '李京怀': '李经怀', '李乐金': '李乐鑫', '栗龙博': '栗隆博', '李梦亚': '李萌亚',
            '李琴': '李沁', '刘宽': '刘恺', '刘念': '刘恬念', '刘庆航': '刘清航',
            '刘硕': '刘烁', '刘恬园': '刘恬媛', '李云龙': '李云隆', '罗长乐': '罗畅乐',
            '卢亚茹': '卢娅茹', '马俊妍': '马骏妍', '苗萌然': '苗梦然', '宁伟强': '宁维强',
            '彭豪杰': '彭豪捷', '蒲筱蕊': '蒲晓蕊', '曲佳音': '曲嘉音', '宋菁豪': '宋敬豪',
            '苏志存': '苏志纯', '王浩': '王昊', '王佳佳': '王嘉佳', '王森森': '王三森',
            '王泽文': '王择文', '文星亭': '文星婷', '吴欣悦': '吴心悦', '杨源': '杨渊',
            '闫佳怡': '闫嘉怡', '姚格': '姚鸽', '宰永杰': '宰永捷', '赵萌松': '赵萌淞',
            '赵阳洁': '赵扬洁'
        };
        for (let m of (this.members || [])) {
            if (nameMap[m.name]) m.name = nameMap[m.name];
        }
        const recruitedNames = (this.members || []).map(m => m.name);
        this.rosterAvailable = GAME_DATA.labRosterPool.filter(n => !recruitedNames.includes(n));
    }

    // ==================== 跨域/跨设备导出与导入超紧凑存档码 / 文件 ====================
    _serializeUltraSlimSave() {
        const inv = {};
        for (let [k, v] of Object.entries(this.inventory || {})) {
            if (v && v > 0) inv[k] = Math.round(v * 10) / 10;
        }

        const members = (this.members || []).map(m => {
            const arr = [m.id, m.name, m.gradeYear || 1, m.assignedStationId || ''];
            const hasApt = m.aptRanks && Object.values(m.aptRanks).some(r => r !== 'D');
            const hasExp = m.aptExp && Object.values(m.aptExp).some(e => e > 0);
            if (hasApt || hasExp) {
                arr.push(m.aptRanks);
                arr.push(m.aptExp);
            }
            return arr;
        });

        const stations = (this.stationInstances || []).map(s => [
            s.instanceId, s.eqId, s.level, s.operatorId || '', s.switchMode || '', s.tradeoffMode || ''
        ]);

        const papers = (this.publishedPapers || []).map(p => [
            p.title, p.zoneKey, p.journal, p.score, p.leadName, p.year, p.month
        ]);

        return {
            v: 2,
            n: this.labName === 'X-Opto 课题组' ? undefined : this.labName,
            s: this.labStage,
            q: this.currentQuestIndex,
            f: Math.round((this.funding || 0) * 100) / 100,
            p: this.prestige || 0,
            m: members,
            st: stations.length > 0 ? stations : undefined,
            inv: Object.keys(inv).length > 0 ? inv : undefined,
            pp: papers.length > 0 ? papers : undefined,
            t: [this.time.year, this.time.month, this.time.day, this.time.speed || 1],
            u: (this.unlockedLegendary || []).length > 0 ? this.unlockedLegendary : undefined,
            all: this.allUnlocked ? 1 : undefined,
            ml: this.mentorLevel || 1,
            at: this.activeClickTarget || 'films',
            ach: (this.achievements || []).length > 0 ? this.achievements : undefined,
            lp: this.lessonPoints || undefined,
            rb: this.reviewBonus || undefined,
            ia: this.instantAcceptReady ? 1 : undefined
        };
    }

    _deserializeUltraSlimSave(obj) {
        if (!obj || typeof obj !== 'object') return false;
        this.labName = obj.n || 'X-Opto 课题组';
        this.labStage = obj.s || 1;
        this.currentQuestIndex = obj.q !== undefined ? obj.q : 0;
        this.funding = obj.f || 0;
        this.prestige = obj.p || 0;
        this.allUnlocked = !!obj.all;
        this.unlockedLegendary = obj.u || [];
        this.mentorLevel = obj.ml || 1;
        this.activeClickTarget = obj.at || 'films';
        this.achievements = obj.ach || [];
        this.lessonPoints = obj.lp || 0;
        this.reviewBonus = obj.rb || 0;
        this.instantAcceptReady = !!obj.ia;

        if (obj.t && Array.isArray(obj.t)) {
            this.time = { year: obj.t[0] || 1, month: obj.t[1] || 9, day: obj.t[2] || 1, speed: obj.t[3] || 1 };
        }

        // Inventory
        this.inventory = { precursors: 0, films: 0, xrdData: 0, absData: 0, uvData: 0, spectra: 0, compute: 0, devices: 0, imaging: 0, coffee: 0 };
        if (obj.inv) {
            Object.assign(this.inventory, obj.inv);
        }

        // Members
        const cm = window.characterManager;
        this.members = (obj.m || []).map(item => {
            let id, name, gradeYear, assignedStationId, aptRanks, aptExp;
            if (Array.isArray(item)) {
                [id, name, gradeYear, assignedStationId, aptRanks, aptExp] = item;
            } else {
                id = item.id; name = item.name; gradeYear = item.gradeYear; assignedStationId = item.assignedStationId;
                aptRanks = item.aptRanks; aptExp = item.aptExp;
            }
            let mem;
            if (id === 'starter_rookie') {
                mem = cm ? cm.createStarter() : { id, name, avatar: '🧑‍🎓', tier: 'Normal' };
            } else {
                const leg = (GAME_DATA.legendaryMembers || []).find(l => l.id === id);
                if (leg) {
                    mem = cm ? cm.createLegendaryMember(leg) : { id, name, avatar: leg.avatar, tier: leg.tier };
                } else {
                    mem = cm ? cm.createRosterMember(name) : { id, name, avatar: '🧑‍🎓', tier: 'Normal' };
                }
            }
            if (!mem) mem = { id, name, avatar: '🧑‍🎓', tier: 'Normal' };
            mem.id = id;
            mem.name = name;
            if (gradeYear) mem.gradeYear = gradeYear;
            if (assignedStationId) mem.assignedStationId = assignedStationId;
            if (aptRanks) mem.aptRanks = aptRanks;
            if (aptExp) mem.aptExp = aptExp;
            if (cm) cm.ensureMemberApt(mem);
            return mem;
        });

        // Stations
        this.stationInstances = (obj.st || []).map(item => {
            if (Array.isArray(item)) {
                return {
                    instanceId: item[0], eqId: item[1], level: item[2] || 1,
                    operatorId: item[3] || null, switchMode: item[4] || null, tradeoffMode: item[5] || null,
                    batchCountdown: 0, rampupStreak: 0, brokenUntilDay: 0
                };
            }
            return item;
        });

        // Papers
        this.publishedPapers = (obj.pp || []).map(item => {
            if (Array.isArray(item)) {
                return {
                    id: 'paper_' + Math.random(),
                    title: item[0], zoneKey: item[1], journal: item[2], score: item[3],
                    leadName: item[4], year: item[5], month: item[6]
                };
            }
            return item;
        });

        this._migrateRosterNames();
        this.saveGame();
        return true;
    }

    exportSaveCode() {
        this.saveGame();
        try {
            const slim = this._serializeUltraSlimSave();
            const raw = JSON.stringify(slim);
            const utf8Bytes = new TextEncoder().encode(raw);
            let binary = '';
            for (let b of utf8Bytes) binary += String.fromCharCode(b);
            const b64 = btoa(binary);
            return 'XO_' + b64;
        } catch (e) {
            console.error('导出超紧凑存档码失败', e);
            return '';
        }
    }

    importSaveCode(codeStr) {
        if (!codeStr || typeof codeStr !== 'string') return { error: '请输入有效的存档码！' };
        let clean = codeStr.trim();
        if (clean.startsWith('XO_')) clean = clean.slice(3);
        else if (clean.startsWith('XOPTO_')) clean = clean.slice(6);

        try {
            let jsonStr = '';
            if (clean.startsWith('{')) {
                jsonStr = clean;
            } else {
                const binary = atob(clean);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                jsonStr = new TextDecoder().decode(bytes);
            }
            const data = JSON.parse(jsonStr);
            if (!data || typeof data !== 'object') {
                return { error: '存档码数据已损坏！' };
            }

            if (data.v === 2) {
                // Ultra-slim format
                this._deserializeUltraSlimSave(data);
            } else {
                // Legacy verbose format
                localStorage.setItem(this.saveKey, JSON.stringify(data));
                this.loadGame();
            }

            try {
                if (window.ui) {
                    window.ui.renderAll();
                    window.ui.toast('🎉 成功载入科研进度！');
                }
            } catch (uiErr) { console.warn('UI刷新提醒', uiErr); }
            return { success: true, labName: this.labName || '课题组' };
        } catch (e) {
            console.error('导入存档失败', e);
            return { error: '解析存档码失败，请检查是否完整复制！' };
        }
    }

    exportSaveJsonFile() {
        this.saveGame();
        try {
            const raw = localStorage.getItem(this.saveKey) || '{}';
            const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `XOptoLab_Save_${dateStr}.json`;
            const blob = new Blob([raw], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return { success: true, filename };
        } catch (e) {
            console.error('导出存档文件失败', e);
            return { error: '导出文件失败' };
        }
    }

    hardReset() {
        this._isResetting = true;
        this.hasStarted = false;
        try {
            localStorage.removeItem(this.saveKey);
            localStorage.clear();
        } catch (e) { console.error('清除存档失败', e); }
        location.reload();
    }
}

window.gameEngine = new GameEngine();
