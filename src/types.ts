// TCGdex API のレスポンス形（必要な範囲のみ）
// ドキュメント: https://tcgdex.dev/

/** /cards の一覧で返る簡易カード情報 */
export interface CardBrief {
  id: string;
  localId: string;
  name: string;
  /** 拡張子・画質なしのベースURL。未設定の場合あり。 */
  image?: string;
}

/** /cards/{id} で返る詳細カード情報 */
export interface CardFull extends CardBrief {
  category?: string;
  /** ポケモンの進化段階（Basic / Stage1 ... 言語により表記が異なる場合あり） */
  stage?: string;
  rarity?: string;
  illustrator?: string;
  hp?: number;
  types?: string[];
  set?: {
    id: string;
    name: string;
    cardCount?: { total?: number; official?: number };
    logo?: string;
    symbol?: string;
  };
}

/** 端末内に保存する所持カード1件 */
export interface CollectionItem {
  /** カードID（主キー） */
  id: string;
  name: string;
  localId: string;
  setName: string;
  image?: string;
  rarity?: string;
  /** 所持枚数 */
  quantity: number;
  /** 収納している物理ボックス名（自由入力。未設定は undefined） */
  box?: string;
  /** 追加日時（ソート用） */
  addedAt: number;
}

/** デッキに入っているカード1種 */
export interface DeckCard {
  id: string;
  name: string;
  localId: string;
  setName: string;
  image?: string;
  rarity?: string;
  /** Pokemon / Trainer / Energy など（ルール検証用） */
  category?: string;
  /** 進化段階（たねポケモン判定用） */
  stage?: string;
  /** このデッキでの採用枚数 */
  count: number;
}

/** 端末内に保存するデッキ */
export interface Deck {
  id: string;
  name: string;
  cards: DeckCard[];
  createdAt: number;
  updatedAt: number;
}
