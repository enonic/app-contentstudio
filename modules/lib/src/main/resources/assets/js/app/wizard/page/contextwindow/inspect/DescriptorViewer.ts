import {i18n} from 'lib-admin-ui/util/Messages';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';

export class DescriptorViewer<T extends Descriptor>
    extends NamesAndIconViewer<T> {

    resolveDisplayName(object: T): string {
        return object.getDisplayName();
    }

    resolveSubName(object: T): string {
        return object.getDescription() || '<' + i18n('text.noDescription') + '>';
    }

    resolveIconClass(object: T): string {
        const iconCls = object.getIconCls();

        return (iconCls ? StyleHelper.getCommonIconCls(iconCls) + ' ' : '') + 'icon-large';
    }

    resolveIconUrl(_object: T): string {
        return _object.getIcon();
    }
}
