import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
};

export default function App() {
  const [scrollY, setScrollY] = useState(0);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [basePos, setBasePos] = useState({ x: 0, y: 0 });
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const init = {
      x: window.innerWidth - 120,
      y: window.innerHeight / 2
    };
    setBasePos(init);
    setDotPos(init);
  }, []);
  const [showMsg, setShowMsg] = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [dotScale, setDotScale] = useState(1.5);
  const [followText, setFollowText] = useState("follow mauie");
  const [trail, setTrail] = useState([]);

  // track scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const recallDot = () => {
    setDotPos(basePos);
    setDotScale(1.5);
    setFollowCount(0);
    setFollowText("ok ok im back 😤");
    setTimeout(() => setFollowText("follow mauie"), 1200);
  };

  const dodge = () => {
    setFollowCount((prev) => {
      const newCount = prev + 1;

      const distance = 80 + newCount * 40; // reduced for control
      const angle = Math.random() * Math.PI * 2;

      let newX = dotPos.x + Math.cos(angle) * distance;
      let newY = dotPos.y + Math.sin(angle) * distance;

      // 🔒 HARD SCREEN BOUNDS (FINAL FIX)
      const padding = 40;
      newX = Math.max(padding, Math.min(window.innerWidth - padding, newX));
      newY = Math.max(padding, Math.min(window.innerHeight - padding, newY));

      setDotPos({ x: newX, y: newY });
      setShowMsg(true);

      if (newCount < 5) {
        const base = 1.5;
        setDotScale(Math.pow(base, newCount));
        setFollowText("follow mauie");
      } else {
        setDotScale(1.5);
        setDotPos(basePos);
        setFollowText("u over did it 😭");

        setTimeout(() => {
          setFollowText("follow mauie");
          setFollowCount(0);
        }, 1500);
        return 0;
      }

      setTimeout(() => setShowMsg(false), 1200);
      return newCount;
    });
  };

  return (
    <div
      onMouseMove={(e) => {
        setCursor({ x: e.clientX, y: e.clientY });

        // trail only when actively following
        if (followCount > 0 && followCount < 5) {
          setTrail((prev) => {
            const newTrail = [...prev, { x: e.clientX, y: e.clientY }];
            return newTrail.slice(-15); // limit trail length
          });
        } else {
          setTrail([]);
        }
      }}
      className="relative min-h-screen bg-black text-green-200 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(163,230,53,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(163,230,53,0.25)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Cursor Trail */}
      {scrollY < window.innerHeight && trail.map((t, i) => (
        <motion.div
          key={i}
          className="pointer-events-none fixed text-pink-200 text-xs"
          initial={{ opacity: 0, scale: 0.3, rotate: 0 }}
          animate={{ 
            opacity: i / trail.length,
            scale: 0.6 + i / trail.length,
            rotate: Math.random() * 180
          }}
          transition={{ duration: 0.3 }}
          style={{
            left: t.x,
            top: t.y,
            transform: "translate(-50%, -50%)"
          }}
        >
          ✦
        </motion.div>
      ))}

      {/* Cursor Glow */}
      <motion.div
        className="pointer-events-none fixed w-24 h-24 bg-green-400/20 rounded-full blur-3xl"
        animate={{ x: cursor.x - 50, y: cursor.y - 50 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />

      <div className="relative z-10 px-10">

        {/* HERO */}
        <section className="h-screen flex flex-col justify-center relative">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] text-green-500 mb-6">
              AIML STUDENT · PES UNIVERSITY · 2ND YEAR
            </motion.p>

            <div className="relative">
              <motion.h1 variants={fadeUp} className="text-[clamp(4rem,10vw,8rem)] font-serif leading-none">
                Muaz
              </motion.h1>
              <motion.h1 variants={fadeUp} className="text-[clamp(4rem,10vw,8rem)] font-serif text-gray-500 leading-none">
                Iqubal
              </motion.h1>

              {/* Interactive Dot */}
              {scrollY < window.innerHeight && (
                <motion.div
                  onMouseEnter={dodge}
                  animate={{ left: dotPos.x, top: dotPos.y, scale: dotScale }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="fixed w-5 h-5 bg-pink-400 rounded-full cursor-pointer"
                />
              )}

              {/* Follow text */}
              <div className="absolute right-16 top-[45%] text-xs text-pink-400">
                {followText}
              </div>

              {showMsg && (
                <div
                  className="fixed text-xs text-pink-400 pointer-events-none"
                  style={{ left: dotPos.x + 14, top: dotPos.y + 14 }}
                >
                  leave me alone 😭
                </div>
              )}

              {/* Recall button */}
              <button
                onClick={recallDot}
                className="absolute right-16 top-[62%] text-[10px] text-pink-300 border border-pink-400/30 px-2 py-1 hover:bg-pink-400 hover:text-black transition"
              >
                call mauie back please ↺
              </button>
            </div>

            <motion.p variants={fadeUp} className="mt-10 max-w-xl text-green-300 text-lg leading-relaxed">
              Building at the intersection of <span className="text-white">machine intelligence</span> and <span className="text-white">human questions</span>.
            </motion.p>
          </motion.div>
        </section>

        {/* INFO */}
        <section className="py-20 border-t border-green-500/10">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {[
              ["UNIVERSITY", "PES University"],
              ["DEGREE", "B.Tech AIML"],
              ["LOCATION", "Bangalore"],
            ].map(([k, v], i) => (
              <motion.div key={i} variants={fadeUp} className="flex justify-between py-6 border-b border-green-500/10">
                <span className="text-xs text-green-500 tracking-widest">{k}</span>
                <span className="text-white">{v}</span>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* PROJECTS */}
        <section className="py-20">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-xs text-green-500 mb-6">01 / PROJECTS</motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            onClick={() => window.open("https://github.com/muaz-q/NeuraBar")}
            className="border border-green-500/10 p-8 mb-6 cursor-pointer hover:border-pink-400 hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition"
          >
            <h2 className="text-4xl font-serif">NeuraBar</h2>
            <div className="mt-3 inline-block px-3 py-1 text-xs tracking-widest bg-green-500/10 text-green-400">
              OCR · SYSTEM DESIGN · AUTOMATION
            </div>
            <p className="text-green-400 mt-4">A desktop OS-like productivity tool (Phase 1) with region-based OCR to capture on-screen text and generate summaries, a screenshot-driven folder system that auto-organizes captures, and Smart Search to execute commands like “open YouTube” instantly.</p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            onClick={() => window.open("https://github.com/muaz-q/Sally")}
            className="border border-green-500/10 p-8 cursor-pointer hover:border-pink-400 hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition"
          >
            <h2 className="text-4xl font-serif">Sally</h2>
            <div className="mt-3 inline-block px-3 py-1 text-xs tracking-widest bg-green-500/10 text-green-400">
              API INTEGRATION · AUTOMATION · REAL-TIME SYSTEMS
            </div>
            <p className="text-green-400 mt-4">A dynamic system that syncs your desktop wallpaper with your currently playing Spotify track — turning music into a visual experience.</p>
          </motion.div>
        </section>

        {/* EXPERIENCE */}
        <section className="py-20">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-xs text-green-500 mb-6">02 / EXPERIENCE</motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
            className="border border-green-500/10 p-8 hover:border-pink-400 hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition"
          >
            <h2 className="text-4xl font-serif">KaizenDev</h2>
            <p className="text-green-400 mt-2">Outreach & Marketing Intern (10+ months)</p>
          </motion.div>
        </section>

        {/* WRITING */}
        <section className="py-20">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-xs text-green-500 mb-6">03 / WRITING</motion.p>

          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-4xl font-serif mb-6 leading-tight">
            I write about <span className="text-pink-400 italic">the absurd</span> & the alive.
          </motion.h2>

          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-green-300 max-w-2xl mb-8">
            Exploring existentialism, AI, and what it means to build technology in a world without clear answers.
          </motion.p>

          <motion.a
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            href="https://medium.com/@mwahz"
            target="_blank"
            className="inline-block px-6 py-3 border border-pink-400 text-pink-400 text-sm tracking-widest uppercase hover:bg-pink-400 hover:text-black transition"
          >
            Read on Medium →
          </motion.a>
        </section>

        {/* CONNECT */}
        <section className="py-20">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-5xl mb-10">
            Let’s <span className="text-green-400 italic">talk.</span>
          </motion.h2>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex flex-col border border-green-500/10">
            {[
              ["GitHub ↗", "https://github.com/muaz-q"],
              ["LinkedIn ↗", "https://www.linkedin.com/in/muaziqubal"],
              ["Medium ↗", "https://medium.com/@mwahz"],
            ].map(([label, link], i) => (
              <motion.a
                key={i}
                variants={fadeUp}
                href={link}
                target="_blank"
                className="p-6 border-b last:border-b-0 hover:bg-green-500/5 hover:pl-8 transition-all duration-300"
              >
                {label}
              </motion.a>
            ))}
          </motion.div>
        </section>

      </div>
    </div>
  );
}
