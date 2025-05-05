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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="absolute top-0 right-0 p-4">
            <ModeToggle />
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
