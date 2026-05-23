# ZENTRY

## Introducción y justificación

Zentry es una aplicación web de gestión de recursos humanos pensada para pymes que todavía dependen de hojas de cálculo o procesos manuales para gestionar su plantilla. El objestivo es centralizar en una sola plataforma todo lo relacionado con empleados, vacaciones, ausencias, fichaje horario y comunicación interna.
La motivación principal fue desarrollar un producto con lógica de negocio real y compleja que permitiera poner en práctica de forma conjunta todo lo aprendido durante el ciclo.

---

## Análisis y diseño del proyecto

### Arquitectura

Zentry cuenta con una arquitectura SPA. El frontend es una SPA en Angular que se comunica con una API REST en Spring Boot mediante HTTP y JWT. La base de datos es MongoDB. Para el chat en tiempo real se usa WebSocket con el protocolo STOMP sobre SockJS.

Angular SPA <--- HTTP/REST + JWT ---> Spring Boot API ---> MongoDB  
ㅤㅤ|  
WebSocket (STOMP)

### Tecnologías

**Frontend:** Angular 17+ con Signals, Angular Material, CDK DragDrop, Chart.js, SheetJS y Font Awesome.

**Backend:** Spring Boot 3 con Spring Security, Spring Data MongoDB, Spring WebSocket y Spring Mail. Autenticación con JWT (JJWT) y contraseñas cifradas con BCrypt.

**Base de datos:** MongoDB.

---

### Perfiles de usuarios

| Perfil | Acceso |
|---|---|
| **Empleado** | Sus propios datos, solicitudes de vacaciones y ausencias, fichaje, chat y tablón |
| **Mando intermedio** | Lo anterior más gestión y consulta del equipo a su cargo |
| **Administrador RRHH** | Acceso completo; gestión de empleados, usuarios, exportaciones, panel RRHH y configuración |
---

### Requisitos funcionales y no funcionales

**Funcionales:**
- Autenticación con JWT, recuperación y cambio de contraseña
- Gestión completa de empleados y usuarios con roles
- Solicitud, aprobación y rechazo de vacaciones con control de saldo
- Sugerencia de nuevas fechas de vacaciones arrastrando sobre el calendario
- Solicitudes de ausencia por tipo
- Fichaje de entrada/salida con cálculo de horas e incidencias
- Panel RRHH con KPIs y gráfico de asistencia
- Exportación a Excel de empleados, vacaciones, ausencias y demás información
- Chat en tiempo real con mensajes individuales y grupales, respuestas, reacciones, mensajes fijados y edición
- Tablón de anuncios con categorías, imágenes y comentarios con respuestas anidadas
- Notificaciones in-app y por email configurables por el usuario
- Perfil de usuario con foto y calendario
- Tema oscuro y claro
  
**No funcionales:**
- Rutas protegidas mediante guards en Angular y Spring Security
- Datos sensibles visibles solo para el propio empleado o administradores
- Diseño responsive
- CORS restringido al origen del frontend
- Token JWT requerido también en el handshake WebSocket

---

### Estructura de navegación

```
/login  /cambiar-password  /resetear-password
├── /dashboard
├── /asistencia
├── /vacaciones
├── /ausencias
├── /empleados
├── /mi-equipo
├── /usuarios
├── /admin-dashboard
├── /reportes
├── /chat
├── /perfil
├── /anuncios/:id
└── /preferencias-notificaciones
```
---

### Organización de la lógica de negocio

El backend está organizado por dominio funcional, cada uno con su controlador, servicio y repositorio:

`Auth` · `Empleado` · `Usuario` · `Vacaciones` · `Ausencia` · `Asistencia` · `Dashboard` · `Chat` · `Anuncio` · `Notificacion` · `Reportes`

El chat usa una capa adicional de WebSocket gestionada por `ChatService` y `SimpMessagingTemplate` para distribuir los mensajes en tiempo real a los participantes de cada conversación.

Servicio externo: **Spring Mail / SMTP** para notificaciones y recuperación de contraseña y el **API de Nager.Date** para los festivos en España.

---

### Modelo de datos

