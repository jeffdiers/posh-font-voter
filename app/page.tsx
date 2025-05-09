"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  ThumbsUp,
  ThumbsDown,
  Check,
  AlertCircle,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { FontPreviewDialog } from "@/components/font-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { PoshLogo } from "@/components/icons/posh-logo";

// Font interface to track each font
export interface Font {
  id: number;
  url: string;
  name: string;
  upvotes: number;
  downvotes: number;
  loaded: boolean;
  tags?: string[];
}

// Interface to track user votes
interface UserVote {
  font_id: number;
  vote_type: "up" | "down";
}

// Tag interface
interface Tag {
  id: number;
  name: string;
}

const VOTING_ENABLED = false;
const MAX_VOTES = 8;

export default function FontVotingPage() {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userVotes, setUserVotes] = useState<Record<number, "up" | "down">>({});
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFont, setSelectedFont] = useState<Font | null>(null);

  // Count how many votes the user has used
  const usedVotes = Object.keys(userVotes).length;
  const remainingVotes = MAX_VOTES - usedVotes;

  // Initialize user ID and fetch data
  useEffect(() => {
    const initializeApp = async () => {
      // Get or create user ID
      let id = localStorage.getItem("fontVotingUserId");
      if (!id) {
        id = uuidv4();
        localStorage.setItem("fontVotingUserId", id);
      }
      setUserId(id);

      // Fetch fonts and user votes
      await fetchFontsAndVotes(id);
      await fetchAllTags();
    };

    initializeApp();
  }, []);

  // Fetch all available tags
  const fetchAllTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");
      if (error) throw error;
      setAllTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags. Please refresh the page.");
    }
  };

  // Fetch fonts and user votes from Supabase
  const fetchFontsAndVotes = async (uid: string) => {
    setLoading(true);
    try {
      // Fetch all fonts
      const { data: fontsData, error: fontsError } = await supabase
        .from("fonts")
        .select("*")
        .order("id");

      if (fontsError) throw fontsError;

      // Fetch user votes
      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("font_id, vote_type")
        .eq("user_id", uid);

      if (votesError) throw votesError;

      // Fetch font tags
      const { data: fontTagsData, error: fontTagsError } = await supabase
        .from("font_tags")
        .select("font_id, tags(id, name)");

      if (fontTagsError) throw fontTagsError;

      // Process fonts data
      const processedFonts = fontsData.map((font) => ({
        ...font,
        loaded: false,
        tags: [],
      }));

      // Process user votes
      const userVotesMap: Record<number, "up" | "down"> = {};
      votesData.forEach((vote: UserVote) => {
        userVotesMap[vote.font_id] = vote.vote_type as "up" | "down";
      });

      // Process font tags
      fontTagsData.forEach((fontTag: any) => {
        const fontId = fontTag.font_id;
        const tag = fontTag.tags;

        if (tag && fontId) {
          const fontIndex = processedFonts.findIndex((f) => f.id === fontId);
          if (fontIndex !== -1) {
            if (!processedFonts[fontIndex].tags) {
              processedFonts[fontIndex].tags = [];
            }
            processedFonts[fontIndex].tags!.push(tag.name);
          }
        }
      });

      setFonts(processedFonts);
      setUserVotes(userVotesMap);

      // Load fonts
      processedFonts.forEach((font) => {
        const link = document.createElement("link");
        link.href = font.url;
        link.rel = "stylesheet";
        document.head.appendChild(link);

        link.onload = () => {
          setFonts((prevFonts) =>
            prevFonts.map((f) =>
              f.id === font.id ? { ...f, loaded: true } : f
            )
          );
        };
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load fonts. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle tag selection for filtering
  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((t) => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  // Clear all selected tags
  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  // Vote for a font (up or down)
  const voteFont = async (fontId: number, voteType: "up" | "down") => {
    if (!userId || !VOTING_ENABLED) return; // Check if voting is open

    // Check if user has already voted for this font
    if (userVotes[fontId]) {
      toast.error(
        `You've already voted for ${fonts.find((f) => f.id === fontId)?.name}`
      );
      return;
    }

    // Check if user has reached the maximum number of votes
    if (usedVotes >= MAX_VOTES && voteType === "up") {
      toast.error(
        `You can only upvote ${MAX_VOTES} fonts. Please remove a vote to continue.`
      );
      return;
    }

    try {
      // Start a transaction
      const { error: voteError } = await supabase.rpc("cast_vote", {
        p_font_id: fontId,
        p_user_id: userId,
        p_vote_type: voteType,
      });

      if (voteError) throw voteError;

      // Update local state
      setFonts((prevFonts) =>
        prevFonts.map((font) => {
          if (font.id === fontId) {
            return {
              ...font,
              upvotes: voteType === "up" ? font.upvotes + 1 : font.upvotes,
              downvotes:
                voteType === "down" ? font.downvotes + 1 : font.downvotes,
            };
          }
          return font;
        })
      );

      // Update user votes
      setUserVotes((prev) => ({
        ...prev,
        [fontId]: voteType,
      }));

      // Show toast notification
      toast.success(
        `You voted ${voteType} for ${fonts.find((f) => f.id === fontId)?.name}`
      );
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record your vote. Please try again.");
    }
  };

  // Undo a vote for a font
  const undoVote = async (fontId: number) => {
    if (!userId) return;

    // Get the current vote type for this font
    const voteType = userVotes[fontId];
    if (!voteType) return;

    try {
      // Start a transaction
      const { error: undoError } = await supabase.rpc("remove_vote", {
        p_font_id: fontId,
        p_user_id: userId,
        p_vote_type: voteType,
      });

      if (undoError) throw undoError;

      // Update local state
      setFonts((prevFonts) =>
        prevFonts.map((font) => {
          if (font.id === fontId) {
            return {
              ...font,
              upvotes:
                voteType === "up"
                  ? Math.max(0, font.upvotes - 1)
                  : font.upvotes,
              downvotes:
                voteType === "down"
                  ? Math.max(0, font.downvotes - 1)
                  : font.downvotes,
            };
          }
          return font;
        })
      );

      // Remove the user's vote for this font
      setUserVotes((prev) => {
        const newVotes = { ...prev };
        delete newVotes[fontId];
        return newVotes;
      });

      // Show toast notification
      toast.success(
        `Your vote for ${
          fonts.find((f) => f.id === fontId)?.name
        } has been removed`
      );
    } catch (error) {
      console.error("Error removing vote:", error);
      toast.error("Failed to remove your vote. Please try again.");
    }
  };

  const openFontPreview = (font: Font) => {
    setSelectedFont(font);
    setIsDialogOpen(true);
  };

  const closeFontPreview = () => {
    setIsDialogOpen(false);
  };

  // Filter fonts based on selected tags
  const filterFontsByTags = (fonts: Font[]) => {
    if (selectedTags.length === 0) return fonts;

    return fonts.filter((font) => {
      if (!font.tags || font.tags.length === 0) return false;
      return selectedTags.every((tag) => font.tags!.includes(tag));
    });
  };

  // Sort fonts by net votes (upvotes - downvotes)
  const sortedFonts = [...fonts].sort(
    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  );

  // Filter fonts by selected tags
  const filteredFonts = filterFontsByTags(sortedFonts);

  // Get top fonts and remaining fonts from filtered list
  const topFonts = filteredFonts.slice(0, MAX_VOTES);
  const remainingFonts = filteredFonts.slice(MAX_VOTES);

  // Render a font card
  const renderFontCard = (font: Font) => (
    <Card
      key={font.id}
      className="overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col justify-between w-full"
    >
      <CardContent className="pt-6 flex flex-col items-center gap-2">
        <div className="min-h-[160px] m-auto">
          <h1
            className="text-4xl text-center p-2 overflow-hidden text-ellipsis"
            style={{
              fontFamily: font.loaded ? font.name : "system-ui",
            }}
          >
            {font.name}
          </h1>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => openFontPreview(font)}
        >
          <ExternalLink className="h-4 w-4" />
          Preview
        </Button>
        <div className="text-sm text-muted-foreground text-center mb-2">
          Total: {font.upvotes - font.downvotes}
        </div>

        {/* Display tags */}
        {font.tags && font.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-2 mb-1">
            {font.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between flex-end">
        {userVotes[font.id] ? (
          <div className="w-full flex items-center justify-center gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Check className="h-4 w-4 mr-2" />
              You voted
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => undoVote(font.id)}
              className="text-sm"
            >
              Undo vote
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full mr-2"
            onClick={() => voteFont(font.id, "up")}
            disabled={
              (remainingVotes <= 0 && !userVotes[font.id]) || !VOTING_ENABLED
            }
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            {remainingVotes > 0 ? "Vote for this font" : "Vote limit reached"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div>
      <header className="sticky inset-x-0 top-0 z-50 w-full bg-transparent px-4 py-2 backdrop-blur 2xl:bg-transparent 2xl:backdrop-blur-none border-b border-border">
        <div className="flex justify-between items-center">
          <PoshLogo className="pl-2 size-8" />
          <div className="flex items-center gap-2">
            <div className="  w-fit mx-auto rounded-md border border-border bg-primary text-primary-foreground px-2 py-1">
              {remainingVotes} of {MAX_VOTES} votes remaining
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>
      <div className="container mx-auto py-8 px-1">
        <div className="max-w-3xl mx-auto mb-8 text-center bg-secondary p-6 rounded-lg shadow-sm gap-4 flex flex-col items-center">
          <h2 className="text-xl font-semibold">
            Help us choose our fonts for the Create Event page!
          </h2>
          <p className="mb-2">
            We're selecting fonts for our new Create Event page and need your
            input. Vote on your favorite fonts below. You can upvote up to
            {MAX_VOTES} fonts. The top {MAX_VOTES} fonts will be used in our
            Create Event page.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1 text-green-600" />
              <span>Vote up fonts you love</span>
            </div>
            <div className="flex items-center">
              <ThumbsDown className="h-4 w-4 mr-1 text-red-600" />
              <span>Vote down fonts you dislike</span>
            </div>
            <div className="flex items-center">
              <ExternalLink className="h-4 w-4 mr-1 text-blue-600" />
              <span>Click to preview it in action</span>
            </div>
          </div>
        </div>

        {!VOTING_ENABLED && (
          <div className="container mx-auto p-4 flex flex-col gap-4">
            <Alert variant="destructive">
              <AlertTitle className="flex items-center gap-2">
                <AlertCircle />
                Voting is disabled: Waiting for everyone to get their fonts
              </AlertTitle>
            </Alert>
          </div>
        )}

        {/* Tag filtering section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium">Filter by Tags</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTagFilters}
              className={cn(
                "h-8 px-2 text-xs",
                selectedTags.length === 0 && "hidden"
              )}
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {allTags.map((tag) => (
              <Badge
                key={tag.id}
                variant={
                  selectedTags.includes(tag.name) ? "default" : "outline"
                }
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
                {selectedTags.includes(tag.name) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            >
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
            <p className="mt-4 text-muted-foreground">Loading fonts...</p>
          </div>
        ) : (
          <>
            {/* Top Fonts Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 underline">
                Top {MAX_VOTES} Fonts
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {topFonts.map(renderFontCard)}
              </div>
            </div>

            {/* Remaining Fonts Section */}
            {remainingFonts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 underline">
                  Other Fonts
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {remainingFonts.map(renderFontCard)}
                </div>
              </div>
            )}
          </>
        )}

        <FontPreviewDialog
          isOpen={isDialogOpen}
          onClose={closeFontPreview}
          font={selectedFont}
        />

        <Toaster richColors />
      </div>
    </div>
  );
}
