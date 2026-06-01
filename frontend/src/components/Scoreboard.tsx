import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  currentDrawerId: string | null;
}

export function Scoreboard({ participants, currentDrawerId }: ScoreboardProps) {
  const sorted = [...participants].sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card title="Scoreboard">
      {sorted.length === 0 ? (
        <p className="placeholder-block" style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          Waiting for players...
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sorted.map((p) => (
            <li
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid #f3f4f6",
                fontWeight: p.id === currentDrawerId ? 700 : 400
              }}
            >
              <span>
                {p.name}
                {p.id === currentDrawerId ? (
                  <span style={{ fontSize: "0.75rem", color: "#6b7280", marginLeft: "4px" }}>
                    (drawing)
                  </span>
                ) : null}
              </span>
              <strong>{p.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
