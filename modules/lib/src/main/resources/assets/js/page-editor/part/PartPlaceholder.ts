import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {PartComponentView} from './PartComponentView';
import {H2El} from '@enonic/lib-admin-ui/dom/H2El';
import {H3El} from '@enonic/lib-admin-ui/dom/H3El';
import {ComponentViewPlaceholder} from '../ComponentViewPlaceholder';
import {PartComponent} from '../../app/page/region/PartComponent';
import {ComponentType} from '../../app/page/region/ComponentType';
import {PartComponentType} from '../../app/page/region/PartComponentType';

export class PartPlaceholder
    extends ComponentViewPlaceholder<PartComponent> {

    private readonly displayName: H2El;

    constructor(partView: PartComponentView) {
        super(partView);
        this.addClassEx('part-placeholder').addClass(StyleHelper.getCommonIconCls('part'));

        this.displayName = new H3El('display-name');
        this.appendChild(this.displayName);
        this.setDisplayName(this.getType().getShortName());
    }

    setDisplayName(name: string) {
        this.displayName.setHtml(name);
    }

    getType(): ComponentType {
        return PartComponentType.get();
    }
}
