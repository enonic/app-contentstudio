import {ComponentView, ComponentViewBuilder} from './ComponentView';
import {PageState} from '../app/wizard/page/PageState';
import {DescriptorBasedComponent} from '../app/page/region/DescriptorBasedComponent';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {DescriptorBasedComponentViewPlaceholder} from './DescriptorBasedComponentViewPlaceholder';

export abstract class DescriptorBasedComponentView
    extends ComponentView {

    private static HAS_DESCRIPTOR_CLASS = 'has-descriptor';

    declare protected placeholder: DescriptorBasedComponentViewPlaceholder;

    protected emptyDescriptorBlock?: DivEl;

    protected constructor(builder: ComponentViewBuilder) {
        super(builder);

        this.placeholder.setComponentView(this);
    }

    refreshEmptyState(): this {
        super.refreshEmptyState();

        const component = this.getComponent();
        const hasDescriptor = !!component?.hasDescriptor();
        this.toggleClass(DescriptorBasedComponentView.HAS_DESCRIPTOR_CLASS, hasDescriptor);

        if (this.isEmpty() && hasDescriptor) {
            this.showEmptyDescriptorBlock(component);
        } else {
            this.hideEmptyDescriptorBlock();
        }

        return this;
    }

    protected getComponent(): DescriptorBasedComponent {
        const component = PageState.getComponentByPath(this.getPath());

        if (!component || !(component instanceof DescriptorBasedComponent)) {
            return null;
        }

        return component;
    }

    hasDescriptor(): boolean {
        return this.hasClass(DescriptorBasedComponentView.HAS_DESCRIPTOR_CLASS);
    }

    protected showEmptyDescriptorBlock(component: DescriptorBasedComponent): void {
        if (!this.emptyDescriptorBlock) {
            this.emptyDescriptorBlock = new DivEl('empty-descriptor-block');
            this.emptyDescriptorBlock.setHtml(this.makeEmptyDescriptorText(component));
            this.placeholder.appendChild(this.emptyDescriptorBlock);
        }

        this.emptyDescriptorBlock.show();
    }

    protected abstract makeEmptyDescriptorText(component: DescriptorBasedComponent): string;

    protected hideEmptyDescriptorBlock(): void {
        this.emptyDescriptorBlock?.hide();
    }
}
