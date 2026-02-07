import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';
import type { JobListing } from '@/hooks/useJobListings';
import { JOB_TYPES } from '@/hooks/useJobListings';

const JobListingCard: React.FC<{ job: JobListing }> = ({ job }) => {
  const navigate = useNavigate();
  const typeLabel = JOB_TYPES.find(t => t.value === job.job_type)?.label || job.job_type;

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border border-blue-500/20 hover:border-blue-500/50 bg-card cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_-8px_rgba(59,130,246,0.3)] hover:-translate-y-1"
      onClick={() => navigate(`/vagas/${job.id}`)}
    >
      {/* Top gradient accent */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Title & badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground group-hover:text-blue-400 transition-colors duration-300 truncate">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <Building2 className="h-3.5 w-3.5 text-blue-400" />
              <span>{job.company}</span>
            </div>
          </div>
          <Badge className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs shrink-0">{typeLabel}</Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

        {/* Info pills */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
            <MapPin className="h-3 w-3" />
            {job.city}{job.neighborhood ? ` - ${job.neighborhood}` : ''}
          </span>
          {job.salary && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-400">
              💰 {job.salary}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-muted text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(job.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>

        {/* WhatsApp */}
        <div onClick={e => e.stopPropagation()}>
          <WhatsAppButton
            phone={job.whatsapp}
            message="Olá, vi a vaga publicada no RRN – Rádio Radar News e gostaria de enviar meu currículo."
            entityType="job_listing"
            entityId={job.id}
            label="Enviar currículo pelo WhatsApp"
            className="w-full rounded-xl font-bold py-3 text-base shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-[1.02] transition-all duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default JobListingCard;
