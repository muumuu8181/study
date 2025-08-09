/**
 * ==========================================
 * 🔒 コア機能モジュール
 * ==========================================
 * これらの機能は変更しないでください。
 * 安定版として確定済みです。
 */

// Firebase認証コア機能
const CoreAuth = {
    // 現在のユーザー取得
    getCurrentUser() {
        return window.firebaseAuth ? window.firebaseAuth.getCurrentUser() : null;
    },
    
    // 認証状態確認
    isAuthenticated() {
        return window.firebaseAuth ? window.firebaseAuth.isAuthenticated() : false;
    },
    
    // クイズデータ保存
    saveQuizData(data) {
        if (window.firebaseAuth) {
            window.firebaseAuth.saveQuizData(data);
        }
    }
};

// データ保存コア機能
const CoreStorage = {
    // 安全なデータ保存
    saveData(key, value) {
        if (typeof SafeStorage !== 'undefined') {
            return SafeStorage.setItem(key, value);
        }
        return false;
    },
    
    // 安全なデータ読み込み
    loadData(key, defaultValue = null) {
        if (typeof SafeStorage !== 'undefined') {
            return SafeStorage.getItem(key, defaultValue);
        }
        return defaultValue;
    },
    
    // データ削除
    removeData(key) {
        if (typeof SafeStorage !== 'undefined') {
            SafeStorage.removeItem(key);
        }
    }
};

// クイズ機能コア
const CoreQuiz = {
    // 問題のシャッフル
    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },
    
    // 正解率計算
    calculateAccuracy(correct, total) {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    },
    
    // 習熟度計算
    calculateMastery(correctCount, totalAttempts, lastAnswerDate) {
        if (totalAttempts === 0) return 0;
        
        const baseScore = (correctCount / totalAttempts) * 10;
        
        // 時間減衰
        if (lastAnswerDate) {
            const daysSince = (Date.now() - lastAnswerDate) / (1000 * 60 * 60 * 24);
            if (daysSince > 14) {
                const decay = Math.min(daysSince / 30, 0.5);
                return Math.max(0, baseScore * (1 - decay));
            }
        }
        
        return Math.min(10, baseScore);
    },
    
    // 問題データの検証
    validateQuestion(question) {
        return question &&
               question.question &&
               question.options &&
               Array.isArray(question.options) &&
               question.options.length === 4 &&
               typeof question.answer === 'number' &&
               question.answer >= 0 &&
               question.answer < 4;
    },
    
    // 履歴データの検証
    validateHistoryItem(item) {
        return item &&
               typeof item === 'object' &&
               typeof item.date === 'string' &&
               typeof item.correct === 'number' &&
               typeof item.total === 'number' &&
               item.correct >= 0 &&
               item.total > 0 &&
               item.correct <= item.total;
    }
};

// 統計機能コア
const CoreStats = {
    // カテゴリー別統計計算
    calculateCategoryStats(questions, answerHistory) {
        const stats = {};
        
        questions.forEach((q, index) => {
            const category = q.category || 'その他';
            if (!stats[category]) {
                stats[category] = {
                    total: 0,
                    correct: 0,
                    attempts: 0
                };
            }
            
            stats[category].total++;
            
            if (answerHistory[index]) {
                const history = answerHistory[index];
                stats[category].attempts += history.attempts || 0;
                stats[category].correct += history.correct || 0;
            }
        });
        
        // 正解率計算
        Object.keys(stats).forEach(category => {
            const cat = stats[category];
            cat.accuracy = cat.attempts > 0 ? 
                Math.round((cat.correct / cat.attempts) * 100) : 0;
        });
        
        return stats;
    },
    
    // 全体統計計算
    calculateOverallStats(history) {
        if (!Array.isArray(history) || history.length === 0) {
            return {
                totalQuestions: 0,
                totalCorrect: 0,
                averageAccuracy: 0,
                sessionsCount: 0
            };
        }
        
        let totalQuestions = 0;
        let totalCorrect = 0;
        
        history.forEach(session => {
            totalQuestions += session.total || 0;
            totalCorrect += session.correct || 0;
        });
        
        return {
            totalQuestions,
            totalCorrect,
            averageAccuracy: totalQuestions > 0 ? 
                Math.round((totalCorrect / totalQuestions) * 100) : 0,
            sessionsCount: history.length
        };
    }
};

// エクスポート
window.CoreFunctions = {
    Auth: CoreAuth,
    Storage: CoreStorage,
    Quiz: CoreQuiz,
    Stats: CoreStats,
    
    // バージョン情報
    version: '1.0.0',
    lastUpdate: '2025-08-09',
    
    // コア機能の初期化確認
    isInitialized() {
        return typeof SafeStorage !== 'undefined' &&
               typeof firebase !== 'undefined';
    }
};

console.log('✅ コア機能モジュール読み込み完了 v1.0.0');