import { Student, StudentGroup, GroupingConfig, GroupNameStyle } from '@/types/student';

export const GROUP_THEME_COLORS = [
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', lightBg: 'bg-rose-100/70', badge: 'bg-rose-600 text-white' },
  { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', lightBg: 'bg-sky-100/70', badge: 'bg-sky-600 text-white' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', lightBg: 'bg-emerald-100/70', badge: 'bg-emerald-600 text-white' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', lightBg: 'bg-amber-100/70', badge: 'bg-amber-600 text-white' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', lightBg: 'bg-purple-100/70', badge: 'bg-purple-600 text-white' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', lightBg: 'bg-teal-100/70', badge: 'bg-teal-600 text-white' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', lightBg: 'bg-indigo-100/70', badge: 'bg-indigo-600 text-white' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', lightBg: 'bg-orange-100/70', badge: 'bg-orange-600 text-white' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', lightBg: 'bg-pink-100/70', badge: 'bg-pink-600 text-white' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', lightBg: 'bg-cyan-100/70', badge: 'bg-cyan-600 text-white' },
  { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-800', lightBg: 'bg-lime-100/70', badge: 'bg-lime-600 text-white' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', lightBg: 'bg-violet-100/70', badge: 'bg-violet-600 text-white' },
];

const ANIMAL_NAMES = [
  '獅子隊 🦁', '海豚隊 🐬', '獵鷹隊 🦅', '北極熊隊 🐻', '白虎隊 🐯', 
  '神鹿隊 🦌', '靈狐隊 🦊', '飛龍隊 🐲', '鳳凰隊 🕊️', '獵豹隊 🐆',
  '大象隊 🐘', '戰狼隊 🐺', '貓頭鷹隊 🦉', '海龜隊 🐢', '赤馬隊 🐴'
];

const COLOR_NAMES = [
  '活力紅隊 🔴', '湛藍天隊 🔵', '翡翠綠隊 🟢', '璀璨金隊 🟡', '紫羅蘭隊 🟣',
  '陽光橙隊 🟠', '青檸綠隊 🍏', '粉櫻隊 🌸', '碧藍海隊 🌊', '薰衣草隊 🪻',
  '琥珀金隊 🍯', '孔雀藍隊 🦚', '珊瑚粉隊 🪸', '薄荷青隊 🌿', '星空黑隊 ⚫'
];

const CONSTELLATION_NAMES = [
  '太陽隊 ☀️', '月神隊 🌙', '北極星隊 ⭐', '獵戶座隊 🌌', '銀河隊 🪐',
  '彗星隊 ☄️', '天狼星隊 🌟', '仙女座隊 ✨', '金星隊 🔆', '火星隊 🚀',
  '織女星隊 🌠', '牛郎星隊 🔭', '晨曦隊 🌅', '極光隊 🎆', '星雲隊 💫'
];

function getGroupName(style: GroupNameStyle, index: number): string {
  switch (style) {
    case 'animal':
      return ANIMAL_NAMES[index % ANIMAL_NAMES.length];
    case 'color':
      return COLOR_NAMES[index % COLOR_NAMES.length];
    case 'constellation':
      return CONSTELLATION_NAMES[index % CONSTELLATION_NAMES.length];
    case 'number':
    default:
      return `第 ${index + 1} 組`;
  }
}

/**
 * Fisher-Yates array shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Automatically groups active students according to config
 */
export function generateGroups(students: Student[], config: GroupingConfig): StudentGroup[] {
  const activeStudents = students.filter(s => s.active !== false);
  if (activeStudents.length === 0) return [];

  const shuffled = shuffleArray(activeStudents);
  const total = shuffled.length;
  let groupCount = 1;

  if (config.mode === 'perGroup') {
    const perGroup = Math.max(1, Math.min(config.value, total));
    if (config.remainderStrategy === 'distribute') {
      groupCount = Math.max(1, Math.floor(total / perGroup));
    } else {
      groupCount = Math.max(1, Math.ceil(total / perGroup));
    }
  } else {
    // totalGroups mode
    groupCount = Math.max(1, Math.min(config.value, total));
  }

  // Initialize groups
  const groups: StudentGroup[] = Array.from({ length: groupCount }, (_, i) => ({
    id: `group-${i + 1}`,
    name: getGroupName(config.nameStyle, i),
    color: GROUP_THEME_COLORS[i % GROUP_THEME_COLORS.length],
    students: [],
  }));

  // Distribute students
  if (config.mode === 'perGroup' && config.remainderStrategy === 'isolated') {
    // Fill each group sequentially up to config.value, remainder goes to last group
    const perGroup = config.value;
    shuffled.forEach((student, index) => {
      const gIndex = Math.min(Math.floor(index / perGroup), groupCount - 1);
      groups[gIndex].students.push(student);
    });
  } else {
    // Round-robin / even distribution
    shuffled.forEach((student, index) => {
      const gIndex = index % groupCount;
      groups[gIndex].students.push(student);
    });
  }

  // Assign leaders if requested
  if (config.assignLeader) {
    groups.forEach(group => {
      if (group.students.length > 0) {
        // Random student in group as leader
        const randomLeader = group.students[Math.floor(Math.random() * group.students.length)];
        group.leaderId = randomLeader.id;
      }
    });
  }

  return groups;
}

/**
 * Move a student from their current group to another group
 */
export function moveStudent(groups: StudentGroup[], studentId: string, targetGroupId: string): StudentGroup[] {
  let movingStudent: Student | null = null;

  const newGroups = groups.map(group => {
    const found = group.students.find(s => s.id === studentId);
    if (found) {
      movingStudent = found;
      return {
        ...group,
        students: group.students.filter(s => s.id !== studentId),
        leaderId: group.leaderId === studentId ? undefined : group.leaderId,
      };
    }
    return group;
  });

  if (!movingStudent) return groups;

  return newGroups.map(group => {
    if (group.id === targetGroupId && movingStudent) {
      return {
        ...group,
        students: [...group.students, movingStudent],
      };
    }
    return group;
  });
}

/**
 * Swap two students between groups
 */
export function swapStudents(groups: StudentGroup[], studentIdA: string, studentIdB: string): StudentGroup[] {
  let studentA: Student | null = null;
  let groupAId: string | null = null;
  let studentB: Student | null = null;
  let groupBId: string | null = null;

  for (const g of groups) {
    const foundA = g.students.find(s => s.id === studentIdA);
    if (foundA) {
      studentA = foundA;
      groupAId = g.id;
    }
    const foundB = g.students.find(s => s.id === studentIdB);
    if (foundB) {
      studentB = foundB;
      groupBId = g.id;
    }
  }

  if (!studentA || !studentB || !groupAId || !groupBId || groupAId === groupBId) return groups;

  return groups.map(g => {
    if (g.id === groupAId) {
      return {
        ...g,
        students: g.students.map(s => (s.id === studentIdA ? studentB! : s)),
        leaderId: g.leaderId === studentIdA ? undefined : g.leaderId,
      };
    }
    if (g.id === groupBId) {
      return {
        ...g,
        students: g.students.map(s => (s.id === studentIdB ? studentA! : s)),
        leaderId: g.leaderId === studentIdB ? undefined : g.leaderId,
      };
    }
    return g;
  });
}
