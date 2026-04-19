# SCR Agent Platform - API Documentation

## Overview

Complete REST API for Source Code Review platform with MCP (Model Context Protocol) architecture. Supports three AI agents: Inspector (malware detection), Detective (forensic analysis), Fiscal (risk assessment).

**Base URL**: `http://localhost:3000/api/v1`

---

## Authentication

All endpoints (except `/auth/*`) require JWT token in `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## Finding Lifecycle (PHASE 3.1)

### Get Finding Lifecycle Summary
```http
GET /findings/{findingId}/lifecycle
```

**Response**:
```json
{
  "success": true,
  "data": {
    "currentStatus": "DETECTED",
    "history": [
      {
        "status": "DETECTED",
        "changedAt": "2026-04-19T10:00:00Z",
        "changedBy": "system",
        "note": null
      }
    ],
    "timestamps": {
      "detected": "2026-04-19T10:00:00Z",
      "corrected": null,
      "verified": null,
      "closed": null
    },
    "mttc": null
  }
}
```

### Change Finding Status
```http
PUT /findings/{findingId}/status
Content-Type: application/json

{
  "status": "IN_CORRECTION",
  "comment": "Started fixing this issue"
}
```

**Valid Status Transitions**:
- DETECTED → [IN_REVIEW, IN_CORRECTION, FALSE_POSITIVE]
- IN_REVIEW → [IN_CORRECTION, FALSE_POSITIVE]
- IN_CORRECTION → [CORRECTED, FALSE_POSITIVE]
- CORRECTED → [VERIFIED, IN_CORRECTION, FALSE_POSITIVE]
- VERIFIED → [CLOSED, IN_CORRECTION]
- FALSE_POSITIVE → [DETECTED]
- CLOSED → [IN_CORRECTION]

### Get Audit Trail
```http
GET /findings/{findingId}/audit-trail
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "audit_123",
      "action": "STATUS_CHANGE",
      "changedBy": "john.doe",
      "oldValue": "DETECTED",
      "newValue": "IN_CORRECTION",
      "comment": "Started fixing",
      "timestamp": "2026-04-19T10:05:00Z"
    }
  ]
}
```

---

## Metrics Dashboard (PHASE 3.2)

### Token Usage Metrics
```http
GET /analytics/metrics/token-usage?period=month
```

**Parameters**:
- `period`: `day` | `week` | `month`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "userId": "user_123",
      "userName": "John Doe",
      "totalTokens": 150000,
      "inputTokens": 100000,
      "outputTokens": 50000,
      "costUsd": 2.25,
      "analysisCount": 5,
      "model": "claude-sonnet-4-6",
      "period": "month"
    }
  ]
}
```

### Repository Activity
```http
GET /analytics/metrics/repository-activity
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "projectId": "proj_123",
      "projectName": "MyApp",
      "totalFindings": 45,
      "criticalFindings": 3,
      "highFindings": 12,
      "mediumFindings": 20,
      "lowFindings": 10,
      "analysisCount": 8,
      "lastAnalysisAt": "2026-04-19T10:00:00Z"
    }
  ]
}
```

### MTTD Metrics
```http
GET /analytics/metrics/mttd
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "severity": "CRITICAL",
      "averageMttdHours": 2.5,
      "minMttdHours": 0.5,
      "maxMttdHours": 8.0,
      "sampleCount": 12
    }
  ]
}
```

### Burndown Metrics
```http
GET /analytics/metrics/burndown?days=30
```

**Parameters**:
- `days`: 7, 14, 30, 60, 90

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-03-20",
      "detected": 10,
      "inReview": 5,
      "inCorrection": 3,
      "corrected": 2,
      "verified": 1,
      "falsePositives": 0,
      "closed": 0
    }
  ],
  "days": 30
}
```

---

## Repository Discovery (PHASE 3.3)

### Validate Repository
```http
POST /projects/validate-repo
Content-Type: application/json

