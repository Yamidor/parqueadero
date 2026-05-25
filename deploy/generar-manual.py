# -*- coding: utf-8 -*-
"""
Genera el PDF "Manual-ParkPro.pdf" con:
  - Arquitectura del sistema
  - Instalacion
  - Manual de usuario
Uso:  python generar-manual.py
"""
import os
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, Flowable, KeepTogether
)

AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(AQUI, "Manual-ParkPro.pdf")

# ---- Paleta ----
NARANJA = colors.HexColor("#ff6b00")
NARANJA2 = colors.HexColor("#ff9100")
OSCURO = colors.HexColor("#13131f")
GRIS = colors.HexColor("#555566")
GRIS_CLARO = colors.HexColor("#eeeef2")
VERDE = colors.HexColor("#1faa59")
AZUL = colors.HexColor("#2b6cb0")

# ---- Estilos ----
styles = getSampleStyleSheet()
def S(name, **kw):
    styles.add(ParagraphStyle(name, **kw))

S("Titulo", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=30,
  textColor=NARANJA, spaceAfter=6, alignment=TA_CENTER)
S("Subtitulo", parent=styles["Normal"], fontSize=13, textColor=GRIS,
  alignment=TA_CENTER, spaceAfter=2)
S("H1", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=18,
  textColor=colors.white, backColor=NARANJA, spaceBefore=16, spaceAfter=10,
  leading=24, leftIndent=8, borderPadding=(6, 6, 6, 6))
S("H2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13.5,
  textColor=NARANJA, spaceBefore=12, spaceAfter=6, leading=17)
S("Body", parent=styles["Normal"], fontSize=10.5, leading=15,
  alignment=TA_JUSTIFY, spaceAfter=6, textColor=colors.HexColor("#222230"))
S("BodyC", parent=styles["Normal"], fontSize=10.5, leading=15, alignment=TA_CENTER)
S("Lista", parent=styles["Normal"], fontSize=10.5, leading=15,
  textColor=colors.HexColor("#222230"))
S("Mono", parent=styles["Normal"], fontName="Courier", fontSize=9.5,
  leading=13, backColor=GRIS_CLARO, textColor=OSCURO, borderPadding=(4, 4, 4, 4))
S("Nota", parent=styles["Normal"], fontSize=9.5, leading=13,
  textColor=colors.HexColor("#444455"), backColor=colors.HexColor("#fff4e6"),
  borderColor=NARANJA, borderWidth=0.6, borderPadding=(6, 6, 6, 6), spaceAfter=8)
S("Celda", parent=styles["Normal"], fontSize=9.5, leading=13)
S("CeldaB", parent=styles["Normal"], fontSize=9.5, leading=13,
  fontName="Helvetica-Bold", textColor=colors.white)
S("Pie", parent=styles["Normal"], fontSize=8, textColor=GRIS, alignment=TA_CENTER)


