// Modelo de datos
let asesores = [];
let nextId = 1;

// Elementos del DOM
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const asesoresList = document.getElementById("asesores-list");
const ventasList = document.getElementById("ventas-list");
const reporteComisiones = document.getElementById("reporte-comisiones");
const resumenGeneral = document.getElementById("resumen-general");
const formAsesor = document.getElementById("form-asesor");
const formVenta = document.getElementById("form-venta");
const selectAsesor = document.getElementById("select-asesor");
const filtroAsesor = document.getElementById("filtro-asesor");
const generarReporteBtn = document.getElementById("generar-reporte");
const exportarReporteBtn = document.getElementById("exportar-reporte");

// Inicialización
document.addEventListener("DOMContentLoaded", function () {
  cargarDatos();
  configurarTabs();
  configurarEventos();
  actualizarListaAsesores();
  actualizarSelectoresAsesores();
});

// Configuración de pestañas
function configurarTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remover clase active de todos los botones y contenidos
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Agregar clase active al botón clickeado
      this.classList.add("active");

      // Mostrar el contenido correspondiente
      const tabId = this.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");

      // Actualizar datos según la pestaña
      if (tabId === "ventas") {
        actualizarListaVentas();
      } else if (tabId === "reportes") {
        generarReporteCompleto();
      }
    });
  });
}

// Configuración de eventos
function configurarEventos() {
  // Formulario de asesores
  formAsesor.addEventListener("submit", function (e) {
    e.preventDefault();
    const nombre = document.getElementById("nombre-asesor").value;
    const comision = parseFloat(
      document.getElementById("comision-asesor").value
    );

    if (agregarAsesor(nombre, comision)) {
      actualizarListaAsesores();
      actualizarSelectoresAsesores();
      formAsesor.reset();
    }
  });

  // Formulario de ventas
  formVenta.addEventListener("submit", function (e) {
    e.preventDefault();
    const idAsesor = parseInt(selectAsesor.value);
    const nombreVenta = document.getElementById("nombre-venta").value;
    const monto = parseFloat(document.getElementById("monto-venta").value);
    const fecha =
      document.getElementById("fecha-venta").value ||
      new Date().toISOString().split("T")[0];

    if (agregarVenta(idAsesor, nombreVenta, monto, fecha)) {
      actualizarListaVentas();
      formVenta.reset();
    }
  });

  // Generar reporte
  generarReporteBtn.addEventListener("click", function () {
    generarReporteCompleto();
  });

  // Exportar reporte
  exportarReporteBtn.addEventListener("click", function () {
    exportarReporteCSV();
  });
}

// LocalStorage
function cargarDatos() {
  const datos = localStorage.getItem("gestorComisiones");
  if (datos) {
    const parsed = JSON.parse(datos);
    asesores = parsed.asesores || [];
    nextId = parsed.nextId || 1;
  }
}

function guardarDatos() {
  const datos = {
    asesores: asesores,
    nextId: nextId,
  };
  localStorage.setItem("gestorComisiones", JSON.stringify(datos));
}

// CRUD Asesores
function agregarAsesor(nombre, porcentajeComision) {
  if (
    !nombre ||
    isNaN(porcentajeComision) ||
    porcentajeComision < 0 ||
    porcentajeComision > 100
  ) {
    alert("Por favor ingrese un nombre y un porcentaje válido (0-100)");
    return false;
  }

  const nuevoAsesor = {
    id: nextId++,
    nombre: nombre.trim(),
    porcentajeComision: porcentajeComision,
    ventas: [],
  };

  asesores.push(nuevoAsesor);
  guardarDatos();
  return true;
}

function obtenerAsesor(id) {
  return asesores.find((a) => a.id === id);
}

function actualizarSelectoresAsesores() {
  // Limpiar selectores
  selectAsesor.innerHTML = '<option value="">Seleccione un asesor</option>';
  filtroAsesor.innerHTML = '<option value="0">Todos los asesores</option>';

  // Llenar con asesores
  asesores.forEach((asesor) => {
    const option = document.createElement("option");
    option.value = asesor.id;
    option.textContent = asesor.nombre;
    selectAsesor.appendChild(option.cloneNode(true));
    filtroAsesor.appendChild(option);
  });
}

// CRUD Ventas
function agregarVenta(idAsesor, nombreVenta, monto, fecha) {
  const asesor = obtenerAsesor(idAsesor);
  if (!asesor) {
    alert("Asesor no encontrado");
    return false;
  }

  if (!nombreVenta || isNaN(monto) || monto <= 0) {
    alert("Por favor ingrese un nombre y monto válido");
    return false;
  }

  const nuevaVenta = {
    idVenta: asesor.ventas.length + 1,
    nombreVenta: nombreVenta.trim(),
    monto: monto,
    fecha: fecha,
  };

  asesor.ventas.push(nuevaVenta);
  guardarDatos();
  return true;
}

