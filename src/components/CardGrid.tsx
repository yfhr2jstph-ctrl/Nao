import { buildImageUrl } from "../api/tcgdex";

export interface DisplayCard {
  id: string;
  name: string;
  localId: string;
  image?: string;
  setName?: string;
}

interface Props {
  cards: DisplayCard[];
  /** カードID → 所持枚数（バッジ表示用） */
  quantities: Map<string, number>;
  onSelect: (card: DisplayCard) => void;
}

export default function CardGrid({ cards, quantities, onSelect }: Props) {
  return (
    <div className="grid">
      {cards.map((card) => {
        const qty = quantities.get(card.id) ?? 0;
        const thumb = buildImageUrl(card.image, "low", "webp");
        return (
          <div className="card" key={card.id} onClick={() => onSelect(card)}>
            {qty > 0 && <div className="qty-badge">{qty}</div>}
            <div className="imgwrap">
              {thumb ? (
                <img src={thumb} alt={card.name} loading="lazy" />
              ) : (
                <div className="noimg">画像なし</div>
              )}
            </div>
            <div className="meta">
              <div className="name">{card.name}</div>
              <div className="sub">
                {card.setName ? `${card.setName} ` : ""}
                {card.localId ? `#${card.localId}` : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
