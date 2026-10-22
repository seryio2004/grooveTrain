# grooveTrain

Entrenador rítmico para guitarra, bajo y batería, con 16 figuras musicales en bloques y un tren animado sincronizado con el metrónomo.

## Estructura

- `index.html` — interfaz y accesibilidad de los controles.
- `css/styles.css` — apariencia, distribución adaptable y animación del tren.
- `js/figures.js` — catálogo rítmico, duraciones y símbolos musicales SVG.
- `js/rhythm.js` — detección de ataques y evaluación temporal de golpes.
- `js/mic-processor.js` — análisis del micrófono en el hilo de audio.
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

- **Probar ritmo**: 4 pulsos de preparación → 16 pulsos con ejemplo y metrónomo → 4 pulsos de preparación → 16 pulsos solo metrónomo para tocar.
- **Escuchar**: solo el ejemplo.
- **Golpe / Espacio**: comprobar la entrada antes del reto y registrar golpes durante tu turno.
- **Micro**: conectar el micrófono con auriculares y comprobar el medidor y el contador de ataques. Más sensibilidad permite detectar golpes suaves; una compensación positiva resta retraso a los ataques detectados. El análisis usa AudioWorklet y requiere localhost/HTTPS.
- **Niveles / Aleatorio**: ejercicios de dificultad progresiva o aleatorios.
- **Generar**: patrón nuevo. **Editar**: pulsar un bloque para cambiar la figura.
- **Tren**: locomotora y 16 traviesas marcan el avance de cada bloque; al empezar tu turno, vuelve a la salida.

Sin dependencias externas. Audio generado con Web Audio API; se recomienda Chrome/Chromium moderno.

Los bloques solo aparecen como correctos cuando se completan todos sus golpes sin ataques extra. El resultado incluye aciertos, golpes de más, perdidos, error y adelanto o retraso medio.

Pruebas de regresión: `node --test tests/rhythm.test.cjs`.
