import { db } from "./collection";
import type { Deck, DeckCard } from "../types";

// デッキも同じ IndexedDB（nao-pokecolle）に保存する。
// テーブル定義は collection.ts の version(2) で追加している。

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

/** 新規デッキを作成して ID を返す。 */
export async function createDeck(name: string): Promise<string> {
  const now = Date.now();
  const deck: Deck = {
    id: uid(),
    name: name.trim() || "新しいデッキ",
    cards: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.decks.add(deck);
  return deck.id;
}

export async function renameDeck(id: string, name: string): Promise<void> {
  await db.decks.update(id, { name: name.trim() || "無題のデッキ", updatedAt: Date.now() });
}

export async function deleteDeck(id: string): Promise<void> {
  await db.decks.delete(id);
}

/**
 * デッキ内のあるカードの採用枚数を delta だけ増減する。
 * 0 になったらデッキから外す。未登録なら追加。
 */
export async function adjustDeckCard(
  deckId: string,
  card: Omit<DeckCard, "count">,
  delta: number
): Promise<void> {
  await db.transaction("rw", db.decks, async () => {
    const deck = await db.decks.get(deckId);
    if (!deck) return;
    const idx = deck.cards.findIndex((c) => c.id === card.id);
    if (idx === -1) {
      if (delta <= 0) return;
      deck.cards.push({ ...card, count: delta });
    } else {
      const next = deck.cards[idx].count + delta;
      if (next <= 0) {
        deck.cards.splice(idx, 1);
      } else {
        // メタ情報も最新で上書き（後から詳細が分かった場合に補完）
        deck.cards[idx] = { ...deck.cards[idx], ...card, count: next };
      }
    }
    deck.updatedAt = Date.now();
    await db.decks.put(deck);
  });
}
