import {ItemStatisticsPanel} from 'lib-admin-ui/app/view/ItemStatisticsPanel';
import {ViewItem} from 'lib-admin-ui/app/view/ViewItem';
import {Element} from 'lib-admin-ui/dom/Element';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {SettingsViewItem} from '../view/SettingsViewItem';

export class SettingsItemStatisticsPanel
    extends ItemStatisticsPanel<SettingsViewItem> {

    private descriptionBlock: DescriptionBlock;

    constructor() {
        super('settings-item-statistics-panel');

        this.descriptionBlock = new DescriptionBlock();
    }

    setItem(item: ViewItem<SettingsViewItem>) {
        item.setPath(item.getModel().getId());
        this.descriptionBlock.setText(item.getModel().getDescription());

        super.setItem(item);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.descriptionBlock);
            return rendered;
        });
    }

}

class DescriptionBlock
    extends DivEl {

    private textBlock: Element;

    constructor() {
        super('description');

        this.textBlock = new DivEl('text');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.textBlock);
            return rendered;
        });
    }

    setText(value: string) {
        this.textBlock.setHtml(value);
    }
}
