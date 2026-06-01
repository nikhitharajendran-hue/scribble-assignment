import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import type { StrokeData } from "../components/Canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    roomStore.startPolling();

    return () => {
      roomStore.stopPolling();
    };
  }, [navigate, room, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = participantId !== null && participantId === room.currentDrawerId;

  const handleStrokesChange = useCallback(
    (strokes: StrokeData[]) => {
      roomStore.submitCanvas(strokes);
    },
    [roomStore]
  );

  const handleClear = useCallback(() => {
    roomStore.submitCanvas([]);
  }, [roomStore]);

  const handleGuess = useCallback(
    async (guess: string) => {
      return await roomStore.submitGuess(guess);
    },
    [roomStore]
  );

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.currentRound}</span>
          <h1 className="game-page__title">
            {isDrawer ? "Draw the word!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} currentDrawerId={room.currentDrawerId} />
          <ResultPanel guessHistory={room.guessHistory} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <Canvas
              strokes={room.canvasData}
              readOnly={!isDrawer}
              onStrokesChange={isDrawer ? handleStrokesChange : undefined}
              onClear={isDrawer ? handleClear : undefined}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{isDrawer ? "Drawing" : "Guessing"}</dd>
              </div>
            </dl>
          </Card>

          {isDrawer ? (
            <Card title="Your Word">
              <p style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center" }}>
                {room.currentWord ?? "—"}
              </p>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", textAlign: "center" }}>
                You are the drawer. Draw this word!
              </p>
            </Card>
          ) : (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuess} />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
