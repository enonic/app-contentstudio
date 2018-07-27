import LayoutDescriptor = api.content.page.region.LayoutDescriptor;

export class LayoutDescriptorViewer
    extends api.ui.NamesAndIconViewer<LayoutDescriptor> {

    constructor() {
        super();
    }

    resolveDisplayName(object: LayoutDescriptor): string {
        return object.getDisplayName();
    }

    resolveSubName(object: LayoutDescriptor): string {
        return object.getKey().toString();
    }

    resolveIconClass(): string {
        return api.StyleHelper.getCommonIconCls('layout') + ' icon-large';
    }
}
