// Carrusel de fotos simple, sin librerías externas.
// Cada tarjeta de cancha tiene un contenedor con [data-carousel], que agrupa
// una franja de imágenes [data-carousel-track], botones prev/next y puntos
// indicadores. Este script busca TODOS los carruseles de la página y les da
// vida de forma independiente (cada uno recuerda su propia foto actual).
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-carousel]').forEach((carousel) => {
        const track = carousel.querySelector('[data-carousel-track]');
        const dots = carousel.querySelectorAll('[data-carousel-dot]');
        const botonAnterior = carousel.querySelector('[data-carousel-prev]');
        const botonSiguiente = carousel.querySelector('[data-carousel-next]');
        const totalFotos = track ? track.children.length : 0;

        if (!track || totalFotos === 0) return;

        let indiceActual = 0;

        function mostrarFoto(indice) {
            // El "% totalFotos" con el "+ totalFotos" hace que el carrusel
            // sea circular: después de la última foto vuelve a la primera,
            // y desde la primera con "anterior" se va a la última.
            indiceActual = (indice + totalFotos) % totalFotos;
            track.style.transform = `translateX(-${indiceActual * 100}%)`;
            dots.forEach((dot, i) => {
                dot.classList.toggle('bg-white', i === indiceActual);
                dot.classList.toggle('bg-white/60', i !== indiceActual);
            });
        }

        if (botonAnterior) botonAnterior.addEventListener('click', () => mostrarFoto(indiceActual - 1));
        if (botonSiguiente) botonSiguiente.addEventListener('click', () => mostrarFoto(indiceActual + 1));
        dots.forEach((dot, i) => dot.addEventListener('click', () => mostrarFoto(i)));

        mostrarFoto(0);
    });
});