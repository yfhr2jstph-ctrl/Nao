import { useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, exportCollection, importCollection } from "../db/collection";
import CardGrid, { type DisplayCard } from "./CardGrid";
import type { CollectionItem } from "../types";

interface Props {
  quantities: Map<string, number>;
  onSelect: (card: DisplayCard) => void;
}

export default function CollectionView({ quantities, onSelect }: Props) {
  const [filter, setFilter] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const items = useLiveQuery(
    () => db.items.orderBy("addedAt").reverse().toArray(),
    [],
    undefined as CollectionItem[] | undefined
  );

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = filter.trim().toLowerCase();
    const list = q
      ? items.filter((i) => i.name.toLowerCase().includes(q))
      : items;
    return list.map(
      (i): DisplayCard => ({
        id: i.id,
        name: i.name,
        localId: i.localId,
        image: i.image,
        setName: i.setName,
      })
    );
  }, [items, filter]);

  const totalCards = items?.length ?? 0;
  const totalQty = items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const onExport = async () => {
    const data = await exportCollection();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pokecolle-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as CollectionItem[];
      const n = await importCollection(parsed);
      alert(`${n} 件を読み込みました。`);
    } catch {
      alert("読み込みに失敗しました。JSONファイルを確認してください。");
    }
  };

  return (
    <>
      <div className="topbar">
        <h1>マイコレクション</h1>
        <div className="search-row">
          <input
            className="search-input"
            type="search"
            placeholder="名前で絞り込み"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="btn ghost" onClick={onExport} title="バックアップ">
            書出
          </button>
          <button
            className="btn ghost"
            onClick={() => fileRef.current?.click()}
            title="復元"
          >
            読込
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={onImportFile}
          />
        </div>
      </div>

      {totalCards > 0 && (
        <p className="summary">
          <b>{totalCards}</b> 種類 / 合計 <b>{totalQty}</b> 枚
        </p>
      )}

      {items && totalCards === 0 && (
        <div className="state">
          <div className="big">📭</div>
          まだカードがありません。
          <br />
          「探す」タブからカードを追加しましょう。
        </div>
      )}

      {totalCards > 0 && filtered.length === 0 && (
        <div className="state">「{filter}」に一致する所持カードはありません。</div>
      )}

      {filtered.length > 0 && (
        <CardGrid cards={filtered} quantities={quantities} onSelect={onSelect} />
      )}
    </>
  );
}
