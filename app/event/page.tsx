"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Share, Bookmark, Volume2, X, Settings } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { PoshLogo } from "@/components/icons/posh-logo";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { OverlayParticle } from "@/components/overlays/particle";
import { OverlayGlass } from "@/components/overlays/glass";
import { PixelGridOverlay } from "@/components/overlays/pixels";

interface Font {
  id: number;
  name: string;
  url: string;
}

interface GradientOption {
  id: string;
  name: string;
  value: string;
}

// Predefined gradient options
const gradientOptions: GradientOption[] = [
  {
    id: "posh-theme",
    name: "Posh Theme",
    value:
      "bg-gradient-to-t from-event-theme-gradient-from via-event-theme-gradient-via via-26% to-event-theme-gradient-to to-83%",
  },
  {
    id: "none",
    name: "None",
    value: "bg-background",
  },
  {
    id: "blue-green",
    name: "Blue to Green",
    value: "bg-gradient-to-t from-blue-500 to-green-500",
  },
  {
    id: "radial",
    name: "Radial Gradient",
    value:
      "[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]",
  },
  {
    id: "particle",
    name: "Particle",
    value: "overlay-particle",
  },
  {
    id: "glass",
    name: "Glass",
    value: "overlay-glass",
  },
  {
    id: "pixels",
    name: "Pixels",
    value: "overlay-pixels",
  },
];

export default function EventPage() {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [selectedFont, setSelectedFont] = useState<string>("");
  const [selectedGradient, setSelectedGradient] = useState<string>(
    gradientOptions[0].value
  );
  const [organizer, setOrganizer] = useState("Amoura");
  const [eventTitle, setEventTitle] = useState("Nick Morgan @ Unveiled");
  const [eventDescription, setEventDescription] = useState(
    "Amoura is taking over Unveiled to bring you Nick Morgan, supported by NYC's beloved Alta Sounds and Fireware."
  );
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [eventLocation, setEventLocation] = useState("Unveiled");
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 5);
  const [addPadding, setAddPadding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch fonts from database
  useEffect(() => {
    const fetchFonts = async () => {
      setLoading(true);
      try {
        // Get top voted fonts
        const { data, error } = await supabase
          .from("fonts")
          .select("id, name, url")
          .order("upvotes", { ascending: false });
        // .limit(8);

        if (error) throw error;

        if (data && data.length > 0) {
          setFonts(data);
          setSelectedFont(data[0].name);

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

  return (
    <div
      className={`${selectedGradient} min-h-screen w-screen bg-cover bg-center flex`}
    >
      {selectedGradient === "overlay-particle" && <OverlayParticle />}
      {selectedGradient === "overlay-glass" && <OverlayGlass />}
      {selectedGradient === "overlay-pixels" && <PixelGridOverlay />}

      <div className="z-10">
        <div className="container mx-auto py-8 px-4 sm:px-36 pt-12 sm:pt-24 w-full">
          {/* Event Content */}
          <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 mx-auto w-full items-start justify-start mt-1">
            {/* Event Flyer (Left) */}
            <div
              className="relative left-1/2 translate-x-[-50%]"
              style={{
                maxWidth: addPadding ? `${aspectRatio * 100}%` : "100%",
              }}
            >
              <AspectRatio
                ratio={aspectRatio}
                className="rounded-lg overflow-hidden"
              >
                <Image
                  src="/flyer-1x1.webp"
                  alt="Event Flyer"
                  fill
                  className={cn(
                    "object-cover object-top hidden",
                    aspectRatio === 1 / 1 && "block"
                  )}
                />
                <Image
                  src="/flyer-4x5.webp"
                  alt="Event Flyer"
                  fill
                  className={cn(
                    "object-cover object-top hidden",
                    aspectRatio === 4 / 5 && "block"
                  )}
                />
                <Image
                  src="/flyer-9x16.webp"
                  alt="Event Flyer"
                  fill
                  className={cn(
                    "object-cover object-top hidden",
                    aspectRatio === 9 / 16 && "block"
                  )}
                />
              </AspectRatio>
            </div>

            {/* Event Details (Right) */}
            <div className="flex flex-col">
              <div className="flex flex-col items-start justify-center text-foreground text-start gap-2 md:gap-4 leading-tight">
                <div className="flex flex-row justify-between w-full">
                  <div className="flex flex-row items-center gap-2 md:gap-4">
                    <Avatar className="size-6 md:size-8 rounded-full bg-slate-800 items-center justify-center flex">
                      ▲
                    </Avatar>
                    <p className="text-sm md:text-base font-medium">
                      {organizer}
                    </p>
                  </div>
                  <div className="flex flex-row items-center gap-4">
                    <Volume2 className="size-4" />
                    <Bookmark className="size-4" />
                  </div>
                </div>
                <h2
                  className="text-2xl md:text-5xl font-medium"
                  style={{ fontFamily: selectedFont }}
                >
                  {eventTitle}
                </h2>
                <div className="flex flex-col font-bold text-sm md:text-lg gap-0">
                  <p>{eventLocation}</p>
                  <p>
                    {eventDate ? format(eventDate, "MMMM d, yyyy") : "Date TBD"}
                  </p>
                </div>
                <p className="text-sm md:text-base leading-tight">
                  {eventDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-2 fixed p-2 rounded-t-lg bottom-0 right-0  w-full items-end justify-end">
            {/* Theme Settings Drawer */}
            <Drawer modal={false}>
              <DrawerTrigger className="" asChild>
                <Button variant="secondary" className="rounded-full">
                  <Settings />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerClose className="text-xl absolute top-1 right-1" asChild>
                  <Button variant="link" size="icon" className="rounded-full">
                    <X />
                  </Button>
                </DrawerClose>
                <DrawerHeader>
                  <DrawerTitle className="sr-only">Theme Settings</DrawerTitle>
                </DrawerHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 container mx-auto p-4 sm:px-24 sm:pb-12">
                  <div>
                    <div className="space-y-2">
                      <Label htmlFor="font-select">Select Font</Label>
                      <Select
                        value={selectedFont}
                        onValueChange={setSelectedFont}
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
                        onValueChange={setSelectedGradient}
                      >
                        <SelectTrigger id="gradient-select">
                          <SelectValue placeholder="Select a gradient" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradientOptions.map((gradient) => (
                            <SelectItem
                              key={gradient.id}
                              value={gradient.value}
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-6 h-6 rounded mr-2 bg-gradient-to-r ${gradient.value} border`}
                                  aria-hidden="true"
                                />
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
                        onValueChange={(value) => setAspectRatio(Number(value))}
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
                    <div className="space-y-2 flex flex-row items-center justify-between border  p-2 rounded-lg">
                      <Label htmlFor="add-padding-select" className="w-full">
                        Add Padding to Image
                      </Label>
                      <Switch
                        id="add-padding-select"
                        checked={addPadding}
                        onCheckedChange={setAddPadding}
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
    </div>
  );
}
