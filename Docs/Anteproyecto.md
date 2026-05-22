## Descripción
En la actualidad muchas pymes siguen gestionando sus recursos humanos con hojas de cálculo o procesos manuales, lo que dificulta el control de horarios, vacaciones y ausencias, además de generar errores y suponer una pérdida de tiempo a la larga. Se propone el desarrollo de una aplicación web para gestionar el sistema de recursos humanos que permitirá centralizar la información de los empleados y agilizar tareas como el control de ausencias, la gestión de vacaciones y el registro de la jornada laboral. El sistema seguirá una arquitectura cliente-servidor con un frontend SPA desarrollado en Angular y un backend REST con Spring Boot, utilizando MongoDB como base de datos para el almacenamiento de la información. El objetivo principal es ofrecer una solución sencilla, escalable y accesible desde cualquier dispositivo, que mejore la eficiencia del departamento de recursos humanos.


## Objetivos y funcionalidades
Los objetivos de nuestro proyecto son los siguientes:
- Diseñar y desarrollar una aplicación web para la gestión básica de RRHH (empleados, vacaciones, ausencias y registro horario).
- Implementar un frontend SPA con Angular que proporcione una interfaz usable y accesible desde distintos dispositivos.
- Desarrollar un backend REST con Spring Boot que exponga los servicios necesarios para la gestión de la información.
- Modelar y almacenar los datos en una base de datos MongoDB, aprovechando su flexibilidad para documentos de empleados y registros de fichajes.
- Garantizar aspectos básicos de seguridad como autenticación y autorización de usuarios del sistema (administrador de RRHH, empleados, mandos intermedios, etc).

Las funcionalidades básicas previstas son las siguientes:
- Gestión de empleados: gestión de altas y bajas de empleados y edición de datos personales y laborales.
- Gestión de vacaciones y ausencias: solicitudes por parte del empleado, aprobación o rechazo por parte de responsables y control de ausencias.
- Control horario: registro de fichajes de entrada y salida, consulta de horas trabajadas por día/mes y soporte de teletrabajo.
- Panel de RRHH: vista general de empleados, ausencias y horas registradas con filtros básicos y exportación de datos.
- Gestión de usuarios y roles: administración de cuentas y asignación de permisos.

## Tecnologías utilizadas
### Front
Angular para desarrollar una SPA con componentes reutilizables y comunicación backend vía HTTP/JSON.
### Back
Spring Boot para implementar una API REST que gestione la lógica de negocio y acceso a datos.
### Otros
MongoDB como base de datos documentar para almacenar empleados, administradores, solicitudes y registros de fichaje.
