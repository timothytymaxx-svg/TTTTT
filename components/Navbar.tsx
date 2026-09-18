'use client';

import React from 'react';
import { Sparkles, Users, UserCheck, Volume2, VolumeX, Maximize, Minimize, School } from 'lucide-react';

interface NavbarProps {
  activeTab: 'picker' | 'grouping' | 'roster';
  setActiveTab: (tab: 'picker' | 'grouping' | 'roster') => void;
  studentCount: number;
  activeStudentCount: number;
  soundMuted: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  studentCount,
  activeStudentCount,
  soundMuted,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-stone-900 tracking-tight">班級抽籤與分組小幫手</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                教師專用
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden md:block">
              在席學生：<span className="font-semibold text-emerald-600">{activeStudentCount}</span> / {studentCount} 人
            </p>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
          <button
            id="nav-tab-picker"
            type="button"
            onClick={() => setActiveTab('picker')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'picker'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>隨機抽籤</span>
          </button>

          <button
            id="nav-tab-grouping"
            type="button"
            onClick={() => setActiveTab('grouping')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'grouping'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-500" />
            <span>自動分組</span>
          </button>

          <button
            id="nav-tab-roster"
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'roster'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <UserCheck className="w-4 h-4 text-indigo-500" />
            <span>學生名單</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-xs font-medium ${
                activeTab === 'roster'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              {studentCount}
            </span>
          </button>
        </nav>

        {/* Global Controls: Sound & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium ${
              soundMuted
                ? 'border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={soundMuted ? '已靜音 (點擊開啟音效)' : '音效已開啟 (點擊靜音)'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            <span className="hidden lg:inline">{soundMuted ? '靜音中' : '音效'}</span>
          </button>

          <button
            id="btn-toggle-fullscreen"
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title={isFullscreen ? '退出全螢幕投影' : '全螢幕課堂投影'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden lg:inline">{isFullscreen ? '退出全螢幕' : '投影全螢幕'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
