## Communication Hub — Functional Specification (v1)

This document turns the current Mission Communication Hub UI into a functional, production-ready feature set. It defines scope, data models, APIs, RBAC, real-time behavior, and an actionable TODO plan by role.

### 1) Current State (Audit)

- UI Entrypoint: `src/app/mission-communication-hub/page.tsx` shows mission overview and tiles for channels:
  - Mission-wide: Announcements, Guideline Session, Resources
  - Admin-only: Messaging, Resources
  - Helpzone: Guideline, Coding
  - Mentorship Groups: mentor-specific channels
- Shared layout: `src/app/mission-communication-hub/layout.tsx` with `CommunicationHubClientWrapper` providing sidebar/header.
- Sidebar/nav: `src/components/mission-communication-hub/CommunicationHubSidebar.tsx` fetches missions and renders hub navigation.
- Messaging UI building blocks exist (e.g., `MessageComposer`, `MessageList`, `GuidelinePostModal`, `ResourceForm`), but feature pages mostly use demo/dummy data (e.g., Helpzone guideline page).
- Store: `src/store/missionHubSlice.ts` provides mission, students, mentors, groups for top-level stats; not yet wired to hub messaging/posts.
- Data models (implemented):
  - `Channel` with mission/group scope, types, visibility, allowedRoles, lastMessageAt.
  - `Message` with attachments, mentions, reactions, threadId, read receipts.
  - `Post` for announcement/resource/guideline/coding with statuses, tags, pinned.
  - `Comment` for threaded comments on `Post`.
- APIs (implemented, v2):
  - `GET/POST /api/v2/channels`
  - `GET/POST /api/v2/channels/[id]/messages`
  - `GET/POST /api/v2/posts` and `GET/PUT/DELETE /api/v2/posts/[id]`
  - `GET/POST /api/v2/posts/[id]/comments`
  - Rate limiting present; basic RBAC checks on channel posting.

Conclusion: The UI is mostly shell/dummy; models and baseline APIs exist. We need to bind UI pages to these APIs, add missing endpoints (reactions, read receipts, moderation), and enforce RBAC consistently.

### 2) Functional Features (Target)

1. Mission-wide Channels
   - Announcements: admins/moderators/mentors can post; all can read; pin posts; comments (optional).
   - Guideline Session: structured guideline posts; statuses (pending/investigating/resolved/approved/rejected); comments and moderation workflow.
   - Resources: resource posts with title, content, tags, attachments; search/filter by tag.

2. Admin Channels
   - Messaging: private non-student channel for admin-mentor coordination; real-time chat, attachments, mentions.
   - Resources: internal docs/resources visible to non-student roles.

3. Helpzone
   - Guideline zone: Q&A style posts, statuses, threading in comments, moderator actions (approve/reject/resolve).
   - Coding zone: Q&A style posts with code attachments; accepted answer flag.

4. Mentorship Groups
   - Per-mentor channels: announcements and discussions for assigned students; mentors and their students can post/read; moderators/admins oversight.

5. Cross-cutting
   - Reactions on messages and comments.
   - Read receipts for chat messages.
   - Mentions with basic notifications.
   - Pinning posts/messages in channels.
   - Search (by text, tag, author) and filters (category, status, date).

### 3) Data Models (Detailed)

We will leverage existing schemas and define invariants, indexes, and examples. No schema migration is required to begin.

3.1 Channel
- Fields
  - `missionId: ObjectId` (required)
  - `groupId?: ObjectId` (optional)
  - `type: "mentor-messaging" | "group-discussion"` (required)
  - `visibility: "non-student" | "group"` (required)
  - `allowedRoles: string[]` (derived by creator; e.g., `["admin","moderator","mentor"]`)
  - `lastMessageAt?: Date`
  - `createdBy: ObjectId` (required)
  - `createdAt: Date`, `updatedAt: Date`
- Indexes
  - `{ missionId: 1, groupId: 1, type: 1 }`
  - `{ lastMessageAt: -1 }`
