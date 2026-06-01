import { useState } from "react";

interface GuessFormProps {
  onSubmit?: (guess: string) => Promise<boolean | null>;
  disabled?: boolean;
}

export function GuessForm({ onSubmit, disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSubmit || submitting) return;

    const trimmed = guessText.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setResult(null);

    try {
      const correct = await onSubmit(trimmed);
      if (correct === true) {
        setResult("correct");
      } else if (correct === false) {
        setResult("wrong");
        setGuessText("");
      }
    } catch {
      setResult("wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const isCorrect = result === "correct";

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={disabled || isCorrect || submitting}
        />
      </label>
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || isCorrect || submitting}>
          {submitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
      {result === "correct" && (
        <p style={{ color: "#16a34a", fontWeight: 600, marginTop: "8px" }}>Correct!</p>
      )}
      {result === "wrong" && (
        <p style={{ color: "#dc2626", fontWeight: 500, marginTop: "8px" }}>Wrong</p>
      )}
    </form>
  );
}
