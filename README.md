# Whirlpool Learning

Plataforma interna para Whirlpool Corporation. Permite gestionar cursos, materiales, evaluaciones y una comunidad de aprendizaje para empleados.

---

## Índice

- [Resumen del Proyecto](#-resumen-del-proyecto)
- [Funcionalidades Principales](#-funcionalidades-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Variables de Entorno](#-variables-de-entorno)
- [Instalación Local](#-instalación-local)
- [Deployment en Producción](#-deployment-en-producción)
- [Esquema de Base de Datos](#-esquema-de-base-de-datos)
- [API Reference](#-api-reference)
- [Roles de Usuario](#-roles-de-usuario)

---

## Resumen del Proyecto

Whirlpool Learning es una plataforma web full-stack construida con **Next.js 14**. Permite a administradores crear y gestionar cursos con materiales y evaluaciones, mientras que los empleados pueden consumir el contenido, seguir su progreso e interactuar en una comunidad.

La plataforma incluye un **chatbot con IA (Gemini)** con contexto personalizado del usuario **RAG**, autenticación de email/contraseña y autentificación **SSO** con  **Google OAuth**, seguimiento de rachas de actividad, y un sistema de **Gemas** para que empleados compartan gemas hechas que hayan demostrado un buen desempeño.

---

## Funcionalidades Principales

### Para Empleados
- **Dashboard de cursos** con progreso en tiempo real (% de archivos vistos + quizzes aprobados).
- **Visor de materiales** integrado para PDFs, documentos, presentaciones y videos.
- **Evaluaciones (Quizzes)** con calificación automática, puntaje mínimo configurable y múltiples intentos.
- **Perfil personal** con personalización, racha de actividad diaria, historial de cursos y publicaciones.
- **Sistema de Gemas** para creación de gemas con categorías, exportables a la comunidad.
- **Comunidad social** (estilo Instagram/Reddit/twitter) con publicaciones, comentarios, likes, imágenes adjuntas y gemas embebidas.
- **Notificaciones** tanto en plataforma como hacia el correo electrónico del usuario en tiempo real (likes, comentarios, inscripciones a cursos) con badge de no leídas.
- **Chatbot IA (Whirlpool AI)** implementado con Gemini, contexto personalizado del usuario (RAG) y respuestas en markdown para formateo.
- **Explorador de Gemas** con búsqueda fonética (Fuse.js), filtros por categoría y agrupación.

### Para impartidores
- **Gestión de cursos**: crear, editar, eliminar cursos con secciones, orden de contenido, categorías y portada personalizada
- **Inscripción de alumnos** a cursos con notificación automática por email
- **Estadísticas globales**: total de alumnos, cursos, tasa de completado, promedio en quizzes
- **Estadísticas por curso**: alumnos inscritos, tasa de finalización, progreso por sección, top alumnos
- **Estadísticas por alumno**: cursos inscritos, terminados, promedio de quiz, mejor puntaje
- **Envío de recordatorios masivos** por email a alumnos con cursos sin avance en los últimos 7 días

### Para administradores de contenido
- **Biblioteca de materiales**: subir PDFs/MP4 a Supabase Storage o agregar links externos
- **Creación y edición de exámenes** con preguntas de opción múltiple (2-4 opciones) y respuesta correcta configurable
- **Gestión de categorías**: crear, editar, eliminar categorías para cursos y gemas
---

## Características Técnicas Adicionales

### Seguimiento de rachas de actividad
El sistema calcula rachas diarias de acceso. Al hacer login (email o Google) y mediante pings periódicos del Sidebar (cada 3 min), se actualiza `ultima_actividad` y se evalúa si el día anterior también hubo actividad para incrementar o resetear `racha_actual`.

### Scroll infinito en Comunidad
La página de comunidad usa `IntersectionObserver` en el scroll para detectar cuando el usuario llega al final y cargar más publicaciones automáticamente en lotes de 5.

### Visor de materiales con detección de completado
- **YouTube**: se marca como completado al cargar el embed.
- **PDFs/Google Drive**: se usa `IntersectionObserver` sobre un elemento invisible al final del iframe para detectar cuando el usuario llegó al final del documento.

### Cache RAG en el chatbot
El contexto de datos personales para el chatbot se cachea en un `ref` de React durante 10 minutos (`RAG_TTL`), evitando llamadas redundantes a la BD en conversaciones largas.

---

## Tecnologías Utilizadas

| Tecnología | Versión | Uso en el Proyecto |
|---|---|---|
| **Next.js** | 14 (App Router) | Framework principal — SSR, API Routes, enrutamiento |
| **React** | 18 | UI components, hooks de estado y efectos |
| **Tailwind CSS** | v4 | Estilos de toda la interfaz sin CSS adicional |
| **MySQL2 / TiDB** | — | Base de datos relacional en la nube (TiDB Cloud) con SSL |
| **Supabase Storage** | — | Almacenamiento de archivos (PDFs, videos MP4, imágenes, avatares) |
| **NextAuth.js** | — | Autenticación Google OAuth2 + manejo de sesiones |
| **bcrypt** | — | Hash de contraseñas para auth email/password |
| **Google Gemini AI** | `gemini-2.5-flash-lite` | Chatbot con IA + sistema RAG de contexto personalizado |
| **Nodemailer** | — | Envío de emails transaccionales (inscripciones, likes, comentarios, cursos completados) |
| **Lucide React** | — | Iconografía de toda la aplicación |
| **ReactMarkdown** | — | Renderizado de respuestas del chatbot en formato Markdown |
| **Fuse.js** | — | Búsqueda fonética/fuzzy en gemas y en el panel admin |

### Detalles de integración

**TiDB Cloud (MySQL compatible):** La conexión usa `mysql2/promise` con pool de conexiones y SSL forzado (`TLSv1.2`). Todas las queries son parametrizadas para prevenir SQL injection. Se usa `beginTransaction` / `rollback` / `commit` en operaciones críticas como crear cursos y exámenes.

**Supabase Storage:** Se usan tres buckets: `material` (PDFs y MP4 de cursos), `publicaciones` (imágenes de posts de la comunidad) y `pfps` (avatares de usuario). Los archivos se suben desde el cliente con el SDK `@supabase/supabase-js` y se retorna la URL pública.

**NextAuth + Google OAuth:** Al autenticar con Google, el sistema verifica si el usuario ya existe en la BD por email. Si no, lo crea automáticamente con `rol_id = 2` (Empleado). La sesión incluye `usuario_id` y `rol_id` custom. Solo se permiten dominios `@gmail.com` y `@whirlpool.com`.

**Gemini AI + RAG:** El chatbot detecta keywords relacionados con la plataforma (cursos, gemas, progreso, etc.) y, si los detecta, solicita al endpoint `/api/rag/contexto` los datos reales del usuario desde la BD. Este contexto se inyecta en el prompt de Gemini, permitiendo respuestas personalizadas. El contexto se cachea en el cliente por 10 minutos.

**Nodemailer:** Usa Gmail con App Password. Hay 5 tipos de email: `notificarLike`, `notificarComentario`, `notificarCursoAsignado`, `notificarCursoCompletado`, `notificarRecordatorio`. Todos usan un template HTML responsive en `src/lib/email.js`.

---

## Estructura del Proyecto

```
src/
|── app/
|   |── api/                          # API Routes (Next.js)
|   |   |── auth/[...nextauth]/       # NextAuth Google OAuth
|   |   |── login/                    # Auth email/password
|   |   |── registro/                 # Registro de nuevos usuarios
|   |   |── usuario/                  # Datos de usuario por ID
|   |   |── perfil/                   # Perfil + estadísticas + edición
|   |   |── actividad/                # Ping de actividad + rachas
|   |   |── cursos/                   # Cursos del usuario + detalle
|   |   |── progreso/                 # Marcar archivos vistos
|   |   |── quiz/                     # Detalle de quiz + evaluación
|   |   |── archivos/[id]/            # Metadatos de un archivo
|   |   |── categorias/               # CRUD de categorías
|   |   |── gemas/                    # CRUD gemas + explorar + buscar
|   |   |── comunidad/                # Posts + imágenes
|   |   |── comentarios/              # CRUD comentarios
|   |   |── likes/                    # Toggle likes posts/comentarios
|   |   |── notificaciones/           # Notificaciones del usuario
|   |   |── chat/                     # Chatbot Gemini
|   |   |── rag/contexto/             # Contexto RAG para el chatbot
|   |   |── admin/                    # Panel de administración
|   |       |── dashboard/            # Catálogo de cursos
|   |       |── cursos/               # Crear cursos + subrutas
|   |       |   |── [id]/             # Editar, materiales, exámenes, secciones, categorías
|   |       |
|   |       |── archivos/             # Biblioteca de materiales
|   |       |── quizzes/              # CRUD exámenes
|   |       |   |── [id]/             # Editar examen
|   |       |
|   |       |── asignar/              # Inscribir/desinscribir alumnos
|   |       |── usuarios/             # Listado de usuarios
|   |       |── categorias/           # CRUD categorías (admin)
|   |       |── stats/                # Stats globales + por curso + por usuario
|   |       |── recordatorios/        # Enviar emails de recordatorio
|   |
|   |── admin/                        # Páginas del panel admin
|   |── cursos/[id]/                  # Detalle + visor + quiz
|   |── comunidad/                    # Feed social
|   |── gemas/                        # Explorador de gemas
|   |── perfil/                       # Perfil propio
|   |── perfil/[id]/                  # Perfil público de otro usuario
|   |── login/                        # Página de login
|   |── registro/                     # Página de registro
|
|── components/                       # Componentes React reutilizables
|   |── Sidebar.js                    # Navegación lateral
|   |── Header.js                     # Header móvil
|   |── ChatBot.js                    # Widget del chatbot
|   |── PostForm.js                   # Formulario de publicación
|   |── PostViewer.js                 # Modal de post con comentarios
|   |── GemaCard.js                   # Tarjeta de gema
|   |── CursoCard.js                  # Tarjeta de curso
|   |── QuizCard.js                   # Componente de quiz
|   |── ProgressBar.js                # Barra de progreso
|   |── Notificaciones.js             # Panel de notificaciones
|   |── ResourceItem.js               # Item de recurso genérico
|   |── SectionCard.js                # Contenedor de sección
|   |── Button.js                     # Botón reutilizable
|   |── Typography.js                 # Componentes de texto
|
|── lib/
|   |── db.js                         # Pool de conexiones MySQL
|   |── supabase.js                   # Cliente Supabase
|   |── email.js                      # Funciones de email con Nodemailer
```

---

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos (TiDB Cloud o MySQL compatible)
DB_HOST=tu_host
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_de_la_base
DB_PORT=tu_puerto

# NextAuth
NEXTAUTH_SECRET=una_cadena_secreta_larga_y_aleatoria
NEXTAUTH_URL=url

# Google OAuth (Google Cloud Console)
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu_proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_anon_key

# Google Gemini AI
GEMINI_API_KEY=tu_gemini_api_key

# Nodemailer (Gmail con App Password)
GMAIL_USER=tu_correo@gmail.com
GMAIL_APP_PASS=tu_app_password_de_16_caracteres

# URL pública de la app (para links en emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
---

## Instalación Local

### Clonar el repositorio
```bash 
git clone https://github.com/woloqo/WhirpoolKetzia
cd whirlpool-learning
```
### Instalar dependencias
```bash 
npm install
```


### Configurar variables de entorno
```bash 
cp .env.example .env.local
```

### Inicializar la base de datos
Ejecuta el esquema SQL en tu instancia MySQL/TiDB

### Configurar Supabase Storage
- Crea tres buckets en tu proyecto Supabase:
- material (público)
- publicaciones (público)
- pfps (público)

### Configurar Google OAuth
- En Google Cloud Console:
- Crear un proyecto
- Habilitar Google+ API
- Crear credenciales OAuth 2.0
- Agregar URL_DEL_PROYECTO/api/auth/callback/google como Redirect URI

### Ejecutar en modo desarrollo
```bash 
npm run dev
```

Despliegue con Dokploy para servidores Ubutu
### Instalar y configurar dokploy
```bash 
curl -sSL https://dokploy.com/install.sh | sh
```
- Crear nuevo proyecto en el dashboard de dokploy
- Dar nombre y descripción al proyecto
- Crear un nuevo servicio dentro del proyecto
- Elegir aplicación como tipo de servicio
- Dar nombre y descripción al servicio

### Seleccionar el proveedor
Seleccionar git como proveedor
- Repostitory url: https://github.com/woloqo/WhirpoolKetzia
- Branch: main
- Watch paths: src/**

### Inicializar la base de datos
Ejecuta el esquema SQL en tu instancia MySQL/TiDB

### Configurar Supabase Storage
- Crea tres buckets en tu proyecto Supabase:
material (público)
publicaciones (público)
pfps (público)

### Configurar Google OAuth
En Google Cloud Console:
- Crear un proyecto
- Habilitar Google+ API
- Crear credenciales OAuth 2.0
- Agregar URL_DEL_PROYECTO/api/auth/callback/google como Redirect URI
- Configurar environment variables
---

## Esquema de Base de Datos

### Tablas principales

| Tabla | Descripción |
|---|---|
| `Usuarios` | Usuarios del sistema con rol, alias, pfp, racha de actividad |
| `Roles` | Roles disponibles (Admin, Empleado) |
| `Cursos` | Cursos de capacitación con título, descripción, imagen |
| `Secciones` | Secciones dentro de un curso con orden |
| `Archivos` | Biblioteca de materiales (PDF, MP4, LINK) |
| `Archivos_Curso` | Relación muchos-a-muchos: archivos asignados a cursos con orden y sección |
| `Archivos_Vistos` | Registro de qué archivos ha visto cada usuario en cada curso |
| `Quizzes` | Evaluaciones con título, descripción y puntaje mínimo |
| `Preguntas` | Preguntas de cada quiz |
| `Opciones` | Opciones de respuesta por pregunta (con flag `es_correcta`) |
| `Quiz_Curso` | Quizzes asignados a cursos con orden y sección |
| `Intentos_Quiz` | Historial de intentos de evaluación con calificación |
| `Quizzes_Completados` | Registro de quizzes aprobados por usuario y curso |
| `Inscripciones` | Inscripciones de usuarios a cursos |
| `Completaciones` | Registro de cursos completados al 100% |
| `Categorias` | Categorías de cursos y gemas |
| `Curso_Categorias` | Relación cursos ↔ categorías |
| `Gemas` | Recursos/notas personales creadas por usuarios |
| `Gema_Categorias` | Relación gemas ↔ categorías |
| `Publicaciones` | Posts de la comunidad |
| `Publicaciones_Imagenes` | Imágenes adjuntas a publicaciones (máx 5) |
| `Comentarios` | Comentarios en publicaciones |
| `LikesPublicacion` | Likes en publicaciones |
| `LikesComentario` | Likes en comentarios |
| `Notificaciones` | Notificaciones internas del sistema |

---

### Autenticación

#### `POST /api/login`
Login con email y contraseña.

**Body:**
```json
{ "email": "juan@whirlpool.com", "password": "12345" }
```
**Response 200:**
```json
{
  "message": "Login exitoso",
  "user": { "id": 1, "nombre": "Juan", "rol": 2, "pfp": "https://..." }
}
```
**Errores:** `401` credenciales inválidas, `500` error de servidor.

---

#### `POST /api/registro`
Registro de nuevo usuario con hash bcrypt.

**Body:**
```json
{ "nombre": "Juan Pérez", "email": "juan@whirlpool.com", "password": "12345", "rol_id": 2 }
```
**Response 201:** `{ "message": "Usuario registrado con éxito" }`  
**Errores:** `400` campo faltante o email ya registrado.

---

#### `GET|POST /api/auth/[...nextauth]`
Manejo de OAuth2 con Google vía NextAuth.js. Crea el usuario automáticamente si no existe. Solo acepta `@gmail.com` y `@whirlpool.com`.

---

### Usuario y Perfil

#### `GET /api/usuario?id={id}`
Retorna datos básicos del usuario (nombre, email, pfp, alias, rol, racha).

---

#### `GET /api/perfil?id={id}`
Retorna perfil completo con estadísticas de cursos e historial.

**Response:**
```json
{
  "usuario": { "nombre": "...", "alias": "...", "racha_actual": 5, "minutos_inactivo": 10 },
  "stats": { "total_inscritos": 4, "total_completados": 2 },
  "cursos": [...]
}
```

---

#### `PUT /api/perfil`
Actualiza alias y/o foto de perfil.

**Body:** `{ "usuario_id": 1, "alias": "juanito", "pfp": "https://..." }`

---

#### `POST /api/actividad`
Ping de actividad para actualizar `ultima_actividad` y calcular racha diaria. El Sidebar lo llama cada 3 minutos.

**Body:** `{ "usuario_id": 1 }`

---

### Cursos

#### `GET /api/cursos?usuario_id={id}`
Retorna todos los cursos inscritos del usuario con porcentaje de progreso calculado.

**Response:**
```json
[
  {
    "curso_id": 1, "titulo": "Seguridad Industrial",
    "porcentaje": 75, "completado": false,
    "total_archivos": 8, "archivos_vistos": 6,
    "tiene_quiz": 1, "quiz_aprobado": 0
  }
]
```

---

#### `GET /api/cursos/detalle?curso_id={id}&usuario_id={id}`
Retorna detalle completo del curso: metadata, secciones, items con estado de completado, porcentaje de progreso. También inserta en `Completaciones` si el usuario llegó al 100%.

**Response:**
```json
{
  "curso": { "titulo": "...", "categorias": "Seguridad, Industrial", "total_inscritos": 15 },
  "items": [
    { "id_contenido": 1, "titulo": "Introducción.pdf", "tipo": "archivo", "orden": 1, "seccion_id": 2, "completado": 1 }
  ],
  "secciones": [{ "seccion_id": 2, "titulo": "Módulo 1", "orden": 1 }],
  "porcentaje": 75,
  "esCompletado": false
}
```

---

### Progreso

#### `POST /api/progreso`
Registra un archivo como visto y calcula si el curso está completo.

**Body:** `{ "usuario_id": 1, "curso_id": 3, "archivo_id": 15 }`

**Response:**
```json
{ "completado": false, "progreso": "5/8", "porcentaje": 62, "necesitaQuiz": true }
```

---

### Quizzes

#### `GET /api/quiz/detalle?quiz_id={id}`
Retorna estructura del quiz (sin revelar respuestas correctas).

---

#### `POST /api/quiz/evaluar`
Evalúa las respuestas, guarda el intento, y si es aprobado verifica si el curso quedó completado.

**Body:**
```json
{
  "usuario_id": 1, "quiz_id": 5, "curso_id": 3,
  "respuestas": { "101": 403, "102": 407 }
}
```
**Response:**
```json
{ "calificacion": 85, "aprobado": true, "cursoCompletado": false }
```

---

### Archivos

#### `GET /api/archivos/{archivo_id}`
Retorna metadatos del archivo (nombre, URL, tipo, curso al que pertenece). Usado por el visor de materiales.

---

### Gemas

#### `GET /api/gemas?usuario_id={id}`
Retorna las gemas del usuario con sus categorías.

#### `POST /api/gemas`
Crea una gema (máx 10 por usuario).

**Body:** `{ "usuario_id": 1, "titulo": "Mi recurso", "descripcion": "...", "categorias": [2, 5] }`

#### `PUT /api/gemas`
Actualiza título, descripción y categorías de una gema.

#### `DELETE /api/gemas?gema_id={id}&usuario_id={id}`
Elimina una gema.

#### `GET /api/gemas/explorar`
Retorna todas las gemas de la plataforma ordenadas por fecha, con datos del autor.

#### `GET /api/gemas/buscar?q={query}`
Búsqueda de gemas por título o descripción (mín. 2 caracteres).

---

### Comunidad

#### `GET /api/comunidad?limit={n}&offset={n}&myId={id}`
Retorna publicaciones paginadas con likes, comentarios e imágenes.

**Query params opcionales:** `usuario_id` para filtrar por autor.

#### `POST /api/comunidad`
Crea una publicación.

**Body:** `{ "usuario_id": 1, "titulo": "Título", "contenido": "...", "gema_id": null }`

#### `PUT /api/comunidad`
Edita título y contenido de una publicación propia.

#### `DELETE /api/comunidad?id={id}&uid={uid}`
Elimina una publicación propia y sus likes.

---

#### `GET /api/comunidad/imagenes?publicacion_id={id}`
Lista imágenes de una publicación.

#### `POST /api/comunidad/imagenes`
Adjunta una imagen a una publicación (máx 5).

#### `DELETE /api/comunidad/imagenes?imagen_id={id}`
Elimina una imagen.

---

### Comentarios

#### `POST /api/comentarios`
Agrega un comentario y envía notificación interna + email al dueño del post.

**Body:** `{ "usuario_id": 1, "publicacion_id": 10, "contenido": "Excelente!" }`

#### `PUT /api/comentarios`
Edita un comentario propio.

#### `DELETE /api/comentarios?id={id}&uid={uid}`
Elimina un comentario propio y sus likes.

---

### Likes

#### `POST /api/likes`
Toggle de like en post o comentario. Si ya existe, lo elimina; si no, lo crea y notifica al dueño.

**Body:** `{ "usuario_id": 1, "id": 10, "tipo": "post" }` — `tipo` puede ser `"post"` o `"comment"`.

---

### Notificaciones

#### `GET /api/notificaciones?usuario_id={id}`
Retorna las últimas 20 notificaciones del usuario.

#### `PUT /api/notificaciones`
Marca todas las notificaciones como leídas.

**Body:** `{ "usuario_id": 1 }`

#### `DELETE /api/notificaciones?id={id}`
Elimina una notificación específica.

---

### Chat (IA)

#### `POST /api/chat`
Envía un mensaje al chatbot Gemini. Si detecta intención de consulta de datos personales y no hay contexto RAG, retorna `{ "necesita_contexto": true }`.

**Body:**
```json
{
  "prompt": "¿Qué cursos tengo pendientes?",
  "historial": [...],
  "nombreUsuario": "Juan",
  "usuario_id": 1,
  "contextoRAG": "=== PERFIL DEL USUARIO ===\n..."
}
```
**Response:** `{ "text_content": "Tienes 2 cursos pendientes...", "uso_rag": true }`

---

#### `GET /api/rag/contexto?usuario_id={id}`
Genera el contexto personalizado del usuario (cursos, gemas, publicaciones, notificaciones) para el chatbot RAG.

---

### Búsqueda

#### `GET /api/usuario/buscar?q={query}`
Búsqueda de usuarios por nombre o alias (mín. 2 caracteres, máx. 20 resultados).

---

### Admin — Cursos

#### `GET /api/admin/dashboard`
Retorna todos los cursos con categorías concatenadas y datos del creador.

#### `POST /api/admin/cursos`
Crea un curso completo (con transacción): curso → categorías → archivos → quizzes → inscripciones.

#### `PUT /api/admin/cursos/{id}`
Actualiza título, descripción y descripción corta de un curso.

#### `DELETE /api/admin/cursos/{id}`
Elimina un curso.

---

#### `GET /api/admin/cursos/{id}/materiales`
Lista materiales de un curso con orden y sección.

#### `POST /api/admin/cursos/{id}/materiales`
Agrega un material al curso.

#### `PUT /api/admin/cursos/{id}/materiales`
Actualiza orden y sección de los materiales.

#### `DELETE /api/admin/cursos/{id}/materiales?relacion_id={id}`
Quita un material del curso.

---

#### `GET /api/admin/cursos/{id}/examenes`
Lista exámenes de un curso.

#### `POST /api/admin/cursos/{id}/examenes`
Agrega un examen al curso.

#### `PUT /api/admin/cursos/{id}/examenes`
Actualiza orden y sección de exámenes.

#### `DELETE /api/admin/cursos/{id}/examenes?quiz_curso_id={id}`
Quita un examen del curso.

---

#### `GET /api/admin/cursos/{id}/secciones`
Lista secciones de un curso.

#### `POST /api/admin/cursos/{id}/secciones`
Crea una sección en el curso.

#### `PUT /api/admin/cursos/{id}/secciones`
Renombra una sección.

#### `DELETE /api/admin/cursos/{id}/secciones?seccion_id={id}`
Elimina una sección y desasigna su contenido.

---

#### `PUT /api/admin/cursos/{id}/categorias`
Reemplaza las categorías de un curso (borra las actuales e inserta las nuevas).

---

### Admin — Materiales y Exámenes

#### `GET /api/admin/archivos`
Lista todos los materiales de la biblioteca.

#### `POST /api/admin/archivos`
Registra un nuevo material (la URL ya fue subida a Supabase desde el cliente).

#### `DELETE /api/admin/archivos?id={id}`
Elimina un material de la biblioteca y lo desasigna de todos los cursos.

---

#### `GET /api/admin/quizzes`
Lista todos los exámenes con conteo de preguntas.

#### `POST /api/admin/quizzes`
Crea un examen completo (transacción): quiz → preguntas → opciones.

#### `DELETE /api/admin/quizzes?id={id}`
Elimina un examen con todas sus preguntas, opciones y referencias.

---

#### `GET /api/admin/quizzes/{id}`
Retorna un examen completo con preguntas, opciones y flag `es_correcta` (para edición).

#### `PUT /api/admin/quizzes/{id}`
Actualiza un examen completo: agrega/edita/elimina preguntas y opciones (transacción).

---

### Admin — Usuarios e Inscripciones

#### `GET /api/admin/usuarios`
Lista todos los usuarios en formato `{ value: id, label: nombre }`.

---

#### `GET /api/admin/asignar?curso_id={id}`
Retorna dos listas: usuarios disponibles para inscribir e inscritos actualmente.

#### `POST /api/admin/asignar`
Inscribe a un usuario en un curso y envía notificación interna + email.

**Body:** `{ "usuario_id": 5, "curso_id": 2 }`

#### `DELETE /api/admin/asignar`
Desinscribe a un usuario de un curso.

---

### Admin — Estadísticas

#### `GET /api/admin/stats`
Stats globales de la plataforma.

**Response:** `{ "totalAlumnos": 50, "totalCursos": 12, "tasaCompletado": 65, "promedioQuiz": 78 }`

---

#### `GET /api/admin/stats?usuario_id={id}`
Stats individuales de un alumno (cursos, completados, promedio de quiz, mejor puntaje).

---

#### `GET /api/admin/stats/curso?curso_id={id}`
Stats detalladas de un curso: inscritos, tasa de finalización, promedio de quizzes, materiales, top alumnos y progreso por sección.

---

#### `GET /api/admin/stats/usuarios`
Stats generales de usuarios: total, activos en el último mes, sin cursos, distribución por rol, actividad en comunidad (posts, comentarios, gemas), top 5 alumnos.

---

#### `POST /api/admin/recordatorios`
Envía emails masivos a todos los alumnos con cursos sin avance en los últimos 7 días.

---

### Admin — Categorías

#### `GET /api/admin/categorias` — Lista todas las categorías.
#### `POST /api/admin/categorias` — Crea una categoría.
#### `PUT /api/admin/categorias` — Renombra una categoría.
#### `DELETE /api/admin/categorias?id={id}` — Elimina una categoría.

---

## Roles de Usuario

| `rol_id` | Nombre | Acceso |
|---|---|---|
| `1` | Administrador | Panel admin completo, gestión de cursos/materiales/exámenes/alumnos/estadísticas, acceso a todo lo del empleado |
| `2` | Empleado | Dashboard personal, cursos inscritos, perfil, gemas, comunidad, chatbot |