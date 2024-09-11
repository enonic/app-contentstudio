import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {WidgetView} from './WidgetView';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {FilterableListBoxWrapperWithSelectedView} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {SelectedOptionView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionView';

export class WidgetsSelectionRow
    extends DivEl {

    private widgetSelectorDropdown: WidgetSelectorDropdown;

    private selectionWrapper: WidgetFilterDropdown;

    constructor() {
        super('widgets-selection-row');

        this.initElements();
        this.initListeners();
    }

    private initElements(): void {
        this.widgetSelectorDropdown = new WidgetSelectorDropdown();
        this.widgetSelectorDropdown.addClass('widget-selector');

        this.selectionWrapper =
            new WidgetFilterDropdown(this.widgetSelectorDropdown);
    }

    private initListeners(): void {
        this.selectionWrapper.onSelectionChanged((selectionChange: SelectionChange<WidgetView>) => {
            selectionChange.selected?.[0]?.setActive();
            this.selectionWrapper.cleanInput();
            this.selectionWrapper.hideDropdown();
        });

        this.selectionWrapper.onDropdownVisibilityChanged((visible: boolean) => {
           this.toggleClass('dropdown-visible', visible);

            if (visible) {
               this.selectionWrapper.giveFocus();
           }
        });
    }

    updateState(widgetView: WidgetView): void {
        const currentlySelectedItem = this.selectionWrapper.getSelectedItems()[0];

        if (currentlySelectedItem?.getWidgetName() !== widgetView.getWidgetName()) {
            this.selectionWrapper.select(widgetView);
        }
    }

    updateWidgetsDropdown(widgetViews: WidgetView[], selectedView?: WidgetView): void {
        this.widgetSelectorDropdown.clearItems();
        this.widgetSelectorDropdown.setItems(widgetViews);

        if (selectedView) {
            this.selectionWrapper.select(selectedView);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.selectionWrapper);

            return rendered;
        });
    }
}

export class WidgetSelectorDropdown
    extends ListBox<WidgetView> {

    constructor() {
        super('widgetSelector');
    }

    protected createItemView(item: WidgetView, readOnly: boolean): Element {
        const viewer = new WidgetViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: WidgetView): string {
        return item.getWidgetName();
    }
}

export class WidgetViewer
    extends NamesAndIconViewer<WidgetView> {

    constructor() {
        super('widget-viewer', NamesAndIconViewSize.compact);
    }

    doLayout(object: WidgetView) {
        super.doLayout(object);

        const view = this.getNamesAndIconView();
        if (object && view) {
            const widgetClass = object.isInternal() ? 'internal-widget' : 'external-widget';
            view.removeClass('external-widget internal-widget');
            view.addClass(widgetClass);
        }
    }

    resolveDisplayName(object: WidgetView): string {
        return object.getWidgetName();
    }

    resolveSubName(object: WidgetView): string {
        return object.getWidgetDescription();
    }

    resolveIconUrl(object: WidgetView): string {
        return object.getWidgetIconUrl();
    }

    resolveIconClass(object: WidgetView): string {
        return object.getWidgetIconClass();
    }

}

export class WidgetFilterDropdown
    extends FilterableListBoxWrapperWithSelectedView<WidgetView> {

    constructor(listBox: ListBox<WidgetView>) {
        super(listBox, {
            className: 'widget-filter-dropdown',
            selectedOptionsView: new WidgetSelectedOptionsView(),
            maxSelected: 1,
            filter: (item: WidgetView, searchString: string): boolean => {
                return item.getWidgetName().toLowerCase().indexOf(searchString.toLowerCase()) > -1 ||
                       item.getWidgetDescription().toLowerCase().indexOf(searchString.toLowerCase()) > -1;
            }
        });
    }

    createSelectedOption(item: WidgetView): Option<WidgetView> {
        return Option.create<WidgetView>()
            .setValue(item.getWidgetName())
            .setDisplayValue(item)
            .build();
    }

    hideDropdown(): void {
        super.hideDropdown();
    }

}

export class WidgetSelectedOptionsView
    extends BaseSelectedOptionsView<WidgetView> {

    protected createSelectedOptionView(option: Option<WidgetView>): SelectedOptionView<WidgetView> {
        return new WidgetSelectedOptionView(option);
    }
}

export class WidgetSelectedOptionView
    extends WidgetViewer
    implements SelectedOptionView<WidgetView> {

    private option: Option<WidgetView>;

    constructor(option: Option<WidgetView>) {
        super();

        this.setOption(option);
    }

    setOption(option: Option<WidgetView>) {
        this.option = option;
        this.setObject(option.getDisplayValue());
    }

    getOption(): Option<WidgetView> {
        return this.option;
    }
}
