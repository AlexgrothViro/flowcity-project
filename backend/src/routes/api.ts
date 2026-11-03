import { Router, Request, Response } from 'express';
import { NOVO_HAMBURGO_UNITS, MUNICIPALITY_METADATA } from '../config/units.js';
import { StateManager } from '../services/stateManager.js';
import { RoutingService } from '../services/routing.js';
import { ClinicalTriageProtocol } from '../protocols/triage.js';
import { TelehealthService } from '../services/telehealth.js';
import { ManchesterPriority, SpecialistField, SymptomEvaluationRequest } from '../types.js';
import { MonteCarloQueueSimulator } from '../engine/monteCarlo.js';
import { ArrivalAnomalyDetector } from '../engine/anomaly.js';
import { KAnonymityGuard } from '../services/privacy.js';
import { PersistenceService } from '../services/persistence.js';
import { buildFlowBundle, buildLocationBundle } from '../fhir/resources.js';

export function createApiRouter(
  stateManager: StateManager,
  telehealthService: TelehealthService,
  persistence?: PersistenceService
): Router {
  const router = Router();
  const anomalyDetector = new ArrivalAnomalyDetector();

  // 1. Metadados e Unidades
  router.get('/units', (_req: Request, res: Response) => {
    res.json({
      municipio: MUNICIPALITY_METADATA,
      unidades: NOVO_HAMBURGO_UNITS
    });
  });

  // 2. Chave Publica Municipal para Verificacao Ed25519
  router.get('/public-key', (_req: Request, res: Response) => {
    res.json({
      algoritmo: 'Ed25519',
      chave_publica_hex: stateManager.getPublicKey(),
      instrucao: 'Use esta chave publica para validar a integridade criptografica dos dados de PoW e PoO publicados pela prefeitura.'
    });
  });

  // 2.1 Especificacao OpenAPI 3.0 em formato JSON
  router.get('/openapi.json', (_req: Request, res: Response) => {
    res.json({
      openapi: '3.0.3',
      info: {
        title: 'FlowCity Saúde — API Aberta Municipal',
        version: '1.0.0',
        description: 'Especificacao oficial da API Aberta Municipal (v0) para PoW, PoO, Agora-Casting e Telessaude.'
      },
      servers: [{ url: '/api/v0' }]
    });
  });

  router.get('/fhir/Location', (_req: Request, res: Response) => {
    res.type('application/fhir+json').json(buildLocationBundle());
  });

  router.get('/fhir/Bundle', (_req: Request, res: Response) => {
    const publicStates = stateManager.getAllStates().map((state) =>
      KAnonymityGuard.sanitizeState(state, (payload) => stateManager.signPublicPayload(payload))
    );
    res.type('application/fhir+json').json(buildFlowBundle(publicStates));
  });
  // 3. Snapshot de Todas as Unidades (PoW / PoO / Previsoes)
  router.get('/states', (_req: Request, res: Response) => {
    res.json({
      timestamp: new Date().toISOString(),
      municipio: MUNICIPALITY_METADATA.municipio,
      unidades: stateManager.getAllStates().map((state) => KAnonymityGuard.sanitizeState(state, (payload) => stateManager.signPublicPayload(payload)))
    });
  });

  // 4. Estado de Uma Unidade Especifica (Modelo exato da especificacao v0)
  router.get('/units/:id', (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const state = stateManager.getStateById(id);
    if (!state) {
      res.status(404).json({ erro: 'Unidade nao encontrada' });
      return;
    }
    res.json(KAnonymityGuard.sanitizeState(state, (payload) => stateManager.signPublicPayload(payload)));
  });

  // 5. Rota Inteligente Baseada em Haversine + Espera Atual
  router.post('/route', (req: Request, res: Response) => {
    const { lat, lng, prioridade } = req.body;
    const patientLat = Number(lat) || -29.6880; // Centro de Novo Hamburgo se nao fornecido
    const patientLng = Number(lng) || -51.1300;
    const prio: ManchesterPriority = prioridade || 'verde';

    const recommendation = RoutingService.recommendUnit(
      patientLat,
      patientLng,
      prio,
      stateManager.getRawMap()
    );

    res.json(recommendation);
  });

  // Scenario simulation is advisory and uses synthetic inputs only.
  router.post('/simulation/queue', (req: Request, res: Response) => {
    try {
      const result = MonteCarloQueueSimulator.simulate(req.body);
      res.json({ data_mode: 'SYNTHETIC_DEMO', result });
    } catch (error) {
      res.status(400).json({ erro: error instanceof Error ? error.message : 'Cenário inválido' });
    }
  });

  router.post('/analytics/anomalies/observe', async (req: Request, res: Response) => {
    try {
      const { key, currentRate } = req.body as { key: string; currentRate: number };
      const result = anomalyDetector.observe(key, currentRate);
      if (result.isAnomaly && persistence) {
        await persistence.appendWorkflowEvent('triage', null, {
          type: 'epidemiological_anomaly',
          key: result.key,
          currentRate: result.currentRate,
          baselineMean: result.baselineMean,
          zScore: result.zScore,
          cusum: result.cusum,
          reason: result.reason
        });
        await persistence.appendAudit({
          actor: 'anomaly-detector',
          action: 'epidemiological_anomaly.detected',
          entityType: 'alert',
          details: { key: result.key, reason: result.reason }
        });
      }
      res.json({ ...result, alert: result.isAnomaly });
    } catch (error) {
      res.status(400).json({ erro: error instanceof Error ? error.message : 'Métrica inválida' });
    }
  });
  // 6. Catalogo de Sintomas e Red Flags
  router.get('/triage/catalog', (_req: Request, res: Response) => {
    res.json({
      catalogo: ClinicalTriageProtocol.SYMPTOM_CATALOG
    });
  });

  // 7. Avaliacao Clinica de Teletriagem
  router.post('/triage/evaluate', (req: Request, res: Response) => {
    const requestData: SymptomEvaluationRequest = req.body;
    const result = ClinicalTriageProtocol.evaluate(requestData);
    res.json(result);
  });

  // 8. Telessaude - Agendamentos
  router.post('/telehealth/appointments', (req: Request, res: Response) => {
    const { paciente_anonimizado_id, resumo_caso } = req.body;
    const appt = telehealthService.createAppointment(
      paciente_anonimizado_id || `PAC-${Math.floor(1000 + Math.random() * 9000)}`,
      resumo_caso || 'Consulta de Acolhimento da Atencao Primaria'
    );
    res.status(201).json(appt);
  });

  router.get('/telehealth/appointments', (_req: Request, res: Response) => {
    res.json(telehealthService.getAllAppointments());
  });

  router.get('/telehealth/appointments/:id', (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const appt = telehealthService.getAppointmentById(id);
    if (!appt) {
      res.status(404).json({ erro: 'Consulta nao encontrada' });
      return;
    }
    res.json(appt);
  });

  // 9. Telessaude - Encaminhamentos e Teleinterconsultas com Especialistas
  router.post('/telehealth/referral', (req: Request, res: Response) => {
    const {
      consulta_id,
      especialidade,
      tipo,
      justificativa_clinica,
      crm_solicitante
    } = req.body;

    const referral = telehealthService.requestSpecialistReferral(
      consulta_id,
      especialidade as SpecialistField,
      tipo || 'TELEINTERCONSULTA_IMEDIATA',
      justificativa_clinica || 'Solicitacao de matriciamento clinico de especialista',
      crm_solicitante || 'CRM/RS 41092'
    );

    res.status(201).json(referral);
  });

  router.get('/telehealth/referrals', (_req: Request, res: Response) => {
    res.json(telehealthService.getAllReferrals());
  });

  router.post('/telehealth/referrals/:id/answer', (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { parecer, status } = req.body;
    const updated = telehealthService.answerReferral(
      id,
      parecer,
      status || 'APROVADO_AGENDADO'
    );
    if (!updated) {
      res.status(404).json({ erro: 'Encaminhamento nao encontrado' });
      return;
    }
    res.json(updated);
  });

  // 10. Webhook WhatsApp Conversacional (Simulador / Provedor Real)
  router.post('/webhooks/whatsapp', (req: Request, res: Response) => {
    const { message, phone } = req.body;
    const text = (message || '').toLowerCase();

    let reply = '';
    if (text.includes('fila') || text.includes('espera') || text.includes('tempo')) {
      const upa = stateManager.getStateById('upa_canudos');
      const waitVerde = upa?.pow.prioridades.verde.wait_med_min ?? 55;
      const waitAmarelo = upa?.pow.prioridades.amarelo.wait_med_min ?? 25;
      reply = `🏥 *FlowCity Saúde - Novo Hamburgo*\n\nNa *UPA 24h Canudos* agora:\n🟡 *Amarelo (Urgente):* ~${waitAmarelo} min\n🟢 *Verde (Pouco urgente):* ~${waitVerde} min\n\n💡 *Dica:* Se for caso leve (verde/azul), você pode ser atendido por *Teleconsulta* agora ou ir à *USF Santo Afonso* (espera de apenas ~15 min).\n\nDigite *TRIAGEM* para avaliar seus sintomas ou *TELECONSULTA* para falar com um médico agora.`;
    } else if (text.includes('triagem') || text.includes('dor') || text.includes('febre')) {
      reply = `🩺 *Teletriagem do SUS - Novo Hamburgo*\n\nPor favor, informe qual o sintoma principal que está sentindo:\n1️⃣ Dor no peito ou falta de ar\n2️⃣ Dor de cabeça forte\n3️⃣ Sintomas gripais ou febre\n4️⃣ Dores no corpo ou articulações\n5️⃣ Lesão ou mancha na pele\n\n_Se for uma emergência com risco de vida, ligue imediatamente para o 192 (SAMU)._`;
    } else if (text.includes('teleconsulta')) {
      const appt = telehealthService.createAppointment(`PAC-WPP-${phone || '4581'}`, 'Iniciado via WhatsApp');
      reply = `✅ *Sua Teleconsulta da Atenção Primária foi agendada!*\n\n👨‍⚕️ *Médico:* ${appt.medico_mfc_nome}\n📋 *Protocolo:* ${appt.protocolo}\n\n🔗 Acesse sua sala segura de vídeo:\n${appt.link_sala_webrtc}\n\nO médico pode emitir receitas digitais com certificação ICP-Brasil e, se necessário, acionar um especialista na hora.`;
    } else {
      reply = `Olá! Sou o assistente virtual do *FlowCity Saúde de Novo Hamburgo*.\n\nComo posso ajudar você hoje?\n- Digite *FILA* para ver tempos de espera das UPAs e hospitais.\n- Digite *TRIAGEM* para avaliar seus sintomas.\n- Digite *TELECONSULTA* para atendimento médico online sem sair de casa.`;
    }

    res.json({
      status: 'success',
      reply_text: reply,
      timestamp: new Date().toISOString()
    });
  });

  // 11. Metricas Globais da Rede (Regulacao e SAMU)
  router.get('/system/metrics', (_req: Request, res: Response) => {
    const states = stateManager.getAllStates();
    const totalQueue = states.reduce((sum, s) => sum + s.pow.total_em_fila, 0);
    const avgWaitAmarelo = Math.round(
      states.reduce((sum, s) => sum + s.pow.prioridades.amarelo.wait_med_min, 0) / states.length
    );
    const totalAmbulanciasRetidas = states.reduce((sum, s) => sum + s.samu.ambulancias_retidas, 0);

    res.json({
      cidade: 'Novo Hamburgo - RS',
      total_unidades_ativas: states.length,
      total_pacientes_em_fila: totalQueue,
      tempo_medio_amarelo_rede_min: avgWaitAmarelo,
      ambulancias_samu_retidas: totalAmbulanciasRetidas,
      unidade_mais_sobrecarregada: 'hmnh_hospital',
      unidade_mais_livre: 'usf_canudos',
      indice_balanceamento_rede: 0.74,
      recomendacao_operacional: 'Redirecionar casos Verde/Azul da UPA Canudos para a USF Santo Afonso e polo de teleconsulta.'
    });
  });

  return router;
}
