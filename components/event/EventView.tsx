"use client";

import { format } from "date-fns";

import {
  Bookmark,
  Box,
  Ghost,
  Loader2,
  Settings,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import { OverlayGlass } from "@/components/overlays/glass";
import { NeonIsometricMaze } from "@/components/overlays/neon-isometric-maze";
import { OverlayParticle } from "@/components/overlays/particle";
import { PixelGridOverlay } from "@/components/overlays/pixels";
import { WavesOverlay } from "@/components/overlays/waves";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Types
interface Font {
  id: number;
  name: string;
  url: string;
}

interface GradientOption {
  id: string;
  name: string;
  type: "static" | "dynamic";
  classNames?: string;
  component?: React.ReactNode;
}

// Predefined gradient options
const gradientOptions: Record<string, GradientOption> = {
  "posh-theme": {
    id: "posh-theme",
    name: "Posh Theme",
    type: "static",
    classNames:
      "bg-gradient-to-t from-event-theme-gradient-from via-event-theme-gradient-via via-26% to-event-theme-gradient-to to-83%",
  },
  none: {
    id: "none",
    name: "None",
    type: "static",
    classNames: "bg-background",
  },
  "blue-green": {
    id: "blue-green",
    name: "Blue to Green",
    type: "static",
    classNames: "bg-gradient-to-t from-blue-500 to-green-500",
  },
  radial: {
    id: "radial",
    name: "Radial Gradient",
    type: "static",
    classNames:
      "[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]",
  },
  particle: {
    id: "particle",
    name: "Particle",
    type: "dynamic",
    component: <OverlayParticle />,
  },
  glass: {
    id: "glass",
    name: "Glass",
    type: "dynamic",
    component: <OverlayGlass />,
  },
  pixels: {
    id: "pixels",
    name: "Pixels",
    type: "dynamic",
    component: <PixelGridOverlay />,
  },
  "neon-isometric-maze": {
    id: "neon-isometric-maze",
    name: "Neon Isometric Maze",
    type: "dynamic",
    component: <NeonIsometricMaze />,
  },
  waves: {
    id: "waves",
    name: "Waves",
    type: "dynamic",
    component: <WavesOverlay />,
  },
};

// Event Data
const EVENT_DATA = {
  organizer: "Amoura",
  eventTitle: "Nick Morgan @ Unveiled",
  eventDescription:
    "Amoura is taking over Unveiled to bring you Nick Morgan, supported by NYC's beloved Alta Sounds and Fireware.",
  eventDate: new Date(),
  eventLocation: "Unveiled",
};

export default function EventView() {
  // Router
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [loading, setLoading] = useState(true);
  const [fonts, setFonts] = useState<Font[]>([]);

  // Theme Settings
  const [selectedFont, setSelectedFont] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 5);
  const [addPadding, setAddPadding] = useState(false);
  const [selectedGradient, setSelectedGradient] = useState<string>(
    gradientOptions["posh-theme"].id,
  );

  // Fetch fonts from database
  useEffect(() => {
    const fetchFonts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("fonts")
          .select("id, name, url")
          .order("upvotes", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setFonts(data);
          // setSelectedFont(data[0].name);

          // Load fonts
          data.forEach((font) => {
            const link = document.createElement("link");
            link.href = font.url;
            link.rel = "stylesheet";
            document.head.appendChild(link);
          });
        }
      } catch (error) {
        console.error("Error fetching fonts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFonts();
  }, []);

  // Update theme settings based on query parameters
  useEffect(() => {
    console.log(searchParams.get("font"));
    if (searchParams.get("font"))
      setSelectedFont(searchParams.get("font") as string);
    if (searchParams.get("aspectRatio"))
      setAspectRatio(Number(searchParams.get("aspectRatio")));
    if (searchParams.get("addPadding"))
      setAddPadding(searchParams.get("addPadding") === "true");
    if (searchParams.get("gradient"))
      setSelectedGradient(searchParams.get("gradient") as string);
  }, [searchParams]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );
  const handleItemChange = (name: string, value: string) => {
    router.push(`${pathname}?${createQueryString(name, value)}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`${gradientOptions[selectedGradient].classNames} flex min-h-screen w-screen bg-cover bg-center`}
    >
      {gradientOptions[selectedGradient].type === "dynamic" &&
        gradientOptions[selectedGradient].component}

      <div className="container mx-auto w-full px-4 py-8 pt-12 sm:pt-24">
        {/* Event Content */}
        <div className="mx-auto mt-1 grid w-full grid-cols-1 items-start justify-start gap-6 md:grid-cols-[360px_1fr] lg:grid-cols-[480px_1fr]">
          {/* Event Flyer (Left) */}
          <div
            className="relative left-1/2 z-10 max-w-[400px] translate-x-[-50%] sm:max-w-[400px] md:max-w-[360px] lg:max-w-[480px]"
            style={{
              maxWidth: addPadding ? `${aspectRatio * 100}%` : "",
            }}
          >
            <AspectRatio
              ratio={aspectRatio}
              className="overflow-hidden rounded-lg"
            >
              <Image
                src="/flyer-1x1.webp"
                alt="Event Flyer"
                fill
                className={cn(
                  "hidden object-cover object-top",
                  aspectRatio === 1 / 1 && "block",
                )}
              />
              <Image
                src="/flyer-4x5.webp"
                alt="Event Flyer"
                fill
                className={cn(
                  "hidden object-cover object-top",
                  aspectRatio === 4 / 5 && "block",
                )}
              />
              <Image
                src="/flyer-9x16.webp"
                alt="Event Flyer"
                fill
                className={cn(
                  "hidden object-cover object-top",
                  aspectRatio === 9 / 16 && "block",
                )}
              />
            </AspectRatio>
          </div>

          {/* Event Details (Right) */}
          <div className="z-10 flex flex-col">
            <div className="flex flex-col items-start justify-center gap-2 text-start leading-tight text-foreground md:gap-4">
              <div className="mt-2 flex w-full flex-row justify-between">
                <div className="flex flex-row items-center gap-2 md:gap-4">
                  <Avatar className="flex size-6 items-center justify-center rounded-full bg-slate-800 text-white md:size-8">
                    <Ghost className="size-4" />
                  </Avatar>
                  <p className="text-sm font-medium md:text-base">
                    {EVENT_DATA.organizer}
                  </p>
                </div>
                <div className="flex flex-row items-center gap-4">
                  <Volume2 className="size-4" />
                  <Bookmark className="size-4" />
                </div>
              </div>
              <h2
                className="text-2xl font-medium md:text-5xl"
                style={{ fontFamily: selectedFont }}
              >
                {EVENT_DATA.eventTitle}
              </h2>
              <div className="flex flex-col gap-0 text-sm font-bold md:text-lg">
                <p>{EVENT_DATA.eventLocation}</p>
                <p>
                  {EVENT_DATA.eventDate
                    ? format(EVENT_DATA.eventDate, "MMMM d, yyyy")
                    : "Date TBD"}
                </p>
              </div>
              <p className="text-sm leading-tight md:text-base">
                {EVENT_DATA.eventDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="fixed right-0 bottom-0 z-10 flex w-full flex-row items-end justify-end gap-2 rounded-t-lg p-2">
          {/* Theme Settings Drawer */}
          <Drawer modal={false}>
            <DrawerTrigger className="" asChild>
              <Button variant="secondary" className="rounded-full">
                <Settings />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerClose className="absolute top-1 right-1 text-xl" asChild>
                <Button variant="link" size="icon" className="rounded-full">
                  <X />
                </Button>
              </DrawerClose>
              <DrawerHeader>
                <DrawerTitle className="sr-only">Theme Settings</DrawerTitle>
              </DrawerHeader>
              <div className="container mx-auto grid grid-cols-1 gap-6 p-4 sm:px-24 sm:pb-12 md:grid-cols-2">
                <div>
                  <div className="space-y-2">
                    <Label htmlFor="font-select">Select Font</Label>
                    <Select
                      value={selectedFont}
                      onValueChange={(value) => handleItemChange("font", value)}
                    >
                      <SelectTrigger id="font-select">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fonts.map((font) => (
                          <SelectItem key={font.id} value={font.name}>
                            <span style={{ fontFamily: font.name }}>
                              {font.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="space-y-2">
                    <Label htmlFor="gradient-select">
                      Select Background Gradient
                    </Label>
                    <Select
                      value={selectedGradient}
                      onValueChange={(value) =>
                        handleItemChange("gradient", value)
                      }
                    >
                      <SelectTrigger id="gradient-select">
                        <SelectValue placeholder="Select a gradient" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(gradientOptions).map((gradient) => (
                          <SelectItem key={gradient.id} value={gradient.id}>
                            <div className="flex items-center">
                              {gradient.type === "dynamic" ? (
                                <Box className="mr-2 h-6 w-6 rounded border" />
                              ) : (
                                <div
                                  className={`mr-2 h-6 w-6 rounded bg-gradient-to-r ${gradient.classNames} border`}
                                  aria-hidden="true"
                                />
                              )}
                              {gradient.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="space-y-2">
                    <Label htmlFor="aspect-ratio-select">
                      Select Aspect Ratio
                    </Label>
                    <Select
                      value={aspectRatio.toString()}
                      onValueChange={(value) =>
                        handleItemChange("aspectRatio", value)
                      }
                    >
                      <SelectTrigger id="aspect-ratio-select">
                        <SelectValue placeholder="Select an aspect ratio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5625">9:16</SelectItem>
                        <SelectItem value="0.8">4:5</SelectItem>
                        <SelectItem value="1">1:1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex flex-row items-center justify-between space-y-2 rounded-lg border p-2">
                    <Label htmlFor="add-padding-select" className="w-full">
                      Add Padding to Image
                    </Label>
                    <Switch
                      id="add-padding-select"
                      checked={addPadding}
                      onCheckedChange={(value) =>
                        handleItemChange("addPadding", value.toString())
                      }
                    />
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
          <Button
            variant="secondary"
            className="rounded-full bg-yellow-300 text-black"
          >
            BUY NOW
          </Button>
        </div>
      </div>
    </div>
  );
}
