# Documentación de Actualizaciones: Sistema "La Ruta del Sabor" (Frontend & Backend)

Este documento detalla las implementaciones recientes y las correcciones de errores críticos (bugs) aplicadas tanto en el Backend (Spring Boot) como en el Frontend (React). Estas actualizaciones garantizan la estabilidad del sistema, la sincronización de zonas horarias y la correcta separación de responsabilidades por roles.

## 1. Gestión de Roles y Rutas (Frontend)
Se ha implementado un sistema estricto de protección de rutas (`PrivateRoute.tsx`) que evalúa el rol del usuario en sesión y lo redirige a su área de trabajo correspondiente[cite: 3]. 

Los roles operativos y administrativos ya integrados son[cite: 3]:
*   **`ROLE_SUPER_ADMIN` / `ROLE_ADMIN_EMPRESA` / `ROLE_GERENTE_SEDE`:** Tienen acceso total a los paneles de administración (`/dashboard`, `/admin/catalogo`, `/admin/inventario`, etc.), así como permisos de supervisión y anulación en las áreas de Caja y Salón[cite: 3].
*   **`ROLE_MOZO`:** Restringido a `/mozo` para la toma de pedidos, adición de ítems y entrega de platillos[cite: 3].
*   **`ROLE_CAJERO`:** Restringido a `/cajero` para apertura/cierre de turnos, cobros directos, división de cuentas (Split) y facturación[cite: 3].
*   **`ROLE_COCINA`:** Restringido a `/cocina` (KDS) para gestionar la preparación de pedidos, consultar recetas y manejar la pizarra de disponibilidad (86)[cite: 3].

---

## 2. Correcciones Críticas en el Backend (Java/Spring Boot)

### A. Solución al Bug de Zona Horaria ("Doble Salto")
Se detectó que los pedidos se registraban con 5 horas de adelanto. Esto ocurría porque Java generaba la hora en UTC y PostgreSQL, al recibirla, volvía a restarle 5 horas por la configuración local del servidor.
*   **Corrección en Entidades:** Se reemplazó `ZoneOffset.UTC` por `ZoneId.systemDefault()` en los bloques `@PrePersist` y `@PreUpdate` de todas las entidades base (`BaseTenantEntity.java`, `Empresa.java`, `InsumoSede.java`, `Plan.java`, `Suscripcion.java`, `UsuarioSede.java`)[cite: 2].
*   **Corrección en Scheduler:** En `EscalacionScheduler.java`, el cálculo de tolerancia de 20 minutos ahora utiliza `LocalDateTime.now(ZoneId.systemDefault())` para coincidir exactamente con los registros de la base de datos[cite: 2].
*   **Corrección en Vistas SQL:** Se modificó la vista `vw_kds_cocina` para indicar explícitamente `AT TIME ZONE 'America/Lima'` al calcular los `minutos_transcurridos`, resolviendo el problema de los tiempos negativos que llegaban al Frontend[cite: 2].

### B. Solución al Error `403 Forbidden` en Eventos SSE
El navegador lanza múltiples peticiones de reconexión al `EventSource` (SSE) cuando se pierde la red, pero esta tecnología no admite el envío de cabeceras HTTP (Headers) con el `Bearer Token`.
*   **Corrección en KdsController:** Se eliminó la etiqueta `@PreAuthorize` del endpoint `/api/v1/kds/eventos`[cite: 2]. Ahora, el servidor extrae el token directamente desde los parámetros de la URL (`?token=...`) utilizando `JwtProvider` y consulta el `UsuarioRepository` para suscribir correctamente al usuario a su respectivo `empresaId` y `sedeId`[cite: 2].

### C. Refactorización Arquitectónica del Servicio KDS
Para evitar la saturación de `PedidoService`, se trasladó toda la lógica exclusiva de la cocina a `KdsServiceImpl` y `KdsController`[cite: 2]. Se implementaron los siguientes métodos nuevos:
*   **`deshacerPedido(Long pedidoId)`:** Permite regresar a la pantalla de cocina un pedido que fue accidentalmente marcado como `LISTO` o `ENTREGADO`[cite: 2].
*   **`obtenerRecetaKds(Long productoId)`:** Recupera las instrucciones de preparación desde la descripción del producto y lista los ingredientes vinculados activos[cite: 2].

---

## 3. Implementaciones en el Frontend (React)

### A. Pantalla de Cocina (KDS)
El módulo `CocinaPage.tsx` fue rediseñado para mejorar la experiencia en pantallas táctiles y añadir herramientas Enterprise[cite: 3]:
*   **Nuevas Vistas:** Se incorporó una barra superior que permite alternar entre "Tickets" (vista clásica), "Consolidado" (agrupación de platos idénticos a preparar) e "Historial" (para deshacer pedidos)[cite: 3].
*   **Filtro por Estaciones (Touch-friendly):** Se reemplazó el menú desplegable basado en *hover* por un elemento `<select>` nativo de HTML, garantizando que el filtro (ej. "Bebidas", "Parrilla") funcione perfectamente en tablets táctiles sin cerrarse accidentalmente[cite: 3].
*   **Visor de Recetas:** Se agregó un botón de información (`ℹ️`) en cada platillo del ticket[cite: 3]. Al presionarlo, dispara el endpoint `/recetas/producto/{productoId}` y abre un modal con la ficha técnica[cite: 3].
*   **Corrección del Reloj:** Se implementó una lógica de "saneamiento" en React que trunca cualquier valor de tiempo negativo enviado por error desde la BD (`Math.max(0, ...)`), forzando el inicio del cronómetro desde cero[cite: 3].

### B. Pantalla de Salón (Mozo)
En `MozoPage.tsx`, se aplicaron reglas de negocio estrictas para proteger la integridad de los cobros[cite: 3]:
*   **Protección de Mesas:** El botón de "Anular Pedido" (Tachito rojo) fue condicionado para ocultarse automáticamente en cuanto el pedido pasa a estado `ENTREGADO`, `PAGADO` o `CANCELADO`[cite: 3]. Esto evita que el Mozo limpie o anule una mesa manualmente cuando los comensales ya están comiendo[cite: 3]. La mesa ahora solo se libera cuando el Cajero procesa el pago final[cite: 3].
*   **Reconexión Silenciosa SSE:** Se implementó un manejador de errores en la conexión `EventSource`[cite: 3]. Si el servidor desconecta el socket, React atrapa el error silenciosamente y espera 5 segundos antes de intentar reconectar, eliminando el spam de errores rojos en la consola[cite: 3].

### C. Pantalla de Caja
En `CajeroPage.tsx`, se unificó el flujo de salida del restaurante[cite: 3]:
*   **Integración Módulo 4 (Split) y Módulo 7 (Facturación):** El cajero ahora puede dividir cuentas por ítems o por monto exacto[cite: 3].
*   **Liberación Automática:** Al procesar exitosamente un cobro múltiple (ej. Tarjeta + Efectivo), el backend marca la orden como `PAGADO`[cite: 3], lo que ocasiona que la mesa desaparezca automáticamente de la pantalla activa del Mozo[cite: 3].