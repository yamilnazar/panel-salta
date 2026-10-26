(function () {
  "use strict";

  var CONFIG = {
    lat: -24.7859,
    lon: -65.4117,
    zona: "America/Argentina/Salta",
    timeoutMs: 10000,
    // Modo noche: solo la hora, en gris tenue (horas de Salta, desde inclusive, hasta exclusive)
    reposo: { desde: 0, hasta: 6 },
    // Umbrales de las alertas del clima
    alertas: { lluviaProb: 50, calor: 32, frio: 4, rafaga: 50 },
    intervalos: {
      feriado: 60 * 60 * 1000, // revisa cada hora; descarga la lista una vez por día
      agenda: 60 * 1000,
      mercados: 2 * 60 * 1000,
      dolar: 10 * 60 * 1000,
      clima: 30 * 60 * 1000,
      recarga: 6 * 60 * 60 * 1000
    }
  };

  var $ = function (id) { return document.getElementById(id); };

  // ---------- Utilidades ----------

  var fmtEntero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
  var fmtDecimal = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtHora = new Intl.DateTimeFormat("es-AR", {
    timeZone: CONFIG.zona, hour: "2-digit", minute: "2-digit", hour12: false
  });
  var fmtPartes = new Intl.DateTimeFormat("es-AR", {
    timeZone: CONFIG.zona, weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
  var fmtDiaCorto = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "short" });

  function partesSalta(fecha) {
    var p = {};
    fmtPartes.formatToParts(fecha).forEach(function (x) { p[x.type] = x.value; });
    if (p.hour === "24") p.hour = "00";
    return p;
  }

  function horaCorta(fecha) {
    return fmtHora.format(fecha);
  }

  function fetchJSON(url) {
    var control = new AbortController();
    var timer = setTimeout(function () { control.abort(); }, CONFIG.timeoutMs);
    return fetch(url, { cache: "no-store", signal: control.signal })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .finally(function () { clearTimeout(timer); });
  }

  // Cada bloque se actualiza solo y, si falla, avisa sin afectar a los demás.
  function bloque(opciones) {
    var estado = $(opciones.estadoId);
    var ultimo = null;

    function marcarOk() {
      ultimo = new Date();
      if (!estado) return;
      estado.className = "estado";
      estado.textContent = "Actualizado " + horaCorta(ultimo);
    }

    function marcarError() {
      if (!estado) return;
      estado.className = "estado error";
      estado.textContent = ultimo
        ? "Sin conexión · último dato " + horaCorta(ultimo)
        : "No se pudo cargar · reintentando";
    }

    function ejecutar() {
      opciones.cargar()
        .then(function (datos) {
          opciones.mostrar(datos);
          marcarOk();
        })
        .catch(function (err) {
          console.warn("[" + opciones.nombre + "]", err);
          marcarError();
        });
    }

    ejecutar();
    setInterval(ejecutar, opciones.intervalo);
  }

  // ---------- Íconos ----------

  var NUBE = '<path d="M7 18h10a4 4 0 0 0 .4-7.98A6 6 0 0 0 6.1 9.1 4.5 4.5 0 0 0 7 18z"/>';
  var NUBE_ALTA = '<path d="M7 15h10a4 4 0 0 0 .4-7.98A6 6 0 0 0 6.1 6.1 4.5 4.5 0 0 0 7 15z"/>';
  var ICONOS = {
    sol: '<g class="i-sol"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></g>',
    luna: '<g class="i-luna"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></g>',
    solNube: '<g class="i-sol"><circle cx="8.5" cy="8" r="3.2"/><path d="M8.5 2.3v1.2M3 8H1.8M4.6 4.1l.9.9M12.4 4.1l-.9.9"/></g><path d="M9.5 20.5h8.5a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 9 12.6 4 4 0 0 0 9.5 20.5z"/>',
    lunaNube: '<g class="i-luna"><path d="M12.5 8.6A5 5 0 1 1 6 3a4 4 0 0 0 6.5 5.6z"/></g><path d="M9.5 20.5h8.5a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 9 12.6 4 4 0 0 0 9.5 20.5z"/>',
    nube: NUBE,
    niebla: '<path d="M4 8h16M3 12h18M5 16h14M8 20h8"/>',
    llovizna: NUBE_ALTA + '<path d="M8 18.5v.5M12 19.5v.5M16 18.5v.5M10 21.5v.5M14 21.5v.5"/>',
    lluvia: NUBE_ALTA + '<path d="M8.5 18l-1.2 3M12.5 18l-1.2 3M16.5 18l-1.2 3"/>',
    tormenta: NUBE_ALTA + '<path d="M13 15.5l-2.2 3.5h3.2L12 22.5"/>',
    nieve: NUBE_ALTA + '<path d="M8 18.5h.01M12 19.5h.01M16 18.5h.01M10 21.5h.01M14 21.5h.01"/>'
  };

  function svg(nombre) {
    return '<svg class="ico" viewBox="0 0 24 24">' + (ICONOS[nombre] || ICONOS.nube) + "</svg>";
  }

  // Códigos WMO de Open-Meteo → texto, ícono y tipo de cielo.
  function climaDesde(codigo, esDia) {
    var t, i, c;
    if (codigo === 0) { t = "Despejado"; i = esDia ? "sol" : "luna"; c = "despejado"; }
    else if (codigo === 1) { t = "Mayormente despejado"; i = esDia ? "sol" : "luna"; c = "despejado"; }
    else if (codigo === 2) { t = "Parcialmente nublado"; i = esDia ? "solNube" : "lunaNube"; c = "despejado"; }
    else if (codigo === 3) { t = "Nublado"; i = "nube"; c = "nublado"; }
    else if (codigo === 45 || codigo === 48) { t = "Niebla"; i = "niebla"; c = "niebla"; }
    else if (codigo === 51) { t = "Llovizna leve"; i = "llovizna"; c = "lluvia"; }
    else if (codigo === 53) { t = "Llovizna"; i = "llovizna"; c = "lluvia"; }
    else if (codigo === 55) { t = "Llovizna intensa"; i = "llovizna"; c = "lluvia"; }
    else if (codigo === 56 || codigo === 57) { t = "Llovizna helada"; i = "llovizna"; c = "lluvia"; }
    else if (codigo === 61) { t = "Lluvia leve"; i = "lluvia"; c = "lluvia"; }
    else if (codigo === 63) { t = "Lluvia"; i = "lluvia"; c = "lluvia"; }
    else if (codigo === 65) { t = "Lluvia intensa"; i = "lluvia"; c = "lluvia"; }
    else if (codigo === 66 || codigo === 67) { t = "Lluvia helada"; i = "lluvia"; c = "lluvia"; }
    else if (codigo === 71) { t = "Nevada leve"; i = "nieve"; c = "nublado"; }
    else if (codigo === 73) { t = "Nevada"; i = "nieve"; c = "nublado"; }
    else if (codigo === 75) { t = "Nevada intensa"; i = "nieve"; c = "nublado"; }
    else if (codigo === 77) { t = "Granos de nieve"; i = "nieve"; c = "nublado"; }
    else if (codigo === 80) { t = "Chaparrones leves"; i = "lluvia"; c = "lluvia"; }
    else if (codigo === 81) { t = "Chaparrones"; i = "lluvia"; c = "lluvia"; }
    else if (codigo === 82) { t = "Chaparrones fuertes"; i = "lluvia"; c = "lluvia"; }
    else if (codigo === 85 || codigo === 86) { t = "Chaparrones de nieve"; i = "nieve"; c = "nublado"; }
    else if (codigo === 95) { t = "Tormenta"; i = "tormenta"; c = "tormenta"; }
    else if (codigo === 96 || codigo === 99) { t = "Tormenta con granizo"; i = "tormenta"; c = "tormenta"; }
    else { t = "—"; i = "nube"; c = "nublado"; }

    var cielo = c;
    if (c === "despejado" || c === "nublado") cielo = esDia ? c + "-dia" : "noche";
    return { texto: t, icono: i, cielo: cielo };
  }

  // ---------- Hora, fecha y fondo ----------

  var sol = null; // { amanecer: Date, atardecer: Date } de hoy, si el clima cargó

  function momentoDelDia(ahora, p) {
    if (sol) {
      var t = ahora.getTime();
      var am = sol.amanecer.getTime();
      var at = sol.atardecer.getTime();
      var h = 60 * 60 * 1000;
      if (t >= am - h / 2 && t < am + 1.5 * h) return "amanecer";
      if (t >= am + 1.5 * h && t < at - 1.5 * h) return "dia";
      if (t >= at - 1.5 * h && t < at + 0.75 * h) return "atardecer";
      return "noche";
    }
    var hora = parseInt(p.hour, 10);
    if (hora >= 6 && hora < 9) return "amanecer";
    if (hora >= 9 && hora < 18) return "dia";
    if (hora >= 18 && hora < 21) return "atardecer";
    return "noche";
  }

  function tic() {
    var ahora = new Date();
    var p = partesSalta(ahora);
    $("hora").textContent = p.hour + ":" + p.minute;
    $("segundos").textContent = p.second;
    $("fecha").textContent = p.weekday + " " + p.day + " de " + p.month;

    var momento = momentoDelDia(ahora, p);
    if (document.body.getAttribute("data-momento") !== momento) {
      document.body.setAttribute("data-momento", momento);
    }

    var hora = parseInt(p.hour, 10);
    var reposo = hora >= CONFIG.reposo.desde && hora < CONFIG.reposo.hasta;
    if (document.body.classList.contains("reposo") !== reposo) {
      document.body.classList.toggle("reposo", reposo);
    }

    // Alinea con el cambio de segundo para que la hora no "salte".
    setTimeout(tic, 1000 - (Date.now() % 1000) + 15);
  }

  // ---------- Clima ----------

  function cargarClima() {
    var url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + CONFIG.lat + "&longitude=" + CONFIG.lon +
      "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day" +
      "&hourly=weather_code,precipitation_probability,temperature_2m,wind_gusts_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset" +
      "&timezone=" + encodeURIComponent(CONFIG.zona) +
      "&timeformat=unixtime&forecast_days=5&forecast_hours=24";
    return fetchJSON(url);
  }

  function mostrarClima(d) {
    var c = d.current;
    var dia = d.daily;
    var info = climaDesde(c.weather_code, c.is_day === 1);

    $("clima").setAttribute("data-cielo", info.cielo);
    $("clima-temp").textContent = Math.round(c.temperature_2m) + "°";
    $("clima-desc").textContent = info.texto;
    $("clima-icono").innerHTML = svg(info.icono);
    $("clima-humedad").textContent = Math.round(c.relative_humidity_2m) + " %";
    $("clima-viento").textContent = Math.round(c.wind_speed_10m) + " km/h";
    $("clima-maxmin").textContent = "Máx " + Math.round(dia.temperature_2m_max[0]) +
      "° · Mín " + Math.round(dia.temperature_2m_min[0]) + "°";

    sol = {
      amanecer: new Date(dia.sunrise[0] * 1000),
      atardecer: new Date(dia.sunset[0] * 1000)
    };
    $("sol").textContent = "Salta · amanecer " + horaCorta(sol.amanecer) +
      " · atardecer " + horaCorta(sol.atardecer);

    // Próximos 4 días (sin contar hoy)
    var html = "";
    for (var i = 1; i <= 4 && i < dia.time.length; i++) {
      var pd = climaDesde(dia.weather_code[i], true);
      // Mediodía local del día i, formateado en UTC para obtener el día de la semana correcto
      var fechaDia = new Date((dia.time[i] + d.utc_offset_seconds + 12 * 3600) * 1000);
      var nombre = fmtDiaCorto.format(fechaDia).replace(".", "");
      nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
      html += '<div><div class="dia">' + nombre + "</div>" + svg(pd.icono) +
        '<div class="num">' + Math.round(dia.temperature_2m_max[i]) + '° <span class="min">' +
        Math.round(dia.temperature_2m_min[i]) + "°</span></div></div>";
    }
    $("clima-pronostico").innerHTML = html;

    $("clima-alertas").innerHTML = alertasClima(d.hourly, info.cielo).slice(0, 2).map(function (a) {
      return '<p class="alerta alerta-' + a.tipo + '">' + ALERTA_ICONO[a.tipo] + "<span>" + a.texto + "</span></p>";
    }).join("");
  }

  // ---------- Alertas del clima (próximas 24 h) ----------

  var ALERTA_ICONO = {
    tormenta: '<svg class="ico" viewBox="0 0 24 24"><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/></svg>',
    lluvia: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 3.5s-6 6.6-6 10.9a6 6 0 0 0 12 0C18 10.1 12 3.5 12 3.5z"/></svg>',
    calor: '<svg class="ico" viewBox="0 0 24 24"><path d="M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/></svg>',
    frio: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 2.5v19M4 7l16 10M20 7L4 17M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/></svg>',
    viento: '<svg class="ico" viewBox="0 0 24 24"><path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7"/></svg>'
  };

  // "a las 16 h" o "mañana a las 8 h", según el día en Salta.
  function cuando(unix) {
    var fecha = new Date(unix * 1000);
    var p = partesSalta(fecha);
    var hoy = partesSalta(new Date());
    return (p.day === hoy.day ? "a las " : "mañana ") + parseInt(p.hour, 10) + " h";
  }

  function alertasClima(h, cieloActual) {
    var lista = [];
    if (!h || !h.time) return lista;
    var ahora = Date.now() / 1000 - 3600;
    var i, max = -99, min = 99, rafaga = 0;

    for (i = 0; i < h.time.length; i++) {
      if (h.time[i] < ahora) continue;
      if (h.temperature_2m[i] > max) max = h.temperature_2m[i];
      if (h.temperature_2m[i] < min) min = h.temperature_2m[i];
      if (h.wind_gusts_10m[i] > rafaga) rafaga = h.wind_gusts_10m[i];
    }

    // Tormenta o lluvia: primera hora probable (si no está lloviendo ya)
    if (cieloActual !== "tormenta" && cieloActual !== "lluvia") {
      for (i = 0; i < h.time.length; i++) {
        if (h.time[i] < ahora) continue;
        if (h.weather_code[i] >= 95) {
          lista.push({ tipo: "tormenta", texto: "Tormenta probable " + cuando(h.time[i]) });
          break;
        }
        if (h.precipitation_probability[i] >= CONFIG.alertas.lluviaProb) {
          lista.push({
            tipo: "lluvia",
            texto: "Lluvia probable " + cuando(h.time[i]) + " (" + h.precipitation_probability[i] + " %)"
          });
          break;
        }
      }
    }

    if (max >= CONFIG.alertas.calor) {
      lista.push({ tipo: "calor", texto: "Calor intenso · hasta " + Math.round(max) + "°" });
    }
    if (min <= 0) {
      lista.push({ tipo: "frio", texto: "Posible helada · mínima " + Math.round(min) + "°" });
    } else if (min <= CONFIG.alertas.frio) {
      lista.push({ tipo: "frio", texto: "Frío intenso · mínima " + Math.round(min) + "°" });
    }
    if (rafaga >= CONFIG.alertas.rafaga) {
      lista.push({ tipo: "viento", texto: "Ráfagas de hasta " + Math.round(rafaga) + " km/h" });
    }
    return lista;
  }

  // ---------- Dólar ----------

  var CASAS = [
    { casa: "oficial", nombre: "Oficial" },
    { casa: "blue", nombre: "Blue" },
    { casa: "bolsa", nombre: "MEP" },
    { casa: "tarjeta", nombre: "Tarjeta" },
    { casa: "cripto", nombre: "Cripto" }
  ];

  function precio(n) {
    return typeof n === "number" ? fmtEntero.format(Math.round(n)) : "—";
  }

  function mostrarDolar(lista) {
    var porCasa = {};
    lista.forEach(function (x) { porCasa[x.casa] = x; });

    var html = "";
    CASAS.forEach(function (c) {
      var d = porCasa[c.casa];
      html += '<div class="fila"><span class="nombre">' + c.nombre + '</span><span class="valores">' +
        '<span class="compra">' + (d ? precio(d.compra) : "—") + '</span><span class="sep">·</span>' +
        '<span class="venta">' + (d ? precio(d.venta) : "—") + "</span></span></div>";
    });
    $("dolar-filas").innerHTML = html;
  }

  // ---------- Mercados (CoinGecko, en USD) ----------

  // S&P 500, oro y petróleo salen de sus versiones tokenizadas en CoinGecko:
  // SPY (ETF del S&P 500), PAXG (1 onza troy de oro) y USO (fondo de petróleo).
  var MERCADOS = [
    { id: "bitcoin", nombre: "Bitcoin" },
    { id: "ethereum", nombre: "Ethereum" },
    { id: "spdr-s-p-500-etf-ondo-tokenized-etf", nombre: "S&amp;P 500", sigla: "SPY" },
    { id: "pax-gold", nombre: "Oro", sigla: "oz" },
    { id: "united-states-oil-fund-ondo-tokenized", nombre: "Petróleo", sigla: "USO" }
  ];

  function cargarMercados() {
    var ids = MERCADOS.map(function (m) { return m.id; }).join(",");
    return fetchJSON("https://api.coingecko.com/api/v3/simple/price?ids=" + ids +
      "&vs_currencies=usd&include_24hr_change=true");
  }

  function precioUsd(n) {
    if (typeof n !== "number") return "—";
    return n >= 1000 ? fmtEntero.format(Math.round(n)) : fmtDecimal.format(n);
  }

  function variacion(valor) {
    if (typeof valor !== "number") return "";
    var sube = valor >= 0;
    return '<span class="variacion ' + (sube ? "sube" : "baja") + '">' +
      (sube ? "▲ " : "▼ ") + fmtDecimal.format(Math.abs(valor)) + " %</span>";
  }

  function mostrarMercados(d) {
    var html = "";
    MERCADOS.forEach(function (m) {
      var x = d[m.id] || {};
      html += '<div class="fila"><span class="nombre">' + m.nombre +
        (m.sigla ? " <small>" + m.sigla + "</small>" : "") + '</span><span class="valores">' +
        '<span class="venta">' + precioUsd(x.usd) + "</span>" + variacion(x.usd_24h_change) + "</span></div>";
    });
    $("mercados-filas").innerHTML = html;
  }

  // ---------- Próximo feriado (argentinadatos.com) ----------

  var fmtISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONFIG.zona, year: "numeric", month: "2-digit", day: "2-digit"
  });
  var CLAVE_FERIADOS = "panel-feriados";

  function hoyISO() {
    return fmtISO.format(new Date());
  }

  function leerCache() {
    try { return JSON.parse(localStorage.getItem(CLAVE_FERIADOS)); } catch (e) { return null; }
  }

  function guardarCache(datos) {
    try { localStorage.setItem(CLAVE_FERIADOS, JSON.stringify(datos)); } catch (e) { /* sin almacenamiento */ }
  }

  function proximoDe(lista, hoy) {
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].fecha >= hoy) return lista[i];
    }
    return null;
  }

  function cargarFeriado() {
    var hoy = hoyISO();
    var cache = leerCache();
    // La lista se descarga una vez por día; el resto del tiempo se usa la guardada.
    if (cache && cache.dia === hoy && proximoDe(cache.lista, hoy)) {
      return Promise.resolve(proximoDe(cache.lista, hoy));
    }
    var anio = parseInt(hoy.slice(0, 4), 10);
    var base = "https://api.argentinadatos.com/v1/feriados/";
    return fetchJSON(base + anio)
      .then(function (lista) {
        if (proximoDe(lista, hoy)) return lista;
        return fetchJSON(base + (anio + 1)); // fin de año: buscar en el siguiente
      })
      .then(function (lista) {
        lista.sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
        guardarCache({ dia: hoy, lista: lista });
        var prox = proximoDe(lista, hoy);
        if (!prox) throw new Error("Sin feriados próximos");
        return prox;
      });
  }

  function mostrarFeriado(f) {
    var a = f.fecha.split("-");
    var fecha = new Date(Date.UTC(+a[0], +a[1] - 1, +a[2], 12));
    var h = hoyISO().split("-");
    var dias = Math.round((fecha - Date.UTC(+h[0], +h[1] - 1, +h[2], 12)) / 86400000);
    var dia = fmtDiaCorto.format(fecha).replace(".", "");

    $("feriado-cuanto").textContent = dias === 0 ? "hoy" : dias === 1 ? "mañana" : "en " + dias + " días";
    $("feriado-nombre").innerHTML = '<span class="feriado-fecha">' + dia + " " + a[2] + "/" + a[1] +
      "</span> · " + f.nombre.replace(/</g, "&lt;");
  }

  // ---------- Agenda (Google Calendar, próxima etapa) ----------

  function cargarAgenda() {
    return Promise.resolve(null);
  }

  function mostrarAgenda() {
    // Se completa cuando se conecte Google Calendar.
  }

  // ---------- Mantener pantalla encendida ----------

  var wakeLock = null;
  function pedirWakeLock() {
    if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    navigator.wakeLock.request("screen")
      .then(function (wl) { wakeLock = wl; })
      .catch(function () { /* sin soporte o sin HTTPS */ });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") pedirWakeLock();
  });

  // ---------- Inicio ----------

  tic();
  pedirWakeLock();

  bloque({ nombre: "clima", estadoId: "clima-estado", intervalo: CONFIG.intervalos.clima, cargar: cargarClima, mostrar: mostrarClima });
  bloque({ nombre: "dolar", estadoId: "dolar-estado", intervalo: CONFIG.intervalos.dolar, cargar: function () { return fetchJSON("https://dolarapi.com/v1/dolares"); }, mostrar: mostrarDolar });
  bloque({ nombre: "mercados", estadoId: "mercados-estado", intervalo: CONFIG.intervalos.mercados, cargar: cargarMercados, mostrar: mostrarMercados });
  bloque({ nombre: "feriado", estadoId: "feriado-estado", intervalo: CONFIG.intervalos.feriado, cargar: cargarFeriado, mostrar: mostrarFeriado });
  bloque({ nombre: "agenda", estadoId: null, intervalo: CONFIG.intervalos.agenda, cargar: cargarAgenda, mostrar: mostrarAgenda });

  // Recarga completa cada 6 h para liberar memoria.
  setTimeout(function () { location.reload(); }, CONFIG.intervalos.recarga);

  // Guarda la página en caché para que una recarga sin internet no deje la pantalla en blanco.
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
