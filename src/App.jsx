// src/App.js

import { useState, useRef, useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import { Row, Col, Form, Button, Table, Alert } from 'react-bootstrap';
import './App.css';
import { calcularEstadisticasDesordenados, calcularEstadisticasOrdenados, generarClasesDesdeDatos } from './calculos/estadistica';
import { calcularGraficaXR } from './calculos/grafico'; // Asegúrate de que el import sea correcto si lo habías cambiado a 'grafico'
import { VictoryBoxPlot, VictoryChart, VictoryAxis } from 'victory'; // Importa Victory components


// Importar componentes de Recharts
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

function App() {
  // Estados para la nueva interfaz de entrada de datos
  const [datosInputDesordenados, setDatosInputDesordenados] = useState(''); // Campo de texto para los datos crudos
  const [mostrarResultadosDe, setMostrarResultadosDe] = useState(null); // 'desordenados' o 'agrupados'

  // Estados para almacenar los resultados y datos procesados
  const [resultadosEstadisticos, setResultadosEstadisticos] = useState(null);
  const [numerosValidos, setNumerosValidos] = useState([]); // Para el Box Plot de datos desordenados

  // Estados relacionados con datos agrupados (aunque ahora se autogeneran, aún los necesitamos)
  const [clasesDatosOrdenados, setClasesDatosOrdenados] = useState([]);
  const [clasesErrores, setClasesErrores] = useState(new Map());
  const inputRefs = useRef([]);

  // ESTADOS PARA GRÁFICA X-R
  const [mostrarControlXR, setMostrarControlXR] = useState(false); // Controla la visibilidad del Card X-R
  // Nuevo estado para la entrada de datos XR en formato de texto
  const [datosXRInputText, setDatosXRInputText] = useState('');
  // Ya no necesitamos numMedicionesPorMuestra como estado editable por el usuario, se inferirá.
  // const [numMedicionesPorMuestra, setNumMedicionesPorMuestra] = useState(2); // Número inicial de columnas

  // Estado para almacenar los resultados de la gráfica XR
  const [resultadosGraficaXR, setResultadosGraficaXR] = useState(null);


  // --- Funciones de Descripción de Forma (Asimetría y Curtosis) ---
  const getDescripcionAsimetria = (coeficiente) => {
    const valor = parseFloat(coeficiente);
    if (isNaN(valor)) {
      return "No disponible";
    }
    if (valor > 0.5) {
      return "Asimétrica Positiva (sesgada a la derecha). La cola de la distribución se extiende hacia valores más altos.";
    } else if (valor < -0.5) {
      return "Asimétrica Negativa (sesgada a la izquierda). La cola de la distribución se extiende hacia valores más bajos.";
    } else if (valor >= -0.5 && valor <= 0.5) {
      return "Aproximadamente Simétrica. Los datos se distribuyen de manera similar a ambos lados de la media.";
    } else {
      return "Simétrica. Los datos están distribuidos uniformemente alrededor de la media.";
    }
  };

  const getDescripcionCurtosis = (coeficiente) => {
    const valor = parseFloat(coeficiente);
    if (isNaN(valor)) {
      return "No disponible";
    }
    if (valor > 0.5) {
      return "Leptocúrtica. La distribución es más 'apuntada' y tiene colas más pesadas que una distribución normal (más valores atípicos).";
    } else if (valor < -0.5) {
      return "Platicúrtica. La distribución es más 'aplanada' y tiene colas más ligeras que una distribución normal (menos valores atípicos).";
    } else if (valor >= -0.5 && valor <= 0.5) {
      return "Mesocúrtica. La distribución es similar en apuntamiento y forma a una distribución normal.";
    } else {
      return "Mesocúrtica. La distribución es similar en apuntamiento y forma a una distribución normal.";
    }
  };

  // --- Manejadores de Eventos ---

  const handleDatosInputChangeDesordenados = (e) => {
    setDatosInputDesordenados(e.target.value);
    setResultadosEstadisticos(null);
    setMostrarResultadosDe(null);
    setNumerosValidos([]);
    setResultadosGraficaXR(null);
  };

  const handleProcesarDatosDesordenados = () => {
    const numerosString = datosInputDesordenados.split(',').map(s => s.trim());
    const numeros = numerosString
      .filter(s => s !== '')
      .map(s => parseFloat(s));

    const sonTodosNumeros = numeros.every(num => !isNaN(num));

    if (sonTodosNumeros && numeros.length > 0) {
      setNumerosValidos(numeros);
      const resultados = calcularEstadisticasDesordenados(numeros);
      setResultadosEstadisticos(resultados);
      console.log("Resultados estadísticos (desordenados):", resultados);
      setMostrarResultadosDe('desordenados');
      setMostrarControlXR(false);
      setResultadosGraficaXR(null);
    } else {
      alert("Por favor, ingresa solo números válidos separados por comas. Ejemplo: 5,6,8,1.2");
      setResultadosEstadisticos(null);
      setMostrarResultsOf(null);
      setNumerosValidos([]);
      setMostrarControlXR(false);
      setResultadosGraficaXR(null);
    }
  };

  const handleAgruparYProcesar = () => {
    const numerosString = datosInputDesordenados.split(',').map(s => s.trim());
    const numerosCrudos = numerosString
      .filter(s => s !== '')
      .map(s => parseFloat(s));

    const sonTodosNumeros = numerosCrudos.every(num => !isNaN(num));

    if (sonTodosNumeros && numerosCrudos.length > 0) {
      try {
        setNumerosValidos(numerosCrudos);
        const resultados = calcularEstadisticasOrdenados(numerosCrudos);

        if (resultados.error) {
          alert("No se pudieron generar clases válidas o hubo un error al agrupar los datos: " + resultados.error);
          setResultadosEstadisticos(null);
          // setMostrarResultsOf(null);
          setResultadosGraficaXR(null);
          return;
        }

        setResultadosEstadisticos(resultados);
        console.log("Resultados estadísticos (agrupados):", resultados);
        setMostrarResultsOf('agrupados');
        setMostrarControlXR(false);
        setResultadosGraficaXR(null);

      } catch (error) {
        alert("Error al agrupar los datos: " + error.message);
        setResultadosEstadisticos(null);
        // setMostrarResultsOf(null);
        setResultadosGraficaXR(null);
      }

    } else {
      alert("Para agrupar y procesar, por favor, ingresa solo números válidos separados por comas. Ejemplo: 5,6,8,1.2");
      setResultadosEstadisticos(null);
      setMostrarResultsOf(null);
      setResultadosGraficaXR(null);
    }
  };

  const handleMostrarGraficaXR = () => {
    setMostrarControlXR(true);
    setResultadosEstadisticos(null);
    setMostrarResultsOf(null);
    setDatosInputDesordenados('');
    setResultadosGraficaXR(null);
    setDatosXRInputText(''); // Limpiar el campo de texto XR al cambiar a esta vista
  };

  const handleVolverAlInicio = () => {
    setMostrarControlXR(false);
    setDatosInputDesordenados('');
    setResultadosEstadisticos(null);
    setMostrarResultsOf(null);
    setNumerosValidos([]);
    setResultadosGraficaXR(null);
    setDatosXRInputText(''); // Limpiar el campo de texto XR al volver al inicio
  };

  // --- NUEVO MANEJADOR para la entrada de texto de datos X-R ---
  const handleDatosXRInputChange = (e) => {
    setDatosXRInputText(e.target.value);
    setResultadosGraficaXR(null); // Limpiar resultados al modificar los datos
  };

  const handleCalcularGraficaXR = () => {
    // Parsear el texto de entrada
    const lineas = datosXRInputText.split('\n').map(line => line.trim()).filter(line => line !== '');
    let datosParaCalculo = [];
    let n = -1; // Para almacenar el número de mediciones por muestra

    if (lineas.length === 0) {
      alert("Por favor, ingresa los datos para la gráfica X-R.");
      setResultadosGraficaXR(null);
      return;
    }

    for (const linea of lineas) {
      const medicionesString = linea.split(',').map(s => s.trim()).filter(s => s !== '');
      const medicionesNumericas = medicionesString.map(s => parseFloat(s));

      // Validar que todas las mediciones en la línea son números
      if (medicionesNumericas.some(isNaN) || medicionesNumericas.length === 0) {
        alert(`Error en la línea: "${linea}". Asegúrate de que todas las mediciones sean números válidos separados por comas.`);
        setResultadosGraficaXR(null);
        return;
      }

      // Validar que todas las muestras tienen el mismo número de mediciones
      if (n === -1) {
        n = medicionesNumericas.length; // Establece n con la primera muestra
      } else if (medicionesNumericas.length !== n) {
        alert(`Error: El número de mediciones en la muestra "${linea}" no coincide con el número de mediciones de las muestras anteriores (${n}). Todas las muestras deben tener el mismo número de mediciones.`);
        setResultadosGraficaXR(null);
        return;
      }

      datosParaCalculo.push(medicionesNumericas);
    }

    // Ahora, `datosParaCalculo` es un array de arrays, y `n` es el número de mediciones por muestra.
    // Esto es exactamente lo que `calcularGraficaXR` espera.
    const resultados = calcularGraficaXR(datosParaCalculo, n);

    if (resultados.error) {
      alert("Error al calcular la Gráfica X-R: " + resultados.error);
      setResultadosGraficaXR(null);
      return;
    }

    console.log("Resultados X-R calculados:", resultados);
    setResultadosGraficaXR(resultados);
  };

  // Helper para asignar los resultados de visualización
  const setMostrarResultsOf = (type) => {
    setMostrarResultadosDe(type);
  };

  // --- Renderizado del Componente ---
  return (
    <div className="container my-5">
      <h1 className='text-start mb-4'>Control Estadístico</h1>

      {/* Sección de ingreso de datos principal y botones, SOLO visible si mostrarControlXR es false */}
      {!mostrarControlXR && (
        <Card>
          <Card.Header>
            <h3 className="fw-bold text-center text-primary">
              Ingrese los datos
            </h3>
          </Card.Header>
          <Card.Body>
            <>
              <Form.Group className="mb-3">
                <Form.Label>Valores (separados por comas, ej: 5,6,8,1.2)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={datosInputDesordenados}
                  onChange={handleDatosInputChangeDesordenados}
                  placeholder="Ej: 5, 6, 8, 1.2, 7.5"
                />
              </Form.Group>
              <div className="d-flex justify-content-between mt-4">
                <div className='p-1'>
                  <Button variant="primary" onClick={handleProcesarDatosDesordenados}>
                    Procesar Datos Desordenados
                  </Button>
                </div>
                <div className='p-1'>
                  <Button variant="info" onClick={handleAgruparYProcesar}>
                    Agrupar y Procesar Datos
                  </Button>
                </div>
                <div className='p-1'>
                  <Button variant="success" onClick={handleMostrarGraficaXR}>
                    Gráfica X-R
                  </Button>
                </div>
              </div>

            </>
          </Card.Body>
        </Card>
      )}

      {/* SECCIÓN DE GRÁFICA X-R - Renderizado Condicional */}
      {mostrarControlXR && (
        <Card className="mt-4">
          <Card.Header>
            <h3 className="fw-bold text-center text-primary">
              Entrada de Datos para Gráfica de Control X-R
            </h3>
            <div className="d-flex justify-content-end">
              <Button variant="outline-secondary" size="sm" onClick={handleVolverAlInicio}>
                Volver al Inicio
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Ingrese las mediciones por muestra/elemento (una muestra por línea, mediciones separadas por comas).
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={datosXRInputText}
                onChange={handleDatosXRInputChange}
                placeholder="Ejemplo:
5.1, 5.2, 5.0, 5.3
5.0, 5.1, 4.9, 5.2
4.8, 5.0, 5.1, 5.0"
              />
            </Form.Group>
            <div className="d-flex justify-content-end mt-3">
              <Button variant="success" onClick={handleCalcularGraficaXR}>
                Calcular Gráfica X-R
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}


      {/* SECCIÓN DE RESULTADOS DE GRÁFICA X-R */}
      {mostrarControlXR && resultadosGraficaXR && !resultadosGraficaXR.error && (
        <div className="mt-5">
          <h4 className="fw-bold text-center text-primary mb-4">Resultados de Gráficas de Control X-R</h4>

          {/* Tabla de Valores Calculados por Subgrupo */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="fw-bold text-center">Valores Calculados por Subgrupo</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Muestra</th>
                    <th>X-barra (Promedio)</th>
                    <th>Rango (R)</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadosGraficaXR.subgrupoData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.muestra}</td>
                      <td>{item.xBar.toFixed(4)}</td>
                      <td>{item.range.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Límites de Control Generales */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="fw-bold text-center">Límites de Control y Promedios Generales</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>Gráfica X-barra (Promedios)</h6>
                  <p><strong>Línea Central (CL):</strong> {resultadosGraficaXR.limitesXBarra.CL_X.toFixed(4)}</p>
                  <p><strong>Límite Control Superior (UCL):</strong> {resultadosGraficaXR.limitesXBarra.UCL_X.toFixed(4)}</p>
                  <p><strong>Límite Control Inferior (LCL):</strong> {resultadosGraficaXR.limitesXBarra.LCL_X.toFixed(4)}</p>
                </Col>
                <Col md={6}>
                  <h6>Gráfica R (Rangos)</h6>
                  <p><strong>Línea Central (CL):</strong> {resultadosGraficaXR.limitesR.CL_R.toFixed(4)}</p>
                  <p><strong>Límite Control Superior (UCL):</strong> {resultadosGraficaXR.limitesR.UCL_R.toFixed(4)}</p>
                  <p><strong>Límite Control Inferior (LCL):</strong> {resultadosGraficaXR.limitesR.LCL_R.toFixed(4)}</p>
                </Col>
              </Row>
              <p className="mt-3"><strong>Promedio General de X-barras (X̅̅):</strong> {resultadosGraficaXR.promediosGenerales.xDoubleBar.toFixed(4)}</p>
              <p><strong>Promedio General de Rangos (R̅):</strong> {resultadosGraficaXR.promediosGenerales.rBar.toFixed(4)}</p>
            </Card.Body>
          </Card>

          {/* GRÁFICO X-BARRA */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="fw-bold text-center">Gráfica de Control X-barra</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={resultadosGraficaXR.xBarChartData}
                  margin={{ top: 20, right: 30, left: 70, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="muestra" />
                  <YAxis label={{ value: "Valor de X-barra", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  {/* Puntos de X-barra */}
                  <Line type="monotone" dataKey="xBar" stroke="#8884d8" name="X-barra" dot={true} />
                  {/* Líneas de Control - Usamos ReferenceLine para mayor claridad */}
                  <ReferenceLine y={resultadosGraficaXR.limitesXBarra.UCL_X} stroke="red" strokeDasharray="5 5" label={{ value: `LCS: ${resultadosGraficaXR.limitesXBarra.UCL_X.toFixed(4)}`, position: "top" }} />
                  <ReferenceLine y={resultadosGraficaXR.limitesXBarra.CL_X} stroke="green" label={{ value: `LC: ${resultadosGraficaXR.limitesXBarra.CL_X.toFixed(4)}`, position: "top" }} />
                  <ReferenceLine y={resultadosGraficaXR.limitesXBarra.LCL_X} stroke="red" strokeDasharray="5 5" label={{ value: `LCI: ${resultadosGraficaXR.limitesXBarra.LCL_X.toFixed(4)}`, position: "bottom" }} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>

          {/* GRÁFICO R */}
          <Card>
            <Card.Header>
              <h5 className="fw-bold text-center">Gráfica de Control R</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={resultadosGraficaXR.rChartData}
                  margin={{ top: 20, right: 30, left: 70, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="muestra" />
                  <YAxis label={{ value: "Valor del Rango", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  {/* Puntos de Rango */}
                  <Line type="monotone" dataKey="range" stroke="#82ca9d" name="Rango" dot={true} />
                  {/* Líneas de Control - Usamos ReferenceLine para mayor claridad */}
                  <ReferenceLine y={resultadosGraficaXR.limitesR.UCL_R} stroke="red" strokeDasharray="5 5" label={{ value: `LCS: ${resultadosGraficaXR.limitesR.UCL_R.toFixed(4)}`, position: "top" }} />
                  <ReferenceLine y={resultadosGraficaXR.limitesR.CL_R} stroke="green" label={{ value: `LC: ${resultadosGraficaXR.limitesR.CL_R.toFixed(4)}`, position: "top" }} />
                  <ReferenceLine y={resultadosGraficaXR.limitesR.LCL_R} stroke="red" strokeDasharray="5 5" label={{ value: `LCI: ${resultadosGraficaXR.limitesR.LCL_R.toFixed(4)}`, position: "bottom" }} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </div>
      )}


      {/* SECCIÓN DE RESULTADOS ESTADÍSTICOS Y GRÁFICOS (Original) */}
      {!mostrarControlXR && resultadosEstadisticos ? (
        resultadosEstadisticos.error ? (
          <Alert variant="danger" className="mt-4">
            Error: {resultadosEstadisticos.error}
          </Alert>
        ) : (
          <>
            {/* Resultados de Desordenados */}
            {mostrarResultadosDe === 'desordenados' && (
              <div>
                <Row>
                  <Col>
                    <Card className="mt-4 text-start p-3 ">
                      <Card.Header className="bg-green rounded-t-lg py-3">Tendencia Central</Card.Header>
                      <Card.Body className='p-0 pt-2'>
                        <p><strong>Media :</strong> {resultadosEstadisticos.media}</p>
                        <p><strong>Mediana:</strong> {resultadosEstadisticos.mediana}</p>
                        <p><strong>Moda:</strong> {resultadosEstadisticos.moda}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col>
                    <Card className="mt-4 text-start p-3">
                      <Card.Header className="bg-green rounded-t-lg py-3">Medidas de dispersion</Card.Header>
                      <Card.Body className='p-0 pt-2'>
                        <p><strong>Desviación Estándar Poblacional :</strong> {resultadosEstadisticos.desviacionEstandarPoblacional}</p>
                        <p><strong>Desviación Estándar Muestral :</strong> {resultadosEstadisticos.desviacionEstandarMuestral}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Card className="mt-4 text-start p-3">
                      <Card.Header className="bg-green rounded-t-lg py-3">Medidas de Forma</Card.Header>
                      <Card.Body className='p-0 pt-2'>
                        <p>
                          <strong>Coeficiente de Asimetría :</strong> {resultadosEstadisticos.coeficienteAsimetria}
                          <br />
                          <small>{getDescripcionAsimetria(resultadosEstadisticos.coeficienteAsimetria)}</small>
                        </p>
                        <p>
                          <strong>Coeficiente de Curtosis :</strong> {resultadosEstadisticos.coeficienteCurtosis}
                          <br />
                          <small>{getDescripcionCurtosis(resultadosEstadisticos.coeficienteCurtosis)}</small>
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col>
                    <Card className="mt-4 text-start p-3">
                      <Card.Header className="bg-green rounded-t-lg py-3">Cuartiles y Valores extremos</Card.Header>
                      <Card.Body className='p-0 pt-2'>
                        <p><strong>Valor Maximo :</strong> {resultadosEstadisticos.max}</p>
                        <p><strong>Valor Minimo :</strong> {resultadosEstadisticos.min}</p>
                        <p><strong>Q1 :</strong> {resultadosEstadisticos.primerCuartil}</p>
                        <p><strong>Q3 :</strong> {resultadosEstadisticos.tercerCuartil}</p>
                        <p><strong>IQR :</strong> {resultadosEstadisticos.rangoIntercuartil}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* Resultados de Agrupados */}
            {mostrarResultadosDe === 'agrupados' && (
              <div>
                <Row>
                  <Col>
                    <Card className="mt-4 text-start p-3 ">
                      <Card.Header className="bg-green rounded-t-lg py-3">Tendencia Central</Card.Header>
                      <Card.Body className='p-0 pt-2'>
                        <p><strong>Media :</strong> {resultadosEstadisticos.media}</p>
                        <p><strong>Mediana:</strong> {resultadosEstadisticos.mediana}</p>
                        <p><strong>Moda:</strong> {resultadosEstadisticos.moda}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col>
                    <Card className="mt-4 text-start p-3">
                      <Card.Header className="bg-green rounded-t-lg py-3">Medidas de dispersion</Card.Header>
                      <Card.Body className='p-0 pt-2'>
                        <p><strong>Desviación Estándar Poblacional :</strong> {resultadosEstadisticos.desviacionEstandarPoblacional}</p>
                        <p><strong>Desviación Estándar Muestral :</strong> {resultadosEstadisticos.desviacionEstandarMuestral}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Card className="mt-4 text-start p-3">
                      <Card.Header className="bg-green rounded-t-lg py-3">Informacion General</Card.Header>
                      <Card.Body className='p-0 pt-2'>
                        <p><strong>Valor Maximo :</strong> {resultadosEstadisticos.max}</p>
                        <p><strong>Valor Minimo :</strong> {resultadosEstadisticos.min}</p>
                        <p><strong>Numero de clases :</strong> {resultadosEstadisticos.numeroClases}</p>
                        <p><strong>Rango :</strong> {resultadosEstadisticos.rango}</p>
                        <p><strong>Amplitud :</strong> {resultadosEstadisticos.amplitudClase}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col>
                    <Card className="mt-4 text-start p-3">
                      <Card.Header className="bg-green rounded-t-lg py-3">Medidas de Forma</Card.Header>
                      <Card.Body className='p-0 pt-2'>
                        <p>
                          <strong>Coeficiente de Asimetría :</strong> {resultadosEstadisticos.coeficienteAsimetria}
                          <br />
                          <small>{getDescripcionAsimetria(resultadosEstadisticos.coeficienteAsimetria)}</small>
                        </p>
                        <p>
                          <strong>Coeficiente de Curtosis :</strong> {resultadosEstadisticos.coeficienteCurtosis}
                          <br />
                          <small>{getDescripcionCurtosis(resultadosEstadisticos.coeficienteCurtosis)}</small>
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            <Card className="mt-4">
              <Card.Header><h3 className="fw-bold text-center text-primary">Resultados Estadísticos</h3> <div className='mb-0'><p><strong>Total de Datos (n):</strong> {resultadosEstadisticos.totalDatos}</p></div></Card.Header>
              <Card.Body>
                {/* Resultados para Datos Desordenados (Tablas y Gráficos) */}
                {mostrarResultadosDe === "desordenados" && (
                  <>
                    <h5 className="mb-3">Tabla de Frecuencias</h5>
                    <Table striped bordered hover responsive size="sm" className="mb-4">
                      <thead>
                        <tr>
                          <th>Valor</th>
                          <th>Frecuencia Absoluta </th>
                          <th>Frecuencia Relativa </th>
                          <th>Frecuencia Acumulada </th>
                          <th>Frecuencia Relativa Acumulada </th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadosEstadisticos.tablaFrecuencias.map((fila, index) => (
                          <tr key={index}>
                            <td>{fila.valor}</td>
                            <td>{fila.frecuenciaAbsoluta}</td>
                            <td>{fila.frecuenciaRelativa.toFixed(4)}</td>
                            <td>{fila.frecuenciaAcumulada}</td>
                            <td>{fila.frecuenciaRelativaAcumulada.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <h5 className="mb-3 mt-4">Gráfico de Frecuencias (Histograma)</h5>
                    {resultadosEstadisticos.tablaFrecuencias && resultadosEstadisticos.tablaFrecuencias.length > 0 && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                          data={resultadosEstadisticos.tablaFrecuencias}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="valor" label={{ value: "Valor", position: "insideBottom", offset: 0 }} />
                          <YAxis
                            label={{ value: "Frecuencia Absoluta", angle: -90, position: "insideBottomLeft", offset: 0 }}
                            tickFormatter={(tick) => Math.floor(tick).toString()}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="frecuenciaAbsoluta" fill="#8884d8" name="Frecuencia Absoluta" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {resultadosEstadisticos.tablaFrecuencias && resultadosEstadisticos.tablaFrecuencias.length === 0 && (
                      <p>No hay datos de frecuencia para mostrar el histograma.</p>
                    )}

                    <h5 className="mb-3 mt-4">Gráfico de Frecuencia Acumulada</h5>
                    {resultadosEstadisticos.tablaFrecuencias && resultadosEstadisticos.tablaFrecuencias.length > 0 && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                          data={resultadosEstadisticos.tablaFrecuencias}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="valor" label={{ value: "Valor", position: "insideBottom", offset: 0 }} />
                          <YAxis
                            label={{ value: "Frecuencia Acumulada", angle: -90, position: "insideBottomLeft", }}
                            tickFormatter={(tick) => Math.floor(tick).toString()}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="frecuenciaAcumulada" fill="#FF5733" name="Frecuencia Acumulada" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {resultadosEstadisticos.tablaFrecuencias && resultadosEstadisticos.tablaFrecuencias.length === 0 && (
                      <p>No hay datos de frecuencia acumulada para mostrar el gráfico.</p>
                    )}

                    {/* DIAGRAMA DE CAJA Y BIGOTES */}
                    <h5 className="mb-3 mt-4">Diagrama de Caja</h5>
                    {numerosValidos.length > 0 ? (
                      <VictoryChart domainPadding={20}>
                        <VictoryAxis
                          tickFormat={() => ""}
                          label="Datos"
                        />
                        <VictoryAxis
                          dependentAxis
                          label="Valor"
                          tickFormat={(tick) => tick.toFixed(2)}
                        />
                        <VictoryBoxPlot
                          data={numerosValidos.map(num => ({ x: 1, y: num }))}
                          boxWidth={20}
                          style={{
                            max: { stroke: "blue", strokeWidth: 2 },
                            min: { stroke: "blue", strokeWidth: 2 },
                            q1: { fill: "lightblue", stroke: "black" },
                            q3: { fill: "lightblue", stroke: "black" },
                            median: { stroke: "darkgreen", strokeWidth: 3 },
                            outliers: { fill: "red", stroke: "black", size: 5 },
                          }}
                        />
                      </VictoryChart>
                    ) : (
                      <p>Ingrese datos para mostrar el diagrama de caja y bigotes.</p>
                    )}
                    {/* FIN DEL DIAGRAMA DE CAJA Y BIGOTES */}
                  </>
                )}

                {/* Resultados para Datos Agrupados (Ordenados) */}
                {mostrarResultadosDe === "agrupados" && (
                  <>
                    <h5 className="mb-3 mt-4">Tabla de Distribución de Frecuencias</h5>
                    <Table striped bordered hover responsive size="sm" className="mb-4">
                      <thead>
                        <tr>
                          <th>Clase</th>
                          <th>Marca de Clase </th>
                          <th>Frecuencia Absoluta</th>
                          <th>Frecuencia Relativa </th>
                          <th>Frecuencia Acumulada </th>
                          <th>Frecuencia Relativa Acumulada </th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadosEstadisticos.tablaDistribucionFrecuencias.map((fila, index) => (
                          <tr key={index}>
                            <td>{fila.clase}</td>
                            <td>{fila.marcaClase.toFixed(2)}</td>
                            <td>{fila.frecuenciaAbsoluta}</td>
                            <td>{fila.frecuenciaRelativa.toFixed(4)}</td>
                            <td>{fila.frecuenciaAcumulada}</td>
                            <td>{fila.frecuenciaRelativaAcumulada.toFixed(4)}</td>
                          </tr>
                        ))}
                        {/* Fila total para frecuencia absoluta */}
                        <tr>
                          <td>**TOTAL**</td>
                          <td></td>
                          <td>**{resultadosEstadisticos.totalDatos}**</td>
                          <td>**{(1).toFixed(4)}**</td>
                          <td></td>
                          <td></td>
                        </tr>
                      </tbody>
                    </Table>

                    <h5 className="mb-3 mt-4">Histograma de Frecuencia Absoluta (Agrupados)</h5>
                    {resultadosEstadisticos.tablaDistribucionFrecuencias && resultadosEstadisticos.tablaDistribucionFrecuencias.length > 0 && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                          data={resultadosEstadisticos.tablaDistribucionFrecuencias}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="clase" angle={-45} textAnchor="end" interval={0} height={70} label={{ value: "Clase", position: "insideBottom", offset: 0 }} />
                          <YAxis
                            label={{ value: "Frecuencia Absoluta", angle: -90, position: "insideBottomLeft", offset: -40 }}
                            tickFormatter={(tick) => Math.floor(tick).toString()}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="frecuenciaAbsoluta" fill="#8884d8" name="Frecuencia Absoluta" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {resultadosEstadisticos.tablaDistribucionFrecuencias && resultadosEstadisticos.tablaDistribucionFrecuencias.length === 0 && (
                      <p>No hay datos de distribución de frecuencia para mostrar el histograma.</p>
                    )}

                    <h5 className="mb-3 mt-4">Diagrama de Frecuencia Acumulada (Agrupados)</h5>
                    {resultadosEstadisticos.tablaDistribucionFrecuencias && resultadosEstadisticos.tablaDistribucionFrecuencias.length > 0 && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                          data={resultadosEstadisticos.tablaDistribucionFrecuencias}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="clase" angle={-45} textAnchor="end" interval={0} height={70} label={{ value: "Clase", position: "insideBottom", offset: 0 }} />
                          <YAxis
                            label={{ value: "Frecuencia Acumulada", angle: -90, position: "insideBottomLeft", offset: -40 }}
                            tickFormatter={(tick) => Math.floor(tick).toString()}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="frecuenciaAcumulada" fill="#82ca9d" name="Frecuencia Acumulada" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {resultadosEstadisticos.tablaDistribucionFrecuencias && resultadosEstadisticos.tablaDistribucionFrecuencias.length === 0 && (
                      <p>No hay datos de frecuencia acumulada para mostrar el gráfico (Ojiva).</p>
                    )}

                    {/* DIAGRAMA DE CAJA Y BIGOTES */}
                    <h5 className="mb-3 mt-4">Diagrama de Caja</h5>
                    {numerosValidos.length > 0 ? (
                      <VictoryChart domainPadding={20}>
                        <VictoryAxis
                          tickFormat={() => ""}
                          label="Datos"
                        />
                        <VictoryAxis
                          dependentAxis
                          label="Valor"
                          tickFormat={(tick) => tick.toFixed(2)}
                        />
                        <VictoryBoxPlot
                          data={numerosValidos.map(num => ({ x: 1, y: num }))}
                          boxWidth={20}
                          style={{
                            max: { stroke: "blue", strokeWidth: 2 },
                            min: { stroke: "blue", strokeWidth: 2 },
                            q1: { fill: "lightblue", stroke: "black" },
                            q3: { fill: "lightblue", stroke: "black" },
                            median: { stroke: "darkgreen", strokeWidth: 3 },
                            outliers: { fill: "red", stroke: "black", size: 5 },
                          }}
                        />
                      </VictoryChart>
                    ) : (
                      <p>Ingrese datos para mostrar el diagrama de caja y bigotes.</p>
                    )}
                    {/* FIN DEL DIAGRAMA DE CAJA Y BIGOTES */}

                  </>
                )}
              </Card.Body>
            </Card>
          </>
        )
      ) : (
        !mostrarControlXR && null
      )}
    </div>
  );
}

export default App;