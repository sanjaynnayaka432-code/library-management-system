-- ===================================================
-- LibraX - Smart Library Management System
-- Database Schema & Realistic Seed Data
-- ===================================================

CREATE DATABASE IF NOT EXISTS library_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_management;

-- Drop existing tables if needed (in reverse foreign key order)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS fines;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    role ENUM('ADMIN', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    profile_image VARCHAR(255) DEFAULT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. CATEGORIES TABLE
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. BOOKS TABLE
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) NOT NULL UNIQUE,
    author VARCHAR(150) NOT NULL,
    publisher VARCHAR(150) DEFAULT NULL,
    publication_year INT DEFAULT NULL,
    category_id INT NOT NULL,
    description TEXT DEFAULT NULL,
    cover_image TEXT DEFAULT NULL,
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    shelf_location VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_book_isbn (isbn),
    INDEX idx_book_category (category_id),
    INDEX idx_book_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TRANSACTIONS TABLE
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    status ENUM('ISSUED', 'RETURNED', 'OVERDUE') NOT NULL DEFAULT 'ISSUED',
    fine_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_trans_user (user_id),
    INDEX idx_trans_book (book_id),
    INDEX idx_trans_status (status),
    INDEX idx_trans_due (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. RESERVATIONS TABLE
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('WAITING', 'FULFILLED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_res_user (user_id),
    INDEX idx_res_book (book_id),
    INDEX idx_res_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. FINES TABLE
CREATE TABLE fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(255) DEFAULT 'Late Return',
    status ENUM('PENDING', 'PAID') NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_fine_user (user_id),
    INDEX idx_fine_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. SETTINGS TABLE
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('borrowing_period_days', '14', 'Default loan period in days'),
('fine_rate_per_day', '5.00', 'Fine amount per overdue day in currency units (INR)'),
('max_books_per_student', '5', 'Maximum simultaneous books allowed per student');

-- ===================================================
-- SEED DATA
-- ===================================================

-- Users (Admin password is 'Admin@123', Students password is 'Student@123')
INSERT INTO users (id, name, email, password, phone, role, status) VALUES
(1, 'System Administrator', 'admin@librax.com', '$2a$10$pfZgGC9owiCnFBAxz6vOUOJib43xELxJPb4wv75uqtT6Y63jqylky', '+1 555-0100', 'ADMIN', 'ACTIVE'),
(2, 'Sarah Jenkins', 'sarah.j@student.edu', '$2a$10$lyHx0uW1I2CLXrXv/xtyL.76FQQy8SUJc1jVROR.sVuO2H/83X6bG', '+1 555-0101', 'STUDENT', 'ACTIVE'),
(3, 'Alex Rivera', 'alex.r@student.edu', '$2a$10$lyHx0uW1I2CLXrXv/xtyL.76FQQy8SUJc1jVROR.sVuO2H/83X6bG', '+1 555-0102', 'STUDENT', 'ACTIVE'),
(4, 'Priya Sharma', 'priya.s@student.edu', '$2a$10$lyHx0uW1I2CLXrXv/xtyL.76FQQy8SUJc1jVROR.sVuO2H/83X6bG', '+1 555-0103', 'STUDENT', 'ACTIVE'),
(5, 'Marcus Chen', 'marcus.c@student.edu', '$2a$10$lyHx0uW1I2CLXrXv/xtyL.76FQQy8SUJc1jVROR.sVuO2H/83X6bG', '+1 555-0104', 'STUDENT', 'ACTIVE'),
(6, 'Elena Rostova', 'elena.r@student.edu', '$2a$10$lyHx0uW1I2CLXrXv/xtyL.76FQQy8SUJc1jVROR.sVuO2H/83X6bG', '+1 555-0105', 'STUDENT', 'ACTIVE'),
(7, 'David Kim', 'david.k@student.edu', '$2a$10$lyHx0uW1I2CLXrXv/xtyL.76FQQy8SUJc1jVROR.sVuO2H/83X6bG', '+1 555-0106', 'STUDENT', 'INACTIVE');

-- Categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Computer Science', 'Foundations of computation, algorithms, data structures and computer systems.'),
(2, 'Programming & Software', 'Software engineering, design patterns, and programming languages.'),
(3, 'Artificial Intelligence', 'Machine learning, neural networks, deep learning, NLP and computer vision.'),
(4, 'Database Systems', 'Relational models, NoSQL systems, query optimization, and data warehousing.'),
(5, 'Computer Networks', 'Network architecture, protocols, cybersecurity, and distributed systems.'),
(6, 'Mathematics & Statistics', 'Linear algebra, calculus, discrete math, and probability for computer scientists.'),
(7, 'Science Fiction & Literature', 'Classic and contemporary speculative fiction and storytelling.');

-- Books (12+ books across diverse categories)
INSERT INTO books (id, title, isbn, author, publisher, publication_year, category_id, description, cover_image, total_copies, available_copies, shelf_location) VALUES
(1, 'Clean Code: A Handbook of Agile Software Craftsmanship', '9780132350884', 'Robert C. Martin', 'Prentice Hall', 2008, 2, 'Even bad code can function. But if code isn''t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.', 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&q=80&w=600', 5, 4, 'Aisle 3, Shelf B2'),
(2, 'Introduction to Algorithms (4th Edition)', '9780262046305', 'Thomas H. Cormen, Charles E. Leiserson', 'MIT Press', 2022, 1, 'A comprehensive update of the leading algorithms text, with new chapters on bipartite graphs, online algorithms, and machine learning.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600', 6, 4, 'Aisle 1, Shelf A1'),
(3, 'Designing Data-Intensive Applications', '9781449373320', 'Martin Kleppmann', 'O''Reilly Media', 2017, 4, 'The big ideas behind reliable, scalable, and maintainable systems. Key principles for data storage, processing, and distributed consensus.', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600', 4, 3, 'Aisle 2, Shelf C4'),
(4, 'Deep Learning', '9780262035613', 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', 'MIT Press', 2016, 3, 'An introduction to a broad range of topics in deep learning, covering mathematical and conceptual background, deep generative models, and computer vision.', 'https://images.unsplash.com/photo-1507842229452-646738580b33?auto=format&fit=crop&q=80&w=600', 4, 3, 'Aisle 4, Shelf D1'),
(5, 'Computer Networking: A Top-Down Approach', '9780136681557', 'James Kurose, Keith Ross', 'Pearson', 2020, 5, 'Focuses on the Internet and fundamental issues of networking, building layer-by-layer understanding from application to physical layers.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600', 3, 2, 'Aisle 2, Shelf B3'),
(6, 'Database System Concepts (7th Edition)', '9780078022159', 'Abraham Silberschatz, Henry F. Korth', 'McGraw-Hill', 2019, 4, 'Comprehensive coverage of database fundamentals, relational database design, query processing, transaction management, and concurrency control.', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600', 3, 3, 'Aisle 2, Shelf C2'),
(7, 'Artificial Intelligence: A Modern Approach (4th Edition)', '9780134610993', 'Stuart Russell, Peter Norvig', 'Pearson', 2020, 3, 'The authoritative, most widely used introduction to the theory and practice of artificial intelligence.', 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600', 5, 4, 'Aisle 4, Shelf D3'),
(8, 'The Pragmatic Programmer: Your Journey To Mastery', '9780135957059', 'David Thomas, Andrew Hunt', 'Addison-Wesley', 2019, 2, 'Timeless advice for modern developers on craftsmanship, architectural agility, continuous learning, and career development.', 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600', 4, 4, 'Aisle 3, Shelf B4'),
(9, 'Discrete Mathematics and Its Applications', '9781259676512', 'Kenneth Rosen', 'McGraw-Hill', 2018, 6, 'Clear, relevant, and comprehensive treatment of mathematical thought for students in computer science, software engineering, and mathematics.', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=600', 4, 4, 'Aisle 5, Shelf E1'),
(10, 'Dune', '9780441013593', 'Frank Herbert', 'Chilton Books', 1965, 7, 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600', 2, 0, 'Aisle 6, Shelf F3'),
(11, 'Neuromancer', '9780441569595', 'William Gibson', 'Ace Books', 1984, 7, 'The matrix is a consensual hallucination experienced daily by billions. Case is a washed-up computer hacker hired for one last ultimate heist.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600', 3, 2, 'Aisle 6, Shelf F2'),
(12, 'Site Reliability Engineering', '9781491929124', 'Betsy Beyer, Chris Jones, Jennifer Petoff', 'O''Reilly Media', 2016, 2, 'How Google runs production systems. Explores the lifecycle of Google''s computing systems and the unique culture of SRE.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=600', 3, 3, 'Aisle 3, Shelf B1');

-- Transactions (Mix of Active, Overdue, and Returned)
INSERT INTO transactions (id, user_id, book_id, issue_date, due_date, return_date, status, fine_amount) VALUES
(1, 2, 1, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 9 DAY), NULL, 'ISSUED', 0.00),
(2, 3, 2, DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY), NULL, 'OVERDUE', 30.00),
(3, 4, 3, DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY), NULL, 'ISSUED', 0.00),
(4, 5, 4, DATE_SUB(CURRENT_DATE, INTERVAL 18 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), NULL, 'OVERDUE', 20.00),
(5, 2, 5, DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 16 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY), 'RETURNED', 10.00),
(6, 6, 10, DATE_SUB(CURRENT_DATE, INTERVAL 8 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), NULL, 'ISSUED', 0.00),
(7, 3, 10, DATE_SUB(CURRENT_DATE, INTERVAL 12 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), NULL, 'ISSUED', 0.00),
(8, 4, 11, DATE_SUB(CURRENT_DATE, INTERVAL 25 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 11 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 11 DAY), 'RETURNED', 0.00);

-- Fines
INSERT INTO fines (id, transaction_id, user_id, amount, reason, status, paid_at) VALUES
(1, 2, 3, 30.00, 'Overdue return: 6 days late (Fine rate: 5/day)', 'PENDING', NULL),
(2, 4, 5, 20.00, 'Overdue return: 4 days late (Fine rate: 5/day)', 'PENDING', NULL),
(3, 5, 2, 10.00, 'Late return penalty: 2 days late', 'PAID', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 14 DAY));

-- Reservations
INSERT INTO reservations (id, user_id, book_id, reservation_date, status) VALUES
(1, 2, 10, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY), 'WAITING'),
(2, 5, 10, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 'WAITING');

-- Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES
(1, 3, 'Book Overdue Alert', 'Your borrowed book "Introduction to Algorithms (4th Edition)" is overdue by 6 days. Please return it to avoid accumulating further fines.', 'WARNING', FALSE),
(2, 5, 'Book Overdue Alert', 'Your borrowed book "Deep Learning" is overdue by 4 days. Fine of ₹20 has been generated.', 'WARNING', FALSE),
(3, 2, 'Upcoming Due Date Reminder', CONCAT('Your book "Clean Code" is due in 9 days on ', DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL 9 DAY), '%M %d, %Y'), '.'), 'INFO', FALSE),
(4, 2, 'Reservation Confirmed', 'You have been added to the waitlist for "Dune" (Position #1).', 'SUCCESS', TRUE),
(5, 1, 'System Initialized', 'Welcome to LibraX! All library catalog items and student services are active.', 'INFO', TRUE);
