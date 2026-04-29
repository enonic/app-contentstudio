import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import Q from 'q';
import {PreviewContextMenuElement} from '../../v6/features/shared/PreviewContextMenu';
import {capitalize} from '../../v6/features/utils/format/capitalize';
import {type ContentSummary} from '../content/ContentSummary';
import {type ViewExtensionEvent} from '../event/ViewExtensionEvent';
import {RenderingMode} from '../rendering/RenderingMode';
import {ExtensionRenderingHandler, PREVIEW_TYPE, type ExtensionRenderer} from '../view/ExtensionRenderingHandler';

export class WizardExtensionRenderingHandler
    extends ExtensionRenderingHandler {

    private hasControllersDeferred: Q.Deferred<boolean>;
    private hasPageDeferred: Q.Deferred<boolean>;
    private emptyMenu: PreviewContextMenuElement;
    private errorMenu: PreviewContextMenuElement;

    constructor(renderer: ExtensionRenderer) {
        super(renderer);
        this.mode = RenderingMode.EDIT;
    }

    protected createEmptyView(): DivEl {
        const wrapper = new DivEl('no-selection-message');
        this.emptyMenu = new PreviewContextMenuElement({
            pageName: '',
            messages: [this.getDefaultMessage()],
            showIcon: false,
        });
        wrapper.appendChild(this.emptyMenu);
        return wrapper;
    }

    protected createErrorView(): DivEl {
        const wrapper = new DivEl('no-preview-message bg-surface-primary');
        this.errorMenu = new PreviewContextMenuElement({
            pageName: '',
            messages: [this.getDefaultMessage()],
            showIcon: true,
        });
        wrapper.appendChild(this.errorMenu);
        return wrapper;
    }

    protected showPreviewMessages(messages: string[]) {
        this.errorMenu?.setProps({messages, showIcon: true});
    }

    async render(summary: ContentSummary, widget): Promise<boolean> {
        this.hasControllersDeferred = Q.defer<boolean>();
        this.hasPageDeferred = Q.defer<boolean>();
        const pageName = summary.getDisplayName();
        const localName = summary.getType()?.getLocalName() ?? '';
        const pageType = localName ? capitalize(localName) : '';
        this.emptyMenu?.setProps({pageName, pageType});
        this.errorMenu?.setProps({pageName, pageType});
        return super.render(summary, widget);
    }

    protected extractPreviewData(response: Response): Record<string, never> {
        const data = super.extractPreviewData(response);
        this.hasControllersDeferred.resolve(data?.hasControllers);
        this.hasPageDeferred.resolve(data?.hasPage);
        return data;
    }

    protected handlePreviewFailure(response?: Response, data?: Record<string, never>) {
        if (data?.hasControllers && !data.hasPage) {
            // special handling for site engine to link to page settings
            super.setPreviewType(PREVIEW_TYPE.EMPTY);
            this.hideMask();
        } else {
            super.handlePreviewFailure(response, data);
        }
    }

    protected handleWidgetEvent(event: ViewExtensionEvent) {
        // do nothing, we want to handle it in LiveFormPanel
    }

    public hasControllers(): Q.Promise<boolean> {
        return this.hasControllersDeferred ? this.hasControllersDeferred.promise : Q.resolve(false);
    }

    public hasPage(): Q.Promise<boolean> {
        return this.hasPageDeferred ? this.hasPageDeferred.promise : Q.resolve(false);
    }


}
