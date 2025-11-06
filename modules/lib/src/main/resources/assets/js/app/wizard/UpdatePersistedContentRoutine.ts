import Q from 'q';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {UpdateContentRequest} from '../resource/UpdateContentRequest';
import {CreatePageRequest} from './CreatePageRequest';
import {DeletePageRequest} from './DeletePageRequest';
import {UpdatePageRequest} from '../resource/UpdatePageRequest';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {Flow, RoutineContext} from './Flow';
import {Content} from '../content/Content';
import {Page} from '../page/Page';
import {WorkflowState} from '../content/WorkflowState';
import {Workflow} from '../content/Workflow';
import {ContentWizardPanel} from './ContentWizardPanel';
import {ContentDiffHelper} from '../util/ContentDiffHelper';

export class UpdatePersistedContentRoutine
    extends Flow {

    private readonly persistedContent: Content;

    private readonly viewedContent: Content;

    private requireValid: boolean;

    private workflowState: WorkflowState;

    constructor(thisOfProducer: ContentWizardPanel, persistedContent: Content, viewedContent: Content) {
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
        const isContentChanged: boolean = this.hasContentChanged();

        if (isContentChanged || this.hasNamesChanged()) {
            promise = this.doHandleUpdateContent(context, isContentChanged);
        } else {
            promise = Q();
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

        if (pageCUDRequest == null) {
            return Q();
        }

        return pageCUDRequest.sendAndParse()
            .then((content: Content): void => {
                context.content = content;
                context.pageUpdated = true;
            });
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
               !ContentDiffHelper.dataEquals(persisted.getContentData(), viewed.getContentData()) ||
               !ContentDiffHelper.mixinsEquals(persisted.getMixins(), viewed.getMixins()) ||
               !ObjectHelper.equals(persisted.getOwner(), viewed.getOwner()) ||
               persisted.getLanguage() !== viewed.getLanguage() ||
               !ObjectHelper.dateEquals(persisted.getPublishFromTime(), viewed.getPublishFromTime()) ||
               !ObjectHelper.dateEquals(persisted.getPublishToTime(), viewed.getPublishToTime()) ||
               !persisted.getPermissions().equals(viewed.getPermissions());
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
                .setFragment(viewedPage.getFragment());
        } else if (persistedContent.isPage() && viewedContent.isPage()) {
            const viewedPage = viewedContent.getPage();
            return new UpdatePageRequest(persistedContent.getContentId())
                .setController((viewedPage.getController()))
                .setPageTemplateKey((viewedPage.getTemplate()))
                .setConfig(viewedPage.getConfig())
                .setRegions(viewedPage.getRegions())
                .setFragment(viewedPage.getFragment());
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
