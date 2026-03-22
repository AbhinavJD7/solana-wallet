"use client" // this make sure this page is rendered on the client side not on the server side
import { Buffer } from "buffer"; // Import Buffer for browser compatibility for node modules
import "./globals.css"; // Import global styles
if (typeof window !== "undefined"){
  window.Buffer = Buffer; // Make Buffer available globally in the browser
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}