// UI Functions
function actualizarListaAsesores() {
  asesoresList.innerHTML = "";

  if (asesores.length === 0) {
    asesoresList.innerHTML =
      '<p class="empty-message">No hay asesores registrados.</p>';
    return;
  }

  asesores.forEach((asesor) => {
    const comisionTotal = calcularComisionTotal(asesor.id);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
            <h3>${asesor.nombre}</h3>
            <p><strong>Comisión:</strong> ${asesor.porcentajeComision}%</p>
            <p><strong>Ventas:</strong> ${asesor.ventas.length}</p>
            <p><strong>Comisión Total:</strong> $${comisionTotal.toFixed(2)}</p>
            <div class="actions">
                <button onclick="editarAsesor(${asesor.id})">Editar</button>
                <button onclick="eliminarAsesor(${asesor.id})">Eliminar</button>
            </div>
        `;
    asesoresList.appendChild(card);
  });
}

function actualizarListaVentas() {
  ventasList.innerHTML = "";

  let hayVentas = false;

  asesores.forEach((asesor) => {
    if (asesor.ventas.length > 0) {
      hayVentas = true;
      asesor.ventas.forEach((venta) => {
        const comision = (venta.monto * asesor.porcentajeComision) / 100;
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
                    <h3>${venta.nombreVenta}</h3>
                    <p><strong>Asesor:</strong> ${asesor.nombre}</p>
                    <p><strong>Monto:</strong> $${venta.monto.toFixed(2)}</p>
                    <p><strong>Fecha:</strong> ${venta.fecha}</p>
                    <p><strong>Comisión:</strong> $${comision.toFixed(2)} (${
          asesor.porcentajeComision
        }%)</p>
                    <div class="actions">
                        <button onclick="eliminarVenta(${asesor.id}, ${
          venta.idVenta
        })">Eliminar</button>
                    </div>
                `;
        ventasList.appendChild(card);
      });
    }
  });

  if (!hayVentas) {
    ventasList.innerHTML =
      '<p class="empty-message">No hay ventas registradas.</p>';
  }
}

// Reportes
function generarReporteCompleto() {
  const idAsesorFiltro = parseInt(filtroAsesor.value);
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;

  let asesoresFiltrados = asesores;

  // Filtrar por asesor si es necesario
  if (idAsesorFiltro > 0) {
    asesoresFiltrados = asesores.filter((a) => a.id === idAsesorFiltro);
  }

  // Generar tabla de reporte
  let html = `
        <table>
            <thead>
                <tr>
                    <th>Asesor</th>
                    <th>% Comisión</th>
                    <th>Total Ventas</th>
                    <th>Comisión Total</th>
                    <th>Cantidad Ventas</th>
                </tr>
            </thead>
            <tbody>
    `;

  let totalGeneralVentas = 0;
  let totalGeneralComisiones = 0;
  let totalGeneralCantidad = 0;

  asesoresFiltrados.forEach((asesor) => {
    let ventasFiltradas = asesor.ventas;

    // Filtrar por fecha si es necesario
    if (fechaInicio || fechaFin) {
      ventasFiltradas = ventasFiltradas.filter((venta) => {
        const cumpleInicio = !fechaInicio || venta.fecha >= fechaInicio;
        const cumpleFin = !fechaFin || venta.fecha <= fechaFin;
        return cumpleInicio && cumpleFin;
      });
    }

    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.monto, 0);
    const comisionTotal = (totalVentas * asesor.porcentajeComision) / 100;
    const cantidadVentas = ventasFiltradas.length;

    totalGeneralVentas += totalVentas;
    totalGeneralComisiones += comisionTotal;
    totalGeneralCantidad += cantidadVentas;

    html += `
            <tr>
                <td>${asesor.nombre}</td>
                <td>${asesor.porcentajeComision}%</td>
                <td>$${totalVentas.toFixed(2)}</td>
                <td>$${comisionTotal.toFixed(2)}</td>
                <td>${cantidadVentas}</td>
            </tr>
        `;
  });

  html += `
            </tbody>
            <tfoot>
                <tr>
                    <th>Total General</th>
                    <th></th>
                    <th>$${totalGeneralVentas.toFixed(2)}</th>
                    <th>$${totalGeneralComisiones.toFixed(2)}</th>
                    <th>${totalGeneralCantidad}</th>
                </tr>
            </tfoot>
        </table>
    `;

  reporteComisiones.innerHTML = html;

  // Actualizar resumen general
  actualizarResumenGeneral();
}

