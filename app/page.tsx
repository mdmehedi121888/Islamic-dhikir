"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DhikrMode = {
  id: string;
  name: string;
  arabic: string;
  bangla: string;
  cycle: number;
};

const DHIKR_MODES: DhikrMode[] = [
  {
    id: "subhanallah",
    name: "সুবহানাল্লাহ",
    arabic: "سُبْحَانَ اللَّهِ",
    bangla: "আল্লাহ পবিত্র",
    cycle: 100,
  },
  {
    id: "alhamdulillah",
    name: "আলহামদুলিল্লাহ",
    arabic: "الْحَمْدُ لِلَّهِ",
    bangla: "সকল প্রশংসা আল্লাহর",
    cycle: 100,
  },
  {
    id: "allahuakbar",
    name: "আল্লাহু আকবার",
    arabic: "اللَّهُ أَكْبَرُ",
    bangla: "আল্লাহ মহান",
    cycle: 100,
  },
  {
    id: "la-ilaha",
    name: "লা ইলাহা ইল্লাল্লাহ",
    arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
    bangla: "আল্লাহ ছাড়া কোনো ইলাহ নেই",
    cycle: 100,
  },
  {
    id: "astaghfirullah",
    name: "আস্তাগফিরুল্লাহ",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    bangla: "আমি আল্লাহর কাছে ক্ষমা চাই",
    cycle: 100,
  },
  {
    id: "salawat",
    name: "আল্লাহুম্মা সাল্লি আলা মুহাম্মাদ",
    arabic: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ",
    bangla: "হে আল্লাহ! আপনি মুহাম্মদ (সা.)-এর ওপর রহমত বর্ষণ করুন",
    cycle: 100,
  },
  {
    id: "hawla",
    name: "লা হাওলা ওয়া লা কুওয়াতা ইল্লা বিল্লাহ",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    bangla: "আল্লাহর সাহায্য ছাড়া কোনো শক্তি নেই",
    cycle: 100,
  },
  {
    id: "subhanallahi",
    name: "সুবহানাল্লাহি ওয়া বিহামদিহি",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    bangla: "আল্লাহ পবিত্র এবং সমস্ত প্রশংসা তাঁর",
    cycle: 100,
  },
];

const QUICK_GOALS = [33, 100, 300, 1000];

