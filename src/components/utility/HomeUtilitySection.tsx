import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, BriefcaseBusiness, ArrowUpRight, MapPin, Hexagon, type LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderItem { name: string; description: string | null; }
interface JobItem { title: string; company: string; salary: string | null; }
interface PreviewItem { title: string; detail: string; }

interface UtilityCardProps {
  href: string;
  headingId: string;
  title: string;
  description: string;
  icon: LucideIcon;
  kind: 'services' | 'jobs';
  previewLabel: string;
  items: PreviewItem[];
  emptyDescription: string;
  action: string;
  loading: boolean;
}

const UtilityCard = ({ href, headingId, title, description, icon: Icon, kind, previewLabel, items, emptyDescription, action, loading }: UtilityCardProps) => (
  <Link
    to={href}
    aria-labelledby={headingId}
    aria-describedby={`${headingId}-description`}
    className={`utility-card group ${kind === 'services' ? 'utility-card--services' : 'utility-card--jobs'}`}
  >
    <div className="utility-card-content">
      <div className="utility-card-header">
        <div className="utility-card-icon" aria-hidden="true">
          <Hexagon className="utility-card-icon-frame" strokeWidth={1.2} />
          <Icon className="utility-card-icon-symbol" strokeWidth={1.7} />
        </div>
        <div className="min-w-0">
          <h3 id={headingId} className="text-xl sm:text-2xl font-semibold tracking-tight leading-tight text-foreground">
            {title}
          </h3>
          <p id={`${headingId}-description`} className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="utility-card-preview" aria-busy={loading}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {previewLabel}
        </p>
        {loading ? (
          <div className="space-y-3" role="status" aria-label="Carregando cadastros">
            {[0, 1].map(index => (
              <div key={index} className="flex items-center gap-3 motion-safe:animate-pulse" aria-hidden="true">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-muted" />
                  <div className="h-2 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length ? (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={`${item.title}-${index}`} className="utility-preview-row">
                <div className="utility-preview-icon" aria-hidden="true">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="utility-preview-empty text-sm leading-relaxed text-muted-foreground">
            {emptyDescription}
          </p>
        )}
      </div>
    </div>

    <div className="utility-card-action">
      <span className="text-sm font-semibold">{action}</span>
      <span className="utility-card-arrow" aria-hidden="true">
        <ArrowUpRight className="h-5 w-5" strokeWidth={1.8} />
      </span>
    </div>
  </Link>
);

const HomeUtilitySection = ({ showHeader = true }: { showHeader?: boolean }) => {
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      supabase.from('service_providers').select('name, description').eq('is_active', true).order('created_at', { ascending: false }).limit(2),
      supabase.from('job_listings').select('title, company, salary').eq('is_active', true).order('created_at', { ascending: false }).limit(2),
    ]).then(([providerResult, jobResult]) => {
      if (!mounted) return;
      setProviders(providerResult.data || []);
      setJobs(jobResult.data || []);
    }).catch(error => {
      console.warn('Não foi possível carregar as prévias de utilidade pública:', error);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <section className="py-12 px-4 sm:px-6" aria-labelledby={showHeader ? "home-utility-heading" : undefined} aria-label={showHeader ? undefined : "Serviços e vagas"} id="home-utility">
      <div className="max-w-7xl mx-auto">
        {showHeader && <div className="max-w-2xl mb-7 sm:mb-8">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Na sua região
          </p>
          <h2 id="home-utility-heading" className="section-title text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Utilidade pública
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Profissionais para o seu dia a dia. Oportunidades para o seu próximo passo.
          </p>
        </div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <UtilityCard
            href="/prestadores"
            headingId="home-services-heading"
            title="Prestadores de serviço"
            description="Encontre profissionais e solicite um orçamento direto pelo WhatsApp."
            icon={Wrench}
            kind="services"
            previewLabel="No diretório"
            items={providers.map(provider => ({
              title: provider.name,
              detail: provider.description && provider.description.trim().toLocaleLowerCase('pt-BR') !== provider.name.trim().toLocaleLowerCase('pt-BR')
                ? provider.description
                : 'Saiba mais sobre os serviços',
            }))}
            emptyDescription="Explore o diretório para conhecer os profissionais e seus serviços."
            action="Encontrar profissionais"
            loading={loading}
          />
          <UtilityCard
            href="/vagas"
            headingId="home-jobs-heading"
            title="Vagas de emprego"
            description="Descubra oportunidades e fale diretamente com as empresas."
            icon={BriefcaseBusiness}
            kind="jobs"
            previewLabel="No mural de vagas"
            items={jobs.map(job => ({
              title: job.title,
              detail: [job.company, job.salary?.trim().toLocaleLowerCase('pt-BR') !== 'não informado' ? job.salary : null]
                .filter(Boolean).join(' · ') || 'Informações no mural de vagas',
            }))}
            emptyDescription="Consulte o mural para conhecer as oportunidades disponíveis."
            action="Explorar oportunidades"
            loading={loading}
          />
        </div>
      </div>
    </section>
  );
};

export default HomeUtilitySection;
