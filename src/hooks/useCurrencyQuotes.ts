import { useState, useEffect, useCallback } from 'react';

// Moedas Fiduciárias (AwesomeAPI)
export const FIAT_CURRENCIES = [
  { code: 'USD', name: 'Dólar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'Libra', symbol: '£', flag: '🇬🇧' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷' },
  { code: 'JPY', name: 'Iene', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Dólar Canadense', symbol: 'C$', flag: '🇨🇦' },
] as const;

// Criptomoedas (CoinGecko)
export const CRYPTO_CURRENCIES = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
] as const;

export type FiatCode = typeof FIAT_CURRENCIES[number]['code'];
export type CryptoId = typeof CRYPTO_CURRENCIES[number]['id'];

export interface FiatQuote {
  code: string;
  name: string;
  buy: number;
  sell: number;
  variation: number;
  high: number;
  low: number;
}

export interface CryptoQuote {
  id: string;
  name: string;
  symbol: string;
  priceBRL: number;
  priceUSD: number;
  variation24h: number;
}

export interface CurrencyQuotes {
  fiat: FiatQuote | null;
  crypto: CryptoQuote | null;
}

interface CacheData {
  fiatCode: string;
  cryptoId: string;
  data: CurrencyQuotes;
  timestamp: number;
}

const CACHE_KEY = 'currency_quotes_cache_v2';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useCurrencyQuotes = () => {
  const [selectedFiat, setSelectedFiat] = useState<FiatCode>(() => {
    const saved = localStorage.getItem('selected_fiat');
    return (saved as FiatCode) || 'USD';
  });
  
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoId>(() => {
    const saved = localStorage.getItem('selected_crypto');
    return (saved as CryptoId) || 'bitcoin';
  });

  const [quotes, setQuotes] = useState<CurrencyQuotes>({ fiat: null, crypto: null });
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

  const fetchQuotes = useCallback(async (fiatCode: FiatCode, cryptoId: CryptoId) => {
    const cacheKey = `${fiatCode}-${cryptoId}`;
    
    // Verificar cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const cacheData: CacheData = JSON.parse(cached);
        if (
          cacheData.fiatCode === fiatCode && 
          cacheData.cryptoId === cryptoId &&
          Date.now() - cacheData.timestamp < CACHE_DURATION
        ) {
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
      const fiatInfo = FIAT_CURRENCIES.find(f => f.code === fiatCode);
      const cryptoInfo = CRYPTO_CURRENCIES.find(c => c.id === cryptoId);
      
      const [fiatRes, cryptoRes] = await Promise.allSettled([
        fetchWithRetry(`https://economia.awesomeapi.com.br/json/last/${fiatCode}-BRL`),
        fetchWithRetry(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=brl,usd&include_24hr_change=true`)
      ]);

      let fiat: FiatQuote | null = null;
      let crypto: CryptoQuote | null = null;

      if (fiatRes.status === 'fulfilled') {
        const data = await fiatRes.value.json();
        const key = `${fiatCode}BRL`;
        const quote = data[key];
        if (quote) {
          fiat = {
            code: fiatCode,
            name: fiatInfo?.name || fiatCode,
            buy: parseFloat(quote.bid),
            sell: parseFloat(quote.ask),
            variation: parseFloat(quote.pctChange),
            high: parseFloat(quote.high),
            low: parseFloat(quote.low)
          };
        }
      }

      if (cryptoRes.status === 'fulfilled') {
        const data = await cryptoRes.value.json();
        const coinData = data[cryptoId];
        if (coinData) {
          crypto = {
            id: cryptoId,
            name: cryptoInfo?.name || cryptoId,
            symbol: cryptoInfo?.symbol || cryptoId.toUpperCase(),
            priceBRL: coinData.brl,
            priceUSD: coinData.usd,
            variation24h: coinData.brl_24h_change || 0
          };
        }
      }

      const newQuotes: CurrencyQuotes = { fiat, crypto };
      
      // Salvar cache
      const cacheData: CacheData = {
        fiatCode,
        cryptoId,
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

  const changeFiat = useCallback((code: FiatCode) => {
    setSelectedFiat(code);
    localStorage.setItem('selected_fiat', code);
  }, []);

  const changeCrypto = useCallback((id: CryptoId) => {
    setSelectedCrypto(id);
    localStorage.setItem('selected_crypto', id);
  }, []);

  useEffect(() => {
    fetchQuotes(selectedFiat, selectedCrypto);
  }, [selectedFiat, selectedCrypto, fetchQuotes]);

  return { 
    quotes, 
    loading, 
    error, 
    selectedFiat,
    selectedCrypto,
    changeFiat,
    changeCrypto,
    refetch: () => fetchQuotes(selectedFiat, selectedCrypto)
  };
};
