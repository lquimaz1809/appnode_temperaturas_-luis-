async function getMediaGlobal() {
    const res = await fetch("/api/media-global");
    const data = await res.json();
    document.getElementById("res_avg").textContent = `Media global: ${data.media}°C`;
}

async function getMediaLocalidad() {
    const select = document.getElementById("localidad");
    const nombre = select.value;
    const res = await fetch(`/api/media-localidad/${encodeURIComponent(nombre)}`);
    const data = await res.json();
    document.getElementById("res_avglocalidad").textContent = `Media: ${data.media}°C`;
}

async function getMediaDia() {
    const dia = document.getElementById("dia").value;
    const res = await fetch(`/api/media-dia/${dia}`);
    const data = await res.json();
    document.getElementById("res_avgdia").textContent = `Media: ${data.media}°C`;
}

document.getElementById("avg").addEventListener("click", getMediaGlobal);
document.getElementById("avgdia").addEventListener("click", getMediaDia);
document.getElementById("avglocalidad").addEventListener("click", getMediaLocalidad);

// Cargar localidades al iniciar
async function cargarLocalidades() {
    const res = await fetch("/api/datos");
    const data = await res.json();
    const localidades = data.localidades;
    const select = document.getElementById("localidad");

    localidades.forEach(loc => {
        const option = document.createElement("option");
        option.value = loc.nombre;
        option.textContent = loc.nombre;
        select.appendChild(option);
    });
}
cargarLocalidades();
async function filtrarTemperaturas(tipo) {
    const res = await fetch("/api/datos");
    const data = await res.json();
    const localidades = data.localidades;

    let resultado = "";

    localidades.forEach(loc => {
        let diasFiltrados = [];

        loc.temperaturas.forEach(t => {
            if (tipo === "mayor25" && parseFloat(t.max) > 25) {
                diasFiltrados.push(`${t.dia} (Max: ${t.max}°C)`);
            } else if (tipo === "menor15" && parseFloat(t.min) < 15) {
                diasFiltrados.push(`${t.dia} (Min: ${t.min}°C)`);
            }
        });

        if (diasFiltrados.length > 0) {
            resultado += `<strong>${loc.nombre}:</strong> ${diasFiltrados.join(", ")}<br>`;
        }
    });

    document.getElementById("resultado").innerHTML = resultado || "No se encontraron resultados.";
}
document.getElementById("btnMayor25").addEventListener("click", () => filtrarTemperaturas("mayor25"));
document.getElementById("btnMenor15").addEventListener("click", () => filtrarTemperaturas("menor15"));

async function mostrarResumenSemanal() {
    const res = await fetch("/api/resumen-localidades");
    const data = await res.json();

    let resultado = "";

    data.forEach(loc => {
        resultado += `<strong>${loc.nombre}</strong>: 
        Máxima semana: ${loc.maxSemana}°C, 
        Mínima semana: ${loc.minSemana}°C, 
        Media semana: ${loc.mediaSemana}°C<br>`;
    });

    document.getElementById("resumenSemanal").innerHTML = resultado;
}

document.getElementById("btnResumen").addEventListener("click", mostrarResumenSemanal);

