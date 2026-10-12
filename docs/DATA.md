# Modelo de datos (Cloud Firestore)

Región: `southamerica-east1` (edición Standard). Las reglas viven en [`firestore.rules`](../firestore.rules) y sus pruebas en [`tests/rules/`](../tests/rules).

Todos los datos privados cuelgan de `users/{uid}`. Así, aislar a cada usuario se reduce a una sola condición (`request.auth.uid == uid`) y borrar una cuenta equivale a borrar su rama.

## Implementado (Fase 2)

### `users/{uid}`: perfil

| Campo | Tipo | Valores | Notas |
|---|---|---|---|
| `displayName` | string | ≤ 40 caracteres | Puede estar vacío. Las cuentas de Google lo traen relleno. |
| `goal` | string \| null | `muscle`, `strength`, `fat_loss`, `maintenance` | Opcional |
| `level` | string \| null | `beginner`, `intermediate`, `advanced` | Opcional |
| `trainingDays` | int[] | 1–7 (ISO: 1 = lunes), sin repetir | Se guarda ordenado |
| `equipment` | string[] | `full_gym`, `dumbbells`, `barbell`, `machines`, `cables`, `kettlebells`, `bands`, `bodyweight` | Sin repetir |
| `weightUnit` | string | `kg`, `lb` | Por defecto `kg` |
| `onboardingStatus` | string | `pending`, `completed`, `skipped` | `pending` muestra la pantalla de bienvenida |
| `createdAt` | timestamp | Hora del servidor | Inmutable |
| `updatedAt` | timestamp | Hora del servidor | Obligatorio en cada escritura |
| `schemaVersion` | int | `1` | Para futuras migraciones |

- Los valores se guardan como códigos neutros; las etiquetas en español están en `src/features/profile/profileOptions.ts`.
- El perfil se crea con una transacción en el primer inicio de sesión, segura aunque haya dos pestañas abiertas.
- No se piden datos físicos.
- La contraseña nunca pasa por Firestore: la gestiona Firebase Authentication.

## Previsto (cada fase añade sus reglas validadas)

Hasta entonces, estas rutas están **cerradas** en las reglas, incluso para su dueño.

| Ruta | Fase | Contenido |
|---|---|---|
| `users/{uid}/customExercises/{id}` | 3 | Ejercicios propios y la ruta de su imagen en Storage |
| `users/{uid}/routines/{id}` | 4 | Nombre, días, lista ordenada de ejercicios con series, repeticiones, peso inicial y descanso |
| `users/{uid}/workouts/{id}` | 5 | Fecha local, inicio y fin, estado, ejercicios y series (peso, reps, calentamiento, completada) |
| `users/{uid}/achievements/{id}` | 6 | Logros y fecha de obtención |
| `exercises/{id}` | 3 | Catálogo global, de solo lectura para el cliente, si la licencia del proveedor permite almacenarlo |

Criterios para las siguientes fases:

- **Fechas de entrenamiento:** se guarda la fecha *local* del usuario (`YYYY-MM-DD`) junto al instante UTC, para que las rachas no cambien de día por la zona horaria.
- **Rachas:** se derivan de los días únicos con sesiones completadas. Un valor precalculado se podrá reconciliar siempre con el historial.
- **Ejercicios externos:** se conserva el identificador del proveedor (`provider` + `providerId`) y se usa un modelo interno uniforme.
- **Tamaño de los documentos:** las sesiones guardan sus series en el propio documento (una sesión tiene decenas de series, muy lejos del límite de 1 MiB). El historial completo **no** se guarda en un único documento.
