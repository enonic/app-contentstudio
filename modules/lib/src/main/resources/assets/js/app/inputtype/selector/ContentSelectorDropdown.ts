import {ListBoxInput} from '@enonic/lib-admin-ui/ui/selector/list/ListBoxInput';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ContentSummaryOptionDataHelper} from '../../util/ContentSummaryOptionDataHelper';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {ContentListBox} from './ContentListBox';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentId} from '../../content/ContentId';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentAndStatusTreeSelectorItem} from '../../item/ContentAndStatusTreeSelectorItem';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';

export interface ContentSelectorDropdownOptions {
    maxSelected: number;
    loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;
    selectedOptionsView: BaseSelectedOptionsView<ContentTreeSelectorItem>;
    getSelectedItems: () => string[];
    className?: string;
}

export class ContentSelectorDropdown extends ListBoxInput<ContentTreeSelectorItem> {

    private helper: ContentSummaryOptionDataHelper;

    private readonly loadMask: LoadMask;

    private readonly loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;

    private readonly getSelectedItemsHandler: () => string[];

    constructor(options: ContentSelectorDropdownOptions) {
        super(new ContentListBox(), {
            selectedOptionsView: options.selectedOptionsView,
            maxSelected: options.maxSelected,
            checkboxPosition: 'right',
            className: 'content-selector-dropdown ' + (options.className || ''),
        });

        this.loadMask = new LoadMask(this);
        this.loader = options.loader;
        this.helper = new ContentSummaryOptionDataHelper();
        this.getSelectedItemsHandler = options.getSelectedItems;
        this.selectedOptionsView.setOccurrencesSortable(true);
    }

    createOption(item: ContentTreeSelectorItem): Option<ContentTreeSelectorItem> {
        return Option.create<ContentTreeSelectorItem>()
            .setValue(this.helper.getDataId(item))
            .setDisplayValue(item)
            .setExpandable(this.helper.isExpandable(item))
            .setSelectable(this.helper.isSelectable(item))
            .build();
    }

    protected initListeners(): void {
        super.initListeners();

        this.listBox.whenShown(() => {
            this.search();
        });

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            this.search();
        });
    }

    private search(): void {
        this.loadMask.show();

        this.loader.search(this.optionFilterInput.getValue()).then((items: ContentTreeSelectorItem[]) => {
            this.listBox.setItems(items);
            this.selectLoadedListItems(items);
        }).catch(DefaultErrorHandler.handle).finally(() => this.loadMask.hide());
    }

    private preSelectItems(): void {
        const ids = this.getSelectedItemsHandler().filter(id => !StringHelper.isBlank(id)).map(id => new ContentId(id));

        if (ids.length > 0) {
            new ContentSummaryAndCompareStatusFetcher().fetchByIds(ids).then((contents) => {
                const items = contents.map((content) => this.createSelectorItem(content));
                const options = items.map((item) => this.createOption(item));
                this.selectedOptionsView.addOptions(options, true, -1);
            }).catch(DefaultErrorHandler.handle);
        }
    }

    private createSelectorItem(content: ContentSummary | ContentSummaryAndCompareStatus): ContentTreeSelectorItem {
        if (content instanceof  ContentSummaryAndCompareStatus) {
            return new ContentAndStatusTreeSelectorItem(content);
        }

        return new ContentTreeSelectorItem(content);
    }

    private selectLoadedListItems(items: ContentTreeSelectorItem[]): void {
        const selectedItems: string[] = this.getSelectedItemsHandler();

        items.forEach((item: ContentTreeSelectorItem) => {
            const id = item.getId();

            if (selectedItems.indexOf(id) >= 0) {
                this.select(item, true);
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.preSelectItems();

            return rendered;
        });
    }
}
