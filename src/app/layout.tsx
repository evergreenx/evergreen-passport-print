import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Evergreen Passport Print', description: 'Private, on-device passport photo sheet preparation.', applicationName: 'Evergreen Passport Print', manifest: '/manifest.webmanifest', appleWebApp: { capable: true, title: 'Evergreen Print', statusBarStyle: 'default' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
