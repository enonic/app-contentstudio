import {Widget, WidgetBuilder} from '@enonic/lib-admin-ui/content/Widget';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import Q from 'q';
import {GetWidgetsByInterfaceRequest} from '../../resource/GetWidgetsByInterfaceRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AriaHasPopup, AriaRole} from '@enonic/lib-admin-ui/ui/WCAG';


export class PreviewWidgetDropdown
    extends FilterableListBoxWrapper<PreviewWidgetOption> {

    public static WIDGET_AUTO_DESCRIPTOR = 'preview-automatic';

    private selectedOption: PreviewWidgetOptionViewer;

    constructor() {
        super(new WidgetSelectorListBox(), {
            className: 'preview-toolbar-dropdown',
            maxSelected: 1
        });

        this.setTitle(i18n('tooltip.widget.liveview'));

        this.fetchLiveViewWidgets().then((widgets: Widget[]) => {
            this.setWidgets(widgets);
        });

        this.selectedOption = new PreviewWidgetOptionViewer();
        this.selectedOption
            .addClass('selected-option')
            .applyWCAGAttributes({
                role: AriaRole.BUTTON,
                tabbable: true,
                ariaHasPopup: AriaHasPopup.LISTBOX,
                ariaLabel: i18n('tooltip.widget.liveview')
            });

        this.selectedOption.hide();

        this.selectedOption.onClicked(() => {
            this.handleDropdownHandleClicked();
        });
    }

    public getChildControls(): Element[] {
        return [this.dropdownHandle];
    }

    private setWidgets(widgets: Widget[]) {
        if (widgets.length === 0) {
            return;
        }
        const sortedOptions = widgets
            .sort((a, b) => {
                const orderA = a.getConfig().getProperty('order');
                const orderB = b.getConfig().getProperty('order');
                return (parseInt(orderA) ?? 999) - (parseInt(orderB) ?? 999);
            }).map(widget => new PreviewWidgetOptionBuilder(widget).build());

        this.getList().setItems(sortedOptions);
        this.doSelect(this.getList().getItems()[0]);
    }

    private async fetchLiveViewWidgets(): Promise<Widget[]> {
        return new GetWidgetsByInterfaceRequest('contentstudio.liveview').sendAndParse()
            .catch((e) => {
                DefaultErrorHandler.handle(e);
                return [];
            });
    }

    getSelectedWidget(): Widget {
        return this.selectedOption?.getObject();
    }

    getAutoModeWidgets(): Widget[] {
        return this.getList().getItems()
            .filter((item) => item.getWidgetDescriptorKey().getName() !== PreviewWidgetDropdown.WIDGET_AUTO_DESCRIPTOR
                              && item.getConfig().getProperty('auto') === 'true');
    }

    protected handleUserToggleAction(item: PreviewWidgetOption): void {
        if (this.isItemSelected(item)) {
            return;
        }

        super.handleUserToggleAction(item);
    }

    protected doSelect(item: PreviewWidgetOption) {
        this.selectedOption.setObject(item);
        this.selectedOption.show();
        super.doSelect(item);
    }

    protected doDeselect(item: PreviewWidgetOption) {
        this.selectedOption.hide();
        super.doDeselect(item);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {

            this.optionFilterInput.replaceWith(this.selectedOption);
            this.applyButton.remove();

            return rendered;
        });
    }
}


class WidgetSelectorListBox
    extends ListBox<PreviewWidgetOption> {

    constructor() {
        super('widget-list-box');
    }

    protected createItemView(item: PreviewWidgetOption, readOnly: boolean): Element {
        const viewer = new PreviewWidgetOptionViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: PreviewWidgetOption): string {
        return item.getWidgetDescriptorKey().toString();
    }
}


export class PreviewWidgetOption
    extends Widget {

    private iconClass: string;

    private internal: boolean;

    constructor(builder: PreviewWidgetOptionBuilder) {
        super(builder);

        this.iconClass = builder.getIconClass();
        this.internal = builder.isInternal();
    }

    getIconClass(): string {
        return this.iconClass;
    }

    isInternal(): boolean {
        return this.internal;
    }
}

export class PreviewWidgetOptionBuilder
    extends WidgetBuilder {

    private iconClass: string;

    private internal: boolean;

    constructor(widget?: Widget) {
        super(widget);
    }

    isInternal(): boolean {
        return this.internal;
    }

    setInternal(internal: boolean): PreviewWidgetOptionBuilder {
        this.internal = internal;
        return this;
    }

    getIconClass(): string {
        return this.iconClass
    }

    setIconClass(iconClass: string): PreviewWidgetOptionBuilder {
        this.iconClass = iconClass
        return this;
    }

    build(): PreviewWidgetOption {
        return new PreviewWidgetOption(this);
    }
}

export class PreviewWidgetOptionViewer
    extends NamesAndIconViewer<PreviewWidgetOption> {

    constructor() {
        super('widget-viewer', NamesAndIconViewSize.compact);
    }

    doLayout(object: PreviewWidgetOption) {
        super.doLayout(object);

        const view = this.getNamesAndIconView();
        if (object && view) {
            const widgetClass = object.isInternal() ? 'internal-widget' : 'external-widget';
            view.removeClass('external-widget internal-widget');
            view.addClass(widgetClass);
            view.getEl().setAttribute('role', 'button');
        }
    }

    resolveDisplayName(object: PreviewWidgetOption): string {
        return object.getDisplayName();
    }

    resolveSubName(object: PreviewWidgetOption): string {
        return object.getDescription();
    }

    resolveIconUrl(object: PreviewWidgetOption): string {
        return object.getFullIconUrl();
    }

    resolveIconClass(object: PreviewWidgetOption): string {
        return object.getIconClass();
    }

}
