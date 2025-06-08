// ポケモンクラス - 全ポケモンの基本システム (修正版)
class Pokemon {
    constructor(species, level = 5) {
        this.species = species;
        this.level = level;
        this.name = this.species.charAt(0).toUpperCase() + this.species.slice(1);
        
        // 基本データを設定
        this.setupBaseData();
        
        // ステータス計算
        this.calculateStats();
        
        // 現在HP（最大HPと同じでスタート）
        this.currentHp = this.stats.hp;
        
        // 状態異常
        this.status = null; // poison, sleep, burn, etc
        
        // 経験値
        this.experience = this.getExpForLevel(level);
        
        // 技（最大4つ）
        this.moves = this.getStartingMoves();
        this.pp = {}; // 技のPP（使用回数）
        this.setupPP();
        
        // その他
        this.isShiny = Math.random() < 0.001; // 0.1%で色違い
        this.originalTrainer = 'プレイヤー';
        this.caughtAt = new Date();
        
        console.log(`🎯 ${this.name} Lv.${this.level} を作成しました`);
    }
    
    // ポケモンの基本データ設定
    setupBaseData() {
        const pokemonData = {
            // 御三家
            bulbasaur: {
                type: ['grass', 'poison'],
                baseStats: { hp: 45, attack: 49, defense: 49, spAttack: 65, spDefense: 65, speed: 45 },
                color: '#78C850',
                rarity: 'starter'
            },
            charmander: {
                type: ['fire'],
                baseStats: { hp: 39, attack: 52, defense: 43, spAttack: 60, spDefense: 50, speed: 65 },
                color: '#F08030',
                rarity: 'starter'
            },
            squirtle: {
                type: ['water'],
                baseStats: { hp: 44, attack: 48, defense: 65, spAttack: 50, spDefense: 64, speed: 43 },
                color: '#6890F0',
                rarity: 'starter'
            },
            
            // 野生ポケモン
            pidgey: {
                type: ['normal', 'flying'],
                baseStats: { hp: 40, attack: 45, defense: 40, spAttack: 35, spDefense: 35, speed: 56 },
                color: '#A8A878',
                rarity: 'common'
            },
            rattata: {
                type: ['normal'],
                baseStats: { hp: 30, attack: 56, defense: 35, spAttack: 25, spDefense: 35, speed: 72 },
                color: '#A8A878',
                rarity: 'common'
            },
            pikachu: {
                type: ['electric'],
                baseStats: { hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
                color: '#F8D030',
                rarity: 'rare'
            },
            magikarp: {
                type: ['water'],
                baseStats: { hp: 20, attack: 10, defense: 55, spAttack: 15, spDefense: 20, speed: 80 },
                color: '#F08030',
                rarity: 'common'
            },
            caterpie: {
                type: ['bug'],
                baseStats: { hp: 45, attack: 30, defense: 35, spAttack: 20, spDefense: 20, speed: 45 },
                color: '#A8B820',
                rarity: 'common'
            },
            weedle: {
                type: ['bug', 'poison'],
                baseStats: { hp: 40, attack: 35, defense: 30, spAttack: 20, spDefense: 20, speed: 50 },
                color: '#A8B820',
                rarity: 'common'
            }
        };
        
        const data = pokemonData[this.species] || pokemonData.pidgey;
        this.type = data.type;
        this.baseStats = data.baseStats;
        this.color = data.color;
        this.rarity = data.rarity;
    }
    
    // ステータス計算（レベルに応じて）
    calculateStats() {
        this.stats = {};
        
        // 各ステータスを計算
        Object.keys(this.baseStats).forEach(stat => {
            const base = this.baseStats[stat];
            const iv = Math.floor(Math.random() * 32); // 個体値 0-31
            
            if (stat === 'hp') {
                this.stats[stat] = Math.floor((base * 2 + iv) * this.level / 100) + this.level + 10;
            } else {
                this.stats[stat] = Math.floor((base * 2 + iv) * this.level / 100) + 5;
            }
        });
    }
    
    // レベルアップ
    gainExperience(amount) {
        this.experience += amount;
        
        const newLevel = this.getLevelFromExp(this.experience);
        if (newLevel > this.level) {
            const oldLevel = this.level;
            this.level = newLevel;
            
            // ステータス再計算
            const oldMaxHp = this.stats.hp;
            this.calculateStats();
            
            // HPを比例して回復
            const hpGain = this.stats.hp - oldMaxHp;
            this.currentHp += hpGain;
            
            console.log(`🎉 ${this.name} がレベル${oldLevel}→${this.level}になった！`);
            return true;
        }
        return false;
    }
    
    // 経験値からレベルを計算
    getLevelFromExp(exp) {
        return Math.min(100, Math.floor(Math.pow(exp / 1000, 1/3)) + 1);
    }
    
    // レベルから必要経験値を計算
    getExpForLevel(level) {
        return Math.pow(level - 1, 3) * 1000;
    }
    
    // 初期技設定
    getStartingMoves() {
        const moveData = {
            bulbasaur: ['たいあたり', 'なきごえ', 'つるのムチ'],
            charmander: ['ひっかく', 'なきごえ', 'ひのこ'],
            squirtle: ['たいあたり', 'しっぽをふる', 'みずでっぽう'],
            pidgey: ['たいあたり', 'かぜおこし'],
            rattata: ['たいあたり', 'しっぽをふる', 'でんこうせっか'],
            pikachu: ['でんきショック', 'なきごえ', 'でんこうせっか'],
            magikarp: ['はねる'],
            caterpie: ['たいあたり', 'いとをはく'],
            weedle: ['どくばり', 'いとをはく']
        };
        
        const moves = moveData[this.species] || ['たいあたり'];
        return moves.slice(0, 4); // 最大4つ
    }
    
    // PP設定
    setupPP() {
        const moveData = {
            'たいあたり': 35, 'なきごえ': 40, 'つるのムチ': 25, 'ひっかく': 35,
            'ひのこ': 25, 'みずでっぽう': 25, 'しっぽをふる': 30, 'かぜおこし': 35,
            'でんこうせっか': 30, 'でんきショック': 30, 'はねる': 40, 'いとをはく': 40,
            'どくばり': 35
        };
        
        this.moves.forEach(move => {
            this.pp[move] = moveData[move] || 20;
        });
    }
    
    // ダメージを受ける
    takeDamage(damage) {
        this.currentHp = Math.max(0, this.currentHp - damage);
        
        if (this.currentHp === 0) {
            console.log(`💀 ${this.name} は倒れた！`);
            return true; // 倒れた
        }
        return false; // まだ生きてる
    }
    
    // 回復
    heal(amount) {
        this.currentHp = Math.min(this.stats.hp, this.currentHp + amount);
        console.log(`💚 ${this.name} が${amount}回復した！`);
    }
    
    // 完全回復
    fullHeal() {
        this.currentHp = this.stats.hp;
        this.status = null;
        Object.keys(this.pp).forEach(move => {
            this.setupPP(); // PP回復
        });
        console.log(`✨ ${this.name} が完全回復した！`);
    }
    
    // 状態異常設定
    setStatus(status) {
        this.status = status;
        console.log(`😵 ${this.name} は${status}状態になった！`);
    }
    
    // 技を使う
    useMove(moveName, target = null) {
        if (!this.moves.includes(moveName)) {
            return { success: false, message: `${this.name}は${moveName}を覚えていない！` };
        }
        
        if (this.pp[moveName] <= 0) {
            return { success: false, message: `${moveName}のPPが足りない！` };
        }
        
        // PP消費
        this.pp[moveName]--;
        
        // 技のデータ
        const moveInfo = this.getMoveData(moveName);
        
        console.log(`⚔️ ${this.name} の ${moveName}！`);
        
        return {
            success: true,
            move: moveName,
            damage: this.calculateMoveDamage(moveInfo, target),
            effect: moveInfo.effect || null,
            message: `${this.name} は ${moveName} を使った！`
        };
    }
    
    // 技データ取得
    getMoveData(moveName) {
        const moves = {
            'たいあたり': { type: 'normal', power: 40, accuracy: 100, category: 'physical' },
            'ひっかく': { type: 'normal', power: 40, accuracy: 100, category: 'physical' },
            'つるのムチ': { type: 'grass', power: 45, accuracy: 100, category: 'physical' },
            'ひのこ': { type: 'fire', power: 40, accuracy: 100, category: 'special' },
            'みずでっぽう': { type: 'water', power: 40, accuracy: 100, category: 'special' },
            'でんきショック': { type: 'electric', power: 40, accuracy: 100, category: 'special' },
            'かぜおこし': { type: 'flying', power: 40, accuracy: 100, category: 'special' },
            'でんこうせっか': { type: 'normal', power: 40, accuracy: 100, category: 'physical', priority: 1 },
            'どくばり': { type: 'poison', power: 15, accuracy: 100, category: 'physical', effect: 'poison' },
            'なきごえ': { type: 'normal', power: 0, accuracy: 100, category: 'status', effect: 'attack_down' },
            'しっぽをふる': { type: 'normal', power: 0, accuracy: 100, category: 'status', effect: 'defense_down' },
            'いとをはく': { type: 'bug', power: 0, accuracy: 95, category: 'status', effect: 'speed_down' },
            'はねる': { type: 'normal', power: 0, accuracy: 100, category: 'status', effect: 'none' }
        };
        
        return moves[moveName] || { type: 'normal', power: 40, accuracy: 100, category: 'physical' };
    }
    
    // 技のダメージ計算
    calculateMoveDamage(moveInfo, target = null) {
        if (moveInfo.power === 0) return 0;
        
        const attack = moveInfo.category === 'physical' ? this.stats.attack : this.stats.spAttack;
        const level = this.level;
        const power = moveInfo.power;
        
        // 簡略化されたダメージ計算
        let damage = Math.floor((level * 2 / 5 + 2) * power * attack / 50) + 2;
        
        // ランダム要素（85-100%）
        damage = Math.floor(damage * (Math.random() * 0.15 + 0.85));
        
        // 最低1ダメージ
        return Math.max(1, damage);
    }
    
    // 捕獲判定
    canBeCaught(ballType = 'pokeball') {
        const ballRates = {
            'pokeball': 1,
            'greatball': 1.5,
            'ultraball': 2,
            'masterball': 999 // 必ず捕まる
        };
        
        const ballModifier = ballRates[ballType] || 1;
        const hpModifier = 1 - (this.currentHp / this.stats.hp); // HP減るほど捕まりやすい
        const levelModifier = Math.max(0.1, 1 - (this.level / 100)); // レベル低いほど捕まりやすい
        
        const catchRate = 0.3 * ballModifier * (1 + hpModifier) * levelModifier;
        
        const caught = Math.random() < catchRate;
        
        if (caught) {
            console.log(`🎉 ${this.name} を捕獲した！`);
        } else {
            console.log(`😤 ${this.name} は逃げ出した！`);
        }
        
        return caught;
    }
    
    // ポケモンの情報表示
    getInfo() {
        return {
            name: this.name,
            species: this.species,
            level: this.level,
            hp: `${this.currentHp}/${this.stats.hp}`,
            type: this.type,
            stats: this.stats,
            moves: this.moves,
            status: this.status,
            isShiny: this.isShiny
        };
    }
    
    // ポケモンが生きているかチェック
    isAlive() {
        return this.currentHp > 0;
    }
    
    // HPの割合を取得
    getHPPercentage() {
        return (this.currentHp / this.stats.hp) * 100;
    }
    
    // タイプ相性チェック（簡易版）
    getTypeEffectiveness(moveType, targetTypes) {
        const effectiveness = {
            fire: { grass: 2, water: 0.5, fire: 0.5 },
            water: { fire: 2, grass: 0.5, water: 0.5 },
            grass: { water: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5 },
            electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, ground: 0 },
            normal: { fighting: 0, ghost: 0 },
            fighting: { normal: 2, flying: 0.5, poison: 0.5, bug: 0.5, ghost: 0 },
            poison: { grass: 2, poison: 0.5, ground: 0.5, bug: 0.5, ghost: 0.5 },
            ground: { fire: 2, electric: 2, grass: 0.5, flying: 0, bug: 0.5 },
            flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2 },
            bug: { grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, fire: 0.5 }
        };
        
        let multiplier = 1;
        
        targetTypes.forEach(targetType => {
            if (effectiveness[moveType] && effectiveness[moveType][targetType] !== undefined) {
                multiplier *= effectiveness[moveType][targetType];
            }
        });
        
        return multiplier;
    }
}

// グローバルでアクセス可能にする
window.Pokemon = Pokemon;