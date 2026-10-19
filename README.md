# grooveTrain

Entrenador rítmico para guitarra, bajo y batería, con 16 figuras musicales en bloques y un tren animado sincronizado con el metrónomo.

## Estructura

- `index.html` — interfaz y accesibilidad de los controles.
- `css/styles.css` — apariencia, distribución adaptable y animación del tren.
- `js/figures.js` — catálogo rítmico, duraciones y símbolos musicales SVG.
- `js/train.js` — posición y estado del tren de 16 pulsos.
- `js/app.js` — niveles, generación, metrónomo, sonidos, juego, puntuación y micrófono.

## Ejecutar

Abre `index.html` desde el explorador de archivos o sirve la carpeta con:

```bash
cd grooveTrain
python3 -m http.server 8000
```

Después accede a `http://localhost:8000`. Usa localhost/HTTPS y da permiso al micrófono para probar la detección de ataques. El reconocimiento del micrófono es experimental y no analiza afinación.

## Uso

- **Jugar**: 4 pulsos de preparación → 16 pulsos con ejemplo y metrónomo → 4 pulsos de preparación → 16 pulsos solo metrónomo para tocar.
- **Escuchar**: solo el ejemplo.
- **Golpe / Espacio**: registrar tus golpes (entrada por teclado).
- **Micro**: conectar el micrófono con auriculares, ajustar sensibilidad y latencia.
- **Niveles / Aleatorio**: ejercicios de dificultad progresiva o aleatorios.
- **Generar**: patrón nuevo. **Editar**: pulsar un bloque para cambiar la figura.
- **Tren**: locomotora y 16 traviesas marcan el avance de cada bloque; al empezar tu turno, vuelve a la salida.

Sin dependencias externas. Audio generado con Web Audio API; se recomienda Chrome/Chromium moderno.
