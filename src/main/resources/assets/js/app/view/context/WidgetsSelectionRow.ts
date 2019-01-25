import {WidgetView} from './WidgetView';
import {ContextView} from './ContextView';
import Dropdown = api.ui.selector.dropdown.Dropdown;
import OptionSelectedEvent = api.ui.selector.OptionSelectedEvent;
import NamesAndIconViewer = api.ui.NamesAndIconViewer;

export class WidgetsSelectionRow extends api.dom.DivEl {

    private contextView: ContextView;

    private widgetSelectorDropdown: WidgetSelectorDropdown;

    constructor(contextView: ContextView) {
        super('widgets-selection-row');

        this.contextView = contextView;

        this.widgetSelectorDropdown = new WidgetSelectorDropdown(this.contextView);
        this.widgetSelectorDropdown.addClass('widget-selector');

        this.widgetSelectorDropdown.onOptionSelected((event: OptionSelectedEvent<WidgetViewOption>) => {
            let widgetView = event.getOption().displayValue.getWidgetView();
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

    updateWidgetsDropdown(widgetViews: WidgetView[]) {
        this.widgetSelectorDropdown.removeAllOptions();

        widgetViews.forEach((view: WidgetView) => {

            const option = {
                value: view.getWidgetName(),
                displayValue: new WidgetViewOption(view)
            };

            this.widgetSelectorDropdown.addOption(option);
        });

        if (this.widgetSelectorDropdown.getOptionCount() < 2) {
            this.widgetSelectorDropdown.addClass('single-optioned');
        }

        const visibleNow = this.isVisible();

        if (visibleNow) {
            this.setVisible(false);
        }
        this.widgetSelectorDropdown.selectRow(0, true);
        if (visibleNow) {
            this.setVisible(true);
        }
    }
}

export class WidgetSelectorDropdown extends Dropdown<WidgetViewOption> {

    constructor(contextView: ContextView) {
        super('widgetSelector', {
            skipExpandOnClick: true,
            inputPlaceholderText: '',
            optionDisplayValueViewer: new WidgetViewer()
        });

        this.onClicked((event) => {
            if (WidgetSelectorDropdown.isDefaultOptionDisplayValueViewer(event.target)) {
                if (this.isDropdownShown()) {
                    if (this.getSelectedOption()) {
                        let widgetView = this.getSelectedOption().displayValue.getWidgetView();
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

        api.util.AppHelper.focusInOut(this, () => {
            this.hideDropdown();
        });
    }

    private static isDefaultOptionDisplayValueViewer(object: Object) {
        if (object && object instanceof HTMLElement) {
            const elem = <HTMLElement> object;
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
        super('widget-viewer');
    }

    doLayout(object: WidgetViewOption) {
        super.doLayout(object);

        const view = this.getNamesAndIconView();
        if (object && object.getWidgetView() && view) {
            const widgetClass = object.getWidgetView().getWidgetKey() != null ? 'external-widget' : 'internal-widget';
            view.removeClass('external-widget internal-widget');
            view.addClass(widgetClass);
        }
    }

    resolveDisplayName(object: WidgetViewOption): string {
        return object.getWidgetView().getWidgetName();
    }

    resolveSubName(object: WidgetViewOption): string {
        const name = object.getWidgetView().getWidgetName();
        const description = object.getWidgetView().getWidgetDescription() || 'No description';
        switch (name) {
        case 'Properties': return 'Properties of the content';
        case 'Version history': return 'History of the content\'s changes';
        case 'Dependencies': return 'Dependencies tree of the content';
        default:
            return description;
        }
    }

    resolveIconUrl(object: WidgetViewOption): string {
        return object.getWidgetView().getWidgetIconUrl();
    }

    resolveIconClass(object: WidgetViewOption): string {
        const name = object.getWidgetView().getWidgetName();
        switch (name) {
        case 'Properties': return 'icon-info';
        case 'Version history': return 'icon-history';
        case 'Dependencies': return 'icon-link';
        }
    }
}
