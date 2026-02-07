import React from 'react';
import { MapPin, Sparkles, ArrowRight } from 'lucide-react';
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
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
      onClick={() => navigate(`/prestadores/${provider.id}`)}
    >
      {/* Animated border glow */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-blue-500 opacity-30 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />

      {/* Inner content */}
      <div className="relative bg-card rounded-2xl overflow-hidden m-[1px]">
        {/* Top gradient bar with shimmer */}
        <div className="relative h-2 bg-gradient-to-r from-primary via-purple-500 to-blue-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" style={{ animation: 'shimmer 2s infinite' }} />
        </div>

        {/* Category ribbon */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4">
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

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 space-y-3">
          {/* Name with animated underline on hover */}
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
              {provider.name}
            </h3>
            <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 mt-1 rounded-full" />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{provider.description}</p>

          {/* Location */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary max-w-full">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{provider.city}{provider.neighborhood ? ` - ${provider.neighborhood}` : ''}</span>
          </div>

          {/* Availability */}
          <AvailabilityBadge availableDays={provider.available_days} startTime={provider.start_time} endTime={provider.end_time} />

          {/* Charges pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              provider.charges_estimate 
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                : 'bg-green-500/10 border border-green-500/20 text-green-400'
            }`}>
              {provider.charges_estimate ? '💰 Cobra orçamento' : '✅ Orçamento grátis'}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              provider.charges_displacement 
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                : 'bg-green-500/10 border border-green-500/20 text-green-400'
            }`}>
              {provider.charges_displacement ? '🚗 Cobra deslocamento' : '✅ Deslocamento grátis'}
            </span>
          </div>

          {/* "Ver detalhes" teaser */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors duration-300">
            <Sparkles className="h-3 w-3" />
            <span>Ver detalhes</span>
            <ArrowRight className="h-3 w-3 translate-x-0 group-hover:translate-x-1 transition-transform duration-300" />
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
