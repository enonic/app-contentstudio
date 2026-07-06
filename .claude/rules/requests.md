---
paths:
  - "**/*.api.ts"
  - "**/*.api.test.ts"
---

# HTTP Requests — fetch + neverthrow

All server calls from v6 go through the shared Result client. No v6 code talks to
the server any other way.

## Target Pattern

```typescript
// v6/entities/content/api/publish.api.ts
import { ResultAsync } from 'neverthrow';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

export function publishContent(req: PublishRequest): ResultAsync<TaskId, AppError> {
    return requestJson<TaskIdJson>(getCmsApiUrl('publish'), {
        method: 'POST',
        body: toPayload(req),
    }).map(TaskId.fromJson);
}
```

- `requestJson<T>()` / `requestOptionalJson<T>()` from `v6/shared/api/client` are the
  only entry points. Both return `ResultAsync<T, AppError>`.
- `requestOptionalJson` for endpoints where 204 / null is a valid "nothing" answer.
- Parse JSON → domain with `.map(...)`; never expose raw `*Json` shapes past the `api/`.

## Banned in v6

```typescript
// ❌ lib-admin-ui request classes
import { ResourceRequest } from '@enonic/lib-admin-ui/rest/ResourceRequest';
new GetContentByIdRequest(id).sendAndParse();   // Q.Promise
// ❌ lib-admin-ui URL/JSON helpers
import { UrlHelper } from '.../app/util/UrlHelper';
import { UriHelper } from '@enonic/lib-admin-ui/util/UriHelper';
// ❌ raw fetch / XMLHttpRequest in feature code
const res = await fetch(url); if (!res.ok) throw new Error(res.statusText);
// ❌ Kris-Kowal q promises
import Q from 'q';
```

Any `*Request` class, `UrlHelper`/`UriHelper`, lib-admin-ui JSON helper, `q`, or bare
`fetch`/`XMLHttpRequest` in v6 is debt to remove — not a pattern to copy. `XMLHttpRequest`
is allowed only where upload progress is genuinely needed (media/attachment upload), and
only via the shared `requestUploadJson` helper (`v6/shared/api/upload.ts`) — feature code
never constructs XHR. Upload error channels use `UploadError` (extends `AppError`, carries
the media identifier).

## URL Construction

```typescript
getCmsApiUrl('publish')                  // /admin/rest-v2/cs/cms/<active-project>/content/content/publish
getCmsApiUrl('', projectName)            // explicit project override
getCmsRestUri('cms/<project>/macro/x')   // non-content endpoints (no project injection)
```

- Project comes from `getCmsApiUrl`'s `projectName` arg, falling back to the active
  project resolver. Never read project state inside `api/`.
- Branch/target travels in the **body**, never the URL.
- Query params: `?id=${encodeURIComponent(id)}` or `URLSearchParams`. Encode ids/keys.
- Repository-scoped service URLs come from the v6 config store
  (`$config.get().services.*`, `$config.get().extensionApiUrl`) + `URLSearchParams`
  (see `versions.api.ts`, `importContent.api.ts`, `styles.api.ts`). Never read them
  from lib-admin-ui's `CONFIG` — that legacy singleton is being removed; add any
  missing property to `shared/config/config.store.ts` and read it from `$config`.
- When porting a `ResourceRequest` subclass, trace its class hierarchy
  (`CmsResourceRequest → CmsProjectBasedResourceRequest → CmsContentResourceRequest`)
  to the exact final URL, then reproduce it with `getCmsApiUrl`/`getCmsRestUri`. Two
  callers override the postfix to `getCmsRestUri('')` (principals) — preserve that.

## Result Flows to the Service Layer

The `ResultAsync` propagates up to the service/command layer; that layer is where it is
unwrapped and side effects happen. `api/` never `.match`es, logs, or shows toasts.

**A batch is the api file plus its direct callers and their tests** — changing the return
type from `Promise<T>` to `ResultAsync<T, AppError>` necessarily ripples into every caller.
Two sanctioned unwrap idioms, pick by caller shape:

- `.match(onOk, onErr)` for a simple command funnel (e.g. `executeDeleteDialogAction`).
- an explicit `if (result.isErr()) { …; return; } const value = result.value;` guard for an
  orchestrator with mid-path `await`s / instance guards (e.g. `reloadDeleteDialogData`),
  keeping its existing `try/catch/finally`.

Never `if (isErr) throw error` to funnel back into a caller's catch — that re-hides the
error and makes the migration cosmetic.

