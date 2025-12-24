-- ApnaRide Database Initialization Script
-- This script runs when MySQL container is first created

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS apnaride;
USE apnaride;

-- Set timezone
SET time_zone = '+00:00';

-- Create indexes for better performance (tables will be created by Hibernate)
-- These will be applied after Hibernate creates the tables

-- Note: Hibernate will auto-create tables based on JPA entities
-- This script is for additional configurations and initial data

-- Grant privileges
GRANT ALL PRIVILEGES ON apnaride.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- Initial configuration data can be added here after first run
-- Example:
-- INSERT INTO vehicle_types (name, base_fare, per_km_rate) VALUES 
-- ('Bike', 10.00, 5.00),
-- ('Auto', 20.00, 8.00),
-- ('Car', 30.00, 12.00),
-- ('Share', 5.00, 3.00);
