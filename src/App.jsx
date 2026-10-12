import { useEffect, useRef, useState } from "react";

const ROOMS = [
  "Bound by the Curse to Constantly Change",
  "Life’s Cruelest Joke and the Illusion of Free Will",
  "All While I Was Burning Myself Away",
  "I’ve Collected Failures Like a Collector Collects His Debts",
  "The Mirror That Knows Me",
  "My Beloved 4 Legs",
  "Reflection",
  "A Closing Window",
  "Human Behaviour Is Fleeting",
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

const COMMAND = "agentguard examples/research_agent.py";

// The real report AgentGuard 0.3.1 prints for its demo agent (examples/research_agent.py),
// condensed to the lines that matter. Each finding's fix is the tool's own text.
const OUTPUT = [
  { kind: "out", cls: "dim", text: "examples/research_agent.py" },
  { kind: "out", text: "Call sites: 3  ·  Loops: 3  ·  Risk: ", warn: "⚠ CRITICAL" },
  {
    kind: "finding", sev: "high", rule: "AG001", line: 31,
    msg: "LLM call (anthropic.messages) inside `while` loop (line 28) with no iteration cap",
    fix: "Bound the loop with a step counter (e.g. `for step in range(MAX_STEPS)`) or an explicit `if step >= MAX_STEPS: break`.",
  },
  {
    kind: "finding", sev: "high", rule: "AG002", line: 31,
    msg: "LLM call (anthropic.messages) re-sends a history that grows every iteration; input tokens grow quadratically",
    fix: "Keep a sliding window (`messages[-k:]`), summarise old turns, or use server-side compaction/context editing where the provider offers it.",
  },
  {
    kind: "finding", sev: "medium", rule: "AG007", line: 31,
    msg: "~2,260-token static prompt re-sent each iteration with no `cache_control`",
    fix: "Mark the static prefix with `cache_control` - cached reads bill at about 10% of the input price.",
  },
  {
    kind: "finding", sev: "medium", rule: "AG003", line: 47,
    msg: "call to `summarise` inside 2 nested loops (lines 45, 46); calls multiply",
    fix: "Flatten the work into one batch, or cap the inner loop.",
  },
  {
    kind: "finding", sev: "low", rule: "AG006", line: 21,
    msg: "LLM call (openai.chat) sets no output-token cap",
    fix: "Pass `max_tokens` / `max_completion_tokens` / `max_output_tokens`.",
  },
  { kind: "out", cls: "dim gap", text: "Cost per run, by loop depth N:" },
  { kind: "out", text: "  N=1     $0.0082 → $0.02" },
  { kind: "out", text: "  N=10    $0.21 → $0.49" },
  { kind: "out", text: "  N=100   $14.88 → $36.40  ", warn: "⚠ over $10 per run" },
  { kind: "out", cls: "gap", text: "5 finding(s), 2 high, in 1 file(s)" },
];

const SEV_ICON = { high: "⚠", medium: "⚡", low: "•" };
const TYPE_MS = 38;
const LINE_MS = 170;

const TYPE_START = 350;
const OUTPUT_START = TYPE_START + COMMAND.length * TYPE_MS + 450;
const RUN_MS = OUTPUT_START + (OUTPUT.length + 1) * LINE_MS;

const clamp = (v, max) => Math.max(0, Math.min(max, Math.floor(v)));

function Terminal() {
  const ref = useRef(null);
  // Everything shown is derived from one clock: how long ago this run started.
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(0);
  const [open, setOpen] = useState({});
  const [still] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
  );

  // Start the first run when the terminal scrolls into view.
  useEffect(() => {
    if (still || !ref.current) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const t = performance.now();
          setNow(t);
          setStartedAt(t);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [still]);

  // Advance the clock until the run has finished.
  useEffect(() => {
    if (startedAt === null) return undefined;
    const id = setInterval(() => {
      const t = performance.now();
      setNow(t);
      if (t - startedAt >= RUN_MS) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [startedAt]);

  const replay = () => {
    const t = performance.now();
    setOpen({});
    setNow(t);
    setStartedAt(t);
  };

  const elapsed = still ? Infinity : startedAt === null ? 0 : now - startedAt;
  const typed = clamp((elapsed - TYPE_START) / TYPE_MS, COMMAND.length);
  const shown = clamp((elapsed - OUTPUT_START) / LINE_MS, OUTPUT.length);
  const done = shown === OUTPUT.length;

  return (
    <figure className="terminal" ref={ref} aria-label="AgentGuard scanning a demo agent">
      <figcaption className="terminal-bar">
        <span className="dots" aria-hidden="true"><i /><i /><i /></span>
        <span>agentguard 0.3.1</span>
        <button type="button" className="replay" onClick={replay}>
          ↻ Replay
        </button>
      </figcaption>
      <div className="terminal-body">
        <p className="out">
          <span className="prompt">$ </span>
          <span className="cmd">{COMMAND.slice(0, typed)}</span>
          {typed < COMMAND.length && <span className="caret" aria-hidden="true" />}
        </p>
        {OUTPUT.slice(0, shown).map((row, i) => {
          if (row.kind === "out") {
            return (
              <p key={i} className={`out ${row.cls || ""}`}>
                {row.text}
                {row.warn && <span className="warn">{row.warn}</span>}
              </p>
            );
          }
          const isOpen = Boolean(open[i]);
          return (
            <div key={i}>
              <button
                type="button"
                className="finding"
                aria-expanded={isOpen}
                onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
              >
                <span className="chev" aria-hidden="true">›</span>
                <span className={`sev-${row.sev}`}>
                  {SEV_ICON[row.sev]} line {row.line} {row.rule}
                </span>{" "}
                {row.msg}
              </button>
              {isOpen && <p className="fix">→ {row.fix}</p>}
            </div>
          );
        })}
        {done && (
          <p className="out">
            <span className="prompt">$ </span>
            <span className="caret" aria-hidden="true" />
            <span className="hint"> &nbsp;click a finding to see its fix</span>
          </p>
        )}
      </div>
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
              <p className="sub">Nine pieces · 25 pages · 2025–2026</p>
              <blockquote>
                “Life is not a possession. It is a timestamp.”
              </blockquote>
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
        <p>Typed in Special Elite and Courier Prime. The dot is mauie.</p>
      </footer>
    </main>
  );
}
