import React from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, ChevronDown } from 'lucide-react';
import { useCurrencyQuotes, FIAT_CURRENCIES, CRYPTO_CURRENCIES, FiatCode, CryptoId } from '@/hooks/useCurrencyQuotes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CryptoIcon = ({ symbol }: { symbol: string }) => {
  const icons: Record<string, JSX.Element> = {
    BTC: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.31 11.14c1.77-.45 2.34-1.94 2.19-3.28-.12-1.11-.77-1.83-1.92-2.08V5h-1.16v.76c-.31 0-.62 0-.93.01V5H9.33v.76H7.5v1.15h.81c.45 0 .67.2.67.6v4.9c0 .4-.22.59-.67.59H7.5v1.15h1.83v.77h1.16v-.77c.33 0 .65 0 .97-.01v.78h1.16v-.77c1.97-.1 3.38-1.1 3.18-2.95-.14-1.33-.94-2.06-2.49-2.33zm-2.3-3.3c.9-.01 1.81-.02 1.81.84 0 .87-.9.87-1.81.87v-1.71zm0 5.4v-1.89c1.08 0 2.16-.01 2.16.93 0 .96-1.08.96-2.16.96z"/>
      </svg>
    ),
    ETH: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 1.75l-6.25 10.5L12 16l6.25-3.75L12 1.75zM5.75 13.5L12 22.25l6.25-8.75L12 17.25l-6.25-3.75z"/>
      </svg>
    ),
  };
  
  return icons[symbol] || <span className="text-sm font-bold">{symbol.slice(0, 2)}</span>;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatCrypto = (value: number) => {
  if (value >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  return formatCurrency(value);
};

const CurrencyWidget: React.FC = () => {
  const { 
    quotes, 
    loading, 
    error, 
    selectedFiat,
    selectedCrypto,
    changeFiat,
    changeCrypto,
    refetch 
  } = useCurrencyQuotes();

  const currentFiat = FIAT_CURRENCIES.find(f => f.code === selectedFiat);
  const currentCrypto = CRYPTO_CURRENCIES.find(c => c.id === selectedCrypto);

  if (error && !quotes.fiat && !quotes.crypto) {
    return (
      <section className="py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">Cotações indisponíveis</span>
              <button
                onClick={refetch}
                className="p-1.5 hover:bg-accent rounded-full transition-colors"
                aria-label="Tentar novamente"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 px-4" aria-label="Cotações do dia">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm relative">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-8">
            {/* Moeda Fiduciária */}
            <div className="flex items-center gap-3 flex-1 justify-center sm:justify-end">
              {loading && !quotes.fiat ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-muted/50 rounded animate-pulse" />
                  </div>
                </div>
              ) : quotes.fiat ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-lg">
                    {currentFiat?.flag}
                  </div>
                  <div className="text-left">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1 text-xs text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer">
                        {quotes.fiat.name}
                        <ChevronDown className="w-3 h-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-popover border border-border shadow-lg z-50">
                        {FIAT_CURRENCIES.map((fiat) => (
                          <DropdownMenuItem
                            key={fiat.code}
                            onClick={() => changeFiat(fiat.code as FiatCode)}
                            className={`cursor-pointer ${selectedFiat === fiat.code ? 'bg-accent' : ''}`}
                          >
                            <span className="mr-2">{fiat.flag}</span>
                            {fiat.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(quotes.fiat.buy)}
                      </span>
                      <span className={`flex items-center text-xs font-medium ${
                        quotes.fiat.variation >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {quotes.fiat.variation >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                        )}
                        {quotes.fiat.variation >= 0 ? '+' : ''}{quotes.fiat.variation.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Separador */}
            <div className="hidden sm:block w-px h-12 bg-border/50" />
            <div className="sm:hidden h-px w-full bg-border/50" />

            {/* Criptomoeda */}
            <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start">
              {loading && !quotes.crypto ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-muted/50 rounded animate-pulse" />
                  </div>
                </div>
              ) : quotes.crypto ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <CryptoIcon symbol={quotes.crypto.symbol} />
                  </div>
                  <div className="text-left">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1 text-xs text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer">
                        {quotes.crypto.name}
                        <ChevronDown className="w-3 h-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-popover border border-border shadow-lg z-50">
                        {CRYPTO_CURRENCIES.map((crypto) => (
                          <DropdownMenuItem
                            key={crypto.id}
                            onClick={() => changeCrypto(crypto.id as CryptoId)}
                            className={`cursor-pointer ${selectedCrypto === crypto.id ? 'bg-accent' : ''}`}
                          >
                            <span className="mr-2 font-mono text-xs">{crypto.symbol}</span>
                            {crypto.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {formatCrypto(quotes.crypto.priceBRL)}
                      </span>
                      <span className={`flex items-center text-xs font-medium ${
                        quotes.crypto.variation24h >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {quotes.crypto.variation24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                        )}
                        {quotes.crypto.variation24h >= 0 ? '+' : ''}{quotes.crypto.variation24h.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Botão Refresh */}
            <button
              onClick={refetch}
              disabled={loading}
              className="absolute right-4 top-1/2 -translate-y-1/2 sm:relative sm:right-0 sm:top-0 sm:translate-y-0 p-1.5 hover:bg-accent rounded-full transition-colors disabled:opacity-50"
              aria-label="Atualizar cotações"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrencyWidget;
