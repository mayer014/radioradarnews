import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ServiceProviderCard from '@/components/utility/ServiceProviderCard';
import { useServiceProviders } from '@/hooks/useServiceProviders';
import { Search, Filter, ArrowLeft } from 'lucide-react';
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
        <div className="mb-8">
          <Link to="/utilidade-publica" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Utilidade Pública
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">🧰 Prestadores de Serviço</h1>
          <p className="text-muted-foreground">Encontre profissionais de confiança na sua região</p>
        </div>

        {/* Filtros */}
        <div className="bg-gradient-card border border-primary/20 rounded-lg p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Buscar por nome ou serviço..." className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input value={cityFilter} onChange={e => setCityFilter(e.target.value)} placeholder="Cidade..." className="flex-1" />
              <Button onClick={handleSearch} className="bg-gradient-hero"><Filter className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mb-6">
          <Link to="/utilidade-publica/auth">
            <Button className="bg-gradient-hero">Cadastre-se e divulgue seus serviços!</Button>
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">Nenhum prestador encontrado.</p>
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
