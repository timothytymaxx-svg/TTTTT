'use client';

import React, { useState, useEffect } from 'react';
import { Student, StudentGroup, GroupingConfig, GroupNameStyle, RemainderStrategy } from '@/types/student';
import { generateGroups, moveStudent, swapStudents } from '@/lib/grouping';
import { playWhooshSound } from '@/lib/audio';
import { 
  Users, 
  Shuffle, 
  Copy, 
  Check, 
  Crown, 
  ArrowRightLeft, 
  MoveRight, 
  Printer, 
  SlidersHorizontal,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AutoGroupingProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

export const AutoGrouping: React.FC<AutoGroupingProps> = ({
  students,
  onNavigateToRoster,
}) => {
  const activeStudents = students.filter(s => s.active !== false);

  // Grouping configuration
  const [config, setConfig] = useState<GroupingConfig>({
    mode: 'perGroup',
    value: 4, // 4 students per group by default
    remainderStrategy: 'distribute',
    nameStyle: 'number',
    assignLeader: false,
  });

  // Current generated groups - initialized on load
  const [groups, setGroups] = useState<StudentGroup[]>(() => {
    return generateGroups(activeStudents, config);
  });
  const [copied, setCopied] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // Moving student state (for manual adjustment)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Generate initial grouping when students change or first load if groups are empty
  const handleGenerateGroups = () => {
    if (activeStudents.length === 0) return;
    setIsShuffling(true);
    playWhooshSound();

    setTimeout(() => {
      const generated = generateGroups(activeStudents, config);
      setGroups(generated);
      setIsShuffling(false);
    }, 200);
  };

  // Handle student move
  const handleMove = (studentId: string, targetGroupId: string) => {
    setGroups(prev => moveStudent(prev, studentId, targetGroupId));
    setSelectedStudentId(null);
  };

  // Toggle leader
  const handleToggleLeader = (groupId: string, studentId: string) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            leaderId: g.leaderId === studentId ? undefined : studentId,
          };
        }
        return g;
      })
    );
  };

  // Copy groups to clipboard
  const handleCopyText = () => {
    if (groups.length === 0) return;

    let text = `📋 班級分組名單（共 ${groups.length} 組 / ${activeStudents.length} 人）\n\n`;
    groups.forEach(g => {
      const studentNames = g.students.map(s => {
        const isLeader = g.leaderId === s.id;
        return `${s.name}${isLeader ? ' (組長 👑)' : ''}`;
      });
      text += `【${g.name}】(${g.students.length}人)：${studentNames.join('、')}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Quick print handler
  const handlePrint = () => {
    window.print();
  };

  // Estimate number of groups and sizes based on current settings
  const calculateEstimate = () => {
    const total = activeStudents.length;
    if (total === 0) return { groupCount: 0, previewText: '' };

    if (config.mode === 'perGroup') {
      const perGroup = config.value;
      if (config.remainderStrategy === 'distribute') {
        const groupCount = Math.max(1, Math.floor(total / perGroup));
        const rem = total % perGroup;
        if (rem === 0) {
          return { groupCount, previewText: `共分 ${groupCount} 組，每組剛好 ${perGroup} 人` };
        } else {
          return { 
            groupCount, 
            previewText: `共分 ${groupCount} 組（其中 ${rem} 組為 ${perGroup + 1} 人，其餘每組 ${perGroup} 人）` 
          };
        }
      } else {
        const groupCount = Math.max(1, Math.ceil(total / perGroup));
        const rem = total % perGroup;
        if (rem === 0) {
          return { groupCount, previewText: `共分 ${groupCount} 組，每組 ${perGroup} 人` };
        } else {
          return { 
            groupCount, 
            previewText: `共分 ${groupCount} 組（前 ${groupCount - 1} 組每組 ${perGroup} 人，最後一組 ${rem} 人）` 
          };
        }
      }
    } else {
      const groupCount = Math.min(config.value, total);
      const base = Math.floor(total / groupCount);
      const rem = total % groupCount;
      if (rem === 0) {
        return { groupCount, previewText: `共分 ${groupCount} 組，每組均為 ${base} 人` };
      } else {
        return { 
          groupCount, 
          previewText: `共分 ${groupCount} 組（${rem} 組為 ${base + 1} 人，其餘為 ${base} 人）` 
        };
      }
    }
  };

  const estimate = calculateEstimate();

  if (activeStudents.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-stone-200/80 shadow-xs text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 mb-2">名單中尚無出席學生</h3>
        <p className="text-sm text-stone-500 mb-6">
          請先至「學生名單」上傳 CSV 或貼上名單後，即可開始進行分組。
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
      {/* Configuration Card */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>自動分組設定</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              現有在席學生 <span className="font-bold text-emerald-600">{activeStudents.length}</span> 人，設定分組規則後點擊「重新分組」即可隨機洗牌。
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              id="btn-generate-groups"
              type="button"
              onClick={handleGenerateGroups}
              disabled={isShuffling}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{groups.length > 0 ? '重新洗牌分組' : '開始分組'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              disabled={groups.length === 0}
              className="px-4 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="複製所有分組結果，方便貼至 LINE、Google Classroom 或聯絡簿"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copied ? '已複製名單！' : '複製分組名單'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={groups.length === 0}
              className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="列印當前分組結果"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">列印名單</span>
            </button>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          {/* Setting 1: Grouping Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              分組方式
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'perGroup' })}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  config.mode === 'perGroup'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                每組人數
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'totalGroups' })}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  config.mode === 'totalGroups'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                總共組數
              </button>
            </div>
          </div>

          {/* Setting 2: Target Number (Number of students per group or Total groups) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700">
              {config.mode === 'perGroup' ? '每組人數設定：' : '預計總組數設定：'}
              <span className="text-indigo-600 font-extrabold text-sm ml-1">
                {config.value} {config.mode === 'perGroup' ? '人' : '組'}
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={config.mode === 'perGroup' ? 2 : 2}
                max={config.mode === 'perGroup' ? Math.max(8, Math.min(15, activeStudents.length)) : Math.min(12, activeStudents.length)}
                value={config.value}
                onChange={(e) => setConfig({ ...config, value: parseInt(e.target.value, 10) || 2 })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, value: Math.max(2, config.value - 1) })}
                  className="w-7 h-7 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-bold text-sm flex items-center justify-center"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, value: Math.min(activeStudents.length, config.value + 1) })}
                  className="w-7 h-7 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-bold text-sm flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Setting 3: Remainder Handling (if perGroup mode) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700">餘數分配方式</label>
            <select
              value={config.remainderStrategy}
              onChange={(e) => setConfig({ ...config, remainderStrategy: e.target.value as RemainderStrategy })}
              disabled={config.mode === 'totalGroups'}
              className="w-full text-xs py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="distribute">平均分配至各組（各組人數最接近）</option>
              <option value="isolated">多出人數獨立成組（最後一組人數較少）</option>
            </select>
          </div>

          {/* Setting 4: Team Naming Style & Leader */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700">隊伍命名與組長</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={config.nameStyle}
                onChange={(e) => setConfig({ ...config, nameStyle: e.target.value as GroupNameStyle })}
                className="text-xs py-2 px-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="number">數字組別 (第1組...)</option>
                <option value="animal">動物戰隊 🦁</option>
                <option value="color">繽紛色彩 🔴</option>
                <option value="constellation">宇宙星空 ☀️</option>
              </select>

              <button
                type="button"
                onClick={() => setConfig({ ...config, assignLeader: !config.assignLeader })}
                className={`text-xs py-2 px-2 rounded-xl border flex items-center justify-center gap-1 font-medium transition-colors ${
                  config.assignLeader
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
                title="自動隨機指派每組一位同學為組長"
              >
                <Crown className={`w-3.5 h-3.5 ${config.assignLeader ? 'text-amber-600' : 'text-stone-400'}`} />
                <span>隨機組長</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estimate Preview Bar */}
        <div className="mt-5 p-3 bg-indigo-50/60 border border-indigo-100/80 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>預估結果：{estimate.previewText}</span>
          </div>
          <span className="text-[11px] text-stone-500 hidden sm:inline">
            ※ 點擊學生姓名可自由調整至其他組別或指定為組長
          </span>
        </div>
      </div>

      {/* Visualized Groups Grid */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200/80 text-center text-stone-400">
          <p className="text-sm font-medium text-stone-600">尚未產生分組</p>
          <p className="text-xs text-stone-400 mt-1">
            點擊上方「開始分組」按鈕即可為全班同學自動分組。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {groups.map((group, groupIdx) => {
            return (
              <div
                key={group.id}
                className={`rounded-2xl border ${group.color.border} bg-white shadow-xs overflow-hidden transition-all hover:shadow-md flex flex-col justify-between`}
              >
                {/* Group Card Header */}
                <div className={`p-4 ${group.color.bg} border-b ${group.color.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg ${group.color.badge} flex items-center justify-center font-bold text-xs shadow-2xs`}>
                      {groupIdx + 1}
                    </span>
                    <h3 className={`font-bold text-base ${group.color.text} tracking-tight`}>
                      {group.name}
                    </h3>
                  </div>

                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/90 border border-stone-200 text-stone-700">
                    {group.students.length} 人
                  </span>
                </div>

                {/* Group Members List */}
                <div className="p-4 flex-1 space-y-2">
                  {group.students.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                      暫無組員（可從其他組別調動過來）
                    </div>
                  ) : (
                    group.students.map((student) => {
                      const isLeader = group.leaderId === student.id;
                      const isSelected = selectedStudentId === student.id;

                      return (
                        <div
                          key={student.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400'
                              : isLeader
                              ? 'bg-amber-50/60 border-amber-200/90'
                              : 'bg-stone-50/80 hover:bg-stone-100/70 border-stone-200/70'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {student.seatNumber && (
                              <span className="text-[11px] font-mono font-semibold text-stone-400 w-6 text-center">
                                #{student.seatNumber}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-stone-900 truncate">
                              {student.name}
                            </span>
                            {isLeader && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold">
                                <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                                組長
                              </span>
                            )}
                          </div>

                          {/* Member Quick Actions */}
                          <div className="flex items-center gap-1">
                            {/* Make Leader Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleLeader(group.id, student.id)}
                              className={`p-1 rounded transition-colors text-xs ${
                                isLeader
                                  ? 'text-amber-600 hover:text-amber-700'
                                  : 'text-stone-300 hover:text-amber-500'
                              }`}
                              title={isLeader ? '取消組長' : '設為組長'}
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>

                            {/* Move to another group selector */}
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleMove(student.id, e.target.value);
                                }
                              }}
                              className="text-[11px] py-0.5 px-1 bg-white border border-stone-200 rounded text-stone-600 cursor-pointer hover:border-indigo-400 focus:outline-none"
                              title="移動此學生至其他組別"
                            >
                              <option value="">移組...</option>
                              {groups
                                .filter(g => g.id !== group.id)
                                .map(targetGroup => (
                                  <option key={targetGroup.id} value={targetGroup.id}>
                                    移至 {targetGroup.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Group Card Footer */}
                <div className="px-4 py-2.5 bg-stone-50/70 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
                  <span>
                    組長：{group.leaderId ? group.students.find(s => s.id === group.leaderId)?.name || '無' : '未指派'}
                  </span>
                  <span className="text-stone-400">
                    佔比 {Math.round((group.students.length / activeStudents.length) * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
