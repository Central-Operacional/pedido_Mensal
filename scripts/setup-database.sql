-- Criar tabela de filiais
CREATE TABLE IF NOT EXISTS filiais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  empresa TEXT NOT NULL,
  departamento TEXT NOT NULL,
  posto TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  item TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filial_id UUID REFERENCES filiais(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  quantidade DECIMAL DEFAULT 0,
  valor_unitario DECIMAL DEFAULT 0,
  valor_total DECIMAL DEFAULT 0,
  n_serventes INTEGER DEFAULT 0,
  ordem_compra TEXT,
  realizado_per_capita DECIMAL DEFAULT 0,
  acumulado_total DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados iniciais de filiais
INSERT INTO filiais (nome, codigo, empresa, departamento, posto) VALUES
('São Paulo - Centro', 'sp-centro', 'Empresa ABC Ltda', 'Operações', 'Filial Regional'),
('Rio de Janeiro - Copacabana', 'rj-copacabana', 'Empresa ABC Ltda', 'Operações', 'Filial Regional'),
('Belo Horizonte - Centro', 'mg-centro', 'Empresa ABC Ltda', 'Operações', 'Filial Regional'),
('Porto Alegre - Centro', 'rs-centro', 'Empresa ABC Ltda', 'Operações', 'Filial Regional')
ON CONFLICT (codigo) DO NOTHING;

-- Inserir dados iniciais de produtos
INSERT INTO produtos (codigo, item, descricao) VALUES
('MAT001', 'Material de Limpeza', 'Detergente neutro 5L'),
('MAT002', 'Material de Escritório', 'Papel A4 500 folhas'),
('MAT003', 'Equipamento de Segurança', 'Capacete de proteção'),
('MAT004', 'Material de Higiene', 'Papel higiênico 12 rolos'),
('MAT005', 'Equipamento de Limpeza', 'Vassoura de piaçava')
ON CONFLICT (codigo) DO NOTHING;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
