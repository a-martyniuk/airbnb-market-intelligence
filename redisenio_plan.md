# Plan de Rediseño: Revenue Management Decision Center (Stripe/Linear Style)

Este plan detalla el rediseño integral de la experiencia de usuario (UX) e interfaz (UI) de **AirMarket AI** para convertirlo en un asistente de Revenue Management comercial de nivel enterprise.

---

## 🎨 Filosofía de Diseño y Estética B2B

Siguiendo las pautas de diseño de **Stripe, Linear y Vercel**, el sistema se basará en la toma de decisiones y la reducción de la carga cognitiva:

*   **Paleta de Color Curada (SaaS Premium):**
    *   Fondo base: `#050609` (Warm Dark Charcoal).
    *   Bordes de cartas: `rgba(255, 255, 255, 0.05)` (delgados, sin sombras fuertes).
    *   Acento Primario: `#ffffff` (Texto de alto contraste).
    *   Acento Secundario/Oro: `#e2b83d` (Gold Champagne discreto para destacar).
    *   Colores funcionales: Ocupación/Óptimo (`#10b981` Emerald), Alerta/Caro (`#ef4444` Coral), Demanda/Aumento (`#3b82f6` Blue).
*   **Minimalismo y Espaciado:** Mayor uso de *spacing*, fuentes de tamaño generoso (`font-family: 'Inter', sans-serif` para lectura y `'Outfit'` para encabezados), y sutiles efectos glassmorphism.
*   **Jerarquía de Información:**
    1.  **Decisiones:** Qué hacer hoy (Executive Summary).
    2.  **Métricas Clave:** 5 grandes KPIs analíticos de control.
    3.  **Visualizaciones:** Calendarios de calor y simuladores estratégicos.
    4.  **Competidores y Alertas:** Fichas y feed cronológico de eventos.

---

## ⚙️ Estructura del Menú y Vistas Rediseñadas

Reemplazaremos las pestañas actuales por una estructura de 8 secciones modulares bien delimitadas:

```
[MENÚ LATERAL]
 ├── 🏠 Decision Center (Dashboard)  <-- Resumen ejecutivo, 5 KPIs, Simulator
 ├── 🏷️ Pricing Intelligence         <-- Precios base, óptimo, premium con justificación
 ├── 👥 Competidores Afines           <-- 15 Tarjetas inteligentes con scores detallados
 ├── 📅 Calendario Tarifario         <-- Calendario de colores de demanda y tarifas sugeridas
 ├── 📈 Forecast & Escenarios        <-- Escenarios de ingresos (Conservador/Agresivo/Balanceado)
 ├── ⏳ Análisis Histórico            <-- Comparativa de evolución de mercado y precios
 ├── 🔔 Feed de Alertas               <-- Historial de alertas cronológicas del mercado
 └── ⚙️ Configuración (Sistema)      <-- Ajustes del modelo, URL de propiedad
```

---

## 🛠️ Cambios Propuestos

### 1. Sistema de Estilos SaaS Premium
#### [MODIFY] [globals.css](file:///d:/Projects/airbnb-market-intelligence/frontend/src/app/globals.css)
*   Actualizar los tokens de CSS variables (`--bg-primary`, `--card-bg`, etc.) para usar paletas neutras ultra-oscuras con acentos Emerald, Coral y Gold sutiles.
*   Añadir estilos para botones minimalistas de Vercel (bordes grises finos, efecto hover de iluminación blanca).
*   Implementar clases para transiciones fluidas de pestañas y animaciones suaves en los skeletons de carga.

### 2. Dashboard, Vistas e IA Analista
#### [MODIFY] [page.js](file:///d:/Projects/airbnb-market-intelligence/frontend/src/app/page.js)
*   **Sección Dashboard (Home):**
    *   Añadir la sección **Market Analyst** en la parte superior: un banner destacado con el resumen narrativo inteligente autogenerado de la IA sobre qué configurar hoy.
    *   Renderizar exclusivamente 5 grandes indicadores en formato carta minimalista: *Precio Recomendado*, *Ingreso Proyectado*, *Ocupación Esperada*, *Market Score* y *Alertas Activas*.
    *   Integrar en esta pantalla el **Simulador Interactiva de Estrategia ("What-If")** con sliders en tiempo real.
*   **Sección Pricing:**
    *   Mostrar una tarjeta grande comparando tu *Precio Actual* vs *Precio Recomendado*.
    *   Crear una grilla explicativa para los niveles de precio: *Minimum Competitive*, *Optimal Revenue*, *Premium*, e *Aggressive*, detallando el cálculo matemático detrás de cada uno.
*   **Sección Competidores:**
    *   Eliminar la tabla de datos y renderizar tarjetas inteligentes limitadas a los 15 más relevantes.
    *   Cada tarjeta incluirá: *Similarity Score*, *Precio*, *Rating*, *Superhost*, *Distancia*, *RevPAR estimado*, *Diferencias físicas* (ej. "Tiene balcón, te falta piscina") y *Ocupación estimada*.
*   **Sección Calendario:**
    *   Renderizar la grilla de días pintada según la estrategia tarifaria sugerida: Rojo (Demasiado caro), Azul (Alta demanda), Verde (Precio óptimo), Amarillo (Promoción recomendada).
*   **Sección Forecast:**
    *   Mostrar una grilla interactiva con los 3 escenarios: *Conservador*, *Balanceado* y *Agresivo*, detallando el ingreso estimado a 7, 30, 90 y 365 días.
*   **Sección Históricos:**
    *   Agregar un selector de fechas de snapshots históricos que muestre gráficos comparativos de evolución de precio recomendado, RevPAR y posición de ranking.
*   **Sección Alertas:**
    *   Crear un feed vertical cronológico con iconos y colores de prioridad para las fluctuaciones de mercado (ej. "Competidor principal bajó precios", "Superhost detectado").

---

## 🔍 Plan de Verificación y Compilación

### Pruebas de Compilación
*   Ejecutar `npm run build` en la carpeta `frontend` para certificar que no existen fallas de sintaxis de JSX ni problemas con referencias del ciclo de vida de React.

### Validación Visual
*   Inspeccionar el comportamiento responsive y verificar que en dispositivos móviles las recomendaciones y decisiones clave se priorizan verticalmente eliminando columnas innecesarias.
