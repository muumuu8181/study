/**
 * 認証デバッグ用スクリプト
 * コンソールで実行してログイン機能をテスト
 */

console.log('===== 認証デバッグ開始 =====');

// 1. Firebaseが初期化されているか確認
if (typeof firebase !== 'undefined') {
    console.log('✅ Firebase SDK読み込み済み');
    console.log('Firebase Apps:', firebase.apps.length);
} else {
    console.error('❌ Firebase SDKが読み込まれていません');
}

// 2. 認証モジュールの確認
if (typeof firebase !== 'undefined' && firebase.auth) {
    console.log('✅ Firebase Auth利用可能');
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        console.log('現在のユーザー:', currentUser.displayName || currentUser.email);
    } else {
        console.log('未ログイン状態');
    }
} else {
    console.error('❌ Firebase Authが利用できません');
}

// 3. ボタンの存在確認
const loginBtn = document.getElementById('googleLoginBtn');
if (loginBtn) {
    console.log('✅ ログインボタン発見');
    console.log('ボタンのテキスト:', loginBtn.textContent);
    console.log('ボタンの表示状態:', loginBtn.style.display || 'block');
    
    // イベントリスナーの確認
    const listeners = getEventListeners ? getEventListeners(loginBtn) : null;
    if (listeners) {
        console.log('イベントリスナー:', listeners);
    }
} else {
    console.error('❌ ログインボタンが見つかりません');
}

// 4. signInWithGoogle関数の確認
if (typeof signInWithGoogle === 'function') {
    console.log('✅ signInWithGoogle関数が定義されています');
} else {
    console.error('❌ signInWithGoogle関数が見つかりません');
}

// 5. 手動でログイン関数を実行するテスト関数
window.testLogin = async function() {
    console.log('===== 手動ログインテスト =====');
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        console.log('プロバイダー作成完了');
        
        const result = await firebase.auth().signInWithPopup(provider);
        console.log('✅ ログイン成功！');
        console.log('ユーザー:', result.user.displayName);
        
    } catch (error) {
        console.error('❌ ログインエラー:', error.code, error.message);
    }
};

console.log('===== デバッグ準備完了 =====');
console.log('手動でログインをテストする場合: testLogin() を実行');