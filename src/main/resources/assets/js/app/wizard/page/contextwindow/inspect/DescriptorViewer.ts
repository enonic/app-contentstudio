import Descriptor = api.content.page.Descriptor;
import PageDescriptor = api.content.page.PageDescriptor;
import PartDescriptor = api.content.page.region.PartDescriptor;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import ObjectHelper = api.ObjectHelper;
import i18n = api.util.i18n;

export class DescriptorViewer<T extends Descriptor>
    extends api.ui.NamesAndIconViewer<T> {

    constructor() {
        super();
    }

    resolveDisplayName(object: T): string {
        return object.getDisplayName();
    }

    resolveSubName(object: T): string {
        return object.getDescription() || '<' + i18n('live.view.nodescription') + '>';
    }

    resolveIconClass(object: T): string {
        let iconCls = '';
        if (ObjectHelper.iFrameSafeInstanceOf(object, PageDescriptor)) {
            iconCls = 'file';
        }
        if (ObjectHelper.iFrameSafeInstanceOf(object, PartDescriptor)) {
            iconCls = 'part';
        }
        if (ObjectHelper.iFrameSafeInstanceOf(object, LayoutDescriptor)) {
            iconCls = 'layout';
        }

        const commonIconClass = iconCls ? api.StyleHelper.getCommonIconCls(iconCls) : '';

        return commonIconClass + ' icon-large';
    }
}
