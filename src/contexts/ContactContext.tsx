import React, { createContext, useContext, useState } from 'react';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface ContactContextType {
  messages: ContactMessage[];
  addMessage: (message: Omit<ContactMessage, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  deleteMessage: (id: string) => void;
  getUnreadCount: () => number;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

export const ContactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const addMessage = (messageData: Omit<ContactMessage, 'id' | 'createdAt' | 'read'>) => {
    const newMessage: ContactMessage = {
      ...messageData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false
    };
    
    setMessages(prev => [newMessage, ...prev]);
  };

  const markAsRead = (id: string) => {
    setMessages(prev => prev.map(message => 
      message.id === id ? { ...message, read: true } : message
    ));
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(message => message.id !== id));
  };

  const getUnreadCount = () => {
    return messages.filter(message => !message.read).length;
  };

  const value: ContactContextType = {
    messages,
    addMessage,
    markAsRead,
    deleteMessage,
    getUnreadCount
  };

  return (
    <ContactContext.Provider value={value}>
      {children}
    </ContactContext.Provider>
  );
};

export const useContact = () => {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error('useContact must be used within a ContactProvider');
  }
  return context;
};