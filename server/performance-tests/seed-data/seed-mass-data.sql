-- ============================================================================
-- SCRIPT SINH DỮ LIỆU LỚN KIỂM THỬ HIỆU NĂNG (MASS DATA SEEDER CHO POSTGRESQL)
-- Quy mô: ~2.000 Users, ~20.000 Books, ~50.000 Copies, ~100.000 Loans
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Bắt đầu sinh dữ liệu mẫu quy mô lớn...';
END $$;

-- 1. Thêm Nhà xuất bản (Publishers)
INSERT INTO publishers (name, handle, status, created_at, updated_at, created_by)
SELECT 
    'Publisher ' || i,
    lower(substr(md5(random()::text), 1, 8)),
    'ACTIVE',
    NOW(),
    NOW(),
    'system'
FROM generate_series(1, 50) s(i)
ON CONFLICT DO NOTHING;

-- 2. Thêm Thể loại (Genres)
INSERT INTO genres (name, handle, description, status, created_at, updated_at, created_by)
SELECT 
    'Genre ' || i,
    'genre-' || i || '-' || substr(md5(random()::text), 1, 4),
    'Description for genre ' || i,
    'ACTIVE',
    NOW(),
    NOW(),
    'system'
FROM generate_series(1, 30) s(i)
ON CONFLICT DO NOTHING;

-- 3. Thêm Tác giả (Authors)
INSERT INTO authors (name, handle, bio, status, created_at, updated_at, created_by)
SELECT 
    'Author ' || i,
    'author-' || i || '-' || substr(md5(random()::text), 1, 4),
    'Biography for author ' || i,
    'ACTIVE',
    NOW(),
    NOW(),
    'system'
FROM generate_series(1, 200) s(i)
ON CONFLICT DO NOTHING;

-- 4. Thêm 2.000 Người dùng (Users) với mật khẩu: Password@123 ($2a$10$7EqJtq98hPqEX7fNZaFWoO.8W50k2z5P70w/9v83f4X8e4a9e5m1e)
INSERT INTO users (email, password, full_name, phone, role, status, created_at, updated_at, created_by)
SELECT 
    'perf_user_' || i || '@libro.local',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', -- hash của 'Password@123'
    'Performance User ' || i,
    '090' || lpad(i::text, 7, '0'),
    'MEMBER',
    'ACTIVE',
    NOW() - (random() * 365 || ' days')::interval,
    NOW(),
    'seeder'
FROM generate_series(1, 2000) s(i)
ON CONFLICT (email) DO NOTHING;

-- 5. Thêm 20.000 Đầu sách (Books)
INSERT INTO books (
    title, handle, slug, isbn, publication_year, edition, format, page_count, 
    language, work, description, total_copies, available_copies, status, 
    publisher_id, created_at, updated_at, created_by
)
SELECT 
    'Book Title #' || i || ' ' || (ARRAY['Advanced', 'Mastering', 'Art of', 'Foundations of', 'The Story of', 'Chronicles of', 'Guide to'])[1 + (i % 7)] || ' Technology ' || i,
    substr(md5(i::text || clock_timestamp()::text), 1, 8), -- CHAR(8)
    'book-title-' || i || '-' || substr(md5(i::text), 1, 6),
    '978' || lpad(i::text, 10, '0'),
    2000 + (i % 25),
    (1 + (i % 5)) || 'th Edition',
    (ARRAY['PAPERBACK', 'HARDCOVER', 'EBOOK', 'AUDIOBOOK'])[1 + (i % 4)],
    100 + (i % 800),
    'en',
    substr(md5(i::text), 1, 8),
    'Comprehensive description and contents for book ' || i || '. This is seeded for load and performance benchmarking.',
    3, -- total_copies
    3, -- available_copies
    'ACTIVE',
    (SELECT id FROM publishers ORDER BY random() LIMIT 1),
    NOW() - (random() * 180 || ' days')::interval,
    NOW(),
    'seeder'
