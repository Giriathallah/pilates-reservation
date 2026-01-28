-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================
-- Users Table (untuk manual JWT auth)
-- ====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    email_verified TIMESTAMPTZ, -- NULL jika belum verify (opsional, jika Anda implement verify)
    image TEXT, -- Profile picture URL (opsional)
    password_hash TEXT NOT NULL, -- bcrypt hash untuk credentials
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- Business Tables (Pilates Reservation)
-- ====================
CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    capacity INTEGER DEFAULT 1,
    price_per_slot DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (court_id, date, start_time)
);
CREATE INDEX idx_schedules_court_date ON schedules(court_id, date);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Link ke users (UUID sekarang)
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'refunded')),
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (schedule_id) -- Cegah double booking
);

-- payments: Midtrans integration
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    midtrans_order_id TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    payment_method TEXT,
    transaction_time TIMESTAMPTZ,
    expiry_time TIMESTAMPTZ,
    midtrans_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_logs: Untuk tracking perubahan (business ready)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- Triggers
-- ====================
-- Update schedule availability berdasarkan reservation status
CREATE OR REPLACE FUNCTION update_schedule_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('confirmed', 'paid') THEN
        UPDATE schedules SET is_available = FALSE WHERE id = NEW.schedule_id;
    ELSIF NEW.status = 'cancelled' THEN
        UPDATE schedules SET is_available = TRUE WHERE id = NEW.schedule_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_reservation_status_change
AFTER INSERT OR UPDATE OF status ON reservations
FOR EACH ROW EXECUTE FUNCTION update_schedule_availability();

-- Update reservation status dari payment (via trigger)
CREATE OR REPLACE FUNCTION update_reservation_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'success' THEN
        UPDATE reservations SET status = 'paid' WHERE id = NEW.reservation_id;
    ELSIF NEW.status IN ('failed', 'refunded') THEN
        UPDATE reservations SET status = 'cancelled' WHERE id = NEW.reservation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_payment_status_change
AFTER UPDATE OF status ON payments
FOR EACH ROW EXECUTE FUNCTION update_reservation_on_payment();