export default function Home() {
  const totalDots = 33;
  const radius = 130;
  const ringRadius = 148;

  // ========== STATE ==========
  const [count, setCount] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isGoalCompleting, setIsGoalCompleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Per-dhikr data
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({});
  const [dailyGoals, setDailyGoals] = useState<Record<string, number>>({});
  const [personalBests, setPersonalBests] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<Record<string, Record<string, number>>>({});

  // Global
  const [totalCount, setTotalCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentModeId, setCurrentModeId] = useState("salawat");

  const currentMode = DHIKR_MODES.find((m) => m.id === currentModeId) || DHIKR_MODES[0];
  const todayCount = todayCounts[currentModeId] || 0;
  const dailyGoal = dailyGoals[currentModeId] || 100;
  const personalBest = personalBests[currentModeId] || 0;
  const sessionCount = Math.floor(todayCount / 33);

  // ========== LOAD DATA ==========
  useEffect(() => {
    const savedToday = JSON.parse(localStorage.getItem("dhikr-today-counts") || "{}");
    const savedGoals = JSON.parse(localStorage.getItem("dhikr-goals") || "{}");
    const savedBests = JSON.parse(localStorage.getItem("dhikr-bests") || "{}");
    const savedHistory = JSON.parse(localStorage.getItem("dhikr-history") || "{}");
    const savedTotal = Number(localStorage.getItem("dhikr-total") || 0);
    const savedStreak = Number(localStorage.getItem("dhikr-streak") || 0);
    const savedBestStreak = Number(localStorage.getItem("dhikr-best-streak") || 0);
    const savedMode = localStorage.getItem("dhikr-mode") || "salawat";
    const lastDate = localStorage.getItem("dhikr-date");

    const today = new Date().toDateString();
    const todayKey = new Date().toISOString().slice(0, 10);

    if (lastDate && lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = lastDate === yesterday.toDateString();
      const yesterdayKey = yesterday.toISOString().slice(0, 10);

      // Save yesterday's data to history
      if (Object.keys(savedToday).length > 0) {
        const newHistory = { ...savedHistory, [yesterdayKey]: savedToday };
        localStorage.setItem("dhikr-history", JSON.stringify(newHistory));
        setHistory(newHistory);
      }

      let anyGoalCompleted = false;
      Object.keys(savedToday).forEach((key) => {
        const goal = savedGoals[key] || 100;
        if ((savedToday[key] || 0) >= goal) anyGoalCompleted = true;
      });

      if (wasYesterday && anyGoalCompleted) {
        const newStreak = savedStreak + 1;
        setStreak(newStreak);
        localStorage.setItem("dhikr-streak", String(newStreak));
        if (newStreak > savedBestStreak) {
          setBestStreak(newStreak);
          localStorage.setItem("dhikr-best-streak", String(newStreak));
        }
      } else if (!wasYesterday) {
        setStreak(0);
        localStorage.setItem("dhikr-streak", "0");
      }

      localStorage.setItem("dhikr-today-counts", "{}");
      localStorage.setItem("dhikr-date", today);
      setTodayCounts({});
    } else {
      setTodayCounts(savedToday);
      setStreak(savedStreak);
      setHistory(savedHistory);
      if (!lastDate) localStorage.setItem("dhikr-date", today);
    }

    const defaultGoals: Record<string, number> = {};
    DHIKR_MODES.forEach((mode) => {
      defaultGoals[mode.id] = savedGoals[mode.id] || 100;
    });

    setDailyGoals({ ...defaultGoals, ...savedGoals });
    setPersonalBests(savedBests);
    setTotalCount(savedTotal);
    setBestStreak(savedBestStreak);
    setCurrentModeId(savedMode);
  }, []);

  // ========== DOTS ==========
  const dots = useMemo(() => {
    return Array.from({ length: totalDots }, (_, index) => {
      const angle = (360 / totalDots) * index - 90;
      return {
        x: Math.cos((angle * Math.PI) / 180) * radius,
        y: Math.sin((angle * Math.PI) / 180) * radius,
      };
    });
  }, []);

  // ========== CLICK HANDLER ==========
  const handlePageClick = useCallback(() => {
    if (isCompleting || isGoalCompleting) return;

    setCount((prev) => {
      const next = prev + 1;

      if (next >= totalDots) {
        setIsCompleting(true);
        setTimeout(() => {
          setIsCompleting(false);
          setCount(0);
        }, 1800);
        return totalDots;
      }
      return next;
    });

    setTodayCounts((prevCounts) => {
      const newToday = (prevCounts[currentModeId] || 0) + 1;
      const updated = { ...prevCounts, [currentModeId]: newToday };
      localStorage.setItem("dhikr-today-counts", JSON.stringify(updated));

      // Check if daily goal just completed
      const goal = dailyGoals[currentModeId] || 100;
      if (newToday === goal) {
        setIsGoalCompleting(true);
        setTimeout(() => setIsGoalCompleting(false), 2500);
      }

      setPersonalBests((prevBests) => {
        if (newToday > (prevBests[currentModeId] || 0)) {
          const updatedBests = { ...prevBests, [currentModeId]: newToday };
          localStorage.setItem("dhikr-bests", JSON.stringify(updatedBests));
          return updatedBests;
        }
        return prevBests;
      });

      return updated;
    });

    setTotalCount((t) => {
      const newTotal = t + 1;
      localStorage.setItem("dhikr-total", String(newTotal));
      return newTotal;
    });
  }, [currentModeId, isCompleting, isGoalCompleting, dailyGoals]);

  // ========== HELPERS ==========
  const progressPercent = Math.min((todayCount / dailyGoal) * 100, 100);
  const isGoalReached = todayCount >= dailyGoal;
  const circleProgress = (count / totalDots) * 100;
  const circumference = 2 * Math.PI * ringRadius;

  const changeMode = (modeId: string) => {
    setCurrentModeId(modeId);
    localStorage.setItem("dhikr-mode", modeId);
    setCount(0);
    setShowModePicker(false);
  };

  const updateGoal = (value: number) => {
    const goal = Math.max(1, Math.min(value, 10000));
    setDailyGoals((prev) => {
      const updated = { ...prev, [currentModeId]: goal };
      localStorage.setItem("dhikr-goals", JSON.stringify(updated));
      return updated;
    });
  };

  // Calendar helpers
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };

 const isDayCompleted = (date: Date) => {
  const key = date.toISOString().slice(0, 10);
  const todayKey = new Date().toISOString().slice(0, 10);

  // ========== TODAY ==========
  if (key === todayKey) {
    // Check using today's live counts
    return DHIKR_MODES.every((mode) => {
      const count = todayCounts[mode.id] || 0;
      const goal = dailyGoals[mode.id] || 100;
      return count >= goal;
    });
  }

  // ========== PREVIOUS DAYS ==========
  const dayData = history[key];

  if (!dayData || Object.keys(dayData).length === 0) return false;

  return DHIKR_MODES.every((mode) => {
    const count = dayData[mode.id] || 0;
    const goal = dailyGoals[mode.id] || 100;
    return count >= goal;
  });
};

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <main
      onClick={handlePageClick}
      className="relative min-h-screen cursor-pointer overflow-x-hidden bg-[#f3f1e9] text-[#304744] select-none"
    >
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-20 left-1/2 h-75 w-75 -translate-x-1/2 rounded-full bg-[#d9caa2]/20 blur-[100px] sm:h-100 sm:w-100" />
        <div className="absolute top-45 left-[10%] h-45 w-45 rounded-full bg-white/30 blur-[80px]" />
        <div className="absolute top-65 right-[5%] h-45 w-45 rounded-full bg-[#e0d2a9]/20 blur-[80px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center px-3 pt-4 pb-6 sm:px-5 sm:pt-6">
        {/* Top Bar */}
        <div className="flex w-full items-center justify-between gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowModePicker(true);
            }}
            className="max-w-[65%] truncate rounded-full border border-[#d4d5ce] bg-[#f4f2eb]/90 px-3 py-1.5 text-xs font-medium shadow-sm sm:px-4 sm:text-sm"
          >
            {currentMode.name} ▾
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCalendar(true);
              }}
              className="rounded-full border border-[#d4d5ce] bg-[#f4f2eb]/90 p-2 text-sm shadow-sm"
              title="ক্যালেন্ডার"
            >
              📅
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(true);
              }}
              className="rounded-full border border-[#d4d5ce] bg-[#f4f2eb]/90 p-2 text-sm shadow-sm"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="mt-4 px-2 text-center sm:mt-6">
          <h1 className="text-[22px] font-medium leading-snug sm:text-[28px] md:text-[32px]">
            {currentMode.arabic}
          </h1>
          <p className="mt-1.5 text-xs text-[#536662] sm:text-sm">
            {currentMode.bangla}
          </p>
        </header>

        {/* Circular Progress + Soft Ring */}
        <section className="relative mt-6 flex flex-col items-center sm:mt-8">
          <div className="relative flex h-[280px] w-[280px] items-center justify-center sm:h-[310px] sm:w-[310px]">
            
            {/* Soft Progress Ring (SVG) */}
            <svg
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 320 320"
            >
              {/* Background ring */}
              <circle
                cx="160"
                cy="160"
                r={ringRadius}
                fill="none"
                stroke="#e5e1d6"
                strokeWidth="3"
              />
              {/* Progress ring */}
              <motion.circle
                cx="160"
                cy="160"
                r={ringRadius}
                fill="none"
                stroke="#23816b"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={false}
                animate={{
                  strokeDashoffset: circumference - (circleProgress / 100) * circumference,
                }}
                transition={{ type: "spring", stiffness: 80, damping: 20 }}
              />
            </svg>

            {/* Dots */}
            {dots.map((dot, index) => {
              const isActive = index < count;
              return (
                <motion.div
                  key={index}
                  className={`absolute h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3 ${
                    isActive ? "bg-[#23816b]" : "border border-[#c7c8c0] bg-[#f5f3ec]"
                  }`}
                  style={{ x: dot.x, y: dot.y }}
                  initial={false}
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    boxShadow: isActive ? "0 0 10px rgba(35,129,107,0.55)" : "0 0 0 transparent",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 22,
                    delay: isActive ? index * 0.008 : 0,
                  }}
                />
              );
            })}

            {/* Center Counter */}
            <motion.div
              className="relative z-10 flex h-[130px] w-[130px] flex-col items-center justify-center rounded-full border border-[#b9d7cf] bg-[#f5f1e7]/90 shadow-[0_8px_40px_rgba(35,129,107,0.12)] backdrop-blur-sm sm:h-[145px] sm:w-[145px]"
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={count}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[32px] font-semibold text-[#23816b] sm:text-[36px]"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
              <span className="text-[11px] text-[#4e5e5b]">/ 33</span>
            </motion.div>
          </div>
        </section>

        {/* Session Counter */}
        <div className="mt-3 text-center">
          <p className="text-xs text-[#5a6b68] sm:text-sm">
            আজ <span className="font-semibold text-[#23816b]">{sessionCount}</span> টি চক্র সম্পন্ন
          </p>
        </div>

        {/* Daily Progress */}
        <div className="mt-5 w-full max-w-xs">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-[#536662] sm:text-xs">
            <span className="truncate">আজকের টার্গেট</span>
            <span className={`font-medium ${isGoalReached ? "text-[#23816b]" : ""}`}>
              {todayCount} / {dailyGoal}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#e8e4d9]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#2a9d7f] to-[#23816b]"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            />
          </div>
          {isGoalReached && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 text-center text-[11px] font-medium text-[#23816b]"
            >
              মাশাআল্লাহ! টার্গেট পূর্ণ হয়েছে ✨
            </motion.p>
          )}
        </div>

        <p className="mt-4 text-xs text-[#6b7a77]">ক্লিক করে জিকির করুন</p>

      </div>

      {/* ========== 33-Cycle Completion ========== */}
      <AnimatePresence>
        {isCompleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-[6px]"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="w-full max-w-xs rounded-3xl bg-[#f5f1e7] px-6 py-8 text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                className="text-5xl"
              >
                ✨
              </motion.div>
              <h2 className="mt-3 text-2xl font-medium text-[#23816b]">আলহামদুলিল্লাহ</h2>
              <p className="mt-1 text-sm text-[#536662]">৩৩ বার {currentMode.name} সম্পন্ন</p>
              <p className="mt-3 text-xs text-[#7a8a87]">
                আজ মোট {sessionCount} টি চক্র
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== Daily Goal Completion ========== */}
      <AnimatePresence>
        {isGoalCompleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[8px]"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#e8f5f0] to-[#f5f1e7] px-6 py-9 text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="text-6xl"
              >
                🌟
              </motion.div>
              <h2 className="mt-4 text-2xl font-semibold text-[#1a6b58]">মাশাআল্লাহ!</h2>
              <p className="mt-2 text-base text-[#304744]">
                আজকের টার্গেট পূর্ণ হয়েছে
              </p>
              <p className="mt-1 text-sm text-[#5a6b68]">
                {dailyGoal} বার {currentMode.name}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== Mode Picker ========== */}
      <AnimatePresence>
        {showModePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
            onClick={(e) => {
              e.stopPropagation();
              setShowModePicker(false);
            }}
          >
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: 0 }}
              exit={{ y: 120 }}
              className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#f5f1e7] p-4 sm:rounded-3xl sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-center text-base font-medium">জিকির সিলেক্ট করুন</h3>
              <div className="grid gap-2">
                {DHIKR_MODES.map((mode) => {
                  const modeToday = todayCounts[mode.id] || 0;
                  const modeGoal = dailyGoals[mode.id] || 100;
                  const done = modeToday >= modeGoal;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => changeMode(mode.id)}
                      className={`rounded-xl px-4 py-3 text-left transition ${
                        currentModeId === mode.id
                          ? "bg-[#23816b] text-white"
                          : "bg-white/70 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{mode.name}</div>
                          <div className="text-xs opacity-80">{mode.arabic}</div>
                        </div>
                        <div className="text-right text-xs opacity-90">
                          {modeToday}/{modeGoal}
                          {done && <span className="ml-1">✓</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== Settings ========== */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(false);
            }}
          >
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: 0 }}
              exit={{ y: 120 }}
              className="w-full max-w-md rounded-t-3xl bg-[#f5f1e7] p-5 sm:rounded-3xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-5 text-center text-base font-medium">সেটিংস</h3>

              <div className="mb-5">
                <label className="mb-2 block text-xs text-[#536662]">
                  {currentMode.name} এর টার্গেট
                </label>
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => updateGoal(Number(e.target.value))}
                  className="mb-3 w-full rounded-xl border border-[#d4d5ce] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#23816b]"
                />

                {/* Quick Goal Buttons */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_GOALS.map((g) => (
                    <button
                      key={g}
                      onClick={() => updateGoal(g)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                        dailyGoal === g
                          ? "bg-[#23816b] text-white"
                          : "bg-white border border-[#d4d5ce] text-[#304744] hover:bg-[#eef6f3]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full rounded-xl bg-[#23816b] py-3 text-sm font-medium text-white"
              >
                সংরক্ষণ করুন
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== Calendar View ========== */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
            onClick={(e) => {
              e.stopPropagation();
              setShowCalendar(false);
            }}
          >
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: 0 }}
              exit={{ y: 120 }}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#f5f1e7] p-5 sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-medium">গত ৩০ দিন</h3>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="rounded-full bg-white/80 px-3 py-1 text-sm"
                >
                  বন্ধ
                </button>
              </div>

              <div className="mb-3 flex items-center gap-4 text-xs text-[#5a6b68]">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#23816b]" />
                  <span>টার্গেট পূর্ণ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#e5e1d6]" />
                  <span>অসম্পূর্ণ</span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"].map((d) => (
                  <div key={d} className="py-1 text-center text-[10px] text-[#8a9a97]">
                    {d}
                  </div>
                ))}

                {/* Empty cells for first day offset */}
                {Array.from({ length: getLast30Days()[0].getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {getLast30Days().map((date) => {
                  const completed = isDayCompleted(date);
                  const today = isToday(date);
                  return (
                    <div
                      key={date.toISOString()}
                      className={`flex aspect-square flex-col items-center justify-center rounded-xl text-xs ${
                        completed
                          ? "bg-[#23816b] text-white"
                          : today
                          ? "border-2 border-[#23816b] bg-white"
                          : "bg-white/70 text-[#5a6b68]"
                      }`}
                    >
                      <span className="font-medium">{date.getDate()}</span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 text-center text-xs text-[#7a8a87]">
                সবুজ দিন = সব জিকিরের টার্গেট পূর্ণ হয়েছে
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}