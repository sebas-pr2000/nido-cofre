# Nido · Cofre 🎁

> Regala la emoción de abrir un cofre y la tranquilidad de acertar.

- **Web:** https://nido-cofre.vercel.app
- **API:** https://nido-cofre-production.up.railway.app/api
- **Video demo:** https://drive.google.com/drive/folders/1nWLxiUWOd44NoqgJ857gKvQMGK85npfP

**Cómo probarlo en 1 minuto:** abre la web en una ventana normal y elige **Andrés**; ábrela en una ventana de **incógnito** y elige **Laura**. Pon las dos lado a lado. Andrés arma un cofre y lo paga con la tarjeta de prueba **"Aprobada"**; a Laura le llega en vivo. Desde ahí, cada acción de Laura (abrir, elegir, agradecer) aparece al instante en la pantalla de Andrés.

---

## 1. Propuesta

### El problema que elegí atacar

En Nido, el 35% de las compras son regalos y el **22% de esos regalos se devuelve o se cambia**. Con 180.000 usuarios al mes y una conversión de 1,4%, son unas 880 compras de regalo mensuales, de las cuales **casi 200 vuelven**. Cada devolución cuesta logística y margen, y deja una mala experiencia en las dos personas.

La causa de fondo es que **quien recibe no participa**. Quien regala adivina, y quien recibe es la única persona que sabe si el regalo le va a gustar, pero nunca toca la plataforma. Además, esa persona es un cliente potencial que hoy se pierde: el regalo termina en el checkout y la relación con Nido también.

### La solución: el Cofre

Quien regala no elige un producto: **arma un cofre con 3 opciones** dentro de un presupuesto y escribe un mensaje. Quien recibe **abre el cofre y elige la que quiere**.

1. **Andrés arma el cofre:** presupuesto, 3 opciones y un mensaje.
2. **Paga el presupuesto** (checkout simulado: aprobado, rechazado o pendiente).
3. **A Laura le llega en vivo.** No sabe qué hay adentro hasta abrirlo: la sorpresa se mantiene.
4. **Laura lo abre**, ve el mensaje y las 3 opciones, y **elige la que le gusta**. Andrés lo ve en tiempo real.
5. **Si la opción cuesta menos que el presupuesto, la diferencia queda como saldo Nido para Laura.**
6. **Laura agradece** y recibe una invitación a **"Devuélvele el gesto"**: armar un cofre para Andrés. El ciclo vuelve a empezar.

### Por qué creo que funciona

- **Elimina la incertidumbre de "¿le gustará?" sin matar la sorpresa.** Quien recibe elige, pero entre opciones que alguien escogió pensando en ella.
- **Convierte a quien recibe en cliente.** El saldo sobrante es una razón concreta para volver, crearse una cuenta y comprar.
- **Crea un ciclo de reciprocidad.** "Devuélvele el gesto" aprovecha el momento de mayor emoción para generar el siguiente regalo, también fuera de Navidad o Amor y Amistad.
- **El tiempo real tiene sentido emocional, no solo técnico.** Ver "Laura abrió tu cofre… eligió… te agradeció" es la parte que hoy se pierde después del checkout.

### Las métricas que espero mover

| Métrica | Hoy | Hipótesis | Por qué |
|---|---|---|---|
| **Devoluciones de regalos** (principal) | 22% | < 8% | Quien recibe elige, incluida la variante que le sirve |
| % de quienes reciben que compran en 90 días | ~0% (no participan) | 15–20% | Saldo sobrante + "Devuélvele el gesto" |
| Recompra a 90 días | 18% | Sube | Los cofres de reciprocidad se generan fuera de temporada |
| Ticket promedio de regalos | COP 95.000 | Sube | Se paga un presupuesto, no el precio de un solo producto |

### Cómo lo mediría

- **A/B test:** a una parte de quienes compran un regalo se les ofrece el Cofre; el resto sigue con el flujo normal. Se compara la tasa de devolución de ambos grupos durante 60 días.
- **Eventos a instrumentar:** `gift_created`, `gift_paid`, `gift_opened` (y el tiempo hasta abrir), `gift_chosen` (qué posición y precio frente al presupuesto), `gift_thanked`, `credit_redeemed` y `gift_reciprocated` (un cofre creado desde "Devuélvele el gesto").
- **Fórmulas clave:**
  - Devolución = cofres con devolución ÷ cofres entregados
  - Activación de quien recibe = personas que reciben y compran en 90 días ÷ personas que reciben
  - Reciprocidad = cofres creados desde "Devuélvele el gesto" ÷ cofres elegidos

