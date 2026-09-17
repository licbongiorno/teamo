# Seguridad de este sitio

Notas rápidas sobre cómo está protegido el sitio hoy y qué se podría subir de nivel si hace falta.

## 1. Portón de acceso (usuario + contraseña) — activo

Todas las páginas (`index.html`, `juegos.html`, `categorias/*.html`, etc.) muestran un portón a
pantalla completa antes de dejar ver nada: elegís **Carito** o **Nico** e ingresás la contraseña
**777**. Lo implementa `js/auth-gate.js` + `css/auth-gate.css`.

**Esto es un candado del lado del cliente, no seguridad real.** Cualquiera que abra "ver código
fuente" en el navegador puede leer la contraseña ahí mismo. Sirve para frenar a alguien que llega
al link por curiosidad (familia, un link reenviado sin querer), no a alguien decidido a entrarigual.

Hay un botón flotante abajo a la izquierda ("Carito 💖 · salir" / "Nico 💙 · salir") para cerrar
sesión en ese dispositivo y volver a pedir usuario/contraseña.

## 2. Reglas de Firestore — preparadas, falta aplicarlas

`firestore.rules` (en la raíz del repo) exige que quien lea o escriba esté autenticado
(`request.auth != null`), aprovechando que la web ya hace login anónimo automático apenas carga
(`js/firebase.js` / `js/index-firebase.js`). Antes las reglas estaban abiertas (`if true`):
cualquiera con la URL del *proyecto de Firebase* (no de la web) podía leer o escribir los datos
sin pasar por el portón de la web.

**Esto protege los datos de verdad**, incluso si alguien se salta la interfaz de la web y le habla
directo a la API de Firestore — a diferencia del portón (punto 1), que sólo protege la pantalla.

Para aplicarlas (no se puede desde este entorno, hace falta la consola del proyecto real):
1. https://console.firebase.google.com → proyecto `carolina-634a1`
2. Firestore Database → pestaña "Reglas"
3. Pegar el contenido de `firestore.rules` y publicar

## 3. Contraseña real por persona (opcional, no activado)

Si en algún momento "777 compartida" deja de alcanzar, `js/auth-gate-firebase.js` es una versión
alternativa del portón que valida contra **Firebase Authentication**: cada persona tendría su
propia contraseña, y esa contraseña nunca estaría escrita en el código del sitio (vive del lado de
Firebase). No está activada por defecto porque requiere trabajo manual en la consola de Firebase
que no se puede hacer desde acá (crear las dos cuentas). Los pasos exactos están comentados arriba
del archivo `js/auth-gate-firebase.js`.

No se probó contra un proyecto de Firebase real — conviene probarlo bien (con las dos cuentas ya
creadas) antes de reemplazar `js/auth-gate.js` en producción.
