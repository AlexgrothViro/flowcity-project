import test from 'node:test';
import assert from 'node:assert/strict';
import { ManchesterQueuingModel } from '../src/engine/queuing.js';

test('ManchesterQueuingModel calcula tempos de espera por prioridade', () => {
  const result = ManchesterQueuingModel.calculateWaitTimes({
    activeRooms: 4,
    queueCounts: {
      vermelho: 1,
      laranja: 2,
      amarelo: 8,
      verde: 15,
      azul: 5
    },
    meanConsultationMinutes: 12,
    dataFreshnessSeconds: 30
  });

  // 1. Vermelho deve ter espera zero e altissima confianca
  assert.equal(result.vermelho.wait_med_min, 0);
  assert.equal(result.vermelho.fila, 1);
  assert.ok(result.vermelho.conf >= 0.90);

  // 2. Laranja deve ter espera menor que Amarelo
  assert.ok(result.laranja.wait_med_min < result.amarelo.wait_med_min);

  // 3. Amarelo deve ter espera menor que Verde
  assert.ok(result.amarelo.wait_med_min < result.verde.wait_med_min);

  // 4. Verde deve ter espera menor que Azul
  assert.ok(result.verde.wait_med_min <= result.azul.wait_med_min);
});

test('ManchesterQueuingModel reduz tempo de espera quando mais consultorios sao abertos', () => {
  const queues = { vermelho: 0, laranja: 2, amarelo: 10, verde: 20, azul: 10 };

  const waitWith2Rooms = ManchesterQueuingModel.calculateWaitTimes({
    activeRooms: 2,
    queueCounts: queues
  });

  const waitWith6Rooms = ManchesterQueuingModel.calculateWaitTimes({
    activeRooms: 6,
    queueCounts: queues
  });

  assert.ok(waitWith6Rooms.amarelo.wait_med_min < waitWith2Rooms.amarelo.wait_med_min);
  assert.ok(waitWith6Rooms.verde.wait_med_min < waitWith2Rooms.verde.wait_med_min);
});
