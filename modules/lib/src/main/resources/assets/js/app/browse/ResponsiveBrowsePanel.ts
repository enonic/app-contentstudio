import { BrowsePanel } from '@enonic/lib-admin-ui/app/browse/BrowsePanel';
import { ToggleFilterPanelAction } from '@enonic/lib-admin-ui/app/browse/action/ToggleFilterPanelAction';
import { type ViewItem } from '@enonic/lib-admin-ui/app/view/ViewItem';
import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { Body } from '@enonic/lib-admin-ui/dom/Body';
import { Panel } from '@enonic/lib-admin-ui/ui/panel/Panel';
import { SelectionMode } from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import type Q from 'q';
import { BrowseLayoutElement } from '../../v6/pages/browse/layout/BrowseLayout';
import { setMobilePreviewOpen } from '../../v6/pages/browse/model/browseLayout.store';
import {
    $contextPanelMode,
    $isContextLayoutMeasured,
    shouldCollapseContextInitially,
} from '../../v6/widgets/context-panel/model/contextPanelMode.store';
import { $isContextOpen, setContextOpen } from '../../v6/widgets/context-panel/model/contextWidgets.store';
import { $isContentFilterOpen, setContentFilterOpen } from '../../v6/features/search/model/contentFilter.store';
import { getContentAsCSCS } from '../../v6/entities/content';
import { InspectEvent } from '../event/InspectEvent';
import { type ContextView } from '../view/context/ContextView';
import { DockedContextPanel } from '../view/context/DockedContextPanel';
import { ResponsiveToolbar } from './ResponsiveToolbar';

export abstract class ResponsiveBrowsePanel extends BrowsePanel {
    static MOBILE_MODE_CLASS = 'mobile-mode';
    static MOBILE_PREVIEW_CLASS = 'mobile-preview-on';

    declare protected browseToolbar: ResponsiveToolbar;
    protected contextView: ContextView;
    protected dockedContextPanel: DockedContextPanel;
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

        this.contextView = this.createContextView();
        this.dockedContextPanel = new DockedContextPanel(this.contextView);
        this.browseLayout = new BrowseLayoutElement({
            gridPanel: this.selectableListBoxPanel,
            previewPanel: this.browseItemPanel,
            contextPanel: this.dockedContextPanel,
            filterPanel: this.filterPanel ?? undefined,
        });

        this.selectableListBoxPanel.getWrapper().setSkipFirstClickOnFocus(true);
    }

    protected initListeners(): void {
        super.initListeners();

        $contextPanelMode.subscribe((mode, prevMode) => {
            const isMobile = mode === 'mobile';
            if (prevMode !== undefined && isMobile === (prevMode === 'mobile')) return;

            if (!isMobile) {
                this.toggleMobilePreviewMode(false);
            }

            Body.get().toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
            this.toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
            this.selectableListBoxPanel.toggleClass(ResponsiveBrowsePanel.MOBILE_MODE_CLASS, isMobile);
        });

        this.browseToolbar.onFoldClicked(() => {
            setContextOpen(false);
            this.toggleMobilePreviewMode(false);
        });

        this.selectableListBoxPanel.onSelectionChanged(() => {
            if (
                this.selectableListBoxPanel.getSelectedItems().length > 0 &&
                this.selectableListBoxPanel.getSelectionMode() === SelectionMode.HIGHLIGHT &&
                $contextPanelMode.get() === 'mobile'
            ) {
                this.toggleMobilePreviewMode(true);
            }
        });

        InspectEvent.on((event: InspectEvent) => {
            const contentId = event.getContentId();
            if (contentId !== undefined) {
                const item = getContentAsCSCS(contentId);
                if (item) {
                    void this.contextView.setItem(item);
                }
            }

            const widgetName = event.getWidgetName();
            if (widgetName !== undefined) {
                this.contextView.setActiveExtensionByName(widgetName, event.getWidgetApplicationKey());
            }

            if (event.isShowPanel()) {
                setContextOpen(true);
            }
        });

        $isContentFilterOpen.subscribe((isOpen: boolean, wasOpen: boolean) => {
            if (this.filterPanel == null || isOpen === wasOpen) return;

            if (isOpen) {
                this.browseToolbar.giveBlur();
                this.toggleFilterPanelAction.setVisible(false);
                this.toggleFilterPanelButton.removeClass('filtered');
                // Focus after the batched render mounts the panel.
                setTimeout(() => this.filterPanel.giveFocusToSearch(), 100);
            } else {
                this.toggleFilterPanelAction.setVisible(true);
                if (this.filterPanel.hasFilterSet()) this.toggleFilterPanelButton.addClass('filtered');
            }
        });

        // Custom legacy widgets still fetch through ContextView on open.
        $isContextOpen.subscribe((isOpen: boolean, wasOpen: boolean) => {
            if (isOpen && !wasOpen && this.dockedContextPanel.getItem()) {
                this.contextView.updateActiveExtension();
            }
        });

        // Auto-open on wide screens once the layout reports its first measurement.
        let unsubscribeInitialOpen: (() => void) | undefined;
        unsubscribeInitialOpen = $isContextLayoutMeasured.subscribe((measured: boolean) => {
            if (!measured) return;
            unsubscribeInitialOpen?.();
            unsubscribeInitialOpen = undefined;

            if (!shouldCollapseContextInitially() && this.dockedContextPanel.getActiveExtension()) {
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

    protected createToolbar(): ResponsiveToolbar {
        return new ResponsiveToolbar();
    }

    protected abstract createContextView(): ContextView;

    protected togglePreviewPanelDependingOnScreenSize(): void {
        // Preview visibility is owned by BrowseLayout.
    }

    protected updatePreviewItem(): void {
        super.updatePreviewItem();

        const item: ViewItem = this.selectableListBoxPanel.getLastSelectedItem();
        this.updateContextView(item).catch(DefaultErrorHandler.handle);
    }

    private toggleMobilePreviewMode(isMobile: boolean): void {
        setMobilePreviewOpen(isMobile);

        Body.get().toggleClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS, isMobile);
        this.toggleClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS, isMobile);
        this.browseToolbar.toggleClass(ResponsiveBrowsePanel.MOBILE_PREVIEW_CLASS, isMobile);

        if (isMobile) {
            this.browseToolbar.enableMobileMode();
            const lastItem = this.selectableListBoxPanel.getLastSelectedItem();
            if (lastItem) this.browseToolbar.setFoldButtonLabel(lastItem.getDisplayName());
        } else {
            this.browseToolbar.disableMobileMode();
            this.browseToolbar.updateFoldButtonLabel();
        }
    }

    protected abstract updateContextView(item: ViewItem): Q.Promise<void>;

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
