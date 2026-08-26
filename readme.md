# vehicle-fe — Aplicación web de Vehicle-ID

React 19 + TypeScript + Vite + Tailwind CSS 4. Consume la API de [`vehicle-be`](../vehicle-be).

## Puesta en marcha

```bash
npm install
npm run dev     # http://localhost:5173
```

En desarrollo `/api` y `/uploads` pasan por el proxy de Vite hacia `http://localhost:5080`, así
que el navegador ve un solo origen y no hay CORS de por medio. En producción se apunta con
`VITE_API_URL`.

```bash
npm run build   # typecheck + bundle en dist/
npm run lint
```

## Estructura

```
src/
  components/       Piezas de interfaz reutilizables
    ui/             Botones, formularios, modal, indicadores
    layout/         Shell de la app y encabezado de página
  features/         Lógica por dominio: hooks de datos y contexto de sesión
  lib/              Cliente HTTP, formatos, tipos de la API y etiquetas
  pages/            Una carpeta por zona: pública, auth y app privada
```

- `lib/types.ts` refleja los DTOs de la API. Los enums de .NET llegan como texto, así que se
  declaran como uniones de string y sirven directamente como llave de los mapas de etiquetas.
- `lib/labels.ts` concentra las traducciones y la escala de urgencia (`chip`, acento, tono de
  salud), para que una alerta se vea igual en el tablero, en el detalle y en la hoja pública.
- `features/partners/` es el módulo de aliados: el catálogo de categorías, el panel del negocio
  y las recomendaciones. `CategoryIcon` traduce la clave que guarda la base al ícono de lucide,
  porque las categorías se editan en BD y no pueden depender de un `import` fijo.
- `features/records/hooks.ts` agrupa los módulos del vehículo: todos comparten la forma
  `/vehicles/{id}/{recurso}`, así que comparten también la forma de consultarlos y de invalidar
  la caché. Cualquier registro puede mover el kilometraje, y con él las alertas y el plan, por
  eso cada mutación invalida el vehículo completo.

## Sistema de diseño

Definido en `src/index.css` con `@theme` de Tailwind 4.

- **Marca:** azul eléctrico sobre base grafito (`carbon`). Las superficies oscuras usan la
  utilidad `grid-noise` para la rejilla técnica del landing.
- **Estados:** `ok` / `warn` / `danger` son parte del sistema, no colores sueltos. Toda la app
  comunica urgencia con la misma escala: el anillo de salud, los chips y las barras de progreso.
- **Tipografía:** Space Grotesk para títulos y cifras, Inter para texto.
- Las bases compartidas de botones y chips se declaran con `@utility` porque en Tailwind 4
  `@apply` solo acepta utilidades, no clases declaradas en `@layer components`.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | Landing |
| `/ingresar`, `/registro` | Acceso |
| `/registro-aliado` | Registro de un negocio en el directorio |
| `/v/:slug` | Hoja de vida pública del vehículo |
| `/aliados`, `/aliados/:slug` | Directorio de aliados y ficha de cada uno |
| `/app` | Tablero del garaje |
| `/app/garaje` | Lista de vehículos |
| `/app/vehiculos/nuevo` | Alta por placa: cuatro datos y el registro pone el resto |
| `/app/vehiculos/:id/editar` | Edición de la ficha |
| `/app/vehiculos/:id` | Detalle con pestañas (`?tab=`), incluida `oficial` |
| `/app/talleres`, `/app/perfil` | Talleres guardados y perfil |
| `/app/aliado` | Panel del negocio (o su activación, si la cuenta aún no es aliado) |
| `/app/crm`, `/app/crm/clientes/:id` | Clientes del aliado y ficha de cada uno |
| `/app/crm/importar` | Carga masiva desde CSV |
| `/app/crm/campanas`, `/app/crm/campanas/:id` | Campañas y su editor (`nueva` para crear) |
| `/app/avisos` | Bandeja de avisos del usuario |
| `/baja/:token` | Baja de las comunicaciones de un aliado. Pública, sin sesión |

Los vehículos entran solo por la placa: no hay alta manual. La ficha la pone el registro, así
que dos usuarios con el mismo carro ven los mismos datos y nadie escribe mal un chasis. Si la
consulta no está configurada en el servidor, la pantalla lo dice en vez de ofrecer un rodeo.
`VehicleFormPage` quedó para editar lo que el registro no sabe o trae distinto.

La pestaña **Oficial** del detalle abre con **Estado legal**: SOAT, tecnomecánica, gravámenes y
multas en cuatro indicadores. Es el veredicto —si puedes circular y si lo puedes vender— y va
primero porque es lo que la gente viene a saber; el detalle de cada cosa está debajo. Siguen el
avalúo con su histórico y la referencia comercial que se avaluó, prendas y embargos, la ficha del
registro con la identificación completa (motor, chasis, VIN, cilindraje), el pico y placa y qué
respondió cada fuente. El avalúo y los gravámenes vigentes se repiten en el Resumen —una cifra que
la gente busca primero y una advertencia que impide vender el carro no pueden vivir escondidas en
una pestaña—.

- **Estado legal y Documentos no pueden contradecirse.** El indicador usa lo que dijo el RUNT y,
  si no contestó, el documento que el usuario tiene cargado; solo dice "sin consultar" cuando no
  hay ninguna de las dos. Ver un SOAT en Documentos y un "sin consultar" en Oficial es un error de
  la app, no un estado válido.
- **Cuando las dos fuentes se contradicen se dice cuál manda.** Si el RUNT no reconoce un
  documento que el usuario tiene guardado sin vencer, el indicador lo advierte en vez de escoger
  en silencio.
