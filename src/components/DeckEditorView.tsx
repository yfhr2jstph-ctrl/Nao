import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/collection";
import { renameDeck, deleteDeck, adjustDeckCard } from "../db/decks";
import { buildImageUrl } from "../api/tcgdex";
import {
  validateDeck,
  computeShortfalls,
  DECK_SIZE,
  MAX_COPIES,
} from "../deck/validate";
import type { DeckCard } from "../types";
import type { DisplayCard } from "./CardGrid";

interface Props {
  deckId: string;
  ownedMap: Map<string, number>;
  onBack: () => void;
  onAddCard: () => void;
  onSelectCard: (card: DisplayCard) => void;
}

export default function DeckEditorView({
  deckId,
  ownedMap,
  onBack,
  onAddCard,
  onSelectCard,
}: Props) {
  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId]);
  if (!deck) return null;

  const v = validateDeck(deck);
  const { shortfalls, totalShort, buildable } = computeShortfalls(
    deck,
    ownedMap
  );

  const onDelete = async () => {
    if (confirm(`「${deck.name}」を削除しますか？`)) {
      await deleteDeck(deckId);
      onBack();
    }
  };

  const toDisplay = (c: DeckCard): DisplayCard => ({
    id: c.id,
    name: c.name,
    localId: c.localId,
    image: c.image,
    setName: c.setName,
  });

  return (
    <>
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          ‹ デッキ一覧
        </button>
        <input
          className="deck-name-input"
          value={deck.name}
          onChange={(e) => renameDeck(deckId, e.target.value)}
          aria-label="デッキ名"
        />
      </div>

      <p className="summary">
        合計 <b>{v.total}/{DECK_SIZE}</b> 枚
        {" ・ "}
        {buildable ? (
          <span style={{ color: "#5fd99a" }}>手持ちで組める</span>
        ) : (
          <span style={{ color: "var(--danger)" }}>{totalShort}枚 不足</span>
        )}
      </p>

      {/* 公式ルールのチェックリスト */}
      <ul className="checklist">
        <li className={v.sizeOk ? "ok" : "bad"}>
          <span className="mark">{v.sizeOk ? "✓" : "✕"}</span>
          ちょうど{DECK_SIZE}枚（現在 {v.total}枚）
        </li>
        <li className={v.copiesOk ? "ok" : "bad"}>
          <span className="mark">{v.copiesOk ? "✓" : "✕"}</span>
          同名カードは{MAX_COPIES}枚まで
          {!v.copiesOk &&
            `（超過: ${v.copyViolations
              .map((c) => `${c.name}×${c.count}`)
              .join("、")}）`}
        </li>
        {v.basicPokemonUncertain ? (
          <li className="warn">
            <span className="mark">？</span>
            たねポケモンの判定不可（カード情報待ち）
          </li>
        ) : (
          <li className={v.hasBasicPokemon ? "ok" : "bad"}>
            <span className="mark">{v.hasBasicPokemon ? "✓" : "✕"}</span>
            たねポケモンを1体以上含む
          </li>
        )}
      </ul>

      <div className="deck-actions">
        <button className="btn" onClick={onAddCard}>
          ＋ カードを追加（検索）
        </button>
      </div>

      {deck.cards.length === 0 && (
        <div className="state">
          カードが入っていません。
          <br />
          「カードを追加」から検索して入れましょう。
        </div>
      )}

      {/* 採用カード一覧（所持と照合） */}
      {deck.cards.map((c) => {
        const owned = ownedMap.get(c.id) ?? 0;
        const short = Math.max(0, c.count - owned);
        const thumb = buildImageUrl(c.image, "low", "webp");
        return (
          <div className="deck-card-row" key={c.id}>
            {thumb ? (
              <img
                className="thumb"
                src={thumb}
                alt={c.name}
                onClick={() => onSelectCard(toDisplay(c))}
              />
            ) : (
              <div className="thumb" onClick={() => onSelectCard(toDisplay(c))} />
            )}
            <div className="info" onClick={() => onSelectCard(toDisplay(c))}>
              <div className="cn">{c.name}</div>
              <div className={short > 0 ? "own short" : "own"}>
                所持 {owned} / 必要 {c.count}
                {short > 0 && ` ・ ${short}枚不足`}
              </div>
            </div>
            <div className="mini-stepper">
              <button
                onClick={() => adjustDeckCard(deckId, c, -1)}
                aria-label="減らす"
              >
                −
              </button>
              <span className="c">{c.count}</span>
              <button
                className="plus"
                onClick={() => adjustDeckCard(deckId, c, 1)}
                aria-label="増やす"
              >
                +
              </button>
            </div>
          </div>
        );
      })}

      {shortfalls.length > 0 && (
        <div className="deck-actions">
          <p className="summary" style={{ padding: 0 }}>
            買い足しが必要なカード: <b>{shortfalls.length}</b> 種 / 合計{" "}
            <b>{totalShort}</b> 枚
          </p>
        </div>
      )}

      <div className="deck-actions">
        <button className="btn ghost" onClick={onDelete}>
          このデッキを削除
        </button>
      </div>
    </>
  );
}
