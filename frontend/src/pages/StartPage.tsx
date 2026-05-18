import { Link } from "react-router-dom";

export function StartPage() {
  return (
    <section className="panel hero">
      <div className="hero__intro">
        <span className="section-kicker">Clean clone ready</span>
        <h2>Start from a clean clone</h2>
        <p>
          This starter focuses on the essential scaffold: create or join a room, view the lobby, and open the game
          screen placeholders.
        </p>
      </div>

      <div className="button-row">
        <Link className="button button--primary" to="/create-room">
          Create Room
        </Link>
        <Link className="button button--secondary" to="/join-room">
          Join Room
        </Link>
      </div>

      <div className="hero__grid">
        <article className="hero__card">
          <span className="card-index">01</span>
          <h2>Starter words</h2>
          <ul className="pill-list">
            <li className="pill">rocket</li>
            <li className="pill">pizza</li>
            <li className="pill">castle</li>
            <li className="pill">guitar</li>
            <li className="pill">sunflower</li>
          </ul>
        </article>

        <article className="hero__card">
          <span className="card-index">02</span>
          <h2>Flow</h2>
          <p>Start, create or join, lobby, game scaffold</p>
        </article>

        <article className="hero__card">
          <span className="card-index">03</span>
          <h2>Roles</h2>
          <p>Starter data includes drawer and guesser role labels for future gameplay work.</p>
        </article>
      </div>
    </section>
  );
}