function actualizarResumenGeneral() {
  resumenGeneral.innerHTML = "";

  const card1 = document.createElement("div");
  card1.className = "card";
  card1.innerHTML = `
        <h3>Total Asesores</h3>
        <p>${asesores.length}</p>
    `;

  const totalVentas = asesores.reduce((sum, a) => sum + a.ventas.length, 0);
  const card2 = document.createElement("div");
  card2.className = "card";
  card2.innerHTML = `
        <h3>Total Ventas</h3>
        <p>${totalVentas}</p>
    `;

  const totalComisiones = asesores.reduce(
    (sum, a) => sum + calcularComisionTotal(a.id),
    0
  );
  const card3 = document.createElement("div");
  card3.className = "card";
  card3.innerHTML = `
        <h3>Total Comisiones</h3>
        <p>$${totalComisiones.toFixed(2)}</p>
    `;

  resumenGeneral.appendChild(card1);
  resumenGeneral.appendChild(card2);
  resumenGeneral.appendChild(card3);
}

function exportarReporteCSV() {
  // Obtener filtros actuales
  const idAsesorFiltro = parseInt(filtroAsesor.value);
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;

  // Crear contenido CSV
  let csvContent = "data:text/csv;charset=utf-8,";

  // Encabezado principal
  csvContent += "Reporte de Ventas por Asesor\n\n";

  // Procesar cada asesor
  asesores.forEach((asesor) => {
    // Aplicar filtros
    if (idAsesorFiltro > 0 && asesor.id !== idAsesorFiltro) return;

    // Filtrar ventas por fecha si es necesario
    let ventasFiltradas = asesor.ventas;
    if (fechaInicio || fechaFin) {
      ventasFiltradas = ventasFiltradas.filter((venta) => {
        const cumpleInicio = !fechaInicio || venta.fecha >= fechaInicio;
        const cumpleFin = !fechaFin || venta.fecha <= fechaFin;
        return cumpleInicio && cumpleFin;
      });
    }

    // Si no hay ventas después de filtrar, saltar este asesor
    if (ventasFiltradas.length === 0) return;

    // Encabezado del asesor
    csvContent += `Asesor: ${asesor.nombre}\n`;
    csvContent += `Porcentaje de Comisión: ${asesor.porcentajeComision}%\n\n`;

    // Encabezados de tabla de ventas
    csvContent += "ID Venta,Nombre Venta,Fecha,Monto,Comisión\n";

    // Agregar cada venta
    ventasFiltradas.forEach((venta) => {
      const comision = (venta.monto * asesor.porcentajeComision) / 100;
      csvContent += `${venta.idVenta},"${venta.nombreVenta}",${
        venta.fecha
      },${venta.monto.toFixed(2)},${comision.toFixed(2)}\n`;
    });

    // Totales del asesor
    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.monto, 0);
    const totalComision = (totalVentas * asesor.porcentajeComision) / 100;

    csvContent += `\nTotal Ventas,${totalVentas.toFixed(
      2
    )},${totalComision.toFixed(2)}\n`;
    csvContent += "\n=============================================\n\n";
  });

  // Crear enlace de descarga
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `reporte_ventas_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);

  // Descargar el archivo
  link.click();

  // Limpiar
  document.body.removeChild(link);
}

// Funciones globales para acciones
window.editarAsesor = function (id) {
  const asesor = obtenerAsesor(id);
  if (!asesor) return;

  const nuevoNombre = prompt("Nuevo nombre:", asesor.nombre);
  if (nuevoNombre === null) return;

  const nuevaComision = prompt(
    "Nuevo porcentaje de comisión:",
    asesor.porcentajeComision
  );
  if (nuevaComision === null) return;

  if (
    actualizarAsesor(id, {
      nombre: nuevoNombre,
      porcentajeComision: parseFloat(nuevaComision),
    })
  ) {
    actualizarListaAsesores();
    actualizarSelectoresAsesores();
    generarReporteCompleto();
  }
};

window.eliminarAsesor = function (id) {
  if (confirm("¿Estás seguro de eliminar este asesor y todas sus ventas?")) {
    const index = asesores.findIndex((a) => a.id === id);
    if (index === -1) return false;

    asesores.splice(index, 1);
    guardarDatos();
    actualizarListaAsesores();
    actualizarListaVentas();
    actualizarSelectoresAsesores();
    generarReporteCompleto();
  }
};

window.eliminarVenta = function (idAsesor, idVenta) {
  if (confirm("¿Estás seguro de eliminar esta venta?")) {
    const asesor = obtenerAsesor(idAsesor);
    if (!asesor) return false;

    const index = asesor.ventas.findIndex((v) => v.idVenta === idVenta);
    if (index === -1) return false;

    asesor.ventas.splice(index, 1);
    guardarDatos();
    actualizarListaVentas();
    actualizarListaAsesores();
    generarReporteCompleto();
  }
};

// Cálculos
function calcularComisionTotal(idAsesor) {
  const asesor = obtenerAsesor(idAsesor);
  if (!asesor) return 0;

  return asesor.ventas.reduce((total, venta) => {
    return total + (venta.monto * asesor.porcentajeComision) / 100;
  }, 0);
}

function actualizarAsesor(id, nuevosDatos) {
  const index = asesores.findIndex((a) => a.id === id);
  if (index === -1) return false;

  asesores[index] = { ...asesores[index], ...nuevosDatos };
  guardarDatos();
  return true;
}
