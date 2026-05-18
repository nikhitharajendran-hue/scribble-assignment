import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;

  return (
    <section className="panel placeholder-page">
      <div className="page-heading">
        <span className="section-kicker">Room {room.code}</span>
        <h1>Game Scaffold</h1>
        <p>This screen shows the placeholder canvas, guess input, scoreboard, and result areas.</p>
      </div>

      <div className="summary-grid">
        <article className="hero__card">
          <h2>Canvas</h2>
          <div className="canvas-placeholder">Drawing canvas placeholder</div>
          <p>The canvas region is intentionally non-interactive in this starter.</p>
        </article>

        <article className="hero__card">
          <h2>Session</h2>
          <dl className="detail-list">
            <div>
              <dt>Viewer</dt>
              <dd>{viewer?.name ?? "Unknown player"}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>{room.roles.join(", ")}</dd>
            </div>
            <div>
              <dt>Words</dt>
              <dd>{room.availableWords.join(", ")}</dd>
            </div>
          </dl>
        </article>

        <Scoreboard />
        <ResultPanel />
      </div>

      <div className="summary-grid">
        <article className="hero__card">
          <h2>Guess Input</h2>
          <p>This input is a placeholder and does not submit gameplay guesses.</p>
          <GuessForm />
          <div className="button-row">
            <button className="button button--secondary" onClick={() => navigate("/lobby")}>
              Back to Lobby
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
