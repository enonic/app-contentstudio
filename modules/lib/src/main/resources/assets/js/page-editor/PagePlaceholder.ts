import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {PagePlaceholderInfoBlock} from './PagePlaceholderInfoBlock';
import {PageView} from './PageView';
import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {PageDescriptorDropdown} from '../app/wizard/page/contextwindow/inspect/page/PageDescriptorDropdown';
import {GetContentTypeByNameRequest} from '../app/resource/GetContentTypeByNameRequest';
import {ContentType} from '../app/inputtype/schema/ContentType';
import {LoadedDataEvent} from 'lib-admin-ui/util/loader/event/LoadedDataEvent';
import {Descriptor} from '../app/page/Descriptor';

export class PagePlaceholder
    extends ItemViewPlaceholder {

    private pageDescriptorPlaceholder: DivEl;

    private infoBlock: PagePlaceholderInfoBlock;

    private controllerDropdown: PageDescriptorDropdown;

    private pageView: PageView;

    constructor(pageView: PageView) {
        super();

        this.pageView = pageView;

        this.initElements();
        this.initListeners();

        this.controllerDropdown.hide();
        this.controllerDropdown.load();
    }

    private initListeners() {
        this.controllerDropdown.onLoadedData(this.dataLoadedHandler);

        this.controllerDropdown.onClicked((event: MouseEvent) => {
            this.controllerDropdown.giveFocus();
            event.stopPropagation();
        });
    }

    private initElements() {
        this.infoBlock = new PagePlaceholderInfoBlock();
        this.controllerDropdown = new PageDescriptorDropdown(this.pageView.getLiveEditModel());
        this.pageDescriptorPlaceholder = new DivEl('page-descriptor-placeholder', StyleHelper.getCurrentPrefix());
    }

    private dataLoadedHandler: (event: LoadedDataEvent<Descriptor>) => void = (event: LoadedDataEvent<Descriptor>) => {
        if (event.getData().length > 0) {
            this.controllerDropdown.show();
            let content = this.pageView.getLiveEditModel().getContent();
            if (!content.isPageTemplate()) {
                new GetContentTypeByNameRequest(content.getType()).sendAndParse().then((contentType: ContentType) => {
                    this.infoBlock.setTextForContent(contentType.getDisplayName());
                }).catch((reason) => {
                    this.infoBlock.setTextForContent(content.getType().toString());
                    DefaultErrorHandler.handle(reason);
                }).done();
            } else {
                this.infoBlock.toggleHeader(true);
            }
            this.infoBlock.removeClass('empty');
        } else {
            this.controllerDropdown.hide();
            this.infoBlock.setEmptyText();
            this.infoBlock.addClass('empty');
        }
    };

    remove() {
        this.controllerDropdown.unLoadedData(this.dataLoadedHandler);
        return super.remove();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClassEx('page-placeholder');
            this.addClass('icon-insert-template');
            this.controllerDropdown.addClassEx('page-descriptor-dropdown');

            this.pageDescriptorPlaceholder.appendChild(this.infoBlock);
            this.pageDescriptorPlaceholder.appendChild(this.controllerDropdown);
            this.appendChild(this.pageDescriptorPlaceholder);

            return rendered;
        });
    }
}
