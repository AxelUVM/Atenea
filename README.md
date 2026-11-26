# Atenea

**Equipo:** SIEDIA  
**Campus:** Reforma - San Rafael  
**Alineación:** Objetivos de Desarrollo Sostenible (ODS) 10 y 11  

---

## 1. Resumen ejecutivo

**Atenea** es una solución digital ligera diseñada para eliminar las barreras de acceso a trámites, servicios de salud, educación y oportunidades de empleo. Ayuda a personas en situación de desventaja —como adultos mayores, migrantes, estudiantes de primera generación y comunidades con baja conectividad— a comprender información oficial confusa o inaccesible. Su innovación radica en combinar una arquitectura web ultraligera (HTML, CSS y Deno) con el modelo multimodal `gemini-3.1-flash-lite` para traducir documentos, procesar consultas por voz, reconocer imágenes y mostrar ubicaciones de trámites, ejecutándose desde cualquier navegador mediante un lanzador ligero.

---

## 2. Boceto y concepto

### El problema
La información oficial sobre trámites, becas y servicios públicos suele presentarse de forma dispersa, confusa o con tecnicismos complejos. Esta brecha de comprensión perpetúa la exclusión social: las personas que no logran entender los requisitos o procesos quedan automáticamente fuera de oportunidades vitales.

### Propuesta de solución
Una plataforma web accesible y de carga instantánea, accesible desde un lanzador (*launcher*) que abre la interfaz directamente en el navegador del dispositivo. A través de interacciones sencillas por voz, captura de imágenes y traducción de documentos, **Atenea** transforma información compleja en orientación clara y accionable, indicando además los puntos físicos para completar cada gestión.

### Alineación con los Objetivos de Desarrollo Sostenible (ODS)
* **ODS 10 (Reducción de las desigualdades):** Promueve la inclusión social y económica al democratizar el acceso a información crítica sobre educación, salud y empleo para grupos vulnerables (migrantes, adultos mayores, estudiantes de primera generación).
* **ODS 11 (Ciudades y comunidades sostenibles):** Facilita el acceso equitativo a los servicios urbanos e institucionales básicos mediante la ubicación y orientación clara hacia los centros de atención ciudadana.

---

## 3. Documentación funcional

A continuación se detallan las funcionalidades principales de la plataforma:

* **Acceso inmediato mediante lanzador (Launcher):** Aplicación ligera que abre directamente la página web estática en el navegador del usuario, eliminando instalaciones pesadas o incompatibilidades de sistema.
* **Traducción y simplificación de documentos:** Permite cargar o capturar documentos oficiales para traducirlos y adaptarlos a un lenguaje comprensible para el usuario.
* **Interacción por voz:** Capacidad de recibir instrucciones, dudas o solicitudes mediante comandos de voz desde el navegador, eliminando la barrera de la escritura o la lectura compleja.
* **Reconocimiento de imágenes:** Procesamiento visual de documentos físicos o formularios mediante la cámara o carga de archivos para extraer y explicar su contenido.
* **Ubicación de lugares para trámites:** Visualización de las oficinas, centros de salud o instituciones físicas a las que el usuario debe acudir para completar su proceso.

---

## 4. Documentación técnica

### Stack tecnológico
* **Frontend (Interfaz Web Estática):** HTML5 y CSS3 puro (sin frameworks pesados)
* **Acceso en dispositivo:** Aplicación tipo *Launcher* que lanza la página estática en el navegador predeterminado
* **Backend / Servidor:** Deno (servidor web y API)
* **Inteligencia Artificial:** Modelo `gemini-3.1-flash-lite`

### Arquitectura general
La solución adopta una arquitectura web minimalista de altísimo rendimiento y bajo consumo de recursos:

1. **Launcher y Cliente Web (HTML + CSS):** El lanzador dirige al usuario al navegador, donde se carga una interfaz estática en HTML y CSS puro. El navegador gestiona de forma nativa la captura de micrófono, la selección/captura de imágenes y la solicitud de ubicación.
2. **Servidor Unificado (Deno):** Sirve los archivos estáticos (HTML/CSS) y expone los endpoints que reciben las entradas del usuario, procesan las ubicaciones de trámites y se comunican con la API de Gemini.