```typescript
// ✅ features/publish/model/publishDialog.service.ts
const result = await publishContent(req);
result.match(
    (taskId) => setPublishTask(taskId),   // command → writes a fact store
    (err) => showError(err.message),      // side effect at the edge
);

// ❌ api/ unwrapping and throwing (defeats the point)
export async function publishContent(req): Promise<TaskId> {
    const r = await requestJson<TaskIdJson>(url, { ... });
    if (r.isErr()) throw r.error;
    return TaskId.fromJson(r.value);
}
```

Empty-input handling stays behavior-preserving: array-returning batches short-circuit
to `okAsync([])`; single-result calls where empty input is invalid return
`errAsync(new AppError('...'))`. Do not throw synchronously.

## File Placement & Naming

- Requests live in `api/` inside their FSD slice: `entities/<x>/api/`, `features/<x>/api/`,
  `widgets/<x>/api/`. Follows `stores.md` (`api/` = REST calls; `service.ts` orchestrates).
- File: `<domain>.api.ts` with colocated `<domain>.api.test.ts`.
- Functions verb-first: `fetchX`, `resolveX`, `publishX`. Add a `// Used by:` JSDoc line.

## Test the URL Before You Migrate (Regression Guard)

Before changing a request, pin its current URL + payload in a `<name>.api.test.ts`, then
migrate underneath a green test. Model on `entities/content/api/content.api.test.ts`.

```typescript
import { describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});
afterEach(() => restoreFetch());

it('should POST to the delete endpoint with content paths', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-1' }));

    const result = await deleteContent([path('/a')]);

    expect(result.isOk()).toBe(true);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/content/content/delete');           // exact URL preserved
    expect(init).toMatchObject({ method: 'POST', body: JSON.stringify({ contentPaths: ['/a'] }) });
});
```

Assert on `.isOk()`/`.isErr()` + `_unsafeUnwrap()`/`_unsafeUnwrapErr()`. Use the shared
`stubFetch`/`restoreFetch`/`jsonResponse`/`errorResponse` from
`v6/shared/lib/test/fetch.test.utils.ts` (do not re-inline `vi.fn()`). For upload (XHR)
endpoints use `stubXhr`/`restoreXhr` from `v6/shared/lib/test/xhr.test.utils.ts`.

Gotcha when stubbing project state in tests: the `entities/project` barrel exports
`$activeProject` as a **read-only computed view** — writing through it silently does not
stick (and only typecheck catches it, not vitest). Write via the atom in
`activeProject.store.ts`. Migrated api code needs no project stub at all — only
`setActiveProjectResolver(() => 'test-project')`.

### Verify with the full suite, not just typecheck + the new test

`pnpm check` (typecheck) will NOT catch a broken caller test: callers mock the api fn with
`vi.fn()`, which is `any`-typed, so `result.isErr()` type-checks even when the mock returns
a bare `Promise<T>` and blows up at runtime. **After every batch run
`pnpm -C ./modules/lib run test:run` (the whole suite) in addition to `pnpm check`.** Fix
broken caller tests by wrapping the mocked return in `ok(...)` / `okAsync(...)` (or
`err(...)`) from `neverthrow` so the awaited value is a real `Result` — assertions stay
unchanged.

## Migration Order

1. **Category B (raw fetch/XHR, ~13 modules)** first — URLs are already correct via
   `getCmsApiUrl`, so this is wrap-in-`requestJson` + type errors + add the URL test.
   Proves the boundary pattern and lands the test util.
2. **Category A (`ResourceRequest`, ~37 modules)** — reproduce the class-hierarchy URL,
   write the URL-pinning test first, then port.

## Known Debt (do not copy)

Two transitional modules still use `if (result.isErr()) throw result.error` because
their consumers are legacy exception-based pipelines that expect rejected promises:

- `entities/content/api/content-fetcher.ts` (content tree loader; its Promise-based
  contract is load-bearing for the tree/grid consumers)
- `features/shared/hooks/useContentComboboxData.ts`

Unwind them when their callers migrate to the Result contract. Everywhere else the
ban above stands — do not copy this idiom into new code.

## Note: the `/enonic:migrate-v6-api` skill is stale

Its templates predate the Result client (raw `fetch` + `console.error`) and its paths
predate FSD. Use it only for its Phase-0 dependency-audit and the request taxonomy
(Simple / Cached / Task-based / Batch). Ignore its implementation templates — this rule
supersedes them.
