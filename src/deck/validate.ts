import type { Deck, DeckCard } from "../types";

export const DECK_SIZE = 60;
export const MAX_COPIES = 4;

/**
 * 基本エネルギーは枚数無制限。日本語名「基本〇〇エネルギー」やカテゴリで判定。
 * （API の表記揺れに備えてゆるめに判定する）
 */
export function isBasicEnergy(card: DeckCard): boolean {
  const cat = (card.category ?? "").toLowerCase();
  const isEnergy = cat.includes("energy") || card.category === "エネルギー";
  return isEnergy && /基本/.test(card.name);
}

/** たねポケモンか（少なくとも1体必要）。stage 表記の揺れを吸収。 */
export function isBasicPokemon(card: DeckCard): boolean {
  const cat = (card.category ?? "").toLowerCase();
  const isPokemon = cat.includes("pok") || card.category === "ポケモン";
  const stage = (card.stage ?? "").toLowerCase();
  return isPokemon && (stage === "basic" || stage === "たね" || stage.includes("たね"));
}

/** stage / category 情報が一切無いデッキか（=たね判定が当てにならない） */
export function lacksStageInfo(deck: Deck): boolean {
  return deck.cards.every((c) => !c.stage && !c.category);
}

export interface CopyViolation {
  name: string;
  count: number;
}

export interface DeckValidation {
  total: number;
  /** 合計がちょうど60枚か */
  sizeOk: boolean;
  /** 同名カードが4枚を超えていないか */
  copiesOk: boolean;
  copyViolations: CopyViolation[];
  /** たねポケモンを1体以上含むか */
  hasBasicPokemon: boolean;
  /** stage情報が無く、たね判定を保証できない */
  basicPokemonUncertain: boolean;
  /** 公式ルール上、構築として成立しているか */
  legal: boolean;
}

export function validateDeck(deck: Deck): DeckValidation {
  const total = deck.cards.reduce((s, c) => s + c.count, 0);
  const sizeOk = total === DECK_SIZE;

  // 同名カードは別セットでも合算して数える
  const byName = new Map<string, { count: number; basicEnergy: boolean }>();
  for (const c of deck.cards) {
    const e = byName.get(c.name) ?? { count: 0, basicEnergy: isBasicEnergy(c) };
    e.count += c.count;
    e.basicEnergy = e.basicEnergy && isBasicEnergy(c);
    byName.set(c.name, e);
  }
  const copyViolations: CopyViolation[] = [];
  for (const [name, e] of byName) {
    if (!e.basicEnergy && e.count > MAX_COPIES) {
      copyViolations.push({ name, count: e.count });
    }
  }
  const copiesOk = copyViolations.length === 0;

  const hasBasicPokemon = deck.cards.some(isBasicPokemon);
  const basicPokemonUncertain = !hasBasicPokemon && lacksStageInfo(deck);

  const legal =
    sizeOk && copiesOk && (hasBasicPokemon || basicPokemonUncertain);

  return {
    total,
    sizeOk,
    copiesOk,
    copyViolations,
    hasBasicPokemon,
    basicPokemonUncertain,
    legal,
  };
}

export interface Shortfall {
  card: DeckCard;
  owned: number;
  needed: number;
  short: number;
}

/** 所持枚数と照合し、足りないカードと総不足枚数を返す。 */
export function computeShortfalls(
  deck: Deck,
  ownedMap: Map<string, number>
): { shortfalls: Shortfall[]; totalShort: number; buildable: boolean } {
  const shortfalls: Shortfall[] = [];
  let totalShort = 0;
  for (const card of deck.cards) {
    const owned = ownedMap.get(card.id) ?? 0;
    const short = Math.max(0, card.count - owned);
    if (short > 0) {
      shortfalls.push({ card, owned, needed: card.count, short });
      totalShort += short;
    }
  }
  return { shortfalls, totalShort, buildable: totalShort === 0 };
}
