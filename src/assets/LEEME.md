# Imágenes de la marca

Deja aquí el logo y cualquier imagen que use la interfaz. Vite las procesa: quedan
optimizadas y con un hash en el nombre, así que el navegador nunca sirve una versión vieja.

- `logo.svg` — sobre fondo claro (barra pública, login, 404).
- `logo-light.svg` — sobre fondo oscuro (sidebar de la app, hero del landing).

Si el logo es legible en ambos fondos, basta con el primero.

`src/components/Logo.tsx` es el único archivo que las referencia; las doce pantallas que
muestran la marca lo usan a él.

Para el favicon y la miniatura al compartir el enlace va otra carpeta: `public/`.
