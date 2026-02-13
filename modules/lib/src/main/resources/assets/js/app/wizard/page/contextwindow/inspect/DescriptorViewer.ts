import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {type Descriptor} from '../../../../page/Descriptor';

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
}
