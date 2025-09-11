import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Program {
  id: string;
  title: string;
  host: string;
  startTime: string;
  endTime: string;
  description: string;
  status: 'live' | 'upcoming' | 'ended';
  isActive: boolean;
}

interface ProgrammingContextType {
  programs: Program[];
  radioStreamUrl: string;
  setRadioStreamUrl: (url: string) => void;
  addProgram: (program: Omit<Program, 'id'>) => void;
  updateProgram: (id: string, program: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  getProgramById: (id: string) => Program | undefined;
  toggleProgramStatus: (id: string) => void;
}

const ProgrammingContext = createContext<ProgrammingContextType | undefined>(undefined);

const defaultPrograms: Program[] = [
  {
    id: '1',
    title: 'Portal News Manhã',
    host: 'Carlos Silva',
    startTime: '06:00',
    endTime: '09:00',
    description: 'Notícias, política e música regional para começar bem o dia',
    status: 'live',
    isActive: true
  },
  {
    id: '2',
    title: 'Jornal do Meio-Dia',
    host: 'Maria Santos',
    startTime: '12:00',
    endTime: '13:00',
    description: 'As principais notícias do dia em formato ágil',
    status: 'upcoming',
    isActive: true
  },
  {
    id: '3',
    title: 'Podcast Política Regional',
    host: 'Equipe Portal News',
    startTime: '14:00',
    endTime: '15:00',
    description: 'Análise semanal dos acontecimentos políticos locais',
    status: 'upcoming',
    isActive: true
  },
  {
    id: '4',
    title: 'Show Musical da Tarde',
    host: 'DJ Marco',
    startTime: '16:00',
    endTime: '18:00',
    description: 'O melhor da música regional e nacional',
    status: 'upcoming',
    isActive: true
  },
  {
    id: '5',
    title: 'Jornal da Noite',
    host: 'Roberto Lima',
    startTime: '19:00',
    endTime: '20:00',
    description: 'Retrospectiva completa dos acontecimentos do dia',
    status: 'upcoming',
    isActive: true
  }
];

const PROGRAMS_STORAGE_KEY = 'programs_store';

export const ProgrammingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [programs, setPrograms] = useState<Program[]>(() => {
    try {
      const stored = localStorage.getItem(PROGRAMS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading programs from storage:', error);
    }
    // Initialize with default programs
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(defaultPrograms));
    return defaultPrograms;
  });
  
  const [radioStreamUrl, setRadioStreamUrl] = useState<string>(() => {
    return localStorage.getItem('radio_stream_url') || '';
  });

  // Persist programs to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
    } catch (error) {
      console.error('Error saving programs to storage:', error);
    }
  }, [programs]);

  const handleSetRadioStreamUrl = (url: string) => {
    setRadioStreamUrl(url);
    localStorage.setItem('radio_stream_url', url);
  };

  const addProgram = (programData: Omit<Program, 'id'>) => {
    const newProgram: Program = {
      ...programData,
      id: Date.now().toString(),
    };
    setPrograms(prev => [...prev, newProgram]);
  };

  const updateProgram = (id: string, updates: Partial<Program>) => {
    setPrograms(prev =>
      prev.map(program =>
        program.id === id ? { ...program, ...updates } : program
      )
    );
  };

  const deleteProgram = (id: string) => {
    setPrograms(prev => prev.filter(program => program.id !== id));
  };

  const getProgramById = (id: string) => {
    return programs.find(program => program.id === id);
  };

  const toggleProgramStatus = (id: string) => {
    setPrograms(prev =>
      prev.map(program => {
        if (program.id === id) {
          const newStatus = program.status === 'live' ? 'upcoming' : 'live';
          return { ...program, status: newStatus };
        }
        return program;
      })
    );
  };

  return (
    <ProgrammingContext.Provider
      value={{
        programs,
        radioStreamUrl,
        setRadioStreamUrl: handleSetRadioStreamUrl,
        addProgram,
        updateProgram,
        deleteProgram,
        getProgramById,
        toggleProgramStatus,
      }}
    >
      {children}
    </ProgrammingContext.Provider>
  );
};

export const useProgramming = () => {
  const context = useContext(ProgrammingContext);
  if (!context) {
    throw new Error('useProgramming must be used within a ProgrammingProvider');
  }
  return context;
};