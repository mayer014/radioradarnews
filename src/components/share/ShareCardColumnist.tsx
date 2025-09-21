import React from 'react';

interface ShareCardColumnistProps {
  title: string;
  category: string;
  coverImageUrl?: string;
  fallbackImageUrl: string;
  author: {
    name: string;
    avatarUrl?: string;
    bio: string;
    specialty: string;
  };
}

export const ShareCardColumnist: React.FC<ShareCardColumnistProps> = ({
  title,
  category,
  coverImageUrl,
  fallbackImageUrl,
  author
}) => {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-background/95 to-muted/20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent)] " />
      </div>
      
      {/* Article Image */}
      <div className="relative h-[35%] w-full overflow-hidden">
        <img 
          src={coverImageUrl || fallbackImageUrl}
          alt={title}
          className="w-full h-full object-cover"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>
      
      {/* Content Area */}
      <div className="relative p-6 h-[65%] flex flex-col justify-between">
        {/* Category Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              {category}
            </span>
          </div>
        </div>
        
        {/* Title */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <h1 className="text-2xl font-bold text-center text-foreground leading-tight line-clamp-3">
            {title}
          </h1>
        </div>
        
        {/* Columnist Profile */}
        <div className="flex items-center space-x-4 p-4 bg-card/50 rounded-lg border border-border/50">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {author.avatarUrl ? (
              <img
                src={author.avatarUrl}
                alt={author.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {author.name[0]?.toUpperCase() || 'C'}
                </span>
              </div>
            )}
          </div>
          
          {/* Columnist Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg">
              {author.name}
            </h3>
            <p className="text-sm text-primary font-medium mb-1">
              {author.specialty}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {author.bio}
            </p>
          </div>
        </div>
        
        {/* Portal Branding */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Portal RRN • Radar de Notícias
          </p>
        </div>
      </div>
    </div>
  );
};