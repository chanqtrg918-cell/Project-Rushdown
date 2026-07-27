import { SpaceShooter } from './components/SpaceShooter';
import { Rocket } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      {/* HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
                Space Shooter <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">2D Canvas</span>
              </h1>
              <p className="text-xs text-slate-400">Retro arcade action in HTML5 & React</p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GAME VIEW */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-6">
        <SpaceShooter />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-3 text-center text-xs text-slate-500 font-mono">
        <p>Built with React, HTML5 Canvas & Web Audio API</p>
      </footer>
    </div>
  );
}
