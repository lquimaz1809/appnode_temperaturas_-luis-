const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.static("public"));

let datos = null;

try {
    const filePath = path.join(__dirname, "data", "datos.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    datos = JSON.parse(rawData);
} catch (error) {
    console.error("Error al cargar datos.json:", error);
    process.exit(1);
}

// Rutas
app.get("/api/datos", (req, res) => {
    res.json(datos);
});

app.get("/api/media-global", (req, res) => {
    const todasLasMaximas = datos.localidades.flatMap(loc =>
        loc.temperaturas.map(t => parseFloat(t.max))
    );

    if (todasLasMaximas.length === 0) {
        return res.status(404).json({ error: "No hay temperaturas disponibles" });
    }

    const suma = todasLasMaximas.reduce((acc, temp) => acc + temp, 0);
    const media = suma / todasLasMaximas.length;

    res.json({ media: media.toFixed(2) });
});

app.get("/api/media-localidad/:nombre", (req, res) => {
    const nombre = decodeURIComponent(req.params.nombre);
    const localidad = datos.localidades.find(loc => loc.nombre === nombre);

    if (!localidad) {
        return res.status(404).json({ error: "Localidad no encontrada" });
    }

    const maximas = localidad.temperaturas.map(t => parseFloat(t.max));
    const suma = maximas.reduce((acc, temp) => acc + temp, 0);
    const media = suma / maximas.length;

    res.json({ media: media.toFixed(2) });
});

app.get("/api/media-dia/:dia", (req, res) => {
    const dia = parseInt(req.params.dia);

    if (isNaN(dia) || dia < 0 || dia > 6) {
        return res.status(400).json({ error: "Día inválido (0-6)" });
    }

    const maximasDelDia = datos.localidades
        .map(loc => loc.temperaturas[dia]?.max)
        .filter(max => max !== undefined)
        .map(max => parseFloat(max));

    if (maximasDelDia.length === 0) {
        return res.status(404).json({ error: "No hay datos para ese día" });
    }

    const suma = maximasDelDia.reduce((acc, t) => acc + t, 0);
    const media = suma / maximasDelDia.length;

    res.json({ media: media.toFixed(2) });
});

// Ruta para filtrar días
app.get("/api/filtrar", (req, res) => {
    const umbral = parseFloat(req.query.umbral);
    const tipo = req.query.tipo;
    const campo = req.query.campo;

    if (isNaN(umbral) || !["mayor", "menor"].includes(tipo) || !["max", "min"].includes(campo)) {
        return res.status(400).json({ error: "Parámetros inválidos" });
    }

    let resultado = [];

    datos.localidades.forEach(localidad => {
        localidad.temperaturas.forEach(temp => {
            const valor = parseFloat(temp[campo]);
            const cumple = tipo === "mayor" ? valor > umbral : valor < umbral;

            if (cumple) {
                resultado.push({
                    localidad: localidad.nombre,
                    dia: temp.dia,
                    temperatura: valor
                });
            }
        });
    });

    res.json(resultado);
});

// Ruta para resumen semanal
app.get("/api/resumen-localidades", (req, res) => {
    const resumen = datos.localidades.map(loc => {
        const maximas = loc.temperaturas.map(t => parseFloat(t.max));
        const minimas = loc.temperaturas.map(t => parseFloat(t.min));

        const maxSemana = Math.max(...maximas);
        const minSemana = Math.min(...minimas);
        const mediaSemana = (maximas.reduce((acc, t) => acc + t, 0) / maximas.length).toFixed(2);

        return {
            nombre: loc.nombre,
            maxSemana,
            minSemana,
            mediaSemana
        };
    });

    res.json(resumen);
});
app.get("/api/mayor-menor-media", (req, res) => {
    const campo = req.query.campo; // "max" o "min"

    if (!["max", "min"].includes(campo)) {
        return res.status(400).json({ error: "Campo inválido (debe ser 'max' o 'min')" });
    }

    // Calcular medias por localidad
    const medias = datos.localidades.map(loc => {
        const valores = loc.temperaturas.map(t => parseFloat(t[campo]));
        const suma = valores.reduce((acc, t) => acc + t, 0);
        const media = suma / valores.length;

        return {
            nombre: loc.nombre,
            media: media
        };
    });

    // Buscar mayor y menor
    let mayor = medias[0];
    let menor = medias[0];

    medias.forEach(loc => {
        if (loc.media > mayor.media) mayor = loc;
        if (loc.media < menor.media) menor = loc;
    });

    res.json({
        mayor: { nombre: mayor.nombre, media: mayor.media.toFixed(2) },
        menor: { nombre: menor.nombre, media: menor.media.toFixed(2) }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
