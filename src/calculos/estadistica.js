// src/calculos/estadistica.js

import * as ss from 'simple-statistics';

// --- Función de redondeo personalizada tipo Excel / Python's round() ---
// Simula el comportamiento de redondeo "round half up".
function roundToDecimalPlaces(value, decimalPlaces) {
    if (typeof value !== 'number' || isNaN(value)) {
        return NaN;
    }
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(value * factor) / factor;
}

function kurtosisExcelStyle(data) {
    const n = data.length;
    if (n < 4) return NaN;

    const mean = data.reduce((a, b) => a + b, 0) / n;
    const m2 = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
    const m4 = data.reduce((sum, x) => sum + Math.pow(x - mean, 4), 0);

    const s2 = m2 / (n - 1); // varianza muestral
    const s4 = Math.pow(s2, 2);

    const numerator = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * (m4 / s4);
    const correction = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    const excessKurtosis = numerator - correction;

    const beta2 = excessKurtosis + 3;

    return excessKurtosis
}



export function calcularEstadisticasDesordenados(datos) {
    if (!Array.isArray(datos) || datos.length === 0) {
        return {
            error: "Los datos deben ser un array de números no vacío."
        };
    }

    const numeros = datos.map(Number).filter(n => !isNaN(n));

    if (numeros.length === 0) {
        return {
            error: "No se encontraron números válidos en los datos."
        };
    }

    const n = numeros.length;
    const sortedNumeros = [...numeros].sort((a, b) => a - b);

    const frecuenciaMap = new Map();
    for (const num of sortedNumeros) {
        frecuenciaMap.set(num, (frecuenciaMap.get(num) || 0) + 1);
    }

    const tablaFrecuencias = [];
    let frecuenciaAcumulada = 0;
    let frecuenciaRelativaAcumulada = 0;

    const valoresUnicos = Array.from(frecuenciaMap.keys()).sort((a, b) => a - b);

    for (const valor of valoresUnicos) {
        const frecuenciaAbsoluta = frecuenciaMap.get(valor);
        const frecuenciaRelativa = frecuenciaAbsoluta / n;
        frecuenciaAcumulada += frecuenciaAbsoluta;
        frecuenciaRelativaAcumulada += frecuenciaRelativa;

        tablaFrecuencias.push({
            valor: roundToDecimalPlaces(valor, 2), // Redondear valores en la tabla
            frecuenciaAbsoluta: frecuenciaAbsoluta,
            frecuenciaRelativa: roundToDecimalPlaces(frecuenciaRelativa, 4), // Redondear a 4 decimales
            frecuenciaAcumulada: frecuenciaAcumulada,
            frecuenciaRelativaAcumulada: roundToDecimalPlaces(frecuenciaRelativaAcumulada, 4) // Redondear a 4 decimales
        });
    }

    // Manejo para datos insuficientes para ciertas estadísticas
    if (n < 2) { // Desviación estándar y varianza requieren al menos 2 datos
        return {
            totalDatos: n,
            tablaFrecuencias: tablaFrecuencias,
            min: numeros.length > 0 ? roundToDecimalPlaces(ss.min(numeros), 2) : "N/A",
            max: numeros.length > 0 ? roundToDecimalPlaces(ss.max(numeros), 2) : "N/A",
            media: numeros.length > 0 ? roundToDecimalPlaces(ss.mean(numeros), 2) : "N/A",
            mediana: numeros.length > 0 ? roundToDecimalPlaces(ss.median(numeros), 2) : "N/A",
            moda: numeros.length > 0 ? (Array.isArray(ss.mode(numeros)) ? ss.mode(numeros).map(m => roundToDecimalPlaces(m, 2)).join(', ') : roundToDecimalPlaces(ss.mode(numeros), 2)) : "N/A",
            desviacionEstandarPoblacional: "N/A",
            desviacionEstandarMuestral: "N/A",
            varianzaPoblacional: "N/A",
            varianzaMuestral: "N/A",
            rango: "N/A",
            primerCuartil: "N/A",
            tercerCuartil: "N/A",
            rangoIntercuartil: "N/A",
            coeficienteAsimetria: "N/A (Datos insuficientes)",
            coeficienteCurtosis: "N/A (Datos insuficientes)",
            datosOriginalesNumericos: numeros
        };
    }

    try {
        const media = roundToDecimalPlaces(ss.mean(numeros), 2);
        const mediana = roundToDecimalPlaces(ss.median(numeros), 2);
        const moda = ss.mode(numeros); // La moda puede ser un array, redondear al final si es número
        const desviacionEstandarPoblacional = roundToDecimalPlaces(ss.standardDeviation(numeros), 2);
        const desviacionEstandarMuestral = roundToDecimalPlaces(ss.sampleStandardDeviation(numeros), 2);
        const varianzaPoblacional = roundToDecimalPlaces(ss.variance(numeros), 2);
        const varianzaMuestral = roundToDecimalPlaces(ss.sampleVariance(numeros), 2);
        const minVal = roundToDecimalPlaces(ss.min(numeros), 2);
        const maxVal = roundToDecimalPlaces(ss.max(numeros), 2);
        const rango = roundToDecimalPlaces(maxVal - minVal, 2);
        const primerCuartil = roundToDecimalPlaces(ss.quantile(sortedNumeros, 0.25), 2);
        const tercerCuartil = roundToDecimalPlaces(ss.quantile(sortedNumeros, 0.75), 2);
        const rangoIntercuartil = roundToDecimalPlaces(tercerCuartil - primerCuartil, 2);
        const coeficienteAsimetria = roundToDecimalPlaces(ss.sampleSkewness(numeros), 2);
        const coeficienteCurtosis = roundToDecimalPlaces(kurtosisExcelStyle(numeros), 2);

        return {
            totalDatos: n,
            tablaFrecuencias: tablaFrecuencias,
            min: minVal,
            max: maxVal,
            media: media,
            mediana: mediana,
            moda: Array.isArray(moda) ? moda.map(m => roundToDecimalPlaces(m, 2)).join(', ') : roundToDecimalPlaces(moda, 2),
            desviacionEstandarPoblacional: desviacionEstandarPoblacional,
            desviacionEstandarMuestral: desviacionEstandarMuestral,
            varianzaPoblacional: varianzaPoblacional,
            varianzaMuestral: varianzaMuestral,
            rango: rango,
            primerCuartil: primerCuartil,
            tercerCuartil: tercerCuartil,
            rangoIntercuartil: rangoIntercuartil,
            coeficienteAsimetria: isNaN(coeficienteAsimetria) ? "N/A" : coeficienteAsimetria,
            coeficienteCurtosis: isNaN(coeficienteCurtosis) ? "N/A" : coeficienteCurtosis,
            datosOriginalesNumericos: numeros
        };
    } catch (e) {
        console.error("Error al calcular estadísticas desordenadas:", e);
        return {
            error: `Ocurrió un error inesperado durante el cálculo: ${e.message}`
        };
    }
}


