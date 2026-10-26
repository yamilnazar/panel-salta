"""Junta titulares de mercados y cripto desde feeds RSS y los guarda en un JSON.

Lo ejecuta GitHub Actions cada 30 minutos (.github/workflows/noticias.yml).
Uso: python scripts/noticias.py salida/noticias.json
"""
import html
import json
import os
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

FEEDS = [
    ("mercados", "Bloomberg Línea", "https://www.bloomberglinea.com/arc/outboundfeeds/rss/category/mercados/?outputType=xml"),
    ("mercados", "Ámbito", "https://www.ambito.com/rss/pages/finanzas.xml"),
    ("cripto", "Investing.com", "https://es.investing.com/rss/news_301.rss"),
    ("cripto", "CriptoNoticias", "https://www.criptonoticias.com/feed/"),
]

POR_CATEGORIA = 5           # titulares por categoría
VENTANA = 36 * 3600         # solo noticias de las últimas 36 h

# Notas de rutina o publicitarias que no aportan como titular
DESCARTAR = re.compile(
    r"a cu[aá]nto (opera|cotiza|cerr)|cotizaci[oó]n (del|de hoy)|hoy:|nuestra ia|propicks|minuto a minuto",
    re.IGNORECASE,
)


def leer_fecha(texto):
    texto = (texto or "").strip()
    if not texto:
        return None
    try:
        fecha = parsedate_to_datetime(texto)
    except (TypeError, ValueError):
        try:
            fecha = datetime.strptime(texto, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None
    if fecha.tzinfo is None:
        fecha = fecha.replace(tzinfo=timezone.utc)
    return int(fecha.timestamp())


def leer_feed(categoria, fuente, url):
    pedido = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (panel-salta; +https://github.com/yamilnazar/panel-salta)"})
    raiz = ET.fromstring(urllib.request.urlopen(pedido, timeout=20).read())
    salida = []
    for item in raiz.iter("item"):
        titulo = html.unescape(re.sub(r"\s+", " ", item.findtext("title") or "")).strip()
        fecha = leer_fecha(item.findtext("pubDate"))
        if not titulo or not fecha or DESCARTAR.search(titulo):
            continue
        salida.append({"titulo": titulo, "fuente": fuente, "categoria": categoria, "fecha": fecha})
    return salida


def main(destino):
    ahora = int(time.time())
    por_categoria = {"mercados": [], "cripto": []}
    vistos = set()

    for categoria, fuente, url in FEEDS:
        try:
            noticias = leer_feed(categoria, fuente, url)
        except Exception as error:  # un feed caído no frena a los demás
            print(f"Falló {fuente}: {error}", file=sys.stderr)
            continue
        for n in noticias:
            clave = n["titulo"].lower()[:60]
            if clave in vistos or n["fecha"] > ahora + 600:
                continue
            vistos.add(clave)
            por_categoria[categoria].append(n)

    elegidas = []
    for lista in por_categoria.values():
        lista.sort(key=lambda n: n["fecha"], reverse=True)
        recientes = [n for n in lista if ahora - n["fecha"] <= VENTANA] or lista
        # Como máximo 3 por fuente, para que no domine un solo medio
        por_fuente = {}
        for n in recientes:
            if len([e for e in elegidas if e["categoria"] == n["categoria"]]) >= POR_CATEGORIA:
                break
            if por_fuente.get(n["fuente"], 0) < 3:
                por_fuente[n["fuente"]] = por_fuente.get(n["fuente"], 0) + 1
                elegidas.append(n)
    elegidas.sort(key=lambda n: n["fecha"], reverse=True)

    if not elegidas:
        sys.exit("No se obtuvo ninguna noticia")

    os.makedirs(os.path.dirname(destino) or ".", exist_ok=True)
    with open(destino, "w", encoding="utf-8") as archivo:
        json.dump({"actualizado": ahora, "noticias": elegidas}, archivo, ensure_ascii=False, indent=1)
    print(f"{len(elegidas)} noticias guardadas en {destino}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "noticias.json")
