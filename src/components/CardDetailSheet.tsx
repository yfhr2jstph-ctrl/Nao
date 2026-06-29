import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { buildImageUrl, getCard } from "../api/tcgdex";
import { db, adjustQuantity, removeItem } from "../db/collection";
import type { CardFull } from "../types";
import type { DisplayCard } from "./CardGrid";

interface Props {
  card: DisplayCard;
  onClose: () => void;
}

export default function CardDetailSheet({ card, onClose }: Props) {
  const [full, setFull] = useState<CardFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  const owned = useLiveQuery(() => db.items.get(card.id), [card.id]);
  const qty = owned?.quantity ?? 0;

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

        <div className="stepper" style={{ justifyContent: "center" }}>
          <button onClick={() => onAdjust(-1)} disabled={qty === 0} aria-label="減らす">
            −
          </button>
          <span className="count">{qty}</span>
          <button className="plus" onClick={() => onAdjust(1)} aria-label="増やす">
            +
          </button>
        </div>

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