| Colección | Contenido principal |
|---|---|
| `employees` | Datos personales, laborales y foto |
| `users` | Credenciales, rol y referencia al empleado |
| `vacations` | Solicitudes con fechas, días y estado |
| `absences` | Solicitudes por tipo con documentación |
| `attendance` | Fichajes diarios y horas calculadas |
| `conversaciones` | Participantes y tipo de chat |
| `teams` | Equipos de trabajo con su respectivo líder asignado y miembros asociados |
| `mensajes` | Contenido, reacciones, respuestas y estado fijado |
| `anuncios` | Categoría, imagen, comentarios anidados y lecturas |
| `notificaciones` | Avisos in-app con estado de lectura |
| `preferencias_notificaciones` | Configuración individualizada de notificaciones (email, in-app) |
| `reacciones` | Registro de reacciones con emojis en el módulo de chat |
| `sugerencias_vacaciones` | Propuestas de cambio de fechas |
| `token_recuperacion` | Tokens temporales para reset de contraseña |

---

## Conclusiones

Los objetivos principales de centralización de datos se han cumplido y aplicación cubre las necesidades básicas de un equipo de RRHH, además añade funcionalidades que van más allá de lo necesario y de lo planeado inicialmente, como el chat en tiempo real con WebSocket, el sistema de notificaciones, el calendario interactivo con drag & drop o el tema oscuro.

Los mayores retos fueron integrar JWT con WebSocket en Spring Security, y mantener la consistencia del estado del chat en el frontend con Angular Signals. El tema oscuro también requirió más trabajo del esperado para cubrir los componentes de Angular Material.

El desarrollo se organizó con una metodología Kanban para gestionar el trabajo de cada miembro, de ahí se iba formando el proyecto de forma iterativa por bloques funcionales: autenticación → empleados → vacaciones → horario → panel RRHH → chat → tablón → notificaciones → mejoras visuales.

Una integración con calendarios externos por comunidad autónoma, generación de informes en PDF y edición de comentarios en anuncios podrías ser buenas mejoras para un futuro.

---

## Bibliografía

- [Angular](https://angular.dev)
- [Spring Boot](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Security](https://docs.spring.io/spring-security/reference/)
- [MongoDB](https://www.mongodb.com/docs/)
- [Chart.js](https://www.chartjs.org/docs/)
- [SheetJS](https://docs.sheetjs.com)
- [@stomp/stompjs](https://stomp-js.github.io/stomp-websocket/)

---

### Guía de instalación

**Backend**  
*Windows:*
```cmd
cd Zentry\App\Back
mvnw.cmd spring-boot:run
```

*Mac/Linux:*
```bash
cd Zentry/App/Back
./mvnw spring-boot:run
```

**Frontend**
```bash
cd Zentry/App/Front
npm install
ng serve
```

**Base de datos**
# Acceder al directorio
cd Zentry\App\BD

# Comandos de importación utilizando mongoimport
```
mongoimport --db zentry --collection absences --file zentry.absences.json --jsonArray
mongoimport --db zentry --collection anuncios --file zentry.anuncios.json --jsonArray
mongoimport --db zentry --collection attendance --file zentry.attendance.json --jsonArray
mongoimport --db zentry --collection conversaciones --file zentry.conversaciones.json --jsonArray
mongoimport --db zentry --collection employees --file zentry.employees.json --jsonArray
mongoimport --db zentry --collection mensajes --file zentry.mensajes.json --jsonArray
mongoimport --db zentry --collection notificaciones --file zentry.notificaciones.json --jsonArray
mongoimport --db zentry --collection preferencias_notificaciones --file zentry.preferencias_notificaciones.json --jsonArray
mongoimport --db zentry --collection reacciones --file zentry.reacciones.json --jsonArray
mongoimport --db zentry --collection sugerencias_vacaciones --file zentry.sugerencias_vacaciones.json --jsonArray
mongoimport --db zentry --collection teams --file zentry.teams.json --jsonArray
mongoimport --db zentry --collection tokens_recuperacion --file zentry.tokens_recuperacion.json --jsonArray
mongoimport --db zentry --collection users --file zentry.users.json --jsonArray
mongoimport --db zentry --collection vacations --file zentry.vacations.json --jsonArray
```

### Disponible en `http://localhost:4200`
---

Paula Búrdalo Sánchez, Iván Izquierdo Castillo  
2025/2026 DAWB
