import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { useCurrencyQuotes } from '@/hooks/useCurrencyQuotes';

const BitcoinIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c1.77-.45 2.34-1.94 2.19-3.28-.12-1.11-.77-1.83-1.92-2.08V5h-1.16v.76c-.31 0-.62 0-.93.01V5H9.33v.76H7.5v1.15h.81c.45 0 .67.2.67.6v4.9c0 .4-.22.59-.67.59H7.5v1.15h1.83v.77h1.16v-.77c.33 0 .65 0 .97-.01v.78h1.16v-.77c1.97-.1 3.38-1.1 3.18-2.95-.14-1.33-.94-2.06-2.49-2.33zm-2.3-3.3c.9-.01 1.81-.02 1.81.84 0 .87-.9.87-1.81.87v-1.71zm0 5.4v-1.89c1.08 0 2.16-.01 2.16.93 0 .96-1.08.96-2.16.96z"/>
  </svg>
);

const formatCurrency = (value: number, currency: 'BRL' | 'USD' = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatBitcoin = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const CurrencyWidget: React.FC = () => {
  const { quotes, loading, error, refetch } = useCurrencyQuotes();

  if (error && !quotes.dollar && !quotes.bitcoin) {
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
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-8">
            {/* Dólar */}
            <div className="flex items-center gap-3 flex-1 justify-center sm:justify-end">
              {loading && !quotes.dollar ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-muted/50 rounded animate-pulse" />
                  </div>
                </div>
              ) : quotes.dollar ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground font-medium">Dólar</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(quotes.dollar.buy)}
                      </span>
                      <span className={`flex items-center text-xs font-medium ${
                        quotes.dollar.variation >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {quotes.dollar.variation >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                        )}
                        {quotes.dollar.variation >= 0 ? '+' : ''}{quotes.dollar.variation.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Separador */}
            <div className="hidden sm:block w-px h-12 bg-border/50" />
            <div className="sm:hidden h-px w-full bg-border/50" />

            {/* Bitcoin */}
            <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start">
              {loading && !quotes.bitcoin ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-muted/50 rounded animate-pulse" />
                  </div>
                </div>
              ) : quotes.bitcoin ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <BitcoinIcon />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground font-medium">Bitcoin</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {formatBitcoin(quotes.bitcoin.priceBRL)}
                      </span>
                      <span className={`flex items-center text-xs font-medium ${
                        quotes.bitcoin.variation24h >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {quotes.bitcoin.variation24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                        )}
                        {quotes.bitcoin.variation24h >= 0 ? '+' : ''}{quotes.bitcoin.variation24h.toFixed(1)}%
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
              className="absolute right-4 sm:relative sm:right-0 p-1.5 hover:bg-accent rounded-full transition-colors disabled:opacity-50"
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
