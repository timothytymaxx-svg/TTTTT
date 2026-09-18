export interface Student {
  id: string;
  name: string;
  seatNumber?: number;
  active?: boolean; // If false, excluded from picking/grouping (e.g. absent)
}

export interface PickHistoryItem {
  id: string;
  student: Student;
  timestamp: number;
}

export type GroupingMode = 'perGroup' | 'totalGroups';
export type RemainderStrategy = 'distribute' | 'isolated';
export type GroupNameStyle = 'number' | 'animal' | 'color' | 'constellation';

export interface GroupingConfig {
  mode: GroupingMode;
  value: number;
  remainderStrategy: RemainderStrategy;
  nameStyle: GroupNameStyle;
  assignLeader: boolean;
}

export interface StudentGroup {
  id: string;
  name: string;
  color: {
    bg: string;
    border: string;
    text: string;
    lightBg: string;
    badge: string;
  };
  leaderId?: string;
  students: Student[];
}
