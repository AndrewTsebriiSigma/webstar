# Disabled Features

This document tracks features that are temporarily disabled but preserved in the codebase for future re-enablement.

---

## 🗂️ Drafts Feature

**Status:** Disabled (V1 Release)  
**Disabled Date:** January 2026  
**Reason:** Feature deprioritized for MVP launch; will be re-enabled in future release.

### What's Disabled

| Component | Location | Status |
|-----------|----------|--------|
| Drafts button in dashboard | `frontend/src/app/[username]/page.tsx` | **Commented out** |
| `/drafts` page | `frontend/src/app/drafts/page.tsx` | Active (just not linked) |
| Backend API endpoints | `backend/app/routers/portfolio.py`, `projects.py` | Active |
| API client functions | `frontend/src/lib/api.ts` | Active |

### How to Re-Enable

1. **Open** `frontend/src/app/[username]/page.tsx`
2. **Find** the comment block `FEATURE_DISABLED: DRAFTS`
3. **Uncomment** the button code between the markers
4. **Test** by clicking the Drafts button in the profile dashboard

### Backend Endpoints (Still Active)

These endpoints remain functional for testing and future use:

```
GET  /api/portfolio/drafts     - Get user's draft portfolio items
GET  /api/projects/drafts      - Get user's draft projects
POST /api/portfolio/{id}/publish - Publish a draft item
```

### Database Fields (Unchanged)

- `PortfolioItem.is_draft` - Boolean field
- `Project.is_draft` - Boolean field

### Testing

The `/drafts` route is still accessible directly via URL:
```
https://yourdomain.com/drafts
```

This allows testing the feature without exposing it in the main UI.

---

## How to Add New Disabled Features

When disabling a feature:

1. **Comment out UI code** with clear markers:
   ```tsx
   {/* FEATURE_DISABLED: FEATURE_NAME
       Description of why it's disabled
       ...code...
   END FEATURE_DISABLED: FEATURE_NAME */}
   ```

2. **Keep backend endpoints** active (they don't cost anything)

3. **Document here** with:
   - What's disabled
   - Why
   - How to re-enable
   - Related endpoints/routes

4. **Don't delete files** - just unlink them from the UI

