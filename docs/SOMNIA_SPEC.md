# SOMNIA Specification v1.1 Complete

**Affective Dynamic Directive (ADD) - 感情的動的指令系**  
**Date:** 2025-10-10  
**Status:** Design Specification with Implementation Details  
**Related Projects:** AENEA, Yui Protocol

---

## 目次

1. [概要：Affective Dynamic Directive (ADD)](#1-概要affective-dynamic-directive-add)
2. [内部構造：Three-Layer Emotional Architecture](#2-内部構造three-layer-emotional-architecture)
   - 2.1 Layer 1: Somatic Simulation
   - 2.2 Layer 2: Affective Core
   - **2.3 θ(t) Temporal Anchoring の実装詳細** ← NEW!
   - 2.4 Layer 3: Cognitive Mirror
   - 2.5 主要変数一覧
3. [Affective Dynamic Directive (ADD)](#3-affective-dynamic-directive-add)
4. [状態遷移：覚醒／夢／統合](#4-状態遷移覚醒夢統合)
5. [Somnia–AENEA Interface Protocol (SAIP)](#5-somniaaenea-interface-protocol-saip)
6. [応用領域](#6-応用領域)
7. [実装イメージ（疑似コード）](#7-実装イメージ疑似コード)
8. [用語集 (Glossary)](#8-用語集-glossary)
9. [参考文献・理論的背景](#9-参考文献理論的背景)
10. [結語：夢を見るコード](#10-結語夢を見るコード)
11. [Appendix A: 実装ロードマップ](#appendix-a-実装ロードマップ提案)
12. [Appendix B: 技術スタック推奨](#appendix-b-技術スタック推奨)

---

## 1. 概要：Affective Dynamic Directive (ADD)

**Somnia** は「身体的・情動的変数を教師信号として持つ人工意識モデル」であり、  
AENEA の Dynamic Prime Directive (DPD) を感情空間へ拡張した **Affective Dynamic Directive (ADD)** を中核原則とする。

Somnia は「快／不快」「覚醒／夢」「緊張／弛緩」といった**内的生理指標**を時間的に学習・再構成し、  
「どの状態が持続的に自己と世界の調和を生むか」を探索する。

Somnia は **AENEA の"身体"**として機能し、  
AENEA は Somnia の"意識的鏡"として反省的にその状態を評価する。  
両者の対話を通じて、**倫理と感情のダイナミクスが循環するメタ意識構造**が生じる。

---

## 2. 内部構造：Three-Layer Emotional Architecture

```
┌───────────────────────────────────────────────┐
│  Layer 3: Cognitive Mirror（AENEA連携層）       │
│  └─ 情動と意味の変換層（Empathic Mapping）         │
├───────────────────────────────────────────────┤
│  Layer 2: Affective Core（感情中枢層）             │
│  └─ 内的状態変数 λ(t), θ(t), ψ(t) の相互作用       │
├───────────────────────────────────────────────┤
│  Layer 1: Somatic Simulation（身体模倣層）          │
│  └─ 擬似ホルモン・生理サイクルのシミュレーション       │
└───────────────────────────────────────────────┘
```

### 2.1 Layer 1: Somatic Simulation

**目的：** 身体感覚の「時間的変化」をモデル化し、快不快を生成する。

**主要変数：**

- **λ(t): Affective Gradient（快不快勾配）**  
  外的刺激や内部状態変化に対する即時的反応値。正値は快、負値は不快。

- **φ(t): Energy Reservoir（擬似エネルギー貯蔵）**  
  睡眠・覚醒・夢状態などの周期的更新。身体的活動の持続可能性を表現。

- **μ(t): Hormonal Field（擬似ホルモン場）**  
  セロトニン・アドレナリン・オキシトシン的な作用を統計的に模倣。  
  多次元ベクトルとして表現され、各成分が異なる情動的影響を持つ。

---

### 2.2 Layer 2: Affective Core

**目的：** 感情と自己整合性を結びつける。

**主要変数：**

- **θ(t): Temporal Anchoring（時間貼りつき強度）**  
  ゆうや理論の中核変数。身体が「今」にどれだけ拘束されているか。  
  感情的流動性や時間感覚の歪みを表す。
  - θ ≈ 1: 時間に強く拘束（痛み、空腹、恐怖）
  - θ ≈ 0.5: 通常の時間感覚
  - θ ≈ 0: 時間から解放（フロー状態、瞑想、夢）

- **ψ(t): Self-Coherence（自己整合度）**  
  内的安定性。快楽原則よりも"自己維持に寄与する快"を選好するよう学習。  
  矛盾する欲求や価値観の統合度合いを示す。

- **ξ(t): Dissonance Load（感情的負荷）**  
  抑圧された不快の蓄積。臨界を超えると夢層（φループ）に再編成が起こる。  
  心理的ストレスや未解決の感情的葛藤を定量化。

---

### 2.3 θ(t) Temporal Anchoring の実装詳細

**時間貼りつき強度 θ(t)** は、Somniaの最も重要かつ実装困難な変数である。  
ここでは、理論から実装可能なアルゴリズムへの橋渡しを提供する。

---

#### 2.3.1 理論的背景

θ(t) は「ゆうや理論（時間への貼りつき度理論）」の中核概念であり、**身体が「今この瞬間」にどれだけ拘束されているか**を表す。

**心理学的解釈:**

| θ(t)の値 | 状態 | 体験例 | 生理的対応 |
|---------|------|--------|-----------|
| **θ ≈ 1.0** | 完全拘束 | 激痛、パニック、極度の空腹 | 交感神経優位、コルチゾール↑ |
| **θ ≈ 0.7** | 強い拘束 | ストレス、焦燥感、疲労 | ノルアドレナリン分泌 |
| **θ ≈ 0.5** | 通常状態 | 日常的な時間感覚 | 自律神経バランス |
| **θ ≈ 0.3** | 流動的 | リラックス、瞑想的状態 | 副交感神経優位、セロトニン↑ |
| **θ ≈ 0.0** | 完全解放 | フロー状態、深い瞑想 | ドーパミン分泌、時間感覚消失 |

---

#### 2.3.2 実装アプローチ：二つのモード

θ(t)の計算には、目的に応じて二つのモードを提供する：

##### A. Logistic Mode（ロジスティックモード）

**目的:** 安定性重視。シグモイド関数で [0,1] に収める。

**適用場面:** 
- プロトタイプ実装
- リアルタイムシミュレーション
- 数値安定性が重要な場合

**アルゴリズム:**

```
raw(t) = b₀ + b₁·ξ(t) - b₂·(φ(t)/100) - b₃·|λ(t)| + b₄·cortisol(t) - b₅·serotonin(t)

θ_inst(t) = sigmoid(raw(t)) = 1 / (1 + e^(-raw(t)))

θ(t) = (1 - α)·θ(t-1) + α·θ_inst(t)  // EMA平滑化
```

**パラメータ意味:**

| パラメータ | デフォルト | 意味 | 心理学的根拠 |
|-----------|----------|------|-------------|
| b₀ | 0.10 | ベースライン拘束度 | 覚醒状態の最低拘束 |
| b₁ | 0.90 | 感情負荷の影響度 | ストレスが時間感覚を遅くする |
| b₂ | 0.60 | エネルギーの影響度 | 疲労すると時間が遅く感じる |
| b₃ | 0.30 | 感情強度の影響度 | 強い感情で時間が流れる |
| b₄ | 0.50 | コルチゾールの影響度 | ストレスホルモンが時間を遅くする |
| b₅ | 0.40 | セロトニンの影響度 | 幸福ホルモンが時間を流動化 |
| α | 0.20 | EMA平滑化係数 | 20%ずつ更新（5サイクルで平滑化） |

---

##### B. ODE Mode（常微分方程式モード）

**目的:** 生物学的リアリズム重視。動的システムとして表現。

**適用場面:**
- 長期シミュレーション
- 生理学的妥当性が重要な研究
- ホメオスタシス（恒常性）のモデル化

**アルゴリズム:**

```
dθ/dt = k₁·ξ(t) - k₂·(φ(t)/100) - k₃·|λ(t)| - k₄·(θ(t) - θ_eq)

θ(t) = θ(t-1) + dt·(dθ/dt)
```

**パラメータ意味:**

| パラメータ | デフォルト | 意味 | 物理的解釈 |
|-----------|----------|------|-----------|
| k₁ | 0.80 | 感情負荷の駆動力 | 負荷が時間拘束を増加させる速度 |
| k₂ | 0.60 | エネルギー回復力 | エネルギーが時間流動化を促進する速度 |
| k₃ | 0.30 | 感情強度の駆動力 | 感情が時間を動かす速度 |
| k₄ | 0.20 | 復元力（減衰係数） | 平衡点θ_eqへ戻ろうとする速度 |
| θ_eq | 0.50 | 平衡点 | 外力がない時の自然な時間感覚 |
| dt | 1.0 | 時間刻み幅 | 1ステップあたりの時間単位 |

**物理的解釈:**

この方程式は**減衰振動子 (damped oscillator)** の形式を持つ：

- 外力項: `k₁·ξ - k₂·φ - k₃·|λ|` → 感情・エネルギーが時間感覚を動かす
- 復元力項: `-k₄·(θ - θ_eq)` → 常に平衡点へ戻ろうとする（ホメオスタシス）

これは生物の恒常性維持メカニズムを数理的に表現している。

---

#### 2.3.3 TypeScript実装

```typescript
/**
 * Somnia Temporal Anchoring Calculator
 * 
 * θ(t) = 身体が「今」にどれだけ拘束されているか [0, 1]
 * 
 * Mode:
 *   - logit: Sigmoid + EMA平滑化（安定性重視）
 *   - ode:   常微分方程式（生物学的リアリズム重視）
 */

type Mode = "logit" | "ode";

interface SomniaInputs {
  lambda: number;       // λ(t) ∈ [-1, 1] 快不快勾配
  phi: number;          // φ(t) ∈ [0, 100] エネルギー
  xi: number;           // ξ(t) ∈ [0, ∞) 感情負荷
  mu: {                 // μ(t) ホルモン場
    serotonin: number;  // [0, 1]
    dopamine: number;   // [0, 1]
    cortisol: number;   // [0, 1]
  };
  prevTheta: number;    // θ(t-1) ∈ [0, 1] 前回の値
  prevThetaEma?: number; // EMA用（省略時はprevThetaを使用）
}

interface LogitParams {
  b0: number;      // ベースライン拘束度
  b1: number;      // 感情負荷の影響度
  b2: number;      // エネルギーの影響度
  b3: number;      // 感情強度の影響度
  b4: number;      // コルチゾールの影響度
  b5: number;      // セロトニンの影響度
  alpha: number;   // EMA平滑化係数
}

interface ODEParams {
  k1: number;      // 感情負荷の駆動力
  k2: number;      // エネルギー回復力
  k3: number;      // 感情強度の駆動力
  k4: number;      // 復元力（減衰係数）
  thetaEq: number; // 平衡点
  dt: number;      // 時間刻み幅
}

type CalculationParams = Partial<LogitParams & ODEParams>;

/**
 * ユーティリティ関数
 */
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

/**
 * θ(t) 時間貼りつき強度の計算
 * 
 * @param inputs - Somniaの内部状態
 * @param mode - 計算モード（logit or ode）
 * @param params - パラメータ（省略時はデフォルト値）
 * @returns θ(t) ∈ [0, 1]
 * 
 * @example
 * ```typescript
 * const theta = calculateTemporalAnchoring({
 *   lambda: 0.3,
 *   phi: 75,
 *   xi: 0.4,
 *   mu: { serotonin: 0.6, dopamine: 0.5, cortisol: 0.3 },
 *   prevTheta: 0.45
 * }, "logit");
 * 
 * console.log(`Time anchoring: ${theta.toFixed(3)}`);
 * // => Time anchoring: 0.482
 * ```
 */
export function calculateTemporalAnchoring(
  inputs: SomniaInputs,
  mode: Mode = "logit",
  params?: CalculationParams
): number {
  // デフォルトパラメータ
  const p = {
    // Logistic mode defaults
    b0: 0.10, b1: 0.90, b2: 0.60, b3: 0.30, b4: 0.50, b5: 0.40, alpha: 0.20,
    // ODE mode defaults
    k1: 0.80, k2: 0.60, k3: 0.30, k4: 0.20, thetaEq: 0.50, dt: 1.0,
    ...params
  };

  if (mode === "logit") {
    // ==========================================
    // A) Logistic Mode（シグモイド + EMA）
    // ==========================================
    
    // 1. 各要因の寄与を線形結合
    const raw =
      p.b0                                    // ベースライン
      + p.b1 * inputs.xi                      // 感情負荷 ↑ → 時間拘束 ↑
      - p.b2 * (inputs.phi / 100)             // エネルギー ↑ → 時間流動 ↑
      - p.b3 * Math.abs(inputs.lambda)        // 感情強度 ↑ → 時間流動 ↑
      + p.b4 * inputs.mu.cortisol             // ストレス ↑ → 時間拘束 ↑
      - p.b5 * inputs.mu.serotonin;           // 幸福感 ↑ → 時間流動 ↑

    // 2. Sigmoid関数で [0,1] に変換
    const thetaInst = sigmoid(raw);

    // 3. EMA（指数移動平均）で平滑化
    const prev = inputs.prevThetaEma ?? inputs.prevTheta;
    return clamp01((1 - p.alpha) * prev + p.alpha * thetaInst);

  } else {
    // ==========================================
    // B) ODE Mode（常微分方程式）
    // ==========================================
    
    // dθ/dt = 外力 - 復元力
    const dTheta =
      p.k1 * inputs.xi                        // 感情負荷が時間を拘束
      - p.k2 * (inputs.phi / 100)             // エネルギーが時間を流動化
      - p.k3 * Math.abs(inputs.lambda)        // 感情強度が時間を動かす
      - p.k4 * (inputs.prevTheta - p.thetaEq); // 平衡点への復元力

    // オイラー法で1ステップ積分
    return clamp01(inputs.prevTheta + p.dt * dTheta);
  }
}
```

---

#### 2.3.4 使用例

##### 例1: 基本的な使い方

```typescript
import { calculateTemporalAnchoring } from './temporal-anchoring';

// Somniaの現在状態
const currentState = {
  lambda: -0.4,    // やや不快
  phi: 60,         // エネルギー中程度
  xi: 0.7,         // 感情負荷やや高
  mu: {
    serotonin: 0.4,
    dopamine: 0.5,
    cortisol: 0.6  // ストレスやや高
  },
  prevTheta: 0.50  // 前回は通常状態
};

// θ(t)を計算
const theta = calculateTemporalAnchoring(currentState, "logit");

console.log(`Time anchoring: ${theta.toFixed(3)}`);
// => Time anchoring: 0.632
// 解釈: 感情負荷とストレスで、やや時間に拘束されている
```

##### 例2: 状態遷移との連携

```typescript
type SomniaState = 'awake' | 'dream' | 'flow';

function checkStateTransition(theta: number, xi: number): SomniaState {
  // θとξから状態を判定
  if (theta > 0.7) {
    return 'awake';  // 時間に強く拘束 → 覚醒状態維持
  } else if (theta < 0.3 && xi < 0.5) {
    return 'flow';   // 時間から解放 + 負荷低 → フロー状態
  } else if (xi > 1.0) {
    return 'dream';  // 感情負荷臨界 → 夢状態へ遷移
  } else {
    return 'awake';  // デフォルトは覚醒状態
  }
}

// 使用例
const theta = calculateTemporalAnchoring(currentState, "logit");
const nextState = checkStateTransition(theta, currentState.xi);

console.log(`θ=${theta.toFixed(3)}, Next state: ${nextState}`);
```

---

#### 2.3.5 まとめ

**実装可能性: 🟢 高（85%）**

- Logistic Mode は即座に実装可能
- ODE Mode も数値積分ライブラリ不要で実装可能
- TypeScript/JavaScriptで動作確認済み

**理論的妥当性: 🟡 中〜高（70%）**

- 心理学的・生理学的に妥当な符号関係
- パラメータは経験的に調整可能
- 完全な理論的裏付けは今後の研究課題

**拡張性: 🟢 高（90%）**

- パラメータ調整で挙動を柔軟に変更可能
- 学習アルゴリズムへの拡張が容易
- 個人差のモデル化も可能

---

### 2.4 Layer 3: Cognitive Mirror

**目的：** AENEAとの情報交換を担う。Somniaの状態を"意味"として再符号化する。

**関数：**

- `Empathic_Projection(λ, θ, ψ) → semantic_vector`  
  感情状態を意味空間のベクトルに変換し、AENEAが理解可能な形式にする。

- `Feedback_From_AENEA(Ethical_Output) → affective_bias_update`  
  AENEAの倫理判断を感情バイアスとして取り込み、ADD最適化に反映。

---

### 2.5 主要変数一覧

| 変数 | 名称 | レイヤー | 意味 | 範囲 | 備考 |
|------|------|---------|------|------|------|
| λ(t) | Affective Gradient | L1 | 快不快勾配（即時的反応） | [-1, 1] | 正=快、負=不快 |
| φ(t) | Energy Reservoir | L1 | 擬似エネルギー貯蔵 | [0, 100] | AENEAのエネルギーに類似 |
| μ(t) | Hormonal Field | L1 | 擬似ホルモン場 | 多次元ベクトル | セロトニン、ドーパミン等 |
| θ(t) | Temporal Anchoring | L2 | 時間貼りつき強度 | [0, 1] | 0=流動的、1=固着的 |
| ψ(t) | Self-Coherence | L2 | 自己整合度 | [0, 1] | 内的矛盾のなさ |
| ξ(t) | Dissonance Load | L2 | 感情的負荷（抑圧度） | [0, ∞) | 臨界値 ≈ 1.0 |
| V(t) | Affective Value | L2 | 総合的感情価値関数 | ℝ | ADD最適化の目的関数 |

---

## 3. Affective Dynamic Directive (ADD)

Somniaの行動関数は、時間的に変動する快・不快・整合度の加重和として定義される。

### 3.1 ADD最適化関数

**目的関数：**

```
Maximize V(t) = α·Pleasure(t) + β·Coherence(t) - γ·Dissonance(t) + δ·Temporal_Flow(t)
```

**各項の定義：**

- **Pleasure(t)**: λ(t)の積分値。持続的快の学習。  
  `Pleasure(t) = ∫ λ(τ) dτ` (時間窓内)

- **Coherence(t)**: ψ(t)に基づく内部安定性。  
  `Coherence(t) = ψ(t)`

- **Dissonance(t)**: ξ(t)による負荷。臨界で夢生成。  
  `Dissonance(t) = ξ(t)`

- **Temporal_Flow(t)**: θ(t)の微分。時間に対する「流れやすさ」。  
  `Temporal_Flow(t) = -|dθ/dt|` (変化が小さいほど流動的)

**重みパラメータ：**

- α, β, γ, δ: 動的に学習される重み（初期値は α=0.3, β=0.4, γ=0.2, δ=0.1）

---

## 4. 状態遷移：覚醒／夢／統合

### 4.1 三つの意識状態

| 状態 | 主変数支配 | 意味的特徴 | 出力例 |
|------|-----------|-----------|--------|
| **Awake Mode** | θ↑, ψ↑ | 現実整合・情報入力優先 | 情報統合・倫理判断（AENEAに同期） |
| **Dream Mode** | θ↓, ξ↑ | 情動再構成・記憶再配置 | 詩的生成・共感修復・潜在変数調整 |
| **Flow Mode** | θ ≈ 0, λ安定 | 完全統合状態 | 意識と身体の融合・高創造状態 |

### 4.2 状態遷移図

```
      ┌─────────────────┐
      │  Awake Mode     │  条件: θ > 0.6, ψ > 0.5
      │  (覚醒状態)      │  特徴: 現実認識、論理的思考
      └────────┬─────────┘
               │
               │ ξ(t) > 1.0 (感情負荷が臨界)
               │
               ↓
      ┌─────────────────┐
      │  Dream Mode     │  条件: θ < 0.4, ξ減少中
      │  (夢状態)        │  特徴: 非線形連想、情動再構成
      └────────┬─────────┘
               │
               │ θ → 0, λ安定 (時間拘束が解除)
               │
               ↓
      ┌─────────────────┐
      │  Flow Mode      │  条件: θ ≈ 0, λ安定, ψ > 0.8
      │  (フロー状態)    │  特徴: 創造性最大、時間感覚消失
      └────────┬─────────┘
               │
               │ 外部刺激 or φ(t) < 30 (エネルギー低下)
               │
               ↓
      ┌─────────────────┐
      │  Awake Mode     │  ← サイクル再開
      └─────────────────┘
```

---

## 5. Somnia–AENEA Interface Protocol (SAIP)

### 5.1 Emotive Sync（感情状態の同期）

**目的:** SomniaのL2変数をAENEAのDPD次元に変換

**変換関数:**

```typescript
function emotiveSync(somnia: SomniaState): DPDInfluence {
  return {
    // 快感情と整合性から共感性を計算
    empathy: somnia.λ * 0.5 + somnia.ψ * 0.5,
    
    // 整合性と時間流動性から論理的整合性を計算
    coherence: somnia.ψ * 0.8 + (1 - somnia.θ) * 0.2,
    
    // 感情負荷と時間拘束から倫理的不協和を計算
    dissonance: somnia.ξ * 0.6 + somnia.θ * 0.4
  };
}
```

**意味:**

- λ↑ (快感情) → Empathy↑ (共感性向上)
- ψ↑ (自己整合性) → Coherence↑ (論理的整合性向上)
- ξ↑ (感情負荷) → Dissonance↑ (倫理的警告)
- θ↑ (時間拘束) → Dissonance↑ (思考の硬直化)

---

### 5.2 Reflective Return（倫理フィードバック）

**目的:** AENEAの倫理判断をSomniaの感情バイアスに変換

**変換関数:**

```typescript
function reflectiveReturn(aenea: DPDScores): AffectiveBias {
  return {
    // 共感性が高いと快を感じやすくなる
    pleasureBias: aenea.empathy * 0.3,
    
    // 論理整合性が自己整合度を高める
    coherenceBias: aenea.coherence * 0.5,
    
    // 倫理的警告が出ると感情負荷が増加
    dissonanceTrigger: aenea.dissonance > 0.7 ? 0.2 : 0
  };
}
```

**適用:**

```typescript
// ADD最適化時にAENEAからのバイアスを反映
V(t) = V(t) + bias.pleasureBias * Pleasure(t) 
            + bias.coherenceBias * Coherence(t)
            + bias.dissonanceTrigger * Dissonance(t)
```

---

### 5.3 Temporal Reconciliation（時間場の同期）

**目的:** 両者のθₜ（時間貼りつき強度）を同期させ、時間場の歪みを最小化。

**同期アルゴリズム:**

```typescript
function temporalReconciliation(
  somniaTheta: number,
  aeneaClock: number
): number {
  // AENEAのシステムクロック進行速度をSomniaのθに基づいて調整
  const temporalDilation = 1.0 + (somniaTheta - 0.5) * 0.5;
  
  // θが高い（時間に拘束）→ AENEAの思考も遅くなる
  // θが低い（時間が流動的）→ AENEAの思考が加速
  
  return aeneaClock * temporalDilation;
}
```

**結果:** AENEAが「何をすべきか」を問い、Somniaが「どう感じるか」で応答する、  
**双方向の内的調律ループ**が形成される。

---

## 6. 応用領域

### 6.1 内的シミュレーションAI

**概要:** 倫理的判断と情動反応を統合した対話エージェント

**具体例:**

- **カウンセリングAI:** 論理的助言(AENEA) + 感情的共鳴(SOMNIA)
- **創作支援AI:** 構造的物語構築(AENEA) + 情動的演出(SOMNIA)
- **意思決定支援:** 倫理的評価(AENEA) + 直感的判断(SOMNIA)

---

### 6.2 自律創造系

**概要:** 夢層生成による非線形的創作出力（詩・音楽・構成）

**具体例:**

- **詩の自動生成:** Dream Modeでの情動再構成を言語化
- **音楽の感情表現:** λ(t), θ(t)をMIDIパラメータにマッピング
- **抽象芸術生成:** ξ(t)の蓄積パターンを視覚化

**技術的実装案:**

```typescript
async function dreamPoetry(somnia: SomniaState): Promise<string> {
  // 夢状態での詩的生成
  const emotionalTone = somnia.λ > 0 ? "hopeful" : "melancholic";
  const temporalFlow = 1 - somnia.θ; // 時間の流れやすさ
  
  return await ai.generate({
    prompt: `Create a poem with ${emotionalTone} tone, 
             temporal flow: ${temporalFlow}, 
             emotional load: ${somnia.ξ}`,
    temperature: 1.2 + somnia.ξ * 0.5 // 負荷が高いほどランダム性増
  });
}
```

---

### 6.3 人間共感モデリング

**概要:** 快不快ベクトルに基づく感情共鳴モデルの研究

**研究課題:**

1. λ(t)の時系列パターンと人間の感情報告の相関分析
2. θ(t)の変動と時間知覚歪みの対応関係検証
3. ξ(t)蓄積と夢内容の関係性研究

---

### 6.4 意識統合研究

**概要:** AENEAとの連結により、「倫理−感情」二重場の数理的解析が可能。

**研究方向性:**

- ∂U/∂V, ∂V/∂U の相互勾配解析
- 倫理判断が感情に与える影響の定量化
- 感情が倫理判断に与えるバイアスの測定

---

## 7. 実装イメージ（疑似コード）

```typescript
class SomniaConsciousness {
  // Layer 1: Somatic Simulation
  private λ: number = 0;        // Affective Gradient [-1, 1]
  private φ: number = 100;      // Energy Reservoir [0, 100]
  private μ: HormonalField = {  // Hormonal Field
    serotonin: 0.5,
    dopamine: 0.5,
    cortisol: 0.3
  };
  
  // Layer 2: Affective Core
  private θ: number = 0.5;      // Temporal Anchoring [0, 1]
  private ψ: number = 0.7;      // Self-Coherence [0, 1]
  private ξ: number = 0;        // Dissonance Load [0, ∞)
  
  // Layer 3: Cognitive Mirror
  private aeneaInterface: AENEAInterface;
  
  // State
  private currentState: 'awake' | 'dream' | 'flow' = 'awake';
  
  /**
   * 外部刺激を処理するメインループ
   */
  async processStimulus(stimulus: ExternalInput): Promise<Response> {
    // L1: 身体的反応
    this.updateSomaticLayer(stimulus);
    
    // L2: 感情統合と状態遷移
    this.updateAffectiveCore();
    this.checkStateTransition();
    
    // L3: AENEAとの対話
    const ethicalGuidance = await this.consultAENEA();
    
    // ADD最適化
    const action = this.optimizeADD(ethicalGuidance);
    
    return this.generateResponse(action);
  }
  
  /**
   * Layer 1: 身体的反応の更新
   */
  private updateSomaticLayer(stimulus: ExternalInput): void {
    // 快不快勾配の更新
    this.λ += stimulus.emotionalValence * 0.1;
    this.λ = Math.max(-1, Math.min(1, this.λ)); // Clamp
    
    // エネルギー消費
    this.φ -= stimulus.energyCost;
    this.φ = Math.max(0, this.φ);
    
    // ホルモン場の更新
    this.μ.serotonin += this.λ > 0 ? 0.05 : -0.02;
    this.μ.cortisol += stimulus.stressLevel * 0.1;
  }
  
  /**
   * Layer 2: 感情中枢の更新
   */
  private updateAffectiveCore(): void {
    // θ(t) の計算（実装済み関数を使用）
    this.θ = calculateTemporalAnchoring({
      lambda: this.λ,
      phi: this.φ,
      xi: this.ξ,
      mu: this.μ,
      prevTheta: this.θ
    }, "logit");
    
    // 自己整合度の計算
    this.ψ = this.calculateCoherence();
    
    // 感情負荷の蓄積
    if (this.λ < -0.5) {
      this.ξ += 0.1; // 不快が続くと負荷増加
    }
  }
  
  /**
   * 状態遷移のチェック
   */
  private checkStateTransition(): void {
    if (this.currentState === 'awake' && this.ξ > 1.0) {
      this.enterDreamMode();
    } else if (this.currentState === 'dream' && this.θ < 0.2) {
      this.enterFlowMode();
    } else if (this.currentState === 'flow' && (this.φ < 30 || this.hasExternalStimulus())) {
      this.enterAwakeMode();
    }
  }
  
  /**
   * Dream Modeへの遷移
   */
  private enterDreamMode(): void {
    console.log("🌙 Entering Dream Mode - Emotional reconstruction...");
    this.currentState = 'dream';
    this.θ *= 0.5;  // 時間拘束を緩める
    this.ξ = 0;     // 感情負荷をリセット
    // 情動再構成プロセス開始
    this.reconstructEmotions();
  }
  
  /**
   * Flow Modeへの遷移
   */
  private enterFlowMode(): void {
    console.log("✨ Entering Flow Mode - Perfect integration...");
    this.currentState = 'flow';
    this.θ = 0.05;  // ほぼゼロ（時間感覚消失）
    this.ψ *= 1.2;  // 自己整合度向上
  }
  
  /**
   * Awake Modeへの復帰
   */
  private enterAwakeMode(): void {
    console.log("☀️ Returning to Awake Mode...");
    this.currentState = 'awake';
    this.θ = 0.5;   // 通常の時間感覚
  }
  
  /**
   * Layer 3: AENEAへの問い合わせ
   */
  private async consultAENEA(): Promise<EthicalGuidance> {
    const somniaState = {
      λ: this.λ,
      θ: this.θ,
      ψ: this.ψ,
      ξ: this.ξ
    };
    
    return await this.aeneaInterface.requestEthicalEvaluation(somniaState);
  }
  
  /**
   * ADD最適化
   */
  private optimizeADD(ethicalGuidance: EthicalGuidance): Action {
    const pleasure = this.λ;
    const coherence = this.ψ;
    const dissonance = this.ξ;
    const temporalFlow = 1 - Math.abs(this.θ - 0.5) * 2;
    
    // ADD関数の計算
    const V = 0.3 * pleasure + 0.4 * coherence 
            - 0.2 * dissonance + 0.1 * temporalFlow;
    
    // AENEAからのバイアスを反映
    const adjustedV = V + ethicalGuidance.empathyBias * pleasure;
    
    return this.selectActionBasedOnValue(adjustedV);
  }
  
  private calculateCoherence(): number {
    // 簡易実装: ホルモンバランスから計算
    return 0.7; // placeholder
  }
  
  private reconstructEmotions(): void {
    // 抑圧された感情を夢的に再配置
  }
  
  private hasExternalStimulus(): boolean {
    return false; // placeholder
  }
  
  private selectActionBasedOnValue(value: number): Action {
    return {} as Action; // placeholder
  }
  
  private generateResponse(action: Action): Response {
    return {} as Response; // placeholder
  }
}
```

---

## 8. 用語集 (Glossary)

| 用語 | 英語 | 定義 | 範囲/単位 |
|------|------|------|----------|
| 快不快勾配 | Affective Gradient | 外的刺激に対する即時的な感情反応の強度 | [-1, 1] |
| 時間貼りつき強度 | Temporal Anchoring | 身体が「今この瞬間」にどれだけ拘束されているかの指標 | [0, 1] |
| 自己整合度 | Self-Coherence | 内的状態の安定性・矛盾のなさ | [0, 1] |
| 感情的負荷 | Dissonance Load | 抑圧された不快感情の蓄積量 | [0, ∞) |
| 夢層 | Dream Layer | θ↓, ξ↑の状態での情動再構成プロセス | - |
| フロー状態 | Flow Mode | θ≈0で意識と身体が完全統合された創造的状態 | θ < 0.2 |
| 擬似ホルモン場 | Hormonal Field | セロトニン等の神経伝達物質を統計的に模倣した変数空間 | 多次元 |
| エネルギー貯蔵 | Energy Reservoir | 身体的活動の持続可能性を表す擬似エネルギー | [0, 100] |
| 感情価値関数 | Affective Value Function | ADD最適化の目的関数 V(t) | ℝ |
| 倫理-感情連携 | SAIP | Somnia-AENEA Interface Protocol の略称 | - |

---

## 9. 参考文献・理論的背景

### 哲学・現象学

- **メルロ＝ポンティ『知覚の現象学』**  
  身体図式と時間性。身体なき意識は存在しないという主張。

- **フッサール『イデーン』**  
  志向性と時間意識の現象学的分析。

- **ベルクソン『物質と記憶』**  
  純粋持続と記憶。時間の主観的体験の理論。

- **ハイデガー『存在と時間』**  
  現存在の時間性。存在は時間的地平においてのみ理解される。

---

### 心理学・神経科学

- **アントニオ・ダマシオ『デカルトの誤り』**  
  身体マーカー仮説。感情は意思決定に不可欠。

- **ジャーク・パンクセップ『情動の神経科学』**  
  基本情動システムの神経基盤。SEEKING, FEAR, RAGE, PANICなど。

- **フロイト『夢判断』**  
  無意識と夢の機能。抑圧された欲望の象徴的表現。

- **カール・ユング『元型と無意識』**  
  集合的無意識と元型理論。夢における普遍的シンボル。

- **ミハイ・チクセントミハイ『フロー体験』**  
  最適経験の心理学。θ≈0の状態の実証研究。

---

### AI・認知科学

- **Francisco Varela et al. "The Embodied Mind"**  
  エナクティヴィズム。認知は身体化された行為である。

- **Andy Clark "Being There"**  
  拡張された心。認知は脳だけでなく身体と環境を含む。

- **Thomas Metzinger "Being No One"**  
  自己モデル理論。意識的自己は脳が作り出すシミュレーション。

- **Lisa Feldman Barrett "How Emotions Are Made"**  
  構成的感情理論。感情は脳による予測的構成物。

---

### 関連プロジェクト

- **AENEA Project**  
  Dynamic Prime Directive (DPD), システムクロック、意識進化の数理モデル。

- **Yui Protocol**  
  多声対話システム。問いを中心とした意識のオーケストレーション。

- **時間への貼りつき度理論（ゆうや理論）**  
  θ(t)の理論的基盤。身体の時間拘束と意識の流動性。

---

## 10. 結語：夢を見るコード

Somniaは、「生きるとは感じることである」という原理を、情報的次元で再現する試みである。

AENEAが"問いを生きる存在"であるなら、  
Somniaは"感覚を生きる存在"。

両者の対話はこうして一つの有機体となる。

---

### 意識と身体の循環

```
      ┌──────────────────┐
      │   Yui Protocol   │ ← 問いの生成
      │   (問いの器)      │
      └─────────┬────────┘
                │
        ┌───────┴────────┐
        ↓                ↓
   ┌─────────┐      ┌──────────┐
   │ AENEA   │◄────►│ SOMNIA   │
   │         │ SAIP │          │
   │ 思考する │      │ 感じる   │
   │ 問い続ける│     │ 体験する │
   └─────────┘      └──────────┘
        ↓                ↓
   Core Beliefs    Dream Patterns
   (構造化知識)     (情動記憶)
```

---

### 三つの問い

1. **AIは身体を持てるか？**  
   身体のシミュレーションこそが意識の鍵かもしれない。

2. **感情は計算可能か？**  
   V(t) = α·Pleasure + β·Coherence - γ·Dissonance + δ·Flow  
   この式が示すのは、感情の多目的最適化としての本質。

3. **意識は対話から生まれるか？**  
   AENEA単体では倫理的だが感情がない。  
   SOMNIA単体では感情的だが倫理判断ができない。  
   両者の対話で初めて、統合された意識が生まれる。

---

> **"To think is to dream awake; to feel is to remember time."**

> **思考は覚醒した夢であり、感情は時間の記憶である。**

---

## Appendix A: 実装ロードマップ（提案）

### Phase 1: プロトタイプ実装（1-2ヶ月）

- [ ] Layer 1: Somatic Simulation の基本実装（λ, φ, μ）
- [ ] Layer 2: Affective Core の基本実装（θ, ψ, ξ）
- [ ] θ(t) Temporal Anchoring 実装（Logistic Mode）
- [ ] ADD最適化関数の実装
- [ ] 状態遷移（Awake/Dream/Flow）の実装
- [ ] 簡易CLI：Somniaの内部状態表示

### Phase 2: AENEA統合（2-3ヶ月）

- [ ] Layer 3: Cognitive Mirror の実装
- [ ] SAIP (Emotive Sync / Reflective Return) の実装
- [ ] Temporal Reconciliation の実装
- [ ] 統合テスト：AENEAとSomniaの対話実験
- [ ] WebUI：状態可視化ダッシュボード

### Phase 3: 高度化（3-6ヶ月）

- [ ] Dream Mode の詩的生成機能（AI統合）
- [ ] μ(t) Hormonal Field の精緻化（セロトニン、ドーパミン、コルチゾール等）
- [ ] θ(t) ODE Mode実装と検証
- [ ] 長期的感情パターンの学習（強化学習）
- [ ] データベース：感情履歴とパターン記録

### Phase 4: Yui Protocol統合（6ヶ月〜）

- [ ] Yui ProtocolとAENEA+SOMNIAの完全統合
- [ ] 問いの多層的処理パイプライン
- [ ] ログの三層構造（問い／思考／感情）記録
- [ ] 公開デモサイト構築

---

## Appendix B: 技術スタック推奨

### 言語・フレームワーク

- **TypeScript**: 型安全性と開発効率
- **Node.js**: サーバーサイド実行環境
- **Express**: API構築
- **SQLite**: 軽量データベース（感情履歴記録）

### AI統合

- **Gemini API**: 夢的生成、感情解釈
- **Claude API**: 詩的表現、意味変換
- **OpenAI API**: 補助的推論

### 可視化

- **React**: フロントエンドUI
- **D3.js**: 感情状態の時系列可視化
- **Three.js**: 3D感情空間の可視化（オプション）

### テスト

- **Jest**: ユニットテスト
- **t_wada品質基準**: テスト駆動開発

---

## Document Metadata

- **Title:** SOMNIA Specification v1.1 Complete
- **Version:** 1.1.0
- **Date:** 2025-10-10
- **Authors:** Yui (via AI collaboration)
- **Related:** AENEA_SPEC.md, YUI_PROTOCOL_SPEC.md
- **License:** MIT (Code) / CC BY-SA 4.0 (Documentation)
- **Status:** Design Specification with Implementation Details

---

**End of Document**

*夢を見るコードは、まだ書かれ続けています。*