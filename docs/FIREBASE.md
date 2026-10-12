# Configurar Firebase para WorkIt

Guía para preparar el proyecto de Firebase antes de la Fase 2. Los nombres de los menús pueden variar un poco según el idioma de la consola.

## 1. Crear el proyecto

1. Entra en <https://console.firebase.google.com> con tu cuenta de Google.
2. Crea un proyecto nuevo y llámalo **WorkIt**. El ID del proyecto (por ejemplo `workit-a1b2c`) **no se puede cambiar después**.
3. Gemini en Firebase: opcional.
4. Google Analytics: **desactívalo por ahora**. Se puede activar más tarde y la app todavía no lo usa.

## 2. Registrar la app web

1. En la página principal del proyecto, pulsa el icono web **`</>`**.
2. Apodo: `WorkIt Web`. **No** marques Firebase Hosting todavía.
3. Copia los valores del objeto `firebaseConfig` que aparece.
   Si cierras la ventana, los encontrarás en ⚙️ **Configuración del proyecto → General → Tus apps → Configuración del SDK**.

## 3. Crear `.env.local`

En la raíz del proyecto (junto a `package.json`), copia `.env.example` como `.env.local` y rellena los campos:

| Campo de `firebaseConfig` | Variable |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

Si `measurementId` aparece, no hace falta copiarlo.

- Sin comillas ni espacios: `VITE_FIREBASE_PROJECT_ID=workit-a1b2c`
- `.env.local` está en `.gitignore` y no se subirá al repositorio.
- Estos valores **no son secretos**: forman parte de cualquier app web de Firebase. Los datos los protegen las Security Rules.
- **Reinicia `npm run dev`** después de editar el archivo: Vite solo lee las variables al arrancar.

## 4. Authentication

1. Menú **Compilación → Authentication → Comenzar**.
2. Pestaña **Método de inicio de sesión**:
   - **Correo electrónico/contraseña** → Habilitar (solo el primer interruptor; el *vínculo de correo* no) → Guardar.
   - **Google** → Habilitar → nombre público `WorkIt` y tu correo de asistencia → Guardar.
3. Pestaña **Configuración → Dominios autorizados**: `localhost` ya viene incluido. Cuando publiques la app, añade aquí su dominio.

## 5. Cloud Firestore

1. Menú **Compilación → Firestore Database → Crear base de datos**.
2. Si te pregunta la edición, elige **Standard**.
3. **Ubicación: es permanente.** Elige la más cercana a tus usuarios. Por ejemplo, `southamerica-east1` (São Paulo) para Latinoamérica, `europe-southwest1` (Madrid) para España o `nam5` para Norteamérica.
4. Elige **modo de producción** (todo bloqueado). **No** uses el modo de prueba: deja la base de datos abierta a cualquiera durante 30 días. En la Fase 2 se publicarán reglas para que cada usuario acceda solo a sus datos.

## 6. Cloud Storage: todavía no

Desde el 3 de febrero de 2026, **Cloud Storage solo funciona con el plan Blaze** (pago por uso), incluso el bucket por defecto. Blaze mantiene una cuota gratuita, pero exige una tarjeta asociada.

Storage solo se necesita en la Fase 3, para las fotos de los ejercicios personalizados. Entonces decidiremos entre:

- pasar a Blaze con una **alerta de presupuesto** (por ejemplo, 1 US$), o
- lanzar los ejercicios personalizados sin foto al principio.

Las fases 2 y 4 a 6 funcionan con el plan gratuito (Spark).

## 7. Firebase CLI y reglas de seguridad

```bash
npm install -g firebase-tools
firebase login
```

Las reglas están en `firestore.rules`. Para cambiarlas:

1. `npm run test:rules`: las prueba en el emulador (necesita **Java 21**, por ejemplo [Temurin](https://adoptium.net/)).
2. `npm run deploy:rules`: las publica en tu proyecto.

Más detalle en el README, sección «Seguridad».

## 8. Comprobación

- [ ] `.env.local` tiene las 6 variables rellenadas.
- [ ] Authentication: correo/contraseña y Google habilitados.
- [ ] Firestore creado en modo de producción (anota la región).
- [ ] `firebase login` hecho.

Estado del proyecto WorkIt: todo lo anterior está configurado y las reglas están publicadas (Fase 2).

Referencias: [Añadir Firebase a una app web](https://firebase.google.com/docs/web/setup) · [Cambios de Cloud Storage (FAQ)](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024?hl=es)
