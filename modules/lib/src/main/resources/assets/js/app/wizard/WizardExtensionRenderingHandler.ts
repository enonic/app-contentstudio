import {RenderingMode} from '../rendering/RenderingMode';
import {ExtensionRenderingHandler, type ExtensionRenderer, PREVIEW_TYPE} from '../view/ExtensionRenderingHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type ViewExtensionEvent} from '../event/ViewExtensionEvent';
import {type ContentSummary} from '../content/ContentSummary';
import Q from 'q';
import {PreviewContextMenuElement} from '../../v6/features/shared/PreviewContextMenu';

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
        this.emptyMenu?.setProps({pageName});
        this.errorMenu?.setProps({pageName});
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
