import { HealthUnit } from '../types.js';

export const NOVO_HAMBURGO_UNITS: HealthUnit[] = [
  {
    id: 'hmnh_hospital',
    nome: 'Hospital Municipal de Novo Hamburgo (HMNH)',
    tipo: 'HOSPITAL',
    bairro: 'Pátria Nova',
    endereco: 'Rua Pedro Adams Filho, 6583 - Pátria Nova, Novo Hamburgo - RS',
    telefone: '(51) 3272-3272',
    coordenadas: { lat: -29.6914, lng: -51.1325 },
    horario_funcionamento: '24 Horas (Porta de Emergência)',
    servicos: [
      'Emergência Geral',
      'Trauma e Ortopedia',
      'UTI Adulto',
      'Centro Cirúrgico',
      'Tomografia e Raio-X 24h',
      'Laboratório Central'
    ]
  },
  {
    id: 'upa_canudos',
    nome: 'UPA 24h Canudos',
    tipo: 'UPA',
    bairro: 'Canudos',
    endereco: 'Rua Bartolomeu de Gusmão, 450 - Canudos, Novo Hamburgo - RS',
    telefone: '(51) 3097-9400',
    coordenadas: { lat: -29.6820, lng: -51.1070 },
    horario_funcionamento: '24 Horas',
    servicos: [
      'Pronto Atendimento Clínico',
      'Pronto Atendimento Pediátrico',
      'Leitos de Observação (até 24h)',
      'Raio-X Digital',
      'Eletrocardiograma',
      'Exames Laboratoriais Rápidos'
    ]
  },
  {
    id: 'usf_santo_afonso',
    nome: 'USF Santo Afonso (Unidade de Saúde da Família)',
    tipo: 'UBS',
    bairro: 'Santo Afonso',
    endereco: 'Rua Assis Chateaubriand, 280 - Santo Afonso, Novo Hamburgo - RS',
    telefone: '(51) 3587-1234',
    coordenadas: { lat: -29.7150, lng: -51.1400 },
    horario_funcionamento: 'Segunda a Sexta, 07:00 às 17:00',
    servicos: [
      'Clínica da Família e Atenção Primária',
      'Acolhimento com Classificação de Risco (ACCR)',
      'Consultas Médicas Agendadas e Demanda Espontânea',
      'Enfermagem e Curativos',
      'Vacinação e Farmácia Básica',
      'Polo de Telemedicina APS'
    ]
  },
  {
    id: 'usf_canudos',
    nome: 'USF Canudos / UBS Centro',
    tipo: 'UBS',
    bairro: 'Canudos',
    endereco: 'Rua Silvio Gilberto Christmann, 120 - Canudos, Novo Hamburgo - RS',
    telefone: '(51) 3594-5678',
    coordenadas: { lat: -29.6800, lng: -51.1150 },
    horario_funcionamento: 'Segunda a Sexta, 07:00 às 19:00',
    servicos: [
      'Atenção Básica e Saúde da Mulher',
      'Acompanhamento de Doenças Crônicas (Hiperdia)',
      'Puericultura e Pediatria Básica',
      'Procedimentos de Baixa Complexidade',
      'Polo de Teleinterconsulta de Especialidades'
    ]
  }
];

export const MUNICIPALITY_METADATA = {
  municipio: 'Novo Hamburgo',
  uf: 'RS',
  populacao_estimada: 247000,
  secretaria: 'Secretaria Municipal de Saúde (SMS / FSNH)',
  sistema_regulacao: 'SISREG Municipal / AGHUse / e-SUS PEC',
  polo_telessaude_regional: 'TelessaúdeRS-UFRGS'
};
