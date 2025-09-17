# UrbanMoto - Motorbike & Scooter Rental Platform 🏍️

A comprehensive full-stack platform for motorbike and scooter rentals with delivery services, built with modern web technologies.

![UrbanMoto](https://img.shields.io/badge/UrbanMoto-Rental_Platform-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
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

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI component library
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Express Rate Limit** - API rate limiting

### Payment & Services
- **Stripe** - Payment processing
- **Nodemailer** - Email notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd urbanmoto-platform
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Database Setup**
   
   Create a PostgreSQL database:
   ```sql
   CREATE DATABASE urbanmoto;
   ```
   
   Run the database schema:
   ```bash
   psql -U your_username -d urbanmoto -f server/database/schema.sql
   ```

4. **Environment Configuration**
   
   Backend (.env):
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/urbanmoto
   
   # Server
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # Email (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
   
   Frontend (.env.local):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   ```

5. **Start the development servers**
   ```bash
   # Start backend server (from root directory)
   npm run server
   
   # Start frontend development server (from another terminal)
   cd client
   npm run dev
   ```
   
   Backend: http://localhost:5000  
   Frontend: http://localhost:3000

## 📊  Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

- **users** - User accounts and profiles
- **vendors** - Vehicle rental vendors
- **vehicles** - Available motorbikes and scooters
- **bookings** - Rental bookings and reservations
- **deliveries** - Delivery orders and requests
- **payments** - Payment transactions and methods
- **tracking** - Real-time location tracking
- **delivery_tracking** - Delivery-specific tracking
- **reviews** - User reviews and ratings



## 🔌 API Reference

### Authentication
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | User registration | No |
| `/api/auth/login` | POST | User login | No |
| `/api/auth/logout` | POST | User logout | Yes |
| `/api/auth/verify` | GET | Verify JWT token | Yes |

### Vehicles
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/vehicles` | GET | Get vehicles with filters | No |
| `/api/vehicles/:id` | GET | Get vehicle details | No |
| `/api/vehicles` | POST | Create vehicle | Vendor |
| `/api/vehicles/:id` | PUT | Update vehicle | Vendor |
| `/api/vehicles/:id` | DELETE | Delete vehicle | Vendor |

### Bookings
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/bookings` | POST | Create booking | Yes |
| `/api/bookings` | GET | Get user bookings | Yes |
| `/api/bookings/:id` | GET | Get booking details | Yes |
| `/api/bookings/:id/status` | PUT | Update booking status | Vendor |

For complete API documentation, visit our [API Docs](https://docs.urbanmoto.com/api).

## 🧪 Development Scripts

```bash
# Start backend server
npm run server

# Start frontend development
npm run dev

# Build frontend for production
npm run build

# Start production frontend
npm run start

# Run database migrations
npm run migrate

# Seed database with sample data
npm run seed

# Run tests
npm run test
```

## 🚢 Deployment

### Backend Deployment
1. Set up PostgreSQL database on your hosting provider
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Run database migrations

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or similar platforms
3. Configure environment variables
4. Set up custom domain (optional)

### Docker Deployment (Alternative)
```bash
# Build and run with Docker Compose
docker-compose up -d

# Run migrations in container
docker-compose exec backend npm run migrate
```

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for secure password storage
- **Rate Limiting** - API rate limiting to prevent abuse
- **Input Validation** - Comprehensive input validation and sanitization
- **CORS Protection** - Cross-origin resource sharing configuration
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Content Security Policy headers



## 🗺️ Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with mapping services
- [ ] AI-powered recommendations
- [ ] Fleet management tools
- [ ] Insurance integration
- [ ] Loyalty program

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev)
- UI components by [Shadcn/ui](https://ui.shadcn.com)
- Payment processing by [Stripe](https://stripe.com)

---


Made with Abd Elrahman Saeed by the USAM Program 

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](www.linkedin.com/in/abd-elrahman-saeed)

