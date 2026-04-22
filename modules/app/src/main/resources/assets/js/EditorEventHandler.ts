import type {ComponentPath, ComponentRecord, PageEditorInstance} from '@enonic/page-editor';
import {HTMLAreaHelper} from '@enonic/lib-contentstudio/app/inputtype/ui/text/HTMLAreaHelper';
import DOMPurify from 'dompurify';

// ! The iframe runs in its own JS realm, so `ProjectContext` (a Store-backed singleton) is
// ! never initialized here — calling `UriHelper.getComponentUri` throws on `getProject()`.
// ! Derive the portal prefix directly from the iframe's own URL, which CS sets to
// ! `/admin/<appId>/site/<mode>/<project>/<branch>/<contentPath>` via ExtensionRenderingHandler.
const PORTAL_PREFIX_RE = /^(\/admin\/[^/]+\/site\/[^/]+\/[^/]+\/[^/]+)(?:\/|$)/;

function buildComponentUrl(contentId: string, componentPath: string): string | null {
    const match = PORTAL_PREFIX_RE.exec(window.location.pathname);
    if (match == null) return null;
    const relPath = componentPath.replace(/^\//, '');
    return `${match[1]}/${contentId}/_/component/${relPath}`;
}

export class EditorEventHandler {

    public async loadComponent(
        editor: PageEditorInstance,
        path: ComponentPath,
        existing: boolean,
    ): Promise<void> {
        const config = editor.getConfig();
        const record = editor.getRecord(path);
        const element = editor.getElement(path);
        if (config == null || record == null || element == null) return;

        const url = buildComponentUrl(config.contentId, path.toString());
        if (url == null) {
            console.warn(`loadComponent at [${path}] failed: cannot derive portal URL from ${window.location.pathname}`);
            editor.notifyComponentLoadFailed(path, 'portal URL unavailable');
            return;
        }

        try {
            const response = await fetch(url);

            // ! Must check response.ok before replacing the element: a 404 body is JSON,
            // ! not HTML. Replacing with the parsed fragment strips the component markup,
            // ! re-triggers reconcile, which re-stubs the path and re-fires the load — an
            // ! infinite request loop. On failure leave the element alone and flag error.
            if (!response.ok) {
                editor.notifyComponentLoadFailed(path, `HTTP ${response.status}`);
                return;
            }

            if (!existing && response.headers.has('X-Has-Contributions') && !this.hasSameDescriptorElsewhere(editor, record, path)) {
                editor.requestPageReload();
                return;
            }

            const html = await response.text();
            const node = record.type === 'fragment' ? this.wrapFragmentHtml(html) : this.parseHtml(html);
            element.replaceWith(node);
            editor.notifyComponentLoaded(path);
        } catch (reason) {
            console.warn(`loadComponent at [${path}] failed:`, reason);
            editor.notifyComponentLoadFailed(path, String(reason));
        }
    }

    private hasSameDescriptorElsewhere(
        editor: PageEditorInstance,
        record: ComponentRecord,
        path: ComponentPath,
    ): boolean {
        if (record.descriptor == null) return false;
        return editor.findRecordsByDescriptor(record.descriptor).some(r => r.path !== path);
    }

    private parseHtml(html: string): Node {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstElementChild ?? template.content;
    }

    private wrapFragmentHtml(html: string): HTMLElement {
        const sanitized = DOMPurify.sanitize(html, {ALLOWED_URI_REGEXP: HTMLAreaHelper.getAllowedUriRegexp()});
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-portal-component-type', 'fragment');
        const template = document.createElement('template');
        template.innerHTML = sanitized.trim();
        wrapper.append(template.content);
        return wrapper;
    }
}
