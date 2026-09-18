import { Student } from '@/types/student';

export const DEFAULT_STUDENT_ROSTER: Student[] = [
  { id: 'std-1', seatNumber: 1, name: '陳冠宇', active: true },
  { id: 'std-2', seatNumber: 2, name: '林怡君', active: true },
  { id: 'std-3', seatNumber: 3, name: '張庭瑋', active: true },
  { id: 'std-4', seatNumber: 4, name: '黃馨儀', active: true },
  { id: 'std-5', seatNumber: 5, name: '李柏翰', active: true },
  { id: 'std-6', seatNumber: 6, name: '吳若涵', active: true },
  { id: 'std-7', seatNumber: 7, name: '劉家豪', active: true },
  { id: 'std-8', seatNumber: 8, name: '蔡佩珊', active: true },
  { id: 'std-9', seatNumber: 9, name: '楊子萱', active: true },
  { id: 'std-10', seatNumber: 10, name: '鄭宇軒', active: true },
  { id: 'std-11', seatNumber: 11, name: '許雅婷', active: true },
  { id: 'std-12', seatNumber: 12, name: '謝承翰', active: true },
  { id: 'std-13', seatNumber: 13, name: '洪心怡', active: true },
  { id: 'std-14', seatNumber: 14, name: '曾柏翔', active: true },
  { id: 'std-15', seatNumber: 15, name: '邱美玲', active: true },
  { id: 'std-16', seatNumber: 16, name: '廖偉廷', active: true },
  { id: 'std-17', seatNumber: 17, name: '賴佳慧', active: true },
  { id: 'std-18', seatNumber: 18, name: '徐志豪', active: true },
  { id: 'std-19', seatNumber: 19, name: '周思廷', active: true },
  { id: 'std-20', seatNumber: 20, name: '葉冠良', active: true },
  { id: 'std-21', seatNumber: 21, name: '莊惠雯', active: true },
  { id: 'std-22', seatNumber: 22, name: '郭品妤', active: true },
  { id: 'std-23', seatNumber: 23, name: '何建宏', active: true },
  { id: 'std-24', seatNumber: 24, name: '蘇詩婷', active: true },
  { id: 'std-25', seatNumber: 25, name: '潘宣豪', active: true },
  { id: 'std-26', seatNumber: 26, name: '彭雅淳', active: true },
  { id: 'std-27', seatNumber: 27, name: '粘睿恩', active: true },
  { id: 'std-28', seatNumber: 28, name: '柯佳穎', active: true },
];

/**
 * Parses raw text input (from paste area or CSV content).
 * Handles:
 * - CSV formats (comma, tab, semicolon)
 * - Headers like "座號,姓名", "Name, Seat", etc.
 * - Numbered lines like "1. 陳冠宇" or "01 王小明"
 * - Simple line-separated or comma/頓號 separated names
 */
export function parseRosterText(raw: string): Student[] {
  if (!raw || !raw.trim()) return [];

  const lines = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const students: Student[] = [];
  let seatCounter = 1;

  // Check if first line looks like a header (e.g. 座號,姓名 or Name, ID)
  let startIndex = 0;
  const firstLineLower = lines[0].toLowerCase();
  const headerKeywords = ['座號', '姓名', '學號', '名字', 'name', 'seat', 'number', 'no', 'id', 'student'];
  const hasHeader = headerKeywords.some(keyword => firstLineLower.includes(keyword));

  if (hasHeader && lines.length > 1) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];

    // Case 1: Line contains delimiter like comma, tab, or semicolon
    let delimiter: string | null = null;
    if (line.includes('\t')) delimiter = '\t';
    else if (line.includes(',')) delimiter = ',';
    else if (line.includes(';')) delimiter = ';';
    else if (line.includes('、')) delimiter = '、';

    if (delimiter && delimiter !== '、') {
      const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      if (parts.length >= 2) {
        // Find which part is number and which is name
        const numPart = parts.find(p => /^\d+$/.test(p));
        const namePart = parts.find(p => !/^\d+$/.test(p) && p.length > 0) || parts[1];
        const parsedSeat = numPart ? parseInt(numPart, 10) : seatCounter++;

        if (namePart) {
          students.push({
            id: `std-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            seatNumber: parsedSeat,
            name: namePart,
            active: true,
          });
          continue;
        }
      } else if (parts.length === 1) {
        // Single column CSV
        const cleanName = cleanSingleName(parts[0]);
        if (cleanName) {
          students.push({
            id: `std-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            seatNumber: seatCounter++,
            name: cleanName,
            active: true,
          });
          continue;
        }
      }
    }

    // Case 2: Line might have multiple names separated by comma or 頓號 on a single line
    if (line.includes('、') || (line.includes(',') && !/\d/.test(line))) {
      const subNames = line.split(/[,、，]/).map(s => s.trim()).filter(Boolean);
      for (const s of subNames) {
        const cleanName = cleanSingleName(s);
        if (cleanName) {
          students.push({
            id: `std-${Date.now()}-${students.length}-${Math.random().toString(36).substring(2, 6)}`,
            seatNumber: seatCounter++,
            name: cleanName,
            active: true,
          });
        }
      }
      continue;
    }

    // Case 3: Line like "1. 陳冠宇", "01. 陳冠宇", "1 王大明", "1 - 李小華", or just "陳冠宇"
    const numberPrefixMatch = line.match(/^(\d+)[\.\s、\-_:\/]+(.+)$/);
    if (numberPrefixMatch) {
      const parsedSeat = parseInt(numberPrefixMatch[1], 10);
      const name = numberPrefixMatch[2].trim();
      if (name) {
        students.push({
          id: `std-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          seatNumber: parsedSeat,
          name: name,
          active: true,
        });
        continue;
      }
    }

    // Case 4: Plain name
    const cleaned = cleanSingleName(line);
    if (cleaned) {
      students.push({
        id: `std-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        seatNumber: seatCounter++,
        name: cleaned,
        active: true,
      });
    }
  }

  // Deduplicate and re-index seat numbers if needed
  return students;
}

function cleanSingleName(val: string): string {
  return val.trim().replace(/^["']|["']$/g, '');
}

/**
 * Parse an uploaded CSV file (handles UTF-8, Big5, and common encodings)
 */
export async function parseCsvFile(file: File): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const students = parseRosterText(text);
        resolve(students);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      // If utf-8 failed, try reading with Big-5 or fallback
      const fallbackReader = new FileReader();
      fallbackReader.onload = (e2) => {
        try {
          const text = e2.target?.result as string;
          resolve(parseRosterText(text));
        } catch (err2) {
          reject(err2);
        }
      };
      fallbackReader.onerror = () => reject(new Error('無法讀取該檔案'));
      fallbackReader.readAsText(file, 'Big5');
    };

    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Exports current student roster to formatted CSV with BOM for Excel compatibility
 */
export function exportRosterToCsv(students: Student[]): string {
  const header = '座號,姓名,狀態\n';
  const rows = students
    .map((s, idx) => `${s.seatNumber ?? idx + 1},"${s.name.replace(/"/g, '""')}",${s.active !== false ? '在席' : '請假'}`)
    .join('\n');
  return '\uFEFF' + header + rows;
}