- Invariants
  - If `visibility === "non-student"`, then students must be denied at API layer.
  - If `visibility === "group"`, only group members + mentors + moderators + admins can read/post.
  - For `type === "mentor-messaging"`, students cannot post unless `visibility === "group"` and membership check passes.
- Example
  - Admin-only ops channel: `{ type: "mentor-messaging", visibility: "non-student", allowedRoles: ["admin","moderator","mentor"] }`
  - Group discussion channel: `{ type: "group-discussion", visibility: "group" }`

3.2 Message
- Fields
  - `channelId: ObjectId` (required)
  - `senderId: ObjectId` (required)
  - `body: string` (markdown, required)
  - `attachments?: Array<{ url, name, type, size? }>`
  - `mentions?: ObjectId[]` (users)
  - `reactions?: Array<{ reaction: "ok"|"love"|"cry"|"haha"|"bulb", userId: ObjectId, createdAt: Date }>`
  - `threadId?: ObjectId` (message threads)
  - `readReceipts?: Array<{ userId: ObjectId, readAt: Date }>`
  - `createdAt: Date`, `editedAt?: Date`, `deletedAt?: Date|null`
- Indexes
  - `{ channelId: 1, createdAt: 1 }`
  - `{ threadId: 1 }`
- Invariants
  - One reaction per `(userId, messageId)`; server replaces user’s previous reaction value.
  - Soft delete by setting `deletedAt` (client renders tombstone).
  - Read receipts are upserts keyed by `(userId, messageId)`.

3.3 Post
- Fields
  - `missionId: ObjectId` (required)
  - `groupId?: ObjectId`
  - `category: "announcement" | "resource" | "guideline" | "coding"` (required)
  - `announcementType?: "general" | "session" | "live-session" | "important"`
  - `title: string` (required)
  - `body: string` (required)
  - `attachments?: Array<{ url, name, type, size? }>`
  - `tags?: string[]` (for resources and optionally others)
  - `status: "pending" | "investigating" | "resolved" | "approved" | "rejected"` (default `pending`)
  - `pinned?: boolean` (default `false`)
  - `visibility: "mission" | "group"` (required)
  - `createdBy: ObjectId` (required)
  - `createdAt: Date`, `updatedAt: Date`
- Indexes
  - `{ missionId: 1, groupId: 1, category: 1, createdAt: -1 }`
  - `{ status: 1 }`
  - `{ createdBy: 1 }`
- Invariants
  - `visibility === "mission"` ⇒ accessible to all unless restricted by role for writes.
  - `visibility === "group"` ⇒ group-level access control.

3.4 Comment
- Fields
  - `postId: ObjectId` (required)
  - `parentId?: ObjectId|null` (for nesting)
  - `authorId: ObjectId` (required)
  - `body: string` (required)
  - `attachments?: Array<{ url, name, type, size? }>`
  - `reactions?: Array<{ reaction, userId, createdAt }>`
  - `createdAt: Date`, `editedAt?: Date`, `deletedAt?: Date|null`
- Indexes
  - `{ postId: 1, parentId: 1, createdAt: 1 }`
- Invariants
  - Soft delete same as messages.
  - Optionally later: `isAcceptedAnswer?: boolean` for coding zone.

### 4) API Design (Detailed Contracts)

Conventions
- Auth via server `getAuthUserFromRequest`.
- Rate limiting on create/update endpoints.
- Responses: `{ success: boolean, data?: T, error?: string, nextCursor?: string }`.

4.1 Channels
- List
  - GET `/api/v2/channels?missionId=&groupId=&type=`
  - Response `data: Channel[]`
- Create (non-student)
  - POST `/api/v2/channels`
  - Body: `{ missionId: string, groupId?: string, type: "mentor-messaging"|"group-discussion", visibility: "non-student"|"group", allowedRoles?: string[] }`
  - Response `data: Channel`

4.2 Messages
- List
  - GET `/api/v2/channels/{id}/messages?limit=30&cursor=&threadId=`
  - Response: `{ data: Message[], nextCursor?: string }`
