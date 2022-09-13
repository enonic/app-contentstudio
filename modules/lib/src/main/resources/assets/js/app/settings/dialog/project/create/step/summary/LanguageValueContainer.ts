import {SummaryValueContainer} from './SummaryValueContainer';
import {LocaleViewer} from '../../../../../../locale/LocaleViewer';
import {Flag} from '../../../../../../locale/Flag';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';

export class LanguageValueContainer
    extends SummaryValueContainer {

    itemContainer: LocaleViewer;

    constructor() {
        super('language-container');
    }

    updateValue(value: Locale): LanguageValueContainer {
        const flag: Flag = new Flag(value.getLanguage());
        if (this.itemContainer.getFirstChild() instanceof Flag) {
            this.itemContainer.getFirstChild().remove();
        }

        this.itemContainer.prependChild(flag);
        this.itemContainer.setObject(value);
        return this;
    }

    protected createItemContainer(): Element {
        return new LocaleViewer();
    }
}
