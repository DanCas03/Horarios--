# Diseño: Flujo centrado post-inmersión en /reviews

- **Fecha:** 2026-07-02
- **Autor:** Daniel (con Claude)
- **Estado:** Aprobado — listo para plan de implementación

## Objetivo

Hoy, el dive de `/reviews` (`ScrollExpandMedia`) expande el marco double-bezel a pantalla completa con el logo/backdrop y el título, y al terminar la inmersión revela el contenido de la página (buscador, formulario, resultados) **debajo** del marco, que se queda ocupando toda la pantalla. El usuario tiene que seguir haciendo scroll manualmente para llegar a la funcionalidad real.

Se quiere que, al terminar la animación de inmersión, la funcionalidad principal (buscar reseñas / escribir una reseña) quede **centrada en el viewport**, como continuación natural y sin cortes de la misma animación — no como un salto a una sección aparte más abajo.

## No-objetivos (fuera de alcance)

- Cualquier otro dive del sitio: hoy `ScrollExpandMedia` solo se usa en `/reviews`; no se toca `/pensum`, `/encuesta`, `/schedule` ni el navbar.
- Cambios al buscador, al formulario de reseña o a la lógica de `TeacherPicker` más allá de dónde se renderizan (su comportamiento interno, validaciones y llamadas a la API no cambian).
- Pruebas automatizadas — no existen hoy en `apps/web`; no se agrega infraestructura nueva.
- Rediseñar `ReviewsHeroBackdrop` — sigue siendo el contenido de la escena de inmersión, sin cambios.

## Contexto técnico (estado actual)

- **`apps/web/src/components/ui/scroll-expansion-hero.tsx`**: recibe `media` (un `ReactNode` fijo) y `children`. Controla `scrollProgress` (0 a 1), `expanded` y `showContent` mediante gestos de rueda/touch. El marco crece de tamaño con `scrollProgress` hasta ocupar casi toda la pantalla (94vw × 82vh en desktop) y se queda en ese tamaño una vez `expanded = true`. `children` aparece con fade-in debajo del marco cuando `showContent = true`. El título usa `mix-blend-difference` directamente en el `<h1>` (sin ancestro con stacking context) para adaptar su color al fondo.
- **`apps/web/src/app/reviews/page.tsx`**: hoy compone `<ScrollExpandMedia media={<ReviewsHeroBackdrop />} ...>` y pasa como `children` todo el contenido de la página: una tarjeta blanca de búsqueda, opcionalmente una tarjeta blanca de formulario (`showForm`), la lista de resultados o el estado vacío, y el `FloatingActionMenu`. El buscador tiene autocompletado con debounce (`handleSearchInput`) y sugerencias (`searchSuggestions`). El botón "Escribir Reseña" alterna `showForm` para mostrar/ocultar la tarjeta de formulario. `loading` indica que una búsqueda está en curso; `hasSearched` indica que ya se ejecutó al menos una.
- **Trampas conocidas del codebase**: la transición universal `*` de `index.css` (400ms sobre opacity/transform/filter) pelea con animaciones por-frame de framer-motion si se usa `type: "spring"` — la solución ya validada es `type: "tween"` con la curva de marca (`cubic-bezier(0.32,0.72,0,1)`) más `transition-none` en los elementos animados por frame. El `mix-blend-difference` se anula si cualquier ancestro del elemento con el blend crea un stacking context (`position`+`z-index`, `opacity<1`, `transform`, `filter`, `isolation`).

---

## Flujo objetivo: 4 escenas dentro del mismo marco

El marco double-bezel deja de ser "backdrop fijo + contenido debajo" y pasa a alojar una secuencia de escenas. La posición centrada del marco (`top-1/2 left-1/2 -translate-x/y-1/2`) no cambia en ningún momento durante las escenas 1-3 — es lo que garantiza que la funcionalidad quede centrada sin necesidad de recalcular ninguna posición.

### Escena 1 — Backdrop (sin cambios)

Comportamiento idéntico al actual: el gesto de scroll/touch expande el marco mostrando `ReviewsHeroBackdrop` y el título grande con el velo navy que se disipa.

