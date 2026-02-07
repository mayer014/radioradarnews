import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/utility/WhatsAppButton';
import { useJobListings, JOB_TYPES, type JobListing } from '@/hooks/useJobListings';
import { MapPin, Building2, ArrowLeft, Calendar, DollarSign, FileText } from 'lucide-react';

const JobListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getJob } = useJobListings();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getJob(id).then(({ data }) => { setJob(data); setLoading(false); });
    }
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background"><Navigation /><div className="pt-24 text-center text-muted-foreground">Carregando...</div></div>;
  if (!job) return <div className="min-h-screen bg-background"><Navigation /><div className="pt-24 text-center text-muted-foreground">Vaga não encontrada.</div></div>;

  const typeLabel = JOB_TYPES.find(t => t.value === job.job_type)?.label || job.job_type;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <Link to="/vagas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="relative rounded-2xl overflow-hidden animate-fade-in">
          {/* Animated border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60 blur-[1px]" />

          <div className="relative bg-card rounded-2xl overflow-hidden m-[1px]">
            {/* Shimmer bar */}
            <div className="relative h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              {/* Title */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight tracking-tight">
                  {job.title}
                </h1>
                <div className="h-0.5 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 mt-2 rounded-full" />
              </div>

              {/* Company + type */}
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-400/60 shrink-0" />
                <span>{job.company}</span>
                <span className="text-muted-foreground/30 mx-1">·</span>
                <span className="text-muted-foreground/70 font-medium">{typeLabel}</span>
              </p>

              {/* Description */}
              <p className="text-base text-muted-foreground leading-relaxed">{job.description}</p>

              {/* Info — clean inline text */}
              <div className="flex flex-col gap-2 text-sm text-muted-foreground/80">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary/60 shrink-0" />
                  {job.city}{job.neighborhood ? ` · ${job.neighborhood}` : ''}
                </p>
                {job.salary && (
                  <p className="flex items-center gap-1.5 text-green-400/80">
                    <DollarSign className="h-4 w-4 shrink-0" />
                    {job.salary}
                  </p>
                )}
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary/60 shrink-0" />
                  Publicada em {new Date(job.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div className="bg-muted/20 border border-muted/30 p-4 rounded-xl">
                  <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> Requisitos
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{job.requirements}</p>
                </div>
              )}

              {/* WhatsApp */}
              <WhatsAppButton
                phone={job.whatsapp}
                message="Olá, vi a vaga publicada no RRN – Rádio Radar News e gostaria de enviar meu currículo."
                entityType="job_listing"
                entityId={job.id}
                label="Enviar currículo pelo WhatsApp"
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

export default JobListingDetail;