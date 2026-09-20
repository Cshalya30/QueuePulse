import type { Metadata } from "next";
import "./globals.css";
import { QueuePulseProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "QueuePulse · IoT Queue Operations & Analytics Platform",
  description:
    "Industrial IoT queue operations platform bridging ESP32 hardware edge nodes (RFID, ToF presence, OLED, staff controls) with live operations monitoring and service analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-text-primary min-h-screen selection:bg-accent-live/20 selection:text-accent-live">
        <QueuePulseProvider>{children}</QueuePulseProvider>
      </body>
    </html>
  );
}
