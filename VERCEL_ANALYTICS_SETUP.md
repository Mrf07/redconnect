# Vercel Web Analytics Setup Guide

## Package Installed ✅

The `@vercel/analytics` package (v2.0.1) has been successfully installed and added to your dependencies.

## Integration Instructions

Since this is a Next.js project, you need to add the Analytics component to your application. Choose the appropriate method based on your Next.js setup:

### Option 1: Next.js App Router (Recommended for Next.js 13+)

If using the App Router, add the Analytics component to your root layout file:

**File: `app/layout.tsx` (or `app/layout.jsx`)**

```typescript
import { Analytics } from '@vercel/analytics/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Option 2: Next.js Pages Router

If using the Pages Router, add the Analytics component to your `_app` file:

**File: `pages/_app.tsx` (or `pages/_app.jsx`)**

```typescript
import { Analytics } from '@vercel/analytics/next';
import type { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

### Option 3: React (Without Next.js)

If this is a standalone React app (not using Next.js):

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <div>
      {/* Your app content */}
      <Analytics />
    </div>
  );
}
```

## Deployment

Once you've added the Analytics component:

1. Commit your changes
2. Deploy to Vercel: `vercel deploy`
3. View analytics in your Vercel dashboard under the Analytics tab

## Additional Configuration (Optional)

### Development Mode

By default, analytics only track in production. To enable in development:

```typescript
<Analytics mode="development" />
```

### Custom Configuration

```typescript
<Analytics
  beforeSend={(event) => {
    // Filter or modify events before sending
    return event;
  }}
  debug={false} // Enable debug mode
/>
```

## Verification

After deployment, you can verify analytics are working by:
1. Visiting your deployed site
2. Navigating between pages
3. Checking the Vercel dashboard Analytics section after a few minutes

## Documentation

For more information, visit: https://vercel.com/docs/analytics/quickstart
