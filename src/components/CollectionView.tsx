import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, exportCollection, importCollection } from "../db/collection";
import CardGrid, { type DisplayCard } from "./CardGrid";
import type { CollectionItem } from "../types";

interface Props {
  quantities: Map<string, number>;
  onSelect: (card: DisplayCard) => void;
}

// box 絞り込みの特殊値。ボックス名は保存時に trim されるため、
// 先頭スペース付きの値は実在のボックス名と衝突しない。
const BOX_ALL = " __all";
const BOX_NONE = " __none";

export default function CollectionView({ quantities, onSelect }: Props) {
  const [filter, setFilter] = useState("");
  const [boxSel, setBoxSel] = useState<string>(BOX_ALL);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = useLiveQuery(
    () => db.items.orderBy("addedAt").reverse().toArray(),
    [],
    undefined as CollectionItem[] | undefined
  );

  // ボックス一覧（名前＋種類数）と未設定の件数
  const boxStats = useMemo(() => {
    const counts = new Map<string, number>();
    let none = 0;
    items?.forEach((i) => {
      if (i.box) counts.set(i.box, (counts.get(i.box) ?? 0) + 1);
      else none++;
    });
    const boxes = Array.from(counts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "ja")
    );
    return { boxes, none };
  }, [items]);

  // 選択中のボックスが空になったら「すべて」に戻す
  const boxExists =
    boxSel === BOX_ALL ||
    (boxSel === BOX_NONE && boxStats.none > 0) ||
    boxStats.boxes.some(([b]) => b === boxSel);
  useEffect(() => {
    if (!boxExists) setBoxSel(BOX_ALL);
  }, [boxExists]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = filter.trim().toLowerCase();
    const list = items.filter((i) => {
      if (q && !i.name.toLowerCase().includes(q)) return false;
      if (boxSel === BOX_NONE) return !i.box;
      if (boxSel !== BOX_ALL) return i.box === boxSel;
      return true;
    });
    return list.map(
      (i): DisplayCard => ({
        id: i.id,
        name: i.name,
        localId: i.localId,
        image: i.image,
        setName: i.setName,
      })
    );
  }, [items, filter, boxSel]);

  // 表示中カードの収納ボックスをグリッドに渡す
  const boxMap = useMemo(() => {
    const m = new Map<string, string>();
    items?.forEach((i) => i.box && m.set(i.id, i.box));
    return m;
  }, [items]);

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

      {(boxStats.boxes.length > 0 || boxStats.none > 0) && (
        <div className="box-filter">
          <button
            className={boxSel === BOX_ALL ? "chip active" : "chip"}
            onClick={() => setBoxSel(BOX_ALL)}
          >
            すべて
          </button>
          {boxStats.boxes.map(([b, c]) => (
            <button
              key={b}
              className={boxSel === b ? "chip active" : "chip"}
              onClick={() => setBoxSel(b)}
            >
              📦 {b} <span className="chip-c">{c}</span>
            </button>
          ))}
          {boxStats.none > 0 && (
            <button
              className={boxSel === BOX_NONE ? "chip active" : "chip"}
              onClick={() => setBoxSel(BOX_NONE)}
            >
              未設定 <span className="chip-c">{boxStats.none}</span>
            </button>
          )}
        </div>
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
        <div className="state">
          {filter.trim()
            ? `「${filter}」に一致する所持カードはありません。`
            : "このボックスにカードはありません。"}
        </div>
      )}

      {filtered.length > 0 && (
        <CardGrid
          cards={filtered}
          quantities={quantities}
          boxes={boxMap}
          onSelect={onSelect}
        />
      )}
    </>
  );
}
