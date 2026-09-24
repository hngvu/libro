import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, HEADERS_JSON } from '../config.js';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Dưới tải bình thường
    { duration: '1m',  target: 150 },  // Đẩy lên mức căng thẳng nhẹ
    { duration: '1m',  target: 300 },  // Đẩy tải lên cao (Stress phase 1)
    { duration: '1m',  target: 500 },  // Đẩy tải lên cực đại (Stress phase 2 - tìm breaking point)
    { duration: '30s', target: 0 },    // Hạ tải để hệ thống hồi phục
  ],
  thresholds: {
    // Trong stress test, chấp nhận latency cao hơn nhưng kiểm tra tỷ lệ sập (< 5%)
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(90)<1000', 'p(95)<2000'],
  },
};

export default function () {
  group('Intensive Search & Aggregation Query', function () {
    const res = http.get(`${BASE_URL}/books?keyword=book&page=1&size=20`, {
      headers: HEADERS_JSON,
      tags: { name: 'Stress_GetBooks' },
    });

    check(res, {
      'status is 200 or 429/503': (r) => r.status === 200 || r.status === 429 || r.status === 503,
      'no server internal error 500': (r) => r.status !== 500,
    });
  });

  group('Concurrent Login Simulation', function () {
    const payload = JSON.stringify({
      email: `stress_user_${Math.floor(Math.random() * 50)}@libro.local`,
      password: 'Password@123',
    });

    const resAuth = http.post(`${BASE_URL}/auth/login`, payload, {
      headers: HEADERS_JSON,
      tags: { name: 'Stress_Login' },
    });

    check(resAuth, {
      'login processed without 500': (r) => r.status !== 500,
    });
  });

  sleep(0.5);
}