- **"No lo tiene" y "no se pudo averiguar" se pintan distinto.** Dar por bueno lo que no se sabe
  es peor que decir que no se sabe.
- **"Falló" es la fuente; "con novedad" es el vehículo.** El proveedor marca `danger` cuando
  contestó bien y la noticia es mala —una tecnomecánica sin vigencia—, así que en "qué respondió
  cada fuente" eso no se muestra como un error del servicio.
- **Al documento que falta se le ofrece dónde resolverlo.** El indicador enlaza al directorio
  filtrado por la categoría que lo expide (`/aliados?categoria=cda`), y avisa desde un mes antes
  porque conseguir cita toma tiempo. Decirle a alguien que le falta la tecnomecánica sin decirle
  dónde hacerla es dejarlo a mitad de camino.
- **El pico y placa por día no se lee en los dígitos.** Medellín restringe por día de la semana y
  los dígitos llegan vacíos: mostrar solo eso haría creer que la placa no tiene restricción cuando
  le toca un día fijo.

El **perfil del conductor** —las categorías de licencia vigentes y el historial de trámites— vive
en `/app/perfil`, no en la ficha de un vehículo: quien tiene tres carros tiene una sola licencia, y
buscarla dentro de uno de ellos era una pista falsa. La pestaña Oficial deja un enlace hacia allá
para quien la busque donde estaba.

- **Solo se muestra lo que habilita a conducir hoy.** El servidor descarta las categorías que el
  registro dio de baja: una licencia retirada al lado de las buenas hace dudar de cuál vale. Lo que
  no se pudo clasificar sí se muestra, después de las activas — esconder una licencia por una
  palabra inesperada sería el mismo error, al revés.
- **Los certificados no se muestran.** Se siguen guardando porque el médico es lo que necesita la
  alerta de refrendación, pero no ocupan la pantalla.

- **Un fallo del servidor no se pinta como "no tienes".** Cuando la consulta falla, la sección lo
  dice y ofrece reintentar; mostrar el mismo vacío que cuando de verdad no hay datos hace creer al
  usuario que perdió lo suyo. Lo mismo en la pestaña Oficial, que antes se quedaba en blanco.
- **Una licencia sin vencimiento legible se muestra igual**, con "sin fecha de vencimiento" en vez
  de desaparecer de la lista.

La pestaña activa del detalle vive en la URL, así se puede compartir un enlace directo al
historial o al plan. Los filtros del directorio también, para poder compartir "montallantas en
Medellín" tal cual.

## Aliados

Un aliado es un negocio —taller, montallantas, CDA, lubricentro— con cuenta propia. `/app/talleres`
es la otra cara: los aliados que un usuario guardó, con su calificación y sus notas.

- **Los talleres no se escriben a mano.** Se guardan desde el directorio, y en la tarjeta el
  usuario solo aporta lo suyo: la estrella de favorito y, en el modal de notas, la calificación.
  El nombre y el contacto los sirve el aliado desde su ficha, así que nunca quedan desactualizados
  ni existen dos versiones del mismo taller.
- Para un servicio hecho en un taller que no está en el directorio, el formulario de mantenimiento
  sigue aceptando el nombre escrito a mano: no tener el taller registrado no debería impedir
  registrar el gasto.

- **El registro es la decisión importante.** Las categorías que marca el negocio son las que
  definen por cuáles alertas se le recomienda, así que el formulario lo dice explícitamente y
  cada opción muestra qué resuelve.
- **`RecommendedPartners` no se dibuja si viene vacío.** Sin nada por vencerse, o sin aliados en
  esa categoría, un bloque vacío solo ocuparía el tablero.
- **`/app/aliado` sirve para los dos estados**: si la cuenta aún no es aliado muestra la
  activación, y si ya lo es muestra la edición del perfil. Es la misma ruta porque para el usuario
  es el mismo lugar.
- Al registrar un servicio se puede escoger el taller del directorio: se copia a la libreta y
  queda seleccionado de una vez. El filtro por ciudad del buscador se puede soltar, porque en
  ciudades sin aliados dejaría al usuario sin salida.

## CRM del aliado

`features/crm/` y `pages/app/crm/`. Es el panel con el que un taller lleva sus clientes y les
escribe. Solo aparece en el menú cuando la cuenta tiene perfil de negocio.

- **El alcance va al lado del mensaje, no después.** `SegmentBuilder` recalcula a cuántos llega
  cada vez que se mueve un filtro, porque ese número es lo que decide cómo se redacta: no se
  escribe igual para 6 personas que para 300.
- **Cada bloque del segmento se apaga entero.** Un formulario con diez campos vacíos no deja
  claro si el segmento son todos los clientes o ninguno; con interruptores sí.
- **Los marcadores (`{{nombre}}`, `{{placa}}`, `{{vence}}`) son lo que hace personal un envío
  masivo.** La vista previa los resuelve con un destinatario real, no con datos inventados.
- **Importar es en dos pasos.** Primero se muestra qué haría el archivo —qué crea, qué completa,
  qué filas se caen y por qué—; solo entonces se confirma. Descubrir los errores después de
  escribir en la base obligaría a limpiar a mano.
- **El editor no copia el servidor al estado con un efecto.** El formulario se monta con `key`
  por campaña, así toma sus valores iniciales de las props: mientras se envía, la consulta se
  refresca sola y un efecto pisaría lo que se está escribiendo.
- **Una campaña enviada no se edita**, porque dejaría de coincidir con lo que la gente recibió.
- Los avisos in-app llegan a `/app/avisos` y el usuario controla quién puede escribirle desde el
  interruptor de cada taller en `/app/talleres`.
