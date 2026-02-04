import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AudioProvider } from '@/context/AudioContext';
import { Toaster } from 'react-hot-toast';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'WebStar - One Professional Identity in One Link',
  description: 'Build your unified digital identity and showcase your work in one place',
  icons: {
    icon: [
      { url: '/webstar_square.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: '512x512' }
    ],
    apple: { url: '/webstar_square.png', sizes: '512x512', type: 'image/png' },
    shortcut: '/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#111111', color: 'rgba(255, 255, 255, 0.95)' }}>
        <AuthProvider>
          <AudioProvider>
            {children}
            <GlobalAudioPlayer />
            <Toaster position="top-center" />
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

