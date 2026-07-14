import type { Metadata } from 'next';
import './globals.css';
import { MockProvider } from '@/components/providers/MockProvider';

export const metadata: Metadata = {
  title: '灵犀服务台 - AI 原生 IT 服务管理',
  description: 'AI 原生的 ITSM SaaS 平台，让企业内部服务更高效',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <MockProvider />
        {children}
      </body>
    </html>
  );
}
