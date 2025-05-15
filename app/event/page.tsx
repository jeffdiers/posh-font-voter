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
import { X } from "lucide-react";
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
    id: "purple-blue",
    name: "Purple to Blue",
    value: "from-purple-500 to-blue-500",
  },
  {
    id: "blue-green",
    name: "Blue to Green",
    value: "from-blue-500 to-green-500",
  },
  {
    id: "green-yellow",
    name: "Green to Yellow",
    value: "from-green-500 to-yellow-500",
  },
  {
    id: "yellow-red",
    name: "Yellow to Red",
    value: "from-yellow-500 to-red-500",
  },
  { id: "red-pink", name: "Red to Pink", value: "from-red-500 to-pink-500" },
  {
    id: "pink-purple",
    name: "Pink to Purple",
    value: "from-pink-500 to-purple-500",
  },
  {
    id: "indigo-cyan",
    name: "Indigo to Cyan",
    value: "from-indigo-500 to-cyan-500",
  },
  {
    id: "cyan-emerald",
    name: "Cyan to Emerald",
    value: "from-cyan-500 to-emerald-500",
  },
  {
    id: "emerald-amber",
    name: "Emerald to Amber",
    value: "from-emerald-500 to-amber-500",
  },
  {
    id: "amber-rose",
    name: "Amber to Rose",
    value: "from-amber-500 to-rose-500",
  },
];

export default function EventPage() {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [selectedFont, setSelectedFont] = useState<string>("");
  const [selectedGradient, setSelectedGradient] = useState<string>(
    gradientOptions[0].value
  );
  const [eventTitle, setEventTitle] = useState("Annual Design Conference");
  const [eventDescription, setEventDescription] = useState(
    "Join us for an immersive experience exploring the art and science of typography. From classic serifs to modern sans, we'll dive deep into what makes great typography work."
  );
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [eventLocation, setEventLocation] = useState(
    "Design Center, San Francisco"
  );
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
    <div className={`bg-gradient-to-br ${selectedGradient} min-h-screen`}>
      <div className="container mx-auto py-8 px-4 sm:px-36 pt-16 sm:pt-24 w-full">
        {/* Event Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 mx-auto w-full items-start justify-start">
          {/* Event Flyer (Left) */}
          <div className="relative max-w-[420px] w-full">
            <AspectRatio ratio={3 / 4} className="rounded-lg overflow-hidden">
              <Image
                src="/flyer1.webp"
                alt="Event Flyer"
                fill
                className="object-cover"
                priority
              />
            </AspectRatio>
          </div>

          {/* Event Details (Right) */}
          <div className="flex flex-col">
            <div className="flex flex-col items-start justify-center py-4 text-foreground text-start">
              <p className="text-xl mb-2 uppercase tracking-wider opacity-80">
                PRESENTING
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold mb-6"
                style={{ fontFamily: selectedFont }}
              >
                {eventTitle}
              </h2>
              <p className="text-lg mb-8 max-w-md">{eventDescription}</p>
              <div className="mt-auto">
                <p className="text-xl font-semibold">
                  {eventDate ? format(eventDate, "MMMM d, yyyy") : "Date TBD"}
                </p>
                <p className="text-lg">{eventLocation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings Drawer */}
        <Drawer modal={false}>
          <DrawerTrigger
            className="fixed bottom-3 left-1/2 translate-x-[-50%]"
            asChild
          >
            <Button variant="secondary" className="rounded-full">
              Theme Settings
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerClose className="text-xl absolute top-1 right-1">
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
                  <Select value={selectedFont} onValueChange={setSelectedFont}>
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
                        <SelectItem key={gradient.id} value={gradient.value}>
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded mr-2 bg-gradient-to-r ${gradient.value}`}
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
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
