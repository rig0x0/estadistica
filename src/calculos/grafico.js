// src/calculos/graficaXR.js

/**
 * Calcula los factores para las gráficas de control X-R según el tamaño de la muestra (n).
 * Estos factores son estándar en control estadístico de procesos.
 * Fuente: Tablas de factores para gráficas de control. 
 *
 * @param {number} n - Tamaño de la submuestra (número de mediciones por muestra).
 * @returns {Object|null} Objeto con los factores A2, D3, D4, o null si n está fuera del rango soportado.
 */
function obtenerFactoresControl(n) {
    // Tabla de factores comunes para gráficas X-R
    // Adaptada de tablas estándar de Control Estadístico de Procesos (SPC) 
    const factores = {
        2: { A2: 1.880, D3: 0, D4: 3.268 },
        3: { A2: 1.023, D3: 0, D4: 2.574 },
        4: { A2: 0.729, D3: 0, D4: 2.282 },
        5: { A2: 0.577, D3: 0, D4: 2.114 },
        6: { A2: 0.483, D3: 0, D4: 2.004 },
        7: { A2: 0.419, D3: 0.076, D4: 1.924 },
        8: { A2: 0.373, D3: 0.136, D4: 1.864 },
        9: { A2: 0.337, D3: 0.184, D4: 1.816 },
        10: { A2: 0.308, D3: 0.223, D4: 1.777 },
        11: { A2: 0.285, D3: 0.256, D4: 1.744 }, // Añadido de la imagen 
        12: { A2: 0.266, D3: 0.283, D4: 1.717 }, // Añadido de la imagen 
        13: { A2: 0.249, D3: 0.307, D4: 1.693 }, // Añadido de la imagen 
        14: { A2: 0.235, D3: 0.328, D4: 1.672 }, // Añadido de la imagen 
        15: { A2: 0.223, D3: 0.347, D4: 1.653 }, // Añadido de la imagen 
        16: { A2: 0.212, D3: 0.363, D4: 1.637 }, // Añadido de la imagen 
        17: { A2: 0.203, D3: 0.378, D4: 1.622 }, // Añadido de la imagen 
        18: { A2: 0.194, D3: 0.391, D4: 1.608 }, // Añadido de la imagen 
        19: { A2: 0.187, D3: 0.403, D4: 1.597 }, // Añadido de la imagen 
        20: { A2: 0.180, D3: 0.415, D4: 1.585 }, // Añadido de la imagen 
    };

    return factores[n] || null;
}

/**
 * Calcula los promedios (X-barras) y rangos (R) para cada subgrupo.
 *
 * @param {Array<Array<number>>} datos - Un array de arrays, donde cada array interno es una submuestra de mediciones.
 * @returns {Array<Object>} Un array de objetos, cada uno con 'xBar' (promedio) y 'range' (rango) para una submuestra.
 */
function calcularXBarraYRangoPorSubgrupo(datos) {
    return datos.map(subgrupo => {
        if (subgrupo.length === 0) {
            return { xBar: NaN, range: NaN }; // Manejar subgrupos vacíos si es posible
        }
        const sum = subgrupo.reduce((acc, val) => acc + val, 0);
        const xBar = sum / subgrupo.length;
        const max = Math.max(...subgrupo);
        const min = Math.min(...subgrupo);
        const range = max - min;
        return { xBar, range };
    });
}

/**
 * Calcula el promedio de los promedios (doble X-barra) y el promedio de los rangos (R-barra).
 *
 * @param {Array<Object>} subgruposCalculados - Resultados de calcularXBarraYRangoPorSubgrupo.
 * @returns {Object} Un objeto con 'xDoubleBar' y 'rBar'.
 */
function calcularPromediosGenerales(subgruposCalculados) {
    if (subgruposCalculados.length === 0) {
        return { xDoubleBar: NaN, rBar: NaN };
    }
    const totalXBar = subgruposCalculados.reduce((acc, sg) => acc + sg.xBar, 0);
    const totalR = subgruposCalculados.reduce((acc, sg) => acc + sg.range, 0);

    const xDoubleBar = totalXBar / subgruposCalculados.length;
    const rBar = totalR / subgruposCalculados.length;

    return { xDoubleBar, rBar };
}

/**
 * Calcula los límites de control para la gráfica X-barra.
 *
 * @param {number} xDoubleBar - El promedio de los promedios.
 * @param {number} rBar - El promedio de los rangos.
 * @param {number} n - Tamaño de la submuestra.
 * @returns {Object} Objeto con UCL_X (LCS), CL_X (LC), LCL_X (LCI).
 */
function calcularLimitesControlXBarra(xDoubleBar, rBar, n) {
    const factores = obtenerFactoresControl(n);
    if (!factores) {
        console.error(`Factores de control no disponibles para n=${n}.`);
        return { UCL_X: NaN, CL_X: NaN, LCL_X: NaN };
    }

    const A2 = factores.A2;
    const CL_X = xDoubleBar; // Línea Central para X-barra es X-doble-barra
    const UCL_X = xDoubleBar + (A2 * rBar);
    const LCL_X = xDoubleBar - (A2 * rBar);

    return { UCL_X, CL_X, LCL_X };
}

