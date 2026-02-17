import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {H3El} from '@enonic/lib-admin-ui/dom/H3El';
import {type StatisticsBlockColumn} from './StatisticsBlockColumn';
import {type SettingsViewItem} from '../../../view/SettingsViewItem';

export abstract class StatisticsBlock extends DivEl {

    protected header: H3El;

    protected cols: StatisticsBlockColumn[] = [];

    protected item: SettingsViewItem;

    constructor() {
        super();

        this.header = new H3El('stats-block-header');
        this.header.setHtml(this.getHeaderText());
        this.cols.push(...this.createColumns());
    }

    protected abstract getHeaderText(): string;

    setItem(item: SettingsViewItem) {
        this.item = item;
    }

    protected abstract createColumns(): StatisticsBlockColumn[];

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('stats-block');
            this.appendChild(this.header);
            const colsWrapper: DivEl = new DivEl('stats-columns');
            colsWrapper.appendChildren(...this.cols);
            this.appendChildren(colsWrapper);
            return rendered;
        });
    }
}
