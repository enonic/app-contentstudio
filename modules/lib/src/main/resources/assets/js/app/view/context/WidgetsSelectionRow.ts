import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {WidgetView} from './WidgetView';
import {ContextView} from './ContextView';
import {Dropdown} from '@enonic/lib-admin-ui/ui/selector/dropdown/Dropdown';
import {OptionSelectedEvent} from '@enonic/lib-admin-ui/ui/selector/OptionSelectedEvent';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';

export class WidgetsSelectionRow
    extends DivEl {

    private contextView: ContextView;

    private widgetSelectorDropdown: WidgetSelectorDropdown;

    constructor(contextView: ContextView) {
        super('widgets-selection-row');

        this.contextView = contextView;

        this.widgetSelectorDropdown = new WidgetSelectorDropdown(this.contextView);
        this.widgetSelectorDropdown.addClass('widget-selector');

        this.widgetSelectorDropdown.onOptionSelected((event: OptionSelectedEvent<WidgetViewOption>) => {
            let widgetView = event.getOption().getDisplayValue().getWidgetView();
            widgetView.setActive();
        });

        this.appendChild(this.widgetSelectorDropdown);
    }

    updateState(widgetView: WidgetView) {
        if (this.widgetSelectorDropdown.getValue() !== widgetView.getWidgetName()) {
            this.widgetSelectorDropdown.setValue(widgetView.getWidgetName());
        }

        if (this.widgetSelectorDropdown.getSelectedOption()) {
            this.widgetSelectorDropdown.getSelectedOptionView().getEl().setDisplay('inline-block');
        }
    }

    updateWidgetsDropdown(widgetViews: WidgetView[], selectedView?: WidgetView) {
        const previousSelection = this.widgetSelectorDropdown.getSelectedOption();
        const previousSelectionView = previousSelection ? previousSelection.getDisplayValue().getWidgetView() : null;
        this.widgetSelectorDropdown.removeAllOptions();

        widgetViews.forEach((view: WidgetView) => {

            const option = Option.create<WidgetViewOption>()
                .setValue(view.getWidgetName())
                .setDisplayValue(new WidgetViewOption(view))
                .build();

            this.widgetSelectorDropdown.addOption(option);
        });

        if (this.widgetSelectorDropdown.getOptionCount() < 2) {
            this.widgetSelectorDropdown.addClass('single-optioned');
        }

        const visibleNow: boolean = this.isVisible();

        if (visibleNow) {
            this.setVisible(false);
        }

        this.widgetSelectorDropdown.deselectOptions(true);
        this.selectOptionByWidgetView(selectedView || previousSelectionView, true);

        if (visibleNow) {
            this.setVisible(true);
        }
    }

    private selectOptionByWidgetView(view: WidgetView, silent?: boolean) {
        const views = this.widgetSelectorDropdown.getOptions().map(option => option.getDisplayValue().getWidgetView());
        let i = 0;
        if (view) {
            for (; i < views.length; i++) {
                if (views[i].compareByType(view)) {
                    break;
                }
            }
        }
        const index = i < views.length ? i : 0;
        this.widgetSelectorDropdown.selectRow(index, silent);
    }
}

export class WidgetSelectorDropdown extends Dropdown<WidgetViewOption> {

    constructor(contextView: ContextView) {
        super('widgetSelector', {
            skipExpandOnClick: true,
            inputPlaceholderText: '',
            listMaxHeight: 250,
            optionDisplayValueViewer: new WidgetViewer(),
            rowHeight: 50
        });

        this.onClicked((event) => {
            if (WidgetSelectorDropdown.isDefaultOptionDisplayValueViewer(event.target)) {
                if (this.isDropdownShown()) {
                    if (this.getSelectedOption()) {
                        let widgetView = this.getSelectedOption().getDisplayValue().getWidgetView();
                        if (widgetView !== contextView.getActiveWidget()) {
                            widgetView.setActive();
                        }
                        this.hideDropdown();
                    }
                }
            }
        });

        this.onOptionSelected(() => {
            this.clearInput();
        });

        this.onExpanded(() => {
            this.navigateToSelectedOption();
        });

        AppHelper.focusInOut(this, () => {
            this.hideDropdown();
        });

        ResponsiveManager.onAvailableSizeChanged(this, () => this.refresh.bind(this));
    }

    private static isDefaultOptionDisplayValueViewer(object: object) {
        if (object && object instanceof HTMLElement) {
            const elem = object;
            return elem.parentElement.className.indexOf('option-value') > -1
                   && elem.id.indexOf('DropdownHandle') === -1;
        }
        return false;
    }
}

export class WidgetViewOption {

    private widgetView: WidgetView;

    constructor(widgetView: WidgetView) {
        this.widgetView = widgetView;
    }

    getWidgetView(): WidgetView {
        return this.widgetView;
    }

    toString(): string {
        return this.widgetView.getWidgetName();
    }

}

export class WidgetViewer extends NamesAndIconViewer<WidgetViewOption> {

    constructor() {
        super('widget-viewer', NamesAndIconViewSize.compact);
    }

    doLayout(object: WidgetViewOption) {
        super.doLayout(object);

        const view = this.getNamesAndIconView();
        if (object && object.getWidgetView() && view) {
            const widgetClass = object.getWidgetView().isInternal() ? 'internal-widget' : 'external-widget';
            view.removeClass('external-widget internal-widget');
            view.addClass(widgetClass);
        }
    }

    resolveDisplayName(object: WidgetViewOption): string {
        return object.getWidgetView().getWidgetName();
    }

    resolveSubName(object: WidgetViewOption): string {
        return object.getWidgetView().getWidgetDescription();
    }

    resolveIconUrl(object: WidgetViewOption): string {
        return object.getWidgetView().getWidgetIconUrl();
    }

    resolveIconClass(object: WidgetViewOption): string {
        return object.getWidgetView().getWidgetIconClass();
    }

}
