import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

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
    <html lang="en" className={`${manrope.variable} ${inter.variable} antialiased`}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className="min-h-screen bg-surface text-ink font-body">
        <div className="flex min-h-screen">
          <Sidebar />
          <Topbar />
          <main className="ml-[260px] pt-16 w-[calc(100%-260px)] min-h-screen max-md:ml-0 max-md:w-full">
            <div className="max-w-[1200px] mx-auto px-8 py-8 pb-12 max-md:px-4">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
