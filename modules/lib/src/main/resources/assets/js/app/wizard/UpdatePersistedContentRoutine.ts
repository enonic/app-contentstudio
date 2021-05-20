import * as Q from 'q';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {UpdateContentRequest} from '../resource/UpdateContentRequest';
import {CreatePageRequest} from './CreatePageRequest';
import {DeletePageRequest} from './DeletePageRequest';
import {UpdatePageRequest} from '../resource/UpdatePageRequest';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {Flow, RoutineContext} from './Flow';
import {Content} from '../content/Content';
import {Workflow} from 'lib-admin-ui/content/Workflow';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {Page} from '../page/Page';

export class UpdatePersistedContentRoutine
    extends Flow {

    private readonly persistedContent: Content;

    private readonly viewedContent: Content;

    private requireValid: boolean;

    private workflowState: WorkflowState;

    constructor(thisOfProducer: any, persistedContent: Content, viewedContent: Content) {
        super(thisOfProducer);
        this.persistedContent = persistedContent;
        this.viewedContent = viewedContent;
    }

    public execute(): Q.Promise<RoutineContext> {
        let context: RoutineContext = new RoutineContext();
        context.content = this.persistedContent;
        return this.doExecute(context);
    }

    doExecuteNext(context: RoutineContext): Q.Promise<RoutineContext> {
        let promise: Q.Promise<void>;

        const isPageChanged: boolean = this.hasPageChanged();

        if (isPageChanged) {
            this.workflowState = WorkflowState.IN_PROGRESS;
        }

        const isContentChanged: boolean = this.hasContentChanged();

        if (isContentChanged || this.hasNamesChanged()) {
            promise = this.doHandleUpdateContent(context, isContentChanged);
        } else {
            promise = Q(null);
        }

        if (isPageChanged) {
            promise = promise.then(this.doHandlePage.bind(this, context));
        }

        return promise.then(() => {
            return context;
        });
    }

    private doHandleUpdateContent(context: RoutineContext, markUpdated: boolean = true): Q.Promise<void> {
        return this.produceUpdateContentRequest(this.viewedContent).sendAndParse().then(
            (content: Content): void => {

                // NB: reloading the page because it may use any changed data
                context.pageUpdated = true;

                if (markUpdated) {
                    context.dataUpdated = true;
                }
                context.content = content;
            });
    }

    private doHandlePage(context: RoutineContext): Q.Promise<void> {
        const pageCUDRequest: PageCUDRequest = this.producePageCUDRequest(context.content, this.viewedContent);

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
               !ObjectHelper.dateEquals(persisted.getPublishFromTime(), viewed.getPublishFromTime()) ||
               !ObjectHelper.dateEquals(persisted.getPublishToTime(), viewed.getPublishToTime()) ||
               !persisted.getPermissions().equals(viewed.getPermissions()) ||
               persisted.isInheritPermissionsEnabled() !== viewed.isInheritPermissionsEnabled() ||
               persisted.isOverwritePermissionsEnabled() !== viewed.isOverwritePermissionsEnabled();
    }

    private isWorkflowChanged(): boolean {
        return this.workflowState !== this.persistedContent.getWorkflow().getState();
    }

    private hasPageChanged(): boolean {
        const persistedPage: Page = this.persistedContent.getPage();
        const viewedPage: Page = this.viewedContent.getPage();

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

    private produceUpdateContentRequest(viewedContent: Content): UpdateContentRequest {
        const workflow: Workflow = viewedContent.getWorkflow().newBuilder().setState(this.workflowState).build();

        return UpdateContentRequest.create(viewedContent).setRequireValid(this.requireValid).setWorkflow(workflow);
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
