"use client";

import { Eye, PlusCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { FontPreviewDialog } from "@/components/font-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToastProvider } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";

interface Font {
  id: number;
  url: string;
  name: string;
  upvotes: number;
  downvotes: number;
  loaded: boolean;
  tags: string[];
}

interface Tag {
  id: number;
  name: string;
}

export default function AdminPage() {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [selectedFont, setSelectedFont] = useState<Font | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFontId, setEditingFontId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<Record<number, number[]>>(
    {},
  );

  // Simple authentication
  const authenticate = () => {
    // In a real app, you would use a proper authentication system
    // This is just a simple example for demonstration purposes
    if (password === "admin123") {
      setIsAuthenticated(true);
      localStorage.setItem("fontAdminAuth", "true");
      fetchData();
    } else {
      toast({
        title: "Authentication Failed",
        description: "Incorrect password",
        variant: "destructive",
      });
    }
  };

  // Check if user is already authenticated
  useEffect(() => {
    const isAuth = localStorage.getItem("fontAdminAuth") === "true";
    if (isAuth) {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  // Fetch fonts and tags data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all fonts
      const { data: fontsData, error: fontsError } = await supabase
        .from("fonts")
        .select("*")
        .order("name");
      if (fontsError) throw fontsError;

      // Fetch all tags
      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .order("name");
      if (tagsError) throw tagsError;

      // Fetch font-tag relationships
      const { data: fontTagsData, error: fontTagsError } = await supabase
        .from("font_tags")
        .select("*");
      if (fontTagsError) throw fontTagsError;

      // Process fonts data
      const processedFonts = fontsData.map((font) => ({
        ...font,
        loaded: false,
        tags: [],
      }));

      // Process tags for each font
      const fontTagsMap: Record<number, number[]> = {};
      fontTagsData.forEach((fontTag: { font_id: number; tag_id: number }) => {
        if (!fontTagsMap[fontTag.font_id]) {
          fontTagsMap[fontTag.font_id] = [];
        }
        fontTagsMap[fontTag.font_id].push(fontTag.tag_id);
      });

      // Set initial selected tags based on existing relationships
      setSelectedTags(fontTagsMap);

      // Add tag names to fonts
      processedFonts.forEach((font) => {
        const fontTagIds = fontTagsMap[font.id] || [];
        font.tags = fontTagIds
          .map((tagId) => {
            const tag = tagsData.find((t) => t.id === tagId);
            return tag ? tag.name : "";
          })
          .filter(Boolean);
      });

      setFonts(processedFonts);
      setTags(tagsData);

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
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a new tag
  const addTag = async () => {
    if (!newTag.trim()) return;

    try {
      const { data, error } = await supabase
        .from("tags")
        .insert([{ name: newTag.trim() }])
        .select();
      if (error) throw error;

      if (data && data.length > 0) {
        setTags([...tags, data[0]]);
        setNewTag("");
        toast({
          title: "Success",
          description: `Tag "${newTag}" added successfully`,
        });
      }
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    }
  };

  // Toggle tag selection for a font
  const toggleTag = (fontId: number, tagId: number) => {
    setSelectedTags((prev) => {
      const fontTags = prev[fontId] || [];
      const newFontTags = fontTags.includes(tagId)
        ? fontTags.filter((id) => id !== tagId)
        : [...fontTags, tagId];

      return {
        ...prev,
        [fontId]: newFontTags,
      };
    });
  };

  // Save tags for a font
  const saveFontTags = async (fontId: number) => {
    try {
      // Get current tags for this font
      const currentTags = selectedTags[fontId] || [];

      // Delete all existing relationships for this font
      const { error: deleteError } = await supabase
        .from("font_tags")
        .delete()
        .eq("font_id", fontId);
      if (deleteError) throw deleteError;

      // Insert new relationships
      if (currentTags.length > 0) {
        const fontTagsToInsert = currentTags.map((tagId) => ({
          font_id: fontId,
          tag_id: tagId,
        }));

        const { error: insertError } = await supabase
          .from("font_tags")
          .insert(fontTagsToInsert);
        if (insertError) throw insertError;
      }

      // Update local state
      setFonts((prevFonts) =>
        prevFonts.map((font) => {
          if (font.id === fontId) {
            const tagNames = currentTags
              .map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                return tag ? tag.name : "";
              })
              .filter(Boolean);

            return {
              ...font,
              tags: tagNames,
            };
          }
          return font;
        }),
      );

      setEditingFontId(null);
      toast({
        title: "Success",
        description: "Font tags updated successfully",
      });
    } catch (error) {
      console.error("Error saving font tags:", error);
      toast({
        title: "Error",
        description: "Failed to update font tags",
        variant: "destructive",
      });
    }
  };

  // Preview font
  const previewFont = (font: Font) => {
    setSelectedFont(font);
    setIsDialogOpen(true);
  };

  // Close font preview dialog
  const closeFontPreview = () => {
    setIsDialogOpen(false);
    setSelectedFont(null);
  };

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <div className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle>Admin Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                  />
                </div>
                <Button onClick={authenticate} className="w-full">
                  Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Font Admin Dashboard</h1>

        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Manage Tags</h2>
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="New tag name"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={addTag}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Tag
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>

        <h2 className="mb-4 text-xl font-semibold">Manage Fonts</h2>
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading fonts...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Font</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fonts.map((font) => (
                  <TableRow key={font.id}>
                    <TableCell className="font-medium">{font.name}</TableCell>
                    <TableCell>
                      <div
                        className="max-w-[200px] truncate text-xl"
                        style={{
                          fontFamily: font.loaded ? font.name : "system-ui",
                        }}
                      >
                        The quick brown fox
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-green-600">+{font.upvotes}</span>
                        <span className="text-red-600">-{font.downvotes}</span>
                        <span className="font-medium">
                          Net: {font.upvotes - font.downvotes}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingFontId === font.id ? (
                        <div className="flex max-w-[300px] flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant={
                                (selectedTags[font.id] || []).includes(tag.id)
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer"
                              onClick={() => toggleTag(font.id, tag.id)}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="flex max-w-[300px] flex-wrap gap-1">
                          {font.tags.length > 0 ? (
                            font.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No tags
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingFontId === font.id ? (
                          <Button
                            size="sm"
                            onClick={() => saveFontTags(font.id)}
                          >
                            <Save className="mr-1 h-4 w-4" />
                            Save
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingFontId(font.id)}
                          >
                            Edit Tags
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => previewFont(font)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Font Preview Dialog */}
        <FontPreviewDialog
          isOpen={isDialogOpen}
          onClose={closeFontPreview}
          font={selectedFont}
        />
      </div>
    </ToastProvider>
  );
}