### Escena 2 — Buscador

Se activa en cuanto `scrollProgress` llega a 1 (mismo punto donde hoy se activa `expanded`/`showContent`). Dentro del marco:

- El velo navy se disuelve a un fondo blanco/claro en vez de quedar semitransparente.
- El contenido interior del marco cambia, mediante cross-fade de opacidad entre capas superpuestas (no desmontaje/montaje condicional), de `ReviewsHeroBackdrop` al buscador real: el mismo input con autocompletado y botón "Buscar" que hoy vive en la tarjeta blanca de la página, más el botón "Escribir Reseña" (solo visible si hay `user`, igual que hoy).
- El título ("Reseñas de Estudiantes") no desaparece: se encoge de tamaño grande a un encabezado pequeño y sube dentro del marco, sirviendo de contexto sobre el buscador. Sigue llevando el `mix-blend-difference` directamente en el elemento de texto, sin envolverlo en un ancestro posicionado.
- El marco mantiene el mismo tamaño que tenía al terminar la Escena 1 — no hay redimensionamiento en esta transición, solo cambio de contenido.

### Escena 3 — Formulario

Se activa al hacer clic en "Escribir Reseña" desde la Escena 2. Dentro del mismo marco (mismo tamaño, misma posición):

- El buscador es reemplazado por el formulario completo de nueva reseña (los mismos campos que hoy tiene la tarjeta de formulario: materia, periodo, `TeacherPicker`, calificaciones, recomendación, comentario, tips, estrategia de estudio, botón de envío).
- Un botón "Cancelar" (o ícono X) visible dentro del marco regresa a la Escena 2 sin perder el estado de inmersión ni el tamaño del marco.
- Si el envío del formulario es exitoso, se vuelve a la Escena 2 (buscador), y si había una búsqueda activa (`activeCode`) se dispara el refetch como ya ocurre hoy — ese refetch sigue el mismo camino de "búsqueda resuelta → compactar" descrito en la Escena 4 si el marco seguía expandido en ese momento.

### Escena 4 — Resultados (marco compactado)

Se activa automáticamente cuando una búsqueda lanzada desde la Escena 2 termina de resolver (`loading` pasa de `true` a `false`), sin importar si hubo resultados o no. No requiere que el usuario haga scroll hacia arriba ni ninguna acción manual:

- El marco se contrae, con la misma animación `tween`/curva de marca, desde su tamaño de pantalla completa hacia una barra de búsqueda delgada anclada en la parte superior del contenido de la página. Este es el único cambio de tamaño real del marco en todo el flujo (a diferencia de las Escenas 2-3, que solo cambian contenido).
- Esa barra compactada reutiliza el mismo input, manejadores de búsqueda y sugerencias que la Escena 2 — no es una segunda implementación paralela del buscador. Desde ahí se puede lanzar una nueva búsqueda sin volver a expandir el marco; mientras esa nueva búsqueda carga, el marco compactado no vuelve a inflarse a pantalla completa.
- Debajo de la barra compactada, en el flujo normal de la página (igual que el `showContent`/`children` actual), aparecen los resultados de la búsqueda o el estado vacío ("No se encontraron reseñas para X"), y el `FloatingActionMenu` sigue en su posición actual.
- El botón "Escribir Reseña" sigue disponible desde la barra compactada; al pulsarlo, el formulario aparece como panel en el flujo normal de la página (el mismo patrón que existe hoy), no dentro del marco ya compactado — la Escena 3 (formulario dentro del marco) solo aplica mientras el marco sigue expandido a pantalla completa (Escena 2).

---

## Mecánica de la transición

