import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PieceSVG from './PieceSVG';

interface Stats {
  totalGames: number;
  totalMoves: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
}

export default function AboutPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-surface-alt border-b border-surface-hover">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <PieceSVG type="K" color="white" size={36} />
            <h1 className="text-xl font-bold text-text-bright tracking-tight">Makruk</h1>
          </button>
          <nav className="flex items-center gap-4 text-sm">
            <button onClick={() => navigate('/')} className="text-text-dim hover:text-text-bright transition-colors">Play</button>
            <button onClick={() => navigate('/games')} className="text-text-dim hover:text-text-bright transition-colors">Games</button>
            <span className="text-primary font-medium">About</span>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        {/* Mission */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-text-bright mb-4">About Makruk Online</h2>
          <p className="text-text text-lg leading-relaxed mb-4">
            Makruk Online is a <strong className="text-text-bright">free, open-source</strong> platform for playing
            Makruk (Thai Chess) with anyone in the world. No registration, no ads, no paywall — just pure Thai chess.
          </p>
          <p className="text-text leading-relaxed mb-4">
            Our mission is to make <strong className="text-text-bright">Makruk famous worldwide</strong>. Thai chess
            is one of the oldest board games in the world, closer to the original Indian chess (Chaturanga) than
            modern Western chess. It deserves a world-class online platform, just like chess has Lichess.
          </p>
          <p className="text-text leading-relaxed">
            Inspired by <a href="https://lichess.org" target="_blank" rel="noopener" className="text-primary hover:text-primary-light underline">Lichess</a>,
            we believe great gaming platforms should be free for everyone.
          </p>
        </section>

        {/* Stats */}
        {stats && stats.totalGames > 0 && (
          <section className="mb-10">
            <h3 className="text-xl font-bold text-text-bright mb-4">Platform Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-alt rounded-lg p-4 text-center border border-surface-hover">
                <div className="text-2xl font-bold text-primary-light">{stats.totalGames}</div>
                <div className="text-text-dim text-sm">Games Played</div>
              </div>
              <div className="bg-surface-alt rounded-lg p-4 text-center border border-surface-hover">
                <div className="text-2xl font-bold text-text-bright">{stats.totalMoves}</div>
                <div className="text-text-dim text-sm">Total Moves</div>
              </div>
              <div className="bg-surface-alt rounded-lg p-4 text-center border border-surface-hover">
                <div className="text-2xl font-bold text-text-bright">{stats.whiteWins}</div>
                <div className="text-text-dim text-sm">White Wins</div>
              </div>
              <div className="bg-surface-alt rounded-lg p-4 text-center border border-surface-hover">
                <div className="text-2xl font-bold text-text-bright">{stats.blackWins}</div>
                <div className="text-text-dim text-sm">Black Wins</div>
              </div>
            </div>
          </section>
        )}

        {/* Support */}
        <section className="mb-10">
          <h3 className="text-xl font-bold text-text-bright mb-4">Support the Project</h3>
          <div className="bg-surface-alt rounded-xl border border-surface-hover p-6">
            <p className="text-text mb-4">
              Makruk Online runs on donations and community support. If you enjoy playing, consider helping us keep the servers running:
            </p>
            <ul className="space-y-3 text-text">
              <li className="flex items-start gap-3">
                <span className="text-primary text-lg">⭐</span>
                <div>
                  <strong className="text-text-bright">Star us on GitHub</strong>
                  <span className="text-text-dim"> — helps others discover the project</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-lg">🌐</span>
                <div>
                  <strong className="text-text-bright">Share with friends</strong>
                  <span className="text-text-dim"> — the more players, the better the community</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-lg">🔧</span>
                <div>
                  <strong className="text-text-bright">Contribute code</strong>
                  <span className="text-text-dim"> — PRs are welcome! See our GitHub repo</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-lg">📝</span>
                <div>
                  <strong className="text-text-bright">Report bugs & suggest features</strong>
                  <span className="text-text-dim"> — open an issue on GitHub</span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* What is Makruk */}
        <section className="mb-10">
          <h3 className="text-xl font-bold text-text-bright mb-4">What is Makruk?</h3>
          <div className="text-text leading-relaxed space-y-3">
            <p>
              <strong className="text-text-bright">Makruk (หมากรุก)</strong> is the traditional chess of Thailand.
              It evolved from the ancient Indian game Chaturanga and has been played in Thailand for centuries.
            </p>
            <p>
              Unlike Western chess, Makruk retains many features of the original game — the queen (Met) is weak,
              the bishop (Khon) moves differently, and pawns start on the third rank. This creates a game that
              is deeply strategic and uniquely beautiful.
            </p>
            <p>
              Makruk is widely played in Thailand and Cambodia (where it's called Ouk Chatrang). It is recognized
              by the World Chess Federation and has international tournaments.
            </p>
            <p className="text-primary">
              We believe Makruk deserves the same global recognition as chess. Help us spread the word!
            </p>
          </div>
        </section>

        {/* Tech */}
        <section className="mb-10">
          <h3 className="text-xl font-bold text-text-bright mb-4">Open Source</h3>
          <p className="text-text mb-4">
            Makruk Online is 100% open source under the MIT license. The entire codebase is available on GitHub.
          </p>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Node.js', 'Socket.IO', 'Tailwind CSS', 'SQLite', 'Vite'].map(tech => (
              <span key={tech} className="bg-surface-hover text-text-dim px-3 py-1 rounded-full text-sm">{tech}</span>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-surface-alt border-t border-surface-hover py-4 text-center text-text-dim text-sm">
        Makruk Online — Free & Open Source — Made with ❤️ for Thai Chess
      </footer>
    </div>
  );
}
