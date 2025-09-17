# UrbanMoto - Motorbike & Scooter Rental Platform 🏍️

A comprehensive full-stack platform for motorbike and scooter rentals with delivery services, built with modern web technologies.

![UrbanMoto](https://img.shields.io/badge/UrbanMoto-Rental_Platform-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=for-the-badge&logo=postgresql)
![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?style=for-the-badge&logo=stripe)

## 🌟 Features

### Core Functionality
- **🏍️ Vehicle Rental System** - Browse, filter, and book motorbikes and scooters
- **🚚 Delivery Services** - On-demand delivery with real-time tracking
- **🔐 User Authentication** - Secure JWT-based authentication system
- **💳 Payment Processing** - Integrated Stripe payment system with saved cards
- **📍 Real-time Tracking** - Live GPS tracking for bookings and deliveries
- **🏪 Vendor Management** - Multi-vendor platform with comprehensive vendor dashboard
- **👤 User Dashboard** - Complete booking history, tracking, and profile management

### Technical Features
- **📱 Responsive Design** - Mobile-first responsive UI with Tailwind CSS
- **🔄 Real-time Updates** - Live tracking with automatic polling
- **🛡️ Secure API** - Rate limiting, input validation, and JWT authentication
- **🗄️ Database** - PostgreSQL with comprehensive schema and relationships
- **📤 File Upload** - Image upload support for vehicles and user profiles
- **✉️ Email Notifications** - Automated booking confirmations and updates

## 🛠️ Tech Stack

### Frontend & Backend (Full-Stack Next.js)
- **Next.js 14** - React framework with App Router and API Routes
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI component library
- **Lucide React** - Beautiful icons
- **PostgreSQL** - Database (via Neon integration)
- **JWT** - JSON Web Tokens for authentication
- **Stripe** - Payment processing

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- PostgreSQL database (we recommend using Neon for easy setup)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd urbanmoto-platform
   npm install
   ```

2. **Database Setup**
   
   **Option A: Using Neon (Recommended)**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new database
   - Copy the connection string
   
   **Option B: Local PostgreSQL**
   ```sql
   CREATE DATABASE urbanmoto;
   ```

3. **Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database (use your Neon connection string or local PostgreSQL)
   DATABASE_URL="postgresql://username:password@host:5432/urbanmoto"
   
   # JWT Secret (generate a secure random string)
   JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
   
   # Stripe Keys (get from Stripe Dashboard)
   STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
   STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
   
   # App URLs
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   FRONTEND_URL="http://localhost:3000"
   
   # Optional: For file uploads (Cloudinary example)
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   ```

4. **Initialize Database**
   
   Run the database schema setup script:
   ```bash
   npm run db:setup
   ```
   
   Or manually run the SQL schema:
   ```bash
   # If using local PostgreSQL
   psql -U your_username -d urbanmoto -f scripts/schema.sql
   ```

5. **Seed Database (Optional)**
   ```bash
   # Add sample data for testing
   npm run db:seed
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
urbanmoto-platform/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (backend endpoints)
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── vendor/            # Vendor management portal
│   ├── vehicles/          # Vehicle browsing
│   └── ...
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── auth/             # Authentication components
│   ├── booking/          # Booking-related components
│   ├── vehicle/          # Vehicle display components
│   └── ...
├── lib/                  # Utility functions and configurations
│   ├── db/              # Database utilities
│   ├── auth/            # Authentication utilities
│   ├── stripe/          # Payment utilities
│   └── ...
├── hooks/                # Custom React hooks
├── scripts/              # Database scripts and utilities
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## 📡 API Routes

All API endpoints are available at `/api/*` and include:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout

### Vehicles
- `GET /api/vehicles` - Get vehicles with filters (search, category, price range)
- `GET /api/vehicles/[id]` - Get vehicle details
- `POST /api/vehicles` - Create vehicle (vendor only)
- `PUT /api/vehicles/[id]` - Update vehicle (vendor only)
- `DELETE /api/vehicles/[id]` - Delete vehicle (vendor only)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/[id]` - Get booking details
- `PUT /api/bookings/[id]/cancel` - Cancel booking
- `GET /api/bookings/[id]/tracking` - Get real-time tracking data

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/methods` - Get user's saved payment methods
- `POST /api/payments/methods` - Add a payment method

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard data
- `GET /api/dashboard/stats` - Get booking statistics
- `GET /api/dashboard/earnings` - Get vendor earnings data

## 🗃️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and profiles
- **vendors** - Vehicle rental vendors  
- **vehicles** - Available motorbikes and scooters
- **vehicle_categories** - Vehicle types (scooter, motorcycle, etc.)
- **bookings** - Rental bookings and reservations
- **deliveries** - Delivery orders and requests
- **payments** - Payment transactions and methods
- **tracking_locations** - Real-time location tracking
- **reviews** - User reviews and ratings


## 📋 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Setup database schema
npm run db:setup

# Seed database with sample data
npm run db:seed

# Type checking
npm run type-check

# Linting
npm run lint

# Format code with Prettier
npm run format
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms
1. Build the application: `npm run build`
2. Set up environment variables
3. Deploy the `.next` folder and `package.json`
4. Ensure PostgreSQL database is accessible


## 🔧 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret for JWT token signing | Yes | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes | - |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes | - |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | Yes | http://localhost:3000 |
| `FRONTEND_URL` | Frontend URL for CORS | Yes | http://localhost:3000 |
| `UPLOAD_PATH` | File upload directory | No | ./uploads |
| `NODE_ENV` | Environment mode | No | development |

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify `DATABASE_URL` is correct and properly quoted
   - Ensure database exists and is accessible
   - Check firewall settings for remote databases
   - Run `npm run db:check` to test database connection

2. **Authentication Not Working**
   - Verify `JWT_SECRET` is set and secure (32+ characters)
   - Check browser localStorage for tokens
   - Ensure API routes are accessible

3. **Stripe Payments Failing**
   - Verify Stripe keys are correct and match (test/live)
   - Check webhook endpoint configuration
   - Ensure HTTPS for production webhooks
   - Test with Stripe test cards

4. **Build Errors**
   - Run `npm run type-check` to identify TypeScript errors
   - Ensure all environment variables are set
   - Check for missing dependencies with `npm install`

5. **File Upload Issues**
   - Check directory permissions for upload path
   - Verify Cloudinary credentials if using cloud storage


### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write tests for new features
- Update documentation for API changes
- Ensure responsive design for mobile devices



---


Made with Abd Elrahman Saeed by the USAM Program 

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](www.linkedin.com/in/abd-elrahman-saeed)

