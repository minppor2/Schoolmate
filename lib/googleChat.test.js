import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGoogleChatMessages } from './googleChat.js';

test('normalizes Google Chat messages into task cards', () => {
  const input = [
    {
      name: 'spaces/abc/messages/1',
      text: '학부모 상담 일정 확인 요청',
      createTime: '2026-07-01T10:00:00Z'
    },
    {
      name: 'spaces/abc/messages/2'
    }
  ];

  const result = normalizeGoogleChatMessages(input, 'Schoolmate');

  assert.equal(result.length, 2);
  assert.equal(result[0].title, '학부모 상담 일정 확인 요청');
  assert.equal(result[0].source, 'Schoolmate');
  assert.equal(result[0].importance, 'important');
  assert.equal(result[1].title, '새 메시지');
});
