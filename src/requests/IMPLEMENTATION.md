# Requests, pickups y notifications

Los servicios usan repositorios TypeORM registrados en cada módulo. La validación
es local, sin class-validator ni cambios al ValidationPipe global. Los helpers
compartidos de validación y errores están en `persistence.util.ts`.

- Requests conserva sus rutas GET, POST, PUT y DELETE. Crear exige `userId`,
  `foodPublicationId` y `quantity` positiva (admite decimales). PUT solo admite
  `quantity`. PUT `:id/accept` exige `{ "status": "accepted" }` y PUT
  `:id/reject` exige `{ "status": "rejected" }`. No se imponen transiciones
  adicionales. Se comprueban las referencias al crear y modificar.
- Pickups conserva GET, POST y PUT. POST exige `requestId` y `scheduledAt`;
  PUT admite `scheduledAt` y `status` (`scheduled`, `completed`, `cancelled`).
  Las fechas deben ser timestamps ISO con segundos y zona horaria, por ejemplo
  `2026-12-01T12:00:00Z`. Se rechazan fechas de calendario inexistentes.
- Notifications incorpora GET `notifications/users/:userId`, GET
  `notifications/users/:userId/:id` y PUT
  `notifications/users/:userId/:id/read`, con `{ "isRead": true }` o `false`,
  conforme al booleano del DTO. Se comprueba que exista el usuario y la
  notificación se consulta siempre por ambos identificadores.

Se rechazan campos ajenos a cada DTO. UUID/datos inválidos producen 400,
registros o referencias ausentes 404, restricciones de integridad PostgreSQL
409 y fallos inesperados de persistencia 500. Las respuestas no cargan usuarios
ni sus contraseñas.

## Coordinación pendiente

- No hay autenticación/autorización en estas rutas. El userId de la URL es
  suministrado por el cliente: filtrar por pertenencia no impide que alguien
  use el UUID de otro usuario. El equipo debe vincularlo a una identidad
  autenticada y definir permisos para solicitudes y recogidas también.
- Pickup.requestId no tiene relación ni índice único. No se añade una
  restricción de una recogida por solicitud: la cardinalidad debe acordarse.
- Las referencias se comprueban con consultas, sin nuevas claves foráneas.
  Sin restricciones en la base de datos, una eliminación concurrente puede
  invalidar una referencia después de validarla. Coordinar migraciones si se
  necesita garantizar esa integridad ante concurrencia.
- No se crean notificaciones automáticamente; esa integración queda pendiente.
- Las pruebas unitarias usan repositorios simulados; la comprobación HTTP
  posterior usa PostgreSQL real aislado (ver resultados al final).

## Archivos de la entrega

En cada uno de `src/requests`, `src/pickups` y `src/notifications`:

- Modificado `<modulo>.controller.ts` para delegar al servicio.
- Modificado `<modulo>.module.ts` para registrar servicio y repositorios.
- Creado `<modulo>.service.ts` con las operaciones de persistencia.
- Creado `<modulo>.service.spec.ts` con pruebas unitarias de los servicios.

Además, se crearon este documento y `src/requests/persistence.util.ts`.
No se modificaron entidades, DTOs ni la lógica de otros módulos. Posteriormente,
con autorización, se ajustó Jest y se añadió el script de verificación HTTP.

## Verificación realizada

- `npm.cmd ci --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=20000 --cache .tmp/npm-cache`:
  instaló 623 paquetes sin modificar el lockfile. Los intentos anteriores en
  el entorno restringido no completaron la instalación. npm advirtió que
  algunas herramientas de Nest requieren Node 24.15.0 y el entorno usa 24.14.0.
- `npm.cmd run build`: terminó con código 0.
- `npm.cmd run lint`: terminó con código 0.
- `npm.cmd test -- --runInBand --runTestsByPath src/requests/requests.service.spec.ts src/pickups/pickups.service.spec.ts src/notifications/notifications.service.spec.ts`:
  código 1; las tres suites se detuvieron con TS5011: TypeScript 6 exige
  configurar `rootDir`. **0 pruebas ejecutadas**. Se conservó la configuración
  Jest/TypeScript del equipo.
- Comprobación estática independiente de los tres archivos de pruebas:
  `node_modules/.bin/tsc.cmd --noEmit --ignoreConfig --experimentalDecorators --emitDecoratorMetadata --target es2023 --module nodenext --moduleResolution nodenext --skipLibCheck --esModuleInterop --strict --strictPropertyInitialization false --types node,jest src/requests/requests.service.spec.ts src/pickups/pickups.service.spec.ts src/notifications/notifications.service.spec.ts`:
  terminó con código 0. Esto comprueba tipos; no ejecuta las pruebas.
- Prettier se ejecutó solo sobre los trece archivos TypeScript de esta entrega.
- `git diff --check`: sin errores de espacios; Git advirtió la conversión
  habitual de LF a CRLF en Windows.

