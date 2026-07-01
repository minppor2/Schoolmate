import { parseMessageForTask } from './analyzer.js';

const samples = [
  '내일 오전 10시에 학부모 상담 진행해주세요',
  '7월 5일 오후 3시에 회의',
  '다음주 화요일에 설명회 준비해주세요',
];

for (const s of samples) {
  const res = parseMessageForTask(s);
  console.log('INPUT:', s);
  console.log(JSON.stringify(res, null, 2));
  console.log('---');
}