### Lo que no alcancé a construir y cómo lo haría

| Pendiente | Cómo lo haría |
|---|---|
| **Usar el saldo en el checkout** | Descontar `creditBalance` del total en la misma transacción del pago, con un registro de movimientos de saldo |
| **Quien recibe sin cuenta** | Un enlace único (por WhatsApp o correo) para abrir el cofre y crear la cuenta al elegir |
| **Expiración y reembolso automáticos** | Un job programado (por ejemplo, con BullMQ) que marque como `EXPIRED` los cofres sin abrir y devuelva el saldo a quien regaló. Hoy se valida la fecha al abrir, pero no hay un proceso que los expire solo |
| **Todas las opciones agotadas** | Convertir el presupuesto completo en saldo para quien recibe, o permitirle elegir algo equivalente |
| **Pagos reales** | Integrar una pasarela (Wompi o Stripe) con tokenización en el frontend y **webhooks** para resolver pagos pendientes, en lugar del temporizador actual |
| **Cofre entre varias personas ("la vaca")** | Varios aportes al mismo presupuesto, con progreso en vivo en una sala de Socket.io por cofre |
| **IA para armar el cofre** | Sugerir las 3 opciones a partir de pistas sobre quien recibe (un quiz corto de gustos) y del historial de compras |
| **Autenticación real** | JWT en HTTP y en el handshake del socket; hoy el usuario viaja en el body porque la prueba pide no tener login |
| **Tests de integración** | Contra un Postgres real (Testcontainers), con peticiones concurrentes para verificar transacciones, idempotencia y stock |

---

## 2. Arquitectura

```
┌──────────────────────┐   HTTPS (REST)   ┌──────────────────────────┐  red privada  ┌────────────┐
│  Frontend (Vercel)   │ ───────────────▶ │   Backend (Railway)      │ ────────────▶ │ PostgreSQL │
│  React + Vite + TS   │ ◀─────────────── │   NestJS + Prisma        │               │ (Railway)  │
│  Tailwind            │    Socket.io     │   Socket.io gateway      │               └────────────┘
└──────────────────────┘   (gift:event)   └──────────────────────────┘
```

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + TypeScript, Tailwind CSS v4, React Router |
| Backend | NestJS (TypeScript, ESM), Prisma 6, class-validator |
| Base de datos | PostgreSQL |
| Tiempo real | Socket.io |
| Tests | Vitest |
| Despliegue | Vercel (frontend), Railway (backend + Postgres) |
| Runtime | Node.js 24 LTS |

### Estructura del repositorio

```
nido-cofre/
├── backend/
│   ├── prisma/            schema, migraciones y seed
│   ├── scripts/           listen.ts: escuchar eventos en la terminal
│   └── src/
│       ├── gifts/         cofres: crear, consultar, abrir, elegir, agradecer
│       ├── payments/      checkout simulado e idempotencia
│       ├── realtime/      gateway de Socket.io y notificador
│       ├── products/      catálogo
│       ├── users/         usuarios de prueba
│       └── prisma/        conexión a la base de datos
└── frontend/
    └── src/
        ├── api/           cliente HTTP, endpoints y tipos
        ├── context/       sesión del usuario
        ├── realtime/      conexión de Socket.io compartida
        ├── hooks/         useGift: carga un cofre y lo mantiene en vivo
        ├── components/    vistas de quien regala y de quien recibe
        └── pages/         pantallas
```

### Modelo de datos

- **User:** id, nombre, avatar, `creditBalance`
- **Product:** id, título, precio en COP, imagen, categoría, stock
- **Gift:** quien envía, quien recibe, presupuesto, mensaje, estado, producto elegido, saldo generado, agradecimiento, fechas
- **GiftOption:** las 3 opciones de cada cofre (clave compuesta `giftId + productId`)
- **Payment:** cada intento de pago, con estado, `last4`, motivo de rechazo e `idempotencyKey` única

El dinero se guarda como **entero en pesos**, nunca como decimal de punto flotante.

### Máquina de estados del cofre

```
PAYMENT_PENDING ──(rechazado)──▶ PAYMENT_REJECTED ──(reintento)──┐
      │                                                          │
      └──────────────(aprobado)────────▶ SENT ◀───────────────────┘
                                          │
                              (abre) ─────┤───── (7 días sin abrir) ──▶ EXPIRED
                                          ▼
                                       OPENED ──(elige)──▶ CHOSEN
```

