# Personal Information Collection List

Status: DRAFT_FOR_PROFESSIONAL_REVIEW

| Module | Field Examples | Purpose | Current Source | Sensitivity | Review Notes |
|---|---|---|---|---|---|
| Account | email, name, password hash | Registration and login | Auth API | Personal information | Password is stored as hash only. |
| Workspace | workspace name, slug, member role | Tenant collaboration | Workspace API | Business/contact context | Tenant isolation is mandatory. |
| Invitation | invite email, role, token hash | Team onboarding | Invitation API | Personal information | Token hash is not returned after creation. |
| Ticket | title, description, category, priority | Service request handling | Web/channel APIs | May contain personal or sensitive content | Users need upload/content guidance. |
| Messages | public/internal replies | Collaboration and audit | Ticket API | May contain personal or sensitive content | Internal notes need access control. |
| Channel | external user id/name, message text | WeCom mock inbound | Channel webhook | Personal information | Current implementation is mock only. |
| AI audit | prompt version, model, confidence, result metadata | Traceability and safety | AI module | Derived operational data | Current provider is deterministic mock. |
| Billing | plan, order, activation metadata | Entitlement and commercial workflow | Billing API | Business/contact context | No real payment provider connected. |

All fields require professional review before production privacy notice publication.
