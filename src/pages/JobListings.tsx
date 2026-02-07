import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import JobListingCard from '@/components/utility/JobListingCard';
import PublicUserBar from '@/components/utility/PublicUserBar';
import { useJobListings, JOB_TYPES } from '@/hooks/useJobListings';
import { Search, Filter, ArrowLeft, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';


const JobListings: React.FC = () => {
  const { jobs, loading, fetchJobs } = useJobListings();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');

  const handleSearch = () => {
    fetchJobs({
      search: search || undefined,
      job_type: typeFilter !== 'all' ? typeFilter : undefined,
      city: cityFilter || undefined,
    });
  };

  React.useEffect(() => { handleSearch(); }, [typeFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/utilidade-publica" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Utilidade Pública
          </Link>
          <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-1">💼 Vagas de Emprego</h1>
              <p className="text-muted-foreground">Encontre oportunidades na sua região</p>
          </div>
        </div>

        {/* User status bar */}
        <PublicUserBar />

        {/* Filtros */}
        <div className="bg-gradient-card border border-primary/20 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Buscar por vaga, empresa..." className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {JOB_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input value={cityFilter} onChange={e => setCityFilter(e.target.value)} placeholder="Cidade..." className="flex-1" />
              <Button onClick={handleSearch} className="bg-gradient-hero"><Filter className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {/* Cross-navigation */}
        <div className="mb-8">
          <Link to="/prestadores" className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400 transition-all shadow-lg shadow-green-500/25 text-base font-bold">
            <Wrench className="h-5 w-5" /> 🧰 Ver Prestadores de Serviço
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">Nenhuma vaga encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(j => <JobListingCard key={j.id} job={j} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default JobListings;
