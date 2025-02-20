import {BrowsePanel} from '@enonic/lib-admin-ui/app/browse/BrowsePanel';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {ResponsiveToolbar} from './ResponsiveToolbar';
import {ContextSplitPanel} from '../view/context/ContextSplitPanel';
import {ContextView} from '../view/context/ContextView';
import {DockedContextPanel} from '../view/context/DockedContextPanel';
import {BrowseItemPanel} from '@enonic/lib-admin-ui/app/browse/BrowseItemPanel';
import * as Q from 'q';
import {ViewItem} from '@enonic/lib-admin-ui/app/view/ViewItem';
import {SplitPanelSize} from '@enonic/lib-admin-ui/ui/panel/SplitPanelSize';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {SelectionMode} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export abstract class ResponsiveBrowsePanel extends BrowsePanel {

    static MOBILE_MODE_CLASS = 'mobile-mode';
    static MOBILE_PREVIEW_CLASS = 'mobile-preview-on';

    protected browseToolbar: ResponsiveToolbar;
    protected contextSplitPanel: ContextSplitPanel;
    protected contextView: ContextView;

    protected initListeners(): void {
        super.initListeners();

        this.contextSplitPanel.onMobileModeChanged((isMobile: boolean) => {
            if (isMobile) {
                this.hidePreviewPanel();
            } else {
                this.gridAndItemsSplitPanel.showFirstPanel();
                this.showPreviewPanel();
                this.toggleMobilePreviewMode(false);
            }

            Body.get().toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
            this.toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
            this.selectableListBoxPanel.toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
        });

        this.browseToolbar.onFoldClicked(() => {
            this.contextSplitPanel.hideContextPanel();
            this.toggleMobilePreviewMode(false);
        });

        this.selectableListBoxPanel.onSelectionChanged(() => {
            if (this.selectableListBoxPanel.getSelectedItems().length > 0 && this.selectableListBoxPanel.getSelectionMode() ===
                SelectionMode.HIGHLIGHT) {
                if (this.contextSplitPanel.isMobileMode()) {
                    this.toggleMobilePreviewMode(true);
                }
            }
        });
    }

    protected createBrowseWithItemsPanel(): ContextSplitPanel {
        this.contextView = this.createContextView();
        const leftPanel: BrowseItemPanel = this.getBrowseItemPanel();
        const rightPanel: DockedContextPanel = new DockedContextPanel(this.contextView);

        this.contextSplitPanel = ContextSplitPanel.create(leftPanel, rightPanel)
            .setSecondPanelSize(SplitPanelSize.PERCENTS(25))
            .setContextView(this.contextView)
            .build();

        return this.contextSplitPanel;
    }

    protected createToolbar(): ResponsiveToolbar {
        return new ResponsiveToolbar();
    }

    protected abstract createContextView(): ContextView;

    private hidePreviewPanel(): void {
        this.gridAndItemsSplitPanel.hideSecondPanel();
    }

    private showPreviewPanel(): void {
        this.gridAndItemsSplitPanel.showSecondPanel();
    }

    protected updatePreviewItem(): void {
        super.updatePreviewItem();

        const item: ViewItem = this.selectableListBoxPanel.getLastSelectedItem();
        this.updateContextView(item).catch(DefaultErrorHandler.handle);
    }

    private toggleMobilePreviewMode(isMobile: boolean): void {
        Body.get().toggleClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS, isMobile);
        this.toggleClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS, isMobile);
        this.browseToolbar.toggleClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS, isMobile);

        if (isMobile) {
            this.browseToolbar.enableMobileMode();
            this.browseToolbar.setFoldButtonLabel(this.selectableListBoxPanel.getLastSelectedItem().getDisplayName());
        } else {
            this.browseToolbar.disableMobileMode();
            this.browseToolbar.updateFoldButtonLabel();
        }
    }

    protected abstract updateContextView(item: ViewItem): Q.Promise<void>;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('responsive-browse-panel');

            return rendered;
        });
    }
}