### API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/users` | Usuarios de prueba |
| GET | `/api/products?category=&maxPrice=` | Catálogo con stock disponible |
| POST | `/api/gifts` | Crear un cofre |
| GET | `/api/gifts/sent/:userId` | Cofres enviados |
| GET | `/api/gifts/received/:userId` | Cofres recibidos (solo pagados) |
| GET | `/api/gifts/:id?viewerId=` | Un cofre, filtrado según quién lo mira |
| POST | `/api/gifts/:id/checkout` | Pagar |
| POST | `/api/gifts/:id/open` | Abrir |
| POST | `/api/gifts/:id/choose` | Elegir una opción |
| POST | `/api/gifts/:id/thank` | Agradecer |

### Tiempo real

Cada usuario se une a una sala propia (`user:{id}`). El backend emite un solo evento, `gift:event`, con el tipo de cambio (`payment_approved`, `payment_rejected`, `payment_pending`, `gift_opened`, `gift_chosen`, `gift_thanked`) y el cofre actualizado **filtrado para quien lo recibe**.

### Checkout simulado

| Tarjeta termina en | Resultado |
|---|---|
| `4242` | Aprobado |
| `0000` | Rechazado: fondos insuficientes |
| `1111` | Pendiente; se aprueba solo a los 10 segundos y ambos lo ven en vivo |
| Cualquier otra | Rechazado: tarjeta no reconocida |

---

## 3. Decisiones técnicas

- **NestJS en lugar de Express:** su estructura de módulos, servicios e inyección de dependencias es muy cercana a Angular (mi stack principal) y da una arquitectura ordenada y testeable desde el inicio.
- **React + Vite en lugar de Next.js:** la app no necesita SSR ni SEO; Vite es más simple y el backend ya vive aparte.
- **Prisma:** el `schema.prisma` es la única fuente de verdad: de ahí salen las tablas, las migraciones y los tipos de TypeScript.
- **La sorpresa se protege en el servidor.** `toViewerGift` filtra cada respuesta según quién la pide: quien recibe no recibe opciones antes de abrir, ni el presupuesto, ni los pagos. Esto aplica igual por HTTP y por WebSocket, así que no se puede "espiar" desde las DevTools.
- **Transacciones** donde varias escrituras deben ocurrir juntas: guardar el pago y cambiar el estado del cofre; elegir, descontar stock y sumar saldo.
- **Idempotencia en el pago:** el frontend genera una llave por intento; el backend la verifica y además tiene una restricción `@unique` para peticiones simultáneas. Un doble clic o un reintento de red nunca cobra dos veces.
- **Compare-and-set** (`updateMany` con el estado esperado en el `where`) para que abrir, elegir, agradecer y descontar stock sean seguros frente a dobles clics y condiciones de carrera.
- **El stock se descuenta al elegir, no al crear el cofre**, para no bloquear 3 productos cuando solo se lleva 1.
- **La base de datos es la fuente de verdad; el socket es un aviso.** Si una notificación falla, el dato ya está guardado y recargar la página muestra el estado correcto.
- **Funciones puras para la lógica crítica** (simulador de pagos, vista del cofre, notificaciones), lo que las hace fáciles de probar.
- **Una sola conexión de Socket.io por sesión** en el frontend, compartida con un Context y un patrón de suscripción.
- **Catálogo copiado a la base de datos** desde DummyJSON (con precios convertidos a COP): el backend valida precios contra sus propios datos y la demo no depende de una API externa.

### Seguridad

- Ninguna credencial en el repositorio: todo por variables de entorno (ver `.env.example`).
- Validación de toda entrada con DTOs; `forbidNonWhitelisted` rechaza campos no esperados (evita *mass assignment*).
- Los precios nunca vienen del cliente.
- Solo se guardan los últimos 4 dígitos de la tarjeta.
- Un cofre ajeno responde **404** (no 403), para no revelar que existe.
- CORS restringido a los orígenes configurados, compartido entre HTTP y WebSocket.
- En producción, el backend usa la red privada de Railway para hablar con Postgres.

### Casos límite resueltos

