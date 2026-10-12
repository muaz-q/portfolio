import { useEffect, useRef, useState } from "react";

const ROOMS = [
  "All While I Was Burning Myself Away",
  "The Loneliest Crowd",
  "The Collector of Failures",
  "The Flower That Forgot",
  "The Mirror That Knows Me",
  "Agony With No Address",
  "The Behavioral Sink",
  "My Beloved Four Legs",
  "Reflection",
  "A Closing Window",
];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const PROJECTS = [
  {
    name: "AgentGuard",
    what: "A static analyser for the code patterns that make LLM agents expensive.",
    terminal: true,
    body:
      "It reads Python without running it, follows calls across functions and files, and flags loops with no " +
      "iteration cap, conversation history that is re-sent on every turn, and calls with no output limit. " +
      "I checked every finding by hand on 22 open-source agent projects, keeping 8 of them back until the rules " +
      "were frozen. It ships on PyPI with a GitHub Action, a pre-commit hook and an MCP server for coding agents.",
    specs: [
      ["92%", "precision on 8 held-out projects, every finding checked by hand"],
      ["11%", "token prediction error at 40 turns; the naive estimate was 99% low"],
      ["1.9M", "lines of open-source agent code analysed"],
      ["136", "automated tests, CI on Linux, Windows and macOS"],
    ],
    links: [
      ["GitHub", "https://github.com/muaz-q/AgentGuard"],
      ["pip install agentguard-lint", "https://pypi.org/project/agentguard-lint/"],
      ["How it was measured", "https://github.com/muaz-q/AgentGuard/blob/main/docs/benchmarks.md"],
    ],
  },
  {
    name: "Job Radar",
    what: "Hourly internship alerts from company careers sites, Unstop and Wellfound.",
    body:
      "It polls 29 careers sites (Workday, Greenhouse, Lever, Ashby, Amazon, Microsoft) plus Unstop and Wellfound, " +
      "normalises every listing and sends a Telegram alert for each new matching role. Listings are deduplicated " +
      "on three levels, and state is saved before alerts go out, so a failed run can neither lose nor repeat a job.",
    specs: [
      ["29", "company careers sites checked every hour"],
      ["5.6×", "faster scans with per-host rate-limited fetching (288 s to 51 s)"],
      ["233", "tests run in CI against recorded real API responses"],
    ],
    links: [["GitHub", "https://github.com/muaz-q/job-radar"]],
  },
  {
    name: "Sally",
    what: "A Spotify wallpaper engine that lives in the Windows system tray.",
    body:
      "Sally rebuilds the desktop wallpaper from the album art of whatever is playing and puts your own wallpaper " +
      "back when it exits. Each Spotify API check is timed to the end of the current track, so a new song shows " +
      "up within about a second without running into rate limits.",
    specs: [
      ["~1 s", "from a song change to the new wallpaper"],
      ["24/7", "runs from the tray and starts with Windows"],
    ],
    links: [["GitHub", "https://github.com/muaz-q/Sally"]],
  },
  {
    name: "NeuraBar",
    what: "A keyboard-driven command bar for the desktop.",
    body:
      "One global hotkey opens a bar that turns free-text commands into system and browser actions. Tesseract OCR " +
      "reads text from the screen, so commands can act on whatever you are looking at.",
    links: [["GitHub", "https://github.com/muaz-q/NeuraBar"]],
  },
];

// Real output of `agentguard examples/research_agent.py --plain` (fix lines trimmed).
const FINDINGS = [
  ["31:17", "AG001", "high", "LLM call (anthropic.messages) inside `while` loop (line 28) with no iteration cap"],
  ["31:17", "AG002", "high", "LLM call (anthropic.messages) re-sends a history that grows every iteration; input tokens grow quadratically"],
  ["47:13", "AG003", "medium", "call to `summarise` inside 2 nested loops (lines 45, 46); calls multiply"],
];

function Terminal() {
  return (
    <figure className="terminal">
      <figcaption className="terminal-bar">$ agentguard examples/research_agent.py --plain</figcaption>
      <pre>
        {FINDINGS.map(([loc, rule, sev, msg]) => (
          <span key={rule}>
            <span className="loc">research_agent.py:{loc}:</span> <span className={`sev-${sev}`}>{rule} [{sev}]</span> {msg}
            {"\n"}
          </span>
        ))}
      </pre>
    </figure>
  );
}

const NOTES = { 1: "that's mauie", 3: "mauie does not like being caught" };

