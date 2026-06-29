import Dexie, { type Table } from "dexie";
import type { CollectionItem, Deck } from "../types";

// 端末内（IndexedDB）にコレクションとデッキを保存する。サーバー・ログイン不要。
class CollectionDB extends Dexie {
  items!: Table<CollectionItem, string>;
  decks!: Table<Deck, string>;

  constructor() {
    super("nao-pokecolle");
    this.db_version();
  }

  private db_version() {
    // id を主キー、name と addedAt にインデックス（検索・並び替え用）
    this.version(1).stores({
      items: "id, name, addedAt",
    });
    // v2: デッキ用テーブルを追加（cards は配列としてそのまま保持）
    this.version(2).stores({
      items: "id, name, addedAt",
      decks: "id, name, updatedAt",
    });
  }
}

export const db = new CollectionDB();

/** 所持枚数を増やす（未登録なら追加）。delta は正負どちらも可。 */
export async function adjustQuantity(
  card: Omit<CollectionItem, "quantity" | "addedAt">,
  delta: number
): Promise<void> {
  await db.transaction("rw", db.items, async () => {
    const existing = await db.items.get(card.id);
    if (!existing) {
      if (delta <= 0) return;
      await db.items.add({ ...card, quantity: delta, addedAt: Date.now() });
      return;
    }
    const quantity = existing.quantity + delta;
    if (quantity <= 0) {
      await db.items.delete(card.id);
    } else {
      await db.items.update(card.id, { quantity });
    }
  });
}

/** 収納ボックス名を設定する（空文字なら未設定に戻す）。所持カードのみ対象。 */
export async function setItemBox(
  id: string,
  box: string | undefined
): Promise<void> {
  const name = box?.trim();
  // undefined を渡すと Dexie は box プロパティ自体を削除する
  await db.items.update(id, { box: name || undefined });
}

/** コレクションから完全に削除する。 */
export async function removeItem(id: string): Promise<void> {
  await db.items.delete(id);
}

/** 所持データをJSONで書き出す（バックアップ／機種変更用）。 */
export async function exportCollection(): Promise<CollectionItem[]> {
  return db.items.orderBy("addedAt").toArray();
}

/** JSONから復元する。既存の同一IDは枚数を上書きする。 */
export async function importCollection(items: CollectionItem[]): Promise<number> {
  await db.items.bulkPut(items);
  return items.length;
}
