import PageDescriptor = api.content.page.PageDescriptor;
import i18n = api.util.i18n;

export class PageDescriptorViewer
    extends api.ui.NamesAndIconViewer<PageDescriptor> {

    constructor() {
        super();
    }

    resolveDisplayName(object: PageDescriptor): string {
        return object.getDisplayName();
    }

    resolveSubName(object: PageDescriptor): string {
        return object.getDescription() || '<' + i18n('live.view.nodescription') + '>';
    }

    resolveIconClass(): string {
        return api.StyleHelper.getCommonIconCls('file') + ' icon-large';
    }
}
