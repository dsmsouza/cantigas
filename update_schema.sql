-- Nova tabela para armazenar quais cantigas específicas foram selecionadas para a festa
CREATE TABLE festa_cantigas (
    festa_id UUID REFERENCES festas(id) ON DELETE CASCADE,
    cantiga_id UUID REFERENCES cantigas(id) ON DELETE CASCADE,
    PRIMARY KEY (festa_id, cantiga_id)
);

ALTER TABLE festa_cantigas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para festa_cantigas" ON festa_cantigas FOR ALL USING (true) WITH CHECK (true);
