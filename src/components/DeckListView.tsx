import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/collection";
import { createDeck } from "../db/decks";
import { validateDeck, computeShortfalls, DECK_SIZE } from "../deck/validate";

interface Props {
  ownedMap: Map<string, number>;
  onOpen: (deckId: string) => void;
}

export default function DeckListView({ ownedMap, onOpen }: Props) {
  const decks = useLiveQuery(
    () => db.decks.orderBy("updatedAt").reverse().toArray(),
    []
  );

  const onCreate = async () => {
    const id = await createDeck("新しいデッキ");
    onOpen(id);
  };

  return (
    <>
      <div className="topbar">
        <h1>デッキ</h1>
      </div>

      <div className="deck-actions">
        <button className="btn" onClick={onCreate}>
          ＋ 新しいデッキを作る
        </button>
      </div>

      {decks && decks.length === 0 && (
        <div className="state">
          <div className="big">🛠️</div>
          まだデッキがありません。
          <br />
          上のボタンから作成しましょう。
        </div>
      )}

      <div className="deck-list">
        {decks?.map((deck) => {
          const v = validateDeck(deck);
          const { totalShort, buildable } = computeShortfalls(deck, ownedMap);
          return (
            <div className="deck-row" key={deck.id} onClick={() => onOpen(deck.id)}>
              <div>
                <div className="dname">{deck.name}</div>
                <div className="dmeta">
                  {v.total}/{DECK_SIZE} 枚
                  {" ・ "}
                  {buildable
                    ? "手持ちで組める"
                    : `${totalShort}枚 不足`}
                </div>
              </div>
              {v.legal ? (
                <span className="pill ok">構築OK</span>
              ) : (
                <span className="pill warn">調整中</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
