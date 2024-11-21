import * as Q from 'q';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {PreviewWidgetDropdown} from './toolbar/PreviewWidgetDropdown';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {PreviewActionHelper} from '../action/PreviewActionHelper';
import {EmulatorDropdown} from './toolbar/EmulatorDropdown';

export class ContentItemPreviewToolbar
    extends ContentStatusToolbar {

    private widgetSelector: PreviewWidgetDropdown;
    private emulatorSelector: EmulatorDropdown;
    private previewButton: ActionButton;

    constructor() {
        super({className: 'content-item-preview-toolbar'});
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

            this.addElement(this.emulatorSelector);
            this.addElement(this.widgetSelector);

            const previewWrapper = new DivEl('preview-button-wrapper');
            previewWrapper.appendChildren(this.previewButton);
            this.addContainer(previewWrapper, [this.previewButton]);

            return rendered;
        });
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        super.setItem(item);
        this.previewButton.getAction().setEnabled(false);
    }

    public getWidgetSelector(): PreviewWidgetDropdown {
        return this.widgetSelector;
    }

    public getPreviewAction(): Action {
        return this.previewButton.getAction();
    }

    protected foldOrExpand(): void {
        //
    }
}

class WidgetPreviewAction
    extends Action {
    private toolbar: ContentItemPreviewToolbar;
    private helper: PreviewActionHelper;

    constructor(toolbar: ContentItemPreviewToolbar) {
        super();
        this.toolbar = toolbar;
        this.helper = new PreviewActionHelper();
        this.onExecuted(this.handleExecuted.bind(this));
    }

    protected handleExecuted() {
        this.helper.openWindow(this.toolbar.getItem().getContentSummary(), this.toolbar.getWidgetSelector().getSelectedWidget());
    }
}
