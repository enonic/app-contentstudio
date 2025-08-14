import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorItemViewer} from './CustomSelectorItemViewer';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {
    FilterableListBoxWrapperWithSelectedView,
    ListBoxInputOptions
} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {CustomSelectorLoader} from './CustomSelectorLoader';
import {CustomSelectorListBox} from './CustomSelectorListBox';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {CustomSelectorMode} from './CustomSelectorMode';
import {CustomSelectorGallerySelectedOptionsView} from './CustomSelectorGallerySelectedOptionsView';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';

interface CustomSelectorComboBoxOptions extends ListBoxInputOptions<CustomSelectorItem> {
    loader: CustomSelectorLoader;
}

export interface CustomSelectorBuilderOptions {
    maxSelected: number;
    mode: CustomSelectorMode;
    readonly: boolean;
}

export class CustomSelectorComboBox
    extends FilterableListBoxWrapperWithSelectedView<CustomSelectorItem> {

    declare protected options: CustomSelectorComboBoxOptions;

    constructor(options: CustomSelectorBuilderOptions) {
        const loader = new CustomSelectorLoader();
        const listBox = new CustomSelectorListBox(loader, options.mode);
        const className = `custom-selector-combobox${options.mode === CustomSelectorMode.GALLERY ? ' gallery-mode' : ''}`;
        const config = {
            readonly: options.readonly,
            editable: false
        };
        const selectedOptionsView = options.mode === CustomSelectorMode.GALLERY ? new CustomSelectorGallerySelectedOptionsView(config) : new CustomSelectorSelectedOptionsView();
        selectedOptionsView.setReadonly(options.readonly);

        super(listBox, {
            selectedOptionsView,
            className,
            loader,
            maxSelected: options.maxSelected,
        } as CustomSelectorComboBoxOptions);
    }

    protected initListeners(): void {
        super.initListeners();

        if (ObjectHelper.iFrameSafeInstanceOf(this.selectedOptionsView, CustomSelectorGallerySelectedOptionsView)) {
            (this.selectedOptionsView as CustomSelectorGallerySelectedOptionsView).onOptionDeselected((event: SelectedOptionEvent<CustomSelectorItem>) => {
                const customSelectorItem = event.getSelectedOption().getOption().getDisplayValue();
                this.deselect(customSelectorItem);
            });
        }

        this.options.loader.onLoadedData((event: LoadedDataEvent<CustomSelectorItem>) => {
            const entries = event.getData();

            if (event.isPostLoad()) {
                this.listBox.addItems(entries.slice(this.listBox.getItemCount()));
            } else {
                this.listBox.setItems(entries);
            }
            return Q.resolve(null);
        });

        let searchValue = '';

        const debouncedSearch = AppHelper.debounce(() => {
            this.search(searchValue);
        }, 300);

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            searchValue = event.getNewValue();
            debouncedSearch();
        });
    }

    protected loadListOnShown(): void {
        // if not empty then search will be performed after finished typing
        if (StringHelper.isBlank(this.optionFilterInput.getValue())) {
            this.search(this.optionFilterInput.getValue());
        }
    }

    protected search(value?: string): void {
        this.options.loader.search(value).catch(DefaultErrorHandler.handle);
    }

    createSelectedOption(item: CustomSelectorItem): Option<CustomSelectorItem> {
        return Option.create<CustomSelectorItem>()
            .setValue(item.getId())
            .setDisplayValue(item)
            .build();
    }

    onOptionMoved(handler: (selectedOption: SelectedOption<CustomSelectorItem>, fromIndex: number) => void): void {
        this.selectedOptionsView.onOptionMoved(handler);
    }

    getLoader(): CustomSelectorLoader {
        return this.options.loader;
    }

    getSelectedOptionView(): CustomSelectorSelectedOptionsView | CustomSelectorGallerySelectedOptionsView {
        return this.selectedOptionsView;
    }

    setSelectedItems(selectedIds: string[]): void {
        this.deselectAll(true);

        if (selectedIds?.length > 0) {
            this.getLoader().sendPreLoadRequest(selectedIds).then((items: CustomSelectorItem[]) => {
                items.sort((a, b) => selectedIds.indexOf(a.getId().toString()) - selectedIds.indexOf(b.getId().toString()));
                const toSelect = items.filter((item) => selectedIds.indexOf(item.getId().toString()) >= 0);
                this.select(toSelect, true);
            }).catch(DefaultErrorHandler.handle);
        }
    }
}

export class CustomSelectorSelectedOptionsView
    extends BaseSelectedOptionsView<CustomSelectorItem> {

    createSelectedOption(option: Option<CustomSelectorItem>): SelectedOption<CustomSelectorItem> {
        return new SelectedOption<CustomSelectorItem>(new CustomSelectorSelectedOptionView(option, this.readonly), this.count());
    }

}

export class CustomSelectorSelectedOptionView
    extends RichSelectedOptionView<CustomSelectorItem> {

    constructor(option: Option<CustomSelectorItem>, readonly: boolean) {
        super(new RichSelectedOptionViewBuilder<CustomSelectorItem>()
            .setDraggable(!readonly)
            .setOption(option) as RichSelectedOptionViewBuilder<CustomSelectorItem>
        );
    }

    protected createView(_content: CustomSelectorItem): CustomSelectorItemViewer {
        let viewer = new CustomSelectorItemViewer();
        viewer.setObject(this.getOption().getDisplayValue());

        return viewer;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('custom-selector-selected-option-view');

            return rendered;
        });
    }
}
