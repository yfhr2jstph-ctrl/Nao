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
  /** 追加日時（ソート用） */
  addedAt: number;
}
