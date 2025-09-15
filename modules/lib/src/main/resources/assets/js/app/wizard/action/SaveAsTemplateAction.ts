import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {GetPermittedActionsRequest} from '../../resource/GetPermittedActionsRequest';
import {CreatePageTemplateRequest} from '../CreatePageTemplateRequest';
import {EditContentEvent} from '../../event/EditContentEvent';
import {Site} from '../../content/Site';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Permission} from '../../access/Permission';
import {ContentSummary} from '../../content/ContentSummary';
import {PageState} from '../page/PageState';
import {PageEventsManager} from '../PageEventsManager';

export class SaveAsTemplateAction
    extends Action {

    private static INSTANCE: SaveAsTemplateAction;

    private userHasCreateRights: boolean;

    private contentSummary: ContentSummary;

    private site: Site;

    private isPageRenderable: boolean = false;

    private isPageLocked: boolean = false;

    private constructor() {
        super(i18n('action.saveAsTemplate'));

        this.onExecuted(action => {
            new CreatePageTemplateRequest()
                .setController(PageState.getState().getController())
                .setRegions(PageState.getState().getRegions())
                .setConfig(PageState.getState().getConfig())
                .setDisplayName(this.contentSummary.getDisplayName())
                .setSite(this.site ? this.site.getPath() : null)
                .setSupports(this.contentSummary.getType())
                .setName(this.contentSummary.getName())
                .sendAndParse().then(createdTemplate => {
                new EditContentEvent([ContentSummaryAndCompareStatus.fromContentSummary(createdTemplate)]).fire();
            }).catch((reason) => {
                DefaultErrorHandler.handle(reason);
            }).done();
        });

        PageEventsManager.get().onRenderableChanged((isRenderable) => {
            this.isPageRenderable = isRenderable;
        });

        PageEventsManager.get().onPageLocked(() => {
            this.isPageLocked = true;
        });
        PageEventsManager.get().onPageUnlocked(() => {
            this.isPageLocked = false;
        });
    }

    static get(): SaveAsTemplateAction {
        if (!SaveAsTemplateAction.INSTANCE) {
            SaveAsTemplateAction.INSTANCE = new SaveAsTemplateAction();
        }

        return SaveAsTemplateAction.INSTANCE;
    }

    updateVisibility() {
        // check for renderable because it can have a controller/template but not be renderable (e.g. app is turned off )
        if (!this.isPageLocked && this.isPageRenderable && PageState.getState()?.hasController() && !this.contentSummary.isPageTemplate()) {
            if (this.userHasCreateRights === undefined) {
                new GetPermittedActionsRequest()
                    .addContentIds(this.contentSummary.getContentId())
                    .addPermissionsToBeChecked(Permission.CREATE)
                    .sendAndParse().then((allowedPermissions: Permission[]) => {

                    this.userHasCreateRights = allowedPermissions.indexOf(Permission.CREATE) > -1;
                    this.setVisible(this.userHasCreateRights.valueOf());
                });
            } else {
                this.setVisible(this.userHasCreateRights.valueOf());
            }
        } else {
            this.setVisible(false);
        }
    }

    setContentSummary(contentSummary: ContentSummary): SaveAsTemplateAction {
        this.contentSummary = contentSummary;
        return this;
    }

    setSite(site: Site): SaveAsTemplateAction {
        this.site = site;
        return this;
    }
}
