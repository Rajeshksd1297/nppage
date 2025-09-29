import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  Menu, 
  Sun, 
  Moon, 
  Search, 
  BookOpen, 
  User, 
  LogIn,
  Home,
  Info,
  Phone,
  FileText,
  Users
} from 'lucide-react';

interface HeaderConfig {
  showLogo?: boolean;
  showLogin?: boolean;
  navigation?: Array<{
    label: string;
    url: string;
    external?: boolean;
  }>;
  showSearch?: boolean;
  showDarkMode?: boolean;
}

interface DynamicHeaderProps {
  config?: HeaderConfig;
  siteTitle?: string;
  logoUrl?: string;
}

export const DynamicHeader: React.FC<DynamicHeaderProps> = ({
  config,
  siteTitle = "AuthorPage",
  logoUrl
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const defaultNavigation = [
    { label: 'Home', url: '/', external: false },
    { label: 'Authors', url: '/authors', external: false },
    { label: 'Books', url: '/books', external: false },
    { label: 'About', url: '/about', external: false },
    { label: 'Contact', url: '/contact', external: false }
  ];

  const navigation = config?.navigation || defaultNavigation;
  const showLogo = config?.showLogo !== false;
  const showLogin = config?.showLogin !== false;
  const showSearch = config?.showSearch || false;
  const showDarkMode = config?.showDarkMode || false;

  const getNavIcon = (label: string) => {
    const icons: { [key: string]: JSX.Element } = {
      'Home': <Home className="h-4 w-4" />,
      'Authors': <Users className="h-4 w-4" />,
      'Books': <BookOpen className="h-4 w-4" />,
      'About': <Info className="h-4 w-4" />,
      'Contact': <Phone className="h-4 w-4" />,
      'Blog': <FileText className="h-4 w-4" />
    };
    return icons[label] || <FileText className="h-4 w-4" />;
  };

  const handleNavigation = (url: string, external?: boolean) => {
    if (external) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
    setMobileMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          {showLogo && (
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={siteTitle}
                  className="h-8 w-auto"
                />
              ) : (
                <BookOpen className="h-8 w-8 text-primary" />
              )}
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {siteTitle}
              </span>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
      {navigation.map((item, index) => (
        <button
          key={index}
          onClick={() => handleNavigation(item.url, item.external)}
          className="text-sm font-medium transition-colors hover:text-primary relative group"
        >
                <span className="flex items-center space-x-1">
                  {getNavIcon(item.label)}
                  <span>{item.label}</span>
                </span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </button>
            ))}
          </nav>

          {/* Search, Dark Mode, Auth Controls */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden sm:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>
              </form>
            )}

            {/* Dark Mode Toggle */}
            {showDarkMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9 px-0"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {/* Auth Buttons */}
            {showLogin && (
              <div className="hidden sm:flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="flex items-center space-x-1"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
                <Button 
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden h-9 w-9 px-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Search */}
                  {showSearch && (
                    <form onSubmit={handleSearch} className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </form>
                  )}

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col space-y-2">
                    {navigation.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleNavigation(item.url, item.external)}
                        className="flex items-center space-x-3 text-left p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        {getNavIcon(item.label)}
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </nav>

                  {/* Mobile Auth Buttons */}
                  {showLogin && (
                    <div className="flex flex-col space-y-2 mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/auth')}
                        className="w-full justify-start"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                      <Button 
                        onClick={() => navigate('/auth')}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                      >
                        Get Started
                      </Button>
                    </div>
                  )}

                  {/* Mobile Dark Mode */}
                  {showDarkMode && (
                    <div className="mt-6 pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-full justify-start"
                      >
                        {theme === 'dark' ? (
                          <>
                            <Sun className="h-4 w-4 mr-2" />
                            Light Mode
                          </>
                        ) : (
                          <>
                            <Moon className="h-4 w-4 mr-2" />
                            Dark Mode
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};