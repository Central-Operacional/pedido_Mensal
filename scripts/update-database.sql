-- Adicionar campo data_lancamento na tabela pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS data_lancamento DATE;

-- Atualizar registros existentes com data atual
UPDATE pedidos SET data_lancamento = CURRENT_DATE WHERE data_lancamento IS NULL;
