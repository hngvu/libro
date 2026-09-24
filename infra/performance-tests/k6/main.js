import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, HEADERS_JSON, TEST_CONFIG, SLA_THRESHOLDS } from './config.js';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 60 },
    { duration: '1m', target: 60 },
    { duration: '30s', target: 0 },
  ],
  thresholds: SLA_THRESHOLDS,
};

// Hàm đăng nhập lấy Bearer Token
function authenticate(email, password) {
  const payload = JSON.stringify({ email, password });
  const res = http.post(`${BASE_URL}/auth/login`, payload, { headers: HEADERS_JSON });
  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      return body.data || body.token || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

export default function () {
  // Luồng 1: Người dùng công cộng (Public Browsing - 60%)
  group('1. Public Browsing Flow', function () {
    const resBooks = http.get(`${BASE_URL}/books?page=1&size=10`, {
      headers: HEADERS_JSON,
      tags: { name: 'Public_GetBooks' },
    });
    check(resBooks, {
      'books status 200': (r) => r.status === 200,
    });

    const resGenres = http.get(`${BASE_URL}/genres`, {
      headers: HEADERS_JSON,
      tags: { name: 'Public_GetGenres' },
    });
    check(resGenres, {
      'genres status 200': (r) => r.status === 200,
    });
  });

  // Luồng 2: Thành viên đăng nhập và tương tác (User Flow - 30%)
  group('2. Authenticated Member Flow', function () {
    const token = authenticate(TEST_CONFIG.userCredentials.email, TEST_CONFIG.userCredentials.password);

    if (token) {
      const authHeaders = {
        ...HEADERS_JSON,
        'Authorization': `Bearer ${token}`,
      };

      const resLoans = http.get(`${BASE_URL}/loans/my-loans?page=1&size=5`, {
        headers: authHeaders,
        tags: { name: 'User_MyLoans' },
      });
      check(resLoans, {
        'my-loans status 200': (r) => r.status === 200,
      });

      // Thử mượn sách nếu có handle hợp lệ
      const borrowRes = http.post(`${BASE_URL}/loans/borrow?bookHandle=${TEST_CONFIG.sampleBookHandle}`, null, {
        headers: authHeaders,
        tags: { name: 'User_BorrowBook' },
      });
      check(borrowRes, {
        'borrow responded properly': (r) => [200, 201, 400, 404, 409].includes(r.status),
      });
    }
  });

  // Luồng 3: Quản trị viên truy vấn tổng hợp Dashboard (Admin Flow - 10%)
  group('3. Admin Dashboard Analytics Flow', function () {
    const adminToken = authenticate(TEST_CONFIG.adminCredentials.email, TEST_CONFIG.adminCredentials.password);

    if (adminToken) {
      const adminHeaders = {
        ...HEADERS_JSON,
        'Authorization': `Bearer ${adminToken}`,
      };

      const resSummary = http.get(`${BASE_URL}/admin/dashboard/summary`, {
        headers: adminHeaders,
        tags: { name: 'Admin_Summary' },
      });
      check(resSummary, {
        'admin summary status 200': (r) => r.status === 200,
      });

      const resTrends = http.get(`${BASE_URL}/admin/dashboard/circulation-trends?period=30d`, {
        headers: adminHeaders,
        tags: { name: 'Admin_CirculationTrends' },
      });
      check(resTrends, {
        'circulation trends status 200': (r) => r.status === 200,
      });
    }
  });

  sleep(Math.random() * 2 + 1);
}
