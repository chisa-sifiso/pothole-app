-- ============================================================
-- Seed Data — Smart City Pothole Detection System
-- ============================================================
-- Passwords are all: password123
-- BCrypt hash for 'password123' (cost 10):
-- $2a$10$hl69r/ZTjTFHD8gGWrnM3uZH8GyViBDkRjuIL7IXTZqHIA6k0waPO

-- Citizens
INSERT INTO users (email, password, role, name, phone, created_at) VALUES
  ('citizen1@test.com', '$2a$10$hl69r/ZTjTFHD8gGWrnM3uZH8GyViBDkRjuIL7IXTZqHIA6k0waPO', 'CITIZEN', 'Thabo Nkosi', '0821234567', NOW()),
  ('citizen2@test.com', '$2a$10$hl69r/ZTjTFHD8gGWrnM3uZH8GyViBDkRjuIL7IXTZqHIA6k0waPO', 'CITIZEN', 'Naledi Dlamini', '0839876543', NOW())
ON CONFLICT (email) DO NOTHING;

-- Municipal officials
INSERT INTO users (email, password, role, name, phone, created_at) VALUES
  ('official@city.gov.za', '$2a$10$hl69r/ZTjTFHD8gGWrnM3uZH8GyViBDkRjuIL7IXTZqHIA6k0waPO', 'MUNICIPAL_OFFICIAL', 'City Official', '0115551234', NOW())
ON CONFLICT (email) DO NOTHING;

-- Contractors
INSERT INTO users (email, password, role, name, phone, created_at) VALUES
  ('contractor1@roads.co.za', '$2a$10$hl69r/ZTjTFHD8gGWrnM3uZH8GyViBDkRjuIL7IXTZqHIA6k0waPO', 'CONTRACTOR', 'John Builder', '0827654321', NOW()),
  ('contractor2@repairs.co.za', '$2a$10$hl69r/ZTjTFHD8gGWrnM3uZH8GyViBDkRjuIL7IXTZqHIA6k0waPO', 'CONTRACTOR', 'Sarah Roadworks', '0834567890', NOW())
ON CONFLICT (email) DO NOTHING;

-- Contractor profiles
INSERT INTO contractor_profiles (user_id, company_name, registration_number, rating, completed_jobs)
SELECT id, 'Roads & More (Pty) Ltd', 'REG2024001', 4.20, 15
FROM users WHERE email = 'contractor1@roads.co.za'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO contractor_profiles (user_id, company_name, registration_number, rating, completed_jobs)
SELECT id, 'Quick Repairs CC', 'REG2024002', 3.80, 8
FROM users WHERE email = 'contractor2@repairs.co.za'
ON CONFLICT (user_id) DO NOTHING;
