/**
 * 《论如何建立一个课题组 · X-Opto Lab》 - UI 控制器
 * 数据看板风：实时资源面板 / 工位卡片 / 资质面板 / 论文立项 / 月报弹窗 / 飞字动画
 */
class UIController {
    constructor() {
        this.currentTab = 'stations';
        this.assigningInstanceId = null;
        this.paperTopicSelected = null;
        this.paperSlots = { leadId: null, coId: null, theoryId: null, testingId: null };
        this.pickingRole = null;
    }

    init() {
        this.renderAll();
        window.addEventListener('mouseup', () => this.stopHoldClick());
        window.addEventListener('touchend', () => this.stopHoldClick());
        window.addEventListener('touchcancel', () => this.stopHoldClick());
    }

    renderAll() {
        this.renderTopBar();
        this.renderResourcePanel();
        this.renderBuffBar();
        this.renderQuestBar();
        this.renderTab(this.currentTab);
    }

    // ==================== 顶部状态栏 ====================
    renderTopBar() {
        const e = window.gameEngine;
        const el = id => document.getElementById(id);
        if (el('lab-name')) el('lab-name').innerText = e.labName;
        const g = e.getLabGradeObj();
        if (el('lab-grade')) el('lab-grade').innerText = `${g.grade} · ${g.desc}`;
        if (el('stat-funding')) el('stat-funding').innerText = e.funding.toFixed(1);
        if (el('stat-prestige')) el('stat-prestige').innerText = e.prestige;
        if (el('stat-time')) el('stat-time').innerText = `第${e.time.year}年${e.time.month}月${e.time.day || 1}日`;
        const btnSpeed = el('btn-speed');
        if (btnSpeed) {
            btnSpeed.innerText = `⚡ x${e.time.speed || 1}`;
            btnSpeed.className = `ctrl-btn ${e.time.speed > 1 ? 'btn-speed-active' : ''}`;
        }
    }

    // ==================== 资源面板（仅展示已探知/已解锁的资源） ====================
    renderResourcePanel() {
        const e = window.gameEngine;
        const panel = document.getElementById('resource-panel');
        if (!panel) return;
        let html = '';
        for (let [key, res] of Object.entries(GAME_DATA.resources)) {
            if (!e.isResourceUnlocked(key)) continue; // 未解锁资源隐形不展示
            const val = Math.floor(e.inventory[key] || 0);
            html += `<div class="res-chip" id="res-chip-${key}">
                <span class="res-chip-icon">${res.icon}</span>
                <span class="res-chip-val" style="color:${res.color}">${val}</span>
                <span class="res-chip-name">${res.name}</span>
            </div>`;
        }
        panel.innerHTML = html;
    }

    // ==================== Buff 条 ====================
    renderBuffBar() {
        const e = window.gameEngine;
        const bar = document.getElementById('buff-bar');
        if (!bar) return;
        let html = '';
        if (e.buffs.coffee > 0) html += `<span class="buff-tag buff-coffee">☕ 加速×1.5 (${e.buffs.coffee}天)</span>`;
        if (e.buffs.teamBuilding > 0) html += `<span class="buff-tag buff-team">🍻 团建+15% (${e.buffs.teamBuilding}天)</span>`;
        if (html) { bar.innerHTML = html; bar.style.display = 'flex'; }
        else bar.style.display = 'none';
    }

    // ==================== 主线任务条 ====================
    renderQuestBar() {
        const e = window.gameEngine;
        const bar = document.getElementById('quest-bar');
        if (!bar) return;
        const q = GAME_DATA.mainQuests[e.currentQuestIndex];
        if (!q) { bar.innerHTML = `<div class="quest-tag">🏆 终极目标达成</div><div class="quest-text">已建成世界顶尖工程中心！</div>`; return; }

        let progress = 0, progressText = '';
        let jumpTab = 'stations';
        let jumpBtnText = '👉 立即前往';

        if (q.targetType === 'inventory_precursors') {
            const cur = Math.floor(e.inventory.precursors || 0);
            progress = Math.min(100, cur / q.targetVal * 100);
            progressText = `${cur}/${q.targetVal}`;
            jumpTab = 'stations';
            jumpBtnText = cur >= q.targetVal ? '📦 出库变现' : '🎯 点击配制';
        }
        else if (q.targetType === 'inventory_films') {
            const cur = Math.floor(e.inventory.films || 0);
            progress = Math.min(100, cur / q.targetVal * 100);
            progressText = `${cur}/${q.targetVal}`;
            jumpTab = 'stations';
            jumpBtnText = '🧤 旋涂制膜';
        }
        else if (q.targetType === 'papers_count' || q.targetType === 'has_top_paper' || q.targetType === 'grand_theory') {
            const cur = e.publishedPapers.length;
            progress = Math.min(100, cur / q.targetVal * 100);
            progressText = `${cur}/${q.targetVal}`;
            jumpTab = 'paper';
            jumpBtnText = '📝 立项开题';
        }
        else if (q.targetType === 'members_count') {
            const cur = e.members.length;
            progress = Math.min(100, cur / q.targetVal * 100);
            progressText = `${cur}/${q.targetVal}`;
            jumpTab = 'hr';
            jumpBtnText = '👥 招纳同门';
        }
        else if (q.targetType === 'stations_count' || q.targetType === 'has_advanced_eq') {
            const cur = e.stationInstances.length;
            progress = Math.min(100, cur / q.targetVal * 100);
            progressText = `${cur}/${q.targetVal}`;
            jumpTab = 'shop';
            jumpBtnText = '🛒 选购仪器';
        }

        bar.innerHTML = `
            <div class="quest-top-row">
                <div class="quest-tag">🎯 主线任务：${q.title}</div>
                <button class="btn-quest-jump" onclick="window.ui.jumpToQuest('${jumpTab}', '${q.targetType}')">${jumpBtnText}</button>
            </div>
            <div class="quest-text">${q.desc} <b>(${progressText})</b></div>
            <div class="quest-progress">奖励：${q.rewardText}</div>
            <div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${progress}%"></div></div>
        `;
    }

