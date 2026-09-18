import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: '班級抽籤與分組小幫手 | Classroom Picker & Grouping',
  description: '專為課堂設計的學生抽籤與自動分組工具，支援 CSV 上傳與名單貼上、抽籤動畫音效與不重複設定、以及視覺化分組展示。',
  openGraph: {
    title: '班級抽籤與分組小幫手 | Classroom Picker & Grouping',
    description: '專為課堂設計的學生抽籤與自動分組工具，支援 CSV 上傳與名單貼上、抽籤動畫音效與不重複設定、以及視覺化分組展示。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '班級抽籤與分組小幫手',
    description: '專為課堂設計的學生抽籤與自動分組工具，支援 CSV 上傳與名單貼上、抽籤動畫音效與不重複設定、以及視覺化分組展示。',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
