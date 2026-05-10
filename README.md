# Cuestionario Matemático Web

Aplicación web desarrollada con React + Firebase orientada a la creación, administración y resolución de cuestionarios matemáticos interactivos utilizando renderizado LaTeX con MathJax.

El proyecto fue pensado para contextos educativos, especialmente para docentes que necesiten generar evaluaciones matemáticas dinámicas, visuales y fáciles de administrar.

---

# ✨ Características principales

## 👨‍🏫 Panel de Administración

- Creación de preguntas matemáticas
- Soporte completo para fórmulas LaTeX
- Vista previa en tiempo real
- Editor matemático integrado
- Inserción de símbolos en posición del cursor
- Funciones matemáticas avanzadas
- Popup interactivo de fórmulas
- Gestión de preguntas cargadas
- Archivado de cuestionarios
- Restauración de cuestionarios archivados
- Exportación PDF de cuestionarios
- Gestión de estudiantes
- Sistema de revisiones por alumno

---

# 🧠 Cuestionarios

- Selección aleatoria de preguntas
- Corrección automática
- Puntaje final
- Sistema de monedas
- Registro de respuestas del alumno
- Registro de preguntas mostradas
- Revisión completa del cuestionario realizado

---

# 🔒 Seguridad implementada

El sistema incluye varias protecciones durante el cuestionario:

- Bloqueo de copiar/cortar
- Bloqueo de clic derecho
- Bloqueo de F12
- Bloqueo de Ctrl+C, Ctrl+U, Ctrl+S, Ctrl+P
- Detección de PrintScreen
- Blur automático al salir de la pestaña

---

# 📋 Sistema de Revisiones

Cada cuestionario finalizado guarda:

- Nombre del estudiante
- Preguntas realizadas
- Opciones disponibles
- Respuesta seleccionada
- Respuesta correcta
- Puntaje obtenido
- Fecha y hora

Además:

- Se pueden marcar cuestionarios como revisados
- Filtro de revisiones pendientes
- Filtro de cuestionarios revisados

---

# 🧮 Soporte Matemático

La aplicación soporta:

- Fracciones
- Potencias
- Radicales
- Números reales y complejos
- Logaritmos
- Trigonometría
- Límites
- Derivadas
- Integrales
- Resolvente
- Conjuntos
- Símbolos lógicos

Utilizando:

```latex
$\frac{a}{b}$
$\sqrt{x}$
$\int_a^b f(x)dx$
```

---

# 🚀 Tecnologías utilizadas

- React
- Firebase Firestore
- MathJax
- better-react-mathjax
- React Toastify
- jsPDF
- html2canvas
- Vite

---

# 📁 Estructura principal

```txt
src/
│
├── AdminPanel.jsx
├── AdminQuestions.jsx
├── AdminReviews.jsx
├── AdminStudents.jsx
├── Quiz.jsx
├── Ranking.jsx
├── firebase.js
└── App.jsx
```

---

# 🔥 Firebase

## Colecciones utilizadas

### questions

Guarda preguntas activas.

```js
{
  question: "",
  options: [],
  correct: 0
}
```

---

### archives

Guarda cuestionarios archivados.

```js
{
  name: "",
  questions: [],
  createdAt: ""
}
```

---

### students

Información de estudiantes.

```js
{
  name: "",
  completed: false,
  score: 0,
  coins: 0
}
```

---

### reviews

Registro completo de cuestionarios realizados.

```js
{
  student: "",
  score: 0,
  total: 10,
  createdAt: "",
  reviewed: false,
  answers: []
}
```

---

# ⚙️ Instalación

## 1. Clonar repositorio

```bash
git clone https://github.com/tuusuario/cuestionario.git
```

---

## 2. Instalar dependencias

```bash
npm install
```

---

## 3. Ejecutar proyecto

```bash
npm run dev
```

---

# 🔥 Configuración Firebase

Crear archivo:

```txt
src/firebase.js
```

## Ejemplo:

```js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
```

---

# 🔐 Firestore Rules

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

# 📄 Exportación PDF

Los cuestionarios archivados pueden exportarse automáticamente en PDF incluyendo:

- Preguntas
- Opciones
- Respuestas correctas
- Fórmulas matemáticas renderizadas

---

# 🎯 Objetivo educativo

El proyecto fue desarrollado para:

- Evaluaciones matemáticas digitales
- Actividades interactivas
- Cuestionarios escolares
- Práctica autónoma
- Corrección rápida
- Seguimiento de alumnos

---

# 💡 Posibles mejoras futuras

- Autenticación de administradores
- Temporizador por pregunta
- Estadísticas avanzadas
- Dashboard analítico
- Modo examen
- Exportación Excel
- Cuestionarios por dificultad
- Multiplayer en tiempo real
- WebSocket de usuarios conectados

---

# 👨‍💻 Autor

Proyecto desarrollado por Federico.
