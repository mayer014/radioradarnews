import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="bg-gradient-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer" onClick={() => navigate(`/vagas/${job.id}`)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground truncate">{job.title}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{job.company}</span>
            </div>
          </div>
          <Badge variant="outline" className="border-secondary/40 text-secondary shrink-0">{typeLabel}</Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 flex-wrap">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.city}{job.neighborhood ? ` - ${job.neighborhood}` : ''}</span>
          {job.salary && <span className="font-medium text-green-400">💰 {job.salary}</span>}
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(job.created_at).toLocaleDateString('pt-BR')}</span>
        </div>

        <div onClick={e => e.stopPropagation()}>
          <WhatsAppButton
            phone={job.whatsapp}
            message="Olá, vi a vaga publicada no RRN – Rádio Radar News e gostaria de enviar meu currículo."
            entityType="job_listing"
            entityId={job.id}
            label="Enviar currículo pelo WhatsApp"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default JobListingCard;
