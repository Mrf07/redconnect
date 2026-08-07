import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'RedConnect',
  description: 'RedConnect application with Vercel Analytics',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
