'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Student, PickHistoryItem } from '@/types/student';
import { playTickSound, playCelebrationFanfare, playWhooshSound } from '@/lib/audio';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RotateCcw, 
  History, 
  UserX, 
  CheckCircle, 
  Maximize, 
  Minimize, 
  ArrowRight,
  Shuffle,
  Volume2,
  Users
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onNavigateToRoster,
}) => {
  // Allow duplicate or non-duplicate setting
  const [allowDuplicate, setAllowDuplicate] = useState<boolean>(false);

  // Drawn history (stores all picks in current session)
  const [history, setHistory] = useState<PickHistoryItem[]>([]);

  // Current drawn winner
  const [currentWinner, setCurrentWinner] = useState<Student | null>(null);

  // Drawing state
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [displayRollingName, setDisplayRollingName] = useState<string>('準備抽籤');
  const [displayRollingSeat, setDisplayRollingSeat] = useState<number | undefined>(undefined);

  // Big screen projection overlay toggle
  const [isProjectionMode, setIsProjectionMode] = useState<boolean>(false);

  // Active pool of candidates
  // If allowDuplicate is false, filter out students in history
  const activeStudents = students.filter(s => s.active !== false);

  const availablePool = allowDuplicate
    ? activeStudents
    : activeStudents.filter(s => !history.some(h => h.student.id === s.id));

  const rollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger celebration confetti
  const fireConfetti = useCallback(() => {
    try {
      // Confetti burst from both sides
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6, x: 0.3 },
        colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
      });
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6, x: 0.7 },
        colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // Canvas confetti fallback
    }
  }, []);

  // Main draw procedure with suspense deceleration
  const startRoll = useCallback(() => {
    if (isRolling) return;
    if (availablePool.length === 0) return;

    setIsRolling(true);
    playWhooshSound();

    // Pick a winner in advance
    const winnerIndex = Math.floor(Math.random() * availablePool.length);
    const chosenWinner = availablePool[winnerIndex];

    let currentInterval = 40; // Starts fast (40ms)
    let totalRollSteps = 0;
    const maxSteps = 30; // approx 2.5 - 3 seconds of suspense

    const stepRoll = () => {
      // Pick random student to display during roll animation
      const randomIdx = Math.floor(Math.random() * availablePool.length);
      const tempStudent = availablePool[randomIdx];
      setDisplayRollingName(tempStudent.name);
      setDisplayRollingSeat(tempStudent.seatNumber);

      // Sound effect with pitch shifting as it gets closer to stop
      const pitch = 480 + (totalRollSteps * 12);
      playTickSound(pitch);

      totalRollSteps++;

      if (totalRollSteps >= maxSteps) {
        // Stop rolling! Reveal chosen student
        setDisplayRollingName(chosenWinner.name);
        setDisplayRollingSeat(chosenWinner.seatNumber);
        setCurrentWinner(chosenWinner);
        setIsRolling(false);

        // Add to history
        setHistory(prev => [
          {
            id: `pick-${Date.now()}`,
            student: chosenWinner,
            timestamp: Date.now(),
          },
          ...prev,
        ]);

        // Celebration sound & confetti
        playCelebrationFanfare();
        fireConfetti();
      } else {
        // Decelerate (interval becomes longer towards the end)
        if (totalRollSteps > maxSteps * 0.6) {
          currentInterval += 18;
        } else if (totalRollSteps > maxSteps * 0.3) {
          currentInterval += 7;
        }
        rollTimerRef.current = setTimeout(stepRoll, currentInterval);
      }
    };

    stepRoll();
  }, [isRolling, availablePool, fireConfetti]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, []);

  // Keyboard shortcut: Spacebar to trigger roll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        e.preventDefault();
        if (!isRolling && availablePool.length > 0) {
          startRoll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRolling, availablePool.length, startRoll]);

  // Reset pick pool (clears drawn history)
  const handleResetPool = () => {
    if (confirm('確定要重置抽籤池嗎？所有已抽出的學生將重新放回待抽籤名單。')) {
      setHistory([]);
      setCurrentWinner(null);
      setDisplayRollingName('準備抽籤');
      setDisplayRollingSeat(undefined);
    }
  };

  // Return single student to pool
  const handleReturnStudentToPool = (historyId: string) => {
    setHistory(prev => prev.filter(h => h.id !== historyId));
  };

  if (activeStudents.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-stone-200/80 shadow-xs text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 mb-2">名單中尚無出席學生</h3>
        <p className="text-sm text-stone-500 mb-6">
          請先至「學生名單」上傳 CSV、貼上名單，或確認是否有將學生標記為在席。
        </p>
        <button
          type="button"
          onClick={onNavigateToRoster}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
        >
          前往名單管理
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings & Mode Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Toggle Allow Duplicate vs No Duplicate */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">抽籤規則：</span>
          <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/80">
            <button
              id="mode-no-duplicate"
              type="button"
              onClick={() => setAllowDuplicate(false)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !allowDuplicate
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              不重複抽取（排除已抽中）
            </button>
            <button
              id="mode-allow-duplicate"
              type="button"
              onClick={() => setAllowDuplicate(true)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                allowDuplicate
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              允許重複抽取（全班循環）
            </button>
          </div>
        </div>

        {/* Stats & Pool Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-3.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs">
            <div>
              待抽學生：
              <span className={`font-bold text-sm ${availablePool.length === 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                {availablePool.length}
              </span>
              <span className="text-stone-400"> / {activeStudents.length} 人</span>
            </div>
            {!allowDuplicate && (
              <>
                <div className="w-px h-3.5 bg-stone-300" />
                <div>
                  已抽中：<span className="font-bold text-emerald-600">{history.length}</span> 人
                </div>
              </>
            )}
          </div>

          {!allowDuplicate && history.length > 0 && (
            <button
              type="button"
              onClick={handleResetPool}
              className="px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
              title="重置抽籤池，將所有人放回待抽名單"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
              重置抽籤池
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsProjectionMode(!isProjectionMode)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="開啟教室黑板/投影機大字模式"
          >
            <Maximize className="w-3.5 h-3.5 text-indigo-600" />
            投影大字模式
          </button>
        </div>
      </div>

      {/* Main Stage: Random Wheel / Card Display */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs relative overflow-hidden flex flex-col items-center justify-center min-h-[360px] text-center">
        {/* Decorative background grid subtle effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Current status tag */}
        <div className="mb-4 z-10">
          {isRolling ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              正在緊張抽選中...
            </span>
          ) : currentWinner ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              幸運抽中學生！
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              點擊下方按鈕或按鍵盤「空白鍵」開始抽籤
            </span>
          )}
        </div>

        {/* Big Rolling Name Display */}
        <div className="my-6 z-10 w-full max-w-lg">
          <div
            className={`p-8 sm:p-12 rounded-3xl transition-all duration-300 border ${
              isRolling
                ? 'bg-indigo-50/70 border-indigo-200 scale-102 shadow-lg shadow-indigo-100'
                : currentWinner
                ? 'bg-gradient-to-b from-indigo-500/10 via-white to-indigo-50/40 border-indigo-200 shadow-md shadow-indigo-100'
                : 'bg-stone-50/80 border-stone-200'
            }`}
          >
            {/* Seat Number Badge */}
            {(displayRollingSeat !== undefined || currentWinner?.seatNumber !== undefined) && (
              <div className="inline-block mb-3 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold tracking-wider uppercase shadow-xs">
                座號 {isRolling ? displayRollingSeat : (currentWinner?.seatNumber ?? displayRollingSeat)} 號
              </div>
            )}

            {/* Student Name */}
            <div
              className={`font-black tracking-tight select-none transition-all ${
                isRolling
                  ? 'text-4xl sm:text-6xl text-indigo-700 blur-[0.4px] animate-bounce'
                  : currentWinner
                  ? 'text-5xl sm:text-7xl text-stone-900 transform scale-100'
                  : 'text-4xl sm:text-5xl text-stone-400'
              }`}
            >
              {isRolling ? displayRollingName : (currentWinner ? currentWinner.name : '點擊抽籤')}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="z-10 flex flex-col sm:flex-row items-center gap-3">
          <button
            id="btn-start-roll"
            type="button"
            onClick={startRoll}
            disabled={isRolling || availablePool.length === 0}
            className={`px-8 py-4 rounded-2xl text-base font-bold shadow-md transition-all flex items-center gap-3 cursor-pointer ${
              availablePool.length === 0
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : isRolling
                ? 'bg-indigo-400 text-white cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-102 text-white shadow-indigo-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>
              {isRolling
                ? '抽選中...'
                : availablePool.length === 0
                ? '候選池已空（請重置）'
                : currentWinner
                ? '抽取下一位學生'
                : '開始抽籤'}
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono">
              Space
            </span>
          </button>

          {availablePool.length === 0 && !allowDuplicate && (
            <button
              type="button"
              onClick={handleResetPool}
              className="px-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              重新開始新一輪
            </button>
          )}
        </div>

        {/* Quick reminder text */}
        <p className="text-xs text-stone-400 mt-4 z-10">
          {allowDuplicate
            ? '目前設定：允許重複抽取，全體在席學生皆有機會被選中。'
            : `目前設定：不重複抽取，抽中者自動移出，剩餘 ${availablePool.length} 位學生。`}
        </p>
      </div>

      {/* Drawn History Section */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-stone-500" />
            <h3 className="font-bold text-stone-900 text-sm">已抽出學生名單與紀錄</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              {history.length} 位
            </span>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('確定要清除所有抽籤紀錄嗎？')) {
                  setHistory([]);
                  setCurrentWinner(null);
                }
              }}
              className="text-xs text-stone-400 hover:text-rose-600 transition-colors"
            >
              清空紀錄
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            尚未進行抽籤，抽出的學生名單將會按順序記錄於此處。
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {history.map((item, index) => {
                const order = history.length - index;
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 rounded-xl relative group transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                        第 {order} 位
                      </span>
                      {!allowDuplicate && (
                        <button
                          type="button"
                          onClick={() => handleReturnStudentToPool(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 text-[10px] transition-opacity"
                          title="放回抽籤池"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      {item.student.seatNumber && (
                        <span className="text-xs font-mono text-stone-400">
                          #{item.student.seatNumber}
                        </span>
                      )}
                      <span className="font-bold text-stone-900 text-sm truncate">
                        {item.student.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Projection Fullscreen Modal for Classroom Display */}
      {isProjectionMode && (
        <div className="fixed inset-0 z-50 bg-stone-950/95 text-white flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-200 backdrop-blur-md">
          {/* Projection Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-bold text-xs tracking-wider uppercase">
                課堂投影大字模式
              </span>
              <span className="text-stone-400 text-xs">
                待抽學生：{availablePool.length} / {activeStudents.length} 人
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsProjectionMode(false)}
              className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Minimize className="w-4 h-4" />
              <span>退出投影模式 (Esc)</span>
            </button>
          </div>

          {/* Projection Center Name Box */}
          <div className="flex flex-col items-center justify-center my-auto text-center">
            {isRolling ? (
              <div className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4 animate-pulse">
                🎲 抽選中... 🎲
              </div>
            ) : currentWinner ? (
              <div className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-4">
                🎉 抽中學生 🎉
              </div>
            ) : (
              <div className="text-stone-400 text-sm font-medium mb-4">
                準備抽籤
              </div>
            )}

            {/* Seat badge */}
            {(displayRollingSeat !== undefined || currentWinner?.seatNumber !== undefined) && (
              <div className="text-xl sm:text-2xl font-mono font-bold text-indigo-400 mb-2">
                座號 {isRolling ? displayRollingSeat : (currentWinner?.seatNumber ?? displayRollingSeat)} 號
              </div>
            )}

            {/* Huge Name */}
            <div
              className={`font-black tracking-tight select-none leading-none ${
                isRolling
                  ? 'text-7xl sm:text-9xl text-indigo-400 blur-[0.6px]'
                  : currentWinner
                  ? 'text-8xl sm:text-9xl md:text-[140px] text-white animate-in zoom-in-95 duration-300'
                  : 'text-6xl sm:text-8xl text-stone-600'
              }`}
            >
              {isRolling ? displayRollingName : (currentWinner ? currentWinner.name : '班級抽籤')}
            </div>
          </div>

          {/* Projection Bottom Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={startRoll}
              disabled={isRolling || availablePool.length === 0}
              className={`px-10 py-5 rounded-2xl text-xl font-bold shadow-lg transition-transform cursor-pointer ${
                availablePool.length === 0
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  : isRolling
                  ? 'bg-indigo-500 text-white cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 text-white shadow-indigo-600/30'
              }`}
            >
              {isRolling ? '抽選中...' : availablePool.length === 0 ? '名單已全數抽完' : '抽取學生 (Space)'}
            </button>

            {availablePool.length === 0 && !allowDuplicate && (
              <button
                type="button"
                onClick={handleResetPool}
                className="px-6 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-lg font-bold transition-transform cursor-pointer"
              >
                重置抽籤池
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
