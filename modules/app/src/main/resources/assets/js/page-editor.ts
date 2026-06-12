import {ALLOWED_URI_REGEXP} from '@enonic/lib-contentstudio/v6/features/utils/url/allowedUri';
import {ComponentPath as EditorComponentPath, EditorEvent, EditorEvents, PageEditor} from '@enonic/page-editor';
import DOMPurify from 'dompurify';

const scriptElement = document.currentScript as HTMLScriptElement | null;
const project = scriptElement?.dataset.project;

PageEditor.init({editMode: true});

PageEditor.on(
    EditorEvents.ComponentLoadRequest,
    (event: EditorEvent<{path: EditorComponentPath; isExisting: boolean}>) => {
        const data = event.getData();
        if (!data) return;
        void handleComponentLoad(data.path, data.isExisting);
    },
);

async function handleComponentLoad(path: EditorComponentPath, isExisting: boolean): Promise<void> {
    PageEditor.renderLoadingComponent(path);

    try {
        const response = await fetch(resolveComponentUrl(path));

        if (!isExisting && needsPageReload(response.headers)) {
            PageEditor.reloadPage();
            return;
        }

        const html = sanitizeComponentHtml(await response.text(), path);
        PageEditor.renderComponent(path, html);
    } catch (reason) {
        PageEditor.renderErrorComponent(path, reason instanceof Error ? reason : new Error(String(reason)));
    }
}

function resolveComponentUrl(path: EditorComponentPath): string {
    const content = PageEditor.getContent();
    if (content == null) throw new Error('Cannot reload component: content is not available');
    const contentId = content.id;
    const componentPath = path.toString().replace(/^\//, '');
    return `${getSitePathPrefix()}/${contentId}/_/component/${componentPath}`;
}

// ? Built here instead of via UriHelper because the active project store has
// ? a separate module instance inside this iframe bundle and is not populated.
function getSitePathPrefix(): string {
    if (!project) throw new Error('Cannot reload component: project is missing');

    const {pathname} = window.location;
    const siteIdx = pathname.indexOf('/site/');
    if (siteIdx < 0) throw new Error(`Cannot derive site path prefix from ${pathname}`);
    const adminSitePrefix = pathname.slice(0, siteIdx + '/site/'.length);
    return `${adminSitePrefix}edit/${project}/draft`;
}

// Duplicated layouts may contain parts with contributions
// That would require wait for components updated and loaded, or listed to
// duplicate events and check previous sibling that was duplicated
// Not implemented yet, but can be future improvement
function needsPageReload(headers: Headers): boolean {
    return headers.has('X-Has-Contributions');
}

function sanitizeComponentHtml(html: string, path: EditorComponentPath): string {
    if (PageEditor.getComponentAt(path)?.type !== 'fragment') {
        return html;
    }
    return DOMPurify.sanitize(html, {ALLOWED_URI_REGEXP});
}
