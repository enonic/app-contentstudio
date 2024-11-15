import * as Q from 'q';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {GetWidgetsByInterfaceRequest} from '../resource/GetWidgetsByInterfaceRequest';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {PreviewWidgetDropdown} from './toolbar/PreviewWidgetDropdown';
import {PreviewContentAction} from '../browse/action/PreviewContentAction';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class ContentItemPreviewToolbar
    extends ContentStatusToolbar {

    private liveViewWidgets: Promise<Widget[]>;
    private widgetSelector: PreviewWidgetDropdown;
    private previewButton: ActionButton;

    constructor() {
        super({className: 'content-item-preview-toolbar'});
    }

    protected initElements(): void {
        super.initElements();

        this.liveViewWidgets = this.fetchLiveViewWidgets();

        const previewAction = new PreviewContentAction(null);
        this.previewButton = new ActionButton(previewAction);
        this.previewButton.addClass('icon-newtab');

        this.widgetSelector = new PreviewWidgetDropdown();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {

            this.liveViewWidgets.then((widgets: Widget[]) => {
                console.log('Live view widgets:', widgets);

                this.widgetSelector.setWidgets(widgets);
            });

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

    private async fetchLiveViewWidgets(): Promise<Widget[]> {
        return new GetWidgetsByInterfaceRequest(['contentstudio.liveview']).sendAndParse()
            .catch((e) => {
                DefaultErrorHandler.handle(e);
                return [];
            });
    }

    public getWidgetSelector(): PreviewWidgetDropdown {
        return this.widgetSelector;
    }

    public getPreviewButton(): ActionButton {
        return this.previewButton;
    }

    protected foldOrExpand(): void {
        //
    }
}
