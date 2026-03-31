// src/components/Hand.jsx

export default function Hand({ hand, onAction }) {
  return (
    <div className="hand">
      {/* Header */}
      <div className="hand-header">
        Hand {hand.hand_index}
        {hand.busted && " — BUST"}
        {hand.stayed && " — STAY"}
      </div>

      {/* Cards */}
      <div className="cards">
        {hand.cards.map((card, i) => (
          <img
            key={i}
            className="card-image"
            src={`/images/cards/${card.image_key}.png`}
            alt={`${card.rank} of ${card.suit}`}
          />
        ))}
      </div>

      {/* Actions */}
      {!hand.resolved && (
        <div className="actions">
          <button onClick={() => onAction(hand.hand_index, "hit")}>Hit</button>
          <button onClick={() => onAction(hand.hand_index, "stay")}>
            Stay
          </button>
          <button onClick={() => onAction(hand.hand_index, "double")}>
            Double
          </button>
          <button onClick={() => onAction(hand.hand_index, "split")}>
            Split
          </button>
        </div>
      )}
    </div>
  );
}
