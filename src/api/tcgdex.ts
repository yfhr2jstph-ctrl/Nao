import type { CardBrief, CardFull } from "../types";

// TCGdex の多言語REST API。日本語データは "ja" を使う。
// 一覧:   GET /v2/ja/cards?name=<キーワード>
// 詳細:   GET /v2/ja/cards/{id}
const LANG = "ja";
const BASE = `https://api.tcgdex.net/v2/${LANG}`;

export type ImageQuality = "low" | "high";
export type ImageExt = "webp" | "png" | "jpg";

/**
 * TCGdex の画像URLは「ベースURL＋/画質.拡張子」で組み立てる。
 * 例: https://assets.tcgdex.net/ja/.../1 → .../1/high.webp
 */
export function buildImageUrl(
  base: string | undefined,
  quality: ImageQuality = "low",
  ext: ImageExt = "webp"
): string | undefined {
  if (!base) return undefined;
  return `${base}/${quality}.${ext}`;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`TCGdex API エラー (${res.status})`);
  }
  return (await res.json()) as T;
}

/**
 * カード名で検索する。TCGdex は name パラメータで部分一致（大文字小文字無視）。
 * 結果が多い場合に備えて上限を切る。
 */
export async function searchCardsByName(
  query: string,
  opts: { signal?: AbortSignal; limit?: number } = {}
): Promise<CardBrief[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `${BASE}/cards?name=${encodeURIComponent(q)}`;
  const cards = await getJson<CardBrief[]>(url, opts.signal);
  const limit = opts.limit ?? 60;
  return cards.slice(0, limit);
}

/** カードIDで詳細を取得する。 */
export async function getCard(
  id: string,
  signal?: AbortSignal
): Promise<CardFull> {
  return getJson<CardFull>(`${BASE}/cards/${encodeURIComponent(id)}`, signal);
}