- Create
  - POST `/api/v2/channels/{id}/messages`
  - Body: `{ body: string, attachments?: Attachment[], mentions?: string[], threadId?: string }`
  - Response: `{ data: Message }`
- Edit
  - PATCH `/api/v2/channels/{id}/messages/{messageId}`
  - Body: `{ body: string }`
  - AuthZ: author or moderator/admin
  - Response: `{ data: Message }`
- Delete (soft)
  - DELETE `/api/v2/channels/{id}/messages/{messageId}`
  - Response: `{ success: true }`
- React
  - POST `/api/v2/channels/{id}/messages/{messageId}/react`
  - Body: `{ reaction: "ok"|"love"|"cry"|"haha"|"bulb"|null }`
  - Behavior: upsert or remove (when null). One reaction per user.
  - Response: `{ success: true, data: { myReaction: string|null, counts: { ok: number, love: number, cry: number, haha: number, bulb: number } } }`
- Read Receipt
  - POST `/api/v2/channels/{id}/messages/{messageId}/read`
  - Body: `{ readAt?: string }` (defaults to now)
  - Response: `{ success: true }`

4.3 Posts
- List
  - GET `/api/v2/posts?missionId=&groupId=&category=&status=&q=&tag=&limit=&cursor=`
  - Response: `{ data: Post[], nextCursor?: string }`
- Create
  - POST `/api/v2/posts`
  - Body: `{ missionId, groupId?, category, title, body, attachments?, tags?, status?, visibility, announcementType? }`
  - Response: `{ data: Post }`
- Detail
  - GET `/api/v2/posts/{id}` → `{ data: Post }`
- Update
  - PUT `/api/v2/posts/{id}` (author or moderator/admin)
  - Body: same as create, any subset
  - Response: `{ data: Post }`
- Delete (soft)
  - DELETE `/api/v2/posts/{id}` → `{ success: true }`
- Pin
  - PATCH `/api/v2/posts/{id}/pin` { pinned: boolean }
  - Response `{ data: { pinned: boolean } }`
- Status change
  - PATCH `/api/v2/posts/{id}/status` { status }
  - Response `{ data: { status } }`

4.4 Comments
- List
  - GET `/api/v2/posts/{id}/comments?parentId=&limit=&cursor=`
  - Response: `{ data: Comment[], nextCursor?: string }`
- Create
  - POST `/api/v2/posts/{id}/comments` { body, attachments?, parentId? }
  - Response: `{ data: Comment }`
- Edit
  - PATCH `/api/v2/posts/{id}/comments/{commentId}` { body }
  - Response: `{ data: Comment }`
- Delete (soft)
  - DELETE `/api/v2/posts/{id}/comments/{commentId}` → `{ success: true }`
- React
  - POST `/api/v2/posts/{id}/comments/{commentId}/react` { reaction: Reaction|null }
  - Response: `{ success: true, data: { myReaction, counts } }`

4.5 Search
- GET `/api/v2/search/communication?q=&missionId=&category=&type=&tag=&authorId=&dateFrom=&dateTo=&limit=&cursor=`
  - Response: `{ data: Array<Post|Message>, nextCursor?: string }`

Examples
- Create Reaction on Message
  - Request: `POST /api/v2/channels/abc/messages/def/react` `{ "reaction":"love" }`
  - Response: `{ "success":true, "data": { "myReaction":"love", "counts": { "ok":1, "love":3, "cry":0, "haha":2, "bulb":0 } } }`


### 5) RBAC & Permissions

Roles: student, mentor, moderator, admin.

- Announcements (mission): read: all; write: moderator/admin; edit/delete: moderator/admin; pin: moderator/admin.
- Resources (mission): read: all; write: mentor/moderator/admin; edit/delete: author or moderator/admin.
- Admin Messaging/Resources: visible to non-student (mentor/moderator/admin); students denied.
- Helpzone Guideline/Coding: read: all; write (create posts/comments): students/mentors/moderators/admin; moderate (status change, edit/delete any): moderator/admin; accept answer (coding): moderator/admin (optionally author if enabled).
- Mentorship Groups: group participants (mentor + assigned students) can read/write; moderators/admins can read and moderate; non-participants denied.
- Messages RBAC: if `Channel.type === "mentor-messaging"`, block students unless `visibility === "group"` and they are assigned to that group.
- Rate limiting for message/post/comment creation.

