import {LayoutComponentView} from './LayoutComponentView';
import {LayoutComponent} from '../../app/page/region/LayoutComponent';
import {ComponentViewPlaceholder} from '../ComponentViewPlaceholder';
import {ComponentType} from '../../app/page/region/ComponentType';
import {LayoutComponentType} from '../../app/page/region/LayoutComponentType';

export class LayoutPlaceholder
    extends ComponentViewPlaceholder<LayoutComponent> {

    constructor(layoutView: LayoutComponentView) {
        super(layoutView);

        this.addClassEx('layout-placeholder icon-layout');
    }

    getType(): ComponentType {
        return LayoutComponentType.get();
    }
}
