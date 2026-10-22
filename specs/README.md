# Specs · desarrollo guiado por especificaciones (SDD)

Cada funcionalidad nueva se escribe primero como spec y después se programa. Así lo que se construye es lo que se acordó, y cualquier persona (o agente) puede retomar el trabajo leyendo tres archivos.

## Flujo

| Paso | Archivo | Qué contiene | Skill de Claude Code |
| ---- | ------- | ------------ | -------------------- |
| 1. Requisitos | `requirements.md` | Historias de usuario y criterios de aceptación en formato EARS | `/spec` |
| 2. Diseño | `design.md` | Arquitectura, componentes, datos, errores y pruebas | `/design` |
| 3. Plan | `tasks.md` | Lista de tareas de código con casillas, cada una ligada a requisitos | `/plan` |
| 4. Implementación | código | Una tarea a la vez; se marca la casilla al terminar | `/implement` |

Cada paso se aprueba antes de pasar al siguiente. Si en el diseño aparece un hueco, se regresa a los requisitos.

## Estructura

```
specs/
├── README.md              ← este archivo
├── _plantillas/           ← copia estas tres para empezar una spec
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
└── <nombre-de-la-funcionalidad>/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

Nombra la carpeta en minúsculas con guiones, por ejemplo `registro-de-viajeros` o `carrusel-portada`.

## Formato EARS (requisitos)

- **Evento:** CUANDO [evento] ENTONCES [el sistema] DEBERÁ [respuesta]
- **Condición:** SI [precondición] ENTONCES [el sistema] DEBERÁ [respuesta]
- **Combinado:** CUANDO [evento] Y [condición] ENTONCES [el sistema] DEBERÁ [respuesta]
- **Siempre:** [El sistema] DEBERÁ [respuesta]

Numera los criterios (1.1, 1.2…) para que las tareas del plan los puedan citar.

## Reglas del proyecto que toda spec respeta

Ver [`CLAUDE.md`](../CLAUDE.md): Astro estático con islas de React solo para interacción, contenido en español de México, fotos siempre por `Photo.astro`, estilo editorial, hora del centro de México y `npm run check` + `npm run build` antes de cerrar una tarea.

## Specs

| Spec | Estado |
| ---- | ------ |
| [redes-sociales](redes-sociales/requirements.md) | Implementada (falta ID de Behold para Instagram) |
| _(siguiente candidata: fase 2, registro de viajeros)_ | |
