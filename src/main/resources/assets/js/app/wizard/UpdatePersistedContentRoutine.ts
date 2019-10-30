import {UpdateContentRequest} from '../resource/UpdateContentRequest';
import {CreatePageRequest} from './CreatePageRequest';
import {DeletePageRequest} from './DeletePageRequest';
import {UpdatePageRequest} from '../resource/UpdatePageRequest';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {Flow, RoutineContext} from './Flow';
import {Content} from '../content/Content';
import Workflow = api.content.Workflow;
import ObjectHelper = api.ObjectHelper;

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
        const isContentChanged = this.hasContentChanged();

        if (isContentChanged || this.hasNamesChanged()) {
            promise = this.doHandleUpdateContent(context, isContentChanged);
        } else {
            promise = wemQ(null);
        }

        if (this.hasPageChanged()) {
            promise = promise.then(this.doHandlePage.bind(this, context));
        }

        return promise.then(() => {
            return context;
        });
    }

    private doHandleUpdateContent(context: RoutineContext, markUpdated: boolean = true): wemQ.Promise<void> {

        return this.produceUpdateContentRequest(context.content, this.viewedContent).sendAndParse().then(
            (content: Content): void => {

                // NB: reloading the page because it may use any changed data
                context.pageUpdated = true;

                if (markUpdated) {
                    context.dataUpdated = true;
                }
                context.content = content;

            });
    }

    private doHandlePage(context: RoutineContext): wemQ.Promise<void> {

        const pageCUDRequest: PageCUDRequest = this.producePageCUDRequest(context.content, this.viewedContent);

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

    private hasNamesChanged(): boolean {
        const persisted: Content = this.persistedContent;
        const viewed: Content = this.viewedContent;

        return persisted.getDisplayName() !== viewed.getDisplayName() || !persisted.getName().equals(viewed.getName());
    }

    private hasContentChanged(): boolean {
        const persisted: Content = this.persistedContent;
        const viewed: Content = this.viewedContent;

        return this.isWorkflowChanged() ||
               !persisted.dataEquals(viewed.getContentData()) ||
               !persisted.extraDataEquals(viewed.getAllExtraData()) ||
               !ObjectHelper.equals(persisted.getOwner(), viewed.getOwner()) ||
               persisted.getLanguage() !== viewed.getLanguage() ||
               persisted.getPublishFromTime() !== viewed.getPublishFromTime() ||
               persisted.getPublishToTime() !== viewed.getPublishToTime() ||
               !persisted.getPermissions().equals(viewed.getPermissions()) ||
               persisted.isInheritPermissionsEnabled() !== viewed.isInheritPermissionsEnabled() ||
               persisted.isOverwritePermissionsEnabled() !== viewed.isOverwritePermissionsEnabled();
    }

    private isWorkflowChanged(): boolean {
        return this.workflowState !== this.persistedContent.getWorkflow().getState();
    }

    private hasPageChanged(): boolean {
        const persistedPage = this.persistedContent.getPage();
        const viewedPage = this.viewedContent.getPage();

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
