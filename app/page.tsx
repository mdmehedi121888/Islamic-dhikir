"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
    cycle: 33,
  },
  {
    id: "alhamdulillah",
    name: "আলহামদুলিল্লাহ",
    arabic: "الْحَمْدُ لِلَّهِ",
    bangla: "সকল প্রশংসা আল্লাহর",
    cycle: 33,
  },
  {
    id: "allahuakbar",
    name: "আল্লাহু আকবার",
    arabic: "اللَّهُ أَكْبَرُ",
    bangla: "আল্লাহ মহান",
    cycle: 33,
  },
   {
    id: "la-ilaha",
    name: "লা ইলাহা ইল্লাল্লাহ",
    arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
    bangla: "আল্লাহ ছাড়া কোনো ইলাহ নেই",
    cycle: 33,
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
    cycle: 33,
  },
  {
    id: "hawla",
    name: "লা হাওলা ওয়া লা কুওয়াতা ইল্লা বিল্লাহ",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    bangla: "আল্লাহর সাহায্য ছাড়া কোনো শক্তি নেই",
    cycle: 33,
  },
  {
    id: "subhanallahi",
    name: "সুবহানাল্লাহি ওয়া বিহামদিহি",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    bangla: "আল্লাহ পবিত্র এবং সমস্ত প্রশংসা তাঁর",
    cycle: 33,
  },
];

