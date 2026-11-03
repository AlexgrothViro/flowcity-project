import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { MUNICIPALITY_METADATA, NOVO_HAMBURGO_UNITS } from '../config/units.js';
import type { PublicUnitState } from '../services/privacy.js';

const ResourceBase = z.object({
  resourceType: z.string().min(1),
  id: z.string().min(1),
  meta: z.object({ profile: z.array(z.string()).optional(), tag: z.array(z.object({ system: z.string(), code: z.string(), display: z.string().optional() })).optional() }).optional()
}).passthrough();

export type FhirResource = Record<string, unknown> & { resourceType: string; id: string };
export interface FhirBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'collection';
  timestamp: string;
  total: number;
  entry: Array<{ fullUrl: string; resource: FhirResource }>;
}

const FLOWCITY_SYSTEM = 'https://flowcity.saude.br/fhir/CodeSystem/flow-metrics';
const SYNTHETIC_TAG = { system: 'https://flowcity.saude.br/fhir/CodeSystem/data-mode', code: 'SYNTHETIC_DEMO', display: 'Dados sintéticos de demonstração' };

function resource<T extends FhirResource>(value: T): T {
  const parsed = ResourceBase.safeParse(value);
  if (!parsed.success) throw new Error(`Invalid FHIR R4 base resource: ${parsed.error.message}`);
  return value;
}

function locationResource(unit: typeof NOVO_HAMBURGO_UNITS[number]): FhirResource {
  return resource({
    resourceType: 'Location',
    id: unit.id,
    meta: { tag: [SYNTHETIC_TAG] },
    identifier: [{ system: 'https://flowcity.saude.br/id/unidade', value: unit.id }],
    status: 'active',
    name: unit.nome,
    description: `${unit.tipo} — ${unit.bairro}; coordenadas e cadastro são dados do projeto e requerem validação institucional.`,
    mode: 'instance',
    type: [{ coding: [{ system: FLOWCITY_SYSTEM, code: unit.tipo.toLowerCase(), display: unit.tipo }] }],
    telecom: [{ system: 'phone', value: unit.telefone }],
    address: {
      text: unit.endereco,
      district: unit.bairro,
      city: MUNICIPALITY_METADATA.municipio,
      state: MUNICIPALITY_METADATA.uf,
      country: 'BR'
    },
    position: { longitude: unit.coordenadas.lng, latitude: unit.coordenadas.lat }
  });
}

function serviceResource(unit: typeof NOVO_HAMBURGO_UNITS[number]): FhirResource {
  return resource({
    resourceType: 'HealthcareService',
    id: `service-${unit.id}`,
    meta: { tag: [SYNTHETIC_TAG] },
    active: true,
    name: unit.nome,
    type: [{ coding: [{ system: FLOWCITY_SYSTEM, code: unit.tipo.toLowerCase(), display: unit.tipo }] }],
    location: [{ reference: `Location/${unit.id}`, display: unit.nome }],
    telecom: [{ system: 'phone', value: unit.telefone }],
    comment: unit.servicos.join('; ')
  });
}

function fhirBundle(resources: FhirResource[], dataMode: string): FhirBundle {
  return {
    resourceType: 'Bundle',
    id: randomUUID(),
    type: 'collection',
    timestamp: new Date().toISOString(),
    total: resources.length,
    entry: resources.map((entry) => ({
      fullUrl: `urn:uuid:${randomUUID()}`,
      resource: {
        ...entry,
        meta: {
          ...(entry.meta as Record<string, unknown> || {}),
          tag: [{ system: SYNTHETIC_TAG.system, code: dataMode, display: dataMode === 'SYNTHETIC_DEMO' ? SYNTHETIC_TAG.display : 'Dados operacionais agregados' }]
        }
      }
    }))
  };
}

export function buildLocationBundle(): FhirBundle {
  return fhirBundle(NOVO_HAMBURGO_UNITS.map(locationResource), 'SYNTHETIC_DEMO');
}