# ---------------------------------------------------------------
# Diagrama de arquitectura (Flowable dibujado a mano)
# ---------------------------------------------------------------
class DiagramaArquitectura(Flowable):
    def __init__(self, width=170*mm, height=120*mm):
        super().__init__()
        self.width = width
        self.height = height

    def caja(self, c, x, y, w, h, titulo, lineas, color):
        c.setFillColor(color)
        c.roundRect(x, y, w, h, 5, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawCentredString(x + w/2, y + h - 14, titulo)
        c.setFont("Helvetica", 7.6)
        ty = y + h - 27
        for ln in lineas:
            c.drawCentredString(x + w/2, ty, ln)
            ty -= 10

    def flecha(self, c, x1, y1, x2, y2, etiqueta=None):
        c.setStrokeColor(GRIS)
        c.setLineWidth(1.3)
        c.line(x1, y1, x2, y2)
        # punta simple
        c.setFillColor(GRIS)
        import math
        ang = math.atan2(y2 - y1, x2 - x1)
        L = 5
        c.line(x2, y2, x2 - L*math.cos(ang - 0.4), y2 - L*math.sin(ang - 0.4))
        c.line(x2, y2, x2 - L*math.cos(ang + 0.4), y2 - L*math.sin(ang + 0.4))
        if etiqueta:
            c.setFillColor(GRIS)
            c.setFont("Helvetica-Oblique", 7)
            c.drawCentredString((x1+x2)/2, (y1+y2)/2 + 3, etiqueta)

    def draw(self):
        c = self.canv
        W = 482  # ancho util en puntos (~170mm)
        morado = colors.HexColor("#7a4dd1")

        # --- Contenedor PC SERVIDOR (solo envuelve las 3 cajas de arriba) ---
        c.setStrokeColor(NARANJA)
        c.setLineWidth(1.4)
        c.setDash(4, 3)
        c.roundRect(6, 250, W - 12, 88, 8, stroke=1, fill=0)
        c.setDash()
        c.setFillColor(NARANJA)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(14, 326, "PC SERVIDOR  (Windows 11  -  C:\\ParkPro)")

        # 3 cajas del servidor
        self.caja(c, 16, 262, 142, 58, "Servidor ParkPro (Node.js)",
                  ["Express + Socket.IO", "Frontend + API", "HTTPS  puerto 3001"], NARANJA)
        self.caja(c, 170, 262, 142, 58, "Base de datos (MySQL)",
                  ["Local 127.0.0.1:3306", "Datos del negocio"], AZUL)
        self.caja(c, 324, 262, 142, 58, "WhatsApp (Baileys)",
                  ["Sesion guardada", "Requiere internet"], VERDE)
        # flechas internas entre cajas
        self.flecha(c, 158, 291, 170, 291, "SQL")
        self.flecha(c, 312, 291, 324, 291)

        # --- ROUTER (medio) ---
        self.caja(c, 181, 150, 120, 46, "ROUTER WiFi",
                  ["Red local del negocio"], GRIS)
        # servidor <-> router
        self.flecha(c, 120, 262, 200, 196, "red")

        # --- DISPOSITIVOS (abajo) ---
        self.caja(c, 12, 40, 142, 56, "PC Cajero / Admin",
                  ["Navegador web", "https://IP:3001"], morado)
        self.caja(c, 170, 40, 142, 56, "Celulares",
                  ["Navegador + camara", "Escaneo de QR"], morado)
        self.caja(c, 328, 40, 142, 56, "Clientes (WhatsApp)",
                  ["Consultan por placa", "Reciben avisos"], morado)
        # router -> dispositivos
        self.flecha(c, 220, 150, 110, 96)
        self.flecha(c, 241, 150, 241, 96)
        # internet: WhatsApp del servidor -> clientes
        c.setDash(2, 2)
        self.flecha(c, 410, 262, 399, 96)
        c.setDash()
        c.setFillColor(GRIS)
        c.setFont("Helvetica-Oblique", 7)
        c.drawCentredString(430, 175, "internet")


def linea_sep():
    t = Table([[""]], colWidths=[170*mm])
    t.setStyle(TableStyle([("LINEBELOW", (0,0), (-1,-1), 0.8, NARANJA)]))
    return t


def tabla(datos, anchos, encabezado=True):
    t = Table(datos, colWidths=anchos, hAlign="LEFT")
    estilo = [
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
        ("ROWBACKGROUNDS", (0,1 if encabezado else 0), (-1,-1),
         [colors.white, colors.HexColor("#f6f6fa")]),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 7),
        ("RIGHTPADDING", (0,0), (-1,-1), 7),
    ]
    if encabezado:
        estilo += [
            ("BACKGROUND", (0,0), (-1,0), NARANJA),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,0), 9.5),
        ]
    t.setStyle(TableStyle(estilo))
    return t


def P(txt, estilo="Body"):
    return Paragraph(txt, styles[estilo])

def vinetas(items):
    return ListFlowable(
        [ListItem(Paragraph(t, styles["Lista"]), leftIndent=10, value="•") for t in items],
        bulletType="bullet", start="•", leftIndent=14, spaceAfter=6,
    )

def pasos(items):
    return ListFlowable(
        [ListItem(Paragraph(t, styles["Lista"])) for t in items],
        bulletType="1", leftIndent=18, spaceAfter=6,
    )


# ---------------------------------------------------------------
# Construccion del documento
# ---------------------------------------------------------------
story = []

# --- PORTADA ---
story.append(Spacer(1, 70))
story.append(P("ParkPro", "Titulo"))
story.append(P("Sistema de Administracion de Parqueadero", "Subtitulo"))
story.append(Spacer(1, 8))
story.append(P("Manual de Instalacion, Uso y Arquitectura", "Subtitulo"))
story.append(Spacer(1, 40))
port = Table([
    ["Version", "1.0"],
    ["Fecha", date.today().strftime("%d/%m/%Y")],
    ["Plataforma", "Windows 11"],
    ["Acceso", "Red local (PC y celulares)"],
], colWidths=[45*mm, 90*mm])
port.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (0,-1), OSCURO),
    ("TEXTCOLOR", (0,0), (0,-1), colors.white),
    ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 10),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("TOPPADDING", (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING", (0,0), (-1,-1), 10),
]))
port.hAlign = "CENTER"
story.append(port)
story.append(Spacer(1, 50))
story.append(P("Funciona sin internet. Solo WhatsApp requiere conexion.", "BodyC"))
story.append(PageBreak())

