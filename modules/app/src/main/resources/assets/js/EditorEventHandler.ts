import type {ComponentPath, ComponentRecord, PageEditorInstance} from '@enonic/page-editor';
import {ComponentPath as LibComponentPath} from '@enonic/lib-contentstudio/app/page/region/ComponentPath';
import {HTMLAreaHelper} from '@enonic/lib-contentstudio/app/inputtype/ui/text/HTMLAreaHelper';
import {RenderingMode} from '@enonic/lib-contentstudio/app/rendering/RenderingMode';
import {UriHelper} from '@enonic/lib-contentstudio/app/rendering/UriHelper';
import DOMPurify from 'dompurify';

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

        const url = UriHelper.getComponentUri(
            config.contentId,
            LibComponentPath.fromString(path.toString()),
            RenderingMode.EDIT,
        );

        try {
            const response = await fetch(url);

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
