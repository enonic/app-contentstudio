import {type SettingsViewItem} from '../../../view/SettingsViewItem';
import {type NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';

export abstract class SettingsStatisticsView<T extends SettingsViewItem> extends DivEl {

    private viewer: NamesAndIconViewer<T>;

    private descriptionBlock: DescriptionBlock;

    private item: T;

    constructor() {
        super();
        this.viewer = this.createViewer();
        this.descriptionBlock = new DescriptionBlock();
    }

    setItem(item: T) {
        this.item = item;

        this.viewer.setObject(item);
        this.descriptionBlock.setText(item.getDescription());
        this.descriptionBlock.setVisible(!!item.getDescription());
    }

    abstract createViewer(): NamesAndIconViewer<T>;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('settings-statistics-view');
            this.viewer.addClass('statistic-item-viewer');
            this.appendChild(this.viewer);
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
