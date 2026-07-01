# API_DB_SPEC.md

# 스쿨메이트 AI API 및 DB 설계 문서

---

## 1. 기술 구성

| 영역 | 기술 |
|---|---|
| 인증 | Firebase Authentication |
| DB | Cloud Firestore |
| 파일 저장 | Firebase Storage |
| 메시지 연동 | Google Chat API |
| 일정 연동 | Google Calendar API |
| AI 분석 | OpenAI API |
| 알림 | Firebase Cloud Messaging |
| 실시간 확장 | Google Workspace Events API |
| 프론트엔드 | React 또는 Next.js |
| 모바일 앱형 사용 | PWA |

---

## 2. 전체 데이터 흐름

```text
Google Chat 승인 Space
↓
Google Chat API
↓
chatMessages 저장
↓
AI 분석 대기
↓
OpenAI API 업무 후보 추출
↓
aiExtractedTasks 저장
↓
교사 확인
↓
tasks / schedules / notifications 저장
↓
Google Calendar API 연동
```

---

## 3. API 역할

### 3.1 Firebase Authentication

- Google 로그인
- 사용자 UID 발급
- 로그인 상태 유지
- 역할 기반 접근 제어 연결

### 3.2 Firestore

저장 데이터:

- 사용자 정보
- 학교 설정
- 홈 화면 설정
- Google Chat 메시지
- AI 업무 후보
- 업무카드
- 일정
- 알림
- 특별실 예약
- 학생기록 자료
- 세특 점검 결과

### 3.3 Firebase Storage

저장 파일:

- 생기부 지침
- 평가계획서
- 활동 기록 엑셀
- 수업 자료
- 학생기록 관련 문서
- 기타 첨부파일

### 3.4 Google Chat API

역할:

- 승인된 Space 목록 조회
- 특정 Space 메시지 조회
- 메시지 작성자, 시간, 원문 저장

제한:

- 개인 DM 수집 금지
- 승인된 업무용 Space만 연동
- 원문 보관 기간 설정
- 관리자가 Space를 승인해야 함

### 3.5 Google Calendar API

역할:

- 일정 생성
- 일정 수정
- 일정 삭제
- 일정 조회
- Calendar event ID 저장
- 동기화 상태 관리

### 3.6 OpenAI API

역할:

- 업무 메시지 분석
- 날짜, 대상, 장소, 할 일 추출
- 중요도 판단
- 공지문 변환
- 세특 문구 점검
- 금지 표현 확인
- 민감 정보 경고

### 3.7 Firebase Cloud Messaging

역할:

- 새 업무 후보 알림
- 오늘 일정 알림
- 중요 일정 알림
- 예약 변경 알림
- 마감 임박 알림

---

## 4. Firestore 컬렉션 설계

## 4.1 users

