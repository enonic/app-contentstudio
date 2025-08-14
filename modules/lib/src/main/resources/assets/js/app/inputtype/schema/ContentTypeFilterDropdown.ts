import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeList} from './ContentTypeList';
import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentTypeSelectedOptionsView} from './ContentTypeComboBox';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {GetContentTypeByNameRequest} from '../../resource/GetContentTypeByNameRequest';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {FilterableListBoxWrapperWithSelectedView} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import Q from 'q';

export interface ContentTypeFilterDropdownOptions {
    maxSelected?: number;
    loader: BaseLoader<ContentTypeSummary>;
    getSelectedItems: () => string[];
}

export class ContentTypeFilterDropdown
    extends FilterableListBoxWrapperWithSelectedView<ContentTypeSummary> {

    private readonly loader: BaseLoader<ContentTypeSummary>;

    private readonly getSelectedItemsHandler: () => string[];

    constructor(options: ContentTypeFilterDropdownOptions) {
        super(new ContentTypeList(), {
            selectedOptionsView: new ContentTypeSelectedOptionsView(),
            maxSelected: options.maxSelected,
            filter: options.loader.filterFn.bind(options.loader),
        });

        this.loader = options.loader;
        this.getSelectedItemsHandler = options.getSelectedItems;
    }

    protected filterItem(item: ContentTypeSummary, searchString: string): void {
        this.loader.setSearchString(searchString);
        super.filterItem(item, searchString);
    }

    protected loadListOnShown(): void {
        this.loadMask.show();

        this.loader.load().then((contentTypes: ContentTypeSummary[]) => {
            this.listBox.setItems(contentTypes);

            this.selectLoadedListItems(contentTypes);

            if (this.listBox.isVisible() && this.optionFilterInput.getValue()) { // filtering loaded items with search string if present
                this.optionFilterInput.forceChangedEvent();
            }

        }).catch(DefaultErrorHandler.handle).finally(() => this.loadMask.hide());
    }

    private selectLoadedListItems(contentTypes: ContentTypeSummary[]): void {
        const selectedItems: string[] = this.getSelectedItemsHandler();

        contentTypes.forEach((contentType: ContentTypeSummary) => {
            const id = contentType.getId();

            if (selectedItems.indexOf(id) >= 0) {
                this.select(contentType, true);
            }
        });
    }

    private preSelectItems(): void {
        const ids = this.getSelectedItemsHandler().filter(id => !StringHelper.isBlank(id));

        if (ids.length > 0) {
            this.fetchItems(ids).then((contentTypes) => {
                if (contentTypes.length > 0) {
                    const options = contentTypes.map((item) => this.createSelectedOption(item));
                    this.selectedOptionsView.addOptions(options, true, -1);
                    this.checkSelectionLimitReached();
                }
            }).catch(DefaultErrorHandler.handle);
        }
    }

    private fetchItems(ids: string[]): Q.Promise<ContentTypeSummary[]> {
        const promises = ids.map((id) => new GetContentTypeByNameRequest(new ContentTypeName(id)).sendAndParse());
        return Q.all(promises);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.preSelectItems();

            return rendered;
        });
    }

    createSelectedOption(item: ContentTypeSummary): Option<ContentTypeSummary> {
        return Option.create<ContentTypeSummary>()
            .setValue(item.getId())
            .setDisplayValue(item)
            .build();
    }

    updateSelectedItems(): void {
        // unselecting all items
        this.selectedOptionsView.getSelectedOptions().forEach((selectedOption: SelectedOption<ContentTypeSummary>) => {
            this.selectedOptionsView.removeOption(selectedOption.getOption(), true);
        });

        // selecting items from property array
        this.preSelectItems();
    }
}
