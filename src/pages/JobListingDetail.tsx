import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Wrench, BriefcaseBusiness, MapPin, Clock, Building2 } from 'lucide-react';
import InternalLayout from '@/components/layout/InternalLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import WhatsAppButton from '@/components/utility/WhatsAppButton';

import { useJobListings, JOB_TYPES, type JobListing } from '@/hooks/useJobListings';

export default function JobListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { getJob } = useJobListings();
  const [job, setItem] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setItem(null);
    if (id) getJob(id).then(({data}) => { if (active) setItem(data); }).catch(() => { if (active) setItem(null); }).finally(() => { if (active) setLoading(false); });
    else setLoading(false);
    return () => { active = false; };
  }, [id, getJob]);
  const backTo = '/vagas';
  if (loading || !job) return <InternalLayout narrow><PageHeader icon={BriefcaseBusiness} title={loading ? 'Carregando…' : 'Vaga não encontrada'} description={loading ? 'Buscando as informações do anúncio.' : 'Este anúncio pode ter sido removido ou não estar disponível.'} backTo={backTo} backLabel="Vagas de emprego" /><div className="page-surface p-8" role="status">{loading ? <div className="space-y-5 motion-safe:animate-pulse"><div className="h-8 bg-muted rounded w-2/3" /><div className="h-24 bg-muted rounded" /></div> : <Button asChild variant="outline"><Link to={backTo}>Ver outros anúncios</Link></Button>}</div></InternalLayout>;
  return <InternalLayout>
    <PageHeader icon={BriefcaseBusiness} eyebrow={JOB_TYPES.find(t => t.value === job.job_type)?.label || 'Vagas de emprego'} title={job.title} description={job.company} backTo={backTo} backLabel="Vagas de emprego" />
    <div className="detail-layout">
      <section className="page-surface detail-content"><span className="page-eyebrow">Sobre a oportunidade</span><h2>Descrição da vaga</h2><p className="whitespace-pre-line leading-relaxed text-muted-foreground">{job.description}</p>
      {job.requirements && <div className="detail-notes"><h3>Requisitos</h3><p className="whitespace-pre-line">{job.requirements}</p></div>}
      </section>
      <aside className="page-surface detail-contact"><span className="page-eyebrow">Candidate-se</span><h2>Seu próximo passo</h2>
        <div className="detail-facts">
          <p><MapPin size={17} /><span>{job.city}{job.neighborhood ? ' · ' + job.neighborhood : ''}</span></p>
          <p><Building2 size={17} /><span>{job.company}</span></p>{job.salary && job.salary !== 'Não informado' && <dl><div><dt>Remuneração</dt><dd>{job.salary}</dd></div></dl>}
          <p className="text-xs"><Clock size={15} />Publicado em {new Date(job.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
        <WhatsAppButton phone={job.whatsapp} message="Olá, vi a vaga publicada no RRN – Rádio Radar News e gostaria de enviar meu currículo." entityType="job_listing" entityId={job.id} label="Enviar currículo" />
        <p className="text-xs text-muted-foreground leading-relaxed mt-3">Você será direcionado ao WhatsApp do anunciante.</p>
      </aside>
    </div>
  </InternalLayout>;
}
