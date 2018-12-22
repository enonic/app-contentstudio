import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import i18n = api.util.i18n;

export class LayoutDescriptorViewer
    extends api.ui.NamesAndIconViewer<LayoutDescriptor> {

    constructor() {
        super();
    }

    resolveDisplayName(object: LayoutDescriptor): string {
        return object.getDisplayName();
    }

    resolveSubName(object: LayoutDescriptor): string {
        return object.getDescription() || '<' + i18n('live.view.nodescription') + '>';
    }

    resolveIconClass(): string {
        return api.StyleHelper.getCommonIconCls('layout') + ' icon-large';
    }
}