export function buildFlowBundle(states: PublicUnitState[]): FhirBundle {
  const resources: FhirResource[] = [];
  const organization = resource({
    resourceType: 'Organization',
    id: 'sms-novo-hamburgo',
    active: true,
    name: MUNICIPALITY_METADATA.secretaria,
    address: [{ city: MUNICIPALITY_METADATA.municipio, state: MUNICIPALITY_METADATA.uf, country: 'BR' }]
  });
  const group = resource({
    resourceType: 'Group',
    id: 'aggregate-service-population',
    type: 'person',
    actual: false,
    code: { coding: [{ system: FLOWCITY_SYSTEM, code: 'aggregate-service-population', display: 'Grupo agregado para planejamento, não identifica pessoas' }] }
  });
  const role = resource({
    resourceType: 'PractitionerRole',
    id: 'flowcity-regulation-role',
    active: true,
    organization: { reference: 'Organization/sms-novo-hamburgo' },
    code: [{ coding: [{ system: FLOWCITY_SYSTEM, code: 'regulation', display: 'Regulação municipal' }] }]
  });
  resources.push(organization, group, role);

  for (const unit of NOVO_HAMBURGO_UNITS) {
    const state = states.find((candidate) => candidate.unidade_id === unit.id);
    resources.push(locationResource(unit), serviceResource(unit));
    if (!state) continue;

    const encounterId = `flow-${unit.id}-${state.timestamp.replace(/[^0-9]/g, '').slice(0, 14)}`;
    resources.push(resource({
      resourceType: 'Encounter',
      id: encounterId,
      meta: { tag: [SYNTHETIC_TAG] },
      status: 'in-progress',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: unit.tipo === 'UBS' ? 'AMB' : 'EMER', display: unit.tipo === 'UBS' ? 'Ambulatory' : 'Emergency' },
      subject: { reference: 'Group/aggregate-service-population', display: 'Agregado sintético de planejamento' },
      serviceProvider: { reference: 'Organization/sms-novo-hamburgo' },
      location: [{ location: { reference: `Location/${unit.id}`, display: unit.nome }, status: 'active' }],
      period: { start: state.timestamp }
    }));

    for (const [priority, metric] of Object.entries(state.pow.prioridades)) {
      const components: Array<Record<string, unknown>> = [];
      if (metric.fila !== null) {
        components.push({
          code: { coding: [{ system: FLOWCITY_SYSTEM, code: `queue-count-${priority}`, display: `Contagem de fila ${priority}` }] },
          valueInteger: metric.fila
        });
      }
      components.push({
        code: { coding: [{ system: FLOWCITY_SYSTEM, code: `wait-minutes-${priority}`, display: `Espera estimada ${priority}` }] },
        valueQuantity: { value: metric.wait_med_min, unit: 'min', system: 'http://unitsofmeasure.org', code: 'min' }
      });
      resources.push(resource({
        resourceType: 'Observation',
        id: `observation-${unit.id}-${priority}-${encounterId}`,
        meta: { tag: [{ ...SYNTHETIC_TAG, code: state.data_mode || 'SYNTHETIC_DEMO' }] },
        status: 'preliminary',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey', display: 'Survey' }] }],
        code: { coding: [{ system: FLOWCITY_SYSTEM, code: 'triage-flow', display: 'Indicadores agregados de fluxo por prioridade' }] },
        subject: { reference: `Location/${unit.id}` },
        effectiveDateTime: state.timestamp,
        component: components
      }));
    }
  }

  resources.push(resource({
    resourceType: 'ServiceRequest',
    id: 'demo-specialist-referral',
    meta: { tag: [SYNTHETIC_TAG] },
    status: 'active',
    intent: 'order',
    priority: 'routine',
    code: { coding: [{ system: FLOWCITY_SYSTEM, code: 'specialist-referral', display: 'Encaminhamento demonstrativo para especialista' }] },
    subject: { reference: 'Group/aggregate-service-population' },
    requester: { reference: 'PractitionerRole/flowcity-regulation-role' },
    authoredOn: new Date().toISOString()
  }));
  resources.push(resource({
    resourceType: 'CommunicationRequest',
    id: 'demo-referral-notification',
    meta: { tag: [SYNTHETIC_TAG] },
    status: 'active',
    intent: 'order',
    category: [{ coding: [{ system: FLOWCITY_SYSTEM, code: 'care-coordination', display: 'Coordenação do cuidado' }] }],
    subject: { reference: 'Group/aggregate-service-population' },
    about: [{ reference: 'ServiceRequest/demo-specialist-referral' }],
    sender: { reference: 'Organization/sms-novo-hamburgo' },
    payload: [{ contentString: 'Solicitação demonstrativa de coordenação; não representa encaminhamento clínico real.' }]
  }));
  return fhirBundle(resources, 'SYNTHETIC_DEMO');
}

export function validateFhirResource(value: unknown): value is FhirResource {
  return ResourceBase.safeParse(value).success;
}
