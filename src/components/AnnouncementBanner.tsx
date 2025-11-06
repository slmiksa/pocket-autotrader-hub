import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  content: string;
  background_color: string;
  text_color: string;
  whatsapp_number: string | null;
  whatsapp_text: string | null;
  website_url: string | null;
  website_text: string | null;
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

  const handleWhatsAppClick = () => {
    if (announcement.whatsapp_number) {
      window.open(`https://wa.me/${announcement.whatsapp_number}`, '_blank');
    }
  };

  const handleWebsiteClick = () => {
    if (announcement.website_url) {
      window.open(announcement.website_url, '_blank');
    }
  };

  return (
    <div 
      className="relative overflow-hidden py-3 px-4 shadow-md"
      style={{ 
        backgroundColor: announcement.background_color,
        color: announcement.text_color
      }}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 hover:opacity-70 transition-opacity rounded-md shrink-0"
            style={{ color: announcement.text_color }}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Scrolling content */}
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
              <span className="mx-6 text-sm font-medium inline-block">
                {announcement.content}
              </span>
              <span className="mx-6 text-sm font-medium inline-block">
                {announcement.content}
              </span>
              <span className="mx-6 text-sm font-medium inline-block">
                {announcement.content}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {announcement.whatsapp_number && (
              <Button
                onClick={handleWhatsAppClick}
                size="sm"
                className="gap-2"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: announcement.text_color,
                  borderColor: announcement.text_color
                }}
                variant="outline"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {announcement.whatsapp_text || 'تواصل معنا'}
                </span>
              </Button>
            )}
            
            {announcement.website_url && (
              <Button
                onClick={handleWebsiteClick}
                size="sm"
                className="gap-2"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: announcement.text_color,
                  borderColor: announcement.text_color
                }}
                variant="outline"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {announcement.website_text || 'زيارة الموقع'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