- Todo cambio de escena (1→2, 2→3, 3→2, 2→4) se anima con `type: "tween"` y la curva de marca `cubic-bezier(0.32,0.72,0,1)`, nunca `spring` — es la causa ya diagnosticada del rebote de la píldora de pestañas. Los elementos que cambian por frame deben llevar `transition-none` para no chocar con la transición universal de 400ms de `index.css`.
- Los cross-fades de contenido (backdrop↔buscador↔formulario) se implementan con capas superpuestas cuya opacidad se anima, no con montaje/desmontaje condicional del contenido — mismo criterio ya usado para el acordeón de semestres.
- El encogimiento del título (grande → encabezado pequeño) mantiene el `mix-blend-difference` en el propio elemento de texto; se revisa que ningún ancestro nuevo introducido en esta escena tenga `position`+`z-index`, `opacity<1`, `transform`, `filter` o `isolation`, para no repetir el bug ya resuelto en el título del dive.
- La contracción del marco a barra compactada (Escena 4) es un cambio real de `width`/`height` (no solo de contenido) y debe dispararse por el cambio de estado `loading: true → false` tras una búsqueda, no por un gesto de scroll del usuario.
- Con `prefers-reduced-motion`, el flujo se muestra directamente en el estado final relevante (buscador visible dentro del marco expandido, sin inmersión animada), igual que ya hace el componente hoy para `expanded`/`showContent`.
- Debe seguir siendo posible salir de la inmersión (gesto de scroll-up en la parte superior) mientras el marco siga expandido (Escenas 2 y 3), sin quedar en un estado intermedio roto; al volver a expandir, se restaura la escena que corresponda según si ya hay una búsqueda activa o no. **Ajuste post-implementación (2026-07-02):** una vez compactado el marco (Escena 4), el gesto de salida se desactiva — subir al tope de los resultados para leer las primeras reseñas no debe volver a inflar el marco.

## Qué componentes/archivos cambian

- **`scroll-expansion-hero.tsx`**: gana una noción de escena interna además de `scrollProgress`/`expanded`/`showContent`, y necesita alguna forma de recibir contenido distinto por escena (hoy solo recibe un `media` fijo). También necesita una señal desde la página padre para disparar la compactación de la Escena 4, ya que la lógica de "hay una búsqueda en curso" y "hay resultados" vive en `page.tsx`.
- **`app/reviews/page.tsx`**: el buscador y el formulario dejan de ser tarjetas blancas independientes en el flujo normal de la página y pasan a ser contenido de las Escenas 2 y 3 del marco. Se necesita un estado explícito de "escena actual" además de los estados que ya existen (`showForm`, `loading`, `hasSearched`, etc.). La barra compactada de la Escena 4 reutiliza los mismos manejadores de búsqueda que ya existen (`handleSearchInput`, `handleSearch`, `searchSuggestions`), no una implementación paralela. El botón "Escribir Reseña" cambia de destino según la escena: abre el formulario dentro del marco en Escena 2, o como panel en el flujo normal de la página en Escena 4 (comportamiento igual al actual).
- **`reviews-hero-backdrop.tsx`**: sin cambios.
- No se tocan otras páginas ni el navbar.

## Casos borde

- **Salir de la inmersión** (gesto de scroll-up arriba de todo, disponible solo en Escenas 2 y 3): debe volver a la escena correspondiente al re-expandir (si ya había una búsqueda activa, vuelve directamente compactado a Escena 4; si no, a Escena 2). Ya compactado en Escena 4, el gesto queda desactivado.
- **Nueva búsqueda desde la barra compactada**: no debe volver a inflar el marco a pantalla completa mientras carga.
- **Cero resultados**: cuenta como búsqueda resuelta igual que con resultados — dispara la compactación (Escena 4) y muestra el estado vacío debajo, como ya ocurre hoy.
- **Usuario sin sesión**: el botón "Escribir Reseña" no se muestra en la Escena 2 ni en la barra compactada, igual que hoy.
- **Cancelar el formulario sin haber buscado antes**: regresa exactamente a la Escena 2 (buscador dentro del marco, sin compactar).
- **Envío exitoso del formulario**: si el marco seguía expandido (Escena 2/3) en ese momento, el refetch resultante sigue el camino normal de "búsqueda resuelta → compactar" (Escena 4).
- **Mobile**: la barra compactada debe seguir siendo utilizable con el ancho reducido de pantallas chicas, sin depender de hover.
