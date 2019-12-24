import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';
import {ModalDialog, ModalDialogConfig} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {SettingsItem} from '../data/SettingsItem';
import {ProjectItem, ProjectItemBuilder} from '../data/ProjectItem';
import {SettingsItemViewer} from '../data/viewer/SettingsItemViewer';
import {NewProjectEvent} from '../event/NewProjectEvent';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';

export class NewSettingsItemDialog
    extends ModalDialog {

    private itemsList: SettingsItemsTypesListBox;

    constructor() {
        super(<ModalDialogConfig>{
            title: i18n('settings.dialog.new'),
            class: 'new-settings-item-dialog'
        });
    }

    protected initElements() {
        super.initElements();

        this.itemsList = new SettingsItemsTypesListBox();
    }

    protected initListeners() {
        super.initListeners();

        this.itemsList.onItemClicked((item: SettingsItem) => {
            this.close();
            if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectItem)) {
                new NewProjectEvent().fire();
            }
        });
    }

    protected postInitElements() {
        super.postInitElements();

        const projectItemType: SettingsItem =
            new ProjectItemBuilder().setName('').setDisplayName(i18n('settings.items.type.project')).build();
        this.itemsList.addItem(projectItemType);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildToContentPanel(this.itemsList);
            this.addCancelButtonToBottom(null, true);

            return rendered;
        });
    }

    open() {
        Body.get().appendChild(this);
        super.open();
    }

    close() {
        super.close();
        this.remove();
    }
}

class SettingsItemsTypesListBox
    extends ListBox<SettingsItem> {

    private itemClickedListeners: { (item: SettingsItem): void }[] = [];

    createItemView(item: SettingsItem): SettingsItemViewer {
        const itemView: SettingsItemViewer = new SettingsItemViewer();
        itemView.onClicked(() => {
            this.notifyItemClicked(item);
        });
        itemView.setObject(item);

        return itemView;
    }

    getItemId(item: SettingsItem): string {
        return item.getId();
    }

    onItemClicked(listener: (item: SettingsItem) => void) {
        this.itemClickedListeners.push(listener);
    }

    unItemClicked(listener: (item: SettingsItem) => void) {
        this.itemClickedListeners = this.itemClickedListeners.filter((currentListener: (item: SettingsItem) => void) => {
            return listener !== currentListener;
        });
    }

    private notifyItemClicked(item: SettingsItem) {
        this.itemClickedListeners.forEach((listener: (item: SettingsItem) => void) => {
            listener(item);
        });
    }

}