{
  "repositoryUrl": "https://github.com/owner/repo",
  "githubToken": "ghp_..." // optional
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "isPublic": true,
    "defaultBranch": "main",
    "branches": ["main", "develop", "staging"],
    "owner": "owner",
    "name": "repo",
    "provider": "github"
  }
}
```

### Get Repository Branches
```http
GET /projects/branches?url=https://github.com/owner/repo&token=ghp_...
```

**Response**:
```json
{
  "success": true,
  "data": {
    "branches": ["main", "develop", "staging"],
    "count": 3
  }
}
```

---

## RBAC & Permissions (PHASE 3.5)

### User Roles

**ADMIN**: Full access to all features
- Manage users, projects, findings
- Access metrics and analytics
- Modify system settings

**ANALYST**: Security-focused role
- View and manage findings
- Verify remediations
- Create reports
- View analytics

**DEVELOPER**: Development-focused role
- Run analyses
- View findings
- Read alert rules

**VIEWER**: Read-only access
- View projects and findings
- View analytics
- Cannot modify anything

### Check User Permissions

Permissions are enforced at middleware level. If user lacks permission:

```json
{
  "success": false,
  "error": "Insufficient permissions",
  "requiredPermission": "verify_remediation"
}
```

---

## Monitoring (PHASE 4.1)

### System Health
```http
GET /monitoring/health
```

**Response**:
```json
{
  "success": true,
  "data": {
    "cpu": {
      "usage": 45.2,
      "cores": 8,
      "model": "Intel Core i7"
    },
    "memory": {
      "usage": 62.1,
      "usedGb": 10.2,
      "totalGb": 16.0
    },
    "disk": {
      "usage": 31.3,
      "usedGb": 150.5,
      "totalGb": 480.0
    },
    "uptime": "5d 14h 32m",
    "uptimeSeconds": 482552,
    "loadAverage": [2.5, 2.1, 1.8],
    "health": {
      "healthy": true,
      "warnings": []
    },
    "timestamp": "2026-04-19T15:30:00Z"
  }
}
```

---

## False Positive Learning (PHASE 4.2)

### Get FP Statistics
```http
GET /monitoring/false-positives/stats
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalFindings": 500,
    "falsePositives": 45,
    "fpRate": 9.0,
    "topPatterns": [
      {
        "file": "*.test.js",
        "riskType": "LOGIC_BOMB",
        "count": 8
      }
    ]
  }
}
```

### Get Learned Patterns
```http
GET /monitoring/false-positives/patterns
```

**Response**:
```json
{
  "success": true,
  "data": {
    "patterns": [
      {
        "filePattern": ".*\\.test\\.js$",
        "riskType": "LOGIC_BOMB",
        "confidence": 0.8
      }
    ],
    "count": 1
  }
}
```

---

## Alert Rules (PHASE 2.5)

### Create Alert Rule
```http
POST /alert-rules
Content-Type: application/json

{
  "name": "Critical Findings Alert",
  "description": "Alert on critical severity findings",
  "severityThreshold": "CRITICAL",
  "findingCountMin": 1,
  "notificationChannel": "webhook",
  "webhookUrl": "https://example.com/webhook"
}
```

### Get Alert Rules
```http
GET /alert-rules
```

### Delete Alert Rule
```http
DELETE /alert-rules/{ruleId}
```

---

## Agent Management (PHASE 2)

### Get Agent Prompt
```http
GET /agents/inspector/prompt
```

### Update Agent Prompt
```http
PUT /agents/inspector/prompt
Content-Type: application/json

{
  "prompt": "New custom prompt for inspector..."
}
```

### Reset Agent Prompt
```http
POST /agents/inspector/reset
```

---

## Error Responses

All errors follow standard format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": {
    "code": "ERROR_CODE",
    "message": "Technical details"
  }
}
```

### Common Status Codes

- **200 OK**: Success
- **201 Created**: Resource created
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Missing/invalid auth
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## Rate Limiting

- **Window**: 15 minutes
- **Limit**: 10,000 requests per window
- **Headers**: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

---

## Webhooks

Webhooks can be configured for:
- `finding.created`
- `finding.updated`
- `finding.closed`
- `analysis.completed`
- `alert.triggered`

Webhook signature in `X-Webhook-Signature` header (HMAC-SHA256).

---

## Version

API Version: `v1`
Last Updated: 2026-04-19