**Flujo de datos:**
1. **App Launcher** $\rightarrow$ Abre la URL en el navegador del dispositivo.
2. **Interfaz Web (HTML + CSS)** $\rightarrow$ Envía audio, imagen o texto al **Servidor Deno**.
3. **Servidor Deno** $\rightarrow$ Procesa la petición y consulta a **Gemini 3.1 Flash-Lite**.
4. **Gemini 3.1 Flash-Lite** $\rightarrow$ Devuelve la respuesta simplificada al **Servidor Deno**, que la muestra en la interfaz web.

### Integración de Gemini en el flujo
El modelo **`gemini-3.1-flash-lite`** constituye el núcleo de procesamiento multimodal de la plataforma, elegido por su baja latencia y eficiencia. Deno gestiona las peticiones hacia el modelo en tres flujos:

1. **Reconocimiento de voz:** Recibe el audio grabado desde el navegador, interpreta la consulta del usuario y devuelve una respuesta clara.
2. **Reconocimiento de imágenes:** Analiza fotografías de documentos físicos o formularios enviadas desde el navegador para extraer texto y contexto.
3. **Traducción de documentos:** Procesa los textos cargados o extraídos de imágenes para traducirlos y simplificarlos antes de mostrarlos en la interfaz HTML.

---

## 5. Manual de usuario

Bienvenido a **Atenea**. Esta guía te ayudará a dar tus primeros pasos para resolver tus dudas sobre trámites y servicios.

### Cómo acceder
1. **Inicio automático:** Toca el ícono de **Atenea** en tu dispositivo. Esto abrirá automáticamente la herramienta en tu navegador de internet (como Chrome o Safari) sin necesidad de configurar nada adicional.
2. **Permisos en el navegador:** Cuando uses por primera vez el micrófono, la cámara o la ubicación, tu navegador te mostrará un aviso en la parte superior preguntando si deseas dar permiso. Presiona **"Permitir"**.

### Cómo usar las funciones principales

#### 1. Hablar con la plataforma (Uso por voz)
* En la pantalla principal, presiona el botón de **micrófono**.
* Di en voz alta qué necesitas (por ejemplo: *"¿Qué necesito para tramitar mi beca?"* o *"¿Dónde hay un centro de salud?"*).
* Detén la grabación y espera unos segundos para leer o escuchar la respuesta en pantalla.

#### 2. Entender o traducir un documento con una foto
* Si tienes un papel o formulario que no entiendes o está en otro idioma, presiona el botón para **subir o tomar foto de documento**.
* Toma una foto clara con la cámara de tu teléfono o selecciona una imagen guardada.
* La página procesará la imagen y te mostrará la traducción y explicación en palabras sencillas.

#### 3. Encontrar a dónde ir (Ubicaciones para trámites)
* Consulta la sección de **Ubicaciones** o los resultados que aparecen al preguntar por un trámite específico.
* Verás la dirección de las oficinas o centros de atención correspondientes a lo que necesitas realizar el link 

---

## 6. Accesibilidad e impacto

### Diseño inclusivo y accesibilidad
Al basarse en una arquitectura web ligera de **HTML, CSS y Deno** ejecutada directamente en el navegador, **Atenea** maximiza su alcance y compatibilidad:

* **Compatibilidad universal y cero fricción:** Funciona en prácticamente cualquier teléfono inteligente, tableta o computadora sin importar si es un modelo antiguo o con poco espacio de almacenamiento, ya que el *launcher* abre una web ligera en el navegador.
* **Optimización extrema para baja conectividad:** Al eliminar dependencias pesadas de frontend y servir HTML/CSS puro desde Deno junto con `gemini-3.1-flash-lite`, la página carga en segundos incluso en redes móviles lentas o inestables.
* **Interacción multimodal (Voz + Imagen):** Permite que personas con dificultades de lectura, baja alfabetización digital o barreras idiomáticas interactúen sin tener que escribir textos complejos.

### Impacto esperado
* **Autonomía ciudadana:** Empodera a adultos mayores, migrantes y estudiantes de primera generación para gestionar sus propios trámites sin depender de intermediarios.
* **Reducción de deserción en procesos:** Disminuye el abandono en solicitudes de becas, atención médica y búsqueda de empleo causado por la desinformación o entrega de documentos incorrectos.
* **Democratización tecnológica:** Garantiza que la falta de un teléfono de gama alta o de un plan de datos ilimitado no sea un obstáculo para acceder a derechos y servicios básicos.
