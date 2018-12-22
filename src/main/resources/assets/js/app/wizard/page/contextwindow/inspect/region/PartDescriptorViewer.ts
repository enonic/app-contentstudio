import PartDescriptor = api.content.page.region.PartDescriptor;
import i18n = api.util.i18n;

export class PartDescriptorViewer
    extends api.ui.NamesAndIconViewer<PartDescriptor> {

    constructor() {
        super();
    }

    resolveDisplayName(object: PartDescriptor): string {
        return object.getDisplayName();
    }

    resolveSubName(object: PartDescriptor): string {
        return object.getDescription() || '<' + i18n('live.view.nodescription') + '>';
    }

    resolveIconClass(): string {
        return api.StyleHelper.getCommonIconCls('part') + ' icon-large';
    }
}
