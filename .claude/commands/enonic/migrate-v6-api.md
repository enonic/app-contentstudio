# Migrate v6 API to Modern Fetch

Refactor v6 features to use modern fetch API and remove legacy dependencies.

**Scope:** `v6/features/api/` and `v6/features/store/` only.

---

## Phase 0: Dependency Audit

Scan target directories for legacy imports:

```
v6/features/api/ and v6/features/store/:
- app/util/UrlHelper
- app/rendering/UriHelper
- @enonic/lib-admin-ui (UriHelper, ResourceRequest, Q)
- Legacy Request classes (*Request from app/resource/)
```

**Output:** Categorized report with `file:line` references.

---

## Phase 1: Clarification

Ask user using AskUserQuestion tool:
- Priority files to migrate?
- Any requests to skip?
- Caching requirements for specific requests?

Present recommendations with each question.

---

## Phase 2: Utility Gap Analysis

For each legacy import:
1. Check if v6 equivalent exists in `utils/url/`
2. List missing utilities needed
3. Propose new utility functions BEFORE implementing requests
4. Wait for user approval

**Available v6 utilities:**
- `getCmsApiUrl(endpoint, project?)` - project-scoped content APIs
- `getCmsRestUri(path)` - non-project-scoped APIs
- `getCmsPath(endpoint, project?)` - path building only

**May need to create:**
- `utils/url/navigation.ts` - browse/edit URLs
- `utils/url/portal.ts` - rendering/component URIs
- `utils/url/params.ts` - URL parameter utilities

---

## Phase 3: Planning

For each request to migrate:

**1. Identify category:**
- **Simple** - GET/POST → direct fetch
- **Cached** - needs `Map<string, Promise<T>>`
- **Task-based** - returns `TaskId` (PublishContentRequest, DeleteContentRequest, etc.)
- **Batch** - array in/out, early return on empty

**2. Trace URL building:**
- Read request class hierarchy (CmsResourceRequest → CmsContentResourceRequest → etc.)
- Document final URL pattern
- Map to v6 utility

**3. Document response parsing:**
- JSON types involved
- Content builders needed (PageTemplateBuilder, SiteBuilder, ContentBuilder)
- Null/empty handling

Present plan, wait for approval.

---

## Phase 4: Implementation

For each request, step-by-step:

1. Create missing URL utilities (if any)
2. Implement fetch-based function using templates below
3. Handle edge cases:
   - Empty array → early return `[]`
   - Null response → return `undefined`
   - Error → `console.error()` + return `undefined`
4. Add JSDoc with PURPOSE (see standard below)
5. Run `pnpm -C ./modules/lib run check:types`
6. Mark complete, proceed to next

---

## Request Templates

**Simple Request:**
```typescript
export async function fetchX(id: ContentId): Promise<X | undefined> {
    const url = getCmsApiUrl('endpoint');
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: id.toString()}),
        });
        if (!response.ok) throw new Error(response.statusText);
        const json: XJson = await response.json();
        return X.fromJson(json);
    } catch (error) {
        console.error(error);
        return undefined;
    }
}
```

**Cached Request:**
```typescript
const cache = new Map<string, Promise<X>>();

export async function fetchX(key: string): Promise<X | undefined> {
    if (cache.has(key)) {
        try { return await cache.get(key); }
        catch { cache.delete(key); }
    }
    const promise = (async (): Promise<X> => {
        const response = await fetch(...);
        if (!response.ok) throw new Error(response.statusText);
        return X.fromJson(await response.json());
    })();
    cache.set(key, promise);
    try { return await promise; }
    catch (error) { console.error(error); return undefined; }
}
```

**Task Request (returns TaskId):**
```typescript
export async function doX(ids: ContentId[]): Promise<TaskId> {
    const url = getCmsApiUrl('endpoint');
    const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ids: ids.map(id => id.toString())}),
    });
    if (!response.ok) throw new Error(response.statusText);
    const json: TaskIdJson = await response.json();
    return TaskId.fromJson(json);
}
```

**Batch Request:**
```typescript
export async function fetchXBatch(ids: ContentId[]): Promise<X[]> {
    if (ids.length === 0) return [];
    const url = getCmsApiUrl('endpoint');
    const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ids: ids.map(id => id.toString())}),
    });
    if (!response.ok) throw new Error(response.statusText);
    const json: XJson[] = await response.json();
    return json.map(X.fromJson);
}
```

---

## Documentation Standard

```typescript
/**
 * Load page template for content editing.
 * Used by: ContentWizard, DetailsWidget
 *
 * @param contentId - Content to load template for
 * @returns Template data or undefined if not found/error
 */
```

---

## Content Parsing Helper

For responses returning Content/Site/PageTemplate:

```typescript
function parseContent(json: ContentJson): Content {
    const type = new ContentTypeName(json.type);
    if (type.isSite()) {
        return new SiteBuilder().fromContentJson(json).build();
    }
    if (type.isPageTemplate()) {
        return new PageTemplateBuilder().fromContentJson(json).build();
    }
    return new ContentBuilder().fromContentJson(json).build();
}
```

---

## Reference Files

**URL utilities:** `v6/features/utils/url/cms.ts`
**Existing migrations:** `v6/features/api/content.ts`, `v6/features/api/unpublish.ts`, `v6/features/api/details.ts`
**Content builders:** `app/content/` (PageTemplateBuilder, SiteBuilder, ContentBuilder)
**Legacy requests:** `app/resource/` (trace inheritance for URL patterns)
