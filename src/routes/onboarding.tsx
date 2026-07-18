import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Terminal, ArrowRight, SkipForward } from "lucide-react";
import { AvatarPicker, AvatarSource } from "@/components/AvatarPicker";
import { toast } from "sonner";
import { getProfileFn, completeOnboardingFn, checkUsernameFn } from "@/functions/profile";
import { z } from "zod";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — pycourse" },
    ],
  }),
  component: OnboardingPage,
});

const onboardingSchema = z.object({
  username: z.string().regex(/^[a-z0-9_-]{3,20}$/, "3-20 chars: a-z, 0-9, _, -"),
  bio: z.string().max(160, "Max 160 characters").optional(),
});

function OnboardingPage() {
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const p = await getProfileFn();
        // If they already completed it, don't let them double-fire
        if (p?.has_completed_onboarding) {
          navigate({ to: "/", replace: true });
        }
        return p;
      } catch (err) {
        navigate({ to: "/login", replace: true });
        return null;
      }
    },
  });

  const [form, setForm] = useState({
    username: "",
    bio: "",
  });

  const [avatar, setAvatar] = useState<{ source: AvatarSource; url: string }>({
    source: "oauth",
    url: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "loading" | "available" | "taken">("idle");

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username || "",
        bio: profile.bio || "",
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
        onboardingSchema.pick({ username: true }).parse({ username: form.username });
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

  const completeMutation = useMutation({
    mutationFn: async (skip: boolean = false) => {
      let dataToSave = {
        username: profile?.username || "",
        bio: profile?.bio || "",
        avatar_source: (profile?.avatar_source as AvatarSource) || "oauth",
        avatar_url: profile?.avatar_url || "",
        github_username: profile?.github_username || null,
        twitter_username: profile?.twitter_username || null,
        linkedin_url: profile?.linkedin_url || null,
        website_url: profile?.website_url || null,
      };

      if (!skip) {
        // 1. Client-side validation
        try {
          onboardingSchema.parse(form);
        } catch (err) {
          if (err instanceof z.ZodError) {
            const newErrs: Record<string, string> = {};
            err.errors.forEach(e => { if (e.path[0]) newErrs[e.path[0].toString()] = e.message; });
            setErrors(newErrs);
            throw new Error("Validation failed");
          }
        }

        if (usernameStatus === "taken") throw new Error("Username taken");

        dataToSave = {
          ...dataToSave,
          username: form.username,
          bio: form.bio,
          avatar_source: avatar.source,
          avatar_url: avatar.url,
        };
      }

      // 3. Save & set has_completed_onboarding = true
      return completeOnboardingFn({ data: dataToSave });
    },
    onSuccess: () => {
      toast.success("Welcome aboard!");
      window.dispatchEvent(new CustomEvent("pyc-session-change")); // Refresh nav avatar
      navigate({ to: "/", replace: true });
    },
    onError: (err) => {
      if (err.message !== "Validation failed") {
        toast.error(err.message || "Failed to complete onboarding.");
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

  if (isLoading || profile?.has_completed_onboarding) {
    return <div className="p-8 font-mono text-muted-foreground animate-pulse">Initializing...</div>;
  }

  if (!profile) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-ink p-6 border-b border-border flex items-center gap-3">
          <Terminal className="h-6 w-6 text-amber" />
          <h1 className="font-mono text-xl font-bold text-foreground">
            $ ./setup_profile.sh
          </h1>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          <div className="font-mono text-sm text-muted-foreground">
            <p>Welcome! We've generated a default profile for you.</p>
            <p className="mt-1">Customize it now or skip and do it later.</p>
          </div>

          <section className="space-y-4">
            <h2 className="font-mono text-sm text-amber font-semibold"># avatar</h2>
            <AvatarPicker 
              initialSource={(profile.avatar_source as AvatarSource) || "oauth"}
              initialUrl={profile.avatar_url}
              oauthUrl={profile.image}
              githubUsername={""}
              onChange={(source, url) => setAvatar({ source, url })}
            />
          </section>

          <section className="space-y-4">
            <h2 className="font-mono text-sm text-teal font-semibold"># identity</h2>
            
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
                <label className="font-mono text-xs text-muted-foreground block">bio (optional)</label>
                <span className={`font-mono text-xs ${form.bio.length > 160 ? "text-coral" : "text-muted-foreground"}`}>
                  {form.bio.length}/160
                </span>
              </div>
              <textarea 
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={2}
                className="w-full font-sans text-sm bg-background border border-border rounded px-3 py-2 outline-none focus:border-amber resize-none"
                placeholder="Student at..."
              />
              {errors.bio && <p className="font-mono text-xs text-coral">{errors.bio}</p>}
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border">
            <button 
              type="button" 
              onClick={() => completeMutation.mutate(true)}
              disabled={completeMutation.isPending}
              className="px-6 py-2 flex items-center justify-center gap-2 font-mono text-sm rounded border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
            >
              <span>Skip for now</span>
              <SkipForward className="w-4 h-4" />
            </button>
            <button 
              type="button"
              disabled={completeMutation.isPending || usernameStatus === "taken" || usernameStatus === "loading"}
              onClick={() => completeMutation.mutate(false)}
              className="flex justify-center items-center gap-2 px-8 py-2 bg-amber text-amber-foreground font-mono font-bold text-sm rounded hover:bg-amber/90 transition-colors disabled:opacity-50 shadow-lg shadow-amber/20"
            >
              {completeMutation.isPending ? "Configuring..." : (
                <>
                  <span>Let's Go!</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
