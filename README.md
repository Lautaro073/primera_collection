# De Primera Collection

E-commerce desarrollado con `Next.js`, `TypeScript`, `Firebase` y `Cloudinary`, enfocado en una tienda de ropa y calzado con:

- catalogo publico
- panel admin
- carrito persistente
- cierre de compra por WhatsApp

El proyecto unifica frontend y backend dentro de `Next.js App Router`, con API propia en `app/api`.

## Demo funcional

Actualmente incluye:

- storefront publico con secciones por etiquetas y categorias
- quick view de producto sin salir de la pagina
- carrito lateral persistente
- seleccion de talle
- finalizacion de compra por WhatsApp
- panel admin con login por Firebase
- CRUD de categorias y productos
- carga multiple de imagenes

## Stack

- `Next.js 16`
- `React 19`
- `TypeScript` (`strict: true`)
- `Firebase Auth`
- `Cloud Firestore`
- `Cloudinary`
- `Tailwind CSS 4`
- `shadcn/ui` + `Radix UI`

## Arquitectura

### Frontend

- `src/app`
- `src/components/storefront`
- `src/components/admin`

### Backend (dentro de Next)

- `src/app/api/*`
- `src/lib/*`

### Persistencia

- `Firestore` para catalogo, carrito, checkout y ordenes
- `Cloudinary` para imagenes de productos

## Funcionalidades

### Catalogo publico

- home con productos agrupados por `tag`
- secciones por categoria
- cards con compra rapida
- detalle rapido en modal
- zoom de imagen
- selector de talle

### Carrito

- persistencia por `localStorage`
- drawer lateral
- control de cantidad
- validacion de stock
- soporte para mismo producto con talles distintos
- CTA de compra por WhatsApp con mensaje generado automaticamente

### Panel admin

- login con `Firebase Auth`
- validacion por custom claims (`admin` / `role: "admin"`)
- CRUD de categorias
- CRUD de productos
- carga multiple de imagenes
- eleccion de imagen principal

## Variables de entorno

Usa `primera_collection/.env.local` como fuente principal.

Puedes partir de:

- `primera_collection/.env.local.example`

Variables esperadas:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_PHONE=
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_MAPS_URL=

MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_URL=

EMAIL_USER=
EMAIL_PASSWORD=
```

Importante:

- `FIREBASE_PRIVATE_KEY` debe ir en una sola linea, conservando los saltos como `\n`
- `NEXT_PUBLIC_WHATSAPP_PHONE` debe ir sin espacios ni formato raro, idealmente con codigo de pais

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La app queda disponible en:

- `http://localhost:3000`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### Asignar claim admin

Para habilitar acceso al panel admin a un usuario de Firebase:

```bash
npm run admin:grant -- --email=tu-admin@correo.com
```

O usando UID:

```bash
npm run admin:grant -- --uid=FIREBASE_UID
```

Despues de asignar el claim, el usuario debe cerrar sesion y volver a entrar.

## Rutas principales

### Publicas

- `/`
- `/categoria/[slug]`
- `/producto/[id]`

### Admin

- `/admin`
- `/admin/login`
- `/admin/catalogo`

## API disponible

### Categorias

- `GET /api/categorias`
- `POST /api/categorias`
- `GET /api/categorias/con-productos`
- `GET /api/categorias/categoria/:nombre`
- `GET /api/categorias/:id`
- `PUT /api/categorias/:id`
- `DELETE /api/categorias/:id`

### Productos

- `GET /api/productos`
- `POST /api/productos`
- `GET /api/productos/all`
- `GET /api/productos/search?search=texto`
- `GET /api/productos/:id`
- `PUT /api/productos/:id`
- `DELETE /api/productos/:id`
- `GET /api/productos/:id/stock`
- `GET /api/productos/tag/:tag`

### Session / carrito

- `GET /api/session/start-session`
- `POST /api/session/crear`
- `POST /api/session/guardar`
- `GET /api/session/verificar/:id_carrito`
- `GET /api/carrito/:id_carrito`
- `POST /api/carrito/:id_carrito`
- `PUT /api/carrito/:id_carrito/:id_producto`
- `DELETE /api/carrito/:id_carrito/:id_producto`

### Checkout / ordenes

- `POST /api/checkout`
- `GET /api/ordenes/:id_user`
- `POST /api/ordenes/:id_user`
- `GET /api/ordenes/detalles/:id_orden`

### Pago

- `POST /api/create_preference`

## Seguridad

Las rutas de escritura del catalogo requieren:

```txt
Authorization: Bearer <firebase-id-token>
```

El usuario debe tener uno de estos claims:

- `admin: true`
- `role: "admin"`

## Estado del proyecto

El proyecto esta funcional para:

- administrar catalogo
- mostrar productos
- agregar al carrito
- cerrar la compra por WhatsApp

Pendientes naturales:

- endurecer el tipado de payloads de API
- stock por variante/talle
- flujo de checkout final con pasarela real en produccion


## Autor

Desarrollado por **Lautaro Jimenez**.

Contacto:

- WhatsApp: `https://wa.me/+5493865575688`