# ============================================================
# 1. ARQUITECTURA
# ============================================================
story.append(P("1. Arquitectura del Sistema", "H1"))
story.append(P(
    "ParkPro funciona como una aplicacion web instalada en un PC del negocio que "
    "actua como <b>servidor</b>. Ese PC se conecta al router y cualquier dispositivo "
    "(computador o celular) conectado a la misma red puede usar el sistema desde el "
    "navegador, sin instalar nada adicional.", "Body"))

story.append(P("1.1 Componentes", "H2"))
story.append(tabla([
    ["Componente", "Tecnologia", "Funcion"],
    ["Servidor", "Node.js + Express", "Atiende la aplicacion y la API; sirve el frontend."],
    ["Interfaz (frontend)", "React", "Las pantallas que ve el usuario en el navegador."],
    ["Base de datos", "MySQL", "Guarda clientes, vehiculos, facturas, mensualidades, etc."],
    ["Tiempo real", "Socket.IO", "Actualiza puestos y estados al instante."],
    ["WhatsApp", "Baileys", "Bienvenida, consulta por placa y avisos de mensualidad."],
], [32*mm, 40*mm, 98*mm]))

story.append(P("1.2 Diagrama", "H2"))
story.append(DiagramaArquitectura())
story.append(Spacer(1, 6))

story.append(P("1.3 Como se conectan", "H2"))
story.append(vinetas([
    "Todo corre en un solo PC servidor instalado en <b>C:\\ParkPro</b>.",
    "El servidor publica el sistema por <b>HTTPS en el puerto 3001</b> y escucha en toda la red.",
    "La base de datos MySQL es <b>local</b> (solo el servidor la usa, 127.0.0.1).",
    "Los demas equipos entran por el navegador a <b>https://IP-DEL-SERVIDOR:3001</b>.",
    "WhatsApp se conecta a internet solo cuando hay conexion; si no, el resto sigue igual.",
]))

story.append(P("1.4 Funcionamiento sin internet", "H2"))
story.append(P(
    "El parqueo, los lavados, las mensualidades, los reportes y la base de datos "
    "funcionan <b>100% sin internet</b> porque todo esta dentro del PC servidor y la red "
    "local del router. La unica funcion que necesita internet es WhatsApp; cuando no hay "
    "conexion, WhatsApp queda en pausa y se reconecta solo al volver internet, sin afectar "
    "lo demas.", "Body"))

story.append(P("1.5 Seguridad y datos", "H2"))
story.append(vinetas([
    "Se usa HTTPS con certificado propio para permitir la camara (escaneo de QR) en la red.",
    "La base de datos solo es accesible desde el propio servidor (no se expone a la red).",
    "Toda la informacion se guarda en <b>C:\\ParkPro\\mysql\\data</b> (ver respaldo en el manual).",
]))
story.append(PageBreak())

# ============================================================
# 2. INSTALACION
# ============================================================
story.append(P("2. Instalacion", "H1"))

story.append(P("2.1 Requisitos del PC servidor", "H2"))
story.append(vinetas([
    "Windows 11 (o Windows 10) de 64 bits.",
    "No necesita tener nada instalado: el instalador trae todo (Node y MySQL incluidos).",
    "Recomendado: que ese PC quede siempre encendido durante el horario del negocio.",
    "Conectado al router del negocio (por cable o WiFi).",
]))

story.append(P("2.2 Que incluye el instalador", "H2"))
story.append(P(
    "Un solo archivo <b>ParkPro-Setup.exe</b> que contiene la aplicacion, la base de datos "
    "MySQL, Node.js y los componentes de Microsoft necesarios. El cliente solo hace doble clic.",
    "Body"))

story.append(P("2.3 Pasos de instalacion", "H2"))
story.append(pasos([
    "Copiar <b>ParkPro-Setup.exe</b> a una USB y llevarlo al PC del negocio.",
    "Doble clic en el instalador y aceptar el permiso de administrador.",
    "Seguir el asistente (Siguiente / Instalar). Se instala en <b>C:\\ParkPro</b>.",
    "Al terminar, dejar marcada la casilla <b>Iniciar ParkPro ahora</b>.",
    "La primera vez tarda unos 20 segundos en preparar la base de datos; luego abre el navegador solo.",
]))