    jumpToQuest(tab, targetType) {
        if (window.soundEngine) window.soundEngine.playClick();
        this.switchTab(tab);

        // 高亮目标组件
        setTimeout(() => {
            if (tab === 'stations') {
                const target = document.getElementById('research-click-console');
                if (target) {
                    target.classList.add('newbie-spotlight');
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => target.classList.remove('newbie-spotlight'), 3000);
                }
                this.toast('👆 长按或连续点击中央实验台配制试剂！');
            } else if (tab === 'shop') {
                this.toast('💡 选购满足当前研究阶段的科研仪器！');
            } else if (tab === 'hr') {
                this.toast('💡 发布保研宣讲，面试录取同门入组！');
            } else if (tab === 'paper') {
                this.toast('💡 选拔作者团队并投入数据，冲击顶刊！');
            }
        }, 100);
    }

    openNewbieGuide() {
        if (window.soundEngine) window.soundEngine.playClick();
        this.openModal('modal-newbie-guide');
    }

    claimNewbieStarterPack() {
        const e = window.gameEngine;
        if (!localStorage.getItem('xopto_welcomed_gift')) {
            e.funding += 0.5;
            e.inventory.precursors = (e.inventory.precursors || 0) + 10;
            localStorage.setItem('xopto_welcomed_gift', '1');
            this.toast('🎉 0.5万启动经费与10份试剂已到账！请按指引开始科研！');
            if (window.soundEngine) window.soundEngine.playRecycle();
        }
        this.closeModal('modal-newbie-guide');
        this.switchTab('stations');
        setTimeout(() => {
            const target = document.getElementById('research-click-console');
            if (target) {
                target.classList.add('newbie-spotlight');
                setTimeout(() => target.classList.remove('newbie-spotlight'), 3500);
            }
        }, 150);
    }

    checkNewbieGuideOnStartup() {
        const e = window.gameEngine;
        // 如果是全新开局（发表论文为0且设备为0）且未展示过欢迎弹窗
        if (e.publishedPapers.length === 0 && e.stationInstances.length === 0 && !localStorage.getItem('xopto_welcomed_gift')) {
            setTimeout(() => {
                this.openModal('modal-newbie-guide');
            }, 500);
        }
    }

    // ==================== 切换 Tab ====================
    switchTab(tab) {
        if (this.currentTab !== tab && window.soundEngine) {
            window.soundEngine.playTabSwitch();
        }
        this.currentTab = tab;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.content-view').forEach(v => v.classList.toggle('active', v.id === `view-${tab}`));
        this.renderTab(tab);
    }

    renderTab(tab) {
        switch (tab) {
            case 'stations': this.renderStations(); break;
            case 'hr': this.renderHR(); break;
            case 'paper': this.renderPaper(); break;
            case 'shop': this.renderShop(); break;
            case 'network': this.renderNetwork(); break;
        }
    }

    // ==================== 实验室视图 ====================
    renderStations() {
        const e = window.gameEngine;
        const c = document.getElementById('stations-list');
        if (!c) return;

        const comboStage = e.getComboStage();
        const autoCPS = e.getLabAutoCPS();
        const autoPower = e.getLabAutoClickPower();
        const combo = e.combo || 0;
        const mentorTier = e.getMentorTier();
        const nextMentorTier = e.getNextMentorTier();
        const canAffordMentor = nextMentorTier && e.funding >= nextMentorTier.cost;

        let consoleHtml = `
            <div class="research-click-console ${comboStage.badgeClass}" id="research-click-console" onclick="window.ui.handleClickResearch(event)">
                <div class="click-console-header">
                    <div class="console-title">
                        <span class="console-pulse-icon">🔬</span>
                        <span class="console-name">导师指导科研台</span>
                        <span class="mentor-lvl-badge">Lv.${mentorTier.level} · ${mentorTier.name}</span>
                        <span class="combo-badge" id="click-combo-badge" style="background:${comboStage.color}22;color:${comboStage.color};border-color:${comboStage.color}">${comboStage.name}</span>
                    </div>
                    <div class="auto-cps-badge" id="click-auto-cps-badge">🤖 操作员自动连点: <b>${autoCPS.toFixed(1)}</b>次/秒 (+${autoPower.toFixed(2)}/s)</div>
                </div>

                <!-- 导师指导等级与升级栏 -->
                <div class="mentor-guidance-bar">
                    <div class="mentor-stat-hint">
                        <span class="m-perk">💥 威力 <b>${mentorTier.powerMult}x</b></span>
                        <span class="m-perk">⚡ 暴击 <b>+${((mentorTier.critBonus || 0) * 100).toFixed(0)}%</b></span>
                        <span class="m-perk">💡 论文 <b>${mentorTier.paperBoostMult}x</b></span>
                        <span class="m-desc">${mentorTier.desc}</span>
                        ${e.mentorUpgradeLuck > 0 && nextMentorTier ? `<span style="color:#fbbf24;font-size:10px;margin-left:4px">💡 领悟幸运保底: +${Math.round(e.mentorUpgradeLuck * 100)}%</span>` : ''}
                    </div>
                    ${(() => {
                        if (!nextMentorTier) return '<span class="mentor-max-tag">👑 宗师化境已登峰造极</span>';
                        const mDetail = e.getMentorUpgradeDetail();
                        const chance = mDetail ? Math.round(mDetail.totalChance * 100) : 100;
                        return `
                            <button class="btn-mentor-upgrade" onclick="event.stopPropagation(); window.ui.upgradeMentor()" ${!canAffordMentor ? 'disabled' : ''} title="升级成功率: ${chance}% (含保底幸运值)">
                                ⬆️ 升级示教 Lv.${nextMentorTier.level} (${nextMentorTier.cost}万 · ${chance}%)
                            </button>
                        `;
                    })()}
                </div>

                <!-- 靶向产物选择器（根据已开通设备动态激活） -->
                ${(() => {
                    const availableTargets = e.getAvailableClickTargets();
                    const activeTargetKey = e.activeClickTarget || 'films';
                    const activeObj = availableTargets.find(t => t.productKey === activeTargetKey) || availableTargets[0] || { productKey: 'films', name: '钙钛矿薄膜', icon: '🧤' };
                    const pills = availableTargets.map(t => {
                        const isSel = t.productKey === activeObj.productKey;
                        return `
                            <button class="btn-cts-pill ${isSel ? 'active' : ''}" 
                                    onclick="event.stopPropagation(); window.ui.setClickTarget('${t.productKey}')"
                                    title="指导产出：${t.name}（来自已购置设备【${t.eqName}】）">
                                <span class="cts-icon">${t.icon}</span>
                                <span class="cts-name">${t.name}</span>
                            </button>
                        `;
                    }).join('');

                    return `
                        <div class="click-target-selector">
                            <div class="cts-header">
                                <span class="cts-label">🎯 指导靶向产物（已解锁 ${availableTargets.length} 种）:</span>
                                <span class="cts-current">当前靶向: <b style="color:var(--gold)">${activeObj.icon} ${activeObj.name}</b></span>
                            </div>
                            <div class="cts-pills-row">
                                ${pills}
                            </div>
                        </div>

                        <div class="click-console-body">
                            <div class="click-tap-button"
                                 onmousedown="window.ui.startHoldClick(event)"
                                 onmouseup="window.ui.stopHoldClick(event)"
                                 onmouseleave="window.ui.stopHoldClick(event)"
                                 ontouchstart="window.ui.startHoldClick(event)"
                                 ontouchend="window.ui.stopHoldClick(event)"
                                 ontouchcancel="window.ui.stopHoldClick(event)">
                                <span class="tap-icon">${activeObj.icon || '👆'}</span>
                                <div class="tap-text-col">
                                    <div class="tap-main-text-row">
                                        <span class="tap-main-text">导师指导实验 · 产出【${activeObj.name}】</span>
                                        <span class="tap-mode-pill">⚡ 点击 / 按住持续科研</span>
                                    </div>
                                    <span class="tap-sub-text">${e.currentPaperProject ? '⚡ 持续按住或点击加速攻坚论文 DDL，并即时爆出实验数据！' : '⚡ 依据已解锁设备靶向指导，点击爆发连击 · 按住平稳科研！'}</span>
                                </div>
                            </div>
                            <div class="combo-gauge-row">
                                <span class="combo-count-text" id="click-combo-count">🔥 连击 <b>x${Math.floor(combo)}</b> (${comboStage.mult.toFixed(1)}x)</span>
                                <div class="combo-bar-wrap">
                                    <div class="combo-bar-fill" id="click-combo-bar-fill" style="width:${Math.min(100, (combo / 50) * 100)}%;background:${comboStage.color}"></div>
                                </div>
                            </div>
                        </div>
                    `;
                })()}
            </div>
        `;

        // 产学研薄膜样品回收面板 (1 份薄膜 = 10 元 / 0.001 万元)
        // ==================== 产学研多品类成果转化与样品技术转让面板 ====================
        const priceTable = GAME_DATA.recyclePrices || {};
        let totalRecycleStock = 0;
        let grandTotalYuan = 0;
        let activeRecycleRows = [];

        for (let [resKey, info] of Object.entries(priceTable)) {
            const isUnlocked = e.isResourceUnlocked(resKey);
            const stock = Math.floor(e.inventory[resKey] || 0);
            if (isUnlocked || stock > 0) {
                const itemYuan = stock * info.unitYuan;
                const itemWan = (stock * info.unitWan).toFixed(3);
                totalRecycleStock += stock;
                grandTotalYuan += itemYuan;
                activeRecycleRows.push(`
                    <div class="recycle-item-chip" id="ric-chip-${resKey}">
                        <div class="ric-header">
                            <span class="ric-icon">${info.icon}</span>
                            <div class="ric-title-col">
                                <span class="ric-name">${info.name}</span>
                                <span class="ric-price">${info.unitYuan}元/份 · <small>${info.desc}</small></span>
                            </div>
                            <span class="ric-stock-badge" id="ric-stock-${resKey}">余 <b>${stock}</b> 份</span>
                        </div>
                        <div class="ric-sub-bar">
                            <span class="ric-val-text" id="ric-val-${resKey}">可转让: <b style="color:var(--green)">+${itemYuan.toLocaleString()} 元</b> (${itemWan}万)</span>
                            <div class="ric-btn-group">
                                <button class="btn-ric-act" id="ric-btn-10-${resKey}" onclick="window.ui.recycleRes('${resKey}', 10)" ${stock < 10 ? 'disabled' : ''}>10份</button>
                                <button class="btn-ric-act" id="ric-btn-50-${resKey}" onclick="window.ui.recycleRes('${resKey}', 50)" ${stock < 50 ? 'disabled' : ''}>50份</button>
                                <button class="btn-ric-act btn-ric-all" id="ric-btn-all-${resKey}" onclick="window.ui.recycleRes('${resKey}', 'all')" ${stock <= 0 ? 'disabled' : ''}>清仓</button>
                            </div>
                        </div>
                    </div>
                `);
            }
        }

        const grandTotalWan = (grandTotalYuan * 0.0001).toFixed(3);
        const recycleHtml = `
            <div class="recycle-panel" id="recycle-panel-container">
                <div class="recycle-header">
                    <div class="recycle-title">
                        <span class="recycle-icon">📦</span>
                        <div class="recycle-title-text">
                            <div class="rt-main">产学研成果转化与样品技术转让</div>
                            <div class="rt-sub">按样品获取难度阶梯定价 · 为实验室提供持续耗材补贴</div>
                        </div>
                    </div>
                    <div class="recycle-total-stat">
                        <span class="rts-label">当前全品类转让总值:</span>
                        <span class="rts-val" id="ric-grand-yuan">${grandTotalYuan.toLocaleString()} 元</span>
                        <span class="rts-wan" id="ric-grand-wan">(${grandTotalWan} 万元)</span>
                    </div>
                </div>

                ${activeRecycleRows.length > 0 ? `
                    <div class="recycle-items-grid" id="recycle-items-grid">
                        ${activeRecycleRows.join('')}
                    </div>
                    <div class="recycle-bottom-actions">
                        <button class="btn-recycle-grand" id="btn-recycle-grand" onclick="window.ui.recycleAll()" ${totalRecycleStock <= 0 ? 'disabled' : ''}>
                            ⚡ 产学研一键全品类清仓转让 (共 ${totalRecycleStock} 份 / 收益 +${grandTotalYuan.toLocaleString()} 元)
                        </button>
                    </div>
                ` : `
                    <div class="recycle-empty-tip">
                        🧪 暂无可转让库存（运转通风橱、手套箱或各大表征仪器产出样品与测试数据后，可在此一键转让变现经费）
                    </div>
                `}
            </div>
        `;

        if (e.stationInstances.length === 0) { 
            const emptyBanner = `
                <div class="empty-guide-banner">
                    <span style="font-size:28px">💡</span>
                    <div>
                        <div style="font-weight:800;font-size:13px;color:#f8fafc">当前实验室尚未添置大型科研设备</div>
                        <div style="font-size:11px;color:var(--text2);margin-top:4px;line-height:1.5">
                            ① 长按上方<b>【导师指导实验台】</b>配制前驱体；<br>
                            ② 在下方<b>【样品技术转让】</b>变现第一笔科研经费；<br>
                            ③ 点击下方按钮前往<b>【🛒 设备商城】</b>添置首台化学通风橱！
                        </div>
                    </div>
                </div>
            `;
            c.innerHTML = consoleHtml + recycleHtml + emptyBanner; 
        }

        // ==================== 仪器学科分类与状态统计大盘 ====================
        this.stationCategoryFilter = this.stationCategoryFilter || 'all';
        this.stationStatusFilter = this.stationStatusFilter || 'all';

        const totalCount = e.stationInstances.length;
        const runningCount = e.stationInstances.filter(s => s.operatorId && !s.brokenUntilDay && !s.isLackingMaterials).length;
        const vacantCount = e.stationInstances.filter(s => !s.operatorId).length;
        const lackingCount = e.stationInstances.filter(s => s.isLackingMaterials).length;

        // 分类胶囊
        const catPills = (GAME_DATA.equipmentCategories || []).map(cat => {
            let count = 0;
            if (cat.id === 'all') {
                count = totalCount;
            } else {
                count = e.stationInstances.filter(s => {
                    const eq = GAME_DATA.equipmentList.find(x => x.id === s.eqId);
                    return eq && eq.category === cat.id;
                }).length;
            }
            const isSel = this.stationCategoryFilter === cat.id;
            return `
                <button class="btn-eq-cat-pill ${isSel ? 'active' : ''}" onclick="window.ui.setStationCategoryFilter('${cat.id}')">
                    <span class="ecp-icon">${cat.icon}</span>
                    <span class="ecp-name">${cat.name}</span>
                    <span class="ecp-count">(${count})</span>
                </button>
            `;
        }).join('');

        // 状态过滤行
        const statusChips = `
            <div class="eq-status-filter-row">
                <button class="btn-status-chip ${this.stationStatusFilter === 'all' ? 'active' : ''}" onclick="window.ui.setStationStatusFilter('all')">全部状态 (${totalCount})</button>
                <button class="btn-status-chip chip-running ${this.stationStatusFilter === 'running' ? 'active' : ''}" onclick="window.ui.setStationStatusFilter('running')">🟢 运转中 (${runningCount})</button>
                <button class="btn-status-chip chip-vacant ${this.stationStatusFilter === 'vacant' ? 'active' : ''}" onclick="window.ui.setStationStatusFilter('vacant')">⚪ 空置待命 (${vacantCount})</button>
                ${lackingCount > 0 ? `<button class="btn-status-chip chip-lacking ${this.stationStatusFilter === 'lacking' ? 'active' : ''}" onclick="window.ui.setStationStatusFilter('lacking')">⚠️ 缺料 (${lackingCount})</button>` : ''}
            </div>
        `;

        const controlHubHtml = `
            <div class="eq-control-hub">
                <div class="ech-top-bar">
                    <div class="ech-title-col">
                        <span class="ech-title">🔬 实验室仪器集控大盘</span>
                        <span class="ech-sub">已部署 <b>${totalCount}</b> 台 · <b>${runningCount}</b> 台运转中 · <b>${vacantCount}</b> 台待命</span>
                    </div>
                    <button class="btn-open-matrix" onclick="window.ui.openEqMatrixModal()">📊 全景大盘</button>
                </div>
                <div class="eq-cat-pills-row">
                    ${catPills}
                </div>
                ${statusChips}
            </div>
        `;

        // 过滤设备实例
        const filteredInstances = e.stationInstances.filter(inst => {
            const eq = GAME_DATA.equipmentList.find(x => x.id === inst.eqId);
            if (!eq) return false;
            if (this.stationCategoryFilter !== 'all' && eq.category !== this.stationCategoryFilter) return false;
            const op = inst.operatorId ? e.members.find(m => m.id === inst.operatorId) : null;
            const isLacking = inst.isLackingMaterials;
            if (this.stationStatusFilter === 'running' && (!op || isLacking || inst.brokenUntilDay)) return false;
            if (this.stationStatusFilter === 'vacant' && op) return false;
            if (this.stationStatusFilter === 'lacking' && !isLacking) return false;
            return true;
        });

        let cardsHtml = '';
        if (filteredInstances.length === 0) {
            cardsHtml = `
                <div class="empty-filter-hint">
                    <span style="font-size:24px">🔍</span>
                    <div style="margin-top:4px">当前分类或状态筛选下无匹配仪器</div>
                    <button class="btn-reset-filters" onclick="window.ui.resetStationFilters()">重置筛选条件</button>
                </div>
            `;
        } else {
            cardsHtml = filteredInstances.map(inst => {
                const eq = GAME_DATA.equipmentList.find(x => x.id === inst.eqId);
                if (!eq || eq.type !== 'station') return '';
                const op = inst.operatorId ? e.members.find(m => m.id === inst.operatorId) : null;
                const fitInfo = e.getStationFitInfo(op, eq.id);
                const aptInfo = GAME_DATA.aptitudes[fitInfo.aptKey] || { name: '实验动手力', icon: '🔧' };
                const opCPS = op ? e.getMemberAutoCPS(op) : 0;

                const { amount: yieldDisplay } = e._calcYield(inst);

                let mechanicHint = '';
                let specialStatus = '';
                if (eq.mechanic === 'switch') {
                    const modeName = inst.switchMode === 'uvData' ? '日盲模式' : '可见光模式';
                    mechanicHint = `🔄 <b>${modeName}</b> · ${eq.mechanicDesc}`;
                } else if (eq.mechanic === 'tradeoff') {
                    const modeName = inst.tradeoffMode === 'low' ? '低温高质量' : '高温高产';
                    mechanicHint = `🌡️ <b>${modeName}</b> · ${eq.mechanicDesc}`;
                } else if (eq.mechanic === 'batch') {
                    mechanicHint = `📦 ${eq.mechanicDesc}`;
                    if (inst.batchCountdown > 0) specialStatus = `<div class="station-batch-hint">⏳ 批次预热中... 还需 ${inst.batchCountdown} 天就绪</div>`;
                } else if (eq.mechanic === 'rampup') {
                    mechanicHint = `📈 ${eq.mechanicDesc}`;
                    if (inst.rampupStreak > 0) specialStatus = `<div class="station-rampup-streak">🔥 连续运转 ${inst.rampupStreak} 天 · 连续产出加成 +${Math.round(inst.rampupStreak * 1.5)}%</div>`;
                } else if (eq.mechanic === 'inject') {
                    mechanicHint = `💉 ${eq.mechanicDesc}`;
                } else if (eq.mechanic === 'coffee') {
                    mechanicHint = `☕ ${eq.mechanicDesc}`;
                } else {
                    mechanicHint = `🔧 ${eq.mechanicDesc}`;
                }

                let modeBtn = '';
                if (eq.mechanic === 'switch' || eq.mechanic === 'tradeoff') {
                    modeBtn = `<button class="btn-station-sub" onclick="window.ui.switchMode('${inst.instanceId}')">🔄 切换模式</button>`;
                }

                let coffeeBtn = '';
                if (eq.mechanic === 'coffee') {
                    const beans = Math.floor(e.inventory.coffee || 0);
                    coffeeBtn = `<button class="btn-station-sub btn-coffee" onclick="window.ui.activateCoffee()" ${beans < 3 ? 'disabled' : ''}>☕ 全组提神加速 (需3豆/余${beans})</button>`;
                }

                let injectBtn = '';
                if (eq.mechanic === 'inject' && e.currentPaperProject) {
                    const compute = Math.floor(e.inventory.compute || 0);
                    injectBtn = `<button class="btn-station-sub btn-inject" onclick="window.ui.injectCompute()" ${compute < 10 ? 'disabled' : ''}>💉 算力注入论文 (需10点/余${compute})</button>`;
                }

                const upDetail = e.getStationUpgradeDetail(inst.instanceId);
                const isMax = upDetail ? upDetail.isMax : inst.level >= eq.maxLevel;
                const upgradeCost = upDetail ? upDetail.cost : eq.upgradeBaseCost * inst.level;
                const canAfford = e.funding >= upgradeCost;
                const upChancePercent = upDetail ? Math.round(upDetail.totalChance * 100) : 100;

                const isLacking = inst.isLackingMaterials;
                let liveClass = 'live-off';
                let liveText = '⚪ 工位空置';
                if (isLacking) {
                    liveClass = 'live-waiting';
                    liveText = '⚠️ 缺少原料待料中';
                } else if (op) {
                    liveClass = 'live-on';
                    liveText = '🟢 正常运转中';
                }

                return `
                    <div class="station-card ${isLacking ? 'station-card-lacking' : op ? 'station-card-running' : 'station-card-vacant'}" id="card-${inst.instanceId}">
                        <!-- 顶部状态与级别栏 -->
                        <div class="station-top-strip">
                            <div class="station-live-badge ${liveClass}">
                                <span class="live-dot"></span>
                                <span class="live-text">${liveText}</span>
                            </div>
                            <div class="station-top-right-group">
                                <div class="station-level-pill">Lv.${inst.level} <small>/${eq.maxLevel}</small></div>
                                <button class="btn-station-sell" onclick="event.stopPropagation(); window.ui.sellStationPrompt('${inst.instanceId}')" title="二手设备处置转让（退还80%经费）">♻️ 转让</button>
                            </div>
                        </div>

                        <!-- 主展示区：大图标 + 名称 + 产出值 (支持直接点击指导) -->
                        <div class="station-main-row" onclick="window.ui.handleClickStation('${inst.instanceId}', event)" title="⚡ 导师点击直接指导该设备实验（产出+连击+特效）">
                            <div class="station-icon-halo">
                                <span class="station-huge-icon">${eq.icon}</span>
                            </div>
                            <div class="station-primary-info">
                                <div class="station-big-name">${eq.name}</div>
                                <div class="station-yield-pill">
                                    <span class="syp-tag">连点流速:</span>
                                    <span class="syp-num">+${yieldDisplay.toFixed(2)}</span>
                                    <span class="syp-unit">${eq.productName} / 秒</span>
                                </div>
                            </div>
                        </div>

                        <!-- 上下游有机转化工艺配方 -->
                        <div class="station-recipe-pill">
                            <span class="srp-icon">⚗️</span>
                            <span class="srp-text"><b>转化工艺:</b> ${eq.recipeDesc || '独立合成产出'}</span>
                        </div>

                        <!-- 机制说明 -->
                        <div class="station-spec-banner">
                            <span class="ssb-icon">💡</span>
                            <span class="ssb-text">${mechanicHint}</span>
                        </div>
                        ${specialStatus}

                        <!-- 专属操作员执勤插槽 (人岗匹配与专精共振高亮) -->
                        ${(() => {
                            let avatarAnimClass = 'avatar-anim-empty';
                            if (op) {
                                if (eq.category === 'prep' || eq.id === 'fume_hood' || eq.id === 'glovebox_spin') avatarAnimClass = 'avatar-anim-pipette';
                                else if (eq.category === 'compute' || eq.id === 'xeon_server' || eq.id === 'hpc_gpu_cluster') avatarAnimClass = 'avatar-anim-coding';
                                else if (eq.category === 'service' || eq.id === 'coffee_machine') avatarAnimClass = 'avatar-anim-coffee';
                                else avatarAnimClass = 'avatar-anim-scanning';
                            }
                            return `
                                <div class="station-op-slot ${op ? `op-slot-active ${fitInfo.badgeClass}` : 'op-slot-empty'}" onclick="window.ui.openAssign('${inst.instanceId}')" title="${fitInfo.fitDesc || '点击指派或更换操作员'}">
                                    <div class="op-slot-left">
                                        <span class="op-slot-avatar ${avatarAnimClass}">${op ? op.avatar : '👤'}</span>
                                        <div class="op-slot-details">
                                            <div class="op-slot-name-row">
                                                <span class="op-slot-name">${op ? op.name : '<span style="color:#f59e0b">未指派操作员（点击指派 ➕）</span>'}</span>
                                                ${op ? `
                                                    <span class="op-apt-badge ${fitInfo.badgeClass}">${fitInfo.aptIcon} ${fitInfo.grade} · ${fitInfo.fitTag}</span>
                                                    <span class="op-cps-badge" title="操作员持续自动连点做实验">🤖 连点 ${opCPS.toFixed(1)} 击/秒</span>
                                                    ${fitInfo.hasTraitSynergy ? `<span class="op-trait-synergy" title="专属特质协同">🔥 特质×${fitInfo.traitMult.toFixed(1)}</span>` : ''}
                                                ` : ''}
                                            </div>
                                            <div class="op-slot-meta">${op ? `${op.grade} · 连点效能 ${fitInfo.totalFitMult.toFixed(2)}x · 自动代打实验中` : `核心匹配资质: ${aptInfo.icon} ${aptInfo.name}`}</div>
                                        </div>
                                    </div>
                                    <button class="btn-op-action" onclick="event.stopPropagation(); window.ui.openAssign('${inst.instanceId}')">
                                        ${op ? '更换 ✏️' : '指派 ➕'}
                                    </button>
                                </div>
                            `;
                        })()}

                        <!-- 底部操作与升级栏 -->
                        <div class="station-footer-actions">
                            ${modeBtn}
                            ${coffeeBtn}
                            ${injectBtn}
                            ${!isMax ? `
                                <button class="btn-station-upgrade" onclick="window.ui.upgrade('${inst.instanceId}')" ${!canAfford ? 'disabled' : ''} title="升级成功率: ${upChancePercent}% (含保底幸运值)">
                                    ⬆️ 强化 Lv.${inst.level+1} (${upgradeCost}万 · ${upChancePercent}%)
                                </button>
                            ` : '<span class="station-max-tag">👑 已升至最高阶</span>'}
                            ${inst.upgradeLuck > 0 && !isMax ? `
                                <div style="font-size:10px;color:#fbbf24;margin-top:2px;font-weight:600">💡 调试幸运保底: +${Math.round(inst.upgradeLuck * 100)}% 成功率</div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        c.innerHTML = consoleHtml + recycleHtml + controlHubHtml + `<div class="stations-grid">${cardsHtml}</div>`;
    }

    // ==================== 产学研多品类转化回收与一键清仓 ====================
    recycleRes(resKey, amount) {
        const e = window.gameEngine;
        const res = e.recycleResource(resKey, amount);
        if (res.error) {
            this.toast(res.error);
        } else {
            if (window.soundEngine) window.soundEngine.playRecycle();
            this.toast(`📦 成功出库 ${res.count} 份【${res.name}】，获得 +${res.yuan.toLocaleString()} 元（+${res.funding.toFixed(4)} 万元）！`);
            this.renderTopBar();
            this.renderResourcePanel();
            this.renderStations();
            this.renderQuestBar();
        }
    }

    recycleAll() {
        const e = window.gameEngine;
        const res = e.recycleAllResources();
        if (res.error) {
            this.toast(res.error);
        } else {
            if (window.soundEngine) window.soundEngine.playRecycle();
            this.toast(`⚡ 产学研全品类清仓转让成功！共获科研经费 +${res.totalYuan.toLocaleString()} 元（+${res.totalFunding.toFixed(4)} 万元）！`);
            this.renderTopBar();
            this.renderResourcePanel();
            this.renderStations();
            this.renderQuestBar();
        }
    }

    // 兼容薄膜调用
    recycleFilms(amount) {
        this.recycleRes('films', amount);
    }

    // ==================== 人事视图 ====================
    renderHR() {
        const e = window.gameEngine;
        const c = document.getElementById('hr-container');
        if (!c) return;

        const cap = e.getMemberCap();
        const availableSlots = cap - e.members.length;

        const totalPayroll = e.getTotalMonthlyPayroll();

        let html = `
            <div class="hr-header-row">
                <div class="section-title" style="margin-bottom:0">👥 已入组同门档案</div>
                <div class="hr-cap-hint">已入组: <b>${e.members.length}</b> / ${cap} 人 (随评级扩充) · 💸 月津贴总计: <b>${(totalPayroll * 10000).toFixed(0)}</b> 元/月 · ${availableSlots > 0 ? `🟢 尚余 ${availableSlots} 个空余工位` : '🔴 工位已满 (提升评级扩容)'}</div>
            </div>
        `;

        if (e.members.length === 0) {
            html += '<div class="empty-hint">暂无成员入组</div>';
        } else {
            for (let m of e.members) {
                html += this._renderMemberCard(m);
            }
        }

        html += '<div class="section-divider"></div>';
        html += `<div class="recruit-hub-section">
            <div class="section-title">🎓 课题组保研招生招聘中心</div>
            <div class="recruit-hub-subtitle">发布宣讲简章吸引优秀保研生投递简历，面试选拔适合课题组发展的同门！</div>
        `;

        if (e.activeCandidates && e.activeCandidates.length > 0) {
            html += `
                <div class="candidate-review-box">
                    <div class="candidate-review-header">
                        <div class="review-title">📥 收到 ${e.activeCandidates.length} 份保研简历（请遴选 1 位录取入组）</div>
                        <button class="btn-dismiss-candidates" onclick="window.ui.dismissCandidates()">✖ 婉拒本批</button>
                    </div>
                    <div class="candidate-list">
                        ${e.activeCandidates.map(cand => this._renderCandidateCard(cand, availableSlots > 0)).join('')}
                    </div>
                </div>
            `;
        } else {
            const canCampus = availableSlots > 0 && e.funding >= 0.1;
            const canSummer = availableSlots > 0 && e.funding >= 0.6 && e.labStage >= 2;

            html += `
                <div class="recruit-channel-grid">
                    <div class="recruit-channel-card">
                        <div class="channel-header">
                            <span class="channel-icon">📢</span>
                            <div class="channel-title">
                                <span class="channel-name">校园保研宣讲会</span>
                                <span class="channel-cost">💵 0.10 万 (1000元)</span>
                            </div>
                        </div>
                        <div class="channel-desc">在校内发布招生简章，随机吸引 <b>1 ~ 3 位</b> 专长各异的保研生投递简历。</div>
                        <button class="btn-channel-post" onclick="window.ui.postRecruit('campus')" ${!canCampus ? 'disabled' : ''}>
                            ${availableSlots <= 0 ? '工位已满' : e.funding < 0.1 ? '经费不足' : '📢 发布简章 (0.1万)'}
                        </button>
                    </div>

                    <div class="recruit-channel-card ${e.labStage < 2 ? 'locked' : ''}">
                        <div class="channel-header">
                            <span class="channel-icon">🌟</span>
                            <div class="channel-title">
                                <span class="channel-name">全国优秀大学生夏令营</span>
                                <span class="channel-cost">💵 0.60 万 (6000元)</span>
                            </div>
                        </div>
                        <div class="channel-desc">${e.labStage < 2 ? '🔒 需晋升至阶段 2 解锁' : '举办高质量学术夏令营，精选 <b>3 位</b> 高初始资质与罕见科研特质的优秀学生！'}</div>
                        <button class="btn-channel-post btn-gold" onclick="window.ui.postRecruit('summer_camp')" ${!canSummer ? 'disabled' : ''}>
                            ${e.labStage < 2 ? '阶段2解锁' : availableSlots <= 0 ? '工位已满' : e.funding < 0.6 ? '经费不足' : '🌟 举办夏令营 (0.6万)'}
                        </button>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        const visibleLeg = GAME_DATA.legendaryMembers.filter(l => l.stageReq <= e.labStage);
        if (visibleLeg.length > 0) {
            html += '<div class="section-divider"></div><div class="section-title">👑 核心天骄博士引荐与特聘签约榜</div>';
            for (let leg of visibleLeg) {
                const recruited = e.members.some(m => m.id === leg.id);
                const unlocked = e.isLegendaryUnlocked(leg.id);
                const capOk = e.members.length < e.getMemberCap();
                const canAffordStipend = e.funding >= (leg.stipend || 0);

                let condListHtml = '';
                if (leg.unlockConditions) {
                    condListHtml = leg.unlockConditions.map(c => {
                        let ok = false;
                        if (c.type === 'lab_grade') ok = e.getLabGrade() >= c.grade;
                        else if (c.type === 'paper_count') ok = e.publishedPapers.length >= c.count;
                        else if (c.type === 'paper_zone') {
                            if (c.zoneKey === 'supreme') ok = e.publishedPapers.some(p => p.zoneKey === 'supreme');
                            else if (c.zoneKey === 'zone1') ok = e.publishedPapers.some(p => ['zone1', 'supreme'].includes(p.zoneKey));
                            else if (c.zoneKey === 'zone2') ok = e.publishedPapers.some(p => ['zone2', 'zone1', 'supreme'].includes(p.zoneKey));
                            else ok = e.publishedPapers.some(p => p.zoneKey === c.zoneKey);
                        }
                        else if (c.type === 'facility') ok = e.stationInstances.some(s => s.eqId === c.facId);
                        else if (c.type === 'resource') ok = (e.inventory[c.resKey] || 0) >= c.count;
                        else if (c.type === 'equip_level') ok = e.stationInstances.some(s => s.eqId === c.eqId && s.level >= c.level);

                        return `<div class="legend-cond-item ${ok ? 'cond-done' : 'cond-pending'}">${ok ? '✅' : '🔒'} ${c.desc}</div>`;
                    }).join('');
                }

                html += `<div class="legendary-card ${!unlocked ? 'locked' : ''}">
                    <div class="legendary-header">
                        <span class="legendary-avatar">${leg.avatar}</span>
                        <div class="legendary-name">${leg.name}<span class="tier-badge" style="background:${leg.tier === 'SSSSSR' ? 'linear-gradient(135deg,#ef4444,#a855f7)' : 'rgba(251,191,36,.2)'};color:${leg.tier === 'SSSSSR' ? '#fff' : '#fbbf24'}">${leg.tier}</span></div>
                    </div>
                    <div style="font-size:11px;color:var(--text2);margin-bottom:6px">${leg.grade} · ${leg.desc}</div>
                    <div class="legendary-cond-box">${condListHtml}</div>
                    <div class="legendary-stipend-row">
                        <span class="stipend-label">🎓 签约科研津贴:</span>
                        <span class="stipend-val">💵 ${leg.stipend || 0} 万元</span>
                    </div>
                    ${recruited ? '<div style="font-size:11px;color:var(--green);font-weight:700">✅ 已加盟课题组</div>' :
                      unlocked ? `<button class="btn-recruit-legend" onclick="window.ui.recruitLegend('${leg.id}')" ${!capOk || !canAffordStipend ? 'disabled' : ''}>${!capOk ? '工位已满' : !canAffordStipend ? `经费不足(${leg.stipend}万)` : `🎓 签约聘请 (${leg.stipend}万)`}</button>` :
                      `<button class="btn-recruit-legend" disabled>🔒 学术条件未达成</button>`}
                </div>`;
            }
        }

        c.innerHTML = html;
    }

    _renderCandidateCard(cand, canAdmit) {
        const cm = window.characterManager;
        cm.ensureMemberApt(cand);
        let aptHtml = '';
        for (let [key, apt] of Object.entries(GAME_DATA.aptitudes)) {
            const detail = cm.getMemberAptDetail(cand, key);
            const grade = detail ? detail.rank : 'D';
            const color = detail ? detail.color : '#94a3b8';
            const exp = detail ? detail.exp : 0;
            const maxExp = detail ? detail.maxExp : 80;
            aptHtml += `<div class="apt-item">
                <span class="apt-icon">${apt.icon}</span>
                <span class="apt-name">${apt.name}</span>
                <span class="apt-grade" style="color:${color}">${grade} 级 <small style="font-size:9px;opacity:0.8">(${exp}/${maxExp})</small></span>
            </div>`;
        }

        const tierColor = cand.tier === 'SR' ? '#a855f7' : cand.tier === 'R+' ? '#3b82f6' : '#64748b';

        return `
            <div class="candidate-card">
                <div class="candidate-card-header">
                    <div class="candidate-avatar">${cand.avatar}</div>
                    <div class="candidate-info">
                        <div class="candidate-name-row">
                            <span class="candidate-name">${cand.name}</span>
                            <span class="tier-badge" style="background:${tierColor};color:#fff">${cand.tier}</span>
                            <span class="archetype-badge">${cand.archetypeIcon || '🏷️'} ${cand.archetypeTitle || '硕士生'}</span>
                        </div>
                        <div class="candidate-grade">${cand.grade}</div>
                    </div>
                </div>
                <div class="candidate-statement">${cand.statement || cand.desc}</div>
                <div style="font-size:11px;color:#fbbf24;margin:4px 0 6px 0;font-weight:600">💸 期望月度劳务津贴: <b>${((GAME_DATA.stipendConfig[cand.tier] || 0.05) * 10000).toFixed(0)}</b> 元/月</div>
                <div class="apt-grid">${aptHtml}</div>
                ${cand.traits && cand.traits.length > 0 ? `
                    <div class="candidate-traits">
                        ${cand.traits.map(t => `<div class="trait-tag-full"><span class="trait-title">${t.name}</span>: ${t.desc}</div>`).join('')}
                    </div>
                ` : ''}
                <div class="candidate-card-footer">
                    <button class="btn-admit-candidate" onclick="window.ui.admitCandidate('${cand.id}')" ${!canAdmit ? 'disabled' : ''}>
                        ${canAdmit ? '🎓 录取该生入组' : '工位已满'}
                    </button>
                </div>
            </div>
        `;
    }

    _renderMemberCard(m) {
        const e = window.gameEngine;
        const cm = window.characterManager;
        const station = m.assignedStationId ? e.stationInstances.find(s => s.instanceId === m.assignedStationId) : null;
        const eq = station ? GAME_DATA.equipmentList.find(x => x.id === station.eqId) : null;
        const fitInfo = eq ? e.getStationFitInfo(m, eq.id) : null;
        const arch = cm.getMemberArchetype(m);

        let aptRowsHtml = '';
        for (let [key, apt] of Object.entries(GAME_DATA.aptitudes)) {
            const detail = cm.getMemberAptDetail(m, key);
            const grade = detail.rank;
            const color = detail.color;
            const mult = cm.getAptMult(grade);
            const percent = Math.min(100, Math.round((detail.exp / detail.maxExp) * 100));
            const chancePercent = Math.round(detail.totalChance * 100);

            aptRowsHtml += `
                <div class="mem-apt-row">
                    <div class="mar-header">
                        <span class="mar-icon">${apt.icon}</span>
                        <span class="mar-name">${apt.name}</span>
                        <span class="mar-grade" style="color:${color};background:${color}18;border:1px solid ${color}44">${grade} 级 · ${detail.rankName} (×${mult.toFixed(2)})</span>
                        <span class="mar-exp">${detail.exp}/${detail.maxExp}</span>
                        ${detail.isMax ? `
                            <span class="mar-ss-crown">👑 宗师化境</span>
                        ` : detail.canBreak ? `
                            <button class="btn-apt-break" onclick="window.ui.breakthroughApt('${m.id}', '${key}')" title="开启突破考核！当前成功率: ${chancePercent}%">⚡ 突破${detail.nextRank} (${chancePercent}%)</button>
                        ` : `
                            <button class="btn-apt-coach" onclick="window.ui.trainMember('${m.id}', '${key}')" title="导师专项示教 (+${detail.trainExp} EXP，消耗 ${detail.trainCost} 万)">👨‍🏫 示教+${detail.trainExp} (${detail.trainCost}万)</button>
                        `}
                    </div>
                    <div class="mar-bar">
                        <div class="mar-fill" style="width:${percent}%;background:linear-gradient(90deg, ${color}99, ${color})"></div>
                    </div>
                    ${detail.luck > 0 && !detail.isMax ? `
                        <div class="mar-luck-hint" style="font-size:10px;color:#fbbf24;margin-top:2px;font-weight:600">💡 突破领悟保底: +${Math.round(detail.luck * 100)}% 成功率 (基础 ${Math.round(detail.baseSuccess * 100)}% + 导师道场 +${Math.round(detail.mentorBonus * 100)}%)</div>
                    ` : ''}
                </div>
            `;
        }

        const tierColor = m.tier === 'SSSSSR' ? 'linear-gradient(135deg,#ef4444,#a855f7)' :
                         m.tier === 'SSR' ? '#fbbf24' : m.tier === 'SR' ? '#a855f7' :
                         m.tier === 'R+' ? '#3b82f6' : '#64748b';

        const memberCPS = e.getMemberAutoCPS(m);
        const memberPower = e.getMemberAutoPower(m);

        return `<div class="member-card">
            <div class="member-card-header">
                <div class="member-avatar">${m.avatar}</div>
                <div class="member-info">
                    <div class="member-name-row">
                        <span class="member-name">${m.name}</span>
                        <span class="tier-badge" style="background:${tierColor};color:#fff">${m.tier}</span>
                        <span class="member-arch-badge" style="color:${arch.color};border:1px solid ${arch.color}55;background:${arch.color}15">
                            ${arch.icon} ${arch.title}
                        </span>
                    </div>
                    <div class="member-grade-row">
                        <span>${m.grade}</span>
                        <span style="color:var(--text3)">·</span>
                        <span style="font-size:11px;color:var(--text2)">${arch.desc}</span>
                    </div>
                    ${eq ? `
                        <div class="member-station-tag" style="background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);color:#38bdf8">
                            📌 执勤：${eq.icon} ${eq.name} · <b style="color:${fitInfo.badgeClass==='fit-grandmaster'?'#fbbf24':'#4ade80'}">${fitInfo.fitTag} (产出 ×${(fitInfo.totalFitMult * fitInfo.traitMult).toFixed(2)})</b>
                        </div>
                    ` : '<div class="member-station-tag" style="color:var(--text3)">⚪ 空闲待命（前往设备区指派上岗）</div>'}
                </div>
            </div>

            <div class="member-click-stat">
                <span>⚡ 连点流速: <b>${memberCPS.toFixed(1)}次/秒</b></span>
                <span>威力: <b>${memberPower.toFixed(2)}/次</b></span>
                <span style="color:#fbbf24;font-weight:600">💸 月津贴: <b>${(e.getMemberMonthlySalary(m) * 10000).toFixed(0)}元/月</b></span>
                <span class="member-rec-hint">💡 最佳工位: <b>${arch.recEq}</b></span>
            </div>

            <!-- 四维资质与导师示教进度条 -->
            <div class="member-apt-container">
                ${aptRowsHtml}
            </div>

            <!-- 特质与协同 -->
            ${m.traits && m.traits.length > 0 ? `
                <div class="member-traits">
                    ${m.traits.map(t => `<span class="trait-tag" title="${t.desc}">🔥 ${t.name} <small style="color:var(--text3)">(${t.desc})</small></span>`).join('')}
                </div>
            ` : ''}

            <!-- 导师专项科研培养行动栏 -->
            <div class="member-training-actions">
                <button class="btn-train-action btn-train-conf" onclick="window.ui.sendConference('${m.id}')" title="派遣前往学术大会，全资质+10 EXP，35%概率领悟新特质">
                    🛫 派驻学术研讨会 (0.8万)
                </button>
                <button class="btn-train-action btn-train-journal" onclick="window.ui.hostJournalClub('${m.id}')" title="组织周度顶刊精读，理论与洞察资质各+12 EXP">
                    ☕ 组会文献精读 (1咖啡/0.2万)
                </button>
            </div>
        </div>`;
    }

    // ==================== 立项视图 ====================
    renderPaper() {
        const e = window.gameEngine;
        const c = document.getElementById('paper-container');
        if (!c) return;

        let html = '';

        // 进行中的论文
        if (e.currentPaperProject) {
            html += this._renderActivePaper(e.currentPaperProject);
        }

        // 论文课题列表
        html += '<div class="section-title">📝 可选课题</div>';
        for (let topic of GAME_DATA.paperTopics) {
            if (topic.stageReq > e.labStage) continue;

            // 检查最低配方是否满足（投4区只需基础数据）
            let baseRecipeHtml = '';
            let allMet = true;
            for (let [k, v] of Object.entries(topic.reqData)) {
                const have = Math.floor(e.inventory[k] || 0);
                const met = have >= v;
                if (!met) allMet = false;
                const res = GAME_DATA.resources[k];
                baseRecipeHtml += `<span class="recipe-item ${met ? 'met' : 'unmet'}">${res.icon} ${res.name} <span class="recipe-val">${have}/${v}</span></span>`;
            }

            const canStart = !e.currentPaperProject && allMet;
            const baseFunding = Math.round(topic.equipCost * 0.5);

            html += `<div class="paper-topic-card">
                <div class="paper-topic-header">
                    <span class="paper-topic-icon">${topic.icon}</span>
                    <span class="paper-topic-title">${topic.title}</span>
                </div>
                <div class="paper-topic-desc">${topic.desc}</div>
                <div class="paper-recipe">${baseRecipeHtml}</div>
                <div class="paper-reward">
                    <span class="reward-funding">💵 基础资助 ${baseFunding}万 (4区起)</span>
                    <span class="reward-prestige">💎 冲顶刊最高可获 ${baseFunding * 80} 万巨奖!</span>
                </div>
                <button class="btn-start-paper" onclick="window.ui.openPaperModal('${topic.id}')" ${!canStart ? 'disabled' : ''}>
                    ${e.currentPaperProject ? '已有论文进行中' : allMet ? '立项选档 →' : '数据不足'}
                </button>
            </div>`;
        }

        // 已发表论文
        if (e.publishedPapers.length > 0) {
            html += '<div class="section-divider"></div><div class="section-title">📚 已发表论文</div>';
            for (let p of e.publishedPapers.slice().reverse()) {
                const zoneColor = GAME_DATA.paperZones.find(z => z.id === p.zoneKey)?.icon || '📄';
                const zoneName = p.zoneName || '旧档';
                html += `<div class="paper-topic-card" style="opacity:.8">
                    <div class="paper-topic-header">
                        <span class="paper-topic-icon">${zoneColor}</span>
                        <span class="paper-topic-title">${p.title}</span>
                        <span class="paper-tier-badge" style="background:rgba(251,191,36,.15);color:var(--gold)">${zoneName}·${p.score}分</span>
                    </div>
                    <div style="font-size:11px;color:var(--text2)">📚 ${p.journal || '旧期刊'} · 一作：${p.leadName}${p.coName ? ' · 共一：' + p.coName : ''} · 第${p.year}年${p.month}月</div>
                </div>`;
            }
        }

        c.innerHTML = html;
    }

    _renderActivePaper(p) {
        const e = window.gameEngine;
        let phaseTag = '';
        let progressHtml = '';

        if (p.phase === 'ideation') {
            phaseTag = '<span class="paper-phase-tag phase-ideation">💡 构思阶段</span>';
            progressHtml = `<div class="paper-progress-section">
                <div class="paper-progress-label"><span>研究构思</span><span>${Math.min(100, Math.floor(p.ideationProgress))}%</span></div>
                <div class="paper-progress-bar"><div class="paper-progress-fill fill-ideation" style="width:${Math.min(100, p.ideationProgress)}%"></div></div>
            </div>`;
        } else if (p.phase === 'writing') {
            const stageName = { theory: '理论推导', plotting: '图表排版', review: '审稿准备' }[p.writingStage];
            phaseTag = '<span class="paper-phase-tag phase-writing">✍️ 撰写阶段</span>';
            progressHtml = `<div class="paper-progress-section">
                <div class="paper-progress-label"><span>撰写进度（${stageName}）</span><span>${Math.min(100, Math.floor(p.writingProgress))}%</span></div>
                <div class="paper-progress-bar"><div class="paper-progress-fill fill-writing" style="width:${Math.min(100, p.writingProgress)}%"></div></div>
            </div>`;
        } else if (p.phase === 'review') {
            phaseTag = '<span class="paper-phase-tag phase-review">📬 审稿中</span>';
            progressHtml = `<div class="paper-progress-section">
                <div class="paper-progress-label"><span>审稿进度</span><span>${Math.min(100, Math.floor(p.reviewProgress))}%</span></div>
                <div class="paper-progress-bar"><div class="paper-progress-fill fill-review" style="width:${Math.min(100, p.reviewProgress)}%"></div></div>
            </div>`;
        }

        // 团队
        const roles = [
            { id: p.leadId, label: '一作', icon: '✍️' },
            { id: p.coId, label: '共一', icon: '🤝' },
            { id: p.theoryId, label: '理论', icon: '🧮' },
            { id: p.testingId, label: '测试', icon: '🔧' }
        ];
        let teamHtml = '';
        for (let r of roles) {
            const m = r.id ? e.members.find(x => x.id === r.id) : null;
            teamHtml += `<span class="paper-team-slot ${m ? 'filled' : 'empty'}">${r.icon} ${r.label}: ${m ? m.name : '未指派'}</span>`;
        }

        // 注入按钮
        let injectBtn = '';
        if (p.phase === 'writing' && (e.inventory.compute || 0) >= 5) {
            injectBtn = `<button class="btn-station-action btn-primary" style="margin-top:6px" onclick="window.ui.injectCompute()">💉 注入5份算力加速+8%</button>`;
        }

        return `<div class="paper-active-card">
            <div class="paper-active-title">${p.title}</div>
            ${phaseTag}
            ${progressHtml}
            <div class="paper-team-row">${teamHtml}</div>
            ${injectBtn}
        </div>`;
    }

    // ==================== 设备商城（渐进式迷雾解锁：达到一定经费或前置条件方可探知） ====================
    renderShop() {
        const e = window.gameEngine;
        const c = document.getElementById('shop-container');
        if (!c) return;

        this.shopCategoryFilter = this.shopCategoryFilter || 'all';

        // 商城分类胶囊
        const shopCatPills = (GAME_DATA.equipmentCategories || []).map(cat => {
            let count = 0;
            if (cat.id === 'all') {
                count = GAME_DATA.equipmentList.filter(eq => e.isEquipmentVisibleInShop(eq)).length;
            } else {
                count = GAME_DATA.equipmentList.filter(eq => eq.category === cat.id && e.isEquipmentVisibleInShop(eq)).length;
            }
            const isSel = this.shopCategoryFilter === cat.id;
            return `
                <button class="btn-eq-cat-pill ${isSel ? 'active' : ''}" onclick="window.ui.setShopCategoryFilter('${cat.id}')">
                    <span class="ecp-icon">${cat.icon}</span>
                    <span class="ecp-name">${cat.name}</span>
                    <span class="ecp-count">(${count})</span>
                </button>
            `;
        }).join('');

        let html = `
            <div class="section-title">
                🛒 仪器设备商城
                <small style="font-size:11px;color:var(--text2);font-weight:400;margin-left:8px">（随课题组经费增长与产业链拓展逐步勘探解锁尖端仪器）</small>
            </div>
            <div class="eq-cat-pills-row" style="margin-bottom:12px">
                ${shopCatPills}
            </div>
        `;

        let visibleCount = 0;
        let nextLockedTeaser = null;

        for (let eq of GAME_DATA.equipmentList) {
            const isVisible = e.isEquipmentVisibleInShop(eq);
            if (isVisible) {
                if (this.shopCategoryFilter !== 'all' && eq.category !== this.shopCategoryFilter) {
                    continue;
                }
                visibleCount++;
                const locked = eq.stageReq > e.labStage;
                const ownedCount = e.stationInstances.filter(s => s.eqId === eq.id).length;
                const currentPrice = e.getEquipmentPrice ? e.getEquipmentPrice(eq.id) : eq.price;
                const canAfford = e.funding >= currentPrice;
                const mechanic = eq.mechanic ? `<div class="shop-mechanic">${eq.mechanicDesc}</div>` : '';
                const catObj = (GAME_DATA.equipmentCategories || []).find(x => x.id === eq.category) || { name: '专业仪器', icon: '🔬' };

                html += `<div class="shop-card ${locked ? 'shop-locked' : ''}">
                    <div class="shop-icon">${eq.icon}</div>
                    <div class="shop-info">
                        <div class="shop-name-row">
                            <span class="shop-name">${eq.name}</span>
                            <span class="mcb-badge" style="font-size:10px">${catObj.icon} ${catObj.name}</span>
                            ${ownedCount > 0 ? `<span class="shop-owned-tag">已拥有 ${ownedCount} 台</span>` : ''}
                        </div>
                        ${mechanic}
                        ${eq.type === 'station' ? `<div style="font-size:11px;color:#38bdf8;margin:2px 0 4px 0;font-weight:600">⚡ 纯连点流速: +${eq.baseYield.toFixed(2)} ${eq.productName} / 秒 (指派同门在岗连点)</div>` : ''}
                        <div class="shop-desc">${eq.desc}</div>
                        <div class="shop-price">💵 ${currentPrice} 万元 ${ownedCount > 0 ? `<small style="font-size:10px;color:#94a3b8"> (第${ownedCount+1}台: +15%)</small>` : ''}</div>
                        ${locked ? `<div class="shop-locked-tag">🔒 需课题组阶段 ${eq.stageReq}</div>` : ''}
                    </div>
                    ${!locked ? `<button class="btn-buy" onclick="window.ui.buyEq('${eq.id}')" ${!canAfford ? 'disabled' : ''}>${canAfford ? '购置部署 🛒' : '经费不足'}</button>` : ''}
                </div>`;
            } else if (!nextLockedTeaser) {
                // 仅显露最近的一个待探知神秘设备作为近期目标
                nextLockedTeaser = eq;
            }
        }

        if (visibleCount === 0) {
            html += `
                <div class="empty-filter-hint">
                    <span style="font-size:24px">🔍</span>
                    <div style="margin-top:4px">当前分类下暂无已探知的仪器</div>
                    <button class="btn-reset-filters" onclick="window.ui.setShopCategoryFilter('all')">查看全部仪器</button>
                </div>
            `;
        }

        if (nextLockedTeaser && (this.shopCategoryFilter === 'all' || nextLockedTeaser.category === this.shopCategoryFilter)) {
            const revealNeedFunding = (nextLockedTeaser.price * 0.4).toFixed(1);
            html += `
                <div class="shop-card shop-mystery-teaser">
                    <div class="shop-icon">🔒</div>
                    <div class="shop-info">
                        <div class="shop-name" style="color:#94a3b8">❓【前沿尖端设备 · 勘探中】</div>
                        <div class="shop-desc" style="color:#64748b">该高级仪器需要课题组具备更雄厚的资金储备与前置表征技术链。</div>
                        <div class="shop-price" style="color:#f59e0b">💡 探知条件：经费累积至 <b>${revealNeedFunding} 万元</b> 或持有前置设备即可解锁参数！</div>
                    </div>
                </div>
            `;
        }

        c.innerHTML = html;
    }

    // ==================== 人际网视图 ====================
    renderNetwork() {
        const e = window.gameEngine;
        const c = document.getElementById('network-container');
        if (!c) return;

        let html = '<div class="section-title">🌐 学术人际网络</div>';

        const relations = [
            { key: 'mentorId', icon: '👨‍🏫', label: '师承带教', desc: '徒弟经验 ×1.5' },
            { key: 'coAuthorId', icon: '🤝', label: '共同一作', desc: '论文速度 +35%' },
            { key: 'rivalId', icon: '💻', label: '仪器宿敌', desc: '互卷产出微升' },
            { key: 'mealBuddyId', icon: '🍗', label: '干饭搭子', desc: '心情大好' }
        ];

        let hasRelation = false;
        for (let rel of relations) {
            const pairs = [];
            const seen = new Set();
            for (let m of e.members) {
                if (m[rel.key] && !seen.has(m.id)) {
                    const other = e.members.find(x => x.id === m[rel.key]);
                    if (other) {
                        pairs.push([m, other]);
                        seen.add(m.id);
                        seen.add(other.id);
                    }
                }
            }
            if (pairs.length > 0) {
                hasRelation = true;
                html += `<div class="network-card">
                    <div class="network-card-title">${rel.icon} ${rel.label} <small style="margin-left:6px">${rel.desc}</small></div>`;
                for (let [a, b] of pairs) {
                    html += `<div class="relation-row">
                        <span class="relation-icon">${rel.icon}</span>
                        <span class="relation-pair"><b>${a.name}</b> ↔ <b>${b.name}</b></span>
                        <span class="relation-type">${rel.label}</span>
                    </div>`;
                }
                html += '</div>';
            }
        }

        if (!hasRelation) {
            html += '<div class="empty-hint">还没有建立人际关系<br>招更多同门后会自然产生！</div>';
        }

        c.innerHTML = html;
    }

    // ==================== 弹窗管理 ====================
    openModal(id) { const el = document.getElementById(id); if (el) { el.style.display = 'flex'; if (id === 'modal-log') this.renderChronicle(); } }
    closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

    // ==================== 操作员选择与指派 ====================
    openAssign(instanceId) {
        this.assigningInstanceId = instanceId;
        const e = window.gameEngine;
        const body = document.getElementById('assign-modal-body');
        const title = document.getElementById('assign-title');
        const inst = e.stationInstances.find(s => s.instanceId === instanceId);
        const eq = inst ? GAME_DATA.equipmentList.find(x => x.id === inst.eqId) : null;
        if (title) title.innerText = `选择操作员 · ${eq ? eq.name : ''}`;
        const aptKey = eq ? e.getAptKeyForEquipment(eq.id) : 'lab';
        const aptInfo = GAME_DATA.aptitudes[aptKey] || { name: '实验动手力', icon: '🔧' };

        if (e.members.length === 0) { 
            body.innerHTML = '<div class="empty-hint">暂无可用同门<br>前往【人事】发布招生简章招募学生入组！</div>'; 
        } else {
            const memberEvaluations = e.members.map(m => {
                const fitInfo = e.getStationFitInfo(m, eq.id);
                const opCPS = e.getMemberAutoCPS(m);
                const opPower = e.getMemberAutoPower(m) * (1 + (inst.level - 1) * 0.25) * fitInfo.totalFitMult;
                let projectedYield = opCPS * opPower * fitInfo.traitMult;
                if (m.mentorId) projectedYield *= 1.25;

                const busy = m.assignedStationId && m.assignedStationId !== instanceId;
                const isCurrent = inst && inst.operatorId === m.id;
                const busyStation = busy ? e.stationInstances.find(s => s.instanceId === m.assignedStationId) : null;
                const busyEq = busyStation ? GAME_DATA.equipmentList.find(x => x.id === busyStation.eqId) : null;
                const busyText = busyEq ? `执勤中: ${busyEq.name}` : '空闲就绪';

                return {
                    member: m,
                    fitInfo,
                    projectedYield,
                    busy,
                    isCurrent,
                    busyText
                };
            });

            // 按上岗后预估产出降序智能排序
            memberEvaluations.sort((a, b) => b.projectedYield - a.projectedYield);

            body.innerHTML = `
                <div class="assign-modal-tip">
                    <span class="amt-icon">💡</span>
                    <span class="amt-text">该设备核心需要 <b>${aptInfo.icon} ${aptInfo.name}</b>。人岗匹配度越高，专精共振与产能爆发越强！</span>
                </div>
                <div class="assign-list">
                    ${memberEvaluations.map((item, idx) => {
                        const m = item.member;
                        const fit = item.fitInfo;
                        const isBest = idx === 0 && !item.isCurrent;

                        return `
                            <div class="assign-list-item ${item.isCurrent ? 'assign-item-current' : ''} ${fit.badgeClass}" onclick="window.ui.doAssign('${m.id}')">
                                <span class="ali-avatar">${m.avatar}</span>
                                <div class="ali-info">
                                    <div class="ali-name-row">
                                        <span class="ali-name">${m.name}</span>
                                        ${item.isCurrent ? '<span class="ali-cur-tag">当前执勤</span>' : ''}
                                        ${isBest ? '<span class="ali-best-tag">👑 最佳人选</span>' : ''}
                                    </div>
                                    <div class="ali-meta-row">
                                        <span class="ali-grade">${m.grade} · ${m.tier}</span>
                                        <span class="ali-yield-preview">预计: <b style="color:var(--green)">+${item.projectedYield.toFixed(2)}</b> ${eq.productName}/天</span>
                                    </div>
                                </div>
                                <div class="ali-apt-col">
                                    <span class="ali-apt-badge ${fit.badgeClass}">
                                        ${fit.aptIcon} ${fit.grade} · ${fit.fitTag}
                                    </span>
                                    ${fit.hasTraitSynergy ? `<span class="ali-trait-pill">🔥 特质×${fit.traitMult.toFixed(1)}</span>` : ''}
                                </div>
                                <span class="ali-status ${item.busy ? 'status-busy' : 'status-free'}">${item.busy ? item.busyText : '空闲就绪'}</span>
                            </div>
                        `;
                    }).join('')}
                    <div class="assign-list-item assign-item-clear" onclick="window.ui.doAssign('')">
                        <span class="ali-avatar">🚫</span>
                        <div class="ali-name" style="color:#f87171">空置工位（撤销操作员，设备停机）</div>
                    </div>
                </div>
            `;
        }
        this.openModal('modal-assign');
    }

    openAssignModal(instanceId) {
        this.openAssign(instanceId);
    }

    doAssign(memberId) {
        const e = window.gameEngine;
        e.assignOperator(this.assigningInstanceId, memberId);
        this.closeModal('modal-assign');
        if (memberId) {
            const m = e.members.find(x => x.id === memberId);
            this.toast(`👤 已指派 ${m ? m.name : '学生'} 驻守工位！`);
        } else {
            this.toast('🚫 已将该机位设为空置');
        }
        this.renderStations();
        this.renderTopBar();
        this.renderHR();
    }

    unassignOp(instanceId) {
        window.gameEngine.assignOperator(instanceId, '');
        this.toast('🚫 已取消该工位操作员');
        this.renderStations();
        this.renderHR();
        if (document.getElementById('modal-eq-matrix') && document.getElementById('modal-eq-matrix').style.display !== 'none') {
            this.renderEqMatrix();
        }
    }

    // ==================== 仪器分类与筛选控制 ====================
    setStationCategoryFilter(catId) {
        if (window.soundEngine) window.soundEngine.playClick();
        this.stationCategoryFilter = catId;
        this.renderStations();
    }

    setStationStatusFilter(status) {
        if (window.soundEngine) window.soundEngine.playClick();
        this.stationStatusFilter = status;
        this.renderStations();
    }

    resetStationFilters() {
        this.stationCategoryFilter = 'all';
        this.stationStatusFilter = 'all';
        this.renderStations();
    }

    setShopCategoryFilter(catId) {
        if (window.soundEngine) window.soundEngine.playClick();
        this.shopCategoryFilter = catId;
        this.renderShop();
    }

    // ==================== 仪器集控大盘弹窗 ====================
    openEqMatrixModal() {
        if (window.soundEngine) window.soundEngine.playClick();
        this.renderEqMatrix();
        this.openModal('modal-eq-matrix');
    }

    renderEqMatrix() {
        const e = window.gameEngine;
        const box = document.getElementById('eq-matrix-body');
        if (!box) return;

        const totalCount = e.stationInstances.length;
        const runningCount = e.stationInstances.filter(s => s.operatorId && !s.brokenUntilDay && !s.isLackingMaterials).length;
        const vacantCount = e.stationInstances.filter(s => !s.operatorId).length;

        // 统计各大类设备
        const categories = (GAME_DATA.equipmentCategories || []).filter(c => c.id !== 'all');
        let catBlocksHtml = '';

        for (let cat of categories) {
            const insts = e.stationInstances.filter(s => {
                const eq = GAME_DATA.equipmentList.find(x => x.id === s.eqId);
                return eq && eq.category === cat.id;
            });
            if (insts.length === 0) continue;

            const rows = insts.map(s => {
                const eq = GAME_DATA.equipmentList.find(x => x.id === s.eqId);
                const op = s.operatorId ? e.members.find(m => m.id === s.operatorId) : null;
                const { amount: yieldVal } = e._calcYield(s);
                return `
                    <div class="mcb-item-row">
                        <div class="mcb-item-left">
                            <span style="font-size:18px">${eq.icon}</span>
                            <div>
                                <span class="mcb-item-name">${eq.name} <small style="color:#38bdf8">Lv.${s.level}</small></span>
                                <div class="mcb-item-op">${op ? `👤 ${op.name} (${op.grade})` : '<span style="color:#f59e0b">⚪ 空置待命</span>'}</div>
                            </div>
                        </div>
                        <div style="text-align:right">
                            <span class="mcb-item-yield">+${yieldVal.toFixed(2)} ${eq.productName}/s</span>
                            <div style="margin-top:4px">
                                <button class="btn-ric-act" onclick="window.ui.closeModal('modal-eq-matrix'); window.ui.openAssign('${s.instanceId}')">${op ? '换人 ✏️' : '指派 ➕'}</button>
                                <button class="btn-ric-act btn-ric-all" onclick="window.ui.closeModal('modal-eq-matrix'); window.ui.sellStationPrompt('${s.instanceId}')">转让 ♻️</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            catBlocksHtml += `
                <div class="matrix-cat-block">
                    <div class="mcb-header">
                        <span class="mcb-title">${cat.icon} ${cat.name} (${insts.length} 台)</span>
                        <span class="mcb-badge">${cat.desc}</span>
                    </div>
                    <div class="mcb-items-list">
                        ${rows}
                    </div>
                </div>
            `;
        }

        if (!catBlocksHtml) {
            catBlocksHtml = '<div class="empty-hint">当前实验室尚无任何部署设备，快去【设备商城】添置！</div>';
        }

        box.innerHTML = `
            <div class="matrix-summary-hero">
                <div class="msh-card">
                    <div class="msh-val">${totalCount}</div>
                    <div class="msh-label">已部署仪器</div>
                </div>
                <div class="msh-card">
                    <div class="msh-val" style="color:#4ade80">${runningCount}</div>
                    <div class="msh-label">🟢 运转中</div>
                </div>
                <div class="msh-card">
                    <div class="msh-val" style="color:#fbbf24">${vacantCount}</div>
                    <div class="msh-label">⚪ 空置待命</div>
                </div>
            </div>
            <div class="matrix-cats-container">
                ${catBlocksHtml}
            </div>
        `;
    }

    // ==================== 本地与跨设备存档管理 ====================
    openSaveModal() {
        if (window.soundEngine) window.soundEngine.playClick();
        const input = document.getElementById('save-import-input');
        if (input) input.value = '';
        this.openModal('modal-save-manager');
    }

    copySaveCodeToClipboard() {
        const e = window.gameEngine;
        const code = e.exportSaveCode();
        if (!code) {
            this.toast('❌ 导出存档码失败');
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
                this.toast('📋 存档码已复制到剪贴板！可发微信备忘录备份！');
            }).catch(() => {
                this._fallbackCopy(code);
            });
        } else {
            this._fallbackCopy(code);
        }
    }

    _fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            this.toast('📋 存档码已复制到剪贴板！可发微信备忘录备份！');
        } catch (e) {
            prompt('请手动长按复制下方存档码：', text);
        }
        document.body.removeChild(ta);
    }

    downloadSaveFile() {
        const e = window.gameEngine;
        const res = e.exportSaveJsonFile();
        if (res.success) {
            this.toast(`📁 存档文件【${res.filename}】已下载至本地！`);
        } else {
            this.toast('❌ 导出存档文件失败');
        }
    }

    applyImportCode() {
        const input = document.getElementById('save-import-input');
        if (!input || !input.value.trim()) {
            this.toast('⚠️ 请先粘贴你的存档码！');
            return;
        }
        const code = input.value.trim();
        const res = window.gameEngine.importSaveCode(code);
        if (res.error) {
            this.toast('❌ ' + res.error);
        } else {
            this.closeModal('modal-save-manager');
            this.toast(`🎉 成功载入【${res.labName}】科研进度！`);
        }
    }

    handleSaveFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const res = window.gameEngine.importSaveCode(content);
                if (res.error) {
                    this.toast('❌ ' + res.error);
                } else {
                    this.closeModal('modal-save-manager');
                    this.toast(`🎉 成功从文件载入【${res.labName}】科研进度！`);
                }
            } catch (err) {
                this.toast('❌ 读取存档文件失败！');
            }
        };
        reader.readAsText(file);
    }

    // ==================== 导师科研指导升级 ====================
    upgradeMentor() {
        const e = window.gameEngine;
        const res = e.upgradeMentorGuidance();
        if (res.error) {
            this.toast(res.error);
        } else if (res.success) {
            if (window.soundEngine) window.soundEngine.playUpgradeSuccess();
            this.toast(`👑 导师科研指导顿悟升级！晋升至 Lv.${res.level}【${res.tier.name}】！`);
            this.renderTopBar();
            this.renderStations();
        } else {
            if (window.soundEngine) window.soundEngine.playUpgradeFail();
            this.toast(`⚠️ 指导瓶颈攻关未果！获得 +${Math.round(res.luckAdded * 100)}% 领悟幸运保底！下次成功率攀升至 ${Math.round(res.nextChance * 100)}%！`);
            this.renderTopBar();
            this.renderStations();
        }
    }

    // ==================== 切换指导产物靶向 ====================
    setClickTarget(productKey) {
        const e = window.gameEngine;
        const res = e.setClickTarget(productKey);
        if (res.error) {
            this.toast(res.error);
        } else {
            const resInfo = GAME_DATA.resources[productKey] || {};
            this.toast(`🎯 导师指导已切换为靶向产出：【${resInfo.name || productKey}】！`);
            this.renderStations();
        }
    }

    // ==================== 设备强化概率升级 ====================
    upgrade(instanceId) {
        const r = window.gameEngine.upgradeStation(instanceId);
        if (r.error) {
            this.toast(r.error);
        } else if (r.success) {
            if (window.soundEngine) window.soundEngine.playUpgradeSuccess();
            this.toast(`⬆️ 调试大吉！【${r.eq.name}】成功强化升级至 Lv.${r.newLevel}！`);
            this.renderStations();
            this.renderTopBar();
        } else {
            if (window.soundEngine) window.soundEngine.playUpgradeFail();
            this.toast(`⚠️ 硬件调试未达标！攻关未果，获得 +${Math.round(r.luckAdded * 100)}% 调试保底！下次成功率升至 ${Math.round(r.nextChance * 100)}%！`);
            this.renderStations();
            this.renderTopBar();
        }
    }

    // ==================== 二手设备处置转让 ====================
    sellStationPrompt(instanceId) {
        const e = window.gameEngine;
        const inst = e.stationInstances.find(s => s.instanceId === instanceId);
        if (!inst) return;
        const eq = GAME_DATA.equipmentList.find(x => x.id === inst.eqId);
        if (!eq) return;

        let totalInvested = eq.price;
        if (inst.level > 1 && eq.upgradeBaseCost) {
            for (let lvl = 1; lvl < inst.level; lvl++) {
                totalInvested += eq.upgradeBaseCost * lvl;
            }
        }
        const refund = Math.round(totalInvested * 0.8 * 100) / 100;

        if (confirm(`确定要转让处置【${eq.name}】(Lv.${inst.level}) 吗？\n\n💰 将折旧回收并退还 +${refund} 万元科研经费！`)) {
            const r = e.sellStation(instanceId);
            if (r.error) {
                this.toast(r.error);
            } else if (r.success) {
                if (window.soundEngine) window.soundEngine.playRecycle();
                this.toast(`♻️ 已成功处置【${r.eqName}】，回笼科研经费 +${r.refund} 万元！`);
                this.renderStations();
                this.renderTopBar();
                this.renderResourcePanel();
                this.renderQuestBar();
            }
        }
    }

    // ==================== 模式切换 ====================
    switchMode(instanceId) {
        window.gameEngine.switchStationMode(instanceId);
        this.renderStations();
    }

    // ==================== 咖啡加速 ====================
    activateCoffee() {
        const r = window.gameEngine.activateCoffee();
        if (r.error) this.toast(r.error);
        else { this.toast('☕ 全组加速 ×1.5！'); this.renderTopBar(); this.renderBuffBar(); }
    }

    // ==================== 算力注入 ====================
    injectCompute() {
        const r = window.gameEngine.injectCompute();
        if (r.error) this.toast(r.error);
        else { this.toast('💉 注入成功！进度 +8%'); this.renderResourcePanel(); this.renderPaper(); }
    }

    // ==================== 购买设备 ====================
    buyEq(eqId) {
        const r = window.gameEngine.buyEquipment(eqId);
        if (r.error) this.toast(r.error);
        else {
            if (window.soundEngine) window.soundEngine.playBuy();
            this.toast('🔬 购置成功！');
            this.renderTopBar();
            this.renderShop();
            this.renderQuestBar();
        }
    }

    // ==================== 招生发帖与面试交互 ====================
    postRecruit(channelType) {
        const e = window.gameEngine;
        const res = e.postRecruitment(channelType);
        if (res.error) {
            this.toast(res.error);
        } else {
            if (window.soundEngine) window.soundEngine.playPaperStart();
            this.toast(`📢 收到 ${res.candidates.length} 份保研简历，请面试遴选！`);
            this.renderTopBar();
            this.renderResourcePanel();
            this.renderHR();
        }
    }

    admitCandidate(candidateId) {
        const e = window.gameEngine;
        const res = e.admitCandidate(candidateId);
        if (res.error) {
            this.toast(res.error);
        } else {
            if (window.soundEngine) window.soundEngine.playPaperAccept('zone2');
            this.toast(`🎉 已录取 ${res.member.name}！`);
            this.renderTopBar();
            this.renderResourcePanel();
            this.renderQuestBar();
            this.renderHR();
        }
    }

    dismissCandidates() {
        const e = window.gameEngine;
        e.dismissCandidates();
        this.toast('📋 已清空本批简历');
        this.renderHR();
    }

    recruit(name) {
        this.postRecruit('campus');
    }

    recruitLegend(id) {
        const r = window.gameEngine.recruitLegendaryMember(id);
        if (r.error) this.toast(r.error);
        else {
            if (window.soundEngine) window.soundEngine.playBreakthrough();
            this.toast('👑 天骄归位！');
            this.renderHR();
            this.renderTopBar();
            this.renderQuestBar();
        }
    }

    // ==================== 学生专项能力培养与突破交互 ====================
    trainMember(memberId, aptKey) {
        const e = window.gameEngine;
        const res = e.trainMemberOneOnOne(memberId, aptKey);
        if (res.error) {
            this.toast(res.error);
        } else {
            const aptInfo = GAME_DATA.aptitudes[aptKey];
            const critMsg = res.isCrit ? '💥 顿悟双倍灵感！' : '👨‍🏫 示教完成！';
            this.toast(`${critMsg}${res.member.name} 的【${aptInfo ? aptInfo.name : aptKey}】+${res.gainedExp} EXP！(${res.detail.exp}/${res.detail.maxExp})`);
            this.renderTopBar();
            this.renderResourcePanel();
            this.renderHR();
            this.renderStations();
        }
    }

    sendConference(memberId) {
        const e = window.gameEngine;
        const res = e.sendMemberToConference(memberId);
        if (res.error) {
            this.toast(res.error);
        } else {
            let msg = `🛫 ${res.member.name} 参加学术研讨会归来，全资质熟练度大涨！`;
            if (res.awakenedTrait) {
                msg += ` 🎉 顿悟新特质【${res.awakenedTrait.name}】！`;
            }
            this.toast(msg);
            this.renderTopBar();
            this.renderResourcePanel();
            this.renderHR();
            this.renderStations();
        }
    }

    hostJournalClub(memberId) {
        const e = window.gameEngine;
        const res = e.hostJournalClub(memberId);
        if (res.error) {
            this.toast(res.error);
        } else {
            this.toast(`☕ 组会文献精读圆满结束！${res.member.name} 理论与文献洞察 +20 EXP！`);
            this.renderTopBar();
            this.renderResourcePanel();
            this.renderHR();
            this.renderStations();
        }
    }

    breakthroughApt(memberId, aptKey) {
        const e = window.gameEngine;
        const res = e.breakthroughMemberApt(memberId, aptKey);
        if (res.error) {
            this.toast(res.error);
        } else if (res.success) {
            if (window.soundEngine) window.soundEngine.playBreakthrough();
            const aptInfo = GAME_DATA.aptitudes[aptKey];
            const traitMsg = res.awakenedTrait ? ` 💡 顿悟领悟专属特质【${res.awakenedTrait.name}】！` : '';
            this.toast(`👑 突破成功！${res.member.name} 的【${aptInfo ? aptInfo.name : aptKey}】晋升至 ${res.newRank} 级！课题组声望 +${res.prestigeGained}！${traitMsg}`);
            this.renderTopBar();
            this.renderResourcePanel();
            this.renderHR();
            this.renderStations();
        } else {
            if (window.soundEngine) window.soundEngine.playUpgradeFail();
            const aptInfo = GAME_DATA.aptitudes[aptKey];
            this.toast(`⚠️ 遇到学术瓶颈！攻关未果，返还 70% 熟练度，获得 +${Math.round(res.luckAdded * 100)}% 幸运保底！下次成功率攀升至 ${Math.round(res.nextChance * 100)}%！`);
            this.renderTopBar();
            this.renderResourcePanel();
            this.renderHR();
        }
    }

    // ==================== 论文立项弹窗 ====================
    openPaperModal(topicId) {
        this.paperTopicSelected = topicId;
        this.paperSlots = { leadId: null, coId: null, theoryId: null, testingId: null };
        this.paperZone = 'zone4';
        this.paperExtra = {};  // 超额数据投入 {films: 5, ...}
        this._renderPaperModal();
        this.openModal('modal-paper');
    }

    // 计算当前配置下的综合度（用于分区门槛判断）
    _calcLiveCombo(topic) {
        const e = window.gameEngine;
        const cm = window.characterManager;
        let score = 0;
        const lead = this.paperSlots.leadId ? e.members.find(m => m.id === this.paperSlots.leadId) : null;
        if (lead) score += cm.getMemberAptMult(lead, 'analysis') * 12;
        const co = this.paperSlots.coId ? e.members.find(m => m.id === this.paperSlots.coId) : null;
        if (co) score += cm.getMemberAptMult(co, 'lab') * 6;
        const theory = this.paperSlots.theoryId ? e.members.find(m => m.id === this.paperSlots.theoryId) : null;
        if (theory) score += cm.getMemberAptMult(theory, 'theory') * 6;
        const testing = this.paperSlots.testingId ? e.members.find(m => m.id === this.paperSlots.testingId) : null;
        if (testing) score += cm.getMemberAptMult(testing, 'lab') * 6;
        const totalExtra = Object.values(this.paperExtra).reduce((a, b) => a + b, 0);
        score += Math.min(30, totalExtra * 0.7);
        score += Math.min(15, Math.floor(e.prestige / 50) * 3);
        return Math.min(110, score);
    }

    _renderPaperModal() {
        const e = window.gameEngine;
        const topic = GAME_DATA.paperTopics.find(t => t.id === this.paperTopicSelected);
        if (!topic) return;
        const body = document.getElementById('paper-modal-body');

        // 配方
        let recipeHtml = '';
        for (let [k, v] of Object.entries(topic.reqData)) {
            const have = Math.floor(e.inventory[k] || 0);
            const res = GAME_DATA.resources[k];
            recipeHtml += `<span class="recipe-item ${have >= v ? 'met' : 'unmet'}">${res.icon} ${res.name} <span class="recipe-val">${have}/${v}</span></span>`;
        }

        // 投递分区选择
        const liveCombo = this._calcLiveCombo(topic);
        let zoneHtml = '';
        for (let z of GAME_DATA.paperZones) {
            const canReach = liveCombo >= z.requireCombo;
            const funding = Math.round(topic.equipCost * 0.5 * z.mult);
            const selected = this.paperZone === z.id;
            zoneHtml += `<div class="zone-option ${selected ? 'selected' : ''} ${canReach ? '' : 'locked'}" onclick="window.ui.selectZone('${z.id}')">
                <div class="zone-head"><span class="zone-icon">${z.icon}</span><span class="zone-name">${z.name}</span><span class="zone-funding">💵 +${funding}万</span></div>
                <div class="zone-desc">${z.desc}</div>
                <div class="zone-gate">${canReach ? `综合度${Math.floor(liveCombo)}/${z.requireCombo} ✅` : `综合度${Math.floor(liveCombo)}/${z.requireCombo} 🔒`}</div>
            </div>`;
        }

        // 超额数据投入
        let extraHtml = '<div class="slot-divider">📊 超额数据投入（冲高分区关键）</div>';
        for (let [k, v] of Object.entries(topic.reqData)) {
            const have = Math.floor(e.inventory[k] || 0);
            const res = GAME_DATA.resources[k];
            const extra = this.paperExtra[k] || 0;
            extraHtml += `<div class="extra-row">
                <span style="font-size:12px;flex:1">${res.icon} ${res.name} <span style="color:var(--text3)">现有${have}份</span></span>
                <div style="display:flex;align-items:center;gap:6px">
                    <button class="extra-btn" onclick="window.ui.adjustExtra('${k}',-5)">-5</button>
                    <span style="min-width:36px;text-align:center;font-weight:700">+${extra}</span>
                    <button class="extra-btn" onclick="window.ui.adjustExtra('${k}',5)">+5</button>
                </div>
            </div>`;
        }

        // 插槽
        const roles = [
            { key: 'leadId', label: '第一作者', icon: '✍️', aptKey: 'analysis' },
            { key: 'coId', label: '共同一作', icon: '🤝', aptKey: 'lab' },
            { key: 'theoryId', label: '机理理论', icon: '🧮', aptKey: 'theory' },
            { key: 'testingId', label: '测试先锋', icon: '🔧', aptKey: 'lab' }
        ];
        let slotsHtml = '';
        for (let r of roles) {
            const id = this.paperSlots[r.key];
            const m = id ? e.members.find(x => x.id === id) : null;
            const grade = m ? window.characterManager.getMemberAptGrade(m, r.aptKey) : null;
            const color = grade ? window.characterManager.getAptGradeColor(grade) : '#64748b';
            slotsHtml += `<div class="slot-card" onclick="window.ui.pickSlot('${r.key}')">
                <div class="slot-role">${r.icon} ${r.label}</div>
                ${m ? `<div class="slot-avatar">${m.avatar}</div><div class="slot-name">${m.name}</div><div class="slot-apt" style="color:${color}">${GAME_DATA.aptitudes[r.aptKey].icon}${grade}</div>` : '<div class="slot-avatar slot-empty">➕</div><div class="slot-name slot-empty">点击指派</div>'}
            </div>`;
        }

        body.innerHTML = `
            <div style="margin-bottom:10px">
                <div style="font-size:15px;font-weight:700;margin-bottom:4px">${topic.icon} ${topic.title}</div>
                <div style="font-size:12px;color:var(--text2)">${topic.desc}</div>
            </div>
            <div style="font-size:12px;margin-bottom:10px">📋 数据配方：${recipeHtml}</div>
            <div class="slot-divider">🎯 选择投递分区（越高级奖励越多越难录用）</div>
            <div class="zone-grid">${zoneHtml}</div>
            ${extraHtml}
            <div class="slot-divider">👥 指派团队（资质对口提升综合度）</div>
            <div class="slot-grid">${slotsHtml}</div>
            <button class="btn-start-paper" style="margin-top:10px" onclick="window.ui.confirmStartPaper()" ${!this.paperSlots.leadId ? 'disabled' : ''}>
                ${this.paperSlots.leadId ? '🚀 开始动工攻坚' : '请先指派第一作者'}
            </button>
            <div style="font-size:11px;color:var(--text3);text-align:center;margin-top:6px">💡 综合度 = 团队资质 + 超额数据 + 声誉 + 构思<br>档位不达标无法投；审稿阶段还有突发博弈！</div>
        `;
    }

    selectZone(zoneKey) {
        this.paperZone = zoneKey;
        this._renderPaperModal();
    }

    adjustExtra(resKey, delta) {
        const e = window.gameEngine;
        const topic = GAME_DATA.paperTopics.find(t => t.id === this.paperTopicSelected);
        const cur = this.paperExtra[resKey] || 0;
        const next = Math.max(0, cur + delta);
        const available = Math.floor(e.inventory[resKey] || 0) - (topic.reqData[resKey] || 0);
        if (next > available) { this.toast('超出可用数据量'); return; }
        if (next === 0) delete this.paperExtra[resKey];
        else this.paperExtra[resKey] = next;
        this._renderPaperModal();
    }

    pickSlot(roleKey) {
        this.pickingRole = roleKey;
        const e = window.gameEngine;
        const body = document.getElementById('assign-modal-body');
        const title = document.getElementById('assign-title');
        const roleInfo = { leadId: '第一作者', coId: '共同一作', theoryId: '机理理论', testingId: '测试先锋' };
        if (title) title.innerText = `选择${roleInfo[roleKey]}`;

        const aptKey = { leadId: 'analysis', coId: 'lab', theoryId: 'theory', testingId: 'lab' }[roleKey];

        body.innerHTML = e.members.map(m => {
            const grade = window.characterManager.getMemberAptGrade(m, aptKey);
            const color = window.characterManager.getAptGradeColor(grade);
            const selected = this.paperSlots[roleKey] === m.id;
            const inOtherSlot = Object.entries(this.paperSlots).some(([k, v]) => k !== roleKey && v === m.id);
            return `<div class="assign-list-item" onclick="window.ui.doPickSlot('${m.id}')" ${inOtherSlot ? 'style="opacity:.4"' : ''}>
                <span class="ali-avatar">${m.avatar}</span>
                <span class="ali-name">${m.name} ${selected ? '✅' : ''} ${inOtherSlot ? '(已指派)' : ''}</span>
                <span class="ali-apt" style="background:${color}33;color:${color}">${GAME_DATA.aptitudes[aptKey].icon}${grade}</span>
            </div>`;
        }).join('') + `<div class="assign-list-item" onclick="window.ui.doPickSlot('')"><span class="ali-avatar">🚫</span><span class="ali-name" style="color:var(--text3)">取消</span></div>`;

        this.openModal('modal-assign');
    }

    doPickSlot(memberId) {
        if (this.pickingRole && memberId) {
            this.paperSlots[this.pickingRole] = memberId;
        } else if (this.pickingRole) {
            this.paperSlots[this.pickingRole] = null;
        }
        this.closeModal('modal-assign');
        this._renderPaperModal();
    }

    confirmStartPaper() {
        const r = window.gameEngine.startPaperProject(
            this.paperTopicSelected,
            this.paperZone,
            this.paperSlots.leadId,
            this.paperSlots.coId,
            this.paperSlots.theoryId,
            this.paperSlots.testingId,
            { ...this.paperExtra }
        );
        if (r.error) { this.toast(r.error); return; }
        if (window.soundEngine) window.soundEngine.playPaperStart();
        this.closeModal('modal-paper');
        this.toast('📝 立项成功！');
        this.renderPaper();
        this.renderResourcePanel();
    }

    // ==================== 审稿抢手事件弹窗 ====================
    showReviewEvent(event) {
        const body = document.getElementById('monthly-body');
        const title = document.getElementById('monthly-title');
        if (title) title.innerText = `⚡ 审稿突发事件`;
        let html = `<div class="monthly-event">
            <div class="monthly-event-title">${event.title}</div>
            <div class="monthly-event-desc">${event.desc}</div>
            <div class="monthly-choices">`;
        for (let i = 0; i < event.choices.length; i++) {
            const ch = event.choices[i];
            html += `<button class="monthly-choice-btn" onclick="window.ui.resolveReviewEvent(${i})">${ch.label}</button>`;
        }
        html += `</div></div>`;
        body.innerHTML = html;
        this.closeModal('modal-paper');
        this.openModal('modal-monthly');
    }

    resolveReviewEvent(choiceIndex) {
        window.gameEngine.resolveReviewEvent(choiceIndex);
        this.closeModal('modal-monthly');
        this.toast('⚡ 审稿事件已处理');
    }

    // ==================== 成就系统 ====================
    openAchievement() {
        const body = document.getElementById('achievement-body');
        if (!body) return;
        const e = window.gameEngine;
        const cats = ['论文', '分区', '资质', '评级', '设备', '人事'];
        let html = '';
        html += `<div style="font-size:12px;color:var(--text2);margin-bottom:10px">已解锁 ${e.achievements.length}/${GAME_DATA.achievements.length} 项成就</div>`;

        for (let cat of cats) {
            const list = GAME_DATA.achievements.filter(a => a.cat === cat);
            if (list.length === 0) continue;
            html += `<div class="ach-cat-title">${cat}</div><div class="ach-grid">`;
            for (let ach of list) {
                const unlocked = e.achievements.includes(ach.id);
                html += `<div class="ach-item ${unlocked ? 'unlocked' : ''}">
                    <div class="ach-icon">${ach.icon}</div>
                    <div class="ach-info">
                        <div class="ach-name">${ach.name}</div>
                        <div class="ach-desc">${ach.desc}</div>
                    </div>
                    ${unlocked ? '<div class="ach-done">✅</div>' : ''}
                </div>`;
            }
            html += '</div>';
        }

        body.innerHTML = html;
        this.openModal('modal-achievement');
    }

    // 成就达成通知 (非打断式悬浮横幅)
    notifyAchievement(ach) {
        const toast = document.getElementById('achievement-toast');
        let rewardText = '';
        if (ach.rewardFunding) rewardText += `+${ach.rewardFunding}万经费 `;
        if (ach.rewardPrestige) rewardText += `+${ach.rewardPrestige}声望`;

        if (toast) {
            toast.innerHTML = `
                <div class="ach-toast-icon">${ach.icon}</div>
                <div class="ach-toast-info">
                    <div class="ach-toast-title">🏆 成就解锁：${ach.name}</div>
                    <div class="ach-toast-desc">${ach.desc} · <span class="ach-toast-reward">${rewardText || '达成！'}</span></div>
                </div>
            `;
            toast.classList.add('show');
            clearTimeout(this._achToastTimer);
            this._achToastTimer = setTimeout(() => {
                toast.classList.remove('show');
            }, 2800);
        } else {
            this.toast(`🏆 成就解锁：${ach.name} (${rewardText})`);
        }
    }

    // ==================== 季度报告弹窗 ====================
    showMonthlyReport(report) {
        const hasChoice = report.events.some(ev => ev.type === 'choice');

        // 纯汇总 + 自动事件：不打断游戏，仅轻提示
        if (!hasChoice) {
            this.toast('📊 季度报告已生成，详见消息日志 📜');
            return;
        }

        const body = document.getElementById('monthly-body');
        const title = document.getElementById('monthly-title');
        if (title) title.innerText = `📋 ${report.year}年${report.month}月 季度报告`;

        let html = '';

        // 产出汇总
        if (report.summary.length > 0) {
            html += '<div class="monthly-summary"><div class="monthly-summary-title">📊 本季度汇总</div>';
            for (let line of report.summary) html += `<div class="monthly-summary-line">${line}</div>`;
            html += '</div>';
        }

        // 事件
        for (let evt of report.events) {
            if (evt.type === 'auto') continue; // 自动事件已在日志中
            if (evt.type === 'choice') {
                html += `<div class="monthly-event" id="me-${evt.id}">
                    <div class="monthly-event-title">${evt.title}</div>
                    <div class="monthly-event-desc">${evt.desc}</div>
                    <div class="monthly-choices">`;
                for (let i = 0; i < evt.choices.length; i++) {
                    const ch = evt.choices[i];
                    html += `<button class="monthly-choice-btn" onclick="window.ui.resolveMonthly('${evt.id}', ${i})">${ch.label}</button>`;
                }
                html += `</div></div>`;
            }
        }

        if (report.events.filter(e => e.type === 'choice').length === 0 && report.summary.length === 0) {
            html += '<div class="empty-hint">本季度平稳运行</div>';
        }

        body.innerHTML = html;
        this.openModal('modal-monthly');
    }

    resolveMonthly(eventId, choiceIdx) {
        const e = window.gameEngine;
        const report = window.eventEngine.monthlyReport;
        const event = report ? report.events.find(ev => ev.id === eventId) : null;
        if (!event) return;

        const result = window.eventEngine.resolveChoiceEvent(event, e, choiceIdx);
        if (result && result.error) { this.toast(result.error); return; }

        // 更新UI
        const card = document.getElementById(`me-${eventId}`);
        if (card) {
            card.innerHTML = `<div class="monthly-event-title">${event.title}</div>
                <div class="monthly-event-result result-normal">${result ? result.text : '已处理'}</div>`;
        }
        this.renderTopBar();
        this.renderResourcePanel();
    }

    // ==================== 日志 ====================
    renderChronicle() {
        const body = document.getElementById('log-body');
        if (!body) return;
        const logs = window.eventEngine.recentLogs;
        if (logs.length === 0) { body.innerHTML = '<div class="empty-hint">暂无记录</div>'; return; }
        body.innerHTML = logs.slice(0, 50).map(l =>
            `<div class="log-item log-${l.type}"><div class="log-time">${l.timeStr}</div><div>${l.text}</div></div>`
        ).join('');
    }

    // ==================== 口令码 ====================
    doRedeem() {
        const input = document.getElementById('input-code');
        const code = input ? input.value : '';
        const r = window.gameEngine.redeemCode(code);
        if (r.error) this.toast(r.error);
        else { this.toast('🎁 兑换成功！'); if (input) input.value = ''; this.renderTopBar(); this.renderResourcePanel(); this.closeModal('modal-redeem'); }
    }

    // ==================== 速度切换（带渐进解锁） ====================
    toggleSpeed() {
        const e = window.gameEngine;
        const info = e.getSpeedUnlockInfo();
        const unlockedSpeeds = info.filter(s => s.unlocked);

        if (unlockedSpeeds.length <= 1) {
            const nextTier = info[1];
            this.toast(`🔒 加速未解锁！${nextTier.desc}`);
            return;
        }

        const nextSpeed = e.getNextUnlockedSpeed();
        e.time.speed = nextSpeed;
        const btn = document.getElementById('btn-speed');
        if (btn) {
            btn.innerText = `⚡ x${nextSpeed}`;
            btn.className = `ctrl-btn ${nextSpeed > 1 ? 'btn-speed-active' : ''}`;
        }
        this.toast(`⏩ 速度已切换至 x${nextSpeed} 倍速！`);
    }

    // ==================== Toast ====================
    toast(msg) {
        if (window.soundEngine) window.soundEngine.playToast();
        const t = document.getElementById('toast');
        if (!t) return;
        t.innerText = msg;
        t.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
    }

    // ==================== 飞字动画 ====================
    showFloatText(instanceId, text) {
        const card = document.getElementById(`card-${instanceId}`);
        if (!card) return;
        const el = document.createElement('div');
        el.className = 'float-text';
        el.innerText = text;
        el.style.right = '12px';
        el.style.top = '50%';
        el.style.color = '#4ade80';
        card.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    }

    // ==================== 论文进度实时更新 ====================
    updatePaperProgress() {
        const e = window.gameEngine;
        if (e.currentPaperProject && this.currentTab === 'paper') {
            const activeCard = document.querySelector('.paper-active-card');
            if (activeCard) {
                // 重新渲染论文视图（轻量）
                this.renderPaper();
            }
        }
    }

    // ==================== 点击与连击互动系统（支持主动点按与持续按住） ====================
    startHoldClick(event) {
        if (event && event.type === 'touchstart') {
            // 触屏轻微振动反馈
            if (window.navigator && window.navigator.vibrate) {
                try { window.navigator.vibrate(15); } catch(e) {}
            }
        }
        if (this._holdInterval) {
            clearInterval(this._holdInterval);
            this._holdInterval = null;
        }
        if (this._holdDelayTimeout) {
            clearTimeout(this._holdDelayTimeout);
            this._holdDelayTimeout = null;
        }

        // 立即触发单次主动点击（享受高爆发与全额连击）
        this.handleClickResearch(event, null, false);

        // 如果按住超过 160ms，进入持续平稳科研流
        this._holdDelayTimeout = setTimeout(() => {
            this._isHoldingClick = true;
            const btn = document.querySelector('.click-tap-button');
            if (btn) btn.classList.add('holding-active');

            this._holdInterval = setInterval(() => {
                this.handleClickResearch(null, null, true);
            }, 120); // 每 120ms 一轮
        }, 160);
    }

    stopHoldClick(event) {
        if (this._holdDelayTimeout) {
            clearTimeout(this._holdDelayTimeout);
            this._holdDelayTimeout = null;
        }
        if (this._holdInterval) {
            clearInterval(this._holdInterval);
            this._holdInterval = null;
        }
        this._isHoldingClick = false;
        const btn = document.querySelector('.click-tap-button');
        if (btn) btn.classList.remove('holding-active');
    }

    handleClickResearch(event, targetEqId = null, isHoldStream = false) {
        if (event) event.stopPropagation();
        const e = window.gameEngine;
        const res = e.performManualClick(targetEqId, isHoldStream);

        // 触发音效
        if (window.soundEngine) {
            if (res.isCrit) window.soundEngine.playCritClick();
            else window.soundEngine.playClick(res.combo);
        }

        // 获取点击坐标
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2 - 30;
        if (event && (event.clientX || event.touches)) {
            x = event.touches ? event.touches[0].clientX : event.clientX;
            y = event.touches ? event.touches[0].clientY : event.clientY;
        }

        // 构造浮动文字
        let text = `+${res.yieldAmount.toFixed(2)} ${res.productName}`;
        if (res.paperSpeedup > 0) {
            text = `⚡ 论文 +${res.paperSpeedup.toFixed(1)}%! (+${res.yieldAmount.toFixed(2)})`;
        }
        if (res.isCrit) {
            text = `💥 暴击! ${text}`;
        }

        // 长按模式下适当节流粒子以保证丝滑流畅
        if (!isHoldStream || Math.random() < 0.45) {
            this.spawnClickParticle(x, y, text, res.isCrit);
        }

        this.updateClickConsole();
        this.updateRecyclePanel();
        this.renderResourcePanel();

        // 如果在论文页面，更新进度条
        if (this.currentTab === 'paper') {
            this.updatePaperProgress();
        }
    }

    // 导师直接点击具体设备卡片：对该工位进行重点实验指导与爆发产出
    handleClickStation(instId, event) {
        if (event) event.stopPropagation();
        const e = window.gameEngine;
        const inst = e.stationInstances.find(s => s.instanceId === instId);
        if (!inst) return;
        const eq = GAME_DATA.equipmentList.find(x => x.id === inst.eqId);
        if (!eq) return;

        // 导师单次重点指导该工位产品
        const res = e.performManualClick(eq.id, false);

        // 触发音效
        if (window.soundEngine) {
            window.soundEngine.playStationClick();
            if (res.isCrit) window.soundEngine.playCritClick();
            else window.soundEngine.playClick(res.combo);
        }

        const cardEl = document.getElementById(`card-${instId}`);
        if (cardEl) {
            cardEl.classList.remove('station-clicked');
            void cardEl.offsetWidth; // 触发 reflow 产生轻微震颤下压弹性动效
            cardEl.classList.add('station-clicked');
            setTimeout(() => { if (cardEl) cardEl.classList.remove('station-clicked'); }, 180);
        }

        // 获取点击位置
        const rect = cardEl ? cardEl.getBoundingClientRect() : null;
        const x = (event && event.clientX && event.clientX > 0) ? event.clientX : (rect ? rect.left + rect.width * 0.45 : window.innerWidth / 2);
        const y = (event && event.clientY && event.clientY > 0) ? event.clientY : (rect ? rect.top + 50 : window.innerHeight / 2);

        let text = `+${res.yieldAmount.toFixed(2)} ${res.productName}`;
        if (res.paperSpeedup > 0) {
            text = `⚡ 论文+${res.paperSpeedup.toFixed(1)}%! (+${res.yieldAmount.toFixed(2)})`;
        }
        if (res.isCrit) {
            text = `💥 导师暴击! ${text}`;
        }
        if (res.notice) {
            text += ` (${res.notice})`;
        }

        this.spawnClickParticle(x, y, text, res.isCrit);
        this.updateClickConsole();
        this.updateRecyclePanel();
        this.renderResourcePanel();
        if (this.currentTab === 'paper') this.updatePaperProgress();
    }

    // 运行中的工位周期性自动冒泡粒子特效（让玩家挂机时看着各仪器设备不断冒泡产出）
    spawnStationAutoBubble(instId, text, isCrit = false) {
        const cardEl = document.getElementById(`card-${instId}`);
        if (!cardEl) return;
        const rect = cardEl.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return; // 视口外不生成DOM

        const x = rect.left + rect.width * 0.35 + (Math.random() - 0.5) * 36;
        const y = rect.top + 45 + (Math.random() - 0.5) * 16;

        const particle = document.createElement('div');
        particle.className = `station-float-particle ${isCrit ? 'crit' : ''}`;
        particle.innerText = text;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        document.body.appendChild(particle);
        setTimeout(() => {
            if (particle && particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1200);
    }

    // 动态生成点击上浮粒子特效
    spawnClickParticle(x, y, text, isCrit) {
        const particle = document.createElement('div');
        particle.className = `click-particle ${isCrit ? 'particle-crit' : ''}`;
        particle.innerText = text;
        
        // 微量随机偏移
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 20;
        particle.style.left = `${x + offsetX}px`;
        particle.style.top = `${y + offsetY}px`;

        document.body.appendChild(particle);
        setTimeout(() => {
            if (particle && particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 900);
    }

    // 轻量实时更新点击控制台显示 (无需重绘整个DOM)
    updateClickConsole() {
        const e = window.gameEngine;
        const consoleEl = document.getElementById('research-click-console');
        if (!consoleEl) return;

        const comboStage = e.getComboStage();
        const autoCPS = e.getLabAutoCPS();
        const autoPower = e.getLabAutoClickPower();
        const combo = e.combo || 0;

        const badgeEl = document.getElementById('click-combo-badge');
        if (badgeEl) {
            badgeEl.innerText = comboStage.name;
            badgeEl.style.color = comboStage.color;
            badgeEl.style.borderColor = comboStage.color;
            badgeEl.style.backgroundColor = `${comboStage.color}22`;
        }

        const autoBadgeEl = document.getElementById('click-auto-cps-badge');
        if (autoBadgeEl) {
            autoBadgeEl.innerHTML = `🤖 操作员自动连点: <b>${autoCPS.toFixed(1)}</b>次/秒 (+${autoPower.toFixed(2)}/s)`;
        }

        const countEl = document.getElementById('click-combo-count');
        if (countEl) {
            countEl.innerHTML = `🔥 连击 <b>x${Math.floor(combo)}</b> (${comboStage.mult.toFixed(1)}x)`;
        }

        const fillEl = document.getElementById('click-combo-bar-fill');
        if (fillEl) {
            fillEl.style.width = `${Math.min(100, (combo / 50) * 100)}%`;
            fillEl.style.backgroundColor = comboStage.color;
        }

        // 连击光效类
        consoleEl.className = `research-click-console ${comboStage.badgeClass}`;
    }

    // 轻量实时更新产学研回收卖出面板库存与金额 (实时同步，零卡顿)
    updateRecyclePanel() {
        const e = window.gameEngine;
        const panelEl = document.getElementById('recycle-panel-container');
        if (!panelEl) return;

        const priceTable = GAME_DATA.recyclePrices || {};
        let totalRecycleStock = 0;
        let grandTotalYuan = 0;

        for (let [resKey, info] of Object.entries(priceTable)) {
            const isUnlocked = e.isResourceUnlocked(resKey);
            const stock = Math.floor(e.inventory[resKey] || 0);
            const itemYuan = stock * info.unitYuan;
            const itemWan = (stock * info.unitWan).toFixed(3);

            if (isUnlocked || stock > 0) {
                totalRecycleStock += stock;
                grandTotalYuan += itemYuan;

                const stockBadge = document.getElementById(`ric-stock-${resKey}`);
                if (stockBadge) {
                    stockBadge.innerHTML = `余 <b>${stock}</b> 份`;
                }

                const valText = document.getElementById(`ric-val-${resKey}`);
                if (valText) {
                    valText.innerHTML = `可转让: <b style="color:var(--green)">+${itemYuan.toLocaleString()} 元</b> (${itemWan}万)`;
                }

                const btn10 = document.getElementById(`ric-btn-10-${resKey}`);
                if (btn10) btn10.disabled = (stock < 10);

                const btn50 = document.getElementById(`ric-btn-50-${resKey}`);
                if (btn50) btn50.disabled = (stock < 50);

                const btnAll = document.getElementById(`ric-btn-all-${resKey}`);
                if (btnAll) btnAll.disabled = (stock <= 0);
            }
        }

        const grandTotalWan = (grandTotalYuan * 0.0001).toFixed(3);
        const grandYuanEl = document.getElementById('ric-grand-yuan');
        if (grandYuanEl) grandYuanEl.innerText = `${grandTotalYuan.toLocaleString()} 元`;

        const grandWanEl = document.getElementById('ric-grand-wan');
        if (grandWanEl) grandWanEl.innerText = `(${grandTotalWan} 万元)`;

        const btnGrand = document.getElementById('btn-recycle-grand');
        if (btnGrand) {
            btnGrand.innerText = `⚡ 产学研一键全品类清仓转让 (共 ${totalRecycleStock} 份 / 收益 +${grandTotalYuan.toLocaleString()} 元)`;
            btnGrand.disabled = (totalRecycleStock <= 0);
        }
    }
}

window.ui = new UIController();
