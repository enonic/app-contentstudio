import {i18n} from 'lib-admin-ui/util/Messages';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {Descriptor} from '../../../../page/Descriptor';

export class DescriptorViewer
    extends NamesAndIconViewer<Descriptor> {

    resolveDisplayName(object: Descriptor): string {
        return object.getDisplayName();
    }

    resolveSubName(object: Descriptor): string {
        return object.getDescription() || '<' + i18n('text.noDescription') + '>';
    }

    resolveIconClass(object: Descriptor): string {
        const iconCls = object.getIconCls();

        return (iconCls ? StyleHelper.getCommonIconCls(iconCls) + ' ' : '') + 'icon-large';
    }

    resolveIconUrl(_object: Descriptor): string {
        return _object.getIcon();
    }

    getPreferredHeight(): number {
        return 50;
    }
}
