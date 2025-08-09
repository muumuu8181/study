// ============================================================
// 🔥 Firebase設定とGoogle認証
// ============================================================

// Firebaseが既に初期化されているか確認
if (!firebase.apps.length) {
    // Firebase設定（テンプレートと同じFirebaseプロジェクトを使用）
    const firebaseConfig = {
        "apiKey": "AIzaSyA5PXKChizYDCXF_GJ4KL6Ylq9K5hCPXWE",
        "authDomain": "shares-b1b97.firebaseapp.com",
        "databaseURL": "https://shares-b1b97-default-rtdb.firebaseio.com",
        "projectId": "shares-b1b97",
        "storageBucket": "shares-b1b97.firebasestorage.app",
        "messagingSenderId": "38311063248",
        "appId": "1:38311063248:web:0d2d5726d12b305b24b8d5"
    };
    
    // Firebase初期化
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase初期化 (firebase-config.js)');
} else {
    console.log('✅ Firebase既に初期化済み');
}

// Firebase サービスの参照
const auth = firebase.auth();
const database = firebase.database();

// 現在のユーザー情報
let currentUser = null;

// Google認証プロバイダー設定
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Google認証関数
async function signInWithGoogle() {
    try {
        console.log('🔐 Googleログイン開始...');
        console.log('📍 現在のURL:', window.location.href);
        console.log('📍 現在のドメイン:', window.location.hostname);
        
        const result = await auth.signInWithPopup(googleProvider);
        currentUser = result.user;
        console.log('🔥 Google認証成功:', currentUser.displayName || currentUser.email);
        updateAuthUI(true);
        // 既存のローカルデータをFirebaseに移行
        migrateLocalDataToFirebase();
    } catch (error) {
        console.error('❌ Google認証エラー:', error);
        console.error('エラーコード:', error.code);
        console.error('エラーメッセージ:', error.message);
        
        // エラーコード別の詳細メッセージ
        let errorMessage = 'ログインに失敗しました: ';
        switch(error.code) {
            case 'auth/unauthorized-domain':
                errorMessage += 'このドメインは認証が許可されていません。Firebase Consoleで設定が必要です。\n現在のドメイン: ' + window.location.hostname;
                console.error('🚨 認証ドメインエラー - Firebase Consoleで以下のドメインを追加してください:');
                console.error('   ' + window.location.hostname);
                break;
            case 'auth/popup-blocked':
                errorMessage += 'ポップアップがブロックされました。ブラウザ設定を確認してください。';
                break;
            case 'auth/popup-closed-by-user':
                errorMessage += 'ログインがキャンセルされました。';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
}

// ログアウト関数
function signOutUser() {
    auth.signOut()
        .then(() => {
            currentUser = null;
            console.log('✅ ログアウト成功');
            updateAuthUI(false);
        })
        .catch((error) => {
            console.error('ログアウトエラー:', error);
        });
}

// 認証状態の監視
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        console.log('🔐 認証済み:', user.displayName || user.email);
        updateAuthUI(true);
        // Firebaseからデータを読み込む
        loadDataFromFirebase();
    } else {
        currentUser = null;
        console.log('🔓 未認証');
        updateAuthUI(false);
    }
});

// UI更新関数
function updateAuthUI(isLoggedIn) {
    const loginBtn = document.getElementById('googleLoginBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    
    console.log('🔄 UI更新:', {
        isLoggedIn,
        currentUser: currentUser?.displayName || currentUser?.email,
        loginBtn: !!loginBtn,
        userInfo: !!userInfo,
        userName: !!userName
    });
    
    if (!loginBtn || !userInfo || !userName) {
        console.error('❌ UI要素が見つかりません');
        return;
    }
    
    if (isLoggedIn && currentUser) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'inline-block';
        userName.textContent = currentUser.displayName || currentUser.email || 'ユーザー';
        console.log('✅ ログインUI表示: ' + userName.textContent);
    } else {
        loginBtn.style.display = 'inline-block';
        userInfo.style.display = 'none';
        console.log('✅ 未ログインUI表示');
    }
}

// クイズデータをFirebaseに保存
function saveQuizDataToFirebase(quizData) {
    if (!currentUser) {
        console.log('未認証のため、ローカルストレージに保存');
        return;
    }
    
    const userId = currentUser.uid;
    const timestamp = Date.now();
    
    // modeがundefinedの場合はデフォルト値を設定
    const dataToSave = {
        ...quizData,
        mode: quizData.mode || 'normal',  // undefinedの場合は'normal'を使用
        timestamp: timestamp,
        userEmail: currentUser.email,
        userName: currentUser.displayName
    };
    
    // クイズ結果を保存
    database.ref(`users/${userId}/quiz_results/${timestamp}`).set(dataToSave)
        .then(() => {
            console.log('✅ Firebaseにクイズデータ保存成功');
        })
        .catch((error) => {
            console.error('Firebase保存エラー:', error);
        });
    
    // 習熟度データも保存
    if (quizData.masteryData) {
        database.ref(`users/${userId}/mastery_data`).update(quizData.masteryData)
            .then(() => {
                console.log('✅ 習熟度データ更新成功');
            })
            .catch((error) => {
                console.error('習熟度データ更新エラー:', error);
            });
    }
}

