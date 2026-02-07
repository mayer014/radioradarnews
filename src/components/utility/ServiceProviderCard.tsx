import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AvailabilityBadge, { isAvailableNow } from './AvailabilityBadge';
import WhatsAppButton from './WhatsAppButton';
import type { ServiceProvider } from '@/hooks/useServiceProviders';

const ServiceProviderCard: React.FC<{ provider: ServiceProvider; index?: number }> = ({ provider, index = 0 }) => {
  const navigate = useNavigate();
  const available = isAvailableNow(provider.available_days, provider.start_time, provider.end_time);
  const categoryName = provider.category?.name || 'Serviço';
  const categoryIcon = provider.category?.icon || '🔧';

  return (
    <div
      className="group relative rounded-2xl overflow-hidden bg-card cursor-pointer transition-all duration-500 hover:-translate-y-2 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
      onClick={() => navigate(`/prestadores/${provider.id}`)}
    >
      {/* Animated border */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-blue-500 opacity-40 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

      {/* Inner content */}
      <div className="relative bg-card rounded-2xl overflow-hidden m-[1px]">
        {/* Shimmer bar */}
        <div className="relative h-2 bg-gradient-to-r from-primary via-purple-500 to-blue-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-4 space-y-2.5">
          {/* Category + live dot */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
              <span className="text-sm">{categoryIcon}</span> {categoryName}
            </span>
            {available && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
            )}
          </div>

          {/* Name — large & prominent */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground group-hover:text-primary transition-colors duration-300 leading-tight tracking-tight">
              {provider.name}
            </h3>
            <div className="h-0.5 w-12 group-hover:w-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 mt-1.5 rounded-full" />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{provider.description}</p>

          {/* Location — simple text, no box */}
          <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
            <span>{provider.city}{provider.neighborhood ? ` · ${provider.neighborhood}` : ''}</span>
          </p>

          {/* Availability */}
          <AvailabilityBadge availableDays={provider.available_days} startTime={provider.start_time} endTime={provider.end_time} />

          {/* Charges — elegant inline text */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1">
              {provider.charges_estimate
                ? <><span className="text-amber-400">●</span> Cobra orçamento</>
                : <><span className="text-green-400">●</span> Orçamento grátis</>
              }
            </span>
            <span className="text-muted-foreground/30">|</span>
            <span className="flex items-center gap-1">
              {provider.charges_displacement
                ? <><span className="text-amber-400">●</span> Cobra deslocamento</>
                : <><span className="text-green-400">●</span> Deslocamento grátis</>
              }
            </span>
          </div>

          {/* Ver detalhes */}
          <div className="flex items-center gap-1.5 text-xs text-primary/60 group-hover:text-primary transition-colors pt-1">
            <span>Ver detalhes</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
          </div>

          {/* WhatsApp */}
          <div onClick={e => e.stopPropagation()}>
            <WhatsAppButton
              phone={provider.whatsapp}
              message="Olá, vi seu cadastro no site RRN – Rádio Radar News e gostaria de mais informações."
              entityType="service_provider"
              entityId={provider.id}
              className="w-full rounded-xl font-bold py-3 text-base shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-[1.02] transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderCard;
