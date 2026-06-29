import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db/collection";
import SearchView from "./components/SearchView";
import CollectionView from "./components/CollectionView";
import CardDetailSheet from "./components/CardDetailSheet";
import type { DisplayCard } from "./components/CardGrid";

type Tab = "search" | "collection";

export default function App() {
  const [tab, setTab] = useState<Tab>("search");
  const [selected, setSelected] = useState<DisplayCard | null>(null);

  // 全所持カードを id→枚数 のマップにしてバッジ表示に使う（変更は自動反映）
  const items = useLiveQuery(() => db.items.toArray(), []);
  const quantities = useMemo(() => {
    const m = new Map<string, number>();
    items?.forEach((i) => m.set(i.id, i.quantity));
    return m;
  }, [items]);

  return (
    <div className="app">
      {tab === "search" ? (
        <SearchView quantities={quantities} onSelect={setSelected} />
      ) : (
        <CollectionView quantities={quantities} onSelect={setSelected} />
      )}

      {selected && (
        <CardDetailSheet card={selected} onClose={() => setSelected(null)} />
      )}

      <nav className="bottomnav">
        <button
          className={tab === "search" ? "active" : ""}
          onClick={() => setTab("search")}
        >
          <span className="ico">🔍</span>
          探す
        </button>
        <button
          className={tab === "collection" ? "active" : ""}
          onClick={() => setTab("collection")}
        >
          <span className="ico">🗂️</span>
          コレクション
        </button>
      </nav>
    </div>
  );
}
