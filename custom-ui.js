/**
 * ==========================================
 * 🎨 カスタムUI機能モジュール
 * ==========================================
 * これらの機能は自由に変更可能です。
 * UIやデザインのカスタマイズはここで行います。
 */

const CustomUI = {
    // モバイル判定
    isMobile() {
        return window.innerWidth <= 768;
    },
    
    // パネルスタイル設定（モバイル用）
    setupMobilePanels() {
        if (!this.isMobile()) return;
        
        // カスタムスタイルはここで調整可能
        const style = document.createElement('style');
        style.textContent = `
            /* カスタムモバイルスタイル */
            @media (max-width: 768px) {
                /* 追加のカスタマイズはここに */
            }
        `;
        document.head.appendChild(style);
    },
    
    // クイック開始ボタンの表示制御
    toggleQuickStartButton(show) {
        const quickBtn = document.getElementById('quick-start-btn');
        if (quickBtn) {
            quickBtn.style.display = show ? 'inline-block' : 'none';
        }
    },
    
    // パネルの表示/非表示
    togglePanel(panelClass, show) {
        const panel = document.querySelector(`.${panelClass}`);
        if (panel) {
            panel.style.display = show ? 'block' : 'none';
        }
    },
    
    // アニメーション効果
    addAnimation(element, animationClass) {
        if (element) {
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.remove(animationClass);
            }, 1000);
        }
    },
    
    // テーマカラー変更
    setThemeColor(primary, secondary) {
        document.documentElement.style.setProperty('--primary-color', primary);
        document.documentElement.style.setProperty('--secondary-color', secondary);
    },
    
    // フォントサイズ調整
    adjustFontSize(scale) {
        if (this.isMobile()) {
            document.documentElement.style.fontSize = `${16 * scale}px`;
        }
    },
    
    // カスタムメッセージ表示
    showCustomMessage(message, type = 'info') {
        const colors = {
            'info': '#4285f4',
            'success': '#28a745',
            'warning': '#ffc107',
            'error': '#dc3545'
        };
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: ${colors[type] || colors.info};
            color: white;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    },
    
    // レイアウトモード切り替え
    setLayoutMode(mode) {
        const container = document.querySelector('.container');
        if (container) {
            container.dataset.layout = mode; // 'compact', 'normal', 'expanded'
        }
    },
    
    // 統計表示のカスタマイズ
    formatStats(stats) {
        const { correct, total, accuracy } = stats;
        
        if (this.isMobile()) {
            // モバイル用の短縮表示
            return `✓${correct} Q${total} ${accuracy}%`;
        } else {
            // PC用の通常表示
            return `正解数: ${correct} / 問題数: ${total} / 正解率: ${accuracy}%`;
        }
    },
    
    // 初期化
    init() {
        this.setupMobilePanels();
        
        // カスタムイベントリスナー
        window.addEventListener('resize', () => {
            this.setupMobilePanels();
        });
        
        console.log('🎨 カスタムUI機能 初期化完了');
    }
};

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', () => {
    CustomUI.init();
});

// グローバルに公開
window.CustomUI = CustomUI;

console.log('✅ カスタムUI モジュール読み込み完了');