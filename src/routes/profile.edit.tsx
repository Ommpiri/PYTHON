import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Terminal, Save, AlertCircle } from "lucide-react";
import { AvatarPicker, AvatarSource } from "@/components/AvatarPicker";
import { toast } from "sonner";
import { getProfileFn, updateProfileFn, checkUsernameFn, validateGithubUsernameFn } from "@/functions/profile";
import { z } from "zod";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({
    meta: [
      { title: "Edit Profile — pycourse" },
    ],
  }),
  component: ProfileEditPage,
});

const profileSchema = z.object({
  username: z.string().regex(/^[a-z0-9_-]{3,20}$/, "3-20 chars: a-z, 0-9, _, -"),
  bio: z.string().max(160, "Max 160 characters"),
  github_username: z.string().optional(),
  twitter_username: z.string().optional(),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

function ProfileEditPage() {
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        return await getProfileFn();
      } catch (err) {
        navigate({ to: "/login" });
        return null;
      }
    },
  });

  const [form, setForm] = useState({
    username: "",
    bio: "",
    github_username: "",
    twitter_username: "",
    linkedin_url: "",
    website_url: "",
  });

  const [avatar, setAvatar] = useState<{ source: AvatarSource; url: string }>({
    source: "oauth",
    url: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "loading" | "available" | "taken">("idle");
  const [githubWarning, setGithubWarning] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username || "",
        bio: profile.bio || "",
        github_username: profile.github_username || "",
        twitter_username: profile.twitter_username || "",
        linkedin_url: profile.linkedin_url || "",
        website_url: profile.website_url || "",
      });
      setAvatar({
        source: (profile.avatar_source as AvatarSource) || "oauth",
        url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  // Debounced username check
  useEffect(() => {
    if (!profile || form.username === profile.username || !form.username) {
      setUsernameStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        profileSchema.pick({ username: true }).parse({ username: form.username });
        setUsernameStatus("loading");
        const res = await checkUsernameFn({ data: { username: form.username } });
        setUsernameStatus(res.available ? "available" : "taken");
        
        if (!res.available) {
          setErrors((e) => ({ ...e, username: "Username is already taken" }));
        } else {
          setErrors((e) => {
            const { username, ...rest } = e;
            return rest;
          });
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          setErrors((e) => ({ ...e, username: err.errors[0].message }));
          setUsernameStatus("idle");
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.username, profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // 1. Client-side validation
      try {
        profileSchema.parse(form);
      } catch (err) {
        if (err instanceof z.ZodError) {
          const newErrs: Record<string, string> = {};
          err.errors.forEach(e => { if (e.path[0]) newErrs[e.path[0].toString()] = e.message; });
          setErrors(newErrs);
          throw new Error("Validation failed");
        }
      }

      if (usernameStatus === "taken") throw new Error("Username taken");

      // 2. Validate GitHub if present
      if (form.github_username && form.github_username !== profile?.github_username) {
        const ghRes = await validateGithubUsernameFn({ data: { username: form.github_username } });
        if (!ghRes.valid) {
          setGithubWarning(`GitHub handle issue: ${ghRes.error}. Saved anyway.`);
        } else {
          setGithubWarning(null);
        }
      }

      // 3. Save
      return updateProfileFn({
        data: {
          username: form.username,
          bio: form.bio,
          avatar_source: avatar.source,
          avatar_url: avatar.url,
          github_username: form.github_username,
          twitter_username: form.twitter_username,
          linkedin_url: form.linkedin_url,
          website_url: form.website_url,
        }
      });
    },
    onSuccess: () => {
      toast.success("Profile saved successfully.");
      window.dispatchEvent(new CustomEvent("pyc-session-change")); // Refresh nav avatar
      navigate({ to: "/u/$username", params: { username: form.username } });
    },
    onError: (err) => {
      if (err.message !== "Validation failed") {
        toast.error(err.message || "Failed to save profile.");
      }
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    
    // Clear field error
    if (errors[name] && name !== "username") {
      setErrors((errs) => {
        const newErrs = { ...errs };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 font-mono text-muted-foreground animate-pulse">Loading profile data...</div>;
  }

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
        <Terminal className="h-5 w-5 text-amber" />
        <h1 className="font-mono text-lg font-bold text-foreground">
          $ profile --edit
        </h1>
      </div>

      <div className="space-y-8">
        {/* Avatar Section */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-mono text-sm text-amber mb-4"># avatar_config</h2>
          <AvatarPicker 
            initialSource={(profile.avatar_source as AvatarSource) || "oauth"}
            initialUrl={profile.avatar_url}
            oauthUrl={profile.image}
            githubUsername={form.github_username}
            onChange={(source, url) => setAvatar({ source, url })}
          />
        </section>

        <section className="bg-card border border-border rounded-lg p-6 space-y-6">
          <h2 className="font-mono text-sm text-teal"># identity</h2>
          
          <div className="space-y-2">
            <label className="font-mono text-xs text-muted-foreground block">username</label>
            <div className="relative">
              <input 
                name="username"
                value={form.username}
                onChange={handleChange}
                className={`w-full font-mono text-sm bg-background border rounded px-3 py-2 outline-none focus:border-amber ${errors.username ? "border-coral" : "border-border"}`}
              />
              <div className="absolute right-3 top-2.5 text-xs font-mono">
                {usernameStatus === "loading" && <span className="text-muted-foreground animate-pulse">checking...</span>}
                {usernameStatus === "available" && <span className="text-teal">✓ available</span>}
                {usernameStatus === "taken" && <span className="text-coral">✗ taken</span>}
              </div>
            </div>
            {errors.username && <p className="font-mono text-xs text-coral">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="font-mono text-xs text-muted-foreground block">bio</label>
              <span className={`font-mono text-xs ${form.bio.length > 160 ? "text-coral" : "text-muted-foreground"}`}>
                {form.bio.length}/160
              </span>
            </div>
            <textarea 
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="w-full font-sans text-sm bg-background border border-border rounded px-3 py-2 outline-none focus:border-amber resize-none"
              placeholder="Tell other students about yourself..."
            />
            {errors.bio && <p className="font-mono text-xs text-coral">{errors.bio}</p>}
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="font-mono text-sm text-teal"># socials (optional)</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground block">github_username</label>
              <input 
                name="github_username"
                value={form.github_username}
                onChange={handleChange}
                className="w-full font-sans text-sm bg-background border border-border rounded px-3 py-2 outline-none focus:border-amber"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground block">twitter_username</label>
              <input 
                name="twitter_username"
                value={form.twitter_username}
                onChange={handleChange}
                className="w-full font-sans text-sm bg-background border border-border rounded px-3 py-2 outline-none focus:border-amber"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground block">linkedin_url</label>
              <input 
                name="linkedin_url"
                value={form.linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..."
                className={`w-full font-sans text-sm bg-background border rounded px-3 py-2 outline-none focus:border-amber ${errors.linkedin_url ? "border-coral" : "border-border"}`}
              />
              {errors.linkedin_url && <p className="font-mono text-xs text-coral">{errors.linkedin_url}</p>}
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground block">website_url</label>
              <input 
                name="website_url"
                value={form.website_url}
                onChange={handleChange}
                placeholder="https://..."
                className={`w-full font-sans text-sm bg-background border rounded px-3 py-2 outline-none focus:border-amber ${errors.website_url ? "border-coral" : "border-border"}`}
              />
              {errors.website_url && <p className="font-mono text-xs text-coral">{errors.website_url}</p>}
            </div>
          </div>

          {githubWarning && (
            <div className="mt-4 p-3 bg-coral/10 border border-coral/30 rounded flex gap-2 items-start text-coral">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm font-sans">{githubWarning}</p>
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3 pt-4">
          {profile.has_completed_onboarding && (
            <button 
              type="button" 
              onClick={() => navigate({ to: "/u/$username", params: { username: profile.username || "" } })}
              className="px-4 py-2 font-mono text-sm rounded border border-border hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            type="button"
            disabled={updateMutation.isPending || usernameStatus === "taken" || usernameStatus === "loading"}
            onClick={() => updateMutation.mutate()}
            className="flex items-center gap-2 px-6 py-2 bg-amber text-amber-foreground font-mono font-bold text-sm rounded hover:bg-amber/90 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
