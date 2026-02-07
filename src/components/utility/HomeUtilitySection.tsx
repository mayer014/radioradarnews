import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Briefcase, ArrowRight, MapPin, Star, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderItem { name: string; description: string; }
interface JobItem { title: string; company: string; salary: string | null; }

const MarqueeTicker: React.FC<{ items: string[]; colorClass: string }> = ({ items, colorClass }) => {
  if (items.length === 0) return null;
  // Duplicate items for seamless loop
  const tickerContent = [...items, ...items];
  return (
    <div className="relative overflow-hidden mt-4 rounded-lg bg-background/50 border border-muted/30 py-2">
      <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap gap-8">
        {tickerContent.map((item, i) => (
          <span key={i} className={`inline-flex items-center gap-2 text-xs font-medium ${colorClass} flex-shrink-0`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const HomeUtilitySection: React.FC = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [provRes, jobRes] = await Promise.all([
        supabase.from('service_providers').select('name, description').eq('is_active', true).limit(20),
        supabase.from('job_listings').select('title, company, salary').eq('is_active', true).limit(20),
      ]);
      if (provRes.data) setProviders(provRes.data);
      if (jobRes.data) setJobs(jobRes.data);
    };
    fetchData();
  }, []);

  const providerTicker = providers.map(p => `${p.name} — ${p.description.substring(0, 40)}${p.description.length > 40 ? '…' : ''}`);
  const jobTicker = jobs.map(j => `${j.title} • ${j.company}${j.salary ? ` • ${j.salary}` : ''}`);

  return (
    <section className="py-12 px-4 sm:px-6">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            🏙️ Serviços Locais
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
            Utilidade <span className="bg-gradient-hero bg-clip-text text-transparent">Pública</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Conectando você a profissionais e oportunidades da sua região
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Prestadores Card */}
          <div
            onClick={() => navigate('/prestadores')}
            className="group relative cursor-pointer rounded-2xl overflow-hidden border border-green-500/20 hover:border-green-500/50 transition-all duration-500 hover:shadow-[0_0_40px_-12px_rgba(34,197,94,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-emerald-600/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-500" />

            <div className="relative p-8 sm:p-10">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1 group-hover:text-green-400 transition-colors">
                    🧰 Prestadores de Serviço
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Eletricistas, encanadores, pintores, mecânicos e muito mais
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                  <MapPin className="h-3 w-3" /> Sua região
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                  <Star className="h-3 w-3" /> Profissionais verificados
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                  <Users className="h-3 w-3" /> Contato direto
                </span>
              </div>

              {/* Marquee ticker */}
              <MarqueeTicker items={providerTicker} colorClass="text-green-400/80" />

              <div className="mt-5 flex items-center gap-2 text-green-400 font-semibold group-hover:gap-4 transition-all duration-300">
                Encontrar profissionais
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Vagas Card */}
          <div
            onClick={() => navigate('/vagas')}
            className="group relative cursor-pointer rounded-2xl overflow-hidden border border-blue-500/20 hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_0_40px_-12px_rgba(59,130,246,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />

            <div className="relative p-8 sm:p-10">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1 group-hover:text-blue-400 transition-colors">
                    💼 Vagas de Emprego
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    CLT, PJ, freelancer e temporárias — envie currículo pelo WhatsApp
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                  <MapPin className="h-3 w-3" /> Vagas locais
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                  <Star className="h-3 w-3" /> Diversas áreas
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                  <Users className="h-3 w-3" /> Cadastro grátis
                </span>
              </div>

              {/* Marquee ticker */}
              <MarqueeTicker items={jobTicker} colorClass="text-blue-400/80" />

              <div className="mt-5 flex items-center gap-2 text-blue-400 font-semibold group-hover:gap-4 transition-all duration-300">
                Ver oportunidades
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeUtilitySection;
