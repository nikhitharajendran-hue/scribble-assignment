import { Card } from "./Card";
import type { GuessEntry } from "../services/api";

interface ResultPanelProps {
  guessHistory: GuessEntry[];
}

export function ResultPanel({ guessHistory }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guessHistory.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          Game activity and guesses will appear here.
        </p>
      ) : (
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}
        >
          {guessHistory.map((entry, i) => (
            <div
              key={i}
              style={{
                fontSize: "0.875rem",
                padding: "4px 0",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <span>
                <strong>{entry.participantName}</strong>: {entry.guess}
              </span>
              {entry.correct ? (
                <span style={{ color: "#16a34a", fontWeight: 600 }}>✅</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
