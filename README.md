# primera_collection

Base de Next.js para migrar el backend de VG Hogar por etapas.

## Etapa actual
- Next.js App Router
- Firebase configurado (cliente y admin)
- API de catalogo (lectura + CRUD admin)
- Firestore como origen de datos
- Firebase Storage para imagenes de productos

## Variables de entorno
Completa `primera_collection/.env` con:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`

Importante para `FIREBASE_PRIVATE_KEY`:
- Si la pegas en una sola linea, deja los saltos como `\\n`.

## Colecciones esperadas
Revisa `firebase/ETAPA_1_CATALOGO.md`.

## Endpoints disponibles
- `GET /api/categorias`
- `POST /api/categorias` (admin)
- `GET /api/categorias/con-productos`
- `GET /api/categorias/categoria/:nombre`
- `GET /api/categorias/:id`
- `PUT /api/categorias/:id` (admin)
- `DELETE /api/categorias/:id` (admin)
- `GET /api/productos`
- `POST /api/productos` (admin)
- `GET /api/productos/all`
- `GET /api/productos/search?search=texto`
- `GET /api/productos/:id`
- `PUT /api/productos/:id` (admin)
- `DELETE /api/productos/:id` (admin)
- `GET /api/productos/:id/stock`
- `GET /api/productos/tag/:tag`
- `GET /api/session/start-session`
- `POST /api/session/crear`
- `POST /api/session/guardar`
- `GET /api/session/verificar/:id_carrito`
- `GET /api/carrito/:id_carrito`
- `POST /api/carrito/:id_carrito`
- `PUT /api/carrito/:id_carrito/:id_producto`
- `DELETE /api/carrito/:id_carrito/:id_producto`
- `POST /api/checkout`
- `GET /api/ordenes/:id_user`
- `POST /api/ordenes/:id_user`
- `GET /api/ordenes/detalles/:id_orden`
- `POST /api/create_preference`

## Rutas de administracion incluidas
- `GET /admin/login`
- `GET /admin/catalogo`

La interfaz actual permite:
- login con Firebase Auth
- crear categorias
- crear productos con imagen
- editar categorias
- editar productos
- eliminar categorias
- eliminar productos

## Asignar claim admin
Para habilitar el acceso al panel a un usuario de Firebase:

```bash
npm run admin:grant -- --email=tu-admin@correo.com
```

Tambien puedes usar UID:

```bash
npm run admin:grant -- --uid=FIREBASE_UID
```

Despues de asignar el claim, el usuario debe cerrar sesion y volver a entrar.

## Autorizacion admin
Las rutas de escritura requieren header:

`Authorization: Bearer <firebase-id-token>`

El usuario debe tener uno de estos claims en su token:
- `admin: true`
- `role: "admin"`

## Ejecutar
```bash
npm install
npm run dev
```

## Siguiente etapa recomendada
- Auth de frontend con Firebase
- Pantalla admin consumiendo este CRUD
- Enlazar el frontend de checkout con estas rutas
# primera_collection