En PowerShell se usó `npm.cmd` porque la política de ejecución bloquea `npm.ps1`.
En esa primera verificación no se probó contra PostgreSQL real.

## Comprobación posterior autorizada

Se inspeccionaron `jest.config.ts`, `tsconfig.json`, `tsconfig.build.json`,
`.env.example` y `docker-compose.yml`. Compose usa el puerto 5432 y un volumen
persistente; no se ejecutó. Docker estaba detenido. Se usaron los binarios
PostgreSQL 12 instalados para crear un clúster temporal separado del servicio local.

### Jest y TypeScript

Se cambió solo el transform en `jest.config.ts` de `'ts-jest'` a
`['ts-jest', { tsconfig: { rootDir: '.' } }]`. No se cambiaron tsconfig.json,
tsconfig.build.json, package.json ni package-lock.json. No se añadieron dependencias.

El intento de `npm.cmd test` después del cambio resolvió TS5011, pero falló
con `Must use import to load ES Module` al cargar NestJS, con 0 tests ejecutados.
Se ejecutó después, sin modificar scripts compartidos:

```powershell
$env:NODE_OPTIONS = '--experimental-vm-modules'
npm.cmd test -- --runInBand --runTestsByPath src/requests/requests.service.spec.ts src/pickups/pickups.service.spec.ts src/notifications/notifications.service.spec.ts
```

Resultado final: **código 0, 3 suites aprobadas, 57 tests aprobados**, 0 snapshots.
Node emitió su advertencia de VM Modules experimental. También se ejecutó
`node --experimental-vm-modules node_modules/jest/bin/jest.js` con los mismos
argumentos: 3 suites y 57 tests aprobados. Sin la opción ESM, npm test sigue
sin poder cargar NestJS ESM.

### PostgreSQL aislado y HTTP

Se ejecutaron estos comandos desde la raíz, usando los binarios de
`C:\Program Files\PostgreSQL\12\bin`:

```powershell
initdb.exe -D .tmp\pg-verification -U foodbridge_test -A trust --encoding=UTF8 --locale=C
pg_ctl.exe -D .tmp\pg-verification -l .tmp\pg-verification.log -o '-h 127.0.0.1 -p 55439' -w start
psql.exe -X -h 127.0.0.1 -p 55439 -U foodbridge_test -d postgres -v ON_ERROR_STOP=1 -c "SHOW data_directory" -c "SHOW port" -c "CREATE DATABASE foodbridge_verification"
npm.cmd run build
node src/requests/verify-postgres.cjs
```

El intento inicial de initdb en el sandbox falló por el token restringido
de Windows; se repitió fuera del sandbox y terminó con código 0. Inicialización,
arranque y creación de base posteriores terminaron con código 0.
Antes de escribir se confirmó `data_directory = <proyecto>/.tmp/pg-verification`,
puerto `55439` y base exclusiva `foodbridge_verification`. El script verifica
también que la base esté vacía antes de habilitar `synchronize`. No lee `.env`
ni usa el puerto 5432. El servidor temporal escucha solo en 127.0.0.1.

Resultado del script: **código 0, 39 comprobaciones HTTP aprobadas**, con
repositorios reales y aserciones del estado persistido. Incluye operaciones de
los tres módulos, validaciones, referencias inexistentes, filtros por usuario
y ausencia de la contraseña de prueba en respuestas. Se comprobaron 409 y 500
reales mediante una restricción temporal y un renombrado temporal de tabla en
la base desechable; ambos cambios se revirtieron.

Se montó una aplicación Nest de pruebas con los tres módulos reales y TypeORM,
sin el AppModule global ni su telemetría. Esto verifica sus rutas y persistencia,
no el arranque de la aplicación completa con servicios externos. El filtro por
userId sigue sin constituir autenticación/autorización.

Al terminar se ejecutó `pg_ctl.exe -D .tmp\pg-verification -m fast -w stop`
(código 0). Se verificó la ruta absoluta dentro del proyecto y la ausencia de
`postmaster.pid` antes de eliminar exclusivamente el directorio temporal.
El clúster quedó detenido y eliminado. No se reutilizaron ni borraron datos del
PostgreSQL local. El log queda en `.tmp/pg-verification.log`, ignorado por Git.
Para repetir el script hay que crear otra vez el clúster y la base vacía.

### Resultados finales y archivos de esta fase

- `npm.cmd run build`: código 0.
- `npm.cmd run lint`: código 0.
- Specs con la opción ESM: código 0, 57/57 tests.
- HTTP contra PostgreSQL aislado: código 0, 39 comprobaciones.
- `git diff --check`: sin errores de espacios.
- No se cambió la lógica de los módulos.
- En esta fase se modificaron `jest.config.ts` y este documento, y se creó
  `src/requests/verify-postgres.cjs`. Los cambios anteriores siguen pendientes.
- No se hizo commit, push, merge ni PR.
