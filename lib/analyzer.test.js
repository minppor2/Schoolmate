import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScheduleDraftFromText } from './analyzer.js';

test('buildScheduleDraftFromText creates a schedule draft from a Korean message', () => {
  const draft = buildScheduleDraftFromText('내일 오후 3시 상담해주세요', { defaultHour: 9 });

  assert.equal(draft.isTask, true);
  assert.ok(draft.schedule);
  assert.match(draft.schedule.title, /내일 오후 3시 상담해주세요/);
  assert.match(draft.schedule.timeLabel, /15:/);
});
