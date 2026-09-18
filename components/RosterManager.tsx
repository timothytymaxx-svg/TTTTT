'use client';

import React, { useState, useRef } from 'react';
import { Student } from '@/types/student';
import { parseRosterText, parseCsvFile, exportRosterToCsv, DEFAULT_STUDENT_ROSTER } from '@/lib/roster-parser';
import { 
  UploadCloud, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onShowPicker: () => void;
  onShowGrouping: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onShowPicker,
  onShowGrouping,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSeat, setNewStudentSeat] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSeat, setEditSeat] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered students based on search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.seatNumber && s.seatNumber.toString().includes(searchQuery))
  );

  const activeCount = students.filter(s => s.active !== false).length;
  const absentCount = students.length - activeCount;

  // Handle CSV file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseCsvFile(file);
      if (parsed.length > 0) {
        onUpdateStudents(parsed);
        setImportStatus(`成功匯入 ${parsed.length} 位學生！`);
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus('檔案中未找到有效的學生姓名，請確認格式');
      }
    } catch {
      setImportStatus('匯入失敗，請確認是否為標準 CSV 或純文字檔');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseCsvFile(file);
      if (parsed.length > 0) {
        onUpdateStudents(parsed);
        setImportStatus(`成功自拖曳檔案匯入 ${parsed.length} 位學生！`);
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus('檔案中未找到有效姓名');
      }
    } catch {
      setImportStatus('無法解析該檔案');
    }
  };

  // Handle text paste parsing
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const parsed = parseRosterText(pasteText);
    if (parsed.length > 0) {
      onUpdateStudents(parsed);
      setPasteText('');
      setImportStatus(`成功解析並載入 ${parsed.length} 位學生！`);
      setTimeout(() => setImportStatus(null), 4000);
    } else {
      setImportStatus('未能解析出學生姓名，請檢查輸入內容');
    }
  };

  // Append paste to existing students
  const handleAppendPaste = () => {
    if (!pasteText.trim()) return;
    const parsed = parseRosterText(pasteText);
    if (parsed.length > 0) {
      const currentMaxSeat = students.reduce((max, s) => Math.max(max, s.seatNumber || 0), 0);
      const reindexed = parsed.map((s, idx) => ({
        ...s,
        seatNumber: currentMaxSeat + idx + 1,
      }));
      onUpdateStudents([...students, ...reindexed]);
      setPasteText('');
      setImportStatus(`已將 ${parsed.length} 位學生加入現有名單！`);
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  // Toggle active / absent status
  const handleToggleActive = (id: string) => {
    onUpdateStudents(
      students.map(s => (s.id === id ? { ...s, active: s.active === false ? true : false } : s))
    );
  };

  // Delete single student
  const handleDeleteStudent = (id: string) => {
    onUpdateStudents(students.filter(s => s.id !== id));
  };

  // Add individual student
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const nextSeat = newStudentSeat ? parseInt(newStudentSeat, 10) : (students.length > 0 ? Math.max(...students.map(s => s.seatNumber || 0)) + 1 : 1);
    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      seatNumber: nextSeat,
      name: newStudentName.trim(),
      active: true,
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
    setNewStudentSeat('');
  };

  // Start inline editing
  const handleStartEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditSeat(student.seatNumber || 0);
  };

  // Save inline edit
  const handleSaveEdit = (id: string) => {
    onUpdateStudents(
      students.map(s => (s.id === id ? { ...s, name: editName.trim() || s.name, seatNumber: editSeat || s.seatNumber } : s))
    );
    setEditingId(null);
  };

  // Load demo class
  const handleLoadDemo = () => {
    onUpdateStudents(DEFAULT_STUDENT_ROSTER);
    setImportStatus(`已載入範例班級名單（共 28 位學生）`);
    setTimeout(() => setImportStatus(null), 4000);
  };

  // Clear all students
  const handleClearAll = () => {
    if (students.length === 0) return;
    if (confirm('確定要清空所有學生名單嗎？')) {
      onUpdateStudents([]);
      setImportStatus('已清空學生名單');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (students.length === 0) return;
    const csvContent = exportRosterToCsv(students);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions & Stats */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <span>學生名單管理</span>
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-stone-400 hover:text-stone-600 p-1"
                title="查看支援格式與使用說明"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              可上傳 Excel 導出的 CSV 檔，或直接複製貼上學生姓名。設定出席狀態後即可進行抽籤或分組。
            </p>
          </div>

          {/* Counts and Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-3 px-3.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs">
              <div>
                總計：<span className="font-bold text-stone-800">{students.length}</span> 人
              </div>
              <div className="w-px h-3.5 bg-stone-300" />
              <div>
                在席：<span className="font-bold text-emerald-600">{activeCount}</span> 人
              </div>
              {absentCount > 0 && (
                <>
                  <div className="w-px h-3.5 bg-stone-300" />
                  <div>
                    請假：<span className="font-bold text-amber-600">{absentCount}</span> 人
                  </div>
                </>
              )}
            </div>

            {/* Direct Jump Buttons */}
            {activeCount > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onShowPicker}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  開始抽籤
                </button>
                <button
                  type="button"
                  onClick={onShowGrouping}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  自動分組
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Format Help Collapse */}
        {showHelp && (
          <div className="mt-4 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
            <p className="font-bold mb-1">支援的名單匯入格式：</p>
            <ul className="list-disc list-inside space-y-0.5 text-stone-700">
              <li><strong>標準 CSV 檔案：</strong>包含「座號,姓名」或僅「姓名」單一欄位皆可自動識別。</li>
              <li><strong>純文字換行：</strong>每一行一位學生，例如「陳冠宇\n林怡君\n張庭瑋」。</li>
              <li><strong>帶編號清單：</strong>如「1. 王小明」、「02 李大華」、「3 - 張美麗」。</li>
              <li><strong>逗號或頓號分隔：</strong>如「陳冠宇、林怡君、張庭瑋」。</li>
            </ul>
          </div>
        )}

        {/* Import Notification Banner */}
        {importStatus && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Grid: Upload CSV & Paste Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: CSV File Upload */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-white rounded-2xl p-6 border-2 transition-all flex flex-col justify-between ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50/40 shadow-md' 
              : 'border-dashed border-stone-300 hover:border-indigo-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-stone-900 text-base">上傳 CSV 名單檔案</h3>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              可直接拖曳檔案至此區域，或點擊下方按鈕選擇電腦中的 CSV / TXT 檔案。
            </p>

            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-stone-800">
                將 CSV 檔案拖曳至此，或點擊選取
              </p>
              <p className="text-xs text-stone-400 mt-1">支援 .csv 與 .txt 檔案格式</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt,text/csv,text/plain"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              選擇 CSV 檔案
            </button>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="載入 28 位常見學生姓名以便立即體驗"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              載入示範名單
            </button>
          </div>
        </div>

        {/* Method 2: Direct Text Paste */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-stone-900 text-base">直接貼上學生名單</h3>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              從 Excel、Google 試算表或 Word 複製學生姓名，直接貼在下方文字框中。
            </p>

            <textarea
              id="roster-paste-textarea"
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="例如：&#10;1. 陳冠宇&#10;2. 林怡君&#10;3. 張庭瑋&#10;（或每行一個名字、逗號隔開）"
              className="w-full text-xs font-mono p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setPasteText('')}
              disabled={!pasteText}
              className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 disabled:opacity-40"
            >
              清空文字
            </button>
            <button
              type="button"
              onClick={handleAppendPaste}
              disabled={!pasteText.trim()}
              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
              title="將貼上的學生加在現有名單之後"
            >
              追加至現有名單
            </button>
            <button
              type="button"
              onClick={handleParsePaste}
              disabled={!pasteText.trim()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              覆蓋並載入名單
            </button>
          </div>
        </div>
      </div>

      {/* Student List View & Management */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋姓名或座號..."
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-stone-500 hover:text-stone-700"
              >
                清除搜尋
              </button>
            )}
          </div>

          {/* Quick List Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={students.length === 0}
              className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              title="匯出為 CSV 試算表檔案"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              匯出 CSV
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={students.length === 0}
              className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清空名單
            </button>
          </div>
        </div>

        {/* Inline Add Student Form */}
        <form onSubmit={handleAddSingleStudent} className="px-5 py-3 border-b border-stone-100 bg-indigo-50/30 flex items-center gap-3">
          <div className="w-16">
            <input
              type="number"
              min="1"
              value={newStudentSeat}
              onChange={(e) => setNewStudentSeat(e.target.value)}
              placeholder="座號"
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
            />
          </div>
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="輸入新學生姓名（按 Enter 加入）..."
              className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!newStudentName.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-2xs transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            新增學生
          </button>
        </form>

        {/* Student List Content */}
        {students.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-stone-600">目前尚無學生名單</p>
            <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
              請從上方上傳 CSV、直接貼上名單，或點擊「載入示範名單」快速開始！
            </p>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              立即載入 28 人示範班級
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="sticky top-0 bg-stone-100/90 backdrop-blur text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4 w-16 text-center">座號</th>
                  <th className="py-2.5 px-4">學生姓名</th>
                  <th className="py-2.5 px-4 w-28 text-center">參與狀態</th>
                  <th className="py-2.5 px-4 w-32 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredStudents.map((student, idx) => {
                  const isEditing = editingId === student.id;
                  const isAbsent = student.active === false;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isAbsent ? 'bg-stone-50/40 text-stone-400 opacity-70' : ''
                      }`}
                    >
                      {/* Seat number */}
                      <td className="py-2.5 px-4 text-center font-mono font-medium text-stone-500">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={editSeat}
                            onChange={(e) => setEditSeat(parseInt(e.target.value, 10) || 0)}
                            className="w-12 text-center p-1 border border-stone-300 rounded text-xs"
                          />
                        ) : (
                          student.seatNumber ?? idx + 1
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-4 font-medium text-stone-900">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(student.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="px-2 py-1 border border-indigo-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(student.id)}
                              className="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs"
                            >
                              儲存
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-2 py-0.5 text-stone-500 hover:text-stone-700 text-xs"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${isAbsent ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                              {student.name}
                            </span>
                            {isAbsent && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-normal">
                                請假不參與
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Active / Absent Toggle */}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(student.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                            isAbsent
                              ? 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                          }`}
                          title={isAbsent ? '點擊設為在席 (參與抽籤與分組)' : '點擊標記請假/缺席 (排除在抽籤與分組外)'}
                        >
                          {isAbsent ? (
                            <>
                              <XCircle className="w-3 h-3 text-stone-400" />
                              <span>請假中</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>在席出席</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(student)}
                              className="text-stone-400 hover:text-indigo-600 transition-colors p-1"
                              title="編輯學生姓名與座號"
                            >
                              編輯
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                            title="刪除此學生"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
