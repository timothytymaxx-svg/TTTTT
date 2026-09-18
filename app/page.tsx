'use client';

import React, { useState, useEffect } from 'react';
import { Student } from '@/types/student';
import { DEFAULT_STUDENT_ROSTER } from '@/lib/roster-parser';
import { Navbar } from '@/components/Navbar';
import { RandomPicker } from '@/components/RandomPicker';
import { AutoGrouping } from '@/components/AutoGrouping';
import { RosterManager } from '@/components/RosterManager';
import { getSoundMuted, setSoundMuted } from '@/lib/audio';

export default function Home() {
  const [students, setStudents] = useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedRoster = localStorage.getItem('classroom_students_roster');
        if (storedRoster) {
          const parsed = JSON.parse(storedRoster);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_STUDENT_ROSTER;
  });
  const [activeTab, setActiveTab] = useState<'picker' | 'grouping' | 'roster'>('picker');
  const [soundMuted, setSoundMutedState] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? getSoundMuted() : false;
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Synchronize fullscreen state
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Persist students whenever changed
  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    try {
      localStorage.setItem('classroom_students_roster', JSON.stringify(newStudents));
    } catch {
      // localStorage quota or error
    }
  };

  // Toggle sound
  const handleToggleSound = () => {
    const nextState = !soundMuted;
    setSoundMutedState(nextState);
    setSoundMuted(nextState);
  };

  // Toggle browser fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const activeStudentCount = students.filter(s => s.active !== false).length;

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-800 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
        activeStudentCount={activeStudentCount}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'grouping' && (
          <AutoGrouping
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={handleUpdateStudents}
            onShowPicker={() => setActiveTab('picker')}
            onShowGrouping={() => setActiveTab('grouping')}
          />
        )}
      </main>

      {/* Subtle Teacher Tool Footer */}
      <footer className="w-full py-5 border-t border-stone-200/80 text-center text-xs text-stone-400 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>班級抽籤與分組小幫手 ── 支援 CSV 匯入、動畫音效、不重複抽籤與視覺化分組</p>
          <p className="text-stone-400">
            按鍵盤 <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono text-[10px]">Space</kbd> 可快速觸發抽籤
          </p>
        </div>
      </footer>
    </div>
  );
}
