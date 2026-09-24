import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, HEADERS_JSON, SLA_THRESHOLDS } from '../config.js';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up lên 20 VUs
    { duration: '1m',  target: 50 },  // Tăng lên 50 VUs
    { duration: '2m',  target: 50 },  // Giữ tải ổn định 50 VUs (steady-state)
    { duration: '30s', target: 0 },   // Ramp-down về 0
  ],
  thresholds: SLA_THRESHOLDS,
};

const searchKeywords = ['design', 'clean', 'java', 'spring', 'art', 'history', 'science'];
const formats = ['PAPERBACK', 'HARDCOVER', 'EBOOK'];

export default function () {
  const keyword = searchKeywords[Math.floor(Math.random() * searchKeywords.length)];
  const format = formats[Math.floor(Math.random() * formats.length)];
  const page = Math.floor(Math.random() * 3) + 1;

  group('Catalog Search & Filter (60% traffic)', function () {
    const res = http.get(`${BASE_URL}/books?keyword=${keyword}&format=${format}&page=${page}&size=12`, {
      headers: HEADERS_JSON,
      tags: { name: 'GetBooksFiltered' },
    });

    check(res, {
      'books status 200': (r) => r.status === 200,
      'response under 300ms': (r) => r.timings.duration < 300,
    });
  });

  group('Metadata Exploration (25% traffic)', function () {
    const resGenres = http.get(`${BASE_URL}/genres`, {
      headers: HEADERS_JSON,
      tags: { name: 'GetGenres' },
    });
    check(resGenres, { 'genres status 200': (r) => r.status === 200 });

    const resAuthors = http.get(`${BASE_URL}/authors`, {
      headers: HEADERS_JSON,
      tags: { name: 'GetAuthors' },
    });
    check(resAuthors, { 'authors status 200': (r) => r.status === 200 });
  });

  group('Book Detail by Handle (15% traffic)', function () {
    // Thử truy vấn một handle mẫu hoặc danh sách
    const resDetail = http.get(`${BASE_URL}/books/the-great-gatsby`, {
      headers: HEADERS_JSON,
      tags: { name: 'GetBookDetail' },
    });
    check(resDetail, {
      'book detail handled (200 or 404)': (r) => r.status === 200 || r.status === 404,
    });
  });

  sleep(Math.random() * 1.5 + 0.5); // Think time 0.5s - 2s
}
