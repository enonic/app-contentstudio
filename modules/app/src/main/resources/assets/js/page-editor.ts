import {HTMLAreaHelper} from '@enonic/lib-contentstudio/app/inputtype/ui/text/HTMLAreaHelper';
import {ComponentPath} from '@enonic/lib-contentstudio/app/page/region/ComponentPath';
import {DescriptorBasedComponent} from '@enonic/lib-contentstudio/app/page/region/DescriptorBasedComponent';
import {FragmentComponent} from '@enonic/lib-contentstudio/app/page/region/FragmentComponent';
import {RenderingMode} from '@enonic/lib-contentstudio/app/rendering/RenderingMode';
import {UriHelper} from '@enonic/lib-contentstudio/app/rendering/UriHelper';
import {PageHelper} from '@enonic/lib-contentstudio/app/util/PageHelper';
import {PageState} from '@enonic/lib-contentstudio/app/wizard/page/PageState';
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

        if (!isExisting && needsPageReload(path, response.headers)) {
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

function needsPageReload(path: EditorComponentPath, headers: Headers): boolean {
    if (!headers.has('X-Has-Contributions')) return false;

    const component = PageState.getComponentByPath(toComponentPath(path));
    if (!(component instanceof DescriptorBasedComponent)) return false;

    const key = component.getDescriptorKey();
    return !PageHelper.flattenPageComponents(PageState.getState())
        .some(c => !c.getPath().equals(path)
            && c instanceof DescriptorBasedComponent
            && c.getDescriptorKey()?.equals(key));
}

function sanitizeComponentHtml(html: string, path: EditorComponentPath): string {
    if (!(PageState.getComponentByPath(toComponentPath(path)) instanceof FragmentComponent)) {
        return html;
    }
    return DOMPurify.sanitize(html, {ALLOWED_URI_REGEXP: HTMLAreaHelper.getAllowedUriRegexp()});
}

function toComponentPath(path: EditorComponentPath): ComponentPath {
    return ComponentPath.fromString(path.toString());
}
