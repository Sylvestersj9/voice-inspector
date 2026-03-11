import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Announcement = {
  id: string;
  message: string;
  type: "info" | "warning" | "success";
};

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("active", true)
          .or(`expires_at.is.null,expires_at.gte.${now}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const dismissKey = `dismissed_announcement_${data.id}`;
          const isDismissed = localStorage.getItem(dismissKey) === "true";
          if (!isDismissed) {
            setAnnouncement({
              id: data.id,
              message: data.message,
              type: data.type || "info",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load announcement:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncement();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem(`dismissed_announcement_${announcement.id}`, "true");
      setDismissed(true);
      setAnnouncement(null);
    }
  };

  if (loading || !announcement) return null;

  const bgColor = {
    info: "bg-teal-50 border-teal-200",
    warning: "bg-amber-50 border-amber-200",
    success: "bg-emerald-50 border-emerald-200",
  }[announcement.type];

  const textColor = {
    info: "text-teal-800",
    warning: "text-amber-800",
    success: "text-emerald-800",
  }[announcement.type];

  return (
    <div className={`rounded-xl border ${bgColor} p-4 mb-4 flex items-start gap-3`}>
      <div className={`flex-1 text-sm font-medium ${textColor}`}>
        {announcement.message}
      </div>
      <button
        onClick={handleDismiss}
        className={`shrink-0 p-1 rounded hover:opacity-70 transition-opacity`}
        title="Dismiss"
      >
        <X className={`h-4 w-4 ${textColor}`} />
      </button>
    </div>
  );
}
