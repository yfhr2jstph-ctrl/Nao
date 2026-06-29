import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { buildImageUrl, getCard } from "../api/tcgdex";
import { db, adjustQuantity, removeItem, setItemBox } from "../db/collection";
import { adjustDeckCard } from "../db/decks";
import type { CardFull } from "../types";
import type { DisplayCard } from "./CardGrid";

interface Props {
  card: DisplayCard;
  onClose: () => void;
  /** 編集中のデッキ。指定時はデッキへの増減UIも表示する。 */
  activeDeck?: { id: string; name: string } | null;
}

export default function CardDetailSheet({ card, onClose, activeDeck }: Props) {
  const [full, setFull] = useState<CardFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  const owned = useLiveQuery(() => db.items.get(card.id), [card.id]);
  const qty = owned?.quantity ?? 0;

  // 既存のボックス名を候補（datalist）として集める
  const allItems = useLiveQuery(() => db.items.toArray(), []);
  const boxOptions = useMemo(() => {
    const s = new Set<string>();
    allItems?.forEach((i) => i.box && s.add(i.box));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "ja"));
  }, [allItems]);

  // 収納ボックス入力。カードを開いた時／DBの値が読めた時に一度だけ同期する
  const [boxInput, setBoxInput] = useState("");
  const syncedFor = useRef<string | null>(null);
  useEffect(() => {
    if (owned !== undefined && syncedFor.current !== card.id) {
      setBoxInput(owned?.box ?? "");
      syncedFor.current = card.id;
    }
  }, [owned, card.id]);
  const saveBox = () => {
    if (qty > 0) setItemBox(card.id, boxInput);
  };

  const deck = useLiveQuery(
    () => (activeDeck ? db.decks.get(activeDeck.id) : undefined),
    [activeDeck?.id]
  );
  const deckCount = deck?.cards.find((c) => c.id === card.id)?.count ?? 0;

  useEffect(() => {
    const ctrl = new AbortController();
    setFull(null);
    setError(null);
    getCard(card.id, ctrl.signal)
      .then(setFull)
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) {
          setError(e instanceof Error ? e.message : "取得に失敗しました");
        }
      });
    return () => ctrl.abort();
  }, [card.id]);

  const setName = full?.set?.name ?? card.setName ?? "";
  const detailImg = buildImageUrl(full?.image ?? card.image, "high", "webp");

  const onAdjust = (delta: number) =>
    adjustQuantity(
      {
        id: card.id,
        name: full?.name ?? card.name,
        localId: full?.localId ?? card.localId,
        setName,
        image: full?.image ?? card.image,
        rarity: full?.rarity,
      },
      delta
    );

  const onAdjustDeck = (delta: number) => {
    if (!activeDeck) return;
    return adjustDeckCard(
      activeDeck.id,
      {
        id: card.id,
        name: full?.name ?? card.name,
        localId: full?.localId ?? card.localId,
        setName,
        image: full?.image ?? card.image,
        rarity: full?.rarity,
        category: full?.category,
        stage: full?.stage,
      },
      delta
    );
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        {detailImg ? (
          <img className="detail-img" src={detailImg} alt={card.name} />
        ) : null}
        <h2>{full?.name ?? card.name}</h2>

        {error && <p className="state error">{error}</p>}

        <ul className="specs">
          <li>
            <span>セット</span>
            <span>{setName || "—"}</span>
          </li>
          <li>
            <span>番号</span>
            <span>{full?.localId ?? card.localId}</span>
          </li>
          <li>
            <span>レアリティ</span>
            <span>{full?.rarity ?? "—"}</span>
          </li>
          {full?.hp != null && (
            <li>
              <span>HP</span>
              <span>{full.hp}</span>
            </li>
          )}
          {full?.types?.length ? (
            <li>
              <span>タイプ</span>
              <span>{full.types.join(" / ")}</span>
            </li>
          ) : null}
          {full?.illustrator && (
            <li>
              <span>イラストレーター</span>
              <span>{full.illustrator}</span>
            </li>
          )}
        </ul>

        <div className="stepper-block">
          <span className="stepper-label">所持枚数</span>
          <div className="stepper">
            <button onClick={() => onAdjust(-1)} disabled={qty === 0} aria-label="減らす">
              −
            </button>
            <span className="count">{qty}</span>
            <button className="plus" onClick={() => onAdjust(1)} aria-label="増やす">
              +
            </button>
          </div>
        </div>

        {qty > 0 && (
          <div className="box-row">
            <label className="stepper-label" htmlFor="box-input">
              収納ボックス
            </label>
            <input
              id="box-input"
              className="box-input"
              list="box-options"
              placeholder="未設定（例：ボックスA）"
              value={boxInput}
              maxLength={40}
              onChange={(e) => setBoxInput(e.target.value)}
              onBlur={saveBox}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
            <datalist id="box-options">
              {boxOptions.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
        )}

        {activeDeck && (
          <div className="stepper-block">
            <span className="stepper-label">「{activeDeck.name}」に入れる</span>
            <div className="stepper">
              <button
                onClick={() => onAdjustDeck(-1)}
                disabled={deckCount === 0}
                aria-label="デッキから減らす"
              >
                −
              </button>
              <span className="count">{deckCount}</span>
              <button className="plus" onClick={() => onAdjustDeck(1)} aria-label="デッキに増やす">
                +
              </button>
            </div>
          </div>
        )}

        {qty > 0 && (
          <div className="sheet-actions">
            <button className="btn ghost" onClick={() => removeItem(card.id)}>
              コレクションから削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
