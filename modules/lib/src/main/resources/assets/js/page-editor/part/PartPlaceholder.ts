import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {PartComponentView} from './PartComponentView';
import {ComponentViewPlaceholder} from '../ComponentViewPlaceholder';
import {PartComponent} from '../../app/page/region/PartComponent';
import {ComponentType} from '../../app/page/region/ComponentType';
import {PartComponentType} from '../../app/page/region/PartComponentType';

export class PartPlaceholder
    extends ComponentViewPlaceholder<PartComponent> {

    constructor(partView: PartComponentView) {
        super(partView);
        this.addClassEx('part-placeholder').addClass(StyleHelper.getCommonIconCls('part'));
    }


    getType(): ComponentType {
        return PartComponentType.get();
    }
}