### 6) Real-time & Notifications

- Phase 1: Optimistic updates + polling/infinite scroll using `cursor` for messages and posts.
- Phase 2: SSE or WebSocket channel per `channelId` and post comment thread; publish message/post/comment create/edit/delete events; lightweight mention notifications (in-app toast + badge).
- Read receipts updated on viewport visibility throttled; reaction updates are idempotent.

### 7) UX Behaviors

- Infinite scroll for messages and post/comment lists.
- Draft preservation in composers.
- Markdown preview support in posts/comments/messages.
- Quick tag filters for Resources; status chips for Guideline.
- Linkable deep routes for posts (`/helpzone/guideline/[postId]`, `/helpzone/coding/[postId]`).

### 8) Implementation TODOs (Role-focused)

General
- Wire mission selection and pass `missionId` to all hub pages.
- Standardize API helpers for list/detail/create/edit/delete with consistent shapes.

Admins/Moderators
- Announcements page: list/create/edit/pin; RBAC guard; connect to `Post` APIs.
- Admin Messaging: use `Channel` + `Message` APIs; reactions and read receipts; mentions.
- Moderation tools: change `Post.status`; delete/edit any message/post/comment; view reports (future).
- Resources (admin): create/manage internal resources (filter by tag).

Mentors
- Mentorship Groups page: fetch mentor’s groups; for each, open discussion channel and announcement channel; compose messages; attach files.
- Resources (mission): create resources; edit own posts.
- Participate in Helpzone; answer questions; escalate to moderators.

Students
- Read mission-wide announcements/resources.
- Participate in group discussions for assigned groups.
- Create Helpzone posts (guideline/coding) and comments; edit own content.

Cross-cutting Tasks
- Message reactions endpoint + UI integration.
- Read receipts endpoint + UI integration.
- Mentions parsing and lightweight notifications.
- Search endpoint + UI.
- Accessibility pass and empty-states.

### 9) Endpoint Mapping to UI Pages

- `/mission-communication-hub/announcements` → `GET /api/v2/posts?category=announcement&missionId=...` + create/update/pin.
- `/mission-communication-hub/resources` → `GET /api/v2/posts?category=resource&missionId=...` (+ tags filter) + create/update.
- `/mission-communication-hub/admin-groups/messaging` → fetch/create `Channel` of `type=mentor-messaging, visibility=non-student`; then messages under that channel.
- `/mission-communication-hub/admin-groups/resources` → `Post` with `visibility=mission`, restrict students client-side and server-side.
- `/mission-communication-hub/helpzone/guideline` and `[postId]` → `Post` category `guideline` + `Comment` endpoints; status changes.
- `/mission-communication-hub/helpzone/coding` and `[postId]` → `Post` category `coding` + `Comment`; accepted answer (future minor model add on Comment).
- `/mission-communication-hub/mentorship-groups` → list mentor’s groups; for each group: corresponding `Channel` of `type=group-discussion, visibility=group` and posts (group announcements if desired).

### 10) Non-functional Requirements

- Rate limiting (already present for messages; replicate for posts/comments).
- Audit logging for moderation actions (future).
- Pagination with cursors for scalability.
- Indexes present on models; monitor query performance.

---

Appendix: Minimal request/response examples

Create message
POST `/api/v2/channels/{id}/messages`
Body: `{ body: string, attachments?: Attachment[], mentions?: string[], threadId?: string }`
Response: `{ success: true, data: Message }`

Create post
POST `/api/v2/posts`
Body: `{ missionId, groupId?, category, title, body, attachments?, tags?, visibility, announcementType? }`
Response: `{ success: true, data: Post }`

React to message
POST `/api/v2/channels/{id}/messages/{messageId}/react`
Body: `{ reaction: "ok" | "love" | "cry" | "haha" | "bulb" | null }`
Response: `{ success: true }`


