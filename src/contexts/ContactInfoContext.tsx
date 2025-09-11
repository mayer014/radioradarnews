import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface ContactInfo {
  id: string;
  phone1: string;
  phone2: string;
  email1: string;
  email2: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  updatedAt: string;
}

interface ContactInfoContextType {
  contactInfo: ContactInfo;
  updateContactInfo: (updates: Partial<ContactInfo>) => void;
}

const STORAGE_KEY = 'contact_info_store';

const defaultContactInfo: ContactInfo = {
  id: 'main-contact',
  phone1: '(11) 3456-7890',
  phone2: '(11) 99999-8888',
  email1: 'contato@portalnews.com',
  email2: 'redacao@portalnews.com',
  address: 'Rua das Comunicações, 123',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567',
  hours: {
    weekdays: 'Segunda a Sexta: 6h às 22h',
    saturday: 'Sábados: 8h às 18h',
    sunday: 'Domingos: 10h às 16h'
  },
  socialMedia: {
    facebook: 'https://facebook.com/portalnews',
    instagram: 'https://instagram.com/portalnews',
    twitter: 'https://twitter.com/portalnews',
    youtube: 'https://youtube.com/@portalnews'
  },
  updatedAt: new Date().toISOString()
};

const ContactInfoContext = createContext<ContactInfoContextType | undefined>(undefined);

export const ContactInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultContactInfo;
      }
    }
    return defaultContactInfo;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contactInfo));
  }, [contactInfo]);

  const updateContactInfo = (updates: Partial<ContactInfo>) => {
    setContactInfo(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }));
  };

  return (
    <ContactInfoContext.Provider value={{ contactInfo, updateContactInfo }}>
      {children}
    </ContactInfoContext.Provider>
  );
};

export const useContactInfo = () => {
  const context = useContext(ContactInfoContext);
  if (!context) {
    throw new Error('useContactInfo must be used within a ContactInfoProvider');
  }
  return context;
};