/**
 * Calcula los límites de control para la gráfica R.
 *
 * @param {number} rBar - El promedio de los rangos.
 * @param {number} n - Tamaño de la submuestra.
 * @returns {Object} Objeto con UCL_R (LCS), CL_R (LC), LCL_R (LCI).
 */
function calcularLimitesControlR(rBar, n) {
    const factores = obtenerFactoresControl(n);
    if (!factores) {
        console.error(`Factores de control no disponibles para n=${n}.`);
        return { UCL_R: NaN, CL_R: NaN, LCL_R: NaN };
    }

    const D3 = factores.D3;
    const D4 = factores.D4;
    const CL_R = rBar; // Línea Central para R es R-barra
    const UCL_R = D4 * rBar;
    const LCL_R = D3 * rBar;

    return { UCL_R, CL_R, LCL_R };
}

/**
 * Función principal para calcular todos los valores de las gráficas X-R.
 *
 * @param {Array<Array<string|number>>} datosCrudos - Datos de entrada del usuario (pueden contener strings vacíos).
 * @param {number} numMedicionesPorMuestra - El tamaño esperado de cada submuestra.
 * @returns {Object} Un objeto con todos los resultados y datos formateados para los gráficos.
 */
export function calcularGraficaXR(datosCrudos, numMedicionesPorMuestra) {
    const muestrasNumericas = datosCrudos.map(muestra =>
        muestra
            .map(String) // Asegura que sean strings
            .filter(s => s.trim() !== '') // Elimina strings vacíos
            .map(s => parseFloat(s.trim())) // Convierte a número
            .filter(num => !isNaN(num)) // Elimina NaN
    );

    // Filtrar submuestras que no tienen el tamaño esperado o están vacías
    const datosValidos = muestrasNumericas.filter(muestra =>
        muestra.length === numMedicionesPorMuestra && muestra.every(num => !isNaN(num))
    );

    if (datosValidos.length === 0) {
        return {
            error: `No se encontraron muestras válidas con ${numMedicionesPorMuestra} mediciones numéricas. Asegúrate de que todas las celdas estén llenas con números.`,
            subgrupoData: [],
            xBarChartData: [],
            rChartData: [],
            limitesXBarra: {},
            limitesR: {},
            promediosGenerales: {}
        };
    }

    // Paso 1: Calcular X-barra y R para cada subgrupo
    const subgruposCalculados = calcularXBarraYRangoPorSubgrupo(datosValidos);

    // Paso 2: Calcular X-doble-barra y R-barra
    const promediosGenerales = calcularPromediosGenerales(subgruposCalculados);

    // Validar si los promedios generales son válidos
    if (isNaN(promediosGenerales.xDoubleBar) || isNaN(promediosGenerales.rBar)) {
        return {
            error: "No se pudieron calcular los promedios generales. Verifica que haya suficientes datos numéricos válidos en las muestras.",
            subgrupoData: [],
            xBarChartData: [],
            rChartData: [],
            limitesXBarra: {},
            limitesR: {},
            promediosGenerales: {}
        };
    }

    // Paso 3: Calcular límites de control
    const limitesXBarra = calcularLimitesControlXBarra(
        promediosGenerales.xDoubleBar,
        promediosGenerales.rBar,
        numMedicionesPorMuestra
    );
    const limitesR = calcularLimitesControlR(
        promediosGenerales.rBar,
        numMedicionesPorMuestra
    );

    // Verificar si los límites son válidos
    if (Object.values(limitesXBarra).some(isNaN) || Object.values(limitesR).some(isNaN)) {
        return {
            error: `No se pudieron calcular los límites de control. El tamaño de la submuestra (${numMedicionesPorMuestra}) podría no estar soportado en la tabla de factores o los datos son insuficientes/inválidos para los cálculos.`,
            subgrupoData: [],
            xBarChartData: [],
            rChartData: [],
            limitesXBarra: {},
            limitesR: {},
            promediosGenerales: {}
        };
    }

    // Preparar datos para las tablas y gráficos
    const subgrupoData = subgruposCalculados.map((item, index) => ({
        muestra: `Muestra ${index + 1}`,
        ...item,
        // Añadir los límites para cada punto del gráfico, simplifica el renderizado con Recharts
        UCL_X: limitesXBarra.UCL_X,
        CL_X: limitesXBarra.CL_X,
        LCL_X: limitesXBarra.LCL_X,
        UCL_R: limitesR.UCL_R,
        CL_R: limitesR.CL_R,
        LCL_R: limitesR.LCL_R,
    }));

    // Recharts espera un array de objetos con las propiedades para cada línea/punto
    const xBarChartData = subgrupoData.map(d => ({
        muestra: d.muestra,
        xBar: d.xBar,
        UCL: d.UCL_X,
        CL: d.CL_X,
        LCL: d.LCL_X,
    }));

    const rChartData = subgrupoData.map(d => ({
        muestra: d.muestra,
        range: d.range,
        UCL: d.UCL_R,
        CL: d.CL_R,
        LCL: d.LCL_R,
    }));

    return {
        error: null,
        subgrupoData, // Datos procesados por subgrupo (para la tabla)
        xBarChartData, // Datos para la gráfica X-Barra
        rChartData, // Datos para la gráfica R
        limitesXBarra,
        limitesR,
        promediosGenerales
    };
}