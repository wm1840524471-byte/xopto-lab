/**
 * 《论如何建立一个课题组》 - 事件引擎
 * 日志系统 + 月报事件(带选择) + 随机学术人际事件
 */
class EventEngine {
    constructor() {
        this.recentLogs = [];
        this.maxLogs = 100;
        this.pendingMonthlyEvents = [];  // 待玩家处理的月报事件
        this.monthlyReport = null;        // 当前月报数据
    }

    // ==================== 日志系统 ====================
    addLog(year, month, tenDay, text, type = 'normal') {
        const timeStr = `${year}年${month}月${tenDay}`;
        this.recentLogs.unshift({ id: Date.now() + Math.random(), timeStr, text, type });
        if (this.recentLogs.length > this.maxLogs) this.recentLogs.pop();
        if (window.ui && window.ui.renderChronicle) window.ui.renderChronicle();
        return this.recentLogs[0];
    }

    // ==================== 月报系统 ====================
    // 每月底触发，生成月报 + 随机事件
    generateMonthlyReport(eng) {
        const report = {
            year: eng.time.year,
            month: eng.time.month,
            events: [],
            summary: this._generateSummary(eng)
        };

        // 随机抽 1-2 个事件
        const pool = [...GAME_DATA.monthlyEvents];
        const eventCount = Math.random() < 0.3 ? 2 : 1;
        for (let i = 0; i < eventCount && pool.length > 0; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            report.events.push(pool.splice(idx, 1)[0]);
        }

        this.monthlyReport = report;
        this.pendingMonthlyEvents = report.events.filter(e => e.type === 'choice');
        return report;
    }

    // 生成季度产出汇总
    _generateSummary(eng) {
        const s = eng.lastMonthStats || { produced: {}, funding: 0, papers: 0, aptGains: 0 };
        const lines = [];

        // 资源产出
        const resLines = [];
        for (let [key, val] of Object.entries(s.produced || {})) {
            if (val > 0) {
                const res = GAME_DATA.resources[key];
                if (res) resLines.push(`${res.icon} ${res.name} +${val.toFixed(1)}`);
            }
        }
        if (resLines.length > 0) lines.push('产出：' + resLines.join('、'));

        // 经费变动
        if (s.funding) lines.push(`经费变动：${s.funding > 0 ? '+' : ''}${s.funding.toFixed(1)} 万`);

        // 论文
        if (s.papers > 0) lines.push(`发表论文：${s.papers} 篇`);

        // 资质成长
        if (s.aptGains > 0) lines.push(`成员资质成长：${Math.floor(s.aptGains)} 次`);

        return lines.length > 0 ? lines : ['本季度平稳运行，无特殊事项。'];
    }

    // 处理自动事件
    resolveAutoEvent(event, eng) {
        if (event.type !== 'auto' || !event.resolve) return null;
        const result = event.resolve(eng);
        this.addLog(eng.time.year, eng.time.month, '月底', result.text, result.type || 'normal');
        return result;
    }

    // 处理选择事件
    resolveChoiceEvent(event, eng, choiceIndex) {
        if (event.type !== 'choice') return null;
        const choice = event.choices[choiceIndex];
        if (!choice) return null;
        if (choice.cost && eng.funding < choice.cost) {
            return { error: '经费不足！' };
        }
        const text = choice.effect(eng);
        this.addLog(eng.time.year, eng.time.month, '月底', `[${event.title}] ${text}`, 'normal');
        return { text };
    }

    // ==================== 随机学术人际事件 ====================
    triggerRandomAcademicEvent(year, month, tenDay, members, eng) {
        const active = members.filter(m => !m.isGraduated);
        if (active.length < 2) return;

        const rand = Math.random();

        // 1. 师承带教 (30%)：高年级带低年级，徒弟经验 ×1.5
        if (rand < 0.30) {
            const seniors = active.filter(m => m.gradeYear >= 2);
            const juniors = active.filter(m => m.gradeYear === 1);
            if (seniors.length > 0 && juniors.length > 0) {
                const senior = seniors[Math.floor(Math.random() * seniors.length)];
                const junior = juniors[Math.floor(Math.random() * juniors.length)];
                junior.mentorId = senior.id;
                eng.addAptExp(junior.id, 'lab', 4 * 1.5);
                eng.addAptExp(junior.id, 'theory', 3 * 1.5);
                this.addLog(year, month, tenDay,
                    `👨‍🏫 <b>${senior.name}</b> 手把手教 <b>${junior.name}</b> 调试仪器，徒弟经验获取 ×1.5！`,
                    'mentor');
            }
        }
        // 2. 共同一作搭档 (25%)：合作写论文速度 +35%
        else if (rand < 0.55) {
            const solos = active.filter(m => m.coAuthorId === null);
            if (solos.length >= 2) {
                const m1 = solos[Math.floor(Math.random() * solos.length)];
                const pool = solos.filter(m => m.id !== m1.id);
                if (pool.length > 0) {
                    const m2 = pool[Math.floor(Math.random() * pool.length)];
                    m1.coAuthorId = m2.id;
                    m2.coAuthorId = m1.id;
                    this.addLog(year, month, tenDay,
                        `🤝 <b>${m1.name}</b> 与 <b>${m2.name}</b> 碰撞灵感，结为【共同一作搭档】！论文速度 +35%！`,
                        'coauthor');
                }
            }
        }
        // 3. 抢仪器宿敌 (20%)：互卷，产出微升但心情下降
        else if (rand < 0.75) {
            const m1 = active[Math.floor(Math.random() * active.length)];
            const others = active.filter(m => m.id !== m1.id);
            if (others.length > 0) {
                const m2 = others[Math.floor(Math.random() * others.length)];
                m1.rivalId = m2.id;
                m2.moodBonus = Math.max(-15, m2.moodBonus - 3);
                eng.addAptExp(m1.id, 'lab', 2);
                this.addLog(year, month, tenDay,
                    `💻 <b>${m1.name}</b> 占满仪器排期，<b>${m2.name}</b> 被迫推迟，两人激烈协商！`,
                    'rival');
            }
        }
        // 4. 深夜干饭搭子 (25%)：心情大涨
        else {
            const m1 = active[Math.floor(Math.random() * active.length)];
            const others = active.filter(m => m.id !== m1.id);
            if (others.length > 0) {
                const m2 = others[Math.floor(Math.random() * others.length)];
                m1.mealBuddyId = m2.id;
                m2.mealBuddyId = m1.id;
                m1.moodBonus = Math.min(20, m1.moodBonus + 8);
                m2.moodBonus = Math.min(20, m2.moodBonus + 8);
                this.addLog(year, month, tenDay,
                    `🍗 <b>${m1.name}</b> 与 <b>${m2.name}</b> 做完实验去吃夜宵，结为【深夜干饭搭子】！心情大好！`,
                    'meal');
            }
        }
    }
}

window.eventEngine = new EventEngine();
