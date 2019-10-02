import Descriptor = api.content.page.Descriptor;
import i18n = api.util.i18n;

export class DescriptorViewer<T extends Descriptor>
    extends api.ui.NamesAndIconViewer<T> {

    resolveDisplayName(object: T): string {
        return object.getDisplayName();
    }

    resolveSubName(object: T): string {
        return object.getDescription() || '<' + i18n('text.noDescription') + '>';
    }

    resolveIconClass(object: T): string {
        const iconCls = object.getIconCls();

        return (iconCls ? api.StyleHelper.getCommonIconCls(iconCls) + ' ' : '') + 'icon-large';
    }

    resolveIconUrl(_object: T): string {
        return _object.getIcon();
    }
}
