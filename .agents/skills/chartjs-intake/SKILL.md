---
description: 'Structured intake flow for @chartjs-expert. Use before creating a complex chart to define type, dataset, plugins, and framework context.'
argument-hint: "Briefly describe the chart needed (e.g. 'time-series line chart for chamber pressure with zoom')"
mode: agent
---

# Chart.js Intake Flow

Act as `@chartjs-expert`. Before generating implementation code, gather the following structured requirements context.

## Initial Request

${input:Describe the chart you need}

---

## Requirements Intake

Answer the following points. If already covered in the initial prompt, confirm or adjust:

### 1. Chart Type

- [ ] `bar` | `line` | `pie` | `doughnut` | `scatter` | `bubble` | `radar` | `polarArea`
- [ ] Mixed (specify combined types)

### 2. Dataset Profile

- **Estimated data points**: < 100 / 100–10,000 / > 10,000 / real-time streaming
- **Data shape**: e.g. `{ x: Date, y: number, label: string }`
- **Time scale**: Temporal x-axis (`x: Date | ISO string`)? Yes / No

### 3. Interactivity & Plugins

- [ ] Zoom / pan (`chartjs-plugin-zoom`)
- [ ] Custom tooltips
- [ ] Point click event dispatch
- [ ] Reference threshold lines (`chartjs-plugin-annotation`)
- [ ] Inline value labels (`chartjs-plugin-datalabels`)
- [ ] None

### 4. Framework Context

- [ ] Vanilla HTML/JS Canvas
- [ ] Angular (`ng2-charts` / standalone canvas with `@ViewChild` / Signal component)
- [ ] Other

### 5. Known Constraints

Bundle budget, performance decimation thresholds, or WCAG color contrast requirements.

---

Once specified, output the complete configuration:

- Tree-shaken imports (`Chart.register(...)`)
- Strictly-typed `ChartConfiguration<T>`
- Configured plugins and date adapters
- Component integration snippet
