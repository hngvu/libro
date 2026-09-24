// Cấu hình chung cho k6 performance test suite của Libro
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api';

export const TEST_CONFIG = {
  adminCredentials: {
    email: __ENV.ADMIN_EMAIL || 'admin@libro.local',
    password: __ENV.ADMIN_PASSWORD || 'Admin@123',
  },
  userCredentials: {
    email: __ENV.USER_EMAIL || 'user@libro.local',
    password: __ENV.USER_PASSWORD || 'User@123',
  },
  sampleBookHandle: __ENV.BOOK_HANDLE || 'the-great-gatsby',
  sampleSearchKeyword: 'book',
};

// Chuẩn SLA / SLO định nghĩa cho hệ thống
export const SLA_THRESHOLDS = {
  // 95% request hoàn thành dưới 250ms, 99% dưới 500ms
  http_req_duration: ['p(95)<250', 'p(99)<500'],
  // Tỷ lệ lỗi dưới 1%
  http_req_failed: ['rate<0.01'],
};

export const HEADERS_JSON = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
