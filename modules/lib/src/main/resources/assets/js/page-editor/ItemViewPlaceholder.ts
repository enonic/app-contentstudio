import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';

export class ItemViewPlaceholder
    extends DivEl {

    static PAGE_EDITOR_PREFIX: string = 'xp-page-editor-';

    constructor() {
        super('item-placeholder', ItemViewPlaceholder.PAGE_EDITOR_PREFIX);
    }

    showRenderingError(url: string, errorMessage: string = i18n('live.view.component.render.error')) {

        this.removeChildren();
        this.addClass('rendering-error');

        let errorTitle = new PEl().setHtml(errorMessage);

        let urlAnchor = new AEl().setUrl(url, '_blank').setHtml(i18n('live.view.component.render.error.urltext'));

        this.appendChildren(errorTitle, urlAnchor);
    }

    select() {
        // must be implemented by children
    }

    deselect() {
        // must be implemented by children
    }

    focus(): void {
        //
    }
}
