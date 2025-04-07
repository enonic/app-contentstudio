import {NewContentDialogItemSelectedEvent} from './NewContentDialogItemSelectedEvent';
import {NewContentDialogListItem} from './NewContentDialogListItem';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {LiEl} from '@enonic/lib-admin-ui/dom/LiEl';
import {NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';

export class NewContentDialogList
    extends ListBox<NewContentDialogListItem> {

    private selectedListeners: ((event: NewContentDialogItemSelectedEvent) =>void)[] = [];

    constructor(className: string = 'content-types-list') {
        super(className);
    }

    onSelected(listener: (event: NewContentDialogItemSelectedEvent)=>void) {
        this.selectedListeners.push(listener);
    }

    unSelected(listener: (event: NewContentDialogItemSelectedEvent)=>void) {
        this.selectedListeners = this.selectedListeners.filter((currentListener: (event: NewContentDialogItemSelectedEvent) => void) => {
            return currentListener !== listener;
        });
    }

    protected notifySelected(listItem: NewContentDialogListItem) {
        this.selectedListeners.forEach((listener: (event: NewContentDialogItemSelectedEvent)=>void) => {
            listener.call(this, new NewContentDialogItemSelectedEvent(listItem));
        });
    }

    createItemView(item: NewContentDialogListItem): LiEl {
        const namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        namesAndIconView
            .setIconUrl(item.getIconUrl())
            .setMainName(item.getDisplayName())
            .setSubName(item.getDescription())
            .setDisplayIconLabel(item.isSite());

        const itemEl = new LiEl('content-types-list-item' + (item.isSite() ? ' site' : ''));
        itemEl.getEl().setTabIndex(0);
        itemEl.appendChild(namesAndIconView);
        itemEl.onClicked((event: MouseEvent) => this.notifySelected(item));
        itemEl.onKeyPressed((event: KeyboardEvent) => {
            if (event.keyCode === 13) {
                this.notifySelected(item);
            }
        });
        return itemEl;
    }

    getItemId(item: NewContentDialogListItem): string {
        return item.getName();
    }
}
