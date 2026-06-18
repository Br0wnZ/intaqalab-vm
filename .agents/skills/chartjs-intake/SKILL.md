---
description: "Intake estructurado para @chartjs-expert. Úsalo antes de crear un chart complejo para definir tipo, datos, plugins y contexto de framework."
argument-hint: "Describe brevemente el chart que necesitas (ej: 'line chart de temperatura en el tiempo con zoom')"
mode: agent
---

Actúa como `@chartjs-expert`. Antes de generar cualquier código, necesito el siguiente contexto estructurado.

## Solicitud inicial

${input:Describe el chart que necesitas}

---

## Intake de Requisitos

Responde estas preguntas. Si la solicitud inicial ya cubre alguna, confirma el valor o ajusta.

### 1. Tipo de chart
¿Qué tipo(s) de chart necesitas?
- [ ] `bar` | `line` | `pie` | `doughnut` | `scatter` | `bubble` | `radar` | `polarArea`
- [ ] Mixed (combina tipos — indica cuáles)

### 2. Datos
- **Volumen estimado de puntos**: < 100 / 100–10 000 / > 10 000 / streaming en tiempo real
- **Esquema de datos**: ¿Cuál es la forma del dato? Ej: `{ x: Date, y: number, label: string }`
- **Ejes de tiempo**: ¿Datos tienen eje temporal (`x: Date | ISO string`)? Sí / No

### 3. Interactividad
- [ ] Zoom / pan
- [ ] Tooltips personalizados
- [ ] Click en punto → acción
- [ ] Líneas de referencia (annotation)
- [ ] Etiquetas inline sobre barras/puntos (datalabels)
- [ ] Ninguna

### 4. Framework
- [ ] Vanilla HTML/JS
- [ ] Angular (`ng2-charts` / `BaseChartDirective`)
- [ ] React
- [ ] Otro: ___

### 5. Restricciones conocidas
¿Hay librerías ya instaladas, restricciones de bundle, o constraints de accesibilidad que deba respetar?

---

Con estas respuestas, genera la configuración completa con:
- Imports tree-shaken (`Chart.register(...)`)
- `ChartConfiguration<T>` tipado
- Plugins recomendados con justificación
- Adapter de fecha si aplica
- Snippet de integración para el framework indicado
