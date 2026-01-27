-- Create reports table for storing generated reports
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type ENUM('revenue', 'occupancy', 'customer', 'booking', 'payment', 'custom') NOT NULL,
    description TEXT,
    date_range VARCHAR(100),
    generated_by VARCHAR(36),
    hotel_id VARCHAR(36),
    status ENUM('generated', 'processing', 'failed') DEFAULT 'processing',
    file_url VARCHAR(500),
    file_size INT,
    parameters JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create analytics_cache table for storing pre-calculated analytics data
CREATE TABLE IF NOT EXISTS analytics_cache (
    id VARCHAR(36) PRIMARY KEY,
    hotel_id VARCHAR(36) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    date_range VARCHAR(50) NOT NULL,
    data JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATETIME,
    
    INDEX idx_hotel_metric (hotel_id, metric_type),
    INDEX idx_date_range (date_range),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_hotel_metric_range (hotel_id, metric_type, date_range)
);