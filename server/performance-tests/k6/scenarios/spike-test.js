import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, HEADERS_JSON } from '../config.js';

export const options = {
  stages: [
    { duration: '20s', target: 10 },   // Tải ban đầu thấp
    { duration: '10s', target: 300 },  // Đột biến tăng vọt (Spike Surge)
    { duration: '40s', target: 300 },  // Duy trì đỉnh nhọn
    { duration: '15s', target: 10 },   // Giảm đột ngột (Recovery phase)
    { duration: '20s', target: 10 },   // Đánh giá trạng thái phục hồi
  ],
  thresholds: {
    http_req_failed: ['rate<0.08'], // Tỷ lệ lỗi cho phép trong spike < 8%
  },
};

export default function () {
  group('Catalog Under Spike', function () {
    const res = http.get(`${BASE_URL}/books?page=1&size=10`, {
      headers: HEADERS_JSON,
      tags: { name: 'Spike_Catalog' },
    });

    check(res, {
      'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    });
  });

  sleep(0.3);
}
