import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import MathBackground from "@/components/MathBackground";


const manrope = Manrope({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "MathHub — Digital Atheneum",
  description: "E-learning platform for mathematics education — sessions, assignments, quizzes, and analytics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className="min-h-screen bg-surface text-ink font-body" suppressHydrationWarning>
          <MathBackground />
          {children}
      </body>
    </html>
  );
}
