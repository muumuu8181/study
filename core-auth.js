/**
 * ========================================
 * 🔒 コア認証機能 - 絶対に変更しないでください
 * ========================================
 * バージョン: 1.0.0
 * 最終更新: 2025-08-09
 * 
 * このファイルはログイン機能の安定版です。
 * 変更禁止 - UIの変更はcustom-ui.jsで行ってください。
 */

(function() {
    'use strict';
    
    // Firebase設定（固定）
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyA5PXKChizYDCXF_GJ4KL6Ylq9K5hCPXWE",
        authDomain: "shares-b1b97.firebaseapp.com",
        databaseURL: "https://shares-b1b97-default-rtdb.firebaseio.com",
        projectId: "shares-b1b97",
        storageBucket: "shares-b1b97.firebasestorage.app",
        messagingSenderId: "38311063248",
        appId: "1:38311063248:web:0d2d5726d12b305b24b8d5"
    };
    
    // Firebase初期化（重複チェック付き）
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
        console.log('🔐 [CoreAuth] Firebase初期化完了');
    }
    
    // コア認証機能
    window.CoreAuth = {
        // 現在のユーザー
        currentUser: null,
        
        // Googleログイン（変更禁止）
        async signInWithGoogle() {
            console.log('🔐 [CoreAuth] Googleログイン開始');
            
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.addScope('profile');
                provider.addScope('email');
                
                // ポップアップブロック対策
                let result;
                try {
                    result = await firebase.auth().signInWithPopup(provider);
                } catch (popupError) {
                    if (popupError.code === 'auth/popup-blocked') {
                        console.log('ポップアップがブロックされました。リダイレクト方式を試します。');
                        // リダイレクト方式にフォールバック
                        return firebase.auth().signInWithRedirect(provider);
                    }
                    throw popupError;
                }
                
                this.currentUser = result.user;
                console.log('✅ [CoreAuth] ログイン成功:', result.user.displayName);
                
                // UI更新
                this.updateAuthUI(true);
                
                // ローカルデータをFirebaseに移行
                this.migrateLocalDataToFirebase();
                
                return result.user;
                
            } catch (error) {
                console.error('❌ [CoreAuth] ログインエラー:', error);
                
                let errorMessage = 'ログインエラー: ';
                switch(error.code) {
                    case 'auth/unauthorized-domain':
                        errorMessage += 'このドメインは認証が許可されていません。';
                        break;
                    case 'auth/popup-closed-by-user':
                        errorMessage += 'ログインがキャンセルされました。';
                        break;
                    default:
                        errorMessage += error.message;
                }
                
                alert(errorMessage);
                throw error;
            }
        },
        
        // データ保存機能（変更禁止）
        saveQuizDataToFirebase(quizData) {
            if (!this.currentUser) {
                console.log('[CoreAuth] 未認証のため、ローカルストレージに保存');
                return;
            }
            
            const userId = this.currentUser.uid;
            const timestamp = Date.now();
            
            const dataToSave = {
                ...quizData,
                mode: quizData.mode || 'normal',
                timestamp: timestamp,
                userEmail: this.currentUser.email,
                userName: this.currentUser.displayName
            };
            
            // クイズ結果を保存
            firebase.database().ref(`users/${userId}/quiz_results/${timestamp}`).set(dataToSave)
                .then(() => {
                    console.log('✅ [CoreAuth] Firebaseにクイズデータ保存成功');
                })
                .catch((error) => {
                    console.error('[CoreAuth] Firebase保存エラー:', error);
                });
        },
        
        // ローカルデータをFirebaseに移行
        migrateLocalDataToFirebase() {
            if (!this.currentUser || typeof SafeStorage === 'undefined') return;
            
            const localHistory = SafeStorage.getItem('quizHistory', []);
            if (localHistory.length === 0) return;
            
            console.log('[CoreAuth] ローカルデータをFirebaseに移行中...');
            const userId = this.currentUser.uid;
            const updates = {};
            
            localHistory.forEach((item, index) => {
                const timestamp = item.timestamp || Date.now() - (localHistory.length - index) * 1000;
                updates[`users/${userId}/quiz_results/${timestamp}`] = {
                    ...item,
                    timestamp: timestamp,
                    migratedFrom: 'localStorage'
                };
            });
            
            firebase.database().ref().update(updates)
                .then(() => {
                    console.log('✅ [CoreAuth] ローカルデータの移行完了');
                })
                .catch((error) => {
                    console.error('[CoreAuth] データ移行エラー:', error);
                });
        },
        
        // ログアウト（変更禁止）
        async signOut() {
            try {
                await firebase.auth().signOut();
                this.currentUser = null;
                console.log('✅ [CoreAuth] ログアウト成功');
                
                // UI更新
                this.updateAuthUI(false);
                
            } catch (error) {
                console.error('❌ [CoreAuth] ログアウトエラー:', error);
                throw error;
            }
        },
        
        // UI更新（変更禁止）
        updateAuthUI(isLoggedIn) {
            const googleLoginBtn = document.getElementById('googleLoginBtn');
            const userInfo = document.getElementById('userInfo');
            const userName = document.getElementById('userName');
            
            if (!googleLoginBtn || !userInfo || !userName) {
                console.warn('[CoreAuth] UI要素が見つかりません');
                return;
            }
            
            if (isLoggedIn && this.currentUser) {
                googleLoginBtn.style.display = 'none';
                userInfo.style.display = 'inline-block';
                userName.textContent = this.currentUser.displayName || this.currentUser.email || 'ユーザー';
            } else {
                googleLoginBtn.style.display = 'inline-block';
                userInfo.style.display = 'none';
            }
        },
        
        // 認証状態の取得
        isAuthenticated() {
            return !!this.currentUser;
        },
        
        // ユーザー情報の取得
        getUser() {
            return this.currentUser;
        },
        
        // 初期化（変更禁止）
        init() {
            console.log('🔐 [CoreAuth] 初期化開始');
            
            // 認証状態の監視
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('🔐 [CoreAuth] 認証済み:', user.displayName);
                    this.updateAuthUI(true);
                } else {
                    console.log('🔓 [CoreAuth] 未認証');
                    this.updateAuthUI(false);
                }
            });
            
            // DOMContentLoaded後にイベントリスナー設定
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
            } else {
                this.setupEventListeners();
            }
        },
        
        // イベントリスナー設定（変更禁止）
        setupEventListeners() {
            console.log('🔐 [CoreAuth] イベントリスナー設定');
            
            // Googleログインボタン
            const googleLoginBtn = document.getElementById('googleLoginBtn');
            if (googleLoginBtn) {
                // 既存のリスナーをクリア
                const newBtn = googleLoginBtn.cloneNode(true);
                googleLoginBtn.parentNode.replaceChild(newBtn, googleLoginBtn);
                
                newBtn.addEventListener('click', () => {
                    console.log('🔐 [CoreAuth] ログインボタンクリック');
                    this.signInWithGoogle();
                });
                console.log('✅ [CoreAuth] ログインボタンのイベントリスナー設定完了');
            }
            
            // ログアウトボタン
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                // 既存のリスナーをクリア
                const newBtn = logoutBtn.cloneNode(true);
                logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
                
                newBtn.addEventListener('click', () => {
                    console.log('🔐 [CoreAuth] ログアウトボタンクリック');
                    this.signOut();
                });
                console.log('✅ [CoreAuth] ログアウトボタンのイベントリスナー設定完了');
            }
        }
    };
    
    // 自動初期化
    window.CoreAuth.init();
    
    // グローバルに公開（既存のスクリプトから使用可能にする）
    window.firebaseAuth = {
        getCurrentUser: () => window.CoreAuth.currentUser,
        isAuthenticated: () => window.CoreAuth.isAuthenticated(),
        saveQuizData: (data) => window.CoreAuth.saveQuizDataToFirebase(data),
        signIn: () => window.CoreAuth.signInWithGoogle(),
        signOut: () => window.CoreAuth.signOut()
    };
    
    console.log('✅ [CoreAuth] コア認証モジュール v1.0.0 読み込み完了');
    console.log('⚠️ このファイルは変更禁止です。UIカスタマイズはcustom-ui.jsで行ってください。');
    
})();