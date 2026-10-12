import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Wrench, BriefcaseBusiness, MapPin, Clock, Building2 } from 'lucide-react';
import InternalLayout from '@/components/layout/InternalLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import WhatsAppButton from '@/components/utility/WhatsAppButton';
import AvailabilityBadge from '@/components/utility/AvailabilityBadge';
import { useServiceProviders, type ServiceProvider } from '@/hooks/useServiceProviders';

export default function ServiceProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const { getProvider } = useServiceProviders();
  const [provider, setItem] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setItem(null);
    if (id) getProvider(id).then(({data}) => { if (active) setItem(data); }).catch(() => { if (active) setItem(null); }).finally(() => { if (active) setLoading(false); });
    else setLoading(false);
    return () => { active = false; };
  }, [id, getProvider]);
  const backTo = '/prestadores';
  if (loading || !provider) return <InternalLayout narrow><PageHeader icon={Wrench} title={loading ? 'Carregando…' : 'Profissional não encontrado'} description={loading ? 'Buscando as informações do anúncio.' : 'Este anúncio pode ter sido removido ou não estar disponível.'} backTo={backTo} backLabel="Prestadores de serviço" /><div className="page-surface p-8" role="status">{loading ? <div className="space-y-5 motion-safe:animate-pulse"><div className="h-8 bg-muted rounded w-2/3" /><div className="h-24 bg-muted rounded" /></div> : <Button asChild variant="outline"><Link to={backTo}>Ver outros anúncios</Link></Button>}</div></InternalLayout>;
  return <InternalLayout>
    <PageHeader icon={Wrench} eyebrow={provider.category?.name || 'Prestadores de serviço'} title={provider.name} description={'Profissional da sua região. Conheça o serviço e entre em contato.'} backTo={backTo} backLabel="Prestadores de serviço" />
    <div className="detail-layout">
      <section className="page-surface detail-content"><span className="page-eyebrow">Sobre o serviço</span><h2>Como posso ajudar você</h2><p className="whitespace-pre-line leading-relaxed text-muted-foreground">{provider.description}</p>
      {provider.notes && <div className="detail-notes"><h3>Observações</h3><p className="whitespace-pre-line">{provider.notes}</p></div>}
      </section>
      <aside className="page-surface detail-contact"><span className="page-eyebrow">Atendimento</span><h2>Vamos conversar</h2>
        <div className="detail-facts">
          <p><MapPin size={17} /><span>{provider.city}{provider.neighborhood ? ' · ' + provider.neighborhood : ''}</span></p>
          <AvailabilityBadge availableDays={provider.available_days} startTime={provider.start_time} endTime={provider.end_time} />
          <dl className="space-y-3"><div><dt>Orçamento</dt><dd>{provider.charges_estimate ? 'Cobrado' : 'Gratuito'}</dd></div><div><dt>Deslocamento</dt><dd>{provider.charges_displacement ? 'Cobrado' : 'Gratuito'}</dd></div></dl>
          <p className="text-xs"><Clock size={15} />Publicado em {new Date(provider.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
        <WhatsAppButton phone={provider.whatsapp} message="Olá, vi seu cadastro no site RRN – Rádio Radar News e gostaria de mais informações." entityType="service_provider" entityId={provider.id} label="Conversar pelo WhatsApp" />
        <p className="text-xs text-muted-foreground leading-relaxed mt-3">Você será direcionado ao WhatsApp do anunciante.</p>
      </aside>
    </div>
  </InternalLayout>;
}
