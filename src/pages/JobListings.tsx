import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import JobListingCard from '@/components/utility/JobListingCard';
import PublicUserBar from '@/components/utility/PublicUserBar';
import { useJobListings, JOB_TYPES } from '@/hooks/useJobListings';
import { Search, Filter, ArrowLeft, Wrench, Briefcase, Users } from 'lucide-react';
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
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/utilidade-publica" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Utilidade Pública
          </Link>
        </div>

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/10" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10 flex items-center gap-5">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground">
                💼 Vagas de Emprego
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Encontre oportunidades na sua região
              </p>
            </div>
          </div>
        </div>

        {/* User status banner */}
        <PublicUserBar />

        {/* Filters */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-600/5" />
          <div className="relative p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} 
                  placeholder="Buscar por vaga, empresa..." 
                  className="pl-9 rounded-xl border-blue-500/20 focus:border-blue-500" 
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="rounded-xl border-blue-500/20"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {JOB_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input 
                  value={cityFilter} 
                  onChange={e => setCityFilter(e.target.value)} 
                  placeholder="Cidade..." 
                  className="flex-1 rounded-xl border-blue-500/20" 
                />
                <Button onClick={handleSearch} className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl px-4 hover:scale-105 transition-transform">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-navigation */}
        <Link 
          to="/prestadores" 
          className="group flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400 transition-all duration-500 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.01] text-base font-bold mb-8"
        >
          <Wrench className="h-5 w-5 group-hover:scale-110 transition-transform" /> 
          🧰 Ver Prestadores de Serviço
        </Link>

        {/* Stats bar */}
        {!loading && jobs.length > 0 && (
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-blue-400" />
            <span><strong className="text-foreground">{jobs.length}</strong> vagas encontradas</span>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl border border-blue-500/10 bg-card animate-pulse">
                <div className="h-1.5 bg-blue-500/20 rounded-t-2xl" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-10 bg-muted rounded-xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center text-4xl">
              🔍
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Nenhuma vaga encontrada</p>
            <p className="text-sm text-muted-foreground">Tente ajustar seus filtros de busca</p>
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
