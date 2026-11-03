import React, { useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Clock3, Footprints, Bus, CarFront, Info, MapPin, Navigation } from 'lucide-react';
import { HealthUnit, UnitLiveState } from '../types.ts';

type TravelMode = 'carro' | 'transporte' | 'pe';

const CITY_CENTER: [number, number] = [-29.688, -51.13];
const MODE_CONFIG: Record<TravelMode, { label: string; speedKmh: number; routeFactor: number; fixedMinutes: number; icon: React.ReactNode }> = {
  carro: { label: 'Carro', speedKmh: 24, routeFactor: 1.35, fixedMinutes: 0, icon: <CarFront className="h-4 w-4" /> },
  transporte: { label: 'Transporte público', speedKmh: 18, routeFactor: 1.45, fixedMinutes: 8, icon: <Bus className="h-4 w-4" /> },
  pe: { label: 'A pé', speedKmh: 4.5, routeFactor: 1.2, fixedMinutes: 0, icon: <Footprints className="h-4 w-4" /> }
};

function createUnitIcon(unit: HealthUnit, state?: UnitLiveState) {
  const colors: Record<HealthUnit['tipo'], string> = {
    HOSPITAL: '#7c3aed',
    UPA: '#d97706',
    UBS: '#059669'
  };
  const waitCount = state?.pow.total_em_fila;
  const statusColor = waitCount === null || waitCount === undefined ? '#64748b' : colors[unit.tipo];
  const letter = unit.tipo === 'HOSPITAL' ? 'H' : unit.tipo === 'UPA' ? 'U' : 'B';

  return L.divIcon({
    className: 'flowcity-unit-marker',
    html: `<span aria-hidden="true" style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border:3px solid white;border-radius:50%;background:${statusColor};color:white;font-weight:800;font-size:13px;box-shadow:0 2px 8px #0f172a55">${letter}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
}

function OriginPicker({ onPick }: { onPick: (point: [number, number]) => void }) {
  useMapEvents({
    click(event) {
      onPick([event.latlng.lat, event.latlng.lng]);
    }
  });
  return null;
}

function distanceKm(from: [number, number], to: [number, number]) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const [lat1, lon1] = from.map(radians);
  const [lat2, lon2] = to.map(radians);
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface HealthMapProps {
  units: HealthUnit[];
  states: UnitLiveState[];
  filteredUnitIds: Set<string>;
  selectedUnit: HealthUnit | null;
  onSelectUnit: (unit: HealthUnit) => void;
}

export const HealthMap: React.FC<HealthMapProps> = ({ units, states, filteredUnitIds, selectedUnit, onSelectUnit }) => {
  const [origin, setOrigin] = useState<[number, number]>(CITY_CENTER);
  const [mode, setMode] = useState<TravelMode>('carro');
  const [showReferenceRadius, setShowReferenceRadius] = useState(false);

  const selectedDistance = useMemo(
    () => selectedUnit ? distanceKm(origin, [selectedUnit.coordenadas.lat, selectedUnit.coordenadas.lng]) : null,
    [origin, selectedUnit]
  );
  const estimatedMinutes = selectedDistance === null
    ? null
    : Math.max(1, Math.round((selectedDistance * MODE_CONFIG[mode].routeFactor / MODE_CONFIG[mode].speedKmh) * 60 + MODE_CONFIG[mode].fixedMinutes));

  const routePoints = selectedUnit
    ? [origin, [selectedUnit.coordenadas.lat, selectedUnit.coordenadas.lng] as [number, number]]
    : [];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="map-title">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="map-title" className="font-bold text-slate-900">Mapa de unidades de saúde</h2>
          <p className="mt-1 text-xs text-slate-500">Selecione uma unidade e clique no mapa para ajustar a origem de referência.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Modo de transporte para estimativa">
          {(Object.keys(MODE_CONFIG) as TravelMode[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              aria-pressed={mode === key}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${mode === key ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {MODE_CONFIG[key].icon}{MODE_CONFIG[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <MapContainer center={CITY_CENTER} zoom={13} scrollWheelZoom className="flowcity-map" aria-label="Mapa interativo de unidades de saúde de Novo Hamburgo">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <OriginPicker onPick={setOrigin} />
          {showReferenceRadius && units.filter((unit) => filteredUnitIds.has(unit.id)).map((unit) => (
            <Circle
              key={`radius-${unit.id}`}
              center={[unit.coordenadas.lat, unit.coordenadas.lng]}
              radius={700}
              pathOptions={{ color: '#0891b2', fillColor: '#06b6d4', fillOpacity: 0.08, weight: 1, dashArray: '5 5' }}
            />
          ))}
          {units.filter((unit) => filteredUnitIds.has(unit.id)).map((unit) => {
            const state = states.find((item) => item.unidade_id === unit.id);
            const count = state?.pow.total_em_fila;
            const occupancy = state?.poo.ocupacao_salas;
            return (
              <Marker
                key={unit.id}
                position={[unit.coordenadas.lat, unit.coordenadas.lng]}
                icon={createUnitIcon(unit, state)}
                title={unit.nome}
                alt={`Unidade ${unit.tipo}: ${unit.nome}`}
                eventHandlers={{ click: () => onSelectUnit(unit) }}
              >
                <Popup>
                  <div style={{ minWidth: 210 }}>
                    <strong>{unit.nome}</strong>
                    <p style={{ margin: '6px 0', color: '#475569' }}>{unit.endereco}</p>
                    <p style={{ margin: '4px 0' }}>Fila: {count === null || count === undefined ? 'dado suprimido ou indisponível' : `${count} (demonstração)`}</p>
                    <p style={{ margin: '4px 0' }}>Ocupação de salas: {occupancy === undefined ? 'indisponível' : `${Math.round(occupancy * 100)}% (demonstração)`}</p>
                    <p style={{ margin: '4px 0' }}>SAMU retido: {state?.samu.ambulancias_retidas == null ? 'dado suprimido ou indisponível' : `${state.samu.ambulancias_retidas} (sem localização GPS)`}</p>
                    <button type="button" onClick={() => onSelectUnit(unit)} style={{ marginTop: 8, color: '#0e7490', fontWeight: 700 }}>Ver estimativa</button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          <Marker position={origin} icon={L.divIcon({
            className: 'flowcity-origin-marker',
            html: '<span aria-hidden="true" style="display:block;width:18px;height:18px;border:3px solid white;border-radius:50%;background:#0f172a;box-shadow:0 1px 8px #0f172a77"></span>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          })} title="Origem de referência escolhida no mapa" alt="Origem de referência">
            <Popup>Origem escolhida no mapa. Nenhuma localização do aparelho foi solicitada.</Popup>
          </Marker>
          {routePoints.length > 0 && (
            <Polyline positions={routePoints} pathOptions={{ color: '#0891b2', weight: 4, dashArray: '8 8', opacity: 0.85 }} />
          )}
        </MapContainer>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
          <p>Estimativas didáticas em linha reta com fatores aproximados por modo. Não usam trânsito, rotas viárias, GTFS ou GPS. Os dados de operação e as coordenadas cadastradas precisam ser confirmados com a rede municipal antes de uso real.</p>
        </div>
        <div className="min-w-[220px] space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
            <input type="checkbox" checked={showReferenceRadius} onChange={(event) => setShowReferenceRadius(event.target.checked)} className="rounded border-slate-300 text-cyan-700 focus:ring-cyan-600" />
            Mostrar raio de referência (700 m)
          </label>
          {selectedUnit && selectedDistance !== null && (
            <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-900">
                <Navigation className="h-4 w-4" />{selectedUnit.nome}
              </div>
              <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-700">
                <span className="inline-flex items-center gap-1">{MODE_CONFIG[mode].icon}{MODE_CONFIG[mode].label}</span>
                <span className="inline-flex items-center gap-1 font-bold"><Clock3 className="h-3.5 w-3.5" />~{estimatedMinutes} min</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Distância aproximada: {selectedDistance.toFixed(1)} km</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">
        <span><b className="text-violet-700">H</b> Hospital</span>
        <span><b className="text-amber-700">U</b> UPA</span>
        <span><b className="text-emerald-700">B</b> UBS/USF</span>
        <span>Camada visual de SAMU: contagem agregada no popup, sem posição das ambulâncias</span>
      </div>
    </section>
  );
};
