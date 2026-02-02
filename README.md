# Kuwait Custom Clearance Broker Web Application

Professional customs clearance business application with invoice generation system for Kuwait.

## Features

- **Landing Page**: Modern, mobile-responsive design with WebGL particle effects
- **SEO Optimized**: Meta tags, structured data, semantic HTML for "Kuwait Custom Clearance"
- **Admin Portal**: Secure authentication with invoice management
- **Invoice Generator**: 
  - Auto-generated unique invoice numbers
  - Arabic/English bilingual support
  - Flexible service line items (21+ predefined services)
  - KWD currency with Dinar.Fils format
  - Print/PDF export functionality
- **Database**: SQLite with Prisma ORM

## Tech Stack

- **Frontend**: HTML/CSS/JavaScript (Vanilla)
- **Backend**: Node.js + Express
- **Database**: Prisma ORM with SQLite
- **Authentication**: JWT with bcrypt password hashing

## Project Structure

```
code/
├── backend/
│   ├── server.js           # Express server with API routes
│   ├── package.json        # Node.js dependencies
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.js         # Database seed (default admin user)
├── frontend/
│   ├── index.html          # Landing page
│   ├── admin.html          # Admin portal
│   ├── css/
│   │   ├── styles.css      # Landing page styles
│   │   └── admin.css       # Admin portal styles
│   └── js/
│       ├── main.js         # Landing page JavaScript
│       ├── webgl.js        # WebGL particle effects
│       └── admin.js        # Admin portal JavaScript
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager

### Installation

1. Navigate to the backend directory:
   ```bash
   cd code/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

4. Create and migrate the database:
   ```bash
   npx prisma db push
   ```

5. Seed the database with default admin user:
   ```bash
   npm run db:seed
   ```

6. Start the server:
   ```bash
   npm start
   ```

7. Access the application:
   - Landing Page: http://localhost:3000
   - Admin Portal: http://localhost:3000/admin.html

## Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

**Important**: Change these credentials in production!

## API Endpoints

### Authentication
- `POST /api/login` - Login with username/password
- `GET /api/me` - Get current user info (requires auth)

### Invoices
- `GET /api/invoices` - List all invoices (paginated, searchable)
- `GET /api/invoices/:id` - Get single invoice with items
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/next-invoice-number` - Get next auto-increment number

### Settings
- `GET /api/settings` - Get company settings

## Service Line Items

The invoice generator includes these predefined services (Arabic/English):

1. Delivery Order (اذن تسليم)
2. Customs Duty (رسوم جمركية)
3. Stevedoring Charges (اجور مناولة الميناء)
4. Global Charges (اجور جلوبال)
5. Freight Charges (اجور شحن)
6. Handling Charges KAC (رسوم خدمات كويتية وناشيونال)
7. Port Demmuragex (ارضية الميناء)
8. Ship Agent Demmurage (ارضية وكيل الملاحة)
9. Municipality Charges (اجور متابعة البلدية)
10. Customs Inspection Fees (كشف وتفتيش جمركي)
11. Transport Charges (اجور نقل)
12. Labour/Packing Charges (اجور عمال / تغليف وتربيط)
13. Agriculture (اجور افراجات زراعية)
14. Delivery Good Service (اجور استلام)
15. Forklift/Crain Charges (اجور رافعة كرين)
16. Authorities/Certificates Releases (افراجات حكومية)
17. Customs Clearing Charges (اجور تخليص)
18. Bank Commissions (عمولة بنكية)
19. Printing/Copy (تصديق وزارة الخارجية)
20. Computer Description (بيان كمبيوتر)
21. Other Expenses (مصروفات اخرى)

## Production Deployment

1. Set environment variables:
   ```bash
   export PORT=3000
   export JWT_SECRET=your-secure-secret-key
   ```

2. For production, consider:
   - Using PostgreSQL instead of SQLite
   - Setting up HTTPS with SSL certificates
   - Using PM2 or similar for process management
   - Implementing rate limiting
   - Adding proper logging

## License

Proprietary - All rights reserved.
