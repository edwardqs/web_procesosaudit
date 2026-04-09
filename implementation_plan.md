# Plan de Implementación: Programa de Excelencia (Evaluación)

El objetivo es desarrollar el módulo de **Programa de Excelencia**, en el cual los usuarios realizarán una autoevaluación simulando un formulario tipo 'Google Forms'. Las preguntas son configuradas por el administrador, son de tipo cerrado (SI / NO) y sus puntajes se limitan a 0, 1 y 3.

## User Review Required

> [!CAUTION]
> Requiero tu validación sobre los siguientes puntos antes de empezar a programar:
> 1. **¿El usuario puede realizar esta evaluación más de una vez?** (ej. una vez por mes, por campaña) o ¿Al resolverla se bloquea permanentemente mostrando la calificación final?
> 2. Cuando mencionas que los puntajes son 0, 1 y 3: **¿El administrador, al crear la pregunta, decide qué puntaje representa un "SÍ"?** Por ejemplo: "¿Cumples tal norma?" -> Sí suma 3, No suma 0. 

## Proposed Changes

---

### Phase 1: Base de Datos & Prisma (Backend)
Se añadirán 3 modelos clave para soportar el formulario y guardar el historial:

#### [MODIFY] D:\01_PROCESOS\Proyecto_process_audit\Pauser-Backend\prisma\schema.prisma
- Se agregarán los modelos:
  - `Question`: Contendrá `text`, `scoreYes` (evaluado en 0, 1 o 3), `scoreNo` (generalmente 0), `createdAt`.
  - `Evaluation`: Guardará la participación del usuario (`userId`, `totalScore`, `completedAt`).
  - `Answer`: Enlazará la respuesta explícita del usuario (`evaluationId`, `questionId`, `response`="SI"|"NO", `awardedScore`).

#### [NEW] Backend Endpoints (Express)
- `GET/POST/PUT/DELETE /api/questions`: Rutas protegidas (sólo Admin) para CRUD de preguntas.
- `POST /api/evaluations/submit`: Punto de entrada para que el usuario guarde y procese sus respuestas y devuelva el puntaje final.
- `GET /api/evaluations/results`: Panel que devolverá las notas de todos para el Admin.

---

### Phase 2: Interfaz de Administrador (Preguntas y Resultados)
Vista del Administrador en el panel del Programa de Excelencia.

#### [NEW] D:\01_PROCESOS\Proyecto_process_audit\Pauser-Frontend\Pauser-Frontend\src\pages\ExcelenciaAdmin.tsx
- **Tab 1: Gestión de Preguntas:** Un listado estilo tabla o tarjetas. Botón para crear una "Nueva Pregunta" desplegando un modal donde el admin tipea la pregunta y selecciona cuánto vale un SÍ (0, 1 o 3).
- **Tab 2: Ranking/Resultados:** Tabla conectada buscando a los usuarios con la mayor cantidad de puntos en las evaluaciones consolidadas.

---

### Phase 3: Interfaz de Formulario para Usuarios Integrantes
Es la vista orientada al usuario normal que entra la tarjeta de excelencia.

#### [NEW] D:\01_PROCESOS\Proyecto_process_audit\Pauser-Frontend\Pauser-Frontend\src\pages\ExcelenciaUser.tsx
- Al entrar validará si ya rindió su examen. Si ya lo dio, sólo verá un gran puntaje `X Puntos Acumulados`.
- Si no lo ha dado, renderizará las preguntas de forma limpia en tarjetas verticales numeradas (estilo Google Forms).
- Cada pregunta tendrá 2 Radio Buttons: **SÍ** y **NO**.
- Al presionar el botón "Enviar mi evaluación", empaqueta todo mediante un submit al endpoint seguro, mostrando animación de carga y finalizando con un Modal festivo mostrando sus resultados.

#### [MODIFY] Rutas Principales
- Se agregará la ruta general `/excelencia` en `App.tsx` que automáticamente discriminará qué mostrar (`ExcelenciaAdmin` o `ExcelenciaUser`) según el rol del usuario conectado.

## Verificación Plan
### Automated Tests / Manual Verification
- **Back-end:** Correr script Prisma `npx prisma db push` y probar a levantar el server (`npm run dev`).
- **Front-end:**
  1. *Ciclo Admin:* Iniciar como Admin, crear 2 preguntas (una de 1 punto y otra de 3) y comprobar persistencia.
  2. *Ciclo Usuario:* Entrar con otra cuenta a "Programa de Excelencia", simular un usuario completando el cuestionario logrando 4 puntos en total.
  3. Revisar resultados reflejados en el rol admin.
