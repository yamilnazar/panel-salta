# Panel Salta

Panel de información de solo lectura para una Lenovo Tab M10 HD (TB-X505F) fija en horizontal (1280×800).
HTML, CSS y JavaScript puros, sin frameworks ni build.

## Bloques y frecuencia

| Bloque | Fuente | Actualización |
|---|---|---|
| Hora y fecha (es-AR, America/Argentina/Salta) | reloj del dispositivo | 1 s |
| Agenda | Google Calendar (próxima etapa) | 1 min |
| Bitcoin USD / ARS + variación 24 h | api.coingecko.com | 2 min |
| Dólar oficial, blue, MEP, tarjeta, cripto | dolarapi.com | 10 min |
| Clima actual + 4 días + alertas (lluvia, tormenta, calor, frío, ráfagas en 24 h) | api.open-meteo.com | 30 min |
| Próximo feriado nacional | api.argentinadatos.com | 1 vez por día (guardado en el navegador) |

Modo noche: de 0 a 6 h solo se ve la hora en gris tenue sobre negro.
Horario y umbrales de las alertas se cambian en `CONFIG` al principio de `app.js`.

- Todos los `fetch` usan `cache: "no-store"` y un tiempo límite de 10 s.
- Si una API falla, ese bloque muestra "Sin conexión · último dato HH:MM" y el resto sigue.
- La página se recarga sola cada 6 h. Un service worker guarda los archivos del panel
  (no los datos) para que una recarga sin internet no deje la pantalla en blanco.
- El fondo cambia según amanecer / día / atardecer / noche (usa la salida y puesta del sol de Salta).

## Archivos

- `index.html` – estructura
- `styles.css` – diseño (fuente Manrope incluida en `fonts/`)
- `app.js` – lógica y APIs (configuración al principio del archivo)
- `sw.js` – caché offline de los archivos propios
- `manifest.webmanifest`, `icon*.png`, `icon.svg` – instalación como app

## Probar en la PC

```bash
python -m http.server 8765
```

Abrir http://localhost:8765

## Publicar

Necesita HTTPS para el service worker y para mantener la pantalla encendida (Wake Lock).
Cualquier hosting estático sirve, por ejemplo GitHub Pages: subir esta carpeta a un repositorio
y activar Pages en Settings → Pages.

## Instalar en la tablet

1. Abrir la URL publicada en Chrome.
2. Menú ⋮ → **Agregar a la pantalla principal** / **Instalar app**. Se abre a pantalla completa y en horizontal.
3. Ajustes → Pantalla → Suspender: lo más largo posible.
4. Opciones de desarrollador → **Pantalla activa** (no se apaga mientras carga).

Alternativa con modo kiosco real: la app **Fully Kiosk Browser** apuntando a la misma URL
(arranca con la tablet y evita que se salga del panel).
