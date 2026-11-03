import test from 'node:test';
import assert from 'node:assert/strict';
import { RoutingService } from '../src/services/routing.js';
import { StateManager } from '../src/services/stateManager.js';

test('RoutingService calcula distancia Haversine corretamente', () => {
  // Distancia entre HMNH (-29.6914, -51.1325) e UPA Canudos (-29.6820, -51.1070) ~2.67 km
  const dist = RoutingService.calculateDistanceKm(-29.6914, -51.1325, -29.6820, -51.1070);
  assert.ok(dist > 2.0 && dist < 3.5);
});

test('RoutingService nunca direciona casos vermelhos ou laranjas para UBS', () => {
  const stateManager = new StateManager();
  const recommendation = RoutingService.recommendUnit(
    -29.6880,
    -51.1300,
    'laranja',
    stateManager.getRawMap()
  );

  assert.notEqual(recommendation.unidade_sugerida.tipo, 'UBS');
  assert.ok(recommendation.unidade_sugerida.tipo === 'HOSPITAL' || recommendation.unidade_sugerida.tipo === 'UPA');
});
