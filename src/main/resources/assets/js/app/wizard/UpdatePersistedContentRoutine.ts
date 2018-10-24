import {UpdateContentRequest} from '../resource/UpdateContentRequest';
import {CreatePageRequest} from './CreatePageRequest';
import {DeletePageRequest} from './DeletePageRequest';
import {UpdatePageRequest} from '../resource/UpdatePageRequest';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {Flow, RoutineContext} from './Flow';
import {Content} from '../content/Content';

type Producer = { (content: Content, viewedContent: Content): UpdateContentRequest; };

export class UpdatePersistedContentRoutine
    extends Flow<Content> {

    private persistedContent: Content;

    private viewedContent: Content;

    private updateContentRequestProducer: Producer;

    private doneHandledContent: boolean = false;

    private doneHandledPage: boolean = false;

    constructor(thisOfProducer: any, persistedContent: Content, viewedContent: Content) {
        super(thisOfProducer);
        this.persistedContent = persistedContent;
        this.viewedContent = viewedContent;
    }

    public setUpdateContentRequestProducer(producer: Producer): UpdatePersistedContentRoutine {
        this.updateContentRequestProducer = producer;
        return this;
    }

    public execute(): wemQ.Promise<Content> {

        let context = new RoutineContext();
        context.content = this.persistedContent;
        return this.doExecute(context);
    }

    doExecuteNext(context: RoutineContext): wemQ.Promise<Content> {

        if (!this.doneHandledContent) {

            return this.doHandleUpdateContent(context).then(() => {

                this.doneHandledContent = true;
                return this.doExecuteNext(context);

            });
        } else if (!this.doneHandledPage) {

            return this.doHandlePage(context).then(() => {

                this.doneHandledPage = true;
                return this.doExecuteNext(context);

            });
        } else {

            return wemQ(context.content);
        }
    }

    private doHandleUpdateContent(context: RoutineContext): wemQ.Promise<void> {

        return this.updateContentRequestProducer.call(this.getThisOfProducer(), context.content, this.viewedContent).sendAndParse().then(
            (content: Content): void => {

                context.content = content;

            });
    }

    private doHandlePage(context: RoutineContext): wemQ.Promise<void> {

        let pageCUDRequest = this.producePageCUDRequest(context.content, this.viewedContent);

        if (pageCUDRequest != null) {
            return pageCUDRequest
                .sendAndParse().then((content: Content): void => {

                    context.content = content;

                });
        } else {
            let deferred = wemQ.defer<void>();
            deferred.resolve(null);
            return deferred.promise;
        }
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

}
