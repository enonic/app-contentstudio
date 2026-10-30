import { BrowsePanel } from '@enonic/lib-admin-ui/app/browse/BrowsePanel';
import { ToggleFilterPanelAction } from '@enonic/lib-admin-ui/app/browse/action/ToggleFilterPanelAction';
import { Body } from '@enonic/lib-admin-ui/dom/Body';
import { Panel } from '@enonic/lib-admin-ui/ui/panel/Panel';
import { Toolbar, type ToolbarConfig } from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import type Q from 'q';
import { BrowseLayoutElement } from '../../v6/pages/browse/ui/layout/BrowseLayout';
import {
    $contextPanelMode,
    $isContextLayoutMeasured,
    setContextOpen,
    setMobilePreviewOpen,
    shouldCollapseContextInitially,
} from '../../v6/shared/app-state/browsePanels.store';
import {
    $isContentFilterOpen,
    $isDependencySearchPending,
    setContentFilterOpen,
} from '../../v6/features/search/model/contentFilter.store';
import { $activeWidgetId } from '../../v6/widgets/context-panel/model/contextWidgets.store';

export abstract class ResponsiveBrowsePanel extends BrowsePanel {
    static MOBILE_MODE_CLASS = 'mobile-mode';

    declare protected browseToolbar: Toolbar<ToolbarConfig>;
    protected browseLayout: BrowseLayoutElement;

    // Bypasses BrowsePanel splits: placement is owned by the v6 BrowseLayout.
    protected initElements(): void {
        this.selectableListBoxPanel = this.createListBoxPanel();
        this.keyNavigator = this.createKeyNavigator();
        this.filterPanel = this.createFilterPanel();
        this.browseToolbar = this.createToolbar();

        if (!this.browseItemPanel) {
            this.browseItemPanel = this.createBrowseItemPanel();
        }

        if (this.filterPanel) {
            this.setupFilterPanelWiring();
        }

        this.browseLayout = new BrowseLayoutElement({
            gridPanel: this.selectableListBoxPanel,
            previewPanel: this.browseItemPanel,
            filterPanel: this.filterPanel ?? undefined,
            storageId: this.getLayoutStorageId(),
        });

        this.selectableListBoxPanel.getWrapper().setSkipFirstClickOnFocus(true);
    }

    protected initListeners(): void {
        super.initListeners();

        $contextPanelMode.subscribe((mode, prevMode) => {
            const isMobile = mode === 'mobile';
            if (prevMode !== undefined && isMobile === (prevMode === 'mobile')) return;

            if (!isMobile) {
                setMobilePreviewOpen(false);
            }

            Body.get().toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
            this.toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
            this.selectableListBoxPanel.toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
        });

        $isContentFilterOpen.subscribe((isOpen: boolean, wasOpen: boolean) => {
            if (this.filterPanel == null || isOpen === wasOpen) return;

            if (isOpen) {
                this.browseToolbar.giveBlur();
                this.toggleFilterPanelAction.setVisible(false);
                this.toggleFilterPanelButton.removeClass('filtered');
                // Focus after the batched render mounts the panel.
                if (!$isDependencySearchPending.get()) {
                    setTimeout(() => {
                        if ($isContentFilterOpen.get() && !$isDependencySearchPending.get()) {
                            this.filterPanel.giveFocusToSearch();
                        }
                    }, 100);
                }
            } else {
                this.toggleFilterPanelAction.setVisible(true);
                if (this.filterPanel.hasFilterSet()) this.toggleFilterPanelButton.addClass('filtered');
            }
        });

        // Auto-open on wide screens once the layout reports its first measurement.
        let unsubscribeInitialOpen: (() => void) | undefined;
        unsubscribeInitialOpen = $isContextLayoutMeasured.subscribe((measured: boolean) => {
            if (!measured) return;
            unsubscribeInitialOpen?.();
            unsubscribeInitialOpen = undefined;

            if (!shouldCollapseContextInitially() && $activeWidgetId.get() != null) {
                setContextOpen(true);
            }
        });
    }

    private setupFilterPanelWiring(): void {
        this.filterPanel.onHideFilterPanelButtonClicked(() => setContentFilterOpen(false));
        this.filterPanel.onShowResultsButtonClicked(() => setContentFilterOpen(false));

        this.toggleFilterPanelAction = new ToggleFilterPanelAction(this).setFoldable(false);
        this.toggleFilterPanelAction.setWcagAttributes({
            ariaLabel: i18n('tooltip.filterPanel.show'),
        });
        this.toggleFilterPanelButton = this.browseToolbar.addAction(this.toggleFilterPanelAction);
        this.toggleFilterPanelButton.setTitle(i18n('tooltip.filterPanel.show'));
        this.toggleFilterPanelAction.setVisible(true);
    }

    // Filter state lives in $isContentFilterOpen; BrowseLayout renders it.
    toggleFilterPanel(): void {
        setContentFilterOpen(!$isContentFilterOpen.get());
    }

    protected showFilterPanel(): void {
        setContentFilterOpen(true);
    }

    protected hideFilterPanel(): void {
        setContentFilterOpen(false);
    }

    protected filterPanelIsHidden(): boolean {
        return !$isContentFilterOpen.get();
    }

    // Distinct per subclass: browse and Archive (CS+) must not share persisted layouts.
    protected getLayoutStorageId(): string {
        return 'browse-layout';
    }

    protected createToolbar(): Toolbar<ToolbarConfig> {
        return new Toolbar();
    }

    protected togglePreviewPanelDependingOnScreenSize(): void {
        // Preview visibility is owned by BrowseLayout.
    }

    // Bypasses BrowsePanel.doRender.
    doRender(): Q.Promise<boolean> {
        return Panel.prototype.doRender.call(this).then(() => {
            this.browseToolbar.addClass('browse-toolbar');
            this.appendChild(this.browseToolbar);
            this.appendChild(this.browseLayout);
            this.addClass('responsive-browse-panel');

            return true;
        });
    }
}
