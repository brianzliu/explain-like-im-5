import './globals.css';
import type { ReactNode } from 'react';
import { Baloo_2 } from 'next/font/google';

const baloo = Baloo_2({ subsets: ['latin'], variable: '--font-baloo' });

export const metadata = {
  title: "Explain it to me like I'm 5",
  description: 'Choose a teacher and learn by voice'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={baloo.variable}>
      <body className="font-rounded">{children}</body>
    </html>
  );
}

