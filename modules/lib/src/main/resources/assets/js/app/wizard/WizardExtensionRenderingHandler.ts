import { DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import { type Extension } from '@enonic/lib-admin-ui/extension/Extension';
import Q from 'q';
import { $contentType } from '../../v6/pages/wizard/model/wizardContent.store';
import { PreviewContextMenuElement } from '../../v6/shared/ui/PreviewContextMenu';
import { capitalize } from '../../v6/shared/lib/format/capitalize';
import { isLiveViewImageEditorWidget } from '../../v6/widgets/inspectors/model/liveViewWidgets.store';
import { whenPreviewSettled } from '../../v6/widgets/preview-panel/model/previewResolution.store';
import { type ContentSummary } from '../content/ContentSummary';
import { type ViewExtensionEvent } from '../event/ViewExtensionEvent';
import { RenderingMode } from '../rendering/RenderingMode';
import {
    ExtensionRenderingHandler,
    PREVIEW_TYPE,
    type ExtensionRenderer,
    type FailedPreviewResult,
} from '../view/ExtensionRenderingHandler';

export class WizardExtensionRenderingHandler extends ExtensionRenderingHandler {
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
        this.errorMenu?.setProps({ messages, showIcon: true });
    }

    render(summary: ContentSummary, widget: Extension): Promise<boolean> {
        const pageName = summary.getDisplayName();
        const localName = summary.getType()?.getLocalName() ?? '';
        const pageType = localName ? capitalize(localName) : '';
        this.emptyMenu?.setProps({ pageName, pageType });
        this.errorMenu?.setProps({ pageName, pageType });
        return super.render(summary, widget);
    }

    // The image editor takes the iframe's place, so the preview is resolved but never loaded.
    protected shouldShowFrame(extension: Extension): boolean {
        return !isLiveViewImageEditorWidget(extension, $contentType.get());
    }

    protected handlePreviewFailure(result: FailedPreviewResult) {
        if (result.hasControllers && !result.hasPage) {
            // special handling for site engine to link to page settings
            super.setPreviewType(PREVIEW_TYPE.EMPTY);
            this.hideMask();
        } else {
            super.handlePreviewFailure(result);
        }
    }

    protected handleExtensionEvent(_event: ViewExtensionEvent) {
        // do nothing, we want to handle it in LiveFormPanel
    }

    public hasControllers(): Q.Promise<boolean> {
        return Q(whenPreviewSettled()).then((result) => result?.hasControllers ?? false);
    }

    public hasPage(): Q.Promise<boolean> {
        return Q(whenPreviewSettled()).then((result) => result?.hasPage ?? false);
    }
}
