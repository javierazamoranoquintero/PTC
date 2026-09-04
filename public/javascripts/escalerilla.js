// Cambia qué "tramo" (bloque de 10 posiciones) se muestra, sin recargar la
// página. Cualquier control que tenga [data-tramo-target="11-20"] (un botón,
// una pastilla, un número de paginación) o un <select data-tramo-select>
// puede disparar el cambio; todos quedan sincronizados entre sí.
document.addEventListener('DOMContentLoaded', () => {
    const bloques = document.querySelectorAll('[data-tramo-bloque]');
    const selects = document.querySelectorAll('[data-tramo-select]');
    const botones = document.querySelectorAll('[data-tramo-target]');

    function mostrarTramo(etiqueta) {
        bloques.forEach((bloque) => {
            bloque.hidden = bloque.getAttribute('data-tramo-bloque') !== etiqueta;
        });
        botones.forEach((boton) => {
            const activo = boton.getAttribute('data-tramo-target') === etiqueta;
            boton.classList.toggle('bg-primary', activo);
            boton.classList.toggle('text-white', activo);
            boton.classList.toggle('text-neutral/60', !activo);
        });
        selects.forEach((select) => {
            select.value = etiqueta;
        });
    }

    selects.forEach((select) => {
        select.addEventListener('change', () => mostrarTramo(select.value));
    });
    botones.forEach((boton) => {
        boton.addEventListener('click', () => mostrarTramo(boton.getAttribute('data-tramo-target')));
    });
});