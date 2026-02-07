import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AvailabilityBadge from './AvailabilityBadge';
import WhatsAppButton from './WhatsAppButton';
import type { ServiceProvider } from '@/hooks/useServiceProviders';

const ServiceProviderCard: React.FC<{ provider: ServiceProvider }> = ({ provider }) => {
  const navigate = useNavigate();

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border border-primary/20 hover:border-primary/50 bg-card cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_-8px_hsl(var(--primary)/0.3)] hover:-translate-y-1"
      onClick={() => navigate(`/prestadores/${provider.id}`)}
    >
      {/* Top gradient accent */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Name & description */}
        <div>
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
            {provider.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{provider.description}</p>
        </div>

        {/* Location pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{provider.city}{provider.neighborhood ? ` - ${provider.neighborhood}` : ''}</span>
        </div>

        {/* Availability */}
        <AvailabilityBadge availableDays={provider.available_days} startTime={provider.start_time} endTime={provider.end_time} />

        {/* Charges pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
            provider.charges_estimate 
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
              : 'bg-green-500/10 border border-green-500/20 text-green-400'
          }`}>
            {provider.charges_estimate ? '💰 Cobra orçamento' : '✅ Orçamento grátis'}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
            provider.charges_displacement 
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
              : 'bg-green-500/10 border border-green-500/20 text-green-400'
          }`}>
            {provider.charges_displacement ? '🚗 Cobra deslocamento' : '✅ Deslocamento grátis'}
          </span>
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
  );
};

export default ServiceProviderCard;
