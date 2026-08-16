# Fondos alojados

Cualquier `.png`, `.jpg`, `.jpeg`, `.gif` o `.webp` que dejes aquí queda
disponible como fondo de tarjeta con `?bg=preset:<nombre-del-archivo-sin-extensión>`.

```
src/public/backgrounds/synthwave-loop.gif
  -> /stats?username=tu-usuario&bg=preset:synthwave-loop
```

Se leen de disco (sin red, sin descarga) y se inlinean en el SVG en base64.

- Máximo **2 MB** por archivo. Base64 infla un 33%, y por encima de eso el
  proxy de imágenes de GitHub empieza a tardar o a rendirse.
- El nombre solo puede llevar letras, números, `-` y `_`.
- Sobre la imagen va un velo del 65% para que el texto siga leyéndose.
  Se ajusta con `&scrim=0..100`.

Los fondos **generados** (`?bg=mesh-neon`, `grid-dark`, …) no son archivos: se
dibujan en SVG desde `src/cards/background.js`. No hace falta poner nada aquí
para usarlos.

Si añades assets, revisa su licencia antes de subirlos al repo.
