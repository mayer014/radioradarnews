import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';
import type { JobListing } from '@/hooks/useJobListings';
import { JOB_TYPES } from '@/hooks/useJobListings';

const JobListingCard: React.FC<{ job: JobListing; index?: number }> = ({ job, index = 0 }) => {
  const navigate = useNavigate();
  const typeLabel = JOB_TYPES.find(t => t.value === job.job_type)?.label || job.job_type;

  return (
    <div
      className="group relative rounded-2xl overflow-hidden bg-card cursor-pointer transition-all duration-500 hover:-translate-y-2 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
      onClick={() => navigate(`/vagas/${job.id}`)}
    >
      {/* Always-visible animated border */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-40 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

      {/* Inner content */}
      <div className="relative bg-card rounded-2xl overflow-hidden m-[1px]">
        {/* Shimmer bar — always animating */}
        <div className="relative h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-4 space-y-3">
          {/* Title + badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground group-hover:text-blue-400 transition-colors duration-300 leading-tight line-clamp-2">
                {job.title}
              </h3>
              <div className="h-0.5 w-12 group-hover:w-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 mt-1 rounded-full" />
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{job.company}</span>
              </div>
            </div>
            <Badge className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs shrink-0 font-bold">{typeLabel}</Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{job.description}</p>

          {/* Info pills */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 max-w-full">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{job.city}{job.neighborhood ? ` - ${job.neighborhood}` : ''}</span>
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

          {/* "Ver detalhes" — visible always, arrow pulses */}
          <div className="flex items-center gap-1 text-xs text-blue-400/70">
            <Sparkles className="h-3 w-3" />
            <span>Ver detalhes</span>
            <ArrowRight className="h-3 w-3 animate-[bounce-x_1.5s_ease-in-out_infinite]" />
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
    </div>
  );
};

export default JobListingCard;