// --- NUEVA FUNCIÓN: generarClasesDesdeDatos ---
// Ajustada para que arroje resultados más similares al código Python proporcionado.
export function generarClasesDesdeDatos(datosCrudos, numClasesDeseado = null) {
    if (!Array.isArray(datosCrudos) || datosCrudos.length === 0) {
        throw new Error("Se requiere un array de datos no vacío para generar clases.");
    }

    const numeros = datosCrudos.map(Number).filter(n => !isNaN(n));
    if (numeros.length === 0) {
        throw new Error("No se encontraron números válidos para agrupar.");
    }

    const n = numeros.length;
    const minVal = ss.min(numeros);
    const maxVal = ss.max(numeros);
    // Rango redondeado a 4 decimales, como en el script de Python
    const rango = roundToDecimalPlaces(maxVal - minVal, 4);

    let k; // Número de clases
    if (numClasesDeseado && numClasesDeseado > 0) {
        k = numClasesDeseado;
    } else {
        // Regla de Sturges: 1 + 3.3 * log10(n), y luego redondeado.
        k = Math.round(1 + 3.3 * Math.log10(n));
        if (k < 3) k = 3; // Asegurar al menos un número razonable de clases
    }

    // Amplitud de clase (w), usando el k redondeado, y luego redondeada a 4 decimales
    let amplitudClase = roundToDecimalPlaces(rango / k, 4);

    // Manejo para el caso donde todos los datos son idénticos (rango 0)
    if (amplitudClase === 0 && rango === 0 && n > 0) {
        const upper = minVal + 1; // Crea una clase de amplitud 1
        return {
            clases: [{ id: 0, limiteInferior: roundToDecimalPlaces(minVal, 4), limiteSuperior: roundToDecimalPlaces(upper, 4), frecuencia: n }],
            min: roundToDecimalPlaces(minVal, 4),
            max: roundToDecimalPlaces(maxVal, 4),
            rango: roundToDecimalPlaces(rango, 4),
            numeroClases: 1,
            amplitudClase: roundToDecimalPlaces(upper - minVal, 4)
        };
    } else if (amplitudClase === 0 && rango > 0) {
        // Esto podría ocurrir si rango / k es muy pequeño y se redondea a 0.
        // En este caso, reajustamos la amplitud para que sea el rango mismo, haciendo una clase si es posible,
        // o un valor mínimo para evitar bucles infinitos.
        amplitudClase = rango; // Intentar que la amplitud sea al menos el rango total
        if (amplitudClase === 0) amplitudClase = 0.0001; // Asegurar que no sea cero si rango es 0 por algún redondeo
    }


    const clases = [];
    // Los límites se calculan y redondean a 4 decimales, como en el Python
    const lim_inf = [];
    const lim_sup = [];

    for (let i = 0; i < k; i++) {
        let currentLimInf = roundToDecimalPlaces(minVal + i * amplitudClase, 4);
        let currentLimSup = roundToDecimalPlaces(minVal + (i + 1) * amplitudClase, 4);

        lim_inf.push(currentLimInf);
        lim_sup.push(currentLimSup);
    }

    // Ajuste final para asegurar que el último limite superior sea el maxVal, si no ya lo es
    // Y manejar la posible pequeña diferencia que puede resultar de las divisiones de flotantes.
    if (k > 0) {
        const lastCalculatedSup = lim_sup[k - 1];
        const epsilon = 1e-9; // Tolerancia para comparar flotantes

        // Si el valor máximo real no está dentro del último intervalo por un margen pequeño,
        // ajusta el límite superior de la última clase para incluirlo.
        if (maxVal > lastCalculatedSup + epsilon) {
             lim_sup[k - 1] = roundToDecimalPlaces(maxVal, 4);
        } else if (maxVal < lastCalculatedSup - epsilon && maxVal >= lim_inf[k-1] - epsilon){
             // Si el limite superior calculado es mayor al maxVal pero el maxVal está dentro de la clase
             // Ajustar al maxVal si la diferencia es pequeña
             lim_sup[k - 1] = roundToDecimalPlaces(maxVal, 4);
        }
    }


    // Conteo de frecuencias basado en la lógica del script de Python
    for (let i = 0; i < k; i++) {
        let frecuencia = 0;
        const currentLimInf = lim_inf[i];
        const currentLimSup = lim_sup[i];

        for (const num of numeros) {
            // Usamos una pequeña tolerancia (epsilon) para comparaciones de punto flotante
            const epsilon = 1e-9;

            if (i === k - 1) {
                // Última clase: [Li, Ls] (inclusive ambos límites)
                if (num >= currentLimInf - epsilon && num <= currentLimSup + epsilon) {
                    frecuencia++;
                }
            } else {
                // Otras clases: [Li, Ls) (Li inclusive, Ls exclusivo)
                if (num >= currentLimInf - epsilon && num < currentLimSup - epsilon) {
                    frecuencia++;
                }
            }
        }

        clases.push({
            id: i, // Un ID simple para la clase
            limiteInferior: currentLimInf,
            limiteSuperior: currentLimSup,
            frecuencia: frecuencia,
        });
    }

    // Ajuste para asegurar que el total de frecuencias coincida con n
    // Esta parte es CRÍTICA para corregir desvíos.
    const totalFrecuenciasGeneradas = clases.reduce((sum, c) => sum + c.frecuencia, 0);
    if (totalFrecuenciasGeneradas !== n) {
        const diff = n - totalFrecuenciasGeneradas;
        // Distribuir la diferencia, preferentemente a la última clase.
        // Si hay un desajuste negativo o positivo, ajustamos la última clase.
        if (clases.length > 0) {
            clases[clases.length - 1].frecuencia += diff;
        }
    }

    // Calcular marcas de clase después de que los límites estén finalizados
    const marca_clase_output = clases.map(clase => roundToDecimalPlaces((clase.limiteInferior + clase.limiteSuperior) / 2, 4));


    return {
        clases: clases, // Devuelve las clases con sus límites y frecuencias
        min: roundToDecimalPlaces(minVal, 4), // Redondeado a 4 como en Python
        max: roundToDecimalPlaces(maxVal, 4), // Redondeado a 4 como en Python
        rango: rango, // Ya redondeado
        numeroClases: k, // Ya redondeado
        amplitudClase: amplitudClase, // Ya redondeada
        marcaClaseOutput: marca_clase_output // Marcas de clase calculadas y redondeadas
    };
}


