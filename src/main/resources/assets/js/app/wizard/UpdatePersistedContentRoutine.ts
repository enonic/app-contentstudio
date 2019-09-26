import {UpdateContentRequest} from '../resource/UpdateContentRequest';
import {CreatePageRequest} from './CreatePageRequest';
import {DeletePageRequest} from './DeletePageRequest';
import {UpdatePageRequest} from '../resource/UpdatePageRequest';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {Flow, RoutineContext} from './Flow';
import {Content} from '../content/Content';
import Workflow = api.content.Workflow;
import WorkflowState = api.content.WorkflowState;

export class UpdatePersistedContentRoutine
    extends Flow {

    private persistedContent: Content;

    private viewedContent: Content;

    private requireValid: boolean;

    private workflowState: api.content.WorkflowState;

    constructor(thisOfProducer: any, persistedContent: Content, viewedContent: Content) {
        super(thisOfProducer);
        this.persistedContent = persistedContent;
        this.viewedContent = viewedContent;
    }

    public execute(): wemQ.Promise<RoutineContext> {

        let context = new RoutineContext();
        context.content = this.persistedContent;
        return this.doExecute(context);
    }

    doExecuteNext(context: RoutineContext): wemQ.Promise<RoutineContext> {

        let promise;
        const isContentChanged = this.hasContentChanged(this.persistedContent, this.viewedContent);

        if (isContentChanged || this.hasNamesChanged(this.persistedContent, this.viewedContent)) {
            promise = this.doHandleUpdateContent(context, isContentChanged);
        } else {
            promise = wemQ(null);
        }

        if (this.hasPageChanged(this.persistedContent, this.viewedContent)) {
            promise.then(this.doHandlePage.bind(this, context));
        }

        return promise.then(() => {
            return context;
        });
    }

    private doHandleUpdateContent(context: RoutineContext, markUpdated: boolean = true): wemQ.Promise<void> {

        return this.produceUpdateContentRequest(context.content, this.viewedContent).sendAndParse().then(
            (content: Content): void => {

                context.content = content;

                if (markUpdated) {
                    context.dataUpdated = true;
                }

            });
    }

    private doHandlePage(context: RoutineContext): wemQ.Promise<void> {

        let pageCUDRequest = this.producePageCUDRequest(context.content, this.viewedContent);

        if (pageCUDRequest != null) {
            return pageCUDRequest.sendAndParse()
                .then((content: Content): void => {

                    context.content = content;
                    context.pageUpdated = true;

                });
        } else {
            return wemQ(null);
        }
    }

    private hasNamesChanged(persisted: Content, viewed: Content): boolean {
        return persisted.getDisplayName() !== viewed.getDisplayName() || !persisted.getName().equals(viewed.getName());
    }

    private hasContentChanged(persisted: Content, viewed: Content): boolean {
        return this.workflowState === WorkflowState.READY ||
               !persisted.dataEquals(viewed.getContentData()) ||
               !persisted.getOwner().equals(viewed.getOwner()) ||
               !persisted.getPermissions().equals(viewed.getPermissions()) ||
               persisted.getLanguage() !== viewed.getLanguage() ||
               persisted.getPublishFromTime() !== viewed.getPublishFromTime() ||
               persisted.getPublishToTime() !== viewed.getPublishToTime();
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

    setWorkflowState(state: api.content.WorkflowState): UpdatePersistedContentRoutine {
        this.workflowState = state;
        return this;
    }
}
