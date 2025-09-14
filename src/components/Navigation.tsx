import React, { useState, useEffect } from 'react';
import { Menu, X, Radio, Home, Mic, Users, Shield, Building2, Car, Clapperboard, Globe, Trophy, Smartphone, Activity, ChevronDown, FileText, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/contexts/UsersContext';
import ThemeToggle from '@/components/ThemeToggle';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { columnists } = useUsers();
  const logoUrl = '/lovable-uploads/ef193e05-ec63-47a4-9731-ac6dd613febc.png';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Início', icon: Home, href: '/' },
    { name: 'Contato', icon: Users, href: '/contato' },
  ];

  const categoryItems = [
    { name: 'Política', icon: Building2, href: '/noticias?categoria=Política' },
    { name: 'Policial', icon: Car, href: '/noticias?categoria=Policial' },
    { name: 'Entretenimento', icon: Clapperboard, href: '/noticias?categoria=Entretenimento' },
    { name: 'Internacional', icon: Globe, href: '/noticias?categoria=Internacional' },
    { name: 'Esportes', icon: Trophy, href: '/noticias?categoria=Esportes' },
    { name: 'Tecnologia / Economia', icon: Smartphone, href: '/noticias?categoria=Tecnologia' },
    { name: 'Ciência / Saúde', icon: Activity, href: '/noticias?categoria=Ciência / Saúde' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-gradient-card/95 backdrop-blur-md border-b border-primary/20 shadow-glow-primary' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col min-h-[64px] py-2">
          {/* Primeira linha: Logo e menu mobile */}
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <img 
                src={logoUrl} 
                alt="Radio Radar RRN News" 
                className="h-8 w-auto dark:filter dark:brightness-0 dark:invert"
              />
            </div>

            {/* Theme Toggle e Mobile Menu */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Segunda linha: Navegação desktop */}
          <div className="hidden md:flex items-center justify-center gap-1 pt-1">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                onClick={() => navigate(item.href)}
                className="flex items-center space-x-2 hover:bg-primary/10 hover:text-primary transition-all duration-200 text-sm px-3 py-1 h-8"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Button>
            ))}
            
            {/* Separador visual */}
            <div className="w-px h-5 bg-primary/30 mx-2" />
            
            {/* Dropdown Categorias */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-1 hover:bg-primary/10 hover:text-primary transition-all duration-200 text-sm px-3 py-1 h-8"
                >
                  <FileText className="w-4 h-4" />
                  <span>Categorias</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gradient-card backdrop-blur-md border-primary/20 shadow-glow-primary">
                <DropdownMenuLabel>Seções de Notícias</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categoryItems.map((item) => (
                  <DropdownMenuItem
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className="flex items-center space-x-2 hover:bg-primary/10 cursor-pointer"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dropdown Colunistas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-1 hover:bg-primary/10 hover:text-primary transition-all duration-200 text-sm px-3 py-1 h-8"
                >
                  <Users className="w-4 h-4" />
                  <span>Colunistas</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gradient-card backdrop-blur-md border-primary/20 shadow-glow-primary">
                <DropdownMenuLabel>Nossos Colunistas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columnists.filter(c => c.columnistProfile?.isActive).map((columnist) => (
                  <DropdownMenuItem
                    key={columnist.id}
                    onClick={() => navigate(`/colunista/${columnist.id}`)}
                    className="flex items-center space-x-3 hover:bg-primary/10 cursor-pointer p-3"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      {columnist.columnistProfile?.avatar && (columnist.columnistProfile.avatar.startsWith('http') || columnist.columnistProfile.avatar.startsWith('data:image/')) ? (
                        <img 
                          src={columnist.columnistProfile.avatar} 
                          alt={columnist.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Error loading columnist avatar in Navigation dropdown:', columnist.columnistProfile?.avatar?.substring(0, 100));
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `
                              <div class="w-full h-full bg-muted/50 flex items-center justify-center">
                                <span class="text-[10px] text-muted-foreground font-bold">${columnist.name[0]?.toUpperCase()}</span>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground font-bold">
                            {columnist.name[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{columnist.name}</span>
                      <span className="text-xs text-muted-foreground">{columnist.columnistProfile?.specialty}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dropdown Legal */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-1 hover:bg-primary/10 hover:text-primary transition-all duration-200 text-sm px-3 py-1 h-8"
                >
                  <Scale className="w-4 h-4" />
                  <span>Legal</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gradient-card backdrop-blur-md border-primary/20 shadow-glow-primary">
                <DropdownMenuLabel>Informações Legais</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/politica-privacidade')}
                  className="flex items-center space-x-2 hover:bg-primary/10 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Política de Privacidade</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/termos-uso')}
                  className="flex items-center space-x-2 hover:bg-primary/10 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Termos de Uso</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              onClick={() => navigate('/admin/login')}
              className="flex items-center space-x-2 border-primary/50 text-primary hover:bg-primary/10 transition-all duration-200 ml-2 text-xs px-3 py-1 h-8"
            >
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gradient-card/95 backdrop-blur-md border border-primary/20 rounded-2xl mt-2 p-4 animate-slide-up max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start space-x-3 hover:bg-primary/10 hover:text-primary"
                  onClick={() => {
                    navigate(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Button>
              ))}
              
              {/* Categorias no mobile */}
              <div className="border-t border-primary/20 pt-3 mt-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-3 flex items-center">
                  <FileText className="w-3 h-3 mr-1" />
                  Categorias
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {categoryItems.map((item) => (
                    <Button
                      key={item.name}
                      variant="ghost"
                      className="justify-start space-x-2 hover:bg-primary/10 hover:text-primary text-xs h-8 p-2"
                      onClick={() => {
                        navigate(item.href);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <item.icon className="w-3 h-3" />
                      <span className="truncate">{item.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Colunistas no mobile */}
              <div className="border-t border-primary/20 pt-3 mt-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-3 flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  Colunistas
                </div>
                <div className="space-y-1">
                  {columnists.filter(c => c.columnistProfile?.isActive).map((columnist) => (
                    <Button
                      key={columnist.id}
                      variant="ghost"
                      className="w-full justify-start space-x-3 hover:bg-primary/10 hover:text-primary text-sm h-12 p-2"
                      onClick={() => {
                        navigate(`/colunista/${columnist.id}`);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        {columnist.columnistProfile?.avatar && (columnist.columnistProfile.avatar.startsWith('http') || columnist.columnistProfile.avatar.startsWith('data:image/')) ? (
                          <img 
                            src={columnist.columnistProfile.avatar} 
                            alt={columnist.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Error loading columnist avatar in Navigation mobile menu:', columnist.columnistProfile?.avatar?.substring(0, 100));
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                <div class="w-full h-full bg-muted/50 flex items-center justify-center">
                                  <span class="text-xs text-muted-foreground font-bold">${columnist.name[0]?.toUpperCase()}</span>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground font-bold">
                              {columnist.name[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-xs">{columnist.name}</span>
                        <span className="text-xs text-muted-foreground truncate w-full">{columnist.columnistProfile?.specialty}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Seção Legal no mobile */}
              <div className="border-t border-primary/20 pt-3 mt-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-3 flex items-center">
                  <Scale className="w-3 h-3 mr-1" />
                  Legal
                </div>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start space-x-3 hover:bg-primary/10 hover:text-primary text-sm h-10 p-2"
                    onClick={() => {
                      navigate('/politica-privacidade');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Política de Privacidade</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start space-x-3 hover:bg-primary/10 hover:text-primary text-sm h-10 p-2"
                    onClick={() => {
                      navigate('/termos-uso');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Termos de Uso</span>
                  </Button>
                </div>
              </div>
              
              <div className="border-t border-primary/20 pt-2 mt-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate('/admin/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start space-x-3 border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;