import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import type Q from 'q';
import {type ComponentsTreeItem} from './ComponentsTreeItem';
import {PageComponentsItemViewer} from './PageComponentsItemViewer';
import {PageComponentsMenuIcon} from './PageComponentsMenuIcon';

export class PageComponentsItemView
    extends DivEl {

    private item: ComponentsTreeItem;

    private viewer: PageComponentsItemViewer;

    private menuEl: DivEl;

    private iconEl: PageComponentsMenuIcon;

    constructor() {
        super('page-components-item-view');

        this.initElements();
        this.initListeners();
    }

    private initElements(): void {
        this.viewer = new PageComponentsItemViewer();
        this.menuEl = new DivEl('page-components-item-view-menu');
        this.iconEl = new PageComponentsMenuIcon();
    }

    private initListeners(): void {
        //
    }

    setItem(item: ComponentsTreeItem) {
        this.item = item;
        this.viewer.setObject(item);
    }

    onMenuIconClicked(handler: (event: MouseEvent) => void): void {
        this.iconEl.onClicked(handler);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.menuEl.appendChild(this.iconEl);
            this.appendChild(this.viewer);
            this.appendChild(this.menuEl);

            return rendered;
        });
    }
}
