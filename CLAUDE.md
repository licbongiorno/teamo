# Nuestro Refugio / Nuestros Juegos

Web privada para **dos personas** (Carito y Nico), usada sobre todo desde el celular.
HTML + CSS + JavaScript sin frameworks, Firebase (Firestore + login anónimo), hosting en Firebase.
Juegos en `js/juegos/*.js`. Textos en español rioplatense. Nada de SEO, escalabilidad ni
"muchos usuarios".

## Ahorro de tokens: repartir el trabajo por modelo

La sesión principal corre en **Sonnet** (`.claude/settings.json`). Delegá con la herramienta
Agent según el tipo de pedido, y no hagas vos mismo lo que puede hacer un ayudante más barato:

| Pedido | Ayudante | Modelo |
|---|---|---|
| Cambio chico y claro en 1–2 archivos (texto, color, contraseña, botón, ícono) | `rapido` | Haiku |
| Probar un juego o pantalla, auditar diseño/accesibilidad/velocidad, bug de un solo juego | `tester` | Sonnet |
| Bug que no se entiende, juegos en vivo desincronizados, Firestore/reglas, juego nuevo complejo, cambios en muchos archivos | `experto` | Opus |

Reglas:
- Ante la duda, empezá por el más barato y subí solo si ese ayudante avisa que no alcanza.
- Una pregunta que se responde leyendo uno o dos archivos se contesta directo, sin ayudante.
- Pasale al ayudante todo lo que ya sabés (archivos, síntomas) para que no lo vuelva a buscar.
- No uses `experto` para revisar el trabajo de los otros salvo que algo haya salido mal.

## Convenciones
- Si cambiás un .js/.css que se carga con `?v=N`, subí ese número en el HTML.
- El portón de acceso está en `js/auth-gate.js` (ver `SEGURIDAD.md`).
