# Security Specification — Ruivinha VIP (Firestore Rules)

## 1. Data Invariants
1. A `users/{userId}` document belongs strictly to `request.auth.uid == userId`; PII (`email`, `telegramUsername`) is readable only by the owner or verified admin.
2. Users cannot escalate privileges (`role`, `isAdmin`) or inject unknown shadow fields on `users/{userId}`.
3. A `posts/{postId}` document can only be created or deleted by a verified admin (`isAdmin()`), with strict enum validation for `mediaType` (`video` | `photo`), `accessType` (`free` | `vip` | `ppv`), bounded string lengths, and server-validated `createdAt == request.time`.
4. Non-admin authenticated verified users may only update `likes` (+1 or -1) on `posts/{postId}` via `affectedKeys().hasOnly(['likes'])`.
5. `transactions/{transactionId}` records must match `incoming().userId == request.auth.uid` and server timestamp `incoming().createdAt == request.time`, and are readable only by their owner or verified admin.
6. `users/{userId}/unlockedPosts/{postId}` requires `exists(/databases/$(database)/documents/posts/$(postId))` and `incoming().userId == userId`.

## 2. Adversarial Payloads ("Dirty Dozen")
1. **Unauthenticated Write to `posts`**: `auth: null`, `create /posts/p1` -> `PERMISSION_DENIED`.
2. **Non-Admin Post Creation**: `auth: { uid: 'u2', email_verified: true }`, `create /posts/p1` -> `PERMISSION_DENIED`.
3. **Email Spoofing Admin**: `auth: { uid: 'spoof', token: { email: 'rodrigotricollorgamer@gmail.com', email_verified: false } }`, `create /posts/p1` -> `PERMISSION_DENIED`.
4. **Shadow Field on User Profile**: `create /users/u1` with `{ uid: 'u1', email: 'a@b.com', isVipSubscriber: false, isAdmin: true, ... }` -> `PERMISSION_DENIED`.
5. **Cross-User PII Read**: `auth: { uid: 'u2' }`, `get /users/u1` -> `PERMISSION_DENIED`.
6. **List Users Scraping**: `auth: { uid: 'u2' }`, `list /users` -> `PERMISSION_DENIED`.
7. **Immutable `createdAt` Tampering**: `update /users/u1` modifying `createdAt` -> `PERMISSION_DENIED`.
8. **Invalid Document ID Poisoning**: `create /users/invalid$$id!` -> `PERMISSION_DENIED`.
9. **Oversized Caption Attack**: `create /posts/p1` with `caption` > 2000 chars -> `PERMISSION_DENIED`.
10. **Non-Like Post Field Update by Regular User**: `auth: { uid: 'u2', email_verified: true }`, `update /posts/p1` changing `price` -> `PERMISSION_DENIED`.
11. **Transaction Spoofing Other User**: `auth: { uid: 'u2' }`, `create /transactions/t1` with `userId: 'u1'` -> `PERMISSION_DENIED`.
12. **Client-Forged Timestamp**: `create /posts/p1` with past `createdAt` != `request.time` -> `PERMISSION_DENIED`.
