import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Wrench, BriefcaseBusiness, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import InternalLayout from '@/components/layout/InternalLayout';
import PageHeader from '@/components/layout/PageHeader';
import PublicUserBar from '@/components/utility/PublicUserBar';
import ServiceProviderCard from '@/components/utility/ServiceProviderCard';
import { useServiceProviders } from '@/hooks/useServiceProviders';
import { useDebounce } from '@/hooks/useDebounce';

export default function ServiceProviders() {
  const { providers, loading, fetchProviders } = useServiceProviders();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => { fetchProviders({ search: debouncedSearch || undefined }); }, [debouncedSearch, fetchProviders]);
  return (
    <InternalLayout>
      <PageHeader icon={Wrench} eyebrow="Utilidade pública" title="Prestadores de serviço"
        description="Encontre o profissional certo para o que você precisa, perto de você."
        backTo="/utilidade-publica" backLabel="Utilidade pública"
        actions={<Button asChild variant="outline"><Link to="/vagas">Ver vagas<ArrowUpRight size={16} /></Link></Button>} />
      <section className="directory-toolbar" aria-label="Busca">
        <div className="relative flex-1">
          <label htmlFor="directory-search" className="sr-only">Buscar profissionais</label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="directory-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, serviço ou cidade" className="pl-11 h-12" />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">{loading ? 'Buscando…' : <><strong className="text-foreground">{providers.length}</strong> profissionais encontrados</>}</p>
      </section>
      {loading ? <div className="directory-grid" aria-busy="true" aria-label="Carregando resultados">{[1,2,3].map(i => <div key={i} className="page-surface p-6 space-y-5 motion-safe:animate-pulse"><div className="h-5 w-1/3 rounded bg-muted" /><div className="h-8 w-3/4 rounded bg-muted" /><div className="h-20 rounded bg-muted" /></div>)}</div>
      : providers.length === 0 ? <div className="page-empty"><Search size={32} /><h2>Nenhum profissional encontrado</h2><p>Tente outro termo ou uma cidade diferente.</p>{search && <Button variant="outline" onClick={() => setSearch('')}>Limpar busca</Button>}</div>
      : <div className="directory-grid">{providers.map(provider => <ServiceProviderCard key={provider.id} provider={provider} />)}</div>}
      <PublicUserBar />
    </InternalLayout>
  );
}