Regalarse a uno mismo · productos repetidos o inexistentes · opciones por encima del presupuesto o sin stock · pago rechazado con reintento · pago pendiente que se resuelve solo (y se reprograma si el servidor se reinicia) · doble clic al pagar · intentar pagar un cofre ya pagado · quien recibe no ve cofres sin pagar · abrir, elegir o agradecer dos veces · opción agotada justo antes de elegir (la transacción se revierte) · cofre expirado · recargar en cualquier ruta del frontend.

---

## 4. Correr en local

**Requisitos:** Node.js 24 y una base de datos PostgreSQL.

### Backend

```bash
cd backend
npm install
cp .env.example .env        # completar DATABASE_URL
npx prisma migrate dev      # crea las tablas
npm run db:seed             # usuarios de prueba y catálogo
npm run start:dev           # http://localhost:3000/api
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:3000
npm run dev                 # http://localhost:5173
```

### Tests

```bash
cd backend && npm test
cd frontend && npm test
```

### Escuchar eventos en la terminal

```bash
cd backend
npx tsx scripts/listen.ts laura
```

### Variables de entorno

| Proyecto | Variable | Descripción |
|---|---|---|
| backend | `DATABASE_URL` | Conexión a PostgreSQL |
| backend | `FRONTEND_URL` | Orígenes permitidos por CORS, separados por coma |
| backend | `PORT` | Opcional; Railway lo asigna |
| frontend | `VITE_API_URL` | URL del backend, sin `/api` |

> El seed reinicia los cofres: sirve como "botón de reinicio" de la demo.

---

## 5. Despliegue

- **Backend en Railway** (Root Directory `/backend`): el *pre-deploy* corre `prisma migrate deploy`, que solo aplica migraciones existentes. Se conecta a Postgres por la red privada.
- **Frontend en Vercel** (Root Directory `frontend`): `vercel.json` redirige todas las rutas a `index.html` para que React Router funcione al recargar.
- **Nota:** en esta prueba, el entorno local y producción comparten la base de datos para simplificar. En un proyecto real habría una base por entorno.

---

## 6. Uso de IA

Usé **Claude** como guía y compañero de programación durante todo el proyecto.

**Para qué.** Primero, para pensar la idea a partir de los datos del caso y de mi experiencia personal comprando regalos. Después, para construir el proyecto paso a paso: Claude generó el código de cada etapa, y yo lo implementé, lo revisé y lo probé. En cada paso le pedí que me explicara el porqué de las decisiones, ya que mi stack del día a día es Angular y hacía un tiempo no usaba React; fue una buena forma de repasar mientras analizaba cada componente y cada página.

**Qué resolví y corregí en el camino:**

- **Conexión con Railway.** Prisma no conectaba desde mi PC porque estaba usando la URL privada de la base de datos, que solo funciona dentro de Railway. La variable pública no aparecía porque el proxy TCP no estaba habilitado; al activarlo (y recargar la página para que la interfaz mostrara el valor), pude usar la URL pública en local. En producción el backend usa la privada.
- **Versiones desalineadas de NestJS.** Al instalar los paquetes de WebSockets, se instaló una versión más nueva que la de `@nestjs/common`, y la aplicación no arrancaba porque buscaba funciones que mi versión no tenía. La instrucción original no fijaba la versión, así que instalé explícitamente la misma versión en todos los paquetes `@nestjs/*`.
- **Estructura del repositorio.** Inicié git dentro de la carpeta del backend, y así quedó desplegado en Railway, cuando la idea era un solo repositorio con backend y frontend. Desde la consola moví el repositorio a la raíz conservando el historial, hice push de nuevo y cambié el Root Directory de Railway a `/backend`.
- **Estructura del build.** Al inicio del proyecto, Claude me advirtió algo que yo no tenía en cuenta: excluir del build los archivos que no hacen parte de la aplicación (la carpeta `prisma`, `prisma.config.ts` y los scripts de apoyo), porque cambian la estructura de `dist/` y hacen fallar el arranque en producción. Por curiosidad lo comprobé para entender qué problema resolvía: sin la exclusión, el punto de entrada quedaba en `dist/src/main.js` en vez de `dist/main.js`, y `start:prod` no lo encontraba. Así entendí el porqué del ajuste en `tsconfig.build.json`.

**Cómo lo validé.** Probé cada endpoint de forma manual en Insomnia, incluidos los casos límite, tanto para entender cada paso como para comprobar que nada se rompía. Cuando algo fallaba, analizaba la causa antes de corregirlo. También verifiqué el tiempo real con dos ventanas y con un script de terminal, escribí tests de la lógica crítica y probé el flujo completo en producción y en el celular.
