import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorItemViewer} from './CustomSelectorItemViewer';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {BaseGallerySelectedOptionView} from '../ui/selector/BaseGallerySelectedOptionView';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';

export class CustomSelectorGallerySelectedOptionView extends BaseGallerySelectedOptionView<CustomSelectorItem> {
    private icon: CustomSelectorItemViewer;

    constructor(option: Option<CustomSelectorItem>) {
        super(option);
    }

    protected createWrapper(): DivEl {
        return super.createWrapper()
            .appendChildren(this.label, this.check, this.icon);
    }

    protected initElements(): void {
        super.initElements();

        this.icon = new CustomSelectorItemViewer();
    }

    getIcon(): CustomSelectorItemViewer {
        return this.icon;
    }

    setOption(option: Option<CustomSelectorItem>) {
        super.setOption(option);

        const displayValue = option.getDisplayValue();
        this.icon.setObject(displayValue);
        this.label.setHtml(displayValue.getDisplayName());
        this.icon.setTitle(displayValue.getDescription() ?? '');
    }
}
