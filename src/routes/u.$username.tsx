import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Github, Twitter, Linkedin, Globe, MapPin, Calendar, Award } from "lucide-react";
import { getPublicProfileFn } from "@/functions/profile";
import { PRESET_AVATARS } from "@/components/PresetAvatars";
import { badgeDefs, calculateStreak } from "@/lib/progress";
import { modules } from "@/lib/modules";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/u/$username")({
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { username } = Route.useParams();
  const { user: currentUser } = useSession();
  
  const { data, isLoading } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: () => getPublicProfileFn({ data: { username } }),
  });

  if (isLoading) {
    return <div className="p-10 text-center font-mono text-muted-foreground animate-pulse">Loading profile...</div>;
  }

  if (!data || !data.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-4xl font-display">404 Not Found</h1>
        <p className="font-mono text-muted-foreground text-sm">User @{username} does not exist.</p>
        <Link to="/" className="text-amber hover:underline font-mono text-sm">Return home</Link>
      </div>
    );
  }

  const { user, progress } = data;
  const isMe = currentUser?.username === user.username;
  const streak = calculateStreak(progress.activeDates);

  const renderAvatar = () => {
    if (user.avatar_source === "preset" && user.avatar_url?.startsWith("preset:")) {
      const presetId = user.avatar_url.replace("preset:", "");
      const preset = PRESET_AVATARS.find(p => p.id === presetId) || PRESET_AVATARS[0];
      const PresetComponent = preset.Component;
      return <PresetComponent className="w-full h-full rounded-full" />;
    }
    
    if (user.avatar_url) {
      return <img src={user.avatar_url} alt={user.name || username} className="w-full h-full rounded-full object-cover" />;
    }
    
    return <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-mono text-2xl">?</div>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid md:grid-cols-[300px_1fr] gap-10">
        
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full border-4 border-background shadow-md overflow-hidden bg-background mb-4 relative group">
              {renderAvatar()}
            </div>
            
            <h1 className="text-2xl font-bold font-sans text-foreground">
              {user.name || user.username}
            </h1>
            <p className="font-mono text-amber-dark mb-4">@{user.username}</p>
            
            {user.bio && (
              <p className="text-sm text-foreground/80 font-sans mb-6 text-left w-full">
                {user.bio}
              </p>
            )}
            
            <div className="w-full flex flex-col gap-3">
              {user.github_username && (
                <a href={`https://github.com/${user.github_username}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-secondary">
                  <Github className="w-4 h-4" />
                  <span className="truncate">{user.github_username}</span>
                </a>
              )}
              
              {user.twitter_username && (
                <a href={`https://twitter.com/${user.twitter_username}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-secondary">
                  <Twitter className="w-4 h-4" />
                  <span className="truncate">@{user.twitter_username}</span>
                </a>
              )}
              
              {user.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-secondary">
                  <Linkedin className="w-4 h-4" />
                  <span className="truncate">LinkedIn</span>
                </a>
              )}
              
              {user.website_url && (
                <a href={user.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-secondary">
                  <Globe className="w-4 h-4" />
                  <span className="truncate">Website</span>
                </a>
              )}
            </div>

            {isMe && (
              <Link to="/profile/edit" className="mt-6 w-full py-2 bg-secondary text-foreground rounded font-mono text-sm border border-border hover:border-amber transition-colors">
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Stats & Badges */}
        <div className="space-y-8">
          
          <section>
            <h2 className="font-mono text-sm text-teal mb-4"># progress_stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-5 flex flex-col justify-center items-center">
                <span className="text-3xl font-display font-bold text-amber-dark">{progress.completedCount}</span>
                <span className="font-mono text-xs text-muted-foreground mt-1">/ {modules.length} Modules</span>
              </div>
              <div className="bg-card border border-border rounded-lg p-5 flex flex-col justify-center items-center">
                <span className="text-3xl font-display font-bold text-amber-dark">{streak}</span>
                <span className="font-mono text-xs text-muted-foreground mt-1">Day Streak 🔥</span>
              </div>
              <div className="bg-card border border-border rounded-lg p-5 flex flex-col justify-center items-center">
                <span className="text-3xl font-display font-bold text-teal-dark">{progress.challengesCount}</span>
                <span className="font-mono text-xs text-muted-foreground mt-1">Challenges</span>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-mono text-sm text-teal"># badges.showcase()</h2>
              <span className="font-mono text-xs text-muted-foreground">{progress.badges.length} / {badgeDefs.length} unlocked</span>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-3">
              {badgeDefs.map((b) => {
                const unlocked = progress.badges.includes(b.id);
                if (!unlocked) return null; // Only show unlocked badges on public profile
                
                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-lg border font-mono text-sm border-teal bg-teal/5 shadow-[0_0_14px_oklch(0.66_0.08_175_/_0.25)]"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-base text-teal">#{b.label}</span>
                      <Award className="w-4 h-4 text-teal" />
                    </div>
                    <p className="mt-2 text-foreground/80 font-sans text-sm">{b.desc}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-teal/30 overflow-hidden">
                      <div className="h-full bg-teal w-full" />
                    </div>
                  </div>
                );
              })}
              
              {progress.badges.length === 0 && (
                <div className="col-span-2 p-8 border border-dashed border-border rounded-lg text-center font-mono text-muted-foreground text-sm">
                  No badges unlocked yet.
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
