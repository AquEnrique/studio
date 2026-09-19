# YGO Tournament Manager

Gestor de torneos suizos de Yu-Gi-Oh!: registro de jugadores, emparejamientos automáticos o manuales, carga de resultados, tabla de clasificaciones con desempates (OTP, GW%, OGW%), vista de juez para administrar rondas, reloj de ronda con notificaciones, y dos utilidades independientes (contador de life points y "Angelechy").

Construido con **Angular 19** (standalone components, signals, SSR) y **Tailwind CSS**.

## Desarrollo

```bash
npm install
npm start        # http://localhost:4200
```

## Build de producción

```bash
npm run build
```

Genera `dist/angular-app/browser` (sitio estático prerenderizado, una página por ruta) y `dist/angular-app/server` (servidor Node opcional para SSR bajo demanda).

## Estructura

- `src/app/core/` — modelos, lógica de dominio (emparejamiento suizo, clasificaciones) y servicios (`TournamentService`, `ClockService`, etc.), independientes de la UI.
- `src/app/ui/` — librería de componentes/directivas de UI reutilizables (botón, card, diálogos, tabs, tabla, etc.).
- `src/app/features/tournament/` — componentes propios del torneo (registro, emparejamientos, tabla de posiciones, controles).
- `src/app/pages/` — las 4 páginas enrutadas: torneo (`/`), juez (`/judge`), life points (`/life-points`) y Angelechy (`/angelechy`).
- `src/app/layout/` — cabecera, menú de navegación y reloj de ronda, compartidos por toda la app.

La persistencia del torneo y del reloj de ronda se hace contra dos JSON bins de npoint.io (no hay backend propio); los contadores de life points/Angelechy usan `localStorage`.
