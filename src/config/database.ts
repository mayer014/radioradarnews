// Configurações do banco de dados PostgreSQL
// TODO: Implementar quando conectar ao PostgreSQL

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

// Configuração para desenvolvimento local
export const localConfig: DatabaseConfig = {
  host: 'localhost',
  port: 5432,
  database: 'portal_news_dev',
  username: 'postgres',
  password: 'postgres',
  maxConnections: 10
};

// Configuração para produção (VPS)
export const productionConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'portal_news',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20')
};

// Configuração baseada no ambiente
export const databaseConfig = process.env.NODE_ENV === 'production' 
  ? productionConfig 
  : localConfig;

// Função para validar configuração
export function validateDatabaseConfig(config: DatabaseConfig): string[] {
  const errors: string[] = [];
  
  if (!config.host) errors.push('Host do banco de dados é obrigatório');
  if (!config.database) errors.push('Nome do banco de dados é obrigatório');
  if (!config.username) errors.push('Usuário do banco de dados é obrigatório');
  if (!config.password) errors.push('Senha do banco de dados é obrigatória');
  if (config.port < 1 || config.port > 65535) errors.push('Porta deve estar entre 1 e 65535');
  
  return errors;
}

// SQL para criação das tabelas principais
export const createTablesSQL = `
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'colunista')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de perfis de colunistas
CREATE TABLE IF NOT EXISTS columnist_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  bio TEXT,
  specialty VARCHAR(255),
  allowed_categories TEXT[], -- Array de categorias permitidas
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de artigos/notícias
CREATE TABLE IF NOT EXISTS news_articles (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category VARCHAR(100) NOT NULL,
  featured_image TEXT,
  views INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT FALSE,
  is_column_copy BOOLEAN DEFAULT FALSE,
  original_article_id VARCHAR(36) REFERENCES news_articles(id) ON DELETE SET NULL,
  columnist_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de mensagens de contato
CREATE TABLE IF NOT EXISTS contact_messages (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de programas de rádio
CREATE TABLE IF NOT EXISTS radio_programs (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('live', 'upcoming', 'ended')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de banners
CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  gif_url TEXT NOT NULL,
  position VARCHAR(20) NOT NULL CHECK (position IN ('hero', 'category')),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  click_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON news_articles(featured);
CREATE INDEX IF NOT EXISTS idx_articles_columnist ON news_articles(columnist_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON news_articles(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_read ON contact_messages(read);
CREATE INDEX IF NOT EXISTS idx_programs_status ON radio_programs(status);
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_columnist_profiles_modtime BEFORE UPDATE ON columnist_profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_news_articles_modtime BEFORE UPDATE ON news_articles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_radio_programs_modtime BEFORE UPDATE ON radio_programs FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_banners_modtime BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION update_modified_column();
`;

// SQL para inserir dados iniciais (seeds)
export const seedDataSQL = `
-- Inserir usuário admin padrão
INSERT INTO users (id, name, username, password_hash, role) 
VALUES ('admin', 'Administrador', 'admin', '$2b$10$encrypted_hash_here', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Inserir colunistas padrão
INSERT INTO users (id, name, username, password_hash, role) 
VALUES 
  ('ana-costa', 'Ana Costa', 'ana', '$2b$10$encrypted_hash_here', 'colunista'),
  ('joao-santos', 'João Santos', 'joao', '$2b$10$encrypted_hash_here', 'colunista')
ON CONFLICT (username) DO NOTHING;

-- Inserir perfis de colunistas
INSERT INTO columnist_profiles (id, user_id, name, avatar, bio, specialty, allowed_categories)
VALUES 
  ('ana-costa', 'ana-costa', 'Ana Costa', 
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
    'Economista e analista financeira com expertise em mercados e políticas econômicas.',
    'Economia e Finanças',
    ARRAY['Coluna Ana Costa']),
  ('joao-santos', 'joao-santos', 'João Santos',
   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
   'Especialista em segurança pública com vasta experiência em investigação criminal.',
   'Policial',
   ARRAY['Coluna João Santos'])
ON CONFLICT (id) DO NOTHING;
`;