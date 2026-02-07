import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <Card className="bg-gradient-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer" onClick={() => navigate(`/prestadores/${provider.id}`)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {provider.category && (
                <Badge variant="outline" className="border-primary/40 text-xs">
                  {provider.category.icon} {provider.category.name}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-bold text-foreground truncate">{provider.name}</h3>
          </div>
          <AvailabilityBadge availableDays={provider.available_days} startTime={provider.start_time} endTime={provider.end_time} />
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{provider.description}</p>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3.5 w-3.5" />
          <span>{provider.city}{provider.neighborhood ? ` - ${provider.neighborhood}` : ''}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
          {provider.charges_estimate !== undefined && (
            <span>{provider.charges_estimate ? '💰 Cobra orçamento' : '✅ Orçamento grátis'}</span>
          )}
          {provider.charges_displacement !== undefined && (
            <span>{provider.charges_displacement ? '🚗 Cobra deslocamento' : '✅ Deslocamento grátis'}</span>
          )}
        </div>

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
