@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

:root {
  --bg-color: #f0f4f8;
  --panel-bg: #ffffff;
  --border-color: #cbd5e1;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --neon-cyan: #0284c7;
  --neon-purple: #9333ea;
  --glow-cyan: rgba(2, 132, 199, 0.3);
  --glow-purple: rgba(147, 51, 234, 0.3);
  --btn-text: #ffffff;
}

.dark {
  --bg-color: #050505;
  --panel-bg: #111111;
  --border-color: #222222;
  --text-main: #e2e8f0;
  --text-muted: #9ca3af;
  --neon-cyan: #00f3ff;
  --neon-purple: #bc13fe;
  --glow-cyan: rgba(0, 243, 255, 0.5);
  --glow-purple: rgba(188, 19, 254, 0.5);
  --btn-text: #000000;
}

body {
  background-color: var(--bg-color);
  color: var(--text-main);
  font-family: var(--font-sans);
  overflow-x: hidden;
  transition: background-color 0.3s, color 0.3s;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg-color);
}
::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--neon-cyan);
}

.glow-text-cyan {
  text-shadow: 0 0 10px var(--glow-cyan);
  color: var(--neon-cyan);
}
.glow-text-purple {
  text-shadow: 0 0 10px var(--glow-purple);
  color: var(--neon-purple);
}
.glow-border-cyan {
  box-shadow: 0 0 15px var(--glow-cyan);
  border-color: var(--neon-cyan);
}
.glow-border-purple {
  box-shadow: 0 0 15px var(--glow-purple);
  border-color: var(--neon-purple);
}
