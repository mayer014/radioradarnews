import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ServiceProviderForm from '@/components/utility/ServiceProviderForm';
import JobListingForm from '@/components/utility/JobListingForm';
import { usePublicAuth } from '@/contexts/PublicAuthContext';
import { useServiceProviders, type ServiceProvider } from '@/hooks/useServiceProviders';
import { useJobListings, type JobListing } from '@/hooks/useJobListings';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, LogOut, Wrench, Briefcase, Eye } from 'lucide-react';

const PublicDashboard: React.FC = () => {
  const { profile, isAuthenticated, loading: authLoading, signOut } = usePublicAuth();
  const { fetchMyProviders, deleteProvider } = useServiceProviders();
  const { fetchMyJobs, deleteJob } = useJobListings();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [myProviders, setMyProviders] = useState<ServiceProvider[]>([]);
  const [myJobs, setMyJobs] = useState<JobListing[]>([]);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/utilidade-publica/auth');
  }, [authLoading, isAuthenticated, navigate]);

  const loadData = async () => {
    if (!profile) return;
    const [providers, jobs] = await Promise.all([
      fetchMyProviders(profile.id),
      fetchMyJobs(profile.id),
    ]);
    setMyProviders(providers);
    setMyJobs(jobs);
  };

  useEffect(() => { loadData(); }, [profile]);

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Remover este serviço?')) return;
    await deleteProvider(id);
    toast({ title: 'Serviço removido' });
    loadData();
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Remover esta vaga?')) return;
    await deleteJob(id);
    toast({ title: 'Vaga removida' });
    loadData();
  };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Olá, {profile.full_name}!</h1>
            <p className="text-muted-foreground">Gerencie seus serviços e vagas</p>
          </div>
          <Button variant="outline" onClick={async () => { await signOut(); navigate('/utilidade-publica'); }} className="border-destructive/50 text-destructive">
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>

        <Tabs defaultValue="services">
          <TabsList className="mb-6">
            <TabsTrigger value="services"><Wrench className="h-4 w-4 mr-1" /> Meus Serviços ({myProviders.length})</TabsTrigger>
            <TabsTrigger value="jobs"><Briefcase className="h-4 w-4 mr-1" /> Minhas Vagas ({myJobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            {showProviderForm || editingProvider ? (
              <ServiceProviderForm userId={profile.id} existing={editingProvider} onSaved={() => { setShowProviderForm(false); setEditingProvider(null); loadData(); }} onCancel={() => { setShowProviderForm(false); setEditingProvider(null); }} />
            ) : (
              <>
                <Button onClick={() => setShowProviderForm(true)} className="bg-gradient-hero mb-6"><Plus className="h-4 w-4 mr-1" /> Novo Serviço</Button>
                {myProviders.length === 0 ? (
                  <Card className="bg-gradient-card border-primary/20 p-8 text-center"><p className="text-muted-foreground">Você ainda não cadastrou nenhum serviço.</p></Card>
                ) : (
                  <div className="space-y-4">
                    {myProviders.map(p => (
                      <Card key={p.id} className="bg-gradient-card border-primary/20 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold">{p.name}</h3>
                            <p className="text-sm text-muted-foreground">{p.city} • {p.is_active ? '✅ Ativo' : '⏸ Pausado'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/prestadores/${p.id}`)}><Eye className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingProvider(p)}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDeleteProvider(p.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="jobs">
            {showJobForm || editingJob ? (
              <JobListingForm userId={profile.id} existing={editingJob} onSaved={() => { setShowJobForm(false); setEditingJob(null); loadData(); }} onCancel={() => { setShowJobForm(false); setEditingJob(null); }} />
            ) : (
              <>
                <Button onClick={() => setShowJobForm(true)} className="bg-gradient-hero mb-6"><Plus className="h-4 w-4 mr-1" /> Nova Vaga</Button>
                {myJobs.length === 0 ? (
                  <Card className="bg-gradient-card border-primary/20 p-8 text-center"><p className="text-muted-foreground">Você ainda não publicou nenhuma vaga.</p></Card>
                ) : (
                  <div className="space-y-4">
                    {myJobs.map(j => (
                      <Card key={j.id} className="bg-gradient-card border-primary/20 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold">{j.title}</h3>
                            <p className="text-sm text-muted-foreground">{j.company} • {j.city} • {j.is_active ? '✅ Ativa' : '⏸ Pausada'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/vagas/${j.id}`)}><Eye className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingJob(j)}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDeleteJob(j.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default PublicDashboard;
