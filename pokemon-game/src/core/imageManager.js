/**
 * 画像管理システム（最終修正版 - ファイル名完全対応）
 */
class ImageManager {
    constructor() {
        this.images = new Map();
        this.loadedImages = new Map();
        this.isLoading = false;
        this.loadQueue = [];
        this.horrorPikachuLoaded = false; // 重複読み込み防止フラグ
        
        // 画像パス設定
        this.imagePaths = {
            pokemon: {
                1: 'assets/pokemon/001-bulbasaur.png',
                4: 'assets/pokemon/004-charmander.png',
                7: 'assets/pokemon/007-squirtle.png',
                25: 'assets/pokemon/025-pikachu.png'
            },
            trainer: {
                player: 'assets/trainer/player.png',
                wild: 'assets/trainer/wild-pokemon.png'
            }
        };
    }
    
    /**
     * 画像を非同期で読み込み（安全版）
     */
    async loadImage(key, path) {
        // 既に読み込み済みの場合は即座に返す
        if (this.loadedImages.has(key)) {
            return this.loadedImages.get(key);
        }
        
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                this.loadedImages.set(key, img);
                console.log(`✅ 画像読み込み完了: ${key}`);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`⚠️ 画像読み込み失敗: ${key} (${path}) - フォールバック作成`);
                
                // フォールバック画像生成
                const canvas = document.createElement('canvas');
                canvas.width = 96;
                canvas.height = 96;
                const ctx = canvas.getContext('2d');
                
                // ホラーピカチュウ用の色
                let colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
                if (key.includes('pikachu')) {
                    colors = ['#8B0000', '#FF0000', '#DC143C'];
                }
                
