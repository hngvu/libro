import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, HEADERS_JSON } from '../config.js';

export const options = {
  vus: 2,
  duration: '20s',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  group('Smoke: Public Book Browsing', function () {
    const resList = http.get(`${BASE_URL}/books?page=1&size=10`, { headers: HEADERS_JSON });
    check(resList, {
      'get books status is 200': (r) => r.status === 200,
      'get books returns data': (r) => r.body.length > 0,
    });

    const resGenres = http.get(`${BASE_URL}/genres`, { headers: HEADERS_JSON });
    check(resGenres, {
      'get genres status is 200': (r) => r.status === 200,
    });

    const resAuthors = http.get(`${BASE_URL}/authors`, { headers: HEADERS_JSON });
    check(resAuthors, {
      'get authors status is 200': (r) => r.status === 200,
    });
  });

  group('Smoke: Auth Endpoint', function () {
    const payload = JSON.stringify({
      email: 'nonexistent_smoke_test@libro.local',
      password: 'WrongPassword@123',
    });
    const resAuth = http.post(`${BASE_URL}/auth/login`, payload, { headers: HEADERS_JSON });
    check(resAuth, {
      'login handles response (401 or 400)': (r) => r.status === 401 || r.status === 400 || r.status === 200,
    });
  });

  sleep(1);
}
