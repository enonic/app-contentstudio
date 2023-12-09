import * as Q from 'q';
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
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {FilterableListBoxWrapperWithSelectedView} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';

export interface ContentSelectorDropdownOptions {
    listBox: ContentListBox<ContentTreeSelectorItem>;
    maxSelected: number;
    loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;
    selectedOptionsView: BaseSelectedOptionsView<ContentTreeSelectorItem>;
    getSelectedItems: () => string[];
    className?: string;
}

export class ContentSelectorDropdown
    extends FilterableListBoxWrapperWithSelectedView<ContentTreeSelectorItem> {

    protected helper: ContentSummaryOptionDataHelper;

    protected readonly loadMask: LoadMask;

    protected readonly loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;

    protected readonly getSelectedItemsHandler: () => string[];

    constructor(options: ContentSelectorDropdownOptions) {
        super(options.listBox, {
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
        this.postInitListeners();
    }

    createSelectedOption(item: ContentTreeSelectorItem): Option<ContentTreeSelectorItem> {
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
            this.search(this.optionFilterInput.getValue());
        });

        this.listBox.onItemsAdded((items: ContentTreeSelectorItem[]) => {
            this.selectLoadedFlatListItems(items);
        });

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            this.search(event.getNewValue());
        });
    }

    protected postInitListeners(): void {
        this.loader.onLoadedData((event: LoadedDataEvent<ContentTreeSelectorItem>) => {
            if (event.isPostLoad()) {
                this.listBox.addItems(event.getData());
            } else {
                this.listBox.setItems(event.getData());
            }
            return Q.resolve(null);
        });
    }

    protected search(value?: string): void {
        this.loadMask.show();
        this.loader.search(value).catch(DefaultErrorHandler.handle).finally(() => this.loadMask.hide());
    }

    protected preSelectItems(): void {
        const ids = this.getSelectedItemsHandler().filter(id => !StringHelper.isBlank(id)).map(id => new ContentId(id));

        if (ids.length > 0) {
            new ContentSummaryAndCompareStatusFetcher().fetchByIds(ids).then((contents) => {
                const items = contents.map((content) => this.createSelectorItem(content));
                const options = items.map((item) => this.createSelectedOption(item));
                this.selectedOptionsView.addOptions(options, true, -1);
            }).catch(DefaultErrorHandler.handle);
        }
    }

    protected createSelectorItem(content: ContentSummary | ContentSummaryAndCompareStatus): ContentTreeSelectorItem {
        if (content instanceof ContentSummaryAndCompareStatus) {
            return new ContentAndStatusTreeSelectorItem(content);
        }

        return new ContentTreeSelectorItem(content);
    }

    protected selectLoadedFlatListItems(items: ContentTreeSelectorItem[]): void {
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

    updateSelectedItems(): void {
        // unselecting all items
        this.selectedOptionsView.getSelectedOptions().forEach((selectedOption) => {
            this.selectedOptionsView.removeOption(selectedOption.getOption(), true);
        });

        // selecting items from property array
        this.preSelectItems();
    }
}
