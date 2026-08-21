/**
 * X-Opto Lab 课题组模拟器 - 主程序入口与仿真时钟
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化引擎与UI
    window.gameEngine.init();
    window.ui.init();
    if (window.soundEngine) window.soundEngine.updateSoundBtn();
    if (window.ui.checkNewbieGuideOnStartup) window.ui.checkNewbieGuideOnStartup();

    let lastTime = performance.now();
    let saveAccumulator = 0;
    let uiAccumulator = 0;
    let stationBubbleAccumulator = 0;

    function simLoop(currentTime) {
        const deltaMs = currentTime - lastTime;
        lastTime = currentTime;
        const deltaSec = deltaMs / 1000;
        const clampedDelta = Math.min(1.0, deltaSec);

        if (window.gameEngine.hasStarted) {
            // 仿真推进
            window.gameEngine.tick(clampedDelta);

            // 轻量UI每帧更新（只更新文本，不重建大DOM）
            window.ui.renderTopBar();
            window.ui.renderBuffBar();

            // 资源面板和任务条降频更新（每0.3秒）
            uiAccumulator += clampedDelta;
            if (uiAccumulator >= 0.3) {
                window.ui.renderResourcePanel();
                window.ui.renderQuestBar();
                if (window.ui.currentTab === 'stations') {
                    window.ui.updateClickConsole();
                    window.ui.updateRecyclePanel();
                }
                // 论文进度实时更新
                if (window.ui.currentTab === 'paper') {
                    window.ui.updatePaperProgress();
                }
                uiAccumulator = 0;
            }

            // 设备工位在产高频飘字特效（每 0.8 秒触发运转仪器原位冒泡飞字，全场科研氛围拉满）
            stationBubbleAccumulator += clampedDelta;
            if (stationBubbleAccumulator >= 0.8) {
                if (window.ui.currentTab === 'stations') {
                    const e = window.gameEngine;
                    const runningStations = e.stationInstances.filter(s => s.operatorId && !s.brokenUntilDay && !s.isLackingMaterials);
                    if (runningStations.length > 0) {
                        for (let inst of runningStations) {
                            const eq = GAME_DATA.equipmentList.find(x => x.id === inst.eqId);
                            if (eq && Math.random() < 0.75) {
                                const { amount: yieldAmt } = e._calcYield(inst);
                                if (yieldAmt > 0) {
                                    window.ui.spawnStationYieldFloat(inst.instanceId, `+${yieldAmt.toFixed(2)} ${eq.icon}`);
                                }
                            }
                        }
                    }
                }
                stationBubbleAccumulator = 0;
            }
        }

        // 自动存档（每10秒）
        saveAccumulator += clampedDelta;
        if (saveAccumulator >= 10) {
            if (window.gameEngine.hasStarted) window.gameEngine.saveGame();
            saveAccumulator = 0;
        }

        requestAnimationFrame(simLoop);
    }

    requestAnimationFrame(simLoop);

    // 关闭页面前存档
    window.addEventListener('beforeunload', () => {
        if (window.gameEngine && window.gameEngine.hasStarted && !window.gameEngine._isResetting) {
            window.gameEngine.saveGame();
        }
    });

    console.log('🔬 X-Opto Lab 课题组模拟器已就绪！');
});