// --- Función para calcular estadísticas de Datos Agrupados ---
export function calcularEstadisticasOrdenados(datosCrudos) { // Cambiado a datosCrudos para pasar directamente
    let clases;
    let minOverall, maxOverall, rango, numeroClases, amplitudClase;
    let marcaClaseOutput; // Para almacenar las marcas de clase generadas

    // Se asume que datosCrudos es el array de datos crudos
    const numeros = datosCrudos.map(Number).filter(n => !isNaN(n));
    try {
        const generated = generarClasesDesdeDatos(numeros); // Pasa los datos crudos a generarClasesDesdeDatos
        clases = generated.clases;
        minOverall = generated.min;
        maxOverall = generated.max;
        rango = generated.rango;
        numeroClases = generated.numeroClases;
        amplitudClase = generated.amplitudClase;
        marcaClaseOutput = generated.marcaClaseOutput; // Obtener las marcas de clase de la función de generación
    } catch (error) {
        return { error: `Error al generar clases: ${error.message}` };
    }


    if (!Array.isArray(clases) || clases.length === 0) {
        return { error: "No hay clases válidas para calcular estadísticas agrupadas." };
    }

    const clasesValidas = clases.every(clase =>
        typeof clase.limiteInferior === 'number' &&
        typeof clase.limiteSuperior === 'number' &&
        typeof clase.frecuencia === 'number' &&
        clase.frecuencia >= 0
    );

    if (!clasesValidas) {
        return {
            error: "Cada clase debe tener límite inferior, límite superior y frecuencia como números válidos."
        };
    }

    let totalDatos = 0;
    let sumaPuntosMediosPorFrecuencia = 0;
    const tablaDistribucionFrecuencias = [];

    // Calcular el total de datos primero
    for (const clase of clases) {
        totalDatos += clase.frecuencia;
    }

    if (totalDatos === 0) {
        return { error: "La suma de las frecuencias es cero, no hay datos para calcular." };
    }

    // Construir la tabla de distribución de frecuencias y calcular suma de puntos medios
    let frecuenciaAcumuladaGlobal = 0;
    for (let i = 0; i < clases.length; i++) {
        const clase = clases[i];
        const puntoMedio = marcaClaseOutput[i]; // Usar la marca de clase ya calculada y redondeada

        frecuenciaAcumuladaGlobal += clase.frecuencia;
        const frecuenciaRelativa = clase.frecuencia / totalDatos;
        const frecuenciaRelativaAcumulada = frecuenciaAcumuladaGlobal / totalDatos;

        // Formatear el string de la clase para que el último intervalo sea inclusivo [Li - Ls]
        const claseString = (i === clases.length - 1) ?
            `[${roundToDecimalPlaces(clase.limiteInferior, 2)} - ${roundToDecimalPlaces(clase.limiteSuperior, 2)}]` :
            `[${roundToDecimalPlaces(clase.limiteInferior, 2)} - ${roundToDecimalPlaces(clase.limiteSuperior, 2)})`;

        tablaDistribucionFrecuencias.push({
            clase: claseString,
            marcaClase: roundToDecimalPlaces(puntoMedio, 4), // Asegurar redondeo para la tabla
            frecuenciaAbsoluta: clase.frecuencia,
            frecuenciaRelativa: roundToDecimalPlaces(frecuenciaRelativa, 4),
            frecuenciaAcumulada: frecuenciaAcumuladaGlobal,
            frecuenciaRelativaAcumulada: roundToDecimalPlaces(frecuenciaRelativaAcumulada, 4),
        });
        sumaPuntosMediosPorFrecuencia += puntoMedio * clase.frecuencia;
    }

    try {
        // La media para datos agrupados es `suma(marcaClase * frecuencia) / totalDatos`
        const mediaAgrupada = roundToDecimalPlaces(sumaPuntosMediosPorFrecuencia / totalDatos, 4); // Redondeo a 4 decimales

        // --- Mediana (interpolada para datos agrupados) ---
        // Se mantiene la lógica de cálculo, pero el valor final redondeado
        const posicionMediana = totalDatos / 2;
        let claseMediana = null;
        let F_anterior_mediana = 0; // Frecuencia acumulada anterior a la clase mediana

        for (let i = 0; i < tablaDistribucionFrecuencias.length; i++) {
            if (tablaDistribucionFrecuencias[i].frecuenciaAcumulada >= posicionMediana) {
                claseMediana = clases[i]; // Obtener la clase original para sus límites
                if (i > 0) {
                    F_anterior_mediana = tablaDistribucionFrecuencias[i - 1].frecuenciaAcumulada;
                }
                break;
            }
        }

        let medianaAgrupada = null;
        if (claseMediana && claseMediana.frecuencia > 0) {
            const Li_mediana = claseMediana.limiteInferior;
            const fi_mediana = claseMediana.frecuencia;
            // Usa la amplitud calculada globalmente para asegurar consistencia
            const amplitud_mediana = amplitudClase;
            medianaAgrupada = roundToDecimalPlaces(Li_mediana + ((posicionMediana - F_anterior_mediana) / fi_mediana) * amplitud_mediana, 4); // Redondeo a 4 decimales
        } else {
            medianaAgrupada = NaN;
        }

        // --- Moda (interpolada para datos agrupados) ---
        // Se mantiene la lógica de cálculo, pero el valor final redondeado
        let claseModal = null;
        let maxFrecuenciaClase = 0;
        let countModaClases = 0; // Para detectar múltiples modas

        for (const clase of clases) {
            if (clase.frecuencia > maxFrecuenciaClase) {
                maxFrecuenciaClase = clase.frecuencia;
                claseModal = clase;
                countModaClases = 1;
            } else if (clase.frecuencia === maxFrecuenciaClase && maxFrecuenciaClase > 0) {
                countModaClases++;
            }
        }

        let modaAgrupada = null;
        if (claseModal && maxFrecuenciaClase > 0) {
            if (countModaClases > 1) { // Múltiples clases modales
                const modalClasses = clases.filter(c => c.frecuencia === maxFrecuenciaClase);
                modaAgrupada = modalClasses.map(c => roundToDecimalPlaces(((c.limiteInferior + c.limiteSuperior) / 2), 4)).join(', '); // Redondeo a 4 decimales
            } else {
                const indexClaseModal = clases.findIndex(c => c.id === claseModal.id);
                const freqAnterior = (indexClaseModal > 0) ? clases[indexClaseModal - 1].frecuencia : 0;
                const freqSiguiente = (indexClaseModal < clases.length - 1) ? clases[indexClaseModal + 1].frecuencia : 0;
                const d1 = maxFrecuenciaClase - freqAnterior;
                const d2 = maxFrecuenciaClase - freqSiguiente;
                // Usa la amplitud calculada globalmente para asegurar consistencia
                const amplitudModal = amplitudClase;

                if (d1 + d2 === 0) { // Si d1 + d2 es 0, significa que la frecuencia modal es igual a las adyacentes, o solo hay una clase.
                    modaAgrupada = roundToDecimalPlaces((claseModal.limiteInferior + claseModal.limiteSuperior) / 2, 4); // Redondeo a 4 decimales
                } else {
                    modaAgrupada = roundToDecimalPlaces(claseModal.limiteInferior + (d1 / (d1 + d2)) * amplitudModal, 4); // Redondeo a 4 decimales
                }
            }
        } else {
            modaAgrupada = NaN;
        }


        // --- Desviación estándar y Varianza para Datos Agrupados (usando las fórmulas agrupadas) ---
        // Para calcular la varianza y desviación estándar de datos AGRUPADOS, se usa una fórmula diferente
        // que la de datos desordenados.
        // Varianza Agrupada (muestral): Sum[(marca_clase - media_agrupada)^2 * frecuencia] / (n-1)
        let sumSquaredDifferences = 0;
        for (let i = 0; i < clases.length; i++) {
            const clase = clases[i];
            const puntoMedio = marcaClaseOutput[i]; // Usa la marca de clase ya calculada y redondeada
            sumSquaredDifferences += Math.pow(puntoMedio - mediaAgrupada, 2) * clase.frecuencia;
        }

        const varianzaMuestralAgrupada = totalDatos > 1 ? sumSquaredDifferences / (totalDatos - 1) : NaN;
        const desviacionEstandarMuestralAgrupada = Math.sqrt(varianzaMuestralAgrupada);

        const varianzaPoblacionalAgrupada = totalDatos > 0 ? sumSquaredDifferences / totalDatos : NaN;
        const desviacionEstandarPoblacionalAgrupada = Math.sqrt(varianzaPoblacionalAgrupada);

        // Curtosis y Asimetría para datos no agrupados, ya que se calculan sobre los 'numeros' originales
        const coeficienteAsimetria = roundToDecimalPlaces(ss.sampleSkewness(numeros), 4); // Redondeo a 4 decimales
        const coeficienteCurtosis = roundToDecimalPlaces(kurtosisExcelStyle(numeros), 4); // Redondeo a 4 decimales


        return {
            totalDatos: totalDatos,
            min: minOverall,
            max: maxOverall,
            rango: rango,
            numeroClases: numeroClases,
            amplitudClase: amplitudClase,
            // Usamos las estadísticas calculadas para datos agrupados
            media: mediaAgrupada,
            mediana: isNaN(medianaAgrupada) ? "N/A" : medianaAgrupada,
            moda: isNaN(modaAgrupada) ? "N/A" : modaAgrupada,
            desviacionEstandarPoblacional: isNaN(desviacionEstandarPoblacionalAgrupada) ? "N/A" : roundToDecimalPlaces(desviacionEstandarPoblacionalAgrupada, 4),
            desviacionEstandarMuestral: isNaN(desviacionEstandarMuestralAgrupada) ? "N/A" : roundToDecimalPlaces(desviacionEstandarMuestralAgrupada, 4),
            varianzaPoblacional: isNaN(varianzaPoblacionalAgrupada) ? "N/A" : roundToDecimalPlaces(varianzaPoblacionalAgrupada, 4),
            varianzaMuestral: isNaN(varianzaMuestralAgrupada) ? "N/A" : roundToDecimalPlaces(varianzaMuestralAgrupada, 4),
            tablaDistribucionFrecuencias: tablaDistribucionFrecuencias,
            primerCuartil: "N/A (no se muestra)", // Cuartiles interpolados para agrupados son más complejos
            tercerCuartil: "N/A (no se muestra)",
            rangoIntercuartil: "N/A (no se muestra)",
            coeficienteAsimetria: isNaN(coeficienteAsimetria) ? "N/A" : coeficienteAsimetria,
            coeficienteCurtosis: isNaN(coeficienteCurtosis) ? "N/A" : coeficienteCurtosis,
        };

    } catch (e) {
        console.error("Error al calcular estadísticas agrupadas:", e);
        return {
            error: `Ocurrió un error inesperado durante el cálculo: ${e.message}`
        };
    }
}