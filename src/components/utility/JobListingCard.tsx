import React from 'react';
import { MapPin, Building2, Calendar, ArrowRight, DollarSign } from 'lucide-react';
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
      {/* Animated border */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-40 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

      {/* Inner content */}
      <div className="relative bg-card rounded-2xl overflow-hidden m-[1px]">
        {/* Shimmer bar */}
        <div className="relative h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-4 space-y-2.5">
          {/* Title — large & prominent */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground group-hover:text-blue-400 transition-colors duration-300 leading-tight tracking-tight line-clamp-2">
              {job.title}
            </h3>
            <div className="h-0.5 w-12 group-hover:w-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 mt-1.5 rounded-full" />
          </div>

          {/* Company */}
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-blue-400/60 shrink-0" />
            <span>{job.company}</span>
            <span className="text-muted-foreground/30 mx-1">·</span>
            <span className="text-muted-foreground/70 font-medium">{typeLabel}</span>
          </p>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{job.description}</p>

          {/* Info — clean inline text */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground/70 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary/50 shrink-0" />
              {job.city}{job.neighborhood ? ` · ${job.neighborhood}` : ''}
            </span>
            {job.salary && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <span className="flex items-center gap-1 text-green-400/80">
                  <DollarSign className="h-3.5 w-3.5 shrink-0" />
                  {job.salary}
                </span>
              </>
            )}
            <span className="text-muted-foreground/30">|</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary/50 shrink-0" />
              {new Date(job.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* Ver detalhes */}
          <div className="flex items-center gap-1.5 text-xs text-blue-400/60 group-hover:text-blue-400 transition-colors pt-1">
            <span>Ver detalhes</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
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
