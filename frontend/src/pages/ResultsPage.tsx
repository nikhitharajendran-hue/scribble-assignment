import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultsPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  const isHost =
    room !== null &&
    participantId !== null &&
    room.participants.some((p) => p.id === participantId && p.role === "host");

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }

    if (room.status === "in-progress") {
      navigate("/game", { replace: true });
      return;
    }

    roomStore.startPolling();

    return () => {
      roomStore.stopPolling();
    };
  }, [navigate, room, roomStore]);

  const handlePlayAgain = useCallback(async () => {
    if (!isHost) return;
    try {
      await roomStore.restartGame();
      navigate("/lobby", { replace: true });
    } catch {
      // error handled in roomStore state
    }
  }, [isHost, navigate, roomStore]);

  if (!room) {
    return null;
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker={`Round ${room.currentRound}`}
          title="Round Over!"
          description={`The word was: ${room.currentWord ?? "—"}`}
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Scoreboard participants={room.participants} currentDrawerId={room.currentDrawerId} />
        <ResultPanel guessHistory={room.guessHistory} />
      </div>

      <div className="button-row button-row--spread">
        <span />
        <button
          className="button button--primary"
          disabled={!isHost}
          title={isHost ? "Start a new round" : "Waiting for host to restart"}
          onClick={handlePlayAgain}
        >
          Play Again
        </button>
      </div>
    </section>
  );
}
