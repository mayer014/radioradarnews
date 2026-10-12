import { Link } from 'react-router-dom';
import { MapPin, Building2, ArrowUpRight, BriefcaseBusiness } from 'lucide-react';
import WhatsAppButton from './WhatsAppButton';
import { JOB_TYPES, type JobListing } from '@/hooks/useJobListings';

export default function JobListingCard({ job }: { job: JobListing; index?: number }) {
  const typeLabel = JOB_TYPES.find(t => t.value === job.job_type)?.label || job.job_type;
  return <article className="directory-card directory-card--jobs">
    <div className="directory-card-body">
      <span className="directory-category"><BriefcaseBusiness size={14} />{typeLabel}</span>
      <h2><Link to={`/vagas/${job.id}`}>{job.title}</Link></h2>
      <p className="directory-meta"><Building2 size={15} />{job.company}</p>
      <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">{job.description}</p>
      <p className="directory-meta"><MapPin size={15} />{job.city}{job.neighborhood ? ` · ${job.neighborhood}` : ''}</p>
      {job.salary && job.salary !== 'Não informado' && <span className="directory-chip w-fit text-foreground">{job.salary}</span>}
    </div>
    <div className="directory-card-footer"><Link className="directory-details" to={`/vagas/${job.id}`}>Ver oportunidade<ArrowUpRight size={16} /></Link><WhatsAppButton phone={job.whatsapp} message="Olá, vi a vaga publicada no RRN – Rádio Radar News e gostaria de enviar meu currículo." entityType="job_listing" entityId={job.id} label="Enviar currículo" /></div>
  </article>;
}
