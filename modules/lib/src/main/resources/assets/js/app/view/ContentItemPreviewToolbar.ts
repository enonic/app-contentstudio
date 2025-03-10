import * as Q from 'q';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {PreviewWidgetDropdown} from './toolbar/PreviewWidgetDropdown';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {PreviewActionHelper} from '../action/PreviewActionHelper';
import {EmulatorDropdown} from './toolbar/EmulatorDropdown';
import {AriaRole} from '@enonic/lib-admin-ui/ui/WCAG';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';

export class ContentItemPreviewToolbar
    extends ContentStatusToolbar {

    private widgetSelector: PreviewWidgetDropdown;
    private emulatorSelector: EmulatorDropdown;
    private previewButton: ActionButton;
    private previewHelper: PreviewActionHelper;

    constructor(previewHelper: PreviewActionHelper) {
        super({className: 'content-item-preview-toolbar'});
        this.previewHelper = previewHelper;
    }

    protected initElements(): void {
        super.initElements();

        this.widgetSelector = new PreviewWidgetDropdown();
        this.emulatorSelector = new EmulatorDropdown();

        this.previewButton = new ActionButton(new WidgetPreviewAction(this));
        this.previewButton.addClass('icon-newtab');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {

            this.addContainer(this.emulatorSelector, this.emulatorSelector.getChildControls());
            this.addContainer(this.widgetSelector, this.widgetSelector.getChildControls());

            const previewWrapper = new DivEl('preview-button-wrapper');
            previewWrapper.appendChildren(this.previewButton);
            this.addContainer(previewWrapper, [this.previewButton]);

            return rendered;
        });
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        ResponsiveManager.fireResizeEvent();

        super.setItem(item);
        this.previewButton.getAction().setEnabled(false);
    }

    public getWidgetSelector(): PreviewWidgetDropdown {
        return this.widgetSelector;
    }

    public getPreviewAction(): WidgetPreviewAction {
        return this.previewButton.getAction() as WidgetPreviewAction;
    }

    public getPreviewActionHelper(): PreviewActionHelper {
        return this.previewHelper;
    }

    protected foldOrExpand(): void {
        //
    }
}

export class WidgetPreviewAction
    extends Action {
    private toolbar: ContentItemPreviewToolbar;

    constructor(toolbar: ContentItemPreviewToolbar) {
        super(i18n('action.preview'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);
        this.toolbar = toolbar;
        this.onExecuted(this.handleExecuted.bind(this));

        this.setWcagAttributes({
            role: AriaRole.BUTTON,
            tabbable: true,
            ariaLabel: i18n('action.preview')
        });
    }

    protected handleExecuted() {
        this.toolbar.getPreviewActionHelper().openWindow(this.toolbar.getItem().getContentSummary(),
            this.toolbar.getWidgetSelector().getSelectedWidget());
    }
}
