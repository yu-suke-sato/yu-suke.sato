// 💡 キャラクター定義: charTypeと画像ファイル名ベースを紐付け
const CHARACTER_MAP = {
    giraffe: { name: "キリン型", fileBase: "char_giraffe_cat" },
    sumo: { name: "力士型", fileBase: "char_sumo_cat" },
    ghost: { name: "お化け型", fileBase: "char_ghost_cat" },
    fishbone: { name: "骨魚型", fileBase: "char_fishbone_cat" },
    mecha: { name: "メカ型", fileBase: "mecha_cat" },
};

// --- ゲーム状態管理 ---
const gameState = {
    level: 1,
    exp: 0,
    expNeeded: 100,
    currentQuestion: { num1: 0, num2: 0, answer: 0 },
    userAnswer: "",
    difficulty: "easy",
    charType: null, // キャラクターが未選択の状態
    bgmOn: false,
    // 進化レベル: 初期(1) -> 進化1(5) -> 進化2(15)
    evolutionLevels: [1, 5, 15] 
};

// --- DOM要素 ---
const dom = {
    level: document.getElementById('level'),
    exp: document.getElementById('exp'),
    expNeeded: document.getElementById('exp-needed'),
    num1: document.getElementById('num1'),
    num2: document.getElementById('num2'),
    answerDisplay: document.getElementById('answer-display'),
    resultMessage: document.getElementById('result-message'),
    characterImg: document.getElementById('character-img'),
    charName: document.getElementById('char-name'),
    inputPad: document.getElementById('input-pad'),
    difficultySelect: document.getElementById('difficulty-select'),
    bgm: document.getElementById('bgm'),
    bgmToggle: document.getElementById('bgm-toggle'),
    // モーダル関連のDOM要素
    charSelectModal: document.getElementById('character-select-modal'),
    charOptionsContainer: document.getElementById('character-options'),
};

// --- 関数定義 ---

/**
 * 現在のレベルに基づいて必要なEXPを計算
 */
function calculateExpNeeded(level) {
    return level * 100;
}

/**
 * 難易度に基づいて問題の数値を生成
 */
function generateQuestion() {
    let n1, n2;

    switch (gameState.difficulty) {
        case 'medium': 
            n1 = Math.floor(Math.random() * 90) + 10;
            n2 = Math.floor(Math.random() * 9) + 1;
            if (n1 % 10 + n2 > 9) { 
                n2 = Math.floor(Math.random() * (9 - n1 % 10)) + 1;
            }
            break;
        case 'hard': 
            n1 = Math.floor(Math.random() * 90) + 10;
            n2 = Math.floor(Math.random() * 90) + 10;
            break;
        case 'easy':
        default:
            n1 = Math.floor(Math.random() * 9) + 1;
            n2 = Math.floor(Math.random() * (10 - n1)) + 1;
            break;
    }

    return { num1: n1, num2: n2, answer: n1 + n2 };
}

/**
 * 新しい問題を画面に表示
 */
function setQuestion() {
    if (!gameState.charType) return; 

    gameState.currentQuestion = generateQuestion();
    dom.num1.textContent = gameState.currentQuestion.num1;
    dom.num2.textContent = gameState.currentQuestion.num2;
    gameState.userAnswer = "";
    dom.answerDisplay.textContent = "?";
    dom.resultMessage.textContent = "";
}

/**
 * 経験値の付与とレベルアップ処理
 */
function gainExp(expGain) {
    gameState.exp += expGain;
    dom.resultMessage.textContent = `正解！+${expGain}EXP獲得！`;

    if (gameState.exp >= gameState.expNeeded) {
        levelUp();
    }
    updateDisplay(); 
}

/**
 * レベルアップ処理
 */
function levelUp() {
    gameState.level++;
    gameState.exp = gameState.exp - gameState.expNeeded;
    gameState.expNeeded = calculateExpNeeded(gameState.level);

    dom.resultMessage.textContent = `🎉 レベルアップ！Lv.${gameState.level}へ！`;

    checkEvolution(true);
}

/**
 * 進化チェックと画像更新
 */
function checkEvolution(checkAlert = false) {
    if (!gameState.charType) {
        dom.charName.textContent = "キャラクター未選択";
        dom.characterImg.src = "";
        return; 
    }

    const charData = CHARACTER_MAP[gameState.charType];
    let stage = 1;
    let stageName = "初期";

    let imageFileName = charData.fileBase; 
    
    // 進化段階の決定
    if (gameState.level >= gameState.evolutionLevels[2]) {
        stage = 3;
        stageName = "最終形態";
    } else if (gameState.level >= gameState.evolutionLevels[1]) {
        stage = 2;
        stageName = "進化形態";
    }

    // 画像パスの設定
    dom.characterImg.src = `images/${imageFileName}.png`; 
    dom.charName.textContent = `${charData.name} (${stageName})`;
    
    // 進化アラートの表示
    if (checkAlert && (gameState.level === gameState.evolutionLevels[1] || gameState.level === gameState.evolutionLevels[2])) {
        alert(`おめでとう！${dom.charName.textContent}に進化しました！`);
    }
}

/**
 * ゲーム状態をLocalStorageに保存
 */
function saveGame() {
    if (!gameState.charType) {
        alert('キャラクターを選択してからセーブしてください。');
        return;
    }
    try {
        const dataToSave = {...gameState};
        delete dataToSave.currentQuestion; 

        localStorage.setItem('nya-calc-data', JSON.stringify(dataToSave));
        alert('セーブしました！');
    } catch (e) {
        alert('セーブに失敗しました。');
    }
}

/**
 * LocalStorageからゲーム状態をロード
 */
function loadGame() {
    try {
        const savedData = localStorage.getItem('nya-calc-data');
        if (savedData) {
            const data = JSON.parse(savedData);
            Object.assign(gameState, data);
            
            updateDisplay();
            setQuestion();
            dom.charSelectModal.style.display = 'none';
            return true;
        } else {
            return false;
        }
    } catch (e) {
        alert('ロードに失敗しました。データが破損しています。');
        return false;
    }
}

/**
 * 全ての表示要素を最新のgameStateに合わせて更新
 */
function updateDisplay() {
    dom.level.textContent = gameState.level;
    dom.exp.textContent = gameState.exp;
    dom.expNeeded.textContent = gameState.expNeeded;
    dom.difficultySelect.value = gameState.difficulty;
    
    checkEvolution(); 
}


// --- イベントリスナー設定 ---

// 数字ボタン入力
dom.inputPad.addEventListener('click', (e) => {
    if (!gameState.charType) return;

    if (e.target.classList.contains('num-btn')) {
        const val = e.target.getAttribute('data-val