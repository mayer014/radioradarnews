import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { SupabaseNewsProvider } from "@/contexts/SupabaseNewsContext";
import { SupabaseBannerProvider } from "@/contexts/SupabaseBannerContext";
import { SupabaseContactInfoProvider } from "@/contexts/SupabaseContactInfoContext";
import { SupabaseNewsletterProvider } from "@/contexts/SupabaseNewsletterContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ContactProvider } from "@/contexts/ContactContext";
import { ProgrammingProvider } from "@/contexts/ProgrammingContext";
import { RadioPlayerProvider } from "@/contexts/RadioPlayerContext";
import { UsersProvider } from "@/contexts/UsersContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CommentsProvider } from "@/contexts/CommentsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { useBannerSync } from "@/hooks/useBannerSync";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ArticlePage from "./pages/ArticlePage";
import AdminLogin from "./pages/AdminLogin";
import SupabaseAdminLogin from "./pages/SupabaseAdminLogin";
import AdminPanel from "./pages/AdminPanel";
import NewsPage from "./pages/NewsPage";
import RadioPage from "./pages/RadioPage";
import LivePage from "./pages/LivePage";
import ContactPage from "./pages/ContactPage";
import ColumnistPage from "./pages/ColumnistPage";
import ColumnistArticlePage from "./pages/ColumnistArticlePage";
import ColumnistsPage from "./pages/ColumnistsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import PrivateRoute from "./components/PrivateRoute";

const queryClient = new QueryClient();

// Componente interno para usar o hook de sincronização
const AppContent = () => {
  useBannerSync(); // Sincroniza banners com status dos colunistas
  
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/noticias" element={<NewsPage />} />
          <Route path="/radio" element={<RadioPage />} />
          <Route path="/ao-vivo" element={<LivePage />} />
          <Route path="/contato" element={<ContactPage />} />
          <Route path="/colunistas" element={<ColumnistsPage />} />
          <Route path="/artigo/:id" element={<ArticlePage />} />
          <Route path="/colunista/:columnistId" element={<ColumnistPage />} />
          <Route path="/colunista/:columnistId/artigo/:id" element={<ColumnistArticlePage />} />
          <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos-uso" element={<TermsOfService />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/supabase-login" element={<SupabaseAdminLogin />} />
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
    <HelmetProvider>
      <SupabaseAuthProvider>
        <SupabaseNewsProvider>
          <SupabaseBannerProvider>
            <SupabaseContactInfoProvider>
              <SupabaseNewsletterProvider>
                <ThemeProvider>
                  <UsersProvider>
                    <AuthProvider>
                      <ContactProvider>
                        <ProgrammingProvider>
                          <RadioPlayerProvider>
                            <CommentsProvider>
                              <NotificationsProvider>
                                <TooltipProvider>
                                  <AppContent />
                                </TooltipProvider>
                              </NotificationsProvider>
                            </CommentsProvider>
                          </RadioPlayerProvider>
                        </ProgrammingProvider>
                      </ContactProvider>
                    </AuthProvider>
                  </UsersProvider>
                </ThemeProvider>
              </SupabaseNewsletterProvider>
            </SupabaseContactInfoProvider>
          </SupabaseBannerProvider>
        </SupabaseNewsProvider>
      </SupabaseAuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;