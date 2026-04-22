import {HTMLAreaHelper} from '@enonic/lib-contentstudio/app/inputtype/ui/text/HTMLAreaHelper';
import {ComponentPath} from '@enonic/lib-contentstudio/app/page/region/ComponentPath';
import {DescriptorBasedComponent} from '@enonic/lib-contentstudio/app/page/region/DescriptorBasedComponent';
import {RenderingMode} from '@enonic/lib-contentstudio/app/rendering/RenderingMode';
import {UriHelper} from '@enonic/lib-contentstudio/app/rendering/UriHelper';
import {PageHelper} from '@enonic/lib-contentstudio/app/util/PageHelper';
import {PageState} from '@enonic/lib-contentstudio/app/wizard/page/PageState';
import {PageEditor} from '@enonic/page-editor';
import DOMPurify from 'dompurify';

// page-editor bundles its own copy of ComponentPath into its .d.ts, so the class
// identity differs from the lib-contentstudio one even though they're the same runtime class.
function toLibComponentPath(view: {getPath: () => {toString: () => string}}): ComponentPath {
    return ComponentPath.fromString(view.getPath().toString());
}

PageEditor.initEditor({
    resolveUrl: ({view}) => {
        const content = PageEditor.getContent();
        return UriHelper.getComponentUri(content.getContentId().toString(), toLibComponentPath(view), RenderingMode.EDIT);
    },

    checkPageReloadRequired: ({view, headers}) => {
        if (!headers.has('X-Has-Contributions')) return false;

        const path = toLibComponentPath(view);
        const component = PageState.getComponentByPath(path);
        if (!(component instanceof DescriptorBasedComponent)) return false;

        const key = component.getDescriptorKey();
        return !PageHelper.flattenPageComponents(PageState.getState())
            .some(c => !c.getPath().equals(path)
                && c instanceof DescriptorBasedComponent
                && c.getDescriptorKey()?.equals(key));
    },

    sanitizeHtml: (html, type) => type === 'fragment'
        ? DOMPurify.sanitize(html, {ALLOWED_URI_REGEXP: HTMLAreaHelper.getAllowedUriRegexp()})
        : html,
});
