import { Body } from '@enonic/lib-admin-ui/dom/Body';
import { DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import { type ToolbarConfig } from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import { CONFIG } from '@enonic/lib-admin-ui/util/Config';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { normalizeContentPathName } from '../../v6/shared/lib/cms/content/paths';
import { ContentName } from '../content/ContentName';
import { type ContentSummaryAndCompareStatus } from '../content/ContentSummaryAndCompareStatus';
import { UrlHelper } from '../util/UrlHelper';
import { type ContentWizardActions } from '../wizard/action/ContentWizardActions';
import { ContentWizardToolbarPublishControls } from '../wizard/ContentWizardToolbarPublishControls';
import {
    $wizardToolbar,
    resetWizardToolbar,
    setWizardToolbarContent,
} from '../../v6/pages/wizard/model/wizardToolbar.store';
import { $wizardDraftName, setDraftName } from '../../v6/pages/wizard/model/wizardContent.store';
import {
    unwatchWizardCollaborators,
    watchWizardCollaborators,
} from '../../v6/pages/wizard/model/wizardCollaborators.service';
import { getActiveProjectName } from '../../v6/entities/project/activeProject.store';
import { openRenameContentDialog } from '../../v6/features/rename/model/renameContentDialog.store';
import { LAYERS_WIDGET_NAME } from '../../v6/shared/lib/widget/layers';
import { ContentWizardToolbarElement as V6ContentWizardToolbarElement } from '../../v6/widgets/browse-toolbar/ContentWizardToolbar';
import { openContextWidget } from '../../v6/widgets/context-panel/openContextWidget';

export type ContentWizardToolbarConfig = ToolbarConfig & {
    actions: ContentWizardActions;
    onContentRenameConfirmed?: (newName: string) => void;
};

class ContentWizardToolbarElement extends V6ContentWizardToolbarElement {
    ariaLabel: string = i18n('wcag.contenteditor.toolbar.label');

    private readonly config: ContentWizardToolbarConfig;

    private item: ContentSummaryAndCompareStatus;

    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;

    private hiddenElementsHost?: DivEl;

    private stateIcon?: DivEl;

    constructor(config: ContentWizardToolbarConfig) {
        super({
            onProjectBack: () => {
                this.handleProjectBackClicked();
            },
            onLayersClick: () => {
                this.handleLayersClicked();
            },
            onContentPathClick: () => {
                this.handleContentPathClicked();
            },
        });

        this.config = config;
        this.getHTMLElement().classList.remove('contents');

        this.initElements();
        this.initListeners();
    }

    private initElements(): void {
        resetWizardToolbar();

        this.addHiddenElementsHost();

        if (!this.isCollaborationEnabled()) {
            this.addStateIcon();
        }

        this.addHiddenPublishControls();

        if (this.isCollaborationEnabled() && this.getItem()) {
            watchWizardCollaborators(this.getItem().getContentId().toString());
        }
    }

    private initListeners(): void {
        this.whenRendered(() => {
            const onPublishControlsInitialised = () => {
                this.contentWizardToolbarPublishControls.getPublishButton().show();
                this.contentWizardToolbarPublishControls
                    .getPublishButton()
                    .unActionUpdated(onPublishControlsInitialised);
            };

            this.contentWizardToolbarPublishControls.getPublishButton().onActionUpdated(onPublishControlsInitialised);

            this.contentWizardToolbarPublishControls
                .getPublishButton()
                .onPublishRequestActionChanged((added: boolean) => {
                    this.toggleClass('publish-request', added);
                });
        });

        this.onRemoved(() => {
            unwatchWizardCollaborators();
            this.hiddenElementsHost?.remove();
            this.hiddenElementsHost = undefined;
            resetWizardToolbar();
        });
    }

    setItem(item: ContentSummaryAndCompareStatus): void {
        this.item = item;
        setWizardToolbarContent(item);
        this.contentWizardToolbarPublishControls.setContent(item);

        if (this.isCollaborationEnabled()) {
            watchWizardCollaborators(item.getContentId().toString());
        }
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.item;
    }

    private addHiddenElementsHost(): void {
        this.hiddenElementsHost = new DivEl('content-wizard-toolbar-hidden-elements');
        this.hiddenElementsHost.hide();
        Body.get().appendChild(this.hiddenElementsHost);
    }

    private handleProjectBackClicked(): void {
        window.location.href = UrlHelper.createContentBrowseUrl(getActiveProjectName());
    }

    private handleContentPathClicked(): void {
        if (!$wizardToolbar.get().canRenameContentPath) {
            return;
        }

        const path = this.item?.getPath();
        if (!path) {
            return;
        }

        const draftName = $wizardDraftName.get()?.toString() || '';
        const initialName = normalizeContentPathName(draftName) || normalizeContentPathName(path.getName());
        const persistedName = normalizeContentPathName(path.getName());

        void openRenameContentDialog({
            parentPath: path.getParentPath(),
            initialName,
            persistedName,
            isPublished: this.config.actions.isOnline(),
        }).then((newName?: string) => {
            if (!newName) {
                return;
            }

            setDraftName(new ContentName(newName));

            this.config.onContentRenameConfirmed?.(newName);

            const saveAction = this.config.actions.getSaveAction();
            saveAction.setEnabled(true);
            saveAction.execute();
        });
    }

    private handleLayersClicked(): void {
        openContextWidget(LAYERS_WIDGET_NAME);
    }

    private addHiddenPublishControls(): void {
        this.contentWizardToolbarPublishControls = new ContentWizardToolbarPublishControls(this.config.actions);
        this.contentWizardToolbarPublishControls.hide();

        const publishButton = this.contentWizardToolbarPublishControls.getPublishButton();
        publishButton.hide();

        this.hiddenElementsHost?.appendChild(this.contentWizardToolbarPublishControls);
    }

    private addStateIcon(): void {
        this.stateIcon = new DivEl('toolbar-state-icon');
        this.hiddenElementsHost?.appendChild(this.stateIcon);
    }

    private isCollaborationEnabled(): boolean {
        return CONFIG.isTrue('enableCollaboration');
    }

    getContentWizardToolbarPublishControls(): ContentWizardToolbarPublishControls {
        return this.contentWizardToolbarPublishControls;
    }

    getStateIcon(): DivEl {
        return this.stateIcon;
    }
}

export { ContentWizardToolbarElement as ContentWizardToolbar };
