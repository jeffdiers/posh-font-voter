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
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ToastProvider } from "@/components/ui/toast";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { FontPreviewDialog } from "@/components/font-preview-dialog";

// Font interface to track each font
interface Font {
  id: number;
  url: string;
  name: string;
  upvotes: number;
  downvotes: number;
  loaded: boolean;
}

// Interface to track user votes
interface UserVote {
  font_id: number;
  vote_type: "up" | "down";
}

const VOTING_ENABLED = false;
const MAX_VOTES = 8;

export default function FontVotingPage() {
  const [fonts, setFonts] = useState<Font[]>([]);
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
    };

    initializeApp();
  }, []);

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

      // Process fonts data
      const processedFonts = fontsData.map((font) => ({
        ...font,
        loaded: false,
      }));

      setFonts(processedFonts);

      // Process user votes
      const userVotesMap: Record<number, "up" | "down"> = {};
      votesData.forEach((vote: UserVote) => {
        userVotesMap[vote.font_id] = vote.vote_type as "up" | "down";
      });

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
      toast({
        title: "Error",
        description: "Failed to load fonts. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Vote for a font (up or down)
  const voteFont = async (fontId: number, voteType: "up" | "down") => {
    if (!userId || !VOTING_ENABLED) return; // Check if voting is open

    // Check if user has already voted for this font
    if (userVotes[fontId]) {
      toast({
        title: "Already voted",
        description: `You've already voted for ${
          fonts.find((f) => f.id === fontId)?.name
        }`,
        duration: 3000,
      });
      return;
    }

    // Check if user has reached the maximum number of votes
    if (usedVotes >= MAX_VOTES && voteType === "up") {
      toast({
        title: "Vote limit reached",
        description: `You can only upvote ${MAX_VOTES} fonts. Please remove a vote to continue.`,
        duration: 3000,
      });
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
      toast({
        title: "Vote recorded",
        description: `You voted ${voteType} for ${
          fonts.find((f) => f.id === fontId)?.name
        }`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Vote removed",
        description: `Your vote for ${
          fonts.find((f) => f.id === fontId)?.name
        } has been removed`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error removing vote:", error);
      toast({
        title: "Error",
        description: "Failed to remove your vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openFontPreview = (font: Font) => {
    setSelectedFont(font);
    setIsDialogOpen(true);
  };

  const closeFontPreview = () => {
    setIsDialogOpen(false);
  };

  // Sort fonts by net votes (upvotes - downvotes)
  const sortedFonts = [...fonts].sort(
    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  );

  // Get top fonts and remaining fonts
  const topFonts = sortedFonts.slice(0, MAX_VOTES);
  const remainingFonts = sortedFonts.slice(MAX_VOTES);

  // Render a font card
  const renderFontCard = (font: Font) => (
    <Card
      key={font.id}
      className="overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      <CardContent className="pt-6 flex flex-col items-center gap-2">
        <h1
          className="text-4xl text-center mb-2 overflow-hidden text-ellipsis"
          style={{
            fontFamily: font.loaded ? font.name : "system-ui",
          }}
        >
          {font.name}
        </h1>

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
      </CardContent>
      <CardFooter className="flex justify-between">
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
            disabled={remainingVotes <= 0 && !userVotes[font.id]}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Vote for this font
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <ToastProvider>
      <div className="container mx-auto py-8 px-4">
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
          <div className="border-dashed border-2 border-primary p-2 rounded-md w-fit mx-auto">
            {remainingVotes} of {MAX_VOTES} votes remaining
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {topFonts.map(renderFontCard)}
              </div>
            </div>

            {/* Remaining Fonts Section */}
            {remainingFonts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 underline">
                  Other Fonts
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
      </div>
    </ToastProvider>
  );
}
