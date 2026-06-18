# 📖 Dominio y Glosario (Ubiquitous Language)

Para garantizar un código mantenible y evitar divergencias en la nomenclatura, todo el equipo (y la IA) debe utilizar **estrictamente** los siguientes términos para nombrar variables, clases, componentes y APIs en INTAQALAB.

## 1. Glosario de Entidades (Inglés/Español)

| Término (Código)       | Concepto Negocio (ES) | Definición                                                                   |
| ---------------------- | --------------------- | ---------------------------------------------------------------------------- |
| **Fire Trial**         | Ensayo de fuego       | La entidad principal del sistema (Trial).                                    |
| **Serie**              | Serie                 | Agrupación ordenada de disparos dentro de un ensayo.                         |
| **Shot**               | Disparo               | Disparo individual dentro de una serie.                                      |
| **Specimen**           | Espécimen / Probeta   | Objeto o probeta utilizada como objetivo/blanco en un ensayo.                |
| **Armament**           | Armamento             | Arma o cañón utilizado para ejecutar los disparos.                           |
| **Munition**           | Munición              | Munición configurada con parámetros específicos (calibre, temperatura, etc). |
| **Shooting Condition** | Condición de tiro     | Tipo de blanco, material, dimensiones, espesor y zona de impacto.            |
| **Master Data**        | Datos Maestros        | Catálogos de referencia (Tipos de ensayo, tipos de blanco, dimensiones...).  |

## 2. Modelo de Relaciones (Entity Diagram)

El ciclo vital de la planificación de un ensayo relaciona estas entidades del siguiente modo:

```mermaid
erDiagram
    FIRE_TRIAL ||--o{ SERIE : contains
    FIRE_TRIAL ||--o{ DOCUMENT : has
    FIRE_TRIAL ||--o{ SHOOTING_CONDITION : defines
    FIRE_TRIAL }o--|| TRIAL_TYPE : classifiedAs
    FIRE_TRIAL }o--o{ SPECIMEN : uses
    FIRE_TRIAL }o--o{ CLIENT : requestedBy

    SERIE ||--o{ SHOT : contains
    SERIE {
        string id
        string name
        int executionOrder
    }
```

## 3. Flujo de un Ensayo de Fuego

```mermaid
stateDiagram-v2
    [*] --> Creación: Nuevo ensayo
    Creación --> Planificación: Datos básicos completados

    state Planificación {
        [*] --> DatosGenerales
        DatosGenerales --> Series: Configurar series
        Series --> Disparos: Añadir disparos a serie
        DatosGenerales --> CondicionesTiro: Configurar condiciones
        DatosGenerales --> Armamento: Configurar armamento
        DatosGenerales --> Municiones: Configurar municiones
        DatosGenerales --> Especímenes: Asignar especímenes
    }

    Planificación --> Calendarización: Programar fecha
    Calendarización --> Documentación: Adjuntar documentos
    Documentación --> Ejecución: Ensayo preparado
    Ejecución --> [*]: Ensayo completado
```
