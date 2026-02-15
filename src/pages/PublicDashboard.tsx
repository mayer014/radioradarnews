import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ServiceProviderForm from '@/components/utility/ServiceProviderForm';
import JobListingForm from '@/components/utility/JobListingForm';
import { usePublicAuth } from '@/contexts/PublicAuthContext';
import { useServiceProviders, type ServiceProvider } from '@/hooks/useServiceProviders';
import { useJobListings, type JobListing } from '@/hooks/useJobListings';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, LogOut, Wrench, Briefcase, Eye, MapPin, User, Mail, Phone, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SuccessPromoDialog from '@/components/utility/SuccessPromoDialog';

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
  const [showPromoDialog, setShowPromoDialog] = useState(false);

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
        {/* Back link */}
        <Link to="/utilidade-publica" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Utilidade Pública
        </Link>

        {/* Profile header */}
        <Card className="bg-gradient-card border-primary/20 mb-8">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{profile.full_name}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{profile.email}</span>
                    {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{profile.phone}</span>}
                    {profile.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.city}</span>}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={async () => { await signOut(); navigate('/utilidade-publica'); }}
                className="border-destructive/50 text-destructive hover:bg-destructive/10 w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sair da conta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-4 sm:p-5 text-center">
              <Wrench className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{myProviders.length}</p>
              <p className="text-sm text-muted-foreground">Serviço{myProviders.length !== 1 ? 's' : ''} cadastrado{myProviders.length !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-4 sm:p-5 text-center">
              <Briefcase className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{myJobs.length}</p>
              <p className="text-sm text-muted-foreground">Vaga{myJobs.length !== 1 ? 's' : ''} publicada{myJobs.length !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="services">
          <TabsList className="mb-6 w-full grid grid-cols-2">
            <TabsTrigger value="services" className="text-sm">
              <Wrench className="h-4 w-4 mr-1.5" /> Meus Serviços
            </TabsTrigger>
            <TabsTrigger value="jobs" className="text-sm">
              <Briefcase className="h-4 w-4 mr-1.5" /> Minhas Vagas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            {showProviderForm || editingProvider ? (
              <ServiceProviderForm
                userId={profile.id}
                existing={editingProvider}
                onSaved={() => { setShowProviderForm(false); setEditingProvider(null); loadData(); if (!editingProvider) setShowPromoDialog(true); }}
                onCancel={() => { setShowProviderForm(false); setEditingProvider(null); }}
              />
            ) : (
              <>
                <Button onClick={() => setShowProviderForm(true)} className="bg-gradient-hero mb-6 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" /> Cadastrar Novo Serviço
                </Button>

                {myProviders.length === 0 ? (
                  <Card className="bg-gradient-card border-primary/20">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground mb-1">Nenhum serviço cadastrado</p>
                      <p className="text-sm text-muted-foreground">Clique no botão acima para divulgar seu primeiro serviço.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {myProviders.map(p => (
                      <Card key={p.id} className="bg-gradient-card border-primary/20 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-foreground">{p.name}</h3>
                                <Badge variant="outline" className={p.is_active
                                  ? 'border-green-500/40 text-green-400 text-xs'
                                  : 'border-muted text-muted-foreground text-xs'
                                }>
                                  {p.is_active ? '✅ Ativo' : '⏸ Pausado'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{p.description}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" /> {p.city}{p.neighborhood ? ` - ${p.neighborhood}` : ''}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/prestadores/${p.id}`)} title="Ver página">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingProvider(p)} title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProvider(p.id)} title="Remover">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="jobs">
            {showJobForm || editingJob ? (
              <JobListingForm
                userId={profile.id}
                existing={editingJob}
                onSaved={() => { setShowJobForm(false); setEditingJob(null); loadData(); if (!editingJob) setShowPromoDialog(true); }}
                onCancel={() => { setShowJobForm(false); setEditingJob(null); }}
              />
            ) : (
              <>
                <Button onClick={() => setShowJobForm(true)} className="bg-gradient-hero mb-6 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" /> Publicar Nova Vaga
                </Button>

                {myJobs.length === 0 ? (
                  <Card className="bg-gradient-card border-primary/20">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground mb-1">Nenhuma vaga publicada</p>
                      <p className="text-sm text-muted-foreground">Clique no botão acima para publicar sua primeira vaga.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {myJobs.map(j => (
                      <Card key={j.id} className="bg-gradient-card border-primary/20 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-foreground">{j.title}</h3>
                                <Badge variant="outline" className={j.is_active
                                  ? 'border-green-500/40 text-green-400 text-xs'
                                  : 'border-muted text-muted-foreground text-xs'
                                }>
                                  {j.is_active ? '✅ Ativa' : '⏸ Pausada'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{j.company}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" /> {j.city}{j.neighborhood ? ` - ${j.neighborhood}` : ''}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/vagas/${j.id}`)} title="Ver página">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingJob(j)} title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteJob(j.id)} title="Remover">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <SuccessPromoDialog open={showPromoDialog} onClose={() => setShowPromoDialog(false)} />
      <Footer />
    </div>
  );
};

export default PublicDashboard;
