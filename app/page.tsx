"use client";

import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import {
  AlertCircle,
  Check,
  ExternalLink,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import { FontPreviewDialog } from "@/components/font-preview-dialog";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";

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

const VOTING_ENABLED = true;
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

        // console.log(fontId);
        // console.log(tag.name);

        if (tag && fontId) {
          const fontIndex = processedFonts.findIndex((f) => f.id === fontId);
          if (fontIndex !== -1) {
            if (!processedFonts[fontIndex].tags) {
              processedFonts[fontIndex].tags = [tag.name];
            } else {
              processedFonts[fontIndex].tags.push(tag.name);
            }
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
              f.id === font.id ? { ...f, loaded: true } : f,
            ),
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
        `You've already voted for ${fonts.find((f) => f.id === fontId)?.name}`,
      );
      return;
    }

    // Check if user has reached the maximum number of votes
    if (usedVotes >= MAX_VOTES && voteType === "up") {
      toast.error(
        `You can only upvote ${MAX_VOTES} fonts. Please remove a vote to continue.`,
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
        }),
      );

      // Update user votes
      setUserVotes((prev) => ({
        ...prev,
        [fontId]: voteType,
      }));

      // Show toast notification
      toast.success(
        `You voted ${voteType} for ${fonts.find((f) => f.id === fontId)?.name}`,
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
        }),
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
        } has been removed`,
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
    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes),
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
      className="flex w-full flex-col justify-between overflow-hidden transition-shadow duration-200 hover:shadow-md"
    >
      <CardContent className="flex flex-col items-center gap-2 pt-6">
        <div className="m-auto min-h-[160px]">
          <h1
            className="overflow-hidden p-2 text-center text-4xl text-ellipsis"
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
        <div className="mb-2 text-center text-sm text-muted-foreground">
          Total: {font.upvotes - font.downvotes}
        </div>

        {/* Display tags */}
        {font.tags && font.tags.length > 0 && (
          <div className="mt-2 mb-1 flex flex-wrap justify-center gap-1">
            {font.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-end flex justify-between">
        {userVotes[font.id] ? (
          <div className="flex w-full items-center justify-center gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Check className="mr-2 h-4 w-4" />
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
            className="mr-2 w-full"
            onClick={() => voteFont(font.id, "up")}
            disabled={
              (remainingVotes <= 0 && !userVotes[font.id]) || !VOTING_ENABLED
            }
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            {remainingVotes > 0 ? "Vote for this font" : "Vote limit reached"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div>
      <div className="container mx-auto px-1 py-8 pt-16">
        <div className="mx-auto mb-8 flex max-w-3xl flex-col items-center gap-4 rounded-lg bg-secondary p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold">
            Help us choose our fonts for the Create Event page!
          </h2>
          <p className="mb-2">
            We&apos;re selecting fonts for our new Create Event page and need
            your input. Vote on your favorite fonts below. You can upvote up to
            {MAX_VOTES} fonts. The top {MAX_VOTES} fonts will be used in our
            Create Event page.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center">
              <ThumbsUp className="mr-1 h-4 w-4 text-green-600" />
              <span>Vote up fonts you love</span>
            </div>
            <div className="flex items-center">
              <ThumbsDown className="mr-1 h-4 w-4 text-red-600" />
              <span>Vote down fonts you dislike</span>
            </div>
            <div className="flex items-center">
              <ExternalLink className="mr-1 h-4 w-4 text-blue-600" />
              <span>Click to preview it in action</span>
            </div>
            <div className="mx-auto w-fit rounded-md border border-border bg-primary px-2 py-1 text-primary-foreground transition-all duration-1000 starting:opacity-0">
              {remainingVotes} of {MAX_VOTES} votes remaining
            </div>
          </div>
        </div>

        {!VOTING_ENABLED && (
          <div className="container mx-auto flex flex-col gap-4 p-4">
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
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">Filter by Tags</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTagFilters}
              className={cn(
                "h-8 px-2 text-xs",
                selectedTags.length === 0 && "hidden",
              )}
            >
              <X className="mr-1 h-3 w-3" />
              Clear filters
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag.id}
                variant={
                  selectedTags.includes(tag.name) ? "default" : "outline"
                }
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
                {selectedTags.includes(tag.name) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            >
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !border-0 !p-0 !whitespace-nowrap ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
            <p className="mt-4 text-muted-foreground">Loading fonts...</p>
          </div>
        ) : (
          <>
            {/* Top Fonts Section */}
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold underline">
                Top {MAX_VOTES} Fonts
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {topFonts.map(renderFontCard)}
              </div>
            </div>

            {/* Remaining Fonts Section */}
            {remainingFonts.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold underline">
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
