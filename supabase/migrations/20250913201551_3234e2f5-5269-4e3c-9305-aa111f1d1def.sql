-- Criar tabela para armazenar informações legais
CREATE TABLE public.legal_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL UNIQUE, -- 'privacy_policy' ou 'terms_of_service'
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_content ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Conteúdo legal é visível por todos" 
ON public.legal_content 
FOR SELECT 
USING (true);

CREATE POLICY "Admins podem gerenciar conteúdo legal" 
ON public.legal_content 
FOR ALL 
USING (is_admin_user(auth.uid()));

-- Inserir conteúdo padrão
INSERT INTO public.legal_content (type, title, content) VALUES 
('privacy_policy', 'Política de Privacidade', 'Esta Política de Privacidade descreve como o Portal News coleta, usa, armazena e protege suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).

## 1. Informações Gerais
Esta Política de Privacidade descreve como o Portal News coleta, usa, armazena e protege suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).

## 2. Dados Coletados
Coletamos as seguintes categorias de dados:
- **Dados de navegação:** Informações sobre sua interação com nosso site
- **Dados de contato:** Quando você nos envia mensagens pelo formulário de contato
- **Cookies técnicos:** Para melhorar sua experiência de navegação
- **Dados de preferência:** Tema do site (claro/escuro) armazenado localmente

Para mais informações, entre em contato conosco através dos canais disponíveis no site.'),

('terms_of_service', 'Termos de Uso', 'Ao acessar e usar o Portal News, você concorda em cumprir e ficar vinculado a estes Termos de Uso.

## 1. Aceitação dos Termos
Ao acessar e usar o Portal News, você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.

## 2. Descrição do Serviço
O Portal News é uma plataforma digital de jornalismo que oferece:
- Notícias atualizadas em tempo real
- Artigos de colunistas especializados
- Transmissão de rádio online
- Conteúdo multimídia
- Interação através de formulários de contato

Para questões sobre estes Termos de Uso, entre em contato através dos canais disponíveis no site.');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_legal_content_updated_at
BEFORE UPDATE ON public.legal_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();