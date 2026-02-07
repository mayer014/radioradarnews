import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ServiceProviderCard from '@/components/utility/ServiceProviderCard';
import PublicUserBar from '@/components/utility/PublicUserBar';
import { useServiceProviders } from '@/hooks/useServiceProviders';
import { Search, Filter, ArrowLeft, Briefcase, Wrench, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const ServiceProviders: React.FC = () => {
  const { providers, categories, loading, fetchProviders } = useServiceProviders();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');

  const handleSearch = () => {
    fetchProviders({
      search: search || undefined,
      category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
      city: cityFilter || undefined,
    });
  };

  React.useEffect(() => { handleSearch(); }, [categoryFilter]);

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
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-600/20 to-blue-600/10" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10 flex items-center gap-5">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground">
                🧰 Prestadores de Serviço
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Encontre profissionais de confiança na sua região
              </p>
            </div>
          </div>
        </div>

        {/* User status banner */}
        <PublicUserBar />

        {/* Filters */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-600/5" />
          <div className="relative p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} 
                  placeholder="Buscar por nome ou serviço..." 
                  className="pl-9 rounded-xl border-primary/20 focus:border-primary" 
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="rounded-xl border-primary/20"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input 
                  value={cityFilter} 
                  onChange={e => setCityFilter(e.target.value)} 
                  placeholder="Cidade..." 
                  className="flex-1 rounded-xl border-primary/20" 
                />
                <Button onClick={handleSearch} className="bg-gradient-to-r from-primary to-purple-600 rounded-xl px-4 hover:scale-105 transition-transform">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-navigation */}
        <Link 
          to="/vagas" 
          className="group flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-400 transition-all duration-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] text-base font-bold mb-8"
        >
          <Briefcase className="h-5 w-5 group-hover:scale-110 transition-transform" /> 
          💼 Ver Vagas de Emprego
        </Link>

        {/* Stats bar */}
        {!loading && providers.length > 0 && (
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span><strong className="text-foreground">{providers.length}</strong> profissionais encontrados</span>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl border border-primary/10 bg-card animate-pulse">
                <div className="h-1.5 bg-primary/20 rounded-t-2xl" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-10 bg-muted rounded-xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
              🔍
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Nenhum prestador encontrado</p>
            <p className="text-sm text-muted-foreground">Tente ajustar seus filtros de busca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map(p => <ServiceProviderCard key={p.id} provider={p} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ServiceProviders;
