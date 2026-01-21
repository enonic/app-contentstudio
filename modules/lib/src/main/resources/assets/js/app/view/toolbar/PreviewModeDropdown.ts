import {Extension, ExtensionBuilder} from '@enonic/lib-admin-ui/extension/Extension';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import type Q from 'q';
import {GetExtensionsByInterfaceRequest} from '../../resource/GetExtensionsByInterfaceRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AriaHasPopup, AriaRole} from '@enonic/lib-admin-ui/ui/WCAG';
import {ViewExtensionEvent} from '../../event/ViewExtensionEvent';

export class PreviewModeDropdown
    extends FilterableListBoxWrapper<PreviewModeOption> {

    public static PREVIEW_AUTO = 'preview-automatic';

    private readonly selectedOption: PreviewModeOptionViewer;

    constructor() {
        super(new PreviewModeListBox(), {
            className: 'preview-mode-dropdown preview-toolbar-dropdown',
            maxSelected: 1
        });

        this.setTitle(i18n('tooltip.widget.liveview'));

        this.fetchLiveViewExtensions().then((extensions: Extension[]) => {
            this.setExtensions(extensions);
        });

        this.selectedOption = new PreviewModeOptionViewer();
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

    private setExtensions(extensions: Extension[]) {
        if (extensions.length === 0) {
            return;
        }
        const sortedOptions = extensions
            .sort((a, b) => {
                const orderA = a.getConfig().getProperty('order');
                const orderB = b.getConfig().getProperty('order');
                return (parseInt(orderA) ?? 999) - (parseInt(orderB) ?? 999);
            }).map(extension => new PreviewModeOptionBuilder(extension).build());

        this.getList().setItems(sortedOptions);
        this.doSelect(this.getList().getItems()[0]);
    }

    private async fetchLiveViewExtensions(): Promise<Extension[]> {
        return new GetExtensionsByInterfaceRequest('contentstudio.liveview').sendAndParse()
            .catch((e) => {
                DefaultErrorHandler.handle(e);
                return [];
            });
    }

    getSelectedMode(): Extension {
        return this.selectedOption?.getObject();
    }

    getAutoModeExtensions(): Extension[] {
        return this.getList().getItems()
            .filter((item) => item.getDescriptorKey().getName() !== PreviewModeDropdown.PREVIEW_AUTO
                              && item.getConfig().getProperty('auto') === 'true');
    }

    protected handleUserToggleAction(item: PreviewModeOption): void {
        if (this.isItemSelected(item)) {
            return;
        }

        super.handleUserToggleAction(item);
    }

    protected doSelect(item: PreviewModeOption) {
        this.selectedOption.setObject(item);
        this.selectedOption.show();
        new ViewExtensionEvent(item).fire();
        super.doSelect(item);
    }

    protected doDeselect(item: PreviewModeOption) {
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


class PreviewModeListBox
    extends ListBox<PreviewModeOption> {

    constructor() {
        super('extension-list-box');
    }

    protected createItemView(item: PreviewModeOption, readOnly: boolean): Element {
        const viewer = new PreviewModeOptionViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: PreviewModeOption): string {
        return item.getDescriptorKey().toString();
    }
}


export class PreviewModeOption
    extends Extension {

    private iconClass: string;

    private internal: boolean;

    constructor(builder: PreviewModeOptionBuilder) {
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

export class PreviewModeOptionBuilder
    extends ExtensionBuilder {

    private iconClass: string;

    private internal: boolean;

    constructor(extension?: Extension) {
        super(extension);
    }

    isInternal(): boolean {
        return this.internal;
    }

    setInternal(internal: boolean): PreviewModeOptionBuilder {
        this.internal = internal;
        return this;
    }

    getIconClass(): string {
        return this.iconClass
    }

    setIconClass(iconClass: string): PreviewModeOptionBuilder {
        this.iconClass = iconClass
        return this;
    }

    build(): PreviewModeOption {
        return new PreviewModeOption(this);
    }
}

export class PreviewModeOptionViewer
    extends NamesAndIconViewer<PreviewModeOption> {

    constructor() {
        super('extension-viewer', NamesAndIconViewSize.compact);
    }

    doLayout(object: PreviewModeOption) {
        super.doLayout(object);

        const view = this.getNamesAndIconView();
        if (object && view) {
            const extensionClass = object.isInternal() ? 'internal-extension' : 'external-extension';
            view.removeClass('external-extension internal-extension');
            view.addClass(extensionClass);
            view.getEl().setAttribute('role', 'button');
        }
    }

    resolveDisplayName(object: PreviewModeOption): string {
        return object.getDisplayName();
    }

    resolveSubName(object: PreviewModeOption): string {
        return object.getDescription();
    }

    resolveIconUrl(object: PreviewModeOption): string {
        return object.getFullIconUrl();
    }

    resolveIconClass(object: PreviewModeOption): string {
        return object.getIconClass();
    }

}
