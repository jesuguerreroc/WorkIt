# WorkIt

Aplicación web (PWA) para organizar rutinas de gimnasio, registrar series y seguir el progreso y las rachas de entrenamiento.

**Estado: MVP completo (fases 1–7).** Landing, cuentas (correo y Google), perfil, biblioteca de ejercicios, ejercicios propios, rutinas, entrenamiento en vivo con temporizador de descanso (±15 s), rachas, historial, progreso con gráficos, logros y PWA instalable.

## Requisitos

- Node.js 20.19+ (desarrollado con Node 24) y npm 10+
- Un proyecto de Firebase configurado (guía: [`docs/FIREBASE.md`](docs/FIREBASE.md))
- Solo para probar las reglas o usar emuladores: [Firebase CLI](https://firebase.google.com/docs/cli) (`npm i -g firebase-tools`) y **Java 21**

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y rellena las variables de Firebase
npm run dev                  # http://localhost:5173
```

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprobación de tipos y build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run typecheck` | Solo TypeScript |
| `npm run lint` | oxlint |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:rules` | Pruebas de las Security Rules en el emulador de Firestore (Java 21) |
| `npm run emulators` | Emuladores locales de Auth y Firestore |
| `npm run deploy:rules` | Publica `firestore.rules` en el proyecto de `.firebaserc` |

## Variables de entorno

Ver [`.env.example`](.env.example) y [`docs/FIREBASE.md`](docs/FIREBASE.md). Todas las variables `VITE_*` acaban en el bundle del navegador: solo puede ir configuración pública. La configuración web de Firebase no es un secreto; los datos los protegen las Security Rules. Nunca añadas claves privadas ni cuentas de servicio.

| Variable | Necesaria | Uso |
|---|---|---|
| `VITE_FIREBASE_*` (6) | Sí | Configuración de la app web de Firebase |
| `VITE_USE_FIREBASE_EMULATORS` | No | `true` conecta la app a los emuladores locales |
| `VITE_CONTACT_EMAIL` | No | Muestra un enlace de contacto en el pie |

## Seguridad: probar las reglas antes de publicarlas

1. Edita [`firestore.rules`](firestore.rules) y añade casos a [`tests/rules/firestore.rules.test.ts`](tests/rules/firestore.rules.test.ts).
2. `npm run test:rules`: arranca el emulador con un proyecto `demo-` (nunca toca datos reales) y ejecuta las pruebas.
3. Solo si todo pasa: `npm run deploy:rules`.

Las pruebas cubren el aislamiento entre usuarios, el acceso sin sesión, la validación de cada campo, la inmutabilidad de `createdAt`, la hora del servidor obligatoria y las colecciones todavía cerradas.

### Probar la app sin tocar el proyecto real

```bash
npm run emulators                                   # terminal 1 (UI en http://127.0.0.1:4000)
VITE_USE_FIREBASE_EMULATORS=true npm run dev        # terminal 2 (en PowerShell: $env:VITE_USE_FIREBASE_EMULATORS="true"; npm run dev)
```

Las cuentas y los datos creados así solo existen en tu máquina.

## Fuente de ejercicios

[Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (Unlicense, dominio público, uso comercial permitido), fijada a un commit y servida desde `public/data/exercises.json`; imágenes vía jsDelivr. Se descartó ExerciseDB porque su plan gratuito es **solo no comercial** y su límite de peticiones bloqueó las pruebas tras ~25 consultas (Cloudflare 1015). Nombres en español: traducciones revisadas en `src/features/exercises/nameTranslations.ts`; el resto muestra el nombre original.

## Estructura

```
src/
  app/                 router, guardas de rutas (RequireAuth, PublicOnly), errores
  components/ui/       Button, TextField, ChoiceGroup, Alert, Tilt, Reveal…
  components/layout/   PublicHeader, PublicFooter, AppShell
  features/auth/       pantallas, validación (+ tests), AuthProvider/useAuth, Google
  features/profile/    bienvenida, perfil, formulario y opciones
  features/dashboard/  panel
  features/landing/    secciones y mockups ilustrativos
  services/            authService, profileService (acceso a Firebase)
  lib/                 env, firebase (app + auth), firestore (lazy), fechas, utilidades
  types/               modelos de datos
tests/rules/           pruebas de Security Rules
firestore.rules        reglas de Firestore
docs/                  DESIGN.md · DATA.md · FIREBASE.md
```

## Hoja de ruta

1. ✅ Diseño y estructura
2. ✅ Autenticación y Firebase
3. ✅ Biblioteca de ejercicios (sin subida de fotos, por decisión de producto)
4. ✅ Rutinas (descanso entre series y entre ejercicios, en pasos de 15 s)
5. ✅ Entrenamiento en vivo (guardado en el dispositivo + Firestore, temporizador ±15 s)
6. ✅ Rachas, historial, progreso y logros
7. ✅ PWA (instalable, precaché, imágenes en caché, aviso de actualización)

Pendiente posible: caché persistente de Firestore para consultar el historial sin conexión, edición de sesiones ya completadas.
