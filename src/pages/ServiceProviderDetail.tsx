import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AvailabilityBadge from '@/components/utility/AvailabilityBadge';
import WhatsAppButton from '@/components/utility/WhatsAppButton';
import { useServiceProviders, type ServiceProvider } from '@/hooks/useServiceProviders';
import { MapPin, ArrowLeft, Clock } from 'lucide-react';

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

  const categoryName = provider.category?.name || 'Serviço';
  const categoryIcon = provider.category?.icon || '🔧';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <Link to="/prestadores" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="relative rounded-2xl overflow-hidden animate-fade-in">
          {/* Animated border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-blue-500 opacity-60 blur-[1px]" />

          <div className="relative bg-card rounded-2xl overflow-hidden m-[1px]">
            {/* Shimmer bar */}
            <div className="relative h-2 bg-gradient-to-r from-primary via-purple-500 to-blue-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              {/* Category */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                  <span className="text-sm">{categoryIcon}</span> {categoryName}
                </span>
                <AvailabilityBadge availableDays={provider.available_days} startTime={provider.start_time} endTime={provider.end_time} />
              </div>

              {/* Name */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight tracking-tight">
                  {provider.name}
                </h1>
                <div className="h-0.5 w-16 bg-gradient-to-r from-primary to-purple-500 mt-2 rounded-full" />
              </div>

              {/* Description */}
              <p className="text-base text-muted-foreground leading-relaxed">{provider.description}</p>

              {/* Info — clean inline text */}
              <div className="flex flex-col gap-2 text-sm text-muted-foreground/80">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary/60 shrink-0" />
                  <span>{provider.city}{provider.neighborhood ? ` · ${provider.neighborhood}` : ''}</span>
                </p>
                <div className="flex items-center gap-3">
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
                <p className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary/60 shrink-0" />
                  Desde {new Date(provider.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Notes */}
              {provider.notes && (
                <div className="bg-muted/20 border border-muted/30 p-4 rounded-xl">
                  <p className="text-sm font-medium text-foreground mb-1">Observações</p>
                  <p className="text-sm text-muted-foreground">{provider.notes}</p>
                </div>
              )}

              {/* WhatsApp */}
              <WhatsAppButton
                phone={provider.whatsapp}
                message="Olá, vi seu cadastro no site RRN – Rádio Radar News e gostaria de mais informações."
                entityType="service_provider"
                entityId={provider.id}
                className="w-full rounded-xl font-bold py-4 text-lg shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-[1.01] transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceProviderDetail;