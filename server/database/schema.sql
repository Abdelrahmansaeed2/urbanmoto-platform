-- UrbanMoto Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image TEXT,
    user_type VARCHAR(20) DEFAULT 'customer', -- customer, driver, vendor, admin
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stripe_customer_id VARCHAR(255) -- Add stripe_customer_id to users table
);

-- User verification documents
CREATE TABLE IF NOT EXISTS user_verification_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50), -- id_card, drivers_license, passport
    document_url TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20), -- card, wallet, bank_account
    provider VARCHAR(50), -- stripe, paypal, etc
    provider_payment_method_id TEXT,
    last_four VARCHAR(4),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_license TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    vehicle_type VARCHAR(50), -- scooter, motorbike, electric_scooter
    license_plate VARCHAR(20) UNIQUE,
    color VARCHAR(50),
    battery_level INTEGER DEFAULT 100,
    range_km INTEGER,
    hourly_rate DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    status VARCHAR(20) DEFAULT 'available', -- available, rented, maintenance, unavailable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle images
CREATE TABLE IF NOT EXISTS vehicle_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle maintenance logs
CREATE TABLE IF NOT EXISTS vehicle_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100),
    description TEXT,
    cost DECIMAL(10, 2),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing tiers
CREATE TABLE IF NOT EXISTS pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50),
    base_rate DECIMAL(10, 2),
    per_hour_rate DECIMAL(10, 2),
    per_day_rate DECIMAL(10, 2),
    surge_multiplier DECIMAL(3, 2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    booking_type VARCHAR(20) DEFAULT 'rental', -- rental, delivery
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    pickup_address TEXT,
    dropoff_latitude DECIMAL(10, 8),
    dropoff_longitude DECIMAL(11, 8),
    dropoff_address TEXT,
    total_amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, active, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking transactions
CREATE TABLE IF NOT EXISTS booking_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2),
    transaction_type VARCHAR(20), -- payment, refund, fee
    payment_method_id UUID REFERENCES payment_methods(id),
    stripe_payment_intent_id TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance options
CREATE TABLE IF NOT EXISTS insurance_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    description TEXT,
    daily_rate DECIMAL(10, 2),
    coverage_amount DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT true
);

-- Delivery orders
CREATE TABLE IF NOT EXISTS delivery_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users(id),
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    pickup_address TEXT,
    pickup_contact_name VARCHAR(100),
    pickup_contact_phone VARCHAR(20),
    dropoff_latitude DECIMAL(10, 8),
    dropoff_longitude DECIMAL(11, 8),
    dropoff_address TEXT,
    dropoff_contact_name VARCHAR(100),
    dropoff_contact_phone VARCHAR(20),
    package_size VARCHAR(20), -- small, medium, large
    package_category VARCHAR(50), -- food, documents, electronics, etc
    package_value DECIMAL(10, 2),
    delivery_fee DECIMAL(10, 2),
    scheduled_pickup TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- pending, assigned, picked_up, in_transit, delivered, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items (for detailed package contents)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_order_id UUID REFERENCES delivery_orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    weight_kg DECIMAL(5, 2),
    dimensions TEXT -- JSON string with length, width, height
);

-- Delivery quotes
CREATE TABLE IF NOT EXISTS delivery_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    dropoff_latitude DECIMAL(10, 8),
    dropoff_longitude DECIMAL(11, 8),
    distance_km DECIMAL(8, 2),
    estimated_duration_minutes INTEGER,
    base_fee DECIMAL(10, 2),
    distance_fee DECIMAL(10, 2),
    surge_fee DECIMAL(10, 2) DEFAULT 0,
    total_fee DECIMAL(10, 2),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    delivery_order_id UUID REFERENCES delivery_orders(id),
    vendor_id UUID REFERENCES vendors(id),
    driver_id UUID REFERENCES users(id),
    vehicle_id UUID REFERENCES vehicles(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_type VARCHAR(20), -- vehicle, driver, vendor, delivery
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auth sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incident reports
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    delivery_order_id UUID REFERENCES delivery_orders(id),
    reported_by UUID REFERENCES users(id),
    incident_type VARCHAR(50), -- accident, damage, theft, other
    description TEXT,
    severity VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
    status VARCHAR(20) DEFAULT 'open', -- open, investigating, resolved, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id); -- Create index for stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(current_latitude, current_longitude);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
