import {ComponentViewBuilder} from '../ComponentView';
import {PartItemType} from './PartItemType';
import {PartPlaceholder} from './PartPlaceholder';
import {DescriptorBasedComponentView} from '../DescriptorBasedComponentView';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DescriptorBasedComponent} from '../../app/page/region/DescriptorBasedComponent';

export class PartComponentViewBuilder
    extends ComponentViewBuilder {

    constructor() {
        super();
        this.setType(PartItemType.get());
    }
}

export class PartComponentView
    extends DescriptorBasedComponentView {

    constructor(builder: PartComponentViewBuilder) {
        super(builder.setInspectActionRequired(true).setPlaceholder(new PartPlaceholder()));

        this.resetHrefForRootLink(builder);
        this.disableLinks();
    }

    protected makeEmptyDescriptorText(component: DescriptorBasedComponent): string {
        const descriptorName = component.getName()?.toString() || component.getDescriptorKey().toString();
        return `${i18n('field.part')} "${descriptorName}"`;
    }

    private resetHrefForRootLink(builder: PartComponentViewBuilder) {
        if (builder.element && builder.element.getEl().hasAttribute('href')) {
            builder.element.getEl().setAttribute('href', '#');
        }
    }
}
