import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
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

  async function handleStartGame() {
    try {
      await roomStore.startGame();
    } catch {
      // error is set in roomStore state
    }
  }

  if (!room) {
    return null;
  }

  const snapshot = roomStore.getSnapshot();
  const participantId = snapshot.participantId;
  const isHost = room.participants.some(
    (p) => p.id === participantId && p.role === "host"
  );
  const isDrawer = participantId !== null && participantId === room.currentDrawerId;
  const isInProgress = room.status === "in-progress";

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker={isInProgress ? "Game in progress" : "Waiting for players"}
          title={isInProgress ? "Round 1" : "Lobby"}
          description={
            isInProgress
              ? "The game has started. Draw the word for others to guess!"
              : "Share the room code with friends so they can join your game."
          }
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>
                    {participant.name}
                    {participant.role === "host" ? (
                      <span className="player-list__badge"> (host)</span>
                    ) : null}
                    {participant.gameRole === "drawer" ? (
                      <span className="player-list__badge"> (drawing)</span>
                    ) : null}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={isInProgress ? "Drawer" : "Status"}>
          {isInProgress ? (
            <>
              <p className="status-line" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                {room.participants.find((p) => p.id === room.currentDrawerId)?.name ?? "Unknown"} is drawing
              </p>
              {isDrawer && room.currentWord ? (
                <p style={{ marginTop: '12px', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center' }}>
                  Your word: {room.currentWord}
                </p>
              ) : (
                <p style={{ marginTop: '8px' }}>Guess the word as the drawing unfolds!</p>
              )}
            </>
          ) : (
            <>
              <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
                {isLoading ? "Refreshing players..." : "Ready to play"}
              </p>
              <p style={{ marginTop: '8px' }}>{error ?? "Waiting for the host to start the game."}</p>
            </>
          )}
        </Card>
      </div>

      {!isInProgress ? (
        <div className="button-row button-row--spread">
          <span />
          <button
            className="button button--primary"
            disabled={!isHost || isLoading}
            title={isHost ? "Start the game" : "Waiting for host to start"}
            onClick={handleStartGame}
          >
            Start Game
          </button>
        </div>
      ) : null}
    </section>
  );
}