// Firebaseからデータを読み込む
function loadDataFromFirebase() {
    if (!currentUser) {
        console.log('未認証のため、ローカルストレージから読み込み');
        return;
    }
    
    const userId = currentUser.uid;
    
    // クイズ履歴を読み込む
    database.ref(`users/${userId}/quiz_results`)
        .orderByChild('timestamp')
        .limitToLast(10)
        .once('value')
        .then((snapshot) => {
            const results = [];
            snapshot.forEach((childSnapshot) => {
                results.push(childSnapshot.val());
            });
            
            if (results.length > 0) {
                console.log('📊 Firebase からクイズ履歴読み込み:', results.length, '件');
                // 既存のUIに反映
                updateQuizHistoryFromFirebase(results);
            }
        })
        .catch((error) => {
            console.error('Firebase読み込みエラー:', error);
        });
    
    // 習熟度データを読み込む
    database.ref(`users/${userId}/mastery_data`)
        .once('value')
        .then((snapshot) => {
            const masteryData = snapshot.val();
            if (masteryData) {
                console.log('🎯 Firebase から習熟度データ読み込み');
                // 既存のUIに反映
                updateMasteryDataFromFirebase(masteryData);
            }
        })
        .catch((error) => {
            console.error('習熟度データ読み込みエラー:', error);
        });
}

// ローカルデータをFirebaseに移行
function migrateLocalDataToFirebase() {
    if (!currentUser) return;
    
    // SafeStorageが利用可能か確認
    if (typeof SafeStorage === 'undefined') {
        console.warn('SafeStorageが未定義のため、移行をスキップ');
        return;
    }
    
    // 既存のローカルストレージデータを取得
    const localHistory = SafeStorage.getItem('quizHistory', []);
    const localMastery = SafeStorage.getItem('masteryData', {});
    
    if (localHistory.length > 0) {
        console.log('📦 ローカルデータをFirebaseに移行中...');
        
        const userId = currentUser.uid;
        const updates = {};
        
        // 履歴データを移行
        localHistory.forEach((item, index) => {
            const timestamp = item.timestamp || Date.now() - (localHistory.length - index) * 1000;
            updates[`users/${userId}/quiz_results/${timestamp}`] = {
                ...item,
                timestamp: timestamp,
                migratedFrom: 'localStorage'
            };
        });
        
        // 習熟度データを移行
        if (Object.keys(localMastery).length > 0) {
            updates[`users/${userId}/mastery_data`] = localMastery;
        }
        
        // 一括更新
        database.ref().update(updates)
            .then(() => {
                console.log('✅ ローカルデータの移行完了');
                // 移行後、ローカルデータをクリア（オプション）
                // SafeStorage.remove('quizHistory');
                // SafeStorage.remove('masteryData');
            })
            .catch((error) => {
                console.error('データ移行エラー:', error);
            });
    }
}

// クイズ履歴UIを更新（Firebaseデータから）
function updateQuizHistoryFromFirebase(results) {
    // 既存のdisplayHistory関数を呼び出すか、直接UIを更新
    if (typeof displayHistory === 'function') {
        // resultsを既存の形式に変換して表示
        const formattedResults = results.map(r => ({
            date: new Date(r.timestamp).toLocaleString('ja-JP'),
            correct: r.correct || 0,
            total: r.total || 0,
            accuracy: r.accuracy || 0,
            mode: r.mode || 'normal'
        }));
        displayHistory(formattedResults);
    }
}

// 習熟度データUIを更新（Firebaseデータから）
function updateMasteryDataFromFirebase(masteryData) {
    // 既存の習熟度管理システムに反映
    if (typeof SafeStorage !== 'undefined') {
        SafeStorage.setItem('masteryData', masteryData);
    }
}

// イベントリスナーの設定（DOMContentLoaded後に実行）
document.addEventListener('DOMContentLoaded', () => {
    // Googleログインボタン
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        console.log('✅ Googleログインボタン発見');
        googleLoginBtn.addEventListener('click', () => {
            console.log('🔐 ログインボタンクリック！');
            signInWithGoogle();
        });
    } else {
        console.error('❌ Googleログインボタンが見つかりません');
    }
    
    // ログアウトボタン
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOutUser);
    }
    
    // 初期認証状態を確認
    updateAuthUI(!!currentUser);
    
    // デバッグ情報を表示
    console.log('🔍 Firebase認証ドメイン設定確認:');
    console.log('   設定されたauthDomain:', 'shares-b1b97.firebaseapp.com');
    console.log('   現在のドメイン:', window.location.hostname);
    console.log('   現在のプロトコル:', window.location.protocol);
    
    // GitHub Pagesの場合の警告
    if (window.location.hostname.includes('github.io')) {
        console.log('⚠️ GitHub Pagesで実行中です。');
        console.log('   Firebase Consoleで以下を確認してください:');
        console.log('   1. Authentication > Settings > Authorized domains');
        console.log('   2. "' + window.location.hostname + '" が追加されているか確認');
    }
});

// グローバルに公開（既存のスクリプトから使用可能にする）
window.firebaseAuth = {
    getCurrentUser: () => currentUser,
    isAuthenticated: () => !!currentUser,
    saveQuizData: saveQuizDataToFirebase,
    signIn: signInWithGoogle,
    signOut: signOutUser
};

console.log('🔥 Firebase設定完了 - Google認証準備完了');
console.log('📍 実行環境:', window.location.hostname || 'ローカル');