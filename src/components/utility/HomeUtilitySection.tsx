import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Briefcase, ArrowRight, MapPin, Star, Users, Sparkles, Zap, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderItem { name: string; description: string; }
interface JobItem { title: string; company: string; salary: string | null; }

/* ── Animated counter ── */
const AnimatedCount: React.FC<{ target: number; suffix?: string }> = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(interval); }
      else setCount(start);
    }, 40);
    return () => clearInterval(interval);
  }, [target]);
  return <span>{count}{suffix}</span>;
};

/* ── Rotating text with vertical slide + fade ── */
const CardRotatingText: React.FC<{ texts: string[] }> = ({ texts }) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % texts.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <span className="inline-block overflow-hidden h-[1.4em] align-bottom">
      <span
        className="inline-block text-yellow-300 font-black transition-all duration-400 ease-out"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          opacity: visible ? 1 : 0,
        }}
      >
        {texts[index]}
      </span>
    </span>
  );
};

/* ── Marquee ── */
const MarqueeTicker: React.FC<{ items: string[]; colorClass: string }> = ({ items, colorClass }) => {
  if (items.length === 0) return null;
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
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            🏙️ Serviços Locais
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
            Utilidade <span className="bg-gradient-hero bg-clip-text text-transparent">Pública</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Conectando você a profissionais e oportunidades da sua região
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ═══ Prestadores Card ═══ */}
          <div
            onClick={() => navigate('/prestadores')}
            className="group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
          >
            {/* Animated border glow */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500 opacity-40 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

            <div className="relative bg-card rounded-2xl overflow-hidden m-[1px]">
              {/* Shimmer bar */}
              <div className="relative h-1.5 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
              </div>

              {/* BG effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/15 via-transparent to-emerald-600/10" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-700" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />

              <div className="relative p-6 sm:p-8">
                {/* Icon + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Wrench className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl sm:text-3xl font-black mb-1 leading-tight animate-fade-in">
                      <span className="text-foreground">🧰 </span>
                      <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]">
                        Prestadores de Serviço
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-green-400/80 font-medium">
                      <CardRotatingText texts={['Encontre profissionais!', 'Na sua região!', 'Contato direto!', 'Orçamento grátis!']} />
                    </p>
                  </div>
                </div>

                {/* Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { icon: MapPin, text: 'Sua região' },
                    { icon: Star, text: 'Verificados' },
                    { icon: Phone, text: 'WhatsApp direto' },
                  ].map(({ icon: Icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                      <Icon className="h-3 w-3" /> {text}
                    </span>
                  ))}
                </div>

                {/* Marquee */}
                <MarqueeTicker items={providerTicker} colorClass="text-white/80" />

                {/* CTA */}
                <div className="mt-5 flex items-center gap-2 text-green-400 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  Encontrar profissionais
                  <ArrowRight className="h-4 w-4 animate-[bounce-x_1.5s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Vagas Card ═══ */}
          <div
            onClick={() => navigate('/vagas')}
            className="group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}
          >
            {/* Animated border glow */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 opacity-40 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

            <div className="relative bg-card rounded-2xl overflow-hidden m-[1px]">
              {/* Shimmer bar */}
              <div className="relative h-1.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
              </div>

              {/* BG effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-transparent to-indigo-600/10" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />

              <div className="relative p-6 sm:p-8">
                {/* Icon + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <Briefcase className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl sm:text-3xl font-black mb-1 leading-tight animate-fade-in">
                      <span className="text-foreground">💼 </span>
                      <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]">
                        Vagas de Emprego
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-400/80 font-medium">
                      <CardRotatingText texts={['Oportunidades reais!', 'CLT, PJ, Freelancer!', 'Na sua cidade!', 'Envie pelo WhatsApp!']} />
                    </p>
                  </div>
                </div>

                {/* Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { icon: MapPin, text: 'Vagas locais' },
                    { icon: Star, text: 'Diversas áreas' },
                    { icon: Users, text: 'Cadastro grátis' },
                  ].map(({ icon: Icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                      <Icon className="h-3 w-3" /> {text}
                    </span>
                  ))}
                </div>

                {/* Marquee */}
                <MarqueeTicker items={jobTicker} colorClass="text-white/80" />

                {/* CTA */}
                <div className="mt-5 flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  Ver oportunidades
                  <ArrowRight className="h-4 w-4 animate-[bounce-x_1.5s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeUtilitySection;
