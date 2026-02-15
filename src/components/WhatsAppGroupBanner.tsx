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
          className="group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(37,211,102,0.3)]"
        >
          {/* Animated border glow */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#25d366] via-[#128C7E] to-[#25d366] opacity-60 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

          <div className="relative m-[1px] rounded-2xl overflow-hidden bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25d366]">
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer 3s ease-in-out infinite' }} />

            {/* Floating particles */}
            <div className="absolute top-2 left-[10%] w-2 h-2 bg-white/20 rounded-full animate-pulse" />
            <div className="absolute bottom-3 left-[30%] w-1.5 h-1.5 bg-white/15 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-4 right-[20%] w-1 h-1 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-2 right-[40%] w-2 h-2 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />

            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 sm:py-6">
              {/* Left: Icon + Text */}
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-white fill-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      <Bell className="h-3 w-3 animate-[bounce-x_1.5s_ease-in-out_infinite]" />
                      Grupo Exclusivo
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-medium">
                      <Users className="h-3 w-3" />
                      Comunidade ativa
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight">
                    Entre no nosso grupo de{' '}
                    <span className="text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]">
                      <RotatingText texts={['Notícias!', 'Novidades!', 'Oportunidades!', 'Informação!']} />
                    </span>
                  </h3>

                  <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                    Receba as principais notícias e novidades direto no seu WhatsApp
                  </p>
                </div>
              </div>

              {/* Right: CTA Button */}
              <div className="flex-shrink-0">
                <div className="inline-flex items-center gap-2.5 px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl bg-white text-[#075E54] font-extrabold text-sm sm:text-base shadow-xl group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#25d366]" />
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
