# 🌍 ADGROUP Atmospheric Auditor

Plataforma corporativa full-stack de cuantificación, gestión y reporte de Huella de Carbono Organizacional para el holding ADGROUP.  
Diseñada siguiendo los lineamientos técnicos del **Programa HuellaChile (NCh-ISO 14064-1:2019)** y el **GHG Protocol**.

El diseño de la UI *"The Atmospheric Auditor"* proviene del diseño importado de Stitch (colores "forest green", tipografía Manrope/Inter, glassmorphism e indicadores ambientales de nivel ejecutivo).

## 🚀 Stack Técnico Implementado

*   **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4.
*   **Componentes UI**: Componentes CSS propios nativos siguiendo strict design guidelines (sin bordes `1px`, colores anclados al theme, animaciones sutiles fade).
*   **Gráficos**: Recharts para visualización de tendencias e indicadores de progreso radiales.
*   **Backend API**: Next.js Route Handlers (`/api/calcular-emision`, `/api/dashboard`, `/api/empresas`).
*   **Gestión de reportes**: Generación de PDF oficial con `jspdf` y archivos Excel crudos para carga HuellaChile con `xlsx`.
*   **Motor de cálculo GHG**: Utiliza Potencial de Calentamiento Global (GWP) de IPCC AR6 y Factores de Emisión de HuellaChile 2024. Diseñado para integrarse transparentemente con API Climatiq.

## ⚙️ Estructura del Proyecto

*   `src/app/page.tsx`: Landing corporativa y Login seguro (con opción a Modo Demo).
*   `src/app/dashboard/`: Rutas protegidas (Layout con Sidebar).
    *   `/dashboard`: Executive KPI Dashboard consolidado del holding (datos de 12 empresas, tendencia anual, mix de alcance 1/2/3).
    *   `/dashboard/empresas`: Directorio inteligente de empresas asociadas al holding, progreso contra metas y KPIs.
    *   `/dashboard/datos-actividad`: Tabla de registro de inventario, con modal para **cálculo en tiempo real** de emisiones (kg/tCO2e) en base al factor, gas y cantidad de la actividad.
    *   `/dashboard/factores`: Tabla del pool oficial de factores de emisión.
    *   `/dashboard/metas`: Indicadores estilo gauge para seguimiento de % reducción y sellos automáticos.
    *   `/dashboard/reportes`: Consola exportadora de PDF y Excel.
*   `src/lib/calculos-ghg.ts`: Lógica pura del cálculo de emisiones `CO₂e = cantidad × factor × GWP(AR6) / 1000`.
*   `src/lib/types.ts`: Esquemas Typescript de base de datos diseñados para mapeo real con Cloud Firestore.
*   `src/contexts/AuthContext.tsx`: Gestión global de estado de usuario con Firebase Auth (Google y validación Email).

## 🛠 Instalación y Despliegue Configurable

La aplicación, por defecto, se ejecuta en un robusto **Modo Demo**, renderizando datos realistas de cuatro filiales ADGROUP (Adtrans, Adlogistic, Adserv, Adtech). Esto habilita testear flujo de UI e inventario al 100% *sin requerir configurar Firebase*.

### 1. Variables de Entorno `.env.local`
Genera las instancias base de Firebase en [Firebase Console](https://console.firebase.google.com/) para montar la infraestructura DB/Auth en cloud.

```ini
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxx:web:xxx

CLIMATIQ_API_KEY=tu-api-key-climatiq
```

### 2. Comandos de desarrollo

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev
```
Dirígete a `http://localhost:3000`

### 3. Deploy a Vercel

Dada la arquitectura backend en Next.js API Routes, esta app es serverless y exportable con "1 clic":

1. Instala el CLI de Vercel (si no lo posees): `npm i -g vercel`
2. Ejecuta `vercel inside` y vincula.
3. Configura las environment variables en la plataforma y realiza Deploy.

## 🧠 Características Relevantes para Auditoría ISO

*   **Sin Errores de Redondeo**: Cálculo con `parseFloat` controlado (con `Math.js` o JS puro acotado). Mostrado con precisión de 2 decimales para UI, y 4 decimales nivel base de datos.
*   **Traceability**: Cada `DatoActividad` contiene internamente `trazabilidad.formula` (ej. `45000 × 2.68 × 1 / 1000 = 120.6 tCO₂e`) detallando factor y gwp utilizado en el momento preciso de la captura de datos (Evita que actualizaciones futuras que cambien el factor, modifiquen los reportes pasados ya validados).
*   **Asignación Inteligente de Sellos**: Según cálculo de porcentaje de reducción vs línea base (Metas). (Cuantificación (0%+), Reducción (>20%), Excelencia (>50%), Neutralización (100%)).
