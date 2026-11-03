export interface QueueScenario {
  arrivalRatePerHour: number;
  averageServiceMinutes: number;
  servers: number;
  queueCapacity: number;
  durationMinutes: number;
  runs?: number;
  arrivalMultiplier?: number;
  additionalServers?: number;
  seed?: number;
}

export interface QueueScenarioResult {
  runs: number;
  meanWaitMinutes: number;
  p95MeanWaitMinutes: number;
  meanQueueLength: number;
  rejectionRate: number;
  servedPerHour: number;
}

type Random = () => number;

function seededRandom(seed: number): Random {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function exponential(mean: number, random: Random): number {
  return -Math.log(Math.max(Number.EPSILON, 1 - random())) * mean;
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] ?? 0;
}

export class MonteCarloQueueSimulator {
  public static simulate(input: QueueScenario): QueueScenarioResult {
    const scenario = {
      ...input,
      arrivalMultiplier: input.arrivalMultiplier ?? 1,
      additionalServers: input.additionalServers ?? 0,
      runs: input.runs ?? 500
    };
    if (!Number.isFinite(scenario.arrivalRatePerHour) || scenario.arrivalRatePerHour < 0
      || !Number.isFinite(scenario.averageServiceMinutes) || scenario.averageServiceMinutes <= 0
      || !Number.isInteger(scenario.servers) || scenario.servers < 1
      || !Number.isInteger(scenario.queueCapacity) || scenario.queueCapacity < 0
      || !Number.isFinite(scenario.durationMinutes) || scenario.durationMinutes <= 0
      || !Number.isInteger(scenario.runs) || scenario.runs < 1 || scenario.runs > 5000
      || scenario.arrivalMultiplier < 0 || !Number.isInteger(scenario.additionalServers)
      || scenario.servers + scenario.additionalServers < 1
      || scenario.durationMinutes > 1440
      || scenario.arrivalRatePerHour * scenario.arrivalMultiplier * scenario.durationMinutes * scenario.runs / 60 > 250000) {
      throw new Error('Invalid queue scenario parameters');
    }

    const means: number[] = [];
    let totalWait = 0;
    let totalQueueMinutes = 0;
    let totalRejected = 0;
    let totalArrivals = 0;
    let totalServed = 0;
    const seed = scenario.seed ?? 0x464c4f57;

    for (let run = 0; run < scenario.runs; run += 1) {
      const random = seededRandom((seed + run) >>> 0);
      const servers = scenario.servers + scenario.additionalServers;
      const arrivalRate = scenario.arrivalRatePerHour * scenario.arrivalMultiplier / 60;
      const serviceRate = 1 / scenario.averageServiceMinutes;
      const completions: number[] = [];
      const queue: number[] = [];
      const waits: number[] = [];
      let time = 0;
      let nextArrival = arrivalRate > 0 ? exponential(1 / arrivalRate, random) : Infinity;
      let queueArea = 0;
      let lastEventTime = 0;
      let rejected = 0;
      let arrivals = 0;
      let served = 0;

      while (nextArrival <= scenario.durationMinutes || completions.length > 0 || queue.length > 0) {
        const nextCompletion = completions.length ? Math.min(...completions) : Infinity;
        const nextArrivalInWindow = nextArrival <= scenario.durationMinutes ? nextArrival : Infinity;
        time = Math.min(nextArrivalInWindow, nextCompletion);
        const boundedTime = Math.min(time, scenario.durationMinutes);
        queueArea += queue.length * Math.max(0, boundedTime - lastEventTime);
        lastEventTime = boundedTime;

        if (!Number.isFinite(time)) break;
        if (nextArrivalInWindow <= nextCompletion) {
          arrivals += 1;
          nextArrival += exponential(1 / arrivalRate, random);
          if (completions.length < servers) {
            waits.push(0);
            completions.push(time + exponential(1 / serviceRate, random));
            served += 1;
          } else if (queue.length < scenario.queueCapacity) {
            queue.push(time);
          } else {
            rejected += 1;
          }
        } else {
          completions.splice(completions.indexOf(nextCompletion), 1);
          if (queue.length > 0) {
            const arrivedAt = queue.shift()!;
            waits.push(time - arrivedAt);
            completions.push(time + exponential(1 / serviceRate, random));
            served += 1;
          }
        }
      }

      const mean = waits.length ? waits.reduce((sum, wait) => sum + wait, 0) / waits.length : 0;
      means.push(mean);
      totalWait += mean;
      totalQueueMinutes += queueArea;
      totalRejected += rejected;
      totalArrivals += arrivals;
      totalServed += served;
    }

    return {
      runs: scenario.runs,
      meanWaitMinutes: totalWait / scenario.runs,
      p95MeanWaitMinutes: percentile(means, 0.95),
      meanQueueLength: totalQueueMinutes / (scenario.durationMinutes * scenario.runs),
      rejectionRate: totalArrivals ? totalRejected / totalArrivals : 0,
      servedPerHour: totalServed / (scenario.runs * scenario.durationMinutes / 60)
    };
  }
}
