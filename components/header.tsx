"use client";

import Link from "next/link";
import { PoshLogo } from "./icons/posh-logo";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full bg-transparent h-12 px-4 py-1 backdrop-blur 2xl:bg-transparent 2xl:backdrop-blur-none">
      <div className="flex justify-between items-center h-full">
        <PoshLogo className="pl-2 size-8" />
        <div className="flex items-center">
          <Button
            variant="link"
            asChild
            className={cn(pathname === "/" && "underline")}
          >
            <Link href="/">Fonts</Link>
          </Button>
          <Button
            variant="link"
            asChild
            className={cn(pathname === "/event" && "underline")}
          >
            <Link href="/event">Event</Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
