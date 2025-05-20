"use client";

import type { Font } from "@/app/page";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FontPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  font: Font | null;
}

export function FontPreviewDialog({
  isOpen,
  onClose,
  font,
}: FontPreviewDialogProps) {
  if (!font) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Font Preview: {font.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Event Flyer Image on the left */}
            <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted">
              <div className="relative flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-700">
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white"
                  style={{ fontFamily: font.name }}
                >
                  <p className="mb-2 text-xl">PRESENTING</p>
                  <h2 className="mb-4 text-4xl font-bold">
                    ANNUAL DESIGN CONFERENCE
                  </h2>
                  <p className="mb-6 text-lg">
                    FEATURING THE LATEST TRENDS IN TYPOGRAPHY
                  </p>
                  <p className="text-xl">JUNE 15-18, 2023</p>
                </div>
              </div>
            </div>

            {/* Font Examples on the right */}
            <div className="flex flex-col space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Event Title
                </h3>
                <div
                  className="text-4xl font-bold"
                  style={{ fontFamily: font.name }}
                >
                  Annual Design Conference
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Heading
                </h3>
                <div
                  className="text-2xl font-semibold"
                  style={{ fontFamily: font.name }}
                >
                  Typography Workshop Sessions
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Body Text
                </h3>
                <div className="text-base">
                  Join us for an immersive experience exploring the art and
                  science of typography. From classic serifs to modern sans,
                  we&apos;ll dive deep into what makes great typography work.
                </div>
              </div>

              {/* Display tags if available */}
              {font.tags && font.tags.length > 0 && (
                <div className="space-x-2">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Tags
                  </h3>
                  <div className="mb-4 flex flex-wrap gap-1">
                    {font.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