export default function Home() {
  const totalDots = 33;

  // ========== STATE ==========
  const [count, setCount] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);

  // Per-dhikr data
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({});
  const [dailyGoals, setDailyGoals] = useState<Record<string, number>>({});
  const [personalBests, setPersonalBests] = useState<Record<string, number>>({});

  // Global
  const [totalCount, setTotalCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentModeId, setCurrentModeId] = useState("salawat");

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentMode = DHIKR_MODES.find((m) => m.id === currentModeId) || DHIKR_MODES[0];

  const todayCount = todayCounts[currentModeId] || 0;
  const dailyGoal = dailyGoals[currentModeId] || 100;
  const personalBest = personalBests[currentModeId] || 0;

  // ========== LOAD DATA ==========
  useEffect(() => {
    const savedToday = JSON.parse(localStorage.getItem("dhikr-today-counts") || "{}");
    const savedGoals = JSON.parse(localStorage.getItem("dhikr-goals") || "{}");
    const savedBests = JSON.parse(localStorage.getItem("dhikr-bests") || "{}");
    const savedTotal = Number(localStorage.getItem("dhikr-total") || 0);
    const savedStreak = Number(localStorage.getItem("dhikr-streak") || 0);
    const savedBestStreak = Number(localStorage.getItem("dhikr-best-streak") || 0);
    const savedMode = localStorage.getItem("dhikr-mode") || "salawat";
    const savedSound = localStorage.getItem("dhikr-sound") !== "false";
    const savedHaptic = localStorage.getItem("dhikr-haptic") !== "false";
    const lastDate = localStorage.getItem("dhikr-date");

    const today = new Date().toDateString();

    // Auto reset at midnight
    if (lastDate && lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = lastDate === yesterday.toDateString();

      // Check if any goal was completed yesterday for streak
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

      // Reset all today counts
      localStorage.setItem("dhikr-today-counts", "{}");
      localStorage.setItem("dhikr-date", today);
      setTodayCounts({});
    } else {
      setTodayCounts(savedToday);
      setStreak(savedStreak);
      if (!lastDate) localStorage.setItem("dhikr-date", today);
    }

    // Set default goals if not exists
    const defaultGoals: Record<string, number> = {};
    DHIKR_MODES.forEach((mode) => {
      defaultGoals[mode.id] = savedGoals[mode.id] || (mode.cycle === 0 ? 100 : mode.cycle === 100 ? 100 : 33);
    });

    setDailyGoals({ ...defaultGoals, ...savedGoals });
    setPersonalBests(savedBests);
    setTotalCount(savedTotal);
    setBestStreak(savedBestStreak);
    setCurrentModeId(savedMode);
    setSoundEnabled(savedSound);
    setHapticEnabled(savedHaptic);
  }, []);

  // ========== DOTS ==========
  const dots = useMemo(() => {
    return Array.from({ length: totalDots }, (_, index) => {
      const angle = (360 / totalDots) * index - 90;
      const radius = 130; // slightly smaller for better mobile fit
      return {
        x: Math.cos((angle * Math.PI) / 180) * radius,
        y: Math.sin((angle * Math.PI) / 180) * radius,
      };
    });
  }, []);

  // ========== FEEDBACK ==========
  const playFeedback = useCallback(() => {
    if (hapticEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [hapticEnabled, soundEnabled]);

  // ========== CLICK HANDLER ==========
  // const handlePageClick = useCallback(() => {
  //   if (isCompleting) return;
  //   playFeedback();

  //   setCount((prev) => {
  //     const next = prev + 1;

  //     // Update today's count for current mode
  //     setTodayCounts((prevCounts) => {
  //       const newToday = (prevCounts[currentModeId] || 0) + 1;
  //       const updated = { ...prevCounts, [currentModeId]: newToday };
  //       localStorage.setItem("dhikr-today-counts", JSON.stringify(updated));

  //       // Personal best for this mode
  //       setPersonalBests((prevBests) => {
  //         if (newToday > (prevBests[currentModeId] || 0)) {
  //           const updatedBests = { ...prevBests, [currentModeId]: newToday };
  //           localStorage.setItem("dhikr-bests", JSON.stringify(updatedBests));
  //           return updatedBests;
  //         }
  //         return prevBests;
  //       });

  //       return updated;
  //     });

  //     // Total count
  //     setTotalCount((t) => {
  //       const newTotal = t + 1;
  //       localStorage.setItem("dhikr-total", String(newTotal));
  //       return newTotal;
  //     });

  //     // Circle always resets at 33
  //     if (next >= totalDots) {
  //       if (currentMode.cycle > 0) {
  //         setIsCompleting(true);
  //         setTimeout(() => {
  //           setIsCompleting(false);
  //           setCount(0);
  //         }, 1500);
  //         return totalDots;
  //       }
  //       return 0;
  //     }

  //     return next;
  //   });
  // }, [currentMode, currentModeId, isCompleting, playFeedback]);

  const handlePageClick = useCallback(() => {
  if (isCompleting) return;

  playFeedback();

  setCount((prev) => {
    const next = prev + 1;

    // Only handle the circle reset logic here (pure)
    if (next >= totalDots) {
      if (currentMode.cycle > 0) {
        setIsCompleting(true);
        setTimeout(() => {
          setIsCompleting(false);
          setCount(0);
        }, 1500);
        return totalDots;
      }
      return 0;
    }

    return next;
  });

  // ========== Move all side effects OUTSIDE ==========
  setTodayCounts((prevCounts) => {
    const newToday = (prevCounts[currentModeId] || 0) + 1;
    const updated = { ...prevCounts, [currentModeId]: newToday };
    localStorage.setItem("dhikr-today-counts", JSON.stringify(updated));

    // Update personal best
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
}, [currentMode, currentModeId, isCompleting, playFeedback]);


  // ========== HELPERS ==========
  const progressPercent = Math.min((todayCount / dailyGoal) * 100, 100);
  const isGoalReached = todayCount >= dailyGoal;

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

  return (
    <main
      onClick={handlePageClick}
      className="relative min-h-screen cursor-pointer overflow-x-hidden bg-[#f3f1e9] text-[#304744] select-none"
    >
      <audio ref={audioRef} preload="auto">
        <source src="/tick.mp3" type="audio/mpeg" />
      </audio>

      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-20 left-1/2 h-75 w-75 -translate-x-1/2 rounded-full bg-[#d9caa2]/20 blur-[100px] sm:h-100 sm:w-100" />
        <div className="absolute top-45 left-[10%] h-45 w-45 rounded-full bg-white/30 blur-[80px] sm:h-62.5 sm:w-62.5" />
        <div className="absolute top-65 right-[5%] h-45 w-45 rounded-full bg-[#e0d2a9]/20 blur-[80px] sm:h-62.5 sm:w-62.5" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center px-3 pt-4 pb-6 sm:px-5 sm:pt-6 sm:pb-8">
        {/* Top Bar */}
        <div className="flex w-full items-center justify-between gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowModePicker(true);
            }}
            className="max-w-[70%] truncate rounded-full border border-[#d4d5ce] bg-[#f4f2eb]/90 px-3 py-1.5 text-xs font-medium shadow-sm sm:px-4 sm:text-sm"
          >
            {currentMode.name} ▾
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

        {/* Header */}
        <header className="mt-3 px-2 text-center sm:mt-5">
          <h1 className="text-[22px] font-medium leading-snug sm:text-[28px] md:text-[32px]">
            {currentMode.arabic}
          </h1>
          <p className="mt-1 text-xs text-[#536662] sm:text-sm md:text-base">
            {currentMode.bangla}
          </p>
        </header>

        {/* Circular Progress */}
        <section className="relative mt-6 flex flex-col items-center sm:mt-8">
          <div className="relative flex h-65 w-65 items-center justify-center sm:h-75 sm:w-75 md:h-80 md:w-[320px]">
            {dots.map((dot, index) => {
              const isActive = index < count;
              return (
                <motion.div
                  key={index}
                  className={`absolute h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 ${
                    isActive ? "bg-[#23816b]" : "border border-[#c7c8c0] bg-[#f5f3ec]"
                  }`}
                  style={{ x: dot.x, y: dot.y }}
                  initial={false}
                  animate={{
                    scale: isActive ? 1.25 : 1,
                    boxShadow: isActive ? "0 0 10px rgba(35,129,107,0.5)" : "0 0 0 transparent",
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

            {/* Center */}
            <motion.div
              className="relative flex h-30 w-30 flex-col items-center justify-center rounded-full border border-[#b9d7cf] bg-[#f5f1e7]/80 shadow-[0_0_40px_rgba(211,193,139,0.25)] backdrop-blur-sm sm:h-35 sm:w-35 md:h-37.5 md:w-37.5"
              whileTap={{ scale: 0.94 }}
            >
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={count}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-[28px] font-semibold text-[#23816b] sm:text-[34px]"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
              <span className="text-[10px] text-[#4e5e5b] sm:text-xs">/ ৩৩</span>
            </motion.div>
          </div>
        </section>

        {/* Daily Progress - Per Dhikr */}
        <div className="mt-4 w-full max-w-xs px-1 sm:mt-5">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[#536662] sm:text-xs">
            <span className="truncate">আজকের টার্গেট ({currentMode.name})</span>
            <span className={`ml-2 shrink-0 ${isGoalReached ? "font-medium text-[#23816b]" : ""}`}>
              {todayCount} / {dailyGoal}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e8e4d9] sm:h-2.5">
            <motion.div
              className="h-full rounded-full bg-[#23816b]"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          {isGoalReached && (
            <p className="mt-1 text-center text-[11px] font-medium text-[#23816b] sm:text-xs">
              মাশাআল্লাহ! টার্গেট পূর্ণ হয়েছে
            </p>
          )}
        </div>

        <p className="mt-3 text-xs text-[#4e5e5b] sm:mt-4 sm:text-sm">
          ট্যাপ করে জিকির করুন
        </p>

        {/* Stats */}
        <div className="mt-auto flex w-full flex-wrap justify-center gap-1.5 pt-6 sm:gap-2 sm:pt-8">
          <StatBadge label="স্ট্রিক" value={`${streak} দিন`} />
          <StatBadge label="সেরা স্ট্রিক" value={`${bestStreak} দিন`} />
          <StatBadge label="আজকের সেরা" value={personalBest} />
          <StatBadge label="মোট" value={totalCount.toLocaleString()} />
        </div>
      </div>

      {/* Completion Overlay */}
      <AnimatePresence>
        {isCompleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="w-full max-w-xs rounded-3xl bg-[#f5f1e7] px-6 py-7 text-center shadow-2xl sm:max-w-sm sm:px-8 sm:py-8"
            >
              <div className="text-4xl sm:text-5xl">✨</div>
              <h2 className="mt-2 text-xl font-medium text-[#23816b] sm:text-2xl">
                আলহামদুলিল্লাহ
              </h2>
              <p className="mt-1 text-sm text-[#536662]">
                ৩৩ বার {currentMode.name} সম্পন্ন
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Picker */}
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
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#f5f1e7] p-4 sm:rounded-3xl sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-3 text-center text-base font-medium sm:mb-4 sm:text-lg">
                জিকির সিলেক্ট করুন
              </h3>
              <div className="grid gap-2">
                {DHIKR_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => changeMode(mode.id)}
                    className={`rounded-xl px-3 py-2.5 text-left transition sm:px-4 sm:py-3 ${
                      currentModeId === mode.id
                        ? "bg-[#23816b] text-white"
                        : "bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div className="text-sm font-medium sm:text-base">{mode.name}</div>
                    <div className="text-xs opacity-80 sm:text-sm">{mode.arabic}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings */}
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
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-md rounded-t-3xl bg-[#f5f1e7] p-5 sm:rounded-3xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-center text-base font-medium sm:mb-5 sm:text-lg">
                সেটিংস
              </h3>

              {/* Individual Goal */}
              <div className="mb-5">
                <label className="mb-1.5 block text-xs text-[#536662] sm:text-sm">
                  {currentMode.name} এর আজকের টার্গেট
                </label>
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => updateGoal(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#d4d5ce] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#23816b]"
                />
                <p className="mt-1 text-[11px] text-[#888]">
                  প্রতিটি জিকিরের আলাদা টার্গেট সেট করতে পারবেন
                </p>
              </div>

              <div className="space-y-3">
                <Toggle
                  label="সাউন্ড"
                  enabled={soundEnabled}
                  onChange={(v) => {
                    setSoundEnabled(v);
                    localStorage.setItem("dhikr-sound", String(v));
                  }}
                />
                <Toggle
                  label="ভাইব্রেশন"
                  enabled={hapticEnabled}
                  onChange={(v) => {
                    setHapticEnabled(v);
                    localStorage.setItem("dhikr-haptic", String(v));
                  }}
                />
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="mt-6 w-full rounded-xl bg-[#23816b] py-3 text-sm font-medium text-white sm:text-base"
              >
                সংরক্ষণ করুন
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// ========== Small Components ==========
function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full border border-[#d4d5ce] bg-[#f4f2eb]/80 px-2.5 py-1 text-[11px] text-[#52615e] shadow-sm sm:px-3.5 sm:py-1.5 sm:text-sm">
      <span className="opacity-70">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Toggle({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 rounded-full transition ${
          enabled ? "bg-[#23816b]" : "bg-[#c7c8c0]"
        }`}
      >
        <motion.div
          className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
          animate={{ left: enabled ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}