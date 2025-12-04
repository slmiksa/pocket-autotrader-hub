import authBackground from "@/assets/auth-background.jpg";

interface PageBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const PageBackground = ({ children, className = "" }: PageBackgroundProps) => {
  return (
    <div 
      className={`min-h-screen relative ${className}`}
      style={{
        backgroundImage: `url(${authBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px]" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
