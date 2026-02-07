import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupabaseNewsProvider } from "@/contexts/SupabaseNewsContext";
import { SupabaseContactInfoProvider } from "@/contexts/SupabaseContactInfoContext";
import { SupabaseCommentsProvider } from "@/contexts/SupabaseCommentsContext";
import { SupabaseFavoriteSitesProvider } from "@/contexts/SupabaseFavoriteSitesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { UsersProvider } from "@/contexts/UsersContext";
import { NewsProvider } from "@/contexts/NewsContext";
import { CommentsProvider } from "@/contexts/CommentsContext";
import { ContactProvider } from "@/contexts/ContactContext";
import { LegalContentProvider } from "@/contexts/LegalContentContext";
import { SupabaseAIConfigProvider } from "@/contexts/SupabaseAIConfigContext";
import { RadioProvider } from "@/contexts/RadioContext";
import { ArtTemplateProvider } from "@/contexts/ArtTemplateContext";
import { usePageTracking } from "@/hooks/usePageTracking";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ArticlePage from "./pages/ArticlePage";
import AdminAuth from "./pages/AdminAuth";
import AdminPanel from "./pages/AdminPanel";
import AccountSecurity from "./pages/AccountSecurity";
import NewsPage from "./pages/NewsPage";
import ContactPage from "./pages/ContactPage";
import ColumnistPage from "./pages/ColumnistPage";
import ColumnistArticlePage from "./pages/ColumnistArticlePage";
import ColumnistsPage from "./pages/ColumnistsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import PrivateRoute from "./components/PrivateRoute";
import ScrollToTop from "./components/ScrollToTop";
import SecurityProvider from "./components/SecurityProvider";
import { PublicAuthProvider } from "./contexts/PublicAuthContext";
import UtilityLanding from "./pages/UtilityLanding";
import PublicAuth from "./pages/PublicAuth";
import PasswordRecovery from "./pages/PasswordRecovery";
import ServiceProviders from "./pages/ServiceProviders";
import ServiceProviderDetail from "./pages/ServiceProviderDetail";
import JobListings from "./pages/JobListings";
import JobListingDetail from "./pages/JobListingDetail";
import PublicDashboard from "./pages/PublicDashboard";

const queryClient = new QueryClient();

// Componente para tracking de páginas (deve estar dentro do BrowserRouter)
const PageTracker = () => {
  usePageTracking();
  return null;
};

// Componente interno para usar o hook de sincronização
const AppContent = () => {
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageTracker />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/noticias" element={<NewsPage />} />
          <Route path="/contato" element={<ContactPage />} />
          <Route path="/colunistas" element={<ColumnistsPage />} />
          <Route path="/artigo/:id" element={<ArticlePage />} />
          <Route path="/colunista/:columnistId" element={<ColumnistPage />} />
          <Route path="/colunista/:columnistId/artigo/:id" element={<ColumnistArticlePage />} />
          <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos-uso" element={<TermsOfService />} />
          <Route path="/utilidade-publica" element={<UtilityLanding />} />
          <Route path="/utilidade-publica/auth" element={<PublicAuth />} />
          <Route path="/utilidade-publica/recuperar-senha" element={<PasswordRecovery />} />
          <Route path="/utilidade-publica/painel" element={<PublicDashboard />} />
          <Route path="/prestadores" element={<ServiceProviders />} />
          <Route path="/prestadores/:id" element={<ServiceProviderDetail />} />
          <Route path="/vagas" element={<JobListings />} />
          <Route path="/vagas/:id" element={<JobListingDetail />} />
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route path="/admin/login" element={<Navigate to="/admin/auth" replace />} />
          <Route path="/admin/security" element={<AccountSecurity />} />
          <Route path="/admin" element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SecurityProvider>
      <HelmetProvider>
        <ThemeProvider>
        <SupabaseAuthProvider>
          <AuthProvider>
          <SupabaseNewsProvider>
              <SupabaseContactInfoProvider>
                  <SupabaseCommentsProvider>
                    <SupabaseFavoriteSitesProvider>
                      <LegalContentProvider>
                        <SupabaseAIConfigProvider>
                        <NotificationsProvider>
                          <TooltipProvider>
                            <RadioProvider>
                              <ArtTemplateProvider>
                                <NewsProvider>
                                  <UsersProvider>
                                    <ContactProvider>
                                      <CommentsProvider>
                                        <PublicAuthProvider>
                                           <AppContent />
                                        </PublicAuthProvider>
                                      </CommentsProvider>
                                    </ContactProvider>
                                  </UsersProvider>
                                </NewsProvider>
                              </ArtTemplateProvider>
                            </RadioProvider>
                          </TooltipProvider>
                        </NotificationsProvider>
                        </SupabaseAIConfigProvider>
                      </LegalContentProvider>
                    </SupabaseFavoriteSitesProvider>
                  </SupabaseCommentsProvider>
              </SupabaseContactInfoProvider>
          </SupabaseNewsProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </SecurityProvider>
  </QueryClientProvider>
);

export default App;