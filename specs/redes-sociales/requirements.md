# Requisitos · Redes sociales en el sitio

## Introducción

Bebe, Vive, Viaja publica sus viajes en Instagram (@bebeviveviaja), Facebook (bebeviveviaja) y TikTok (@bebeviveviajamx). Queremos que quien visita el sitio vea ese contenido vivo y pueda seguir a la marca con un clic, sin que el sitio pierda velocidad ni su estilo editorial.

Cada red permite embeber cosas distintas con sus herramientas oficiales:

| Red | Qué se puede embeber gratis | Limitación |
| --- | --- | --- |
| TikTok | El perfil completo con sus videos recientes (embed oficial de creador) | Se actualiza solo; el diseño lo controla TikTok |
| Instagram | Publicaciones o reels sueltos, eligiendo cada uno por su enlace | No hay embed oficial del perfil completo. Un feed automático exige la API de Meta (cuenta profesional y token que caduca) o un widget de pago |
| Facebook | La página con sus publicaciones recientes (Page Plugin) | Iframe de ancho máximo 500 px con diseño de Facebook |

Los embeds cargan scripts de terceros que pesan y ponen cookies, así que se cargan hasta que la persona llega a la sección.

**Decisión:** Instagram se muestra con un widget de terceros (plan gratis; la marca de agua y los límites son aceptables). La cuenta del widget la crea la dueña de la cuenta de Instagram.

**Fuera de alcance:** feed de Instagram por API propia.

## Requisitos

### Requisito 1 · Enlaces a redes

**Historia de usuario:** Como visitante, quiero ver los enlaces a las redes de la marca, para seguirla donde ya paso mi tiempo.

#### Criterios de aceptación

1.1. El sitio DEBERÁ mostrar enlaces a Instagram, Facebook y TikTok en el pie de todas las páginas. _(Hecho)_
1.2. CUANDO la persona hace clic en un enlace ENTONCES el sitio DEBERÁ abrir el perfil en una pestaña nueva, sin parámetros de rastreo en la URL.
1.3. SI una red no tiene usuario configurado en `src/config/site.ts` ENTONCES el sitio NO DEBERÁ mostrar su enlace.

### Requisito 2 · Sección "Síguenos" con los perfiles

**Historia de usuario:** Como visitante, quiero ver los perfiles de la marca tal como se ven en cada red, para darme una idea de cómo son los viajes sin salir del sitio.

#### Criterios de aceptación

2.1. La portada DEBERÁ incluir una sección "Síguenos" con una columna por red: número, nombre de la red, enlace "Abrir ↗" y el perfil embebido.
2.2. La sección DEBERÁ respetar el sistema visual (serif para títulos, mono para etiquetas, filetes finos) y verse bien en computadora y celular sin scroll horizontal.
2.3. La columna de TikTok DEBERÁ mostrar el embed oficial de creador del perfil @bebeviveviajamx.
2.4. SI hay un ID de feed de Instagram configurado ENTONCES la columna de Instagram DEBERÁ mostrar la cuadrícula del perfil con el widget de terceros (Behold).
2.5. SI no hay ID de feed de Instagram ENTONCES la columna DEBERÁ mostrar una tarjeta del perfil con botón para seguir en Instagram.
2.6. La columna de Facebook DEBERÁ mostrar el Page Plugin oficial de la página bebeviveviaja con portada y publicaciones recientes.

### Requisito 3 · Velocidad y respaldo

**Historia de usuario:** Como visitante, quiero que la portada cargue rápido aunque tenga contenido de redes.

#### Criterios de aceptación

3.1. CUANDO se carga la página ENTONCES el sitio NO DEBERÁ descargar scripts ni iframes de Instagram, Facebook o TikTok.
3.2. CUANDO la sección "Síguenos" está a punto de entrar en pantalla ENTONCES el sitio DEBERÁ cargar los tres embeds, una sola vez.
3.3. SI un embed no carga (bloqueador, sin conexión o error de la red) ENTONCES la columna DEBERÁ seguir mostrando el enlace al perfil.
3.4. Los embeds NO DEBERÁN provocar scroll horizontal en celular.
