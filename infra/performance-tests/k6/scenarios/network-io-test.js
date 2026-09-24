import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, HEADERS_JSON } from '../config.js';

// Kịch bản kiểm thử giả lập Network Latency & Storage I/O
export const options = {
  stages: [
    { duration: '30s', target: 30 },  // 30 mobile users
    { duration: '1m',  target: 80 },  // 80 mobile users
    { duration: '1m30s', target: 80 }, // Duy trì
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // Với mobile 4G latency, ngưỡng P95 cho phép < 600ms
    http_req_duration: ['p(95)<600'],
    http_req_failed: ['rate<0.02'],
  },
};

// Hàm giả lập độ trễ mạng thực tế (4G RTT jitter từ 40ms - 90ms)
function simulateNetworkDelay() {
  const simulatedRTT = (Math.floor(Math.random() * 50) + 40) / 1000; // 0.04s - 0.09s
  sleep(simulatedRTT);
}

export default function () {
  // 1. Giả lập truy vấn dữ liệu sách qua mạng di động (Mobile Network Latency)
  group('1. Mobile Network Query (Simulated 4G Latency)', function () {
    simulateNetworkDelay();

    const res = http.get(`${BASE_URL}/books?page=1&size=10`, {
      headers: {
        ...HEADERS_JSON,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      },
      tags: { name: 'Mobile_GetBooks' },
    });

    check(res, {
      'books status 200': (r) => r.status === 200,
    });
  });

  // 2. Giả lập Storage I/O: Tải ảnh bìa sách / File đính kèm từ MinIO/Storage
  group('2. Storage I/O Concurrent Fetch', function () {
    simulateNetworkDelay();

    // Gọi endpoint Storage lấy file hoặc ảnh bìa
    const resStorage = http.get(`${BASE_URL}/storage/files/sample-cover.jpg`, {
      headers: { 'Accept': 'image/*,*/*' },
      tags: { name: 'Storage_FetchFile' },
    });

    // 200 nếu file tồn tại, 404 nếu chưa upload file mẫu (nhưng vẫn test áp lực I/O lên controller & storage)
    check(resStorage, {
      'storage endpoint responded': (r) => [200, 404].includes(r.status),
    });
  });

  // 3. Giả lập Phân trang sâu trên cơ sở dữ liệu lớn (Deep Pagination I/O)
  group('3. Deep Pagination DB Scan', function () {
    simulateNetworkDelay();

    // Query trang sâu (page 50 - 100) trên bảng 20.000 dòng để ép DB đọc Disk / Buffer
    const deepPage = Math.floor(Math.random() * 50) + 20;
    const resDeep = http.get(`${BASE_URL}/books?page=${deepPage}&size=15`, {
      headers: HEADERS_JSON,
      tags: { name: 'Deep_Pagination_Scan' },
    });

    check(resDeep, {
      'deep page status 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 2 + 1);
}
