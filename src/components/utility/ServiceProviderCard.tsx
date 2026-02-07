import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AvailabilityBadge from './AvailabilityBadge';
import WhatsAppButton from './WhatsAppButton';
import type { ServiceProvider } from '@/hooks/useServiceProviders';

interface ServiceProviderCardProps {
  provider: ServiceProvider;
}

const ServiceProviderCard: React.FC<ServiceProviderCardProps> = ({ provider }) => {
  const navigate = useNavigate();

  return (
    <Card
      className="bg-gradient-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
      onClick={() => navigate(`/prestadores/${provider.id}`)}
    >
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Name */}
        <h3 className="text-lg font-bold text-foreground leading-tight">{provider.name}</h3>

        {/* Profession / Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{provider.description}</p>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{provider.city}{provider.neighborhood ? ` - ${provider.neighborhood}` : ''}</span>
        </div>

        {/* Availability */}
        <AvailabilityBadge availableDays={provider.available_days} startTime={provider.start_time} endTime={provider.end_time} />

        {/* Charges info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>{provider.charges_estimate ? '💰 Cobra orçamento' : '✅ Orçamento grátis'}</span>
          <span>{provider.charges_displacement ? '🚗 Cobra deslocamento' : '✅ Deslocamento grátis'}</span>
        </div>

        {/* WhatsApp */}
        <div onClick={e => e.stopPropagation()}>
          <WhatsAppButton
            phone={provider.whatsapp}
            message="Olá, vi seu cadastro no site RRN – Rádio Radar News e gostaria de mais informações."
            entityType="service_provider"
            entityId={provider.id}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceProviderCard;
