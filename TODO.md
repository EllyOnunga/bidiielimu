# GilaniOS — Codebase Improvement TODO

## Approved tasks

### 1) Permissions & DRF class attribute audit
- [ ] Scan backend/*/views.py for duplicated/overridden `permission_classes` / `serializer_class`
- [ ] Ensure tenant-scoped APIs consistently enforce `StrictTenantPermission` (where appropriate)
- [ ] Add/adjust tests to prevent cross-tenant leakage

### 2) Inventory performance fixes
- [ ] Update `BookIssueViewSet.my_books` to avoid per-object save for overdue status
- [ ] Replace loop-based status transitions with bulk `update()` and re-query
- [ ] Reduce redundant DB counts/aggregations in inventory stats endpoints
- [ ] Add tests for overdue transitions correctness

### 3) CORS settings cleanup
- [ ] Normalize `backend/config/settings.py` CORS configuration (remove duplicate assignments)
- [ ] Keep a single source of truth for allowed origins and regexes

### 4) Middleware auth/multi-tenant hardening
- [ ] Review `TenantAccessMiddleware` manual JWT authentication path
- [ ] Ensure middleware ordering doesn’t cause inconsistent `request.user` / tenant state
- [ ] Add tests for public schema access restrictions and tenant isolation

### 5) Verification
- [ ] Run unit tests (`make test` or `python -m pytest`)
- [ ] Lint/compile checks (done: `python -m compileall backend`)


## Completed changes in this iteration
- [x] `backend/config/settings.py`: removed duplicate CORS_ALLOWED_ORIGIN_REGEXES block.
- [x] `backend/inventory/views.py`: optimized `BookIssueViewSet.my_books` by bulk-updating overdue statuses.



