import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space',
});

export const metadata: Metadata = {
  title: 'Velvet Sentinel Dashboard',
  description: 'AI Agent Orchestration Platform for DeFi Security',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-[#0a0a0f] text-white min-h-screen antialiased`}>
        {/* Animated gradient background */}
        <div className="fixed inset-0 -z-10">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]" />
          
          {/* Purple orb - top left */}
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-600/20 blur-[100px] animate-pulse" />
          
          {/* Blue orb - bottom right */}
          <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-blue-600/15 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Cyan orb - center right */}
          <div className="absolute right-1/4 top-1/3 h-60 w-60 rounded-full bg-cyan-600/10 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Pink orb - bottom left */}
          <div className="absolute bottom-1/4 left-1/4 h-60 w-60 rounded-full bg-pink-600/10 blur-[80px] animate-pulse" style={{ animationDelay: '3s' }} />
        </div>
        
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
