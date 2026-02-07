import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{job.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" /><span>{job.company}</span>
                </div>
              </div>
              <Badge variant="outline" className="border-secondary/40 text-secondary text-sm">{typeLabel}</Badge>
            </div>

            <p className="text-muted-foreground mb-6">{job.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />{job.city}{job.neighborhood ? ` - ${job.neighborhood}` : ''}</div>
              {job.salary && <div className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-primary" />{job.salary}</div>}
              <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-primary" />Publicada em {new Date(job.created_at).toLocaleDateString('pt-BR')}</div>
            </div>

            {job.requirements && (
              <div className="bg-muted/30 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium mb-1 flex items-center gap-1"><FileText className="h-4 w-4" /> Requisitos:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{job.requirements}</p>
              </div>
            )}

            <WhatsAppButton
              phone={job.whatsapp}
              message="Olá, vi a vaga publicada no RRN – Rádio Radar News e gostaria de enviar meu currículo."
              entityType="job_listing"
              entityId={job.id}
              label="Enviar currículo pelo WhatsApp"
              className="w-full text-lg py-6"
            />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default JobListingDetail;
