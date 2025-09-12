import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupabaseNewsProvider } from "@/contexts/SupabaseNewsContext";
import { SupabaseBannerProvider } from "@/contexts/SupabaseBannerContext";
import { SupabaseContactInfoProvider } from "@/contexts/SupabaseContactInfoContext";
import { SupabaseNewsletterProvider } from "@/contexts/SupabaseNewsletterContext";
import { SupabaseCommentsProvider } from "@/contexts/SupabaseCommentsContext";
import { SupabaseProgrammingProvider } from "@/contexts/SupabaseProgrammingContext";
import { SupabaseFavoriteSitesProvider } from "@/contexts/SupabaseFavoriteSitesContext";
import { RadioPlayerProvider } from "@/contexts/RadioPlayerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { UsersProvider } from "@/contexts/UsersContext";
import { NewsProvider } from "@/contexts/NewsContext";
import { CommentsProvider } from "@/contexts/CommentsContext";
import { ProgrammingProvider } from "@/contexts/ProgrammingContext";
import { ContactProvider } from "@/contexts/ContactContext";
import { BannerProvider } from "@/contexts/BannerContext";
import { NewBannerProvider } from "@/contexts/NewBannerContext";
import { NewsletterProvider } from "@/contexts/NewsletterContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ArticlePage from "./pages/ArticlePage";
import AdminAuth from "./pages/AdminAuth";
import AdminPanel from "./pages/AdminPanel";
import AccountSecurity from "./pages/AccountSecurity";
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
    <HelmetProvider>
      <ThemeProvider>
        <SupabaseAuthProvider>
          <AuthProvider>
          <SupabaseNewsProvider>
            <SupabaseBannerProvider>
              <SupabaseContactInfoProvider>
                <SupabaseNewsletterProvider>
                  <SupabaseCommentsProvider>
                    <SupabaseProgrammingProvider>
                      <SupabaseFavoriteSitesProvider>
                        <RadioPlayerProvider>
                          <NotificationsProvider>
                            <TooltipProvider>
                              <NewsProvider>
                                <UsersProvider>
                                  <ContactProvider>
                                    <CommentsProvider>
        <BannerProvider>
          <NewBannerProvider>
            <ProgrammingProvider>
              <NewsletterProvider>
                                            <AppContent />
              </NewsletterProvider>
            </ProgrammingProvider>
          </NewBannerProvider>
        </BannerProvider>
                                    </CommentsProvider>
                                  </ContactProvider>
                                </UsersProvider>
                              </NewsProvider>
                            </TooltipProvider>
                          </NotificationsProvider>
                        </RadioPlayerProvider>
                      </SupabaseFavoriteSitesProvider>
                    </SupabaseProgrammingProvider>
                  </SupabaseCommentsProvider>
                </SupabaseNewsletterProvider>
              </SupabaseContactInfoProvider>
            </SupabaseBannerProvider>
          </SupabaseNewsProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;