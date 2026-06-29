import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db/collection";
import SearchView from "./components/SearchView";
import CollectionView from "./components/CollectionView";
import DeckListView from "./components/DeckListView";
import DeckEditorView from "./components/DeckEditorView";
import CardDetailSheet from "./components/CardDetailSheet";
import type { DisplayCard } from "./components/CardGrid";

type Tab = "search" | "collection" | "decks";

export default function App() {
  const [tab, setTab] = useState<Tab>("search");
  const [selected, setSelected] = useState<DisplayCard | null>(null);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckSearchOpen, setDeckSearchOpen] = useState(false);

  // 全所持カードを id→枚数 のマップにしてバッジ・照合に使う（変更は自動反映）
  const items = useLiveQuery(() => db.items.toArray(), []);
  const quantities = useMemo(() => {
    const m = new Map<string, number>();
    items?.forEach((i) => m.set(i.id, i.quantity));
    return m;
  }, [items]);

  // 編集中デッキ（カード詳細でデッキ用ステッパーを出すため名前を取得）
  const editingDeck = useLiveQuery(
    () => (editingDeckId ? db.decks.get(editingDeckId) : undefined),
    [editingDeckId]
  );
  const activeDeck =
    tab === "decks" && editingDeck
      ? { id: editingDeck.id, name: editingDeck.name }
      : null;

  const goTab = (t: Tab) => {
    setTab(t);
    setDeckSearchOpen(false);
    if (t !== "decks") setEditingDeckId(null);
  };

  const renderMain = () => {
    if (tab === "search") {
      return <SearchView quantities={quantities} onSelect={setSelected} />;
    }
    if (tab === "collection") {
      return <CollectionView quantities={quantities} onSelect={setSelected} />;
    }
    // decks タブ
    if (!editingDeckId) {
      return <DeckListView ownedMap={quantities} onOpen={setEditingDeckId} />;
    }
    if (deckSearchOpen) {
      return (
        <SearchView
          quantities={quantities}
          onSelect={setSelected}
          title="デッキに追加"
          onBack={() => setDeckSearchOpen(false)}
        />
      );
    }
    return (
      <DeckEditorView
        deckId={editingDeckId}
        ownedMap={quantities}
        onBack={() => setEditingDeckId(null)}
        onAddCard={() => setDeckSearchOpen(true)}
        onSelectCard={setSelected}
      />
    );
  };

  return (
    <div className="app">
      {renderMain()}

      {selected && (
        <CardDetailSheet
          card={selected}
          activeDeck={activeDeck}
          onClose={() => setSelected(null)}
        />
      )}

      <nav className="bottomnav">
        <button
          className={tab === "search" ? "active" : ""}
          onClick={() => goTab("search")}
        >
          <span className="ico">🔍</span>
          探す
        </button>
        <button
          className={tab === "collection" ? "active" : ""}
          onClick={() => goTab("collection")}
        >
          <span className="ico">🗂️</span>
          コレクション
        </button>
        <button
          className={tab === "decks" ? "active" : ""}
          onClick={() => goTab("decks")}
        >
          <span className="ico">🛠️</span>
          デッキ
        </button>
      </nav>
    </div>
  );
}
