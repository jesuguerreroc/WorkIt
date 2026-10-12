# WorkIt — Sistema de diseño

Fuente única de las decisiones visuales. Los tokens viven en `src/styles/index.css` (`@theme`) y los componentes usan siempre utilidades semánticas (`bg-surface`, `text-muted`, `bg-primary`…), nunca hex sueltos.

## Origen de las decisiones

Se consultó el skill `ui-ux-pro-max` (`--design-system "fitness gym workout tracker dark sporty"`):

| Recomendación del skill | Adoptada | Motivo |
|---|---|---|
| Patrón *Feature-Rich Showcase* (hero → funciones → beneficios → CTA repetido) | Sí, sin prueba social | El brief prohíbe testimonios o cifras inventadas |
| Tipografía Barlow Condensed / Barlow ("sports, fitness, gyms") | Sí | Autoalojada con `@fontsource` para que la PWA no dependa de Google Fonts |
| Paleta naranja + verde | No | El brief pide lima sobre casi negro; la base de datos del skill no tenía paleta lima, así que se definió a mano conservando su estructura de tokens (primary / on-primary / card / muted / ring) |
| Movimiento sutil, 150–300 ms, `prefers-reduced-motion` | Sí | Sin GSAP: una sola animación CSS de entrada en el hero |
| Evitar emojis como iconos; Lucide | Sí | |

## Color

| Token | Valor | Uso |
|---|---|---|
| `canvas` | `#0A0B0D` | Fondo de página |
| `surface` / `surface-2` / `surface-3` | `#121418` / `#1A1D23` / `#23272E` | Paneles, tarjetas, campos internos |
| `border` / `border-strong` | `#2A2F37` / `#3A404A` | Separadores decorativos |
| `control` | `#636B78` | Contorno de inputs (≥3:1, criterio de componentes no textuales) |
| `fg` / `muted` / `subtle` | `#F3F4F6` / `#A3AAB5` / `#868D99` | Texto principal / secundario / terciario |
| `primary` | `#C5F035` | Acciones principales, progreso, estado activo |
| `on-primary` | `#0A0B0D` | Texto sobre lima |
| `danger` / `warning` | `#F87171` / `#FBBF24` | Errores / avisos |

Contrastes medidos (WCAG 2.x):

| Par | Ratio |
|---|---|
| `fg` sobre `canvas` / `surface-2` | 17.9 / 15.3 |
| `muted` sobre `canvas` / `surface-2` | 8.4 / 7.2 |
| `subtle` sobre `canvas` / `surface-2` | 5.9 / 5.1 |
| `primary` sobre `canvas` · `on-primary` sobre `primary` | 14.9 |
| `danger` sobre `surface-2` | 6.1 |
| `control` sobre `surface` | 3.4 |

Todo el texto supera 4.5:1. El anillo de foco es lima de 2 px; sobre superficies lima se cambia a `outline-on-primary`.

## Tipografía

- **Barlow Condensed 600/700, mayúsculas**: titulares, cifras grandes (racha, cronómetro).
- **Barlow 400–700**: texto y UI. Base 16 px; los inputs usan 16 px para evitar el zoom de iOS.
- Cifras con `tabular-nums` cuando cambian (pesos, tiempos).

## Interacción y accesibilidad

- Objetivos táctiles ≥44 px (`min-h-11`); botones grandes de 52 px (`min-h-13`).
- Formularios: etiqueta visible, ayuda bajo el campo, error en línea con `aria-describedby`, resumen enlazado y enfocado si hay más de un error tras enviar; si hay uno, se enfoca el campo.
- Se permiten el pegado y los gestores de contraseñas (`autocomplete` correcto).
- Navegación de la app: barra lateral desde `lg`, barra inferior de 5 destinos en móvil con `safe-area-inset-bottom`.

## Mockups de la landing

Son componentes React con los mismos tokens que la app (`src/features/landing/mockups`). Se exponen como una sola imagen (`role="img"` + descripción), no son interactivos y llevan siempre la etiqueta **«Ejemplo»**, para que los datos ilustrativos nunca se lean como resultados reales.
