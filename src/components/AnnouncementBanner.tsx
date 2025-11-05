import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface Announcement {
  id: string;
  content: string;
  background_color: string;
  text_color: string;
}

export const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    loadAnnouncement();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('announcement-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcement_banner'
        },
        () => {
          loadAnnouncement();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAnnouncement = async () => {
    const { data } = await supabase
      .from('announcement_banner')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setAnnouncement(data);
      setIsVisible(true);
    }
  };

  if (!announcement || !isVisible) return null;

  return (
    <div 
      className="relative overflow-hidden py-2 px-4"
      style={{ 
        backgroundColor: announcement.background_color,
        color: announcement.text_color
      }}
    >
      <div className="animate-marquee whitespace-nowrap">
        <span className="mx-4 text-sm font-medium inline-block">
          {announcement.content}
        </span>
        <span className="mx-4 text-sm font-medium inline-block">
          {announcement.content}
        </span>
        <span className="mx-4 text-sm font-medium inline-block">
          {announcement.content}
        </span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
        style={{ color: announcement.text_color }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
