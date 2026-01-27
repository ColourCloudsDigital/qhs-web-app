-- Create notification settings tables if they don't exist

-- User notification settings table
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId VARCHAR(36) NOT NULL,
  emailNotifications BOOLEAN DEFAULT TRUE,
  pushNotifications BOOLEAN DEFAULT TRUE,
  smsNotifications BOOLEAN DEFAULT FALSE,
  bookingUpdates BOOLEAN DEFAULT TRUE,
  paymentAlerts BOOLEAN DEFAULT TRUE,
  promotionalEmails BOOLEAN DEFAULT FALSE,
  systemNotifications BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_notification_settings (userId)
);

-- User privacy settings table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId VARCHAR(36) NOT NULL,
  profileVisibility ENUM('public', 'private') DEFAULT 'private',
  showBookingHistory BOOLEAN DEFAULT FALSE,
  allowDataCollection BOOLEAN DEFAULT TRUE,
  marketingConsent BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_privacy_settings (userId)
);

-- User security logs table
CREATE TABLE IF NOT EXISTS user_security_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId VARCHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_security_logs_user (userId),
  INDEX idx_user_security_logs_action (action),
  INDEX idx_user_security_logs_created (createdAt)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(userId, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(createdAt);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Add indexes for user settings tables
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user ON user_notification_settings(userId);
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user ON user_privacy_settings(userId);