story.append(P("2.4 Que crea la instalacion", "H2"))
story.append(tabla([
    ["Elemento", "Detalle"],
    ["Carpeta", "C:\\ParkPro (aplicacion, Node, MySQL y datos)"],
    ["Iconos de escritorio", "Iniciar ParkPro / Detener ParkPro / Abrir ParkPro"],
    ["Firewall", "Se abre el puerto 3001 para el acceso desde la red"],
    ["Base de datos", "Se crea automaticamente en el primer arranque"],
], [45*mm, 125*mm]))

story.append(Spacer(1, 4))
story.append(Paragraph(
    "<b>Nota:</b> si Windows muestra una advertencia de SmartScreen al abrir el instalador, "
    "hacer clic en <b>Mas informacion</b> y luego <b>Ejecutar de todas formas</b>. Es normal "
    "en instaladores propios sin firma comercial.", styles["Nota"]))
story.append(PageBreak())

# ============================================================
# 3. MANUAL DE USUARIO
# ============================================================
story.append(P("3. Manual de Usuario", "H1"))

story.append(P("3.1 Encender y apagar el sistema", "H2"))
story.append(tabla([
    ["Icono", "Que hace"],
    ["Iniciar ParkPro", "Enciende el sistema (base de datos + servidor). Abre el navegador."],
    ["Detener ParkPro", "Apaga el sistema de forma segura."],
    ["Abrir ParkPro", "Abre el sistema en el navegador (si ya esta encendido)."],
], [42*mm, 128*mm]))
story.append(P(
    "El uso diario es solo con estos iconos del escritorio. No se necesitan comandos ni consola.",
    "Body"))

story.append(P("3.2 Acceso desde celulares y otros equipos", "H2"))
story.append(pasos([
    "En el PC servidor, al iniciar se muestra la direccion de red, por ejemplo: https://192.168.1.50:3001",
    "En el celular o PC, abrir el navegador y escribir esa direccion.",
    "Aparecera un aviso de 'sitio no seguro' (por el certificado propio). Tocar <b>Avanzado</b> y luego <b>Continuar</b>. Solo se hace una vez por dispositivo.",
    "Iniciar sesion con el usuario y contrasena.",
]))
story.append(Paragraph(
    "<b>Importante:</b> para que la direccion no cambie, en el router conviene reservar la IP "
    "del PC servidor (DHCP reservation por MAC) o ponerle IP estatica.", styles["Nota"]))

story.append(P("3.3 Ingreso al sistema", "H2"))
story.append(P(
    "Usuario administrador por defecto: <b>admin@parkpro.com</b> &nbsp; Contrasena: <b>Admin123!</b> "
    "(se recomienda cambiarla despues de instalar).", "Body"))

story.append(P("3.4 Modulos principales", "H2"))
story.append(tabla([
    ["Modulo", "Para que sirve"],
    ["Dashboard", "Resumen de ingresos del dia, semana y mes, y estado de puestos en tiempo real."],
    ["Puestos", "Crear y administrar los puestos del parqueadero (moto/carro)."],
    ["Clientes", "Registrar clientes con su telefono (necesario para WhatsApp)."],
    ["Registrar entrada", "Registrar el ingreso de un vehiculo y asignarle un puesto."],
    ["Registrar salida", "Cobrar el parqueo segun el tiempo y el modo de cobro configurado."],
    ["Lavados", "Registrar un lavado Normal o Full para moto o carro."],
    ["Mensualidades", "Crear y renovar mensualidades; avisos automaticos por WhatsApp."],
    ["Tarifas", "Definir precios y el modo de cobro (hora completa o por fraccion)."],
    ["Reportes", "Ver ingresos por fechas y exportarlos a PDF."],
    ["Gastos / Nomina", "Registrar gastos y pagos para el balance del negocio."],
    ["WhatsApp", "Vincular el numero del negocio y activar los mensajes automaticos."],
], [38*mm, 132*mm]))

story.append(PageBreak())

story.append(P("3.5 Cobro: hora completa o por fraccion", "H2"))
story.append(P(
    "En <b>Tarifas</b> se elige como se cobra cuando un vehiculo permanece menos de una hora:", "Body"))
story.append(vinetas([
    "<b>Hora completa:</b> cobra cada hora iniciada. Ej.: 30 min con tarifa $3.000/h = $3.000.",
    "<b>Por fraccion:</b> cobra solo los minutos reales. Ej.: 30 min con tarifa $3.000/h = $1.500.",
]))

story.append(P("3.6 Lavados Normal y Full", "H2"))
story.append(P(
    "Al registrar un lavado se elige el tipo <b>Normal</b> o <b>Full</b>; cada uno tiene su precio "
    "(configurable en Tarifas) para moto y para carro. El tipo aparece en el recibo.", "Body"))

