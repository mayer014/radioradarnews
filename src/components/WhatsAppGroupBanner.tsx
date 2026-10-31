import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Bell, ArrowRight, Sparkles } from 'lucide-react';

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/JugNpLZXHRdBdNjlg13XVZ';

const RotatingText: React.FC<{ texts: string[] }> = ({ texts }) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % texts.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <span
      className="inline-block transition-all duration-300 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {texts[index]}
    </span>
  );
};

const WhatsAppGroupBanner: React.FC = () => {
  return (
    <section className="py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div
          onClick={() => window.open(WHATSAPP_GROUP_LINK, '_blank')}
          className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_32px_-16px_hsl(var(--secondary)/0.2)]"
        >
          {/* Animated border glow */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-secondary/40 via-secondary/25 to-secondary/40 opacity-80 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

          <div className="relative m-[1px] rounded-2xl overflow-hidden bg-card text-card-foreground">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/[0.18] via-secondary/[0.10] to-primary/[0.08]" />
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-secondary/70 via-secondary/30 to-transparent" />
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent" style={{ animation: 'shimmer 3s ease-in-out infinite' }} />

            {/* Floating particles */}
            <div className="absolute top-2 left-[10%] w-2 h-2 bg-primary/15 rounded-full animate-pulse" />
            <div className="absolute bottom-3 left-[30%] w-1.5 h-1.5 bg-primary/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-4 right-[20%] w-1 h-1 bg-secondary/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-2 right-[40%] w-2 h-2 bg-secondary/10 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />

            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 sm:py-6">
              {/* Left: Icon + Text */}
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-secondary/25 bg-secondary/[0.15] backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-secondary fill-secondary/10" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-secondary/20 bg-secondary/10 text-secondary text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      <Bell className="h-3 w-3 animate-[bounce-x_1.5s_ease-in-out_infinite]" />
                      Grupo Exclusivo
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground text-[10px] font-medium">
                      <Users className="h-3 w-3" />
                      Comunidade ativa
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-foreground leading-tight">
                    Entre no nosso grupo de{' '}
                    <span className="text-secondary">
                      <RotatingText texts={['Notícias!', 'Novidades!', 'Oportunidades!', 'Informação!']} />
                    </span>
                  </h3>

                  <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                    Receba as principais notícias e novidades direto no seu WhatsApp
                  </p>
                </div>
              </div>

              {/* Right: CTA Button */}
              <div className="flex-shrink-0">
                <div className="inline-flex items-center gap-2.5 px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl border border-secondary/35 bg-secondary/20 text-foreground font-extrabold text-sm sm:text-base group-hover:bg-secondary/30 group-hover:border-secondary/50 group-hover:scale-105 transition-all duration-300">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                  Entrar no Grupo
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 animate-[bounce-x_1.5s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppGroupBanner;
