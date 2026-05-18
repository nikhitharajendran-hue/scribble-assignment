import type { PropsWithChildren } from "react";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <p className="app-shell__eyebrow">Starter Project</p>
          <h1>Room Sketch</h1>
          <p className="app-shell__lede">
            A clean TypeScript starter for room flow, lobby setup, and placeholder game areas.
          </p>
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
      <footer className="app-shell__footer">Frontend: Vite + React + TypeScript | Backend: Node + Express</footer>
    </div>
  );
}
