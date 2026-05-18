import type { PropsWithChildren } from "react";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <p className="app-shell__eyebrow">Multiplayer Game</p>
          <p className="app-shell__title">Scribble</p>
          <p className="app-shell__lede">
            A real-time multiplayer drawing and guessing game.
          </p>
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