story.append(P("3.7 Reportes en PDF", "H2"))
story.append(pasos([
    "Entrar al modulo <b>Reportes</b>.",
    "Elegir la fecha de inicio y la fecha de fin.",
    "Pulsar <b>Generar Reporte</b> para ver los totales en pantalla.",
    "Pulsar <b>Exportar PDF</b> para descargar el reporte con resumen, ingresos por tipo e ingresos diarios.",
]))

story.append(P("3.8 WhatsApp", "H2"))
story.append(P("<b>Vincular el numero del negocio:</b>", "Body"))
story.append(pasos([
    "Entrar como administrador y abrir el modulo <b>WhatsApp</b>.",
    "Pulsar <b>Vincular WhatsApp</b>; aparece un codigo QR.",
    "En el celular del negocio: WhatsApp > Dispositivos vinculados > Vincular un dispositivo, y escanear el QR.",
    "Listo: la sesion queda guardada en el PC servidor.",
]))
story.append(P("<b>Funciones automaticas:</b>", "Body"))
story.append(vinetas([
    "<b>Bienvenida:</b> al registrar la entrada de un vehiculo, el cliente recibe un saludo.",
    "<b>Consulta por placa:</b> el cliente envia su placa por WhatsApp y recibe el tiempo y el valor. Solo responde si el numero coincide con el telefono registrado del dueno.",
    "<b>Aviso de mensualidad:</b> notifica 3 y 2 dias antes del vencimiento.",
]))
story.append(Paragraph(
    "<b>Sin internet:</b> WhatsApp queda en pausa y se reconecta solo cuando vuelve la conexion. "
    "El resto del sistema funciona normal.", styles["Nota"]))

story.append(P("3.9 Respaldo de datos (importante)", "H2"))
story.append(P(
    "Toda la informacion vive en la carpeta <b>C:\\ParkPro\\mysql\\data</b>. Para tener respaldo, "
    "con el sistema <b>detenido</b> copiar esa carpeta a una USB periodicamente. Para restaurar, "
    "reemplazar esa carpeta con la copia (tambien con el sistema detenido).", "Body"))

story.append(P("3.10 Solucion de problemas", "H2"))
story.append(tabla([
    ["Situacion", "Que hacer"],
    ["No abre en el celular", "Verificar que el PC servidor este encendido y con ParkPro iniciado, y que el celular este en la misma red WiFi."],
    ["La direccion cambio", "Configurar IP fija/reserva en el router para el PC servidor."],
    ["La camara no funciona", "Entrar por HTTPS (https://) y aceptar el aviso de seguridad una vez."],
    ["WhatsApp desconectado", "Revisar internet; si sigue, Desvincular y volver a Vincular escaneando el QR."],
    ["No inicia el sistema", "Usar 'Detener ParkPro', esperar 10 seg y usar 'Iniciar ParkPro' de nuevo."],
], [45*mm, 125*mm]))

# ---- Construir ----
def encabezado_pie(canvas, doc):
    canvas.saveState()
    # Banda superior
    canvas.setFillColor(OSCURO)
    canvas.rect(0, A4[1]-18*mm, A4[0], 18*mm, stroke=0, fill=1)
    canvas.setFillColor(NARANJA)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(18*mm, A4[1]-12*mm, "ParkPro")
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(A4[0]-18*mm, A4[1]-12*mm, "Manual del Sistema")
    # Pie
    canvas.setStrokeColor(NARANJA)
    canvas.setLineWidth(0.8)
    canvas.line(18*mm, 14*mm, A4[0]-18*mm, 14*mm)
    canvas.setFillColor(GRIS)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(18*mm, 9*mm, "ParkPro - Sistema de Administracion de Parqueadero")
    canvas.drawRightString(A4[0]-18*mm, 9*mm, "Pagina %d" % doc.page)
    canvas.restoreState()

def portada_pie(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(OSCURO)
    canvas.rect(0, 0, A4[0], 12*mm, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(A4[0]/2, 4.5*mm, "Documento generado automaticamente")
    canvas.restoreState()

doc = BaseDocTemplate(
    SALIDA, pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm, topMargin=24*mm, bottomMargin=20*mm,
    title="Manual ParkPro", author="ParkPro",
)
frame = Frame(doc.leftMargin, doc.bottomMargin,
              doc.width, doc.height, id="normal")
doc.addPageTemplates([
    PageTemplate(id="portada", frames=[frame], onPage=portada_pie),
    PageTemplate(id="normal", frames=[frame], onPage=encabezado_pie),
])

# La portada usa plantilla 'portada'; el resto 'normal'
from reportlab.platypus import NextPageTemplate
story_final = [NextPageTemplate("normal")] + story
doc.build(story_final)
print("PDF generado:", SALIDA)