function Mauie() {
  const [hops, setHops] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [note, setNote] = useState("");
  const still = useRef(false);
  const timer = useRef(null);

  useEffect(() => {
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => clearTimeout(timer.current);
  }, []);

  const say = (text, ms = 1600) => {
    setNote(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(""), ms);
  };

  const hop = () => {
    if (still.current) return say("hi, i'm mauie");
    const n = hops + 1;
    if (n > 4) {
      setPos({ x: 0, y: 0 });
      setHops(0);
      return say("ok, ok. back home");
    }
    const r = 28 + n * 22;
    const angle = Math.PI * (0.55 + Math.random() * 0.9); // mostly up and to the left
    setPos({ x: Math.cos(angle) * r, y: -Math.abs(Math.sin(angle) * r * 0.6) });
    setHops(n);
    if (NOTES[n]) say(NOTES[n]);
  };

  return (
    <span className="mauie-home" aria-hidden="true">
      <span className="mauie-body" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
        <button type="button" tabIndex={-1} className="mauie" onPointerEnter={hop} onClick={hop} />
        {note && <span className="mauie-note">{note}</span>}
      </span>
    </span>
  );
}

function Project({ p }) {
  return (
    <article className="entry">
      <div className="entry-head">
        <h3>{p.name}</h3>
      </div>
      <p className="what">{p.what}</p>
      {p.terminal && <Terminal />}
      <p>{p.body}</p>
      {p.specs && (
        <dl className="specs">
          {p.specs.map(([value, label]) => (
            <div className="spec" key={value}>
              <dt>{value}</dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="links">
        {p.links.map(([label, href]) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer">
            {label} ↗
          </a>
        ))}
      </div>
    </article>
  );
}

export default function App() {
  return (
    <main className="page">
      <header className="masthead">
        <p className="kicker">Computer Science (AI &amp; ML) · PES University, Bangalore · Class of 2028</p>
        <h1 className="name">
          Muaz Iqubal
          <Mauie />
        </h1>
        <p className="thesis">
          I build developer tools in Python and measure whether they work. I also write <em>essays</em> about
          purpose, failure and loss.
        </p>
        <ul className="contact">
          <li className="status">Looking for a Summer 2027 software engineering internship</li>
          <li>
            <a href="mailto:muaz51ip@gmail.com">muaz51ip@gmail.com</a>
          </li>
          <li>
            <a href="https://github.com/muaz-q" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          </li>
          <li>
            <a href="https://www.linkedin.com/in/muaziqubal" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
          </li>
          <li>
            <a href="/muaz-iqubal-resume.pdf" target="_blank" rel="noopener">Résumé (PDF)</a>
          </li>
        </ul>
      </header>

      <section className="section" aria-labelledby="work">
        <h2 className="section-label" id="work">Work</h2>
        <div className="section-body">
          {PROJECTS.map((p) => (
            <Project key={p.name} p={p} />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="writing">
        <h2 className="section-label" id="writing">Writing</h2>
        <div className="section-body">
          <article className="book">
            <div>
              <h3>Living or Existing?</h3>
              <p className="sub">Ten essays · 30 pages · 2026</p>
              <p>
                “This book is not an answer. It is a collection of rooms I have stood inside while trying to
                understand the difference.”
              </p>
              <p>
                Personal essays on purpose, loneliness, failure, memory and loss, written at different times and, as
                it turned out, in conversation with one another.
              </p>
              <div className="links">
                <a className="button" href="/living-or-existing.pdf" target="_blank" rel="noopener">
                  Read it (PDF) ↗
                </a>
                <a href="https://medium.com/@mwahz" target="_blank" rel="noopener noreferrer" style={{ alignSelf: "center" }}>
                  More essays on Medium ↗
                </a>
              </div>
            </div>
            <ol className="rooms" aria-label="Contents">
              {ROOMS.map((title, i) => (
                <li key={title}>
                  <span>{NUMERALS[i]}</span>
                  {title}
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className="section" aria-labelledby="experience">
        <h2 className="section-label" id="experience">Experience</h2>
        <div className="section-body">
          <article className="role">
            <h3>Outreach &amp; Marketing Intern, KaizenDev</h3>
            <p className="when">10+ months</p>
            <p>
              Ran outreach campaigns in developer communities and turned technical product detail into messaging
              developers would actually read.
            </p>
          </article>
        </div>
      </section>

      <footer className="colophon">
        <p>© 2026 Muaz Iqubal</p>
        <p>Set in IBM Plex. The blue dot is mauie.</p>
      </footer>
    </main>
  );
}
