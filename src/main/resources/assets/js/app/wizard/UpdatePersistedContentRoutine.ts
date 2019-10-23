import * as Q from 'q';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {UpdateContentRequest} from '../resource/UpdateContentRequest';
import {CreatePageRequest} from './CreatePageRequest';
import {DeletePageRequest} from './DeletePageRequest';
import {UpdatePageRequest} from '../resource/UpdatePageRequest';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {Flow, RoutineContext} from './Flow';
import {Content} from '../content/Content';
import {Site} from '../content/Site';
import {Workflow} from 'lib-admin-ui/content/Workflow';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';

export class UpdatePersistedContentRoutine
    extends Flow {

    private persistedContent: Content;

    private viewedContent: Content;

    private requireValid: boolean;

    private workflowState: WorkflowState;

    constructor(thisOfProducer: any, persistedContent: Content, viewedContent: Content) {
        super(thisOfProducer);
        this.persistedContent = persistedContent;
        this.viewedContent = viewedContent;
    }

    public execute(): Q.Promise<RoutineContext> {

        let context = new RoutineContext();
        context.content = this.persistedContent;
        return this.doExecute(context);
    }

    doExecuteNext(context: RoutineContext): Q.Promise<RoutineContext> {

        let promise;
        const isContentChanged = this.hasContentChanged(this.persistedContent, this.viewedContent);

        if (isContentChanged || this.hasNamesChanged(this.persistedContent, this.viewedContent)) {
            promise = this.doHandleUpdateContent(context, isContentChanged);
        } else {
            promise = Q(null);
        }

        if (this.hasPageChanged(this.persistedContent, this.viewedContent)) {
            promise = promise.then(this.doHandlePage.bind(this, context));
        }

        return promise.then(() => {
            return context;
        });
    }

    private doHandleUpdateContent(context: RoutineContext, markUpdated: boolean = true): Q.Promise<void> {

        return this.produceUpdateContentRequest(context.content, this.viewedContent).sendAndParse().then(
            (content: Content): void => {

                // reload page editor as well when site config has been changed
                if (context.content.isSite() && this.viewedContent.isSite()) {
                    const siteConfigs = (<Site>context.content).getSiteConfigs();
                    const viewedConfigs = (<Site>this.viewedContent).getSiteConfigs();
                    if (!ObjectHelper.arrayEquals(siteConfigs, viewedConfigs)) {
                        context.pageUpdated = true;
                    }
                }

                if (markUpdated) {
                    context.dataUpdated = true;
                }
                context.content = content;

            });
    }

    private doHandlePage(context: RoutineContext): Q.Promise<void> {

        let pageCUDRequest = this.producePageCUDRequest(context.content, this.viewedContent);

        if (pageCUDRequest != null) {
            return pageCUDRequest.sendAndParse()
                .then((content: Content): void => {

                    context.content = content;
                    context.pageUpdated = true;

                });
        } else {
            return Q(null);
        }
    }

    private hasNamesChanged(persisted: Content, viewed: Content): boolean {
        return persisted.getDisplayName() !== viewed.getDisplayName() || !persisted.getName().equals(viewed.getName());
    }

    private hasContentChanged(persisted: Content, viewed: Content): boolean {
        return !persisted.dataEquals(viewed.getContentData()) ||
               !persisted.extraDataEquals(viewed.getAllExtraData()) ||
               !ObjectHelper.equals(persisted.getOwner(), viewed.getOwner()) ||
               persisted.getLanguage() !== viewed.getLanguage() ||
               persisted.getPublishFromTime() !== viewed.getPublishFromTime() ||
               persisted.getPublishToTime() !== viewed.getPublishToTime() ||
               !persisted.getPermissions().equals(viewed.getPermissions()) ||
               persisted.isInheritPermissionsEnabled() !== viewed.isInheritPermissionsEnabled() ||
               persisted.isOverwritePermissionsEnabled() !== viewed.isOverwritePermissionsEnabled() ||
               this.workflowState === WorkflowState.READY;
    }

    private hasPageChanged(persisted: Content, viewed: Content): boolean {
        const persistedPage = persisted.getPage();
        const viewedPage = viewed.getPage();

        return persistedPage ? !persistedPage.equals(viewedPage) : !!viewedPage;
    }

    private producePageCUDRequest(persistedContent: Content, viewedContent: Content): PageCUDRequest {

        if (persistedContent.isPage() && !viewedContent.isPage()) {
            return new DeletePageRequest(persistedContent.getContentId());
        } else if (!persistedContent.isPage() && viewedContent.isPage()) {
            const viewedPage = viewedContent.getPage();
            return new CreatePageRequest(persistedContent.getContentId())
                .setController(viewedPage.getController())
                .setPageTemplateKey(viewedPage.getTemplate())
                .setConfig(viewedPage.getConfig())
                .setRegions(viewedPage.getRegions())
                .setFragment(viewedPage.getFragment())
                .setCustomized(viewedPage.isCustomized());
        } else if (persistedContent.isPage() && viewedContent.isPage()) {
            const viewedPage = viewedContent.getPage();
            return new UpdatePageRequest(persistedContent.getContentId())
                .setController((viewedPage.getController()))
                .setPageTemplateKey((viewedPage.getTemplate()))
                .setConfig(viewedPage.getConfig())
                .setRegions(viewedPage.getRegions())
                .setFragment(viewedPage.getFragment())
                .setCustomized(viewedPage.isCustomized());
        }
    }

    private produceUpdateContentRequest(persistedContent: Content, viewedContent: Content): UpdateContentRequest {
        const workflow: Workflow = viewedContent.getWorkflow().newBuilder().setState(this.workflowState).build();

        return new UpdateContentRequest(persistedContent.getId())
            .setRequireValid(this.requireValid)
            .setContentName(viewedContent.getName())
            .setDisplayName(viewedContent.getDisplayName())
            .setData(viewedContent.getContentData())
            .setExtraData(viewedContent.getAllExtraData())
            .setOwner(viewedContent.getOwner())
            .setLanguage(viewedContent.getLanguage())
            .setPublishFrom(viewedContent.getPublishFromTime())
            .setPublishTo(viewedContent.getPublishToTime())
            .setPermissions(viewedContent.getPermissions())
            .setInheritPermissions(viewedContent.isInheritPermissionsEnabled())
            .setOverwritePermissions(viewedContent.isOverwritePermissionsEnabled())
            .setWorkflow(workflow);
    }

    setRequireValid(requireValid: boolean): UpdatePersistedContentRoutine {
        this.requireValid = requireValid;
        return this;
    }

    setWorkflowState(state: WorkflowState): UpdatePersistedContentRoutine {
        this.workflowState = state;
        return this;
    }
}
