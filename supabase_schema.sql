-- Habilitar a extensão pgcrypto para gerar UUIDs (caso ainda não esteja)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela: orixas
CREATE TABLE orixas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    ordem_padrao INTEGER NOT NULL,
    cor_tema TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: cantigas
CREATE TABLE cantigas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orixa_id UUID REFERENCES orixas(id) ON DELETE CASCADE,
    titulo TEXT,
    letra TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: festas (Setlists/Xirés)
CREATE TABLE festas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    data DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: festa_orixas (Relacionamento entre festas e orixás)
CREATE TABLE festa_orixas (
    festa_id UUID REFERENCES festas(id) ON DELETE CASCADE,
    orixa_id UUID REFERENCES orixas(id) ON DELETE CASCADE,
    ordem_apresentacao INTEGER NOT NULL,
    PRIMARY KEY (festa_id, orixa_id)
);

-- Habilitar Row Level Security (RLS) - opcional para maior segurança inicial
ALTER TABLE orixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cantigas ENABLE ROW LEVEL SECURITY;
ALTER TABLE festas ENABLE ROW LEVEL SECURITY;
ALTER TABLE festa_orixas ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público para LEITURA E ESCRITA (para facilitar o desenvolvimento inicial)
-- IMPORTANTE: No futuro, se colocar em produção pública, ajustaremos isso para acesso autenticado
CREATE POLICY "Permitir tudo para orixas" ON orixas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para cantigas" ON cantigas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para festas" ON festas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para festa_orixas" ON festa_orixas FOR ALL USING (true) WITH CHECK (true);
