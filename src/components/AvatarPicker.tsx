import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PRESET_AVATARS } from "./PresetAvatars";

export type AvatarSource = "oauth" | "github" | "preset";

export interface AvatarPickerProps {
  initialSource: AvatarSource;
  initialUrl: string | null;
  oauthUrl: string | null;
  githubUsername: string | null;
  onChange: (source: AvatarSource, url: string) => void;
}

export function AvatarPicker({
  initialSource,
  initialUrl,
  oauthUrl,
  githubUsername,
  onChange,
}: AvatarPickerProps) {
  const [source, setSource] = useState<AvatarSource>(initialSource);
  const [url, setUrl] = useState<string>(initialUrl || "");

  // When tab changes, update the source and URL
  const handleTabChange = (val: string) => {
    const newSource = val as AvatarSource;
    setSource(newSource);

    let newUrl = "";
    if (newSource === "oauth" && oauthUrl) {
      newUrl = oauthUrl;
    } else if (newSource === "github" && githubUsername) {
      newUrl = `https://github.com/${githubUsername}.png`;
    } else if (newSource === "preset") {
      newUrl = url.startsWith("preset:") ? url : "preset:terminal";
    }

    setUrl(newUrl);
    onChange(newSource, newUrl);
  };

  const handlePresetSelect = (presetId: string) => {
    const newUrl = `preset:${presetId}`;
    setUrl(newUrl);
    onChange("preset", newUrl);
  };

  const githubUrl = githubUsername ? `https://github.com/${githubUsername}.png` : null;

  // Render the current active avatar
  const renderCurrentAvatar = () => {
    if (source === "preset" && url.startsWith("preset:")) {
      const presetId = url.replace("preset:", "");
      const preset = PRESET_AVATARS.find((p) => p.id === presetId) || PRESET_AVATARS[0];
      const PresetComponent = preset.Component;
      return <PresetComponent className="w-full h-full rounded-full" />;
    }
    
    if (url) {
      return <img src={url} alt="Avatar" className="w-full h-full rounded-full object-cover" />;
    }
    
    return <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-mono text-sm">?</div>;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      <div className="shrink-0 flex flex-col items-center gap-2">
        <div className="w-24 h-24 rounded-full border-2 border-border shadow-sm overflow-hidden bg-background">
          {renderCurrentAvatar()}
        </div>
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Preview</span>
      </div>

      <div className="flex-1 w-full min-w-0">
        <Tabs value={source} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-sm mb-4">
            <TabsTrigger value="oauth" disabled={!oauthUrl} className="font-mono text-xs">OAuth</TabsTrigger>
            <TabsTrigger value="github" disabled={!githubUsername} className="font-mono text-xs">GitHub</TabsTrigger>
            <TabsTrigger value="preset" className="font-mono text-xs">Preset</TabsTrigger>
          </TabsList>

          <TabsContent value="oauth" className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Using the profile photo from your Google account.
            </p>
          </TabsContent>

          <TabsContent value="github" className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Using your public GitHub avatar. Update your GitHub username below to change this.
            </p>
          </TabsContent>

          <TabsContent value="preset">
            <div className="grid grid-cols-4 gap-3 max-w-sm">
              {PRESET_AVATARS.map((preset) => {
                const isActive = source === "preset" && url === `preset:${preset.id}`;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:scale-105 ${
                      isActive ? "border-amber shadow-[0_0_10px_oklch(0.76_0.14_75_/_0.4)]" : "border-transparent hover:border-border"
                    }`}
                    title={preset.label}
                  >
                    <preset.Component className="w-full h-full" />
                  </button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