                const color = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 96, 96);
                
                ctx.fillStyle = '#FFF';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                const text = key.includes('pikachu') ? (key.includes('pikachu_1') ? '🔪' : '👻') : '🐾';
                ctx.fillText(text, 48, 48);
                
                const fallbackImg = new Image();
                fallbackImg.onload = () => {
                    this.loadedImages.set(key, fallbackImg);
                    resolve(fallbackImg);
                };
                fallbackImg.src = canvas.toDataURL();
            };
            
            img.src = path;
        });
    }
    
    /**
     * ホラーピカチュウ画像を安全に読み込み（修正版）
     */
    async loadHorrorPikachuImages() {
        if (this.horrorPikachuLoaded) {
            console.log('🔪 ホラーピカチュウ既に読み込み済み');
            return;
        }
        
        console.log('🔪 ホラーピカチュウ画像読み込み開始...');
        this.horrorPikachuLoaded = true;
        
        try {
            // 修正: 正しいファイル名とキー名
            await this.loadImage('pikachu_1', 'assets/pokemon/025-pikachu-1.png');
            await this.loadImage('pikachu_2', 'assets/pokemon/025-pikachu-2.png');
            console.log('👻 ホラーピカチュウ読み込み完了');
        } catch (error) {
            console.warn('⚠️ ホラーピカチュウ読み込みエラー:', error);
        }
    }
    
    /**
     * 基本画像を安全に読み込み
     */
    async preloadBasicImages() {
        console.log('🎨 基本画像読み込み開始...');
        
        try {
            // 基本ポケモン（ホラーピカチュウ以外）
            await this.loadImage('pokemon_1', this.imagePaths.pokemon[1]);
            await this.loadImage('pokemon_4', this.imagePaths.pokemon[4]);
            await this.loadImage('pokemon_7', this.imagePaths.pokemon[7]);
            
            // ホラーピカチュウを別途読み込み
            await this.loadHorrorPikachuImages();
            
            // トレーナー画像
            await this.loadImage('trainer_player', this.imagePaths.trainer.player);
            await this.loadImage('trainer_wild', this.imagePaths.trainer.wild);
            
            console.log('✅ 基本画像読み込み完了');
        } catch (error) {
            console.warn('⚠️ 画像読み込み中にエラー:', error);
        }
    }
    
    /**
     * 画像を描画
     */
    drawImage(ctx, imageKey, x, y, width = 96, height = 96) {
        const img = this.loadedImages.get(imageKey);
        if (img) {
            ctx.drawImage(img, x, y, width, height);
            return true;
        } else {
            console.warn(`画像未読み込み: ${imageKey}`);
            return false;
        }
    }
    
    /**
     * 通常のポケモン描画
     */
    drawPokemon(ctx, pokemonId, x, y, size = 96) {
        const imageKey = `pokemon_${pokemonId}`;
        if (!this.drawImage(ctx, imageKey, x, y, size, size)) {
            // フォールバック描画
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x, y, size, size);
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🐾', x + size/2, y + size/2);
        }
    }
    
    /**
     * アニメーション付きポケモン描画
     */
    drawAnimatedPokemon(ctx, pokemonId, x, y, time, size = 96) {
        const bobOffset = Math.sin(time * 0.003) * 3;
        this.drawPokemon(ctx, pokemonId, x, y + bobOffset, size);
    }
    
    /**
     * ホラーピカチュウアニメーション（最終修正版）
     */
    drawAnimatedHorrorPokemon(ctx, pokemonId, x, y, time, size = 96) {
        if (pokemonId === 25) {
            // アニメーション計算
            const frame = Math.floor(time / 1000) % 2;
            const bobOffset = Math.sin(time * 0.003) * 3;
            const shakeOffset = Math.sin(time * 0.01) * 2;
            
            // 修正: 正しいキー名を使用
            const imageKey = frame === 0 ? 'pikachu_1' : 'pikachu_2';
            
            // 画像描画を試行
            if (!this.drawImage(ctx, imageKey, x + shakeOffset, y + bobOffset, size, size)) {
                // フォールバック: アニメーション付きホラー演出
                const colors = frame === 0 ? '#8B0000' : '#FF0000';
                ctx.fillStyle = colors;
                ctx.fillRect(x + shakeOffset, y + bobOffset, size, size);
                
                ctx.fillStyle = '#FFF';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                const emoji = frame === 0 ? '🔪' : '👻';
                ctx.fillText(emoji, x + size/2 + shakeOffset, y + size/2 + bobOffset + 8);
            }
        } else {
            // 通常のポケモンアニメーション
            this.drawAnimatedPokemon(ctx, pokemonId, x, y, time, size);
        }
    }
    
    /**
     * トレーナー描画
     */
    drawTrainer(ctx, trainerType, x, y, width = 64, height = 64) {
        const imageKey = `trainer_${trainerType}`;
        if (!this.drawImage(ctx, imageKey, x, y, width, height)) {
            // フォールバック
            ctx.fillStyle = '#FF6B6B';
            ctx.fillRect(x, y, width, height);
            ctx.fillStyle = '#FFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('👤', x + width/2, y + height/2);
        }
    }
    
    /**
     * ポケモン画像を取得（互換性維持）
     */
    async getPokemonImage(pokemonId) {
        const key = `pokemon_${pokemonId}`;
        const path = this.imagePaths.pokemon[pokemonId];
        if (path) {
            return await this.loadImage(key, path);
        }
        return null;
    }
    
    /**
     * トレーナー画像を取得（互換性維持）
     */
    async getTrainerImage(trainerType) {
        const key = `trainer_${trainerType}`;
        const path = this.imagePaths.trainer[trainerType];
        if (path) {
            return await this.loadImage(key, path);
        }
        return null;
    }
    
    /**
     * UI画像を取得（互換性維持）
     */
    async getUIImage(uiType) {
        const key = `ui_${uiType}`;
        return null; // UI画像は未実装
    }
    
    /**
     * 画像情報を取得
     */
    getImageInfo(imageKey) {
        const img = this.loadedImages.get(imageKey);
        if (!img) return null;
        
        return {
            width: img.width,
            height: img.height,
            loaded: true
        };
    }
    
    /**
     * キャッシュクリア
     */
    clearCache() {
        this.loadedImages.clear();
        this.horrorPikachuLoaded = false;
        console.log('🗑️ 画像キャッシュクリア');
    }
    
    /**
     * デバッグ用: 読み込み状況確認
     */
    debugLoadedImages() {
        console.log('📊 読み込み済み画像一覧:');
        for (const [key, img] of this.loadedImages) {
            console.log(`  ${key}: ${img.width}x${img.height}`);
        }
    }
}

// グローバルインスタンス
window.ImageManager = ImageManager;