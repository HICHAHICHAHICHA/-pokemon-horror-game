/**
 * ポケモンゲーム メインエンジン（最終修正版）
 */
class PokemonGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'menu'; // menu, field, battle, inventory
        this.player = {
            name: 'サトシ',
            pokemon: [],
            position: { x: 400, y: 300 },
            money: 3000
        };
        this.currentBattle = null;
        this.wildPokemon = null;
        this.keys = {};
        this.animationTime = 0;
        
        // 画像管理システム
        this.imageManager = new ImageManager();
        this.imagesLoaded = false;
        
        // UI要素
        this.messageBox = {
            visible: false,
            text: '',
            queue: []
        };
        
        this.init();
    }
    
    async init() {
        console.log('🎮 ポケモンゲーム初期化中...');
        
        // キャンバス設定
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // イベントリスナー設定
        this.setupEventListeners();
        
        // 画像を読み込み
        await this.loadImages();
        
        // 初期ポケモンを設定
        this.setupInitialPokemon();
        
        // ゲーム開始
        this.gameLoop();
        
        console.log('✅ ゲーム初期化完了');
    }
    
    async loadImages() {
        console.log('🎨 画像システム初期化中...');
        try {
            await this.imageManager.preloadBasicImages();
            this.imagesLoaded = true;
            console.log('✅ 画像システム準備完了');
        } catch (error) {
            console.warn('⚠️ 画像読み込み中にエラーが発生しましたが、継続します:', error);
            this.imagesLoaded = true; // フォールバック画像で続行
        }
    }
    
    setupInitialPokemon() {
        // スターターポケモンを追加
        const starter = new Pokemon('ピカチュウ', 5);
        starter.id = 25; // ピカチュウのID
        starter.moves = [
            { name: 'でんきショック', power: 40, type: 'electric' },
            { name: 'たいあたり', power: 35, type: 'normal' }
        ];
        this.player.pokemon.push(starter);
    }
    
    setupEventListeners() {
        // キーボードイベント
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyPress(e.code);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // マウスイベント
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        });
    }
    
    handleKeyPress(keyCode) {
        switch (this.gameState) {
            case 'menu':
                if (keyCode === 'Enter') {
                    this.gameState = 'field';
                    this.showMessage('フィールドに出発！');
                }
                break;
                
            case 'field':
                if (keyCode === 'Space') {
                    this.encounterWildPokemon();
                }
                if (keyCode === 'KeyI') {
                    this.gameState = 'inventory';
                }
                break;
                
            case 'battle':
                if (keyCode === 'Digit1') {
                    this.selectBattleAction('attack');
                }
                if (keyCode === 'Digit2') {
                    this.selectBattleAction('run');
                }
                break;
                
            case 'inventory':
                if (keyCode === 'Escape') {
                    this.gameState = 'field';
                }
                break;
        }
    }
    
    handleClick(x, y) {
        if (this.gameState === 'battle' && this.currentBattle) {
            // バトル中のクリック処理
            if (y > 400) { // 下部のUIエリア
                if (x < 400) {
                    this.selectBattleAction('attack');
                } else {
                    this.selectBattleAction('run');
                }
            }
        }
    }
    
    gameLoop() {
        this.animationTime += 16; // 約60FPS
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // フィールドでの移動
        if (this.gameState === 'field') {
            this.updatePlayerMovement();
        }
        
        // バトル更新
        if (this.gameState === 'battle' && this.currentBattle) {
            this.updateBattle();
        }
    }
    
    updatePlayerMovement() {
        const speed = 2;
        let moved = false;
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.position.y = Math.max(50, this.player.position.y - speed);
            moved = true;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.position.y = Math.min(550, this.player.position.y + speed);
            moved = true;
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.position.x = Math.max(50, this.player.position.x - speed);
            moved = true;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.position.x = Math.min(750, this.player.position.x + speed);
            moved = true;
        }
        
        // 移動中にランダムエンカウント
        if (moved && Math.random() < 0.001) {
            this.encounterWildPokemon();
        }
    }
    
    render() {
        // 画面クリア
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.imagesLoaded) {
            // 読み込み中表示
            this.ctx.fillStyle = '#000';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('画像読み込み中...', 400, 300);
            return;
        }
        
        switch (this.gameState) {
            case 'menu':
                this.renderMenu();
                break;
            case 'field':
                this.renderField();
                break;
            case 'battle':
                this.renderBattle();
                break;
            case 'inventory':
                this.renderInventory();
                break;
        }
        
        // メッセージボックス
        if (this.messageBox.visible) {
            this.renderMessageBox();
        }
    }
    
    renderMenu() {
        try {
            // タイトル背景（より暗く）
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // タイトル
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ホラーポケモンアドベンチャー', 400, 150);
            
            // サブタイトル
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Phase2 - 恐怖のピカチュウ', 400, 180);
            
            // ホラーピカチュウアニメーション表示（安全版）
            if (this.imagesLoaded && this.imageManager) {
                try {
                    this.imageManager.drawAnimatedHorrorPokemon(this.ctx, 25, 350, 250, this.animationTime, 128);
                } catch (e) {
                    console.warn('ピカチュウ描画エラー:', e);
                    // 完全フォールバック
                    const frame = Math.floor(this.animationTime / 1000) % 2;
                    this.ctx.fillStyle = frame === 0 ? '#8B0000' : '#FF0000';
                    this.ctx.fillRect(350, 250, 128, 128);
                    this.ctx.fillStyle = '#FFF';
                    this.ctx.font = '32px Arial';
                    this.ctx.fillText(frame === 0 ? '🔪' : '👻', 414, 324);
                }
            }
            
            // 開始指示
            this.ctx.fillStyle = '#FF0000'; // 赤文字で怖さ演出
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Enterキーでスタート', 400, 450);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('移動: WASD/矢印キー | 野生ポケモン: スペースキー', 400, 500);
            
            // 警告文
            this.ctx.fillStyle = '#FF4444';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('⚠️ 恐怖要素を含みます ⚠️', 400, 530);
            
        } catch (error) {
            console.error('Menu render error:', error);
            // 最小限の表示
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ゲーム読み込み中...', 400, 300);
        }
    }
    
    renderField() {
        // フィールド背景（より暗く）
        this.ctx.fillStyle = '#2F4F2F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 草むらエフェクト（暗い緑）
        this.ctx.fillStyle = '#1C3B1C';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (Math.floor(i / 20) * 40) % this.canvas.height;
            this.ctx.fillRect(x, y, 20, 20);
        }
        
        // プレイヤーキャラクター
        if (this.imagesLoaded) {
            try {
                this.imageManager.drawTrainer(this.ctx, 'player', 
                    this.player.position.x - 32, this.player.position.y - 32, 64, 64);
            } catch (e) {
                // フォールバック描画
                this.ctx.fillStyle = '#FF6B6B';
                this.ctx.fillRect(this.player.position.x - 16, this.player.position.y - 16, 32, 32);
            }
        } else {
            // フォールバック描画
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.fillRect(this.player.position.x - 16, this.player.position.y - 16, 32, 32);
        }
        
        // UI情報
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`トレーナー: ${this.player.name}`, 10, 30);
        this.ctx.fillText(`所持金: ¥${this.player.money}`, 10, 50);
        this.ctx.fillText(`ポケモン: ${this.player.pokemon.length}匹`, 10, 70);
        
        this.ctx.textAlign = 'right';
        this.ctx.fillText('スペース: 野生ポケモン | I: ポケモン一覧', this.canvas.width - 10, 30);
        
        // 不気味な雰囲気演出
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('何かが潜んでいる...', 400, 580);
    }
    
    renderBattle() {
        if (!this.currentBattle || !this.wildPokemon) return;
        
        try {
            // バトル背景（より暗く）
            this.ctx.fillStyle = '#0d0d0d';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 不気味な赤い光効果
            const gradient = this.ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
            gradient.addColorStop(0, 'rgba(139, 0, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 野生ポケモン
            if (this.imagesLoaded) {
                if (this.wildPokemon.id === 25) {
                    // ホラーピカチュウの場合、特別アニメーション
                    try {
                        this.imageManager.drawAnimatedHorrorPokemon(this.ctx, this.wildPokemon.id, 
                            550, 100, this.animationTime, 128);
                    } catch (e) {
                        console.warn('野生ホラーピカチュウ描画エラー:', e);
                        // フォールバック
                        const frame = Math.floor(this.animationTime / 1000) % 2;
                        this.ctx.fillStyle = frame === 0 ? '#8B0000' : '#FF0000';
                        this.ctx.fillRect(550, 100, 128, 128);
                        this.ctx.fillStyle = '#FFF';
                        this.ctx.font = '24px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(frame === 0 ? '🔪' : '👻', 614, 174);
                    }
                } else {
                    this.imageManager.drawAnimatedPokemon(this.ctx, this.wildPokemon.id || 1, 
                        550, 100, this.animationTime, 128);
                }
            } else {
                this.ctx.fillStyle = '#FF4444';
                this.ctx.fillRect(550, 100, 64, 64);
            }
            
            // 自分のポケモン（後ろ姿）
            const myPokemon = this.player.pokemon[0];
            if (myPokemon && this.imagesLoaded) {
                if (myPokemon.id === 25) {
                    // 自分のピカチュウもホラー仕様
                    try {
                        this.imageManager.drawAnimatedHorrorPokemon(this.ctx, myPokemon.id, 
                            150, 250, this.animationTime, 128);
                    } catch (e) {
                        console.warn('自分のホラーピカチュウ描画エラー:', e);
                        // フォールバック
                        const frame = Math.floor(this.animationTime / 1000) % 2;
                        this.ctx.fillStyle = frame === 0 ? '#8B0000' : '#FF0000';
                        this.ctx.fillRect(150, 250, 128, 128);
                        this.ctx.fillStyle = '#FFF';
                        this.ctx.font = '24px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(frame === 0 ? '🔪' : '👻', 214, 324);
                    }
                } else {
                    this.imageManager.drawAnimatedPokemon(this.ctx, myPokemon.id || 25, 
                        150, 250, this.animationTime, 128);
                }
            } else {
                this.ctx.fillStyle = '#4444FF';
                this.ctx.fillRect(150, 250, 64, 64);
            }
            
            // ポケモン情報
            this.ctx.fillStyle = '#FFF'; // 白文字で見やすく
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'left';
            
            // 野生ポケモン情報
            const pokemonName = this.wildPokemon.id === 25 ? '邪悪な' + this.wildPokemon.name : this.wildPokemon.name;
            this.ctx.fillText(`野生の${pokemonName} Lv.${this.wildPokemon.level}`, 450, 50);
            this.ctx.fillText(`HP: ${this.wildPokemon.hp}/${this.wildPokemon.maxHP}`, 450, 75);
            
            // HPバー（野生）
            this.drawHPBar(450, 80, 200, 20, this.wildPokemon.hp, this.wildPokemon.maxHP);
            
            // 自分のポケモン情報
            if (myPokemon) {
                const myPokemonName = myPokemon.id === 25 ? '堕落した' + myPokemon.name : myPokemon.name;
                this.ctx.fillText(`${myPokemonName} Lv.${myPokemon.level}`, 50, 400);
                this.ctx.fillText(`HP: ${myPokemon.hp}/${myPokemon.maxHP}`, 50, 425);
                this.drawHPBar(50, 430, 200, 20, myPokemon.hp, myPokemon.maxHP);
            }
            
            // バトルコマンド
            this.ctx.fillStyle = '#2C3E50';
            this.ctx.fillRect(0, 450, this.canvas.width, 150);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            
            // 攻撃ボタン（血の色）
            this.ctx.fillStyle = '#8B0000';
            this.ctx.fillRect(50, 470, 150, 50);
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillText('1. 攻撃', 125, 500);
            
            // 逃げるボタン
            this.ctx.fillStyle = '#95A5A6';
            this.ctx.fillRect(250, 470, 150, 50);
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillText('2. 逃げる', 325, 500);
            
            // 技選択
            if (myPokemon && myPokemon.moves) {
                this.ctx.textAlign = 'left';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('使える技:', 450, 480);
                myPokemon.moves.forEach((move, index) => {
                    const moveName = myPokemon.id === 25 ? 
                        (move.name === 'でんきショック' ? '血の雷' : '殺戮アタック') : 
                        move.name;
                    this.ctx.fillText(`${index + 1}. ${moveName}`, 450, 500 + index * 20);
                });
            }
            
        } catch (error) {
            console.error('Battle render error:', error);
            // 最小限のバトル画面
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('バトル中...', 400, 300);
        }
    }
    
    renderInventory() {
        // インベントリ背景
        this.ctx.fillStyle = '#34495E';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ポケモン一覧', 400, 50);
        
        // ポケモンリスト
        this.player.pokemon.forEach((pokemon, index) => {
            const y = 120 + index * 100;
            
            // ポケモン画像
            if (this.imagesLoaded) {
                if (pokemon.id === 25) {
                    try {
                        this.imageManager.drawAnimatedHorrorPokemon(this.ctx, pokemon.id, 100, y - 40, this.animationTime, 80);
                    } catch (e) {
                        // フォールバック
                        this.ctx.fillStyle = '#8B0000';
                        this.ctx.fillRect(100, y - 40, 80, 80);
                        this.ctx.fillStyle = '#FFF';
                        this.ctx.font = '16px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('👻', 140, y);
                    }
                } else {
                    this.imageManager.drawPokemon(this.ctx, pokemon.id || 25, 100, y - 40, 80);
                }
            }
            
            // ポケモン情報
            this.ctx.textAlign = 'left';
            this.ctx.font = '18px Arial';
            const displayName = pokemon.id === 25 ? '悪魔' + pokemon.name : pokemon.name;
            this.ctx.fillText(`${displayName} Lv.${pokemon.level}`, 200, y);
            this.ctx.fillText(`HP: ${pokemon.hp}/${pokemon.maxHP}`, 200, y + 25);
            this.ctx.fillText(`攻撃: ${pokemon.attack} 防御: ${pokemon.defense}`, 200, y + 50);
            
            // HPバー
            this.drawHPBar(400, y - 10, 150, 15, pokemon.hp, pokemon.maxHP);
        });
        
        this.ctx.textAlign = 'center';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Escキーで戻る', 400, 550);
    }
    
    drawHPBar(x, y, width, height, currentHP, maxHP) {
        // 背景
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, width, height);
        
        // HPバー
        const hpRatio = currentHP / maxHP;
        let color = '#2ECC71'; // 緑
        if (hpRatio < 0.5) color = '#F39C12'; // 黄色
        if (hpRatio < 0.25) color = '#E74C3C'; // 赤
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width * hpRatio, height);
        
        // 枠線
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    renderMessageBox() {
        // メッセージボックス背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(50, 450, this.canvas.width - 100, 100);
        
        // 枠線
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(50, 450, this.canvas.width - 100, 100);
        
        // テキスト
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        
        const lines = this.messageBox.text.split('\n');
        lines.forEach((line, index) => {
            this.ctx.fillText(line, 70, 480 + index * 25);
        });
    }
    
    // バトルシステム
    encounterWildPokemon() {
        const wildPokemons = [
            { name: 'フシギダネ', level: 5, id: 1 },
            { name: 'ヒトカゲ', level: 5, id: 4 },
            { name: 'ゼニガメ', level: 5, id: 7 },
            { name: 'ピカチュウ', level: 5, id: 25 }
        ];
        
        const randomPokemon = wildPokemons[Math.floor(Math.random() * wildPokemons.length)];
        this.wildPokemon = new Pokemon(randomPokemon.name, randomPokemon.level);
        this.wildPokemon.id = randomPokemon.id;
        
        this.currentBattle = {
            turn: 'player',
            phase: 'select'
        };
        
        this.gameState = 'battle';
        const encounterMessage = randomPokemon.id === 25 ? 
            `邪悪な${this.wildPokemon.name}が現れた！\n血に飢えている...` : 
            `野生の${this.wildPokemon.name}が現れた！`;
        this.showMessage(encounterMessage);
    }
    
    selectBattleAction(action) {
        if (!this.currentBattle || this.currentBattle.turn !== 'player') return;
        
        const myPokemon = this.player.pokemon[0];
        if (!myPokemon || myPokemon.hp <= 0) return;
        
        switch (action) {
            case 'attack':
                this.executeBattleAttack(myPokemon, this.wildPokemon);
                break;
            case 'run':
                const runMessage = this.wildPokemon.id === 25 ? 
                    '恐怖に震えながら逃げ出した！' : 
                    'うまく逃げ切れた！';
                this.showMessage(runMessage);
                setTimeout(() => {
                    this.endBattle();
                }, 2000);
                break;
        }
    }
    
    executeBattleAttack(attacker, defender) {
        const damage = Math.max(1, attacker.attack - defender.defense + Math.floor(Math.random() * 10));
        defender.takeDamage(damage);
        
        const attackMessage = attacker.id === 25 ? 
            `${attacker.name}の血の雷！\n${defender.name}に${damage}の恐怖ダメージ！` :
            `${attacker.name}の攻撃！\n${defender.name}に${damage}のダメージ！`;
        
        this.showMessage(attackMessage);
        
        if (defender.hp <= 0) {
            setTimeout(() => {
                if (defender === this.wildPokemon) {
                    const victoryMessage = defender.id === 25 ? 
                        `邪悪な${defender.name}を封印した！\n呪いの力を手に入れた...` :
                        `野生の${defender.name}を倒した！`;
                    this.showMessage(victoryMessage);
                    attacker.gainExp(50);
                    this.player.money += 100;
                } else {
                    this.showMessage(`${attacker.name}は戦闘不能になった！`);
                }
                setTimeout(() => this.endBattle(), 2000);
            }, 2000);
        } else {
            // 敵の反撃
            setTimeout(() => {
                this.currentBattle.turn = 'enemy';
                this.executeEnemyTurn();
            }, 2000);
        }
    }
    
    executeEnemyTurn() {
        const myPokemon = this.player.pokemon[0];
        if (!myPokemon || myPokemon.hp <= 0) return;
        
        const damage = Math.max(1, this.wildPokemon.attack - myPokemon.defense + Math.floor(Math.random() * 8));
        myPokemon.takeDamage(damage);
        
        const enemyAttackMessage = this.wildPokemon.id === 25 ? 
            `邪悪な${this.wildPokemon.name}の呪いの攻撃！\n${myPokemon.name}に${damage}の闇ダメージ！` :
            `野生の${this.wildPokemon.name}の攻撃！\n${myPokemon.name}に${damage}のダメージ！`;
        
        this.showMessage(enemyAttackMessage);
        
        if (myPokemon.hp <= 0) {
            setTimeout(() => {
                this.showMessage(`${myPokemon.name}は戦闘不能になった！`);
                setTimeout(() => this.endBattle(), 2000);
            }, 2000);
        } else {
            // プレイヤーのターンに戻る
            setTimeout(() => {
                this.currentBattle.turn = 'player';
                this.hideMessage();
            }, 2000);
        }
    }
    
    updateBattle() {
        // バトル中の更新処理
        if (this.currentBattle && this.currentBattle.turn === 'player') {
            // プレイヤーの入力待ち
        }
    }
    
    endBattle() {
        this.currentBattle = null;
        this.wildPokemon = null;
        this.gameState = 'field';
        this.hideMessage();
    }
    
    // メッセージシステム
    showMessage(text) {
        this.messageBox.text = text;
        this.messageBox.visible = true;
        
        // 自動的に非表示
        setTimeout(() => {
            this.hideMessage();
        }, 3000);
    }
    
    hideMessage() {
        this.messageBox.visible = false;
        this.messageBox.text = '';
    }
    
    // デバッグ用メソッド
    addDebugPokemon() {
        const debugPokemon = new Pokemon('デバッグモン', 10);
        debugPokemon.id = 1;
        this.player.pokemon.push(debugPokemon);
        console.log('🐛 デバッグポケモンを追加しました');
    }
    
    // ゲーム状態の保存/読み込み（将来の拡張用）
    saveGame() {
        const saveData = {
            player: this.player,
            gameState: this.gameState,
            timestamp: Date.now()
        };
        localStorage.setItem('pokemonGameSave', JSON.stringify(saveData));
        console.log('💾 ゲームを保存しました');
    }
    
    loadGame() {
        const saveData = localStorage.getItem('pokemonGameSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            this.player = data.player;
            console.log('📁 ゲームを読み込みました');
            return true;
        }
        return false;
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 ホラーポケモンゲーム開始準備...');
    window.game = new PokemonGame();
});