import PageDescriptor = api.content.page.PageDescriptor;

export class PageDescriptorViewer
    extends api.ui.NamesAndIconViewer<PageDescriptor> {

    constructor() {
        super();
    }

    resolveDisplayName(object: PageDescriptor): string {
        return object.getDisplayName();
    }

    resolveSubName(object: PageDescriptor): string {
        return object.getKey().toString();
    }

    resolveIconClass(): string {
        return api.StyleHelper.getCommonIconCls('file') + ' icon-large';
    }
}
