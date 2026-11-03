import { ManchesterPriority, SymptomEvaluationRequest, TriageResult, SpecialistField } from '../types.js';

export interface SymptomRule {
  sintoma: string;
  descricao: string;
  redFlags: Array<{ id: string; pergunta: string; peso: 'CRITICO' | 'ALTO' }>;
  especialidadeRelacionada: SpecialistField;
}

export class ClinicalTriageProtocol {
  public static readonly SYMPTOM_CATALOG: SymptomRule[] = [
    {
      sintoma: 'Dor no Peito / Torácica',
      descricao: 'Desconforto, pressão ou dor na região torácica',
      redFlags: [
        { id: 'dor_irradiando', pergunta: 'A dor irradia para o braço esquerdo, costas ou mandíbula?', peso: 'CRITICO' },
        { id: 'falta_ar_subita', pergunta: 'Está acompanhada de falta de ar súbita ou suor frio?', peso: 'CRITICO' },
        { id: 'desmaio_vertigem', pergunta: 'Houve desmaio, tontura severa ou palpitação forte?', peso: 'ALTO' }
      ],
      especialidadeRelacionada: 'Cardiologia'
    },
    {
      sintoma: 'Sintomas Respiratórios / Gripe / Tosse',
      descricao: 'Tosse, coriza, dor de garganta ou febre',
      redFlags: [
        { id: 'falta_ar_grave', pergunta: 'Sente dificuldade grave para respirar ou chiado no peito em repouso?', peso: 'CRITICO' },
        { id: 'labios_roxos', pergunta: 'Lábios ou pontas dos dedos arroxeados (cianose)?', peso: 'CRITICO' },
        { id: 'sonolencia_extrema', pergunta: 'Confusão mental ou sonolência excessiva?', peso: 'CRITICO' }
      ],
      especialidadeRelacionada: 'Pediatria' // ou Pneumologia
    },
    {
      sintoma: 'Dor de Cabeça / Cefaleia',
      descricao: 'Dor na cabeça de intensidade variável',
      redFlags: [
        { id: 'inicio_subito_trovoada', pergunta: 'Foi a pior dor de cabeça da vida com início súbito em segundos?', peso: 'CRITICO' },
        { id: 'perda_forca_fala', pergunta: 'Houve perda de força em um lado do corpo, boca torta ou fala enrolada?', peso: 'CRITICO' },
        { id: 'rigidez_nuca', pergunta: 'Febre alta acompanhada de incapacidade de encostar o queixo no peito?', peso: 'CRITICO' }
      ],
      especialidadeRelacionada: 'Neurologia'
    },
    {
      sintoma: 'Dor Articular / Lombar / Trauma Leve',
      descricao: 'Dores musculares, torções, lombalgia ou dores articulares',
      redFlags: [
        { id: 'deformidade_ossea', pergunta: 'Há deformidade visível no osso, fratura exposta ou incapacidade de apoiar o membro?', peso: 'CRITICO' },
        { id: 'dormencia_pernas_incontinencia', pergunta: 'Dormência progressiva nas pernas ou perda de controle da urina/fezes?', peso: 'CRITICO' }
      ],
      especialidadeRelacionada: 'Ortopedia'
    },
    {
      sintoma: 'Lesão de Pele / Manchas / Alergia',
      descricao: 'Manchas, coceiras, feridas ou lesões dermatológicas',
      redFlags: [
        { id: 'inchaco_garganta_lingua', pergunta: 'Inchaço rápido nos lábios, língua ou sensação de garganta fechando?', peso: 'CRITICO' },
        { id: 'feridas_bolhas_generalizadas', pergunta: 'Bolhas na pele com febre alta e descolamento da pele?', peso: 'CRITICO' }
      ],
      especialidadeRelacionada: 'Dermatologia'
    }
  ];

  /**
   * Avalia os sintomas fornecidos e emite classificacao Manchester e rota clinica
   */
  public static evaluate(request: SymptomEvaluationRequest): TriageResult {
    const catalogItem = this.SYMPTOM_CATALOG.find(
      (c) => c.sintoma.toLowerCase().includes(request.sintoma_principal.toLowerCase())
    );

    let criticalFlagsCount = 0;
    let highFlagsCount = 0;

    if (catalogItem) {
      for (const flag of catalogItem.redFlags) {
        if (request.respostas_red_flags[flag.id] === true) {
          if (flag.peso === 'CRITICO') criticalFlagsCount++;
          if (flag.peso === 'ALTO') highFlagsCount++;
        }
      }
    }

    // 1. Cenário de Emergência Absoluta (Vermelho)
    if (criticalFlagsCount >= 2) {
      return {
        prioridade_sugerida: 'vermelho',
        classificacao_risco: 'EMERGENCIA',
        permite_teleconsulta: false,
        acionar_samu_urgente: true,
        recomendacao_imediata: 'Sinais de perigo iminente identificados. Ligue imediatamente para o SAMU 192 ou dirija-se à Sala Vermelha do Hospital Municipal de Novo Hamburgo.',
        unidades_recomendadas_ids: ['hmnh_hospital']
      };
    }

    // 2. Cenário de Muito Urgente (Laranja)
    if (criticalFlagsCount === 1 || highFlagsCount >= 2) {
      return {
        prioridade_sugerida: 'laranja',
        classificacao_risco: 'URGENCIA',
        permite_teleconsulta: false,
        acionar_samu_urgente: false,
        recomendacao_imediata: 'Condição com potencial de agravamento rápido. Dirija-se imediatamente à UPA 24h Canudos ou ao Hospital Municipal.',
        unidades_recomendadas_ids: ['upa_canudos', 'hmnh_hospital']
      };
    }

    // 3. Cenário de Urgente (Amarelo)
    if (highFlagsCount === 1 || (request.comorbidades && request.comorbidades.length > 2)) {
      return {
        prioridade_sugerida: 'amarelo',
        classificacao_risco: 'URGENCIA',
        permite_teleconsulta: false,
        acionar_samu_urgente: false,
        recomendacao_imediata: 'Atendimento presencial necessário para avaliação diagnóstica (exames rápidos/eletrocardiograma). Recomendamos a UPA 24h Canudos.',
        unidades_recomendadas_ids: ['upa_canudos']
      };
    }

    // 4. Cenário de Pouco Urgente / Não Urgente (Verde / Azul) -> ELEGIVEL PARA TELEMEDICINA!
    const prioridade: ManchesterPriority = request.respostas_red_flags['dor_moderada'] ? 'verde' : 'azul';

    return {
      prioridade_sugerida: prioridade,
      classificacao_risco: prioridade === 'verde' ? 'POUCO_URGENTE' : 'NAO_URGENTE',
      permite_teleconsulta: true,
      acionar_samu_urgente: false,
      recomendacao_imediata: 'Seu quadro não apresenta sinais de alarme. Você pode ser atendido por TELECONSULTA da Atenção Primária agora mesmo ou dirigir-se a uma UBS para poupar tempo e evitar filas de UPA.',
      unidades_recomendadas_ids: ['usf_santo_afonso', 'usf_canudos', 'upa_canudos']
    };
  }
}
