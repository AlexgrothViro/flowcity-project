import { NOVO_HAMBURGO_UNITS } from '../config/units.js';
import { HealthUnit, ManchesterPriority, RouteRecommendation, UnitLiveState } from '../types.js';

export class RoutingService {
  /**
   * Formula de Haversine para distancia geodesica em km
   */
  public static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Recomenda a melhor unidade considerando gravidade clinica, tempo de viagem e fila atual
   */
  public static recommendUnit(
    patientLat: number,
    patientLng: number,
    priority: ManchesterPriority,
    liveStates: Map<string, UnitLiveState>
  ): RouteRecommendation {
    const scoredUnits: Array<{
      unit: HealthUnit;
      distanceKm: number;
      transitMin: number;
      waitMin: number;
      totalMin: number;
      score: number;
    }> = [];

    for (const unit of NOVO_HAMBURGO_UNITS) {
      // Filtragem por complexidade clinica
      if ((priority === 'vermelho' || priority === 'laranja') && unit.tipo === 'UBS') {
        // Casos graves NUNCA sao direcionados a UBS
        continue;
      }

      const distanceKm = this.calculateDistanceKm(
        patientLat,
        patientLng,
        unit.coordenadas.lat,
        unit.coordenadas.lng
      );

      // Velocidade media urbana em Novo Hamburgo estimada em ~30 km/h (2 min/km) + 3 min partida
      const transitMin = Math.round(distanceKm * 2.0 + 3);

      const state = liveStates.get(unit.id);
      const waitMin = state?.pow.prioridades[priority]?.wait_med_min ?? 30;

      // Penalidade de sobrecarga de salas e leitos
      const occupancyRate = state?.poo.ocupacao_salas ?? 0.8;
      const overloadPenalty = occupancyRate > 0.90 ? 15 : 0;

      const totalMin = transitMin + waitMin;
      const score = totalMin + overloadPenalty;

      scoredUnits.push({
        unit,
        distanceKm,
        transitMin,
        waitMin,
        totalMin,
        score
      });
    }

    // Ordena pelo menor tempo total / score
    scoredUnits.sort((a, b) => a.score - b.score);

    const winner = scoredUnits[0];
    const second = scoredUnits[1];

    let justificativa = `A ${winner.unit.nome} é a melhor opção no momento com tempo total estimado de ${winner.totalMin} min (${winner.transitMin} min deslocamento + ${winner.waitMin} min espera).`;

    if (second && (second.totalMin - winner.totalMin >= 15)) {
      const diff = second.totalMin - winner.totalMin;
      justificativa += ` Ao escolher esta unidade você economiza cerca de ${diff} minutos em relação a ${second.unit.nome}.`;
    }

    return {
      unidade_sugerida: winner.unit,
      tempo_estimado_deslocamento_min: winner.transitMin,
      tempo_estimado_espera_min: winner.waitMin,
      tempo_total_porta_medico_min: winner.totalMin,
      distancia_km: winner.distanceKm,
      justificativa,
      alternativas: scoredUnits.slice(1).map((s) => ({
        unidade: s.unit,
        tempo_total_min: s.totalMin,
        diferenca_min: s.totalMin - winner.totalMin
      }))
    };
  }
}
