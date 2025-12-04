import type { Metadata, Viewport } from 'next';

/**
 * FrankenKiro Root Layout
 * Halloween-themed DOOM-style FPS game
 * Requirements: All
 */

export const metadata: Metadata = {
  title: 'FrankenKiro - Halloween DOOM-Style FPS',
  description: 'A Halloween-themed first-person shooter inspired by classic DOOM. Battle reanimated creatures through haunted laboratories with stitched-together Frankenstein aesthetics.',
  keywords: ['game', 'fps', 'doom', 'halloween', 'horror', 'frankenstein', 'retro', 'shooter'],
  authors: [{ name: 'FrankenKiro Team' }],
  openGraph: {
    title: 'FrankenKiro - Halloween DOOM-Style FPS',
    description: 'Battle through haunted laboratories in this Halloween-themed retro FPS!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FrankenKiro - Halloween DOOM-Style FPS',
    description: 'Battle through haunted laboratories in this Halloween-themed retro FPS!',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a0a1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <style>{`
          /* Global stitched theme animations */
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 10px currentColor; }
            50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
          }
          
          @keyframes flicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
            75% { opacity: 0.9; }
          }
          
          /* Stitched button hover effects */
          button:hover {
            filter: brightness(1.1);
          }
          
          button:active {
            transform: scale(0.98) !important;
          }
          
          /* Selection styling */
          ::selection {
            background: #4ade80;
            color: #1a0a1a;
          }
        `}</style>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#1a0a1a',
          fontFamily: '"Courier New", Courier, monospace',
        }}
      >
        {children}
      </body>
    </html>
  );
}
