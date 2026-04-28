import {HTMLAreaHelper} from '@enonic/lib-contentstudio/app/inputtype/ui/text/HTMLAreaHelper';
import {ComponentPath} from '@enonic/lib-contentstudio/app/page/region/ComponentPath';
import {RenderingMode} from '@enonic/lib-contentstudio/app/rendering/RenderingMode';
import {UriHelper} from '@enonic/lib-contentstudio/app/rendering/UriHelper';
import {ComponentPath as EditorComponentPath, EditorEvent, EditorEvents, PageEditor} from '@enonic/page-editor';
import DOMPurify from 'dompurify';

PageEditor.init(true);

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
    const contentId = PageEditor.getContent().getContentId().toString();
    return UriHelper.getComponentUri(contentId, toComponentPath(path), RenderingMode.EDIT);
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
    return DOMPurify.sanitize(html, {ALLOWED_URI_REGEXP: HTMLAreaHelper.getAllowedUriRegexp()});
}

function toComponentPath(path: EditorComponentPath): ComponentPath {
    return ComponentPath.fromString(path.toString());
}
