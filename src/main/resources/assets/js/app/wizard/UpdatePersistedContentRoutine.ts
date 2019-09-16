import {UpdateContentRequest} from '../resource/UpdateContentRequest';
import {CreatePageRequest} from './CreatePageRequest';
import {DeletePageRequest} from './DeletePageRequest';
import {UpdatePageRequest} from '../resource/UpdatePageRequest';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {Flow, RoutineContext} from './Flow';
import {Content} from '../content/Content';

type Producer = { (content: Content, viewedContent: Content): UpdateContentRequest; };

export class UpdatePersistedContentRoutine
    extends Flow {

    private persistedContent: Content;

    private viewedContent: Content;

    private updateContentRequestProducer: Producer;

    constructor(thisOfProducer: any, persistedContent: Content, viewedContent: Content) {
        super(thisOfProducer);
        this.persistedContent = persistedContent;
        this.viewedContent = viewedContent;
    }

    public setUpdateContentRequestProducer(producer: Producer): UpdatePersistedContentRoutine {
        this.updateContentRequestProducer = producer;
        return this;
    }

    public execute(): wemQ.Promise<RoutineContext> {

        let context = new RoutineContext();
        context.content = this.persistedContent;
        return this.doExecute(context);
    }

    doExecuteNext(context: RoutineContext): wemQ.Promise<RoutineContext> {

        const promises = [];

        if (this.hasContentChanged(this.persistedContent, this.viewedContent)) {
            promises.push(this.doHandleUpdateContent(context));
        }

        if (this.hasPageChanged(this.persistedContent, this.viewedContent)) {
            promises.push(this.doHandlePage(context));
        }

        return wemQ.all(promises).then(() => {
            return context;
        });
    }

    private doHandleUpdateContent(context: RoutineContext): wemQ.Promise<void> {

        return this.updateContentRequestProducer.call(this.getThisOfProducer(), context.content, this.viewedContent).sendAndParse().then(
            (content: Content): void => {

                context.content = content;
                context.dataUpdated = true;

            });
    }

    private doHandlePage(context: RoutineContext): wemQ.Promise<void> {

        let pageCUDRequest = this.producePageCUDRequest(context.content, this.viewedContent);

        if (pageCUDRequest != null) {
            return pageCUDRequest
                .sendAndParse().then((content: Content): void => {

                    context.content = content;
                    context.pageUpdated = true;

                });
        } else {
            let deferred = wemQ.defer<void>();
            deferred.resolve(null);
            return deferred.promise;
        }
    }

    private hasContentChanged(persisted: Content, viewed: Content): boolean {
        return !persisted.getContentData().equals(viewed.getContentData());
    }

    private hasPageChanged(persisted: Content, viewed: Content): boolean {
        return !persisted.getPage() && !!viewed.getPage() || persisted.getPage() && !persisted.getPage().equals(viewed.getPage());
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
