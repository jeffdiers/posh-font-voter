import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
export const metadata: Metadata = {
  title: "Posh Fonts",
  description: "Posh Fonts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="flex justify-between items-center py-4 px-12">
            <h1 className="text-2xl font-bold">Posh Font Voting</h1>
            <ModeToggle />
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
