import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AvailabilityBadge from '@/components/utility/AvailabilityBadge';
import WhatsAppButton from '@/components/utility/WhatsAppButton';
import { useServiceProviders, type ServiceProvider } from '@/hooks/useServiceProviders';
import { MapPin, ArrowLeft, Clock, Info } from 'lucide-react';

const ServiceProviderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProvider } = useServiceProviders();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getProvider(id).then(({ data }) => { setProvider(data); setLoading(false); });
    }
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background"><Navigation /><div className="pt-24 text-center text-muted-foreground">Carregando...</div></div>;
  if (!provider) return <div className="min-h-screen bg-background"><Navigation /><div className="pt-24 text-center text-muted-foreground">Prestador não encontrado.</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <Link to="/prestadores" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
              <div>
                {provider.category && (
                  <Badge variant="outline" className="border-primary/40 mb-2">
                    {provider.category.icon} {provider.category.name}
                  </Badge>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{provider.name}</h1>
              </div>
              <AvailabilityBadge availableDays={provider.available_days} startTime={provider.start_time} endTime={provider.end_time} />
            </div>

            <p className="text-muted-foreground mb-6">{provider.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />{provider.city}{provider.neighborhood ? ` - ${provider.neighborhood}` : ''}</div>
              <div className="flex items-center gap-2 text-sm"><Info className="h-4 w-4 text-primary" />{provider.charges_estimate ? 'Cobra orçamento' : 'Orçamento grátis'}</div>
              <div className="flex items-center gap-2 text-sm"><Info className="h-4 w-4 text-primary" />{provider.charges_displacement ? 'Cobra deslocamento' : 'Deslocamento grátis'}</div>
              <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-primary" />Desde {new Date(provider.created_at).toLocaleDateString('pt-BR')}</div>
            </div>

            {provider.notes && (
              <div className="bg-muted/30 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium mb-1">Observações:</p>
                <p className="text-sm text-muted-foreground">{provider.notes}</p>
              </div>
            )}

            <WhatsAppButton
              phone={provider.whatsapp}
              message="Olá, vi seu cadastro no site RRN – Rádio Radar News e gostaria de mais informações."
              entityType="service_provider"
              entityId={provider.id}
              className="w-full text-lg py-6"
            />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceProviderDetail;
