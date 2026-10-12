import { Link } from 'react-router-dom';
import { MapPin, ArrowUpRight, Wrench } from 'lucide-react';
import AvailabilityBadge from './AvailabilityBadge';
import WhatsAppButton from './WhatsAppButton';
import type { ServiceProvider } from '@/hooks/useServiceProviders';

export default function ServiceProviderCard({ provider }: { provider: ServiceProvider; index?: number }) {
  return <article className="directory-card">
    <div className="directory-card-body">
      <div><span className="directory-category"><Wrench size={14} />{provider.category?.name || 'Serviço'}</span></div>
      <h2><Link to={`/prestadores/${provider.id}`}>{provider.name}</Link></h2>
      <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">{provider.description}</p>
      <AvailabilityBadge availableDays={provider.available_days} startTime={provider.start_time} endTime={provider.end_time} />
      <p className="directory-meta"><MapPin size={15} />{provider.city}{provider.neighborhood ? ` · ${provider.neighborhood}` : ''}</p>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="directory-chip">{provider.charges_estimate ? 'Orçamento cobrado' : 'Orçamento gratuito'}</span><span className="directory-chip">{provider.charges_displacement ? 'Deslocamento cobrado' : 'Deslocamento gratuito'}</span></div>
    </div>
    <div className="directory-card-footer"><Link className="directory-details" to={`/prestadores/${provider.id}`}>Ver perfil<ArrowUpRight size={16} /></Link><WhatsAppButton phone={provider.whatsapp} message="Olá, vi seu cadastro no site RRN – Rádio Radar News e gostaria de mais informações." entityType="service_provider" entityId={provider.id} /></div>
  </article>;
}
