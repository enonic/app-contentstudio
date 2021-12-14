import {BrowsePanel} from 'lib-admin-ui/app/browse/BrowsePanel';
import {Body} from 'lib-admin-ui/dom/Body';
import {ResponsiveToolbar} from './ResponsiveToolbar';
import {ContextSplitPanel} from '../view/context/ContextSplitPanel';
import {ContextView} from '../view/context/ContextView';
import {DockedContextPanel} from '../view/context/DockedContextPanel';
import {BrowseItemPanel} from 'lib-admin-ui/app/browse/BrowseItemPanel';
import * as Q from 'q';
import {ViewItem} from 'lib-admin-ui/app/view/ViewItem';
import {SplitPanelSize} from 'lib-admin-ui/ui/panel/SplitPanelSize';

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
            }

            this.toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
            this.treeGrid.toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
        });

        this.browseToolbar.onFoldClicked(() => {
            this.contextSplitPanel.hideContextPanel();
            Body.get().removeClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS);
            this.removeClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS);
            this.browseToolbar.removeClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS);
            this.browseToolbar.disableMobileMode();
            this.browseToolbar.updateFoldButtonLabel();
            this.treeGrid.removeHighlighting();
        });
    }

    protected createBrowseWithItemsPanel(): ContextSplitPanel {
        this.contextView = this.createContextView();
        const leftPanel: BrowseItemPanel = this.getBrowseItemPanel();
        const rightPanel: DockedContextPanel = new DockedContextPanel(this.contextView);

        this.contextSplitPanel = ContextSplitPanel.create(leftPanel, rightPanel)
            .setSecondPanelSize(SplitPanelSize.Percents(38))
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

        const item: ViewItem = this.treeGrid.getLastSelectedOrHighlightedItem();
        this.updateContextView(item);

        if (this.treeGrid.hasHighlightedNode()) {
            if (this.contextSplitPanel.isMobileMode()) {
                Body.get().addClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS);
                this.addClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS);
                this.browseToolbar.addClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS);
                this.browseToolbar.enableMobileMode();
                this.browseToolbar.setFoldButtonLabel(item.getDisplayName());
            }
        }
    }

    protected abstract updateContextView(item: ViewItem);

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('responsive-browse-panel');

            return rendered;
        });
    }
}
