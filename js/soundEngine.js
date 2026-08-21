/**
 * 《X-Opto Lab 课题组模拟器》 - 纯原生 Web Audio 仿真音效引擎
 * 零外部音频依赖，完全基于 Web Audio API 合成真实实验室氛围、仪器脉冲、连击升调与学术事件音效。
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.volume = 0.65;
        this.unlocked = false;

        // 读取持久化静音状态
        try {
            const savedMute = localStorage.getItem('xopto_sound_muted');
            if (savedMute !== null) {
                this.muted = savedMute === 'true';
            }
        } catch (e) {}

        // 用户首次点击页面时自动激活 AudioContext（规避浏览器自动播放限制）
        const unlock = () => {
            this._ensureContext();
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('pointerdown', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
    }

    _ensureContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.unlocked = true;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this._ensureContext();
        this.muted = !this.muted;
        try {
            localStorage.setItem('xopto_sound_muted', this.muted ? 'true' : 'false');
        } catch (e) {}
        this.updateSoundBtn();
        if (!this.muted) {
            this.playClick(10);
            if (window.ui) window.ui.toast('🔊 音效已开启');
        } else {
            if (window.ui) window.ui.toast('🔇 音效已静音');
        }
        return this.muted;
    }

    updateSoundBtn() {
        const btn = document.getElementById('btn-sound');
        if (btn) {
            btn.innerHTML = this.muted ? '🔇' : '🔊';
            btn.title = this.muted ? '音效已静音（点击开启）' : '音效已开启（点击静音）';
        }
    }

    _playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.2, detune = 0, fadeOut = true) {
        if (this.muted) return;
        this._ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            if (detune !== 0) osc.detune.setValueAtTime(detune, now);

            gain.gain.setValueAtTime(gainVal * this.volume, now);
            if (fadeOut) {
                gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            }

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration + 0.05);
        } catch (e) {}
    }

    // ==================== 1. 导师指导与连击音阶 ====================
    playClick(combo = 0) {
        if (this.muted) return;
        this._ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            // 随连击数音高梯级递增（如同移液枪精准调档与数字跳动）
            const pitchBonus = Math.min(combo * 14, 600);
            const baseFreq = 420 + pitchBonus;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.08);

            gain.gain.setValueAtTime(0.22 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {}
    }

    // 暴击高能脉冲
    playCritClick() {
        if (this.muted) return;
        this._playTone(880, 'triangle', 0.15, 0.35);
        setTimeout(() => this._playTone(1320, 'sine', 0.18, 0.3), 30);
        setTimeout(() => this._playTone(1760, 'sine', 0.22, 0.25), 60);
    }

    // 设备点击指导
    playStationClick() {
        if (this.muted) return;
        this._playTone(320, 'triangle', 0.12, 0.25);
        setTimeout(() => this._playTone(480, 'sine', 0.15, 0.2), 35);
    }

    // ==================== 2. 资金回收与设备购置 ====================
    // 回收变现金币清脆声
    playRecycle() {
        if (this.muted) return;
        this._playTone(987.77, 'sine', 0.08, 0.22); // B5
        setTimeout(() => this._playTone(1318.51, 'sine', 0.12, 0.25), 45); // E6
        setTimeout(() => this._playTone(1975.53, 'sine', 0.18, 0.28), 90); // B6
    }

    // 购置新仪器设备机械锁止声
    playBuy() {
        if (this.muted) return;
        this._playTone(220, 'square', 0.1, 0.15);
        setTimeout(() => this._playTone(440, 'triangle', 0.15, 0.25), 40);
        setTimeout(() => this._playTone(880, 'sine', 0.25, 0.3), 90);
    }

    // ==================== 3. 概率升级与境界突破 ====================
    // 升级成功 (跃升大吉)
    playUpgradeSuccess() {
        if (this.muted) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 -> E5 -> G5 -> C6
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this._playTone(freq, 'triangle', 0.2, 0.28);
            }, idx * 60);
        });
    }

    // 升级失败 (调试公差落选保底)
    playUpgradeFail() {
        if (this.muted) return;
        this._playTone(280, 'sawtooth', 0.15, 0.2);
        setTimeout(() => this._playTone(220, 'sawtooth', 0.25, 0.22), 80);
    }

    // 境界大突破 (D -> S/SS 仙音)
    playBreakthrough() {
        if (this.muted) return;
        const chords = [
            [440, 554.37, 659.25], // A大调
            [554.37, 659.25, 880],
            [659.25, 880, 1108.73],
            [880, 1108.73, 1318.51]
        ];
        chords.forEach((chord, step) => {
            setTimeout(() => {
                chord.forEach(f => this._playTone(f, 'sine', 0.35, 0.18));
            }, step * 85);
        });
    }

    // ==================== 4. 论文系统音效 ====================
    // 论文立项开题
    playPaperStart() {
        if (this.muted) return;
        this._playTone(392, 'sine', 0.1, 0.2);
        setTimeout(() => this._playTone(523.25, 'sine', 0.15, 0.25), 60);
    }

    // 论文投稿审稿中
    playPaperSubmit() {
        if (this.muted) return;
        this._playTone(600, 'triangle', 0.1, 0.2);
        setTimeout(() => this._playTone(750, 'triangle', 0.15, 0.2), 50);
        setTimeout(() => this._playTone(900, 'sine', 0.2, 0.25), 100);
    }

    // 论文录用 (按分区递增豪华程度)
    playPaperAccept(zoneId = 'zone4') {
        if (this.muted) return;
        if (zoneId === 'supreme' || zoneId === 'zone1') {
            // 顶刊/1区 宏大胜利交响和弦
            const grandFanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
            grandFanfare.forEach((f, idx) => {
                setTimeout(() => {
                    this._playTone(f, 'triangle', 0.35, 0.26);
                }, idx * 65);
            });
        } else {
            // 普通分区录用欢呼
            [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
                setTimeout(() => {
                    this._playTone(f, 'sine', 0.25, 0.22);
                }, idx * 75);
            });
        }
    }

    // 论文被拒 (Reviewer #2 叹息)
    playPaperReject() {
        if (this.muted) return;
        this._playTone(440, 'sine', 0.2, 0.25);
        setTimeout(() => this._playTone(415.30, 'sine', 0.25, 0.25), 90);
        setTimeout(() => this._playTone(392.00, 'sine', 0.4, 0.3), 180);
    }

    // ==================== 5. 特色机制音效 ====================
    // 咖啡提神
    playCoffee() {
        if (this.muted) return;
        // 模拟咖啡萃取蒸汽与活力音
        this._playTone(300, 'triangle', 0.15, 0.2);
        setTimeout(() => this._playTone(587.33, 'sine', 0.15, 0.25), 50);
        setTimeout(() => this._playTone(880.00, 'sine', 0.25, 0.3), 110);
    }

    // 算力注入论文
    playComputeInject() {
        if (this.muted) return;
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this._playTone(1000 + i * 300, 'sine', 0.06, 0.18);
            }, i * 35);
        }
    }

    // 成就达成
    playAchievement() {
        if (this.muted) return;
        const notes = [659.25, 880, 1108.73, 1318.51];
        notes.forEach((f, i) => {
            setTimeout(() => this._playTone(f, 'triangle', 0.3, 0.24), i * 70);
        });
    }

    // 界面轻量级微交互
    playTabSwitch() {
        if (this.muted) return;
        this._playTone(600, 'sine', 0.04, 0.08);
    }

    playToast() {
        if (this.muted) return;
        this._playTone(720, 'sine', 0.06, 0.1);
    }
}

// 挂载全局单例
window.soundEngine = new SoundEngine();
