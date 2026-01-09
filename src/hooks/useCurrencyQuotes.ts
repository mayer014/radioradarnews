import { useState, useEffect, useCallback, useRef } from 'react';

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

const FIAT_CACHE_KEY = 'currency_fiat_cache_v3';
const CRYPTO_CACHE_KEY = 'currency_crypto_cache_v3';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface FiatCacheData {
  [code: string]: { data: FiatQuote; timestamp: number };
}

interface CryptoCacheData {
  [id: string]: { data: CryptoQuote; timestamp: number };
}

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setToStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage cheio ou indisponível
  }
};

export const useCurrencyQuotes = () => {
  const [selectedFiat, setSelectedFiat] = useState<FiatCode>(() => {
    return (getFromStorage('selected_fiat', null) as FiatCode) || 'USD';
  });
  
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoId>(() => {
    return (getFromStorage('selected_crypto', null) as CryptoId) || 'bitcoin';
  });

  const [fiatQuote, setFiatQuote] = useState<FiatQuote | null>(null);
  const [cryptoQuote, setCryptoQuote] = useState<CryptoQuote | null>(null);
  const [loadingFiat, setLoadingFiat] = useState(false);
  const [loadingCrypto, setLoadingCrypto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFiat = useCallback(async (code: FiatCode) => {
    // Verificar cache primeiro
    const cache = getFromStorage<FiatCacheData>(FIAT_CACHE_KEY, {});
    const cached = cache[code];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setFiatQuote(cached.data);
      return;
    }

    setLoadingFiat(true);
    const fiatInfo = FIAT_CURRENCIES.find(f => f.code === code);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(
        `https://economia.awesomeapi.com.br/json/last/${code}-BRL`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const key = `${code}BRL`;
      const quote = data[key];

      if (quote) {
        const fiat: FiatQuote = {
          code,
          name: fiatInfo?.name || code,
          buy: parseFloat(quote.bid),
          sell: parseFloat(quote.ask),
          variation: parseFloat(quote.pctChange),
          high: parseFloat(quote.high),
          low: parseFloat(quote.low)
        };
        
        setFiatQuote(fiat);
        
        // Atualizar cache
        cache[code] = { data: fiat, timestamp: Date.now() };
        setToStorage(FIAT_CACHE_KEY, cache);
      }
    } catch (err) {
      // Usar cache expirado como fallback
      if (cached) {
        setFiatQuote(cached.data);
      }
      console.warn('[Fiat] Erro:', err);
    } finally {
      setLoadingFiat(false);
    }
  }, []);

  const fetchCrypto = useCallback(async (id: CryptoId) => {
    // Verificar cache primeiro
    const cache = getFromStorage<CryptoCacheData>(CRYPTO_CACHE_KEY, {});
    const cached = cache[id];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setCryptoQuote(cached.data);
      return;
    }

    setLoadingCrypto(true);
    const cryptoInfo = CRYPTO_CURRENCIES.find(c => c.id === id);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=brl,usd&include_24hr_change=true`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const coinData = data[id];

      if (coinData) {
        const crypto: CryptoQuote = {
          id,
          name: cryptoInfo?.name || id,
          symbol: cryptoInfo?.symbol || id.toUpperCase(),
          priceBRL: coinData.brl,
          priceUSD: coinData.usd,
          variation24h: coinData.brl_24h_change || 0
        };
        
        setCryptoQuote(crypto);
        
        // Atualizar cache
        cache[id] = { data: crypto, timestamp: Date.now() };
        setToStorage(CRYPTO_CACHE_KEY, cache);
      }
    } catch (err) {
      // Usar cache expirado como fallback
      if (cached) {
        setCryptoQuote(cached.data);
      }
      console.warn('[Crypto] Erro:', err);
    } finally {
      setLoadingCrypto(false);
    }
  }, []);

  const changeFiat = useCallback((code: FiatCode) => {
    setSelectedFiat(code);
    setToStorage('selected_fiat', code);
  }, []);

  const changeCrypto = useCallback((id: CryptoId) => {
    setSelectedCrypto(id);
    setToStorage('selected_crypto', id);
  }, []);

  // Fetch fiat quando muda
  useEffect(() => {
    fetchFiat(selectedFiat);
  }, [selectedFiat, fetchFiat]);

  // Fetch crypto quando muda
  useEffect(() => {
    fetchCrypto(selectedCrypto);
  }, [selectedCrypto, fetchCrypto]);

  // Limpar error se tiver dados
  useEffect(() => {
    if (fiatQuote || cryptoQuote) {
      setError(null);
    }
  }, [fiatQuote, cryptoQuote]);

  const refetch = useCallback(() => {
    // Limpar cache para forçar nova requisição
    const fiatCache = getFromStorage<FiatCacheData>(FIAT_CACHE_KEY, {});
    delete fiatCache[selectedFiat];
    setToStorage(FIAT_CACHE_KEY, fiatCache);
    
    const cryptoCache = getFromStorage<CryptoCacheData>(CRYPTO_CACHE_KEY, {});
    delete cryptoCache[selectedCrypto];
    setToStorage(CRYPTO_CACHE_KEY, cryptoCache);
    
    fetchFiat(selectedFiat);
    fetchCrypto(selectedCrypto);
  }, [selectedFiat, selectedCrypto, fetchFiat, fetchCrypto]);

  return { 
    quotes: { fiat: fiatQuote, crypto: cryptoQuote },
    loading: loadingFiat || loadingCrypto,
    loadingFiat,
    loadingCrypto,
    error, 
    selectedFiat,
    selectedCrypto,
    changeFiat,
    changeCrypto,
    refetch
  };
};
