import { useState } from "react";
import { searchCardsByName } from "../api/tcgdex";
import CardGrid, { type DisplayCard } from "./CardGrid";

interface Props {
  quantities: Map<string, number>;
  onSelect: (card: DisplayCard) => void;
  title?: string;
  onBack?: () => void;
}

export default function SearchView({
  quantities,
  onSelect,
  title = "カードを探す",
  onBack,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DisplayCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const cards = await searchCardsByName(q);
      setResults(cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "検索に失敗しました");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="topbar">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            ‹ 戻る
          </button>
        )}
        <h1>{title}</h1>
        <form className="search-row" onSubmit={runSearch}>
          <input
            className="search-input"
            type="search"
            inputMode="search"
            placeholder="カード名（例：ピカチュウ）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            enterKeyHint="search"
          />
          <button className="btn" type="submit" disabled={loading || !query.trim()}>
            検索
          </button>
        </form>
      </div>

      {loading && <div className="state"><div className="spinner" /></div>}
      {error && <p className="state error">{error}</p>}

      {!loading && !error && results && results.length === 0 && (
        <div className="state">
          <div className="big">🔍</div>
          「{query}」に一致するカードが見つかりませんでした。
        </div>
      )}

      {!loading && results === null && !error && (
        <div className="state">
          <div className="big">🃏</div>
          カード名を入力して検索してください。
          <br />
          見つけたカードの「＋」で所持枚数を登録できます。
        </div>
      )}

      {!loading && results && results.length > 0 && (
        <>
          <p className="summary">
            <b>{results.length}</b> 件ヒット
          </p>
          <CardGrid cards={results} quantities={quantities} onSelect={onSelect} />
        </>
      )}
    </>
  );
}
