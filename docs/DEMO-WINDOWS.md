# FoodBridge: demostración de Swagger en Windows

Rama: `feature/swagger-api-docs`. Base del PR: `main`. No hacer merge sin revisión humana.

## Arranque reproducible

Desde la raíz del repositorio, en PowerShell:

```powershell
node --version
npm.cmd --version
docker --version
docker info
netstat -ano -p tcp | Select-String ':3000 |:55439 |:5432 '
npm.cmd ci
npm.cmd run build
npm.cmd run lint
.\scripts\demo-start.ps1
```

Si PostgreSQL está en otra carpeta, usar:

```powershell
.\scripts\demo-start.ps1 -PgBin 'C:\Program Files\PostgreSQL\12\bin'
```

El script mantiene NestJS en primer plano. Usa otra consola para el ensayo y la siembra.
Para volver a arrancar, ejecutar el mismo script; reutiliza exclusivamente el clúster de demo.
Si la política local impide ejecutar scripts, puede ejecutarse para ese proceso:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\demo-start.ps1
```

Swagger UI: <http://localhost:3000/docs>. OpenAPI JSON: <http://localhost:3000/docs-json>.
`SWAGGER_ENABLED=true` habilita ambas rutas; por defecto están deshabilitadas.
Configuración basada en la [documentación oficial de NestJS](https://docs.nestjs.com/openapi/introduction).

El script crea un clúster PostgreSQL separado en `.tmp/pg-swagger-demo`, escucha solo
en `127.0.0.1:55439` y usa la base `foodbridge_swagger_demo` y el rol `foodbridge_demo`.
Genera una contraseña local y la conserva en `.tmp/demo-config.json`, excluido de Git.
No editar ese archivo para apuntar a otra base. No se usa el Compose principal ni el puerto 5432.
Antes de crear la base se comprueba el directorio real del servidor. Si el puerto pertenece
a otra instancia, el script se detiene. No borres archivos de un clúster existente para resolverlo.

Configura en el proceso de NestJS `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB`, `NODE_ENV=development`, `PORT=3000` y `SWAGGER_ENABLED=true`.
Las variables de proceso prevalecen sobre `.env`; el archivo personal se conserva.
TypeORM crea el esquema al iniciar en desarrollo, antes de sembrar notificaciones.
Los scripts de datos verifican servidor, puerto, usuario, base, directorio y las siete tablas.
Los datos, contraseñas de PostgreSQL y logs permanecen en `.tmp`, nunca se versionan.

Para detener solo esta demo: Ctrl+C en la consola de la API y luego:

```powershell
& 'C:\Program Files\PostgreSQL\12\bin\pg_ctl.exe' -D "$PWD\.tmp\pg-swagger-demo" -m fast -w stop
```

## Ensayo automático

Con la API iniciada, desde una segunda consola en la raíz:

```powershell
node scripts/demo-rehearse.cjs
```

Verifica Swagger/OpenAPI, cuerpos, esquemas y parámetros; después ejecuta exactamente las
diez llamadas HTTP contra la misma API. Comprueba también en PostgreSQL que el usuario
registrado existe en la base aislada y que la notificación termina leída. La siembra es SQL,
no una llamada HTTP adicional. Cada ensayo genera `ensayo.<timestamp>@example.test`.
Para el video se reserva `video.foodbridge@example.test`. Si ya grabaste con ese correo,
cambia el correo en ambos JSON de autenticación por otro ficticio nuevo.

## Guion para Swagger UI

En cada operación, expandir la fila y pulsar **Try it out**. Pegar el JSON en **Request body**,
completar los parámetros donde se indica y pulsar **Execute**. Mostrar **Server response**
y su código real. Los nombres en MAYÚSCULAS dentro de los JSON son marcadores: sustituirlos
por los UUID completos de las respuestas, conservando las comillas. No reutilizar UUID del ensayo.

### 1. Alejandro: POST /auth/register — 201

Pegar en Request body:

```json
{"name":"Video FoodBridge","email":"video.foodbridge@example.test","password":"DemoFoodBridge2026!"}
```

Copiar `user.id` como `USER_ID`. Mostrar que la respuesta contiene `message` y `user`
con `id`, `name`, `email`, y omite `password`.

**Fuera de cámara, inmediatamente después del registro y antes del login:** preparar la
notificación del usuario del video en la segunda consola. Sustituir el marcador:

```powershell
$USER_ID = 'REEMPLAZAR_POR_USER_ID'
node scripts/demo-notification.cjs $USER_ID
```

Copiar el `id` devuelto como `NOTIFICATION_ID`; verificar `userId=USER_ID` e `isRead=false`.
El comando valida el UUID y la base exclusiva antes de insertar; falla si no existe el usuario
o falta el esquema. Esta preparación no cuenta entre las diez llamadas de Swagger.
La API no genera esta notificación automáticamente.

### 2. Alejandro: POST /auth/login — 200

Request body:

```json
{"email":"video.foodbridge@example.test","password":"DemoFoodBridge2026!"}
```

Mostrar el mismo `user.id=USER_ID`. El login actual confirma credenciales, sin emitir JWT.

### 3. Luis: POST /categories — 201

Request body:

```json
{"name":"Frutas demo","description":"Alimentos ficticios para la demostracion"}
```

Copiar `id` como `CATEGORY_ID` y mostrar `name`.

### 4. Luis: POST /establishments — 201

Request body:

```json
{"name":"Restaurante Demo","type":"restaurant","address":"Calle Demo 123","phone":"3000000000","email":"local@example.test"}
```

Copiar `id` como `ESTABLISHMENT_ID` y mostrar `name` y `address`.

### 5. David: POST /food-publications — 201

Request body; reemplazar ambos UUID:

```json
{"establishmentId":"ESTABLISHMENT_ID","categoryId":"CATEGORY_ID","title":"Canasta demo","description":"Frutas para demostracion","quantity":10,"unit":"kg","expirationDate":"2026-12-02T18:00:00-05:00"}
```

Copiar `id` como `PUBLICATION_ID`. Mostrar ambos vínculos y `status=available`.

### 6. David: GET /food-publications/{id} — 200

En Parameters, campo `id`: pegar `PUBLICATION_ID`. No lleva cuerpo.
Mostrar que `id`, `title`, `categoryId` y `establishmentId` corresponden a la creación anterior.

### 7. Danilo: POST /requests — 201

Request body; reemplazar los UUID:

```json
{"userId":"USER_ID","foodPublicationId":"PUBLICATION_ID","quantity":2}
```

Copiar `id` como `REQUEST_ID`. Mostrar `status=pending`, los dos vínculos y la cantidad positiva.

### 8. Danilo: PUT /requests/{id}/accept — 200

En Parameters, `id`: `REQUEST_ID`. Request body:

```json
{"status":"accepted"}
```

Mostrar el mismo `id=REQUEST_ID` con `status=accepted`.
El DTO comparte los estados con rechazo, pero esta ruta exige exactamente `accepted`.

### 9. Danilo: POST /pickups — 201

Request body; reemplazar el UUID:

```json
{"requestId":"REQUEST_ID","scheduledAt":"2026-12-01T15:00:00-05:00"}
```

Mostrar `requestId=REQUEST_ID`, `status=scheduled` y `scheduledAt`.
La fecha incluye segundos y zona; la respuesta normaliza a `2026-12-01T20:00:00.000Z`.

### 10. Danilo: PUT /notifications/users/{userId}/{id}/read — 200

En Parameters: `userId=USER_ID` e `id=NOTIFICATION_ID` de la preparación fuera de cámara.
Request body:

```json
{"isRead":true}
```

Mostrar el mismo `id`, el mismo `userId` e `isRead=true`.

## Resultado verificado el 12 de noviembre de 2026 (Bogotá)

No se encontraron diferencias entre las diez rutas/métodos del guion y esta rama.
No se modificaron validaciones ni reglas de negocio. El arranque normal funciona con
Observe existente; no fue necesario un parche local ni cambiar `app.module.ts`.

| # | Responsable | Operación | HTTP observado | Evidencia comprobada |
|---|---|---|---|---|
| 1 | Alejandro | POST /auth/register | 201 | user.id; respuesta sin password; fila en base de demo |
| 2 | Alejandro | POST /auth/login | 200 | mismo user.id; sin password |
| 3 | Luis | POST /categories | 201 | id y name |
| 4 | Luis | POST /establishments | 201 | id y datos del local |
| 5 | David | POST /food-publications | 201 | id; categoryId y establishmentId correctos |
| 6 | David | GET /food-publications/{id} | 200 | objeto igual al recién creado |
| 7 | Danilo | POST /requests | 201 | pending; userId, foodPublicationId y quantity=2 |
| 8 | Danilo | PUT /requests/{id}/accept | 200 | mismo id; accepted |
| 9 | Danilo | POST /pickups | 201 | requestId correcto; scheduled |
| 10 | Danilo | PUT /notifications/users/{userId}/{id}/read | 200 | mismo id/userId; isRead=true en API y PostgreSQL |

`npm.cmd run build` y `npm.cmd run lint`: correctos. `/docs` y `/docs-json`: HTTP 200.
Las diez operaciones tienen documentación de éxito y errores; las nueve con JSON tienen
requestBody con propiedades, y las tres rutas parametrizadas exponen todos sus parámetros.
Se validó el HTML y los recursos HTTP de Swagger; queda pendiente la revisión visual e
interacción manual de Swagger UI en navegador, porque la sesión no dispone de automatización de navegador.

Entorno observado: Node 24.14.0, npm 11.9.0, Docker CLI 28.1.1, PostgreSQL local 12.
El daemon de Docker no estaba disponible: `open //./pipe/docker_engine: El sistema no puede encontrar el archivo especificado`.
Se usó el clúster local separado; Compose referencia `postgres:16-alpine`, sin modificarlo.
La instalación mostró `EBADENGINE` de herramientas Nest/Angular existentes que piden
`^22.22.3 || ^24.15.0 || >=26.0.0`; build y lint funcionaron con el Node disponible.
Para una instalación nueva, usar una versión de Node que satisfaga ese rango.

La comprobación adicional `npm.cmd test -- --runInBand` no pudo ejecutar las pruebas:
las nueve suites fallan al cargar dependencias ESM desde la configuración actual de Jest/ts-jest.
Error: `Must use import to load ES Module: C:\Users\Danilo\Documents\FoodBridge-API\node_modules\@nestjs\common\index.js`
(también aparece para `@nestjs/testing`). Se reproduce incluso en `app.controller.spec.ts`,
que no importa Swagger y no fue modificado. No se cambió la configuración de pruebas existente.
Queda pendiente corregir esa configuración; el ensayo HTTP real de las diez operaciones sí pasó.