```json
{
  "uid": "user_001",
  "name": "김선생",
  "email": "teacher@school.go.kr",
  "role": "teacher",
  "department": "1학년부",
  "grade": "1학년",
  "homeroom": "1-4",
  "viewMode": "auto",
  "notificationPrefs": {
    "todaySchedule": true,
    "importantSchedule": true,
    "deadline": true,
    "aiTaskCandidate": true,
    "reservation": true,
    "recordReview": false
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

role 값:

```text
teacher
homeroomTeacher
headTeacher
admin
```

---

## 4.2 schools

```json
{
  "schoolId": "school_001",
  "schoolName": "창일중학교",
  "schoolYear": "2026",
  "defaultTemplateType": "middleSchool",
  "defaultViewMode": "auto",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 4.3 schoolSettings

```json
{
  "schoolId": "school_001",
  "grades": ["1학년", "2학년", "3학년"],
  "classes": {
    "1학년": ["1반", "2반", "3반", "4반", "5반", "6반", "7반", "8반"]
  },
  "periods": [
    {
      "period": 1,
      "start": "09:00",
      "end": "09:45"
    }
  ],
  "departments": ["교무부", "연구부", "생활안전부", "1학년부"],
  "rooms": ["컴퓨터실", "과학실", "체육관", "강당"],
  "updatedAt": "timestamp"
}
```

---

## 4.4 userHomeWidgets

```json
{
  "uid": "user_001",
  "widgets": [
    "todayTasks",
    "aiTaskCandidates",
    "quickActions"
  ],
  "quickActions": [
    "newTask",
    "newSchedule",
    "reserveRoom"
  ],
  "viewMode": "simple",
  "updatedAt": "timestamp"
}
```

---

## 4.5 chatSpaces

```json
{
  "spaceId": "spaces/AAAA123",
  "schoolId": "school_001",
  "spaceName": "1학년부 업무방",
  "spaceType": "grade",
  "targetGrade": "1학년",
  "targetDepartment": null,
  "isApproved": true,
  "approvedBy": "admin_uid",
  "lastSyncedAt": "timestamp",
  "createdAt": "timestamp"
}
```

---

## 4.6 chatMessages

```json
{
  "messageId": "msg_001",
  "spaceId": "spaces/AAAA123",
  "spaceName": "1학년부 업무방",
  "senderName": "김교사",
  "senderEmail": "teacher1@school.go.kr",
  "text": "7월 3일 체험학습 CMS 출금 안내 부탁드립니다.",
  "createdAt": "timestamp",
  "syncedAt": "timestamp",
  "analysisStatus": "pending",
  "retentionPolicy": "30days",
  "containsSensitiveInfo": false
}
```

analysisStatus 값:

```text
pending
analyzed
ignored
error
```

retentionPolicy 값:

```text
7days
30days
90days
summaryOnly
```

---

## 4.7 aiExtractedTasks

```json
{
  "extractId": "extract_001",
  "messageId": "msg_001",
  "spaceId": "spaces/AAAA123",
  "title": "체험학습 CMS 출금 안내",
  "summary": "1학년 체험학습 CMS 출금 안내문 발송 필요",
  "date": "2026-07-03",
  "time": null,
  "targetType": "grade",
  "targetGrade": "1학년",
  "targetDepartment": null,
  "targetUsers": [],
  "location": null,
  "todo": "학부모 안내문 발송",
  "importance": "important",
  "confidence": 0.86,
  "needsReview": true,
  "status": "candidate",
  "reviewedBy": null,
  "reviewedAt": null,
  "createdAt": "timestamp"
}
```

status 값:

```text
candidate
needsReview
savedAsTask
savedAsSchedule
ignored
error
```

---

## 4.8 tasks

```json
{
  "taskId": "task_001",
  "title": "체험학습 CMS 출금 안내",
  "description": "1학년 학부모에게 체험학습 CMS 출금 안내문 발송",
  "sourceType": "googleChat",
  "sourceMessageId": "msg_001",
  "sourceSpaceId": "spaces/AAAA123",
  "createdBy": "user_001",
  "confirmedBy": "user_001",
  "confirmedAt": "timestamp",
  "assignedTo": ["user_001"],
  "targetType": "grade",
  "targetGrade": "1학년",
  "targetDepartment": null,
  "dueDate": "2026-07-03",
  "importance": "important",
  "status": "todo",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

status 값:

```text
todo
inProgress
done
paused
deleted
```

---

## 4.9 schedules

```json
{
  "scheduleId": "schedule_001",
  "title": "대학로 체험학습 CMS 안내",
  "description": "1학년 체험학습 관련 안내",
  "date": "2026-07-03",
  "startTime": "09:00",
  "endTime": "09:30",
  "targetType": "grade",
  "targetGrade": "1학년",
  "targetDepartment": null,
  "targetUsers": [],
  "location": null,
  "importance": "important",
  "createdBy": "user_001",
  "confirmedBy": "user_001",
  "googleCalendarEventId": "calendar_event_001",
  "syncStatus": "synced",
  "syncError": null,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

targetType 값:

```text
personal
department
grade
all
selectedUsers
```

syncStatus 값:

```text
pending
synced
failed
deleted
```

---

## 4.10 notifications

```json
{
  "notificationId": "noti_001",
  "uid": "user_001",
  "title": "새 업무 후보가 있습니다.",
  "message": "Google Chat에서 체험학습 관련 업무를 감지했습니다.",
  "type": "aiTaskCandidate",
  "targetType": "grade",
  "targetUsers": ["user_001"],
  "targetDepartment": null,
  "targetGrade": "1학년",
  "isRead": false,
  "relatedId": "extract_001",
  "createdAt": "timestamp"
}
```

type 값:

```text
todaySchedule
importantSchedule
deadline
aiTaskCandidate
reservation
recordReview
system
```

---

## 4.11 reservations

```json
{
  "reservationId": "reservation_001",
  "roomName": "컴퓨터실",
  "date": "2026-07-03",
  "period": 3,
  "reservedBy": "user_001",
  "purpose": "정보 수업",
  "status": "reserved",
  "updatedBy": "user_001",
  "cancelReason": null,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

status 값:

```text
reserved
cancelled
deleted
```

중복 방지 규칙:

```text
roomName + date + period + status: reserved
조합이 이미 존재하면 새 예약을 막는다.
```

---

## 4.12 reservationLogs

```json
{
  "logId": "log_001",
  "reservationId": "reservation_001",
  "action": "created",
  "changedBy": "user_001",
  "before": null,
  "after": {
    "roomName": "컴퓨터실",
    "date": "2026-07-03",
    "period": 3
  },
  "reason": null,
  "createdAt": "timestamp"
}
```

action 값:

```text
created
updated
cancelled
deleted
```

---

## 4.13 recordResources

```json
{
  "resourceId": "resource_001",
  "uid": "user_001",
  "title": "정보과 세특 작성 기준",
  "resourceType": "document",
  "url": "https://...",
  "fileId": "file_001",
  "subject": "정보",
  "grade": "1학년",
  "tags": ["세특", "정보", "기준"],
  "description": "정보과 세특 작성 시 참고할 기준 문서",
  "visibility": "private",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

visibility 값:

```text
private
department
school
```

resourceType 값:

```text
link
document
spreadsheet
webpage
template
memo
```

---

## 4.14 recordReviews

```json
{
  "reviewId": "review_001",
  "uid": "user_001",
  "originalText": "학생은 수업에 열심히 참여함.",
  "saveOriginalText": false,
  "reviewResult": {
    "summary": "문장이 다소 일반적이며 구체적 활동 근거가 필요합니다.",
    "warnings": ["구체적 사례 부족"],
    "suggestions": [
      "활동 내용과 성장 과정을 함께 제시하면 좋습니다."
    ],
    "privacyWarnings": [],
    "byteCount": 42
  },
  "subject": "정보",
  "createdAt": "timestamp"
}
```

---

## 4.15 recordFiles

```json
{
  "fileId": "file_001",
  "uid": "user_001",
  "fileName": "2026_생기부_지침.pdf",
  "fileType": "pdf",
  "storagePath": "recordFiles/user_001/2026_생기부_지침.pdf",
  "category": "guideline",
  "visibility": "private",
  "createdAt": "timestamp"
}
```

---

## 4.16 noticeTemplates

```json
{
  "templateId": "template_001",
  "uid": "user_001",
  "title": "학부모 안내 기본형",
  "target": "parents",
  "tone": "polite",
  "content": "학부모님께 안내드립니다...",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 5. 주요 API 호출 흐름

### 5.1 Google Chat 메시지 동기화

```text
1. 사용자가 로그인한다.
2. 관리자가 승인한 chatSpaces 목록을 확인한다.
3. Google Chat API로 각 Space의 최근 메시지를 가져온다.
4. chatMessages에 저장한다.
5. analysisStatus를 pending으로 설정한다.
```

### 5.2 AI 업무 분석

```text
1. analysisStatus가 pending인 메시지를 불러온다.
2. 최근 7일, 승인 Space, 업무 키워드 필터를 적용한다.
3. OpenAI API에 분석 요청을 보낸다.
4. 업무성 메시지라면 aiExtractedTasks에 저장한다.
5. confidence가 낮으면 needsReview를 true로 저장한다.
6. 새 업무 후보 알림을 생성한다.
```

### 5.3 업무카드 생성

```text
1. 사용자가 AI 업무 후보를 확인한다.
2. 업무 저장 버튼을 누른다.
3. tasks 문서를 생성한다.
4. confirmedBy와 confirmedAt을 저장한다.
5. aiExtractedTasks status를 savedAsTask로 변경한다.
```

### 5.4 일정 등록

```text
1. 사용자가 일정 등록 버튼을 누른다.
2. 일정 정보를 확인한다.
3. schedules 문서를 syncStatus: pending으로 생성한다.
4. Google Calendar API로 일정을 등록한다.
5. 성공 시 syncStatus를 synced로 변경한다.
6. 실패 시 syncStatus를 failed로 변경하고 syncError를 저장한다.
```

### 5.5 특별실 예약

```text
1. 사용자가 날짜, 교시, 특별실을 선택한다.
2. 동일 roomName, date, period, status: reserved 조건을 조회한다.
3. 기존 예약이 있으면 예약 불가 메시지를 표시한다.
4. 없으면 reservations 문서를 생성한다.
5. reservationLogs에 created 로그를 저장한다.
```

### 5.6 세특 문구 점검

```text
1. 사용자가 문구를 입력한다.
2. saveOriginalText 여부를 선택한다.
3. OpenAI API에 점검 요청을 보낸다.
4. 금지 표현, 개인정보 위험, 개선 제안, byte 수를 반환한다.
5. 저장을 선택한 경우 recordReviews에 저장한다.
```

---

## 6. 보안 규칙 개요

### 6.1 역할 기반 접근

| 역할 | 읽기 | 쓰기 |
|---|---|---|
| 일반 교사 | 본인 데이터 | 본인 업무, 일정, 자료 |
| 담임교사 | 본인/학급 관련 | 학급 자료 |
| 부장교사 | 부서/학년 관련 | 부서/학년 업무 |
| 관리자 | 학교 전체 | 설정, 권한, Space 승인 |

### 6.2 Google Chat 보안

- 승인 Space만 읽기
- 개인 DM 제외
- 메시지 보관 기간 설정
- 민감 정보 감지 시 경고
- 관리자만 Space 승인 가능

### 6.3 학생기록 보안

- 원문 저장 기본값 false
- 파일 visibility 기본값 private
- 공유 전 확인 모달
- 실제 학생명 입력 경고
- 시연은 가상 데이터 사용

---

## 7. 반응형 및 사용자 설정

### 7.1 화면 크기 기준

| 화면 크기 | 적용 모드 |
|---|---|
| 1200px 이상 | PC 대시보드 |
| 768px~1199px | 태블릿 |
| 767px 이하 | 모바일 |
| 사용자 선택 | 선택 모드 우선 적용 |

### 7.2 사용자 설정 저장

```json
{
  "uid": "user_001",
  "viewMode": "auto",
  "homeLayout": "simple",
  "quickActions": ["newTask", "newSchedule", "reserveRoom"],
  "notificationPrefs": {
    "todaySchedule": true,
    "aiTaskCandidate": true
  }
}
```

---

## 8. 구현 우선순위

### 8.1 1차 필수

| 우선순위 | API/DB | 기능 |
|---:|---|---|
| 1 | Firebase Auth | 로그인 |
| 2 | Firestore users | 사용자 설정 |
| 3 | Firestore userHomeWidgets | 홈 화면 개인화 |
| 4 | Google Chat API | 메시지 조회 |
| 5 | OpenAI API | 업무 후보 추출 |
| 6 | Firestore tasks | 업무카드 저장 |
| 7 | Firestore schedules | 일정 저장 |
| 8 | Google Calendar API | 일정 등록 |
| 9 | Firestore notifications | 알림 |

### 8.2 1차 축소 구현

| API/DB | 기능 |
|---|---|
| Firestore reservations | 특별실 단일 예약 |
| Firebase Storage | 학생기록 파일 저장 |
| Firestore recordResources | 자료실 |
| OpenAI API | 세특 샘플 점검 |

### 8.3 2차 확장

| 기술 | 기능 |
|---|---|
| Google Workspace Events API | 실시간 Chat 감지 |
| Firebase Cloud Messaging | 모바일 푸시 |
| Google Chat App | Chat 내 버튼 응답 |
| Firestore aggregation | 관리자 통계 |
| PWA | 모바일 앱처럼 설치 |

---

## 9. 핵심 설계 문장

스쿨메이트 AI의 API와 DB 구조는 단순한 자료 저장이 아니라, Google Chat 메시지를 업무 데이터로 변환하고 이를 일정·업무카드·알림·학생기록 자료와 연결하는 데 목적이 있다.  
다만 AI 결과는 자동 실행하지 않고, 모든 저장과 외부 API 연동은 교사 확인 후 수행한다.

---
