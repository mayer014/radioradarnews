import { useState, useEffect, useCallback } from 'react';

interface DollarQuote {
  buy: number;
  sell: number;
  variation: number;
  high: number;
  low: number;
}

interface BitcoinQuote {
  priceBRL: number;
  priceUSD: number;
  variation24h: number;
}

export interface CurrencyQuotes {
  dollar: DollarQuote | null;
  bitcoin: BitcoinQuote | null;
}

interface CacheData {
  data: CurrencyQuotes;
  timestamp: number;
}

const CACHE_KEY = 'currency_quotes_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useCurrencyQuotes = () => {
  const [quotes, setQuotes] = useState<CurrencyQuotes>({ dollar: null, bitcoin: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) return response;
        throw new Error(`HTTP ${response.status}`);
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    throw new Error('Max retries reached');
  };

  const fetchQuotes = useCallback(async () => {
    // Verificar cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const cacheData: CacheData = JSON.parse(cached);
        if (Date.now() - cacheData.timestamp < CACHE_DURATION) {
          setQuotes(cacheData.data);
          setLoading(false);
          setError(null);
          return;
        }
      } catch {
        // Cache inválido
      }
    }

    setLoading(true);

    try {
      const [dollarRes, bitcoinRes] = await Promise.allSettled([
        fetchWithRetry('https://economia.awesomeapi.com.br/json/last/USD-BRL'),
        fetchWithRetry('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd&include_24hr_change=true')
      ]);

      let dollar: DollarQuote | null = null;
      let bitcoin: BitcoinQuote | null = null;

      if (dollarRes.status === 'fulfilled') {
        const data = await dollarRes.value.json();
        const usd = data.USDBRL;
        dollar = {
          buy: parseFloat(usd.bid),
          sell: parseFloat(usd.ask),
          variation: parseFloat(usd.pctChange),
          high: parseFloat(usd.high),
          low: parseFloat(usd.low)
        };
      }

      if (bitcoinRes.status === 'fulfilled') {
        const data = await bitcoinRes.value.json();
        bitcoin = {
          priceBRL: data.bitcoin.brl,
          priceUSD: data.bitcoin.usd,
          variation24h: data.bitcoin.brl_24h_change
        };
      }

      const newQuotes: CurrencyQuotes = { dollar, bitcoin };
      
      // Salvar cache
      const cacheData: CacheData = {
        data: newQuotes,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      setQuotes(newQuotes);
      setError(null);
    } catch (err) {
      console.error('[Currency] Erro ao buscar cotações:', err);
      setError('Erro ao carregar cotações');
      
      // Fallback para cache expirado
      if (cached) {
        try {
          const cacheData: CacheData = JSON.parse(cached);
          setQuotes(cacheData.data);
        } catch {
          // Cache inválido
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return { quotes, loading, error, refetch: fetchQuotes };
};