FROM generate_series(1, 20000) s(i)
ON CONFLICT DO NOTHING;

-- 6. Gán Ngẫu nhiên Thể loại và Tác giả cho Sách (Book Genres & Book Authors)
INSERT INTO book_genres (book_id, genre_id)
SELECT b.id, g.id
FROM (SELECT id FROM books ORDER BY id DESC LIMIT 20000) b
CROSS JOIN LATERAL (
    SELECT id FROM genres ORDER BY random() LIMIT 2
) g
ON CONFLICT DO NOTHING;

INSERT INTO book_authors (book_id, author_id)
SELECT b.id, a.id
FROM (SELECT id FROM books ORDER BY id DESC LIMIT 20000) b
CROSS JOIN LATERAL (
    SELECT id FROM authors ORDER BY random() LIMIT 1
) a
ON CONFLICT DO NOTHING;

-- 7. Sinh 50.000 Bản sao sách (Book Copies)
INSERT INTO book_copies (barcode, status, location, book_id, created_at, updated_at, created_by)
SELECT 
    'BC-' || lpad(b.id::text, 6, '0') || '-' || c,
    (ARRAY['AVAILABLE', 'AVAILABLE', 'LOANED', 'AVAILABLE'])[1 + (c % 4)]::text,
    'Floor ' || (1 + (b.id % 4)) || ' - Shelf ' || (1 + (b.id % 20)),
    b.id,
    NOW() - (random() * 180 || ' days')::interval,
    NOW(),
    'seeder'
FROM (SELECT id FROM books ORDER BY id DESC LIMIT 17000) b
CROSS JOIN generate_series(1, 3) c
ON CONFLICT (barcode) DO NOTHING;

-- 8. Sinh 100.000 Phiếu mượn (Loans) lịch sử & hiện tại
INSERT INTO loans (
    loan_code, user_id, book_copy_id, borrow_date, due_date, return_date, 
    status, renewal_count, created_at, updated_at, created_by
)
SELECT 
    'LN-' || upper(substr(md5(random()::text || s.i::text), 1, 16)),
    u.id,
    bc.id,
    (CURRENT_DATE - (10 + (s.i % 200)) * INTERVAL '1 day')::date,
    (CURRENT_DATE - (10 + (s.i % 200) - 14) * INTERVAL '1 day')::date,
    CASE WHEN (s.i % 5) != 0 THEN (CURRENT_DATE - (10 + (s.i % 200) - 10) * INTERVAL '1 day')::date ELSE NULL END,
    (ARRAY['RETURNED', 'RETURNED', 'RETURNED', 'ONGOING', 'OVERDUE'])[1 + (s.i % 5)],
    (s.i % 3),
    NOW() - ((s.i % 200) || ' days')::interval,
    NOW(),
    'seeder'
FROM generate_series(1, 100000) s(i)
JOIN LATERAL (SELECT id FROM users ORDER BY random() LIMIT 1) u ON true
JOIN LATERAL (SELECT id FROM book_copies ORDER BY random() LIMIT 1) bc ON true
ON CONFLICT (loan_code) DO NOTHING;

-- 9. Cập nhật lại số lượng available_copies chính xác cho books
UPDATE books b
SET 
    total_copies = COALESCE(sub.total, 0),
    available_copies = COALESCE(sub.available, 0)
FROM (
    SELECT 
        book_id,
        count(*) as total,
        count(*) FILTER (WHERE status = 'AVAILABLE') as available
    FROM book_copies
    GROUP BY book_id
) sub
WHERE b.id = sub.book_id;

-- 10. Chạy ANALYZE để PostgreSQL cập nhật Query Planner Statistics
ANALYZE users;
ANALYZE books;
ANALYZE book_copies;
ANALYZE loans;
ANALYZE book_genres;
ANALYZE book_authors;

DO $$
BEGIN
    RAISE NOTICE 'Hoàn tất sinh dữ liệu! Đã nạp thành công dữ liệu lớn vào database.';
END $$;
