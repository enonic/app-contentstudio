import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PagePlaceholderInfoBlock} from './PagePlaceholderInfoBlock';
import {PageView} from './PageView';
import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {PageDescriptorDropdown} from '../app/wizard/page/contextwindow/inspect/page/PageDescriptorDropdown';
import {GetContentTypeByNameRequest} from '../app/resource/GetContentTypeByNameRequest';
import {ContentType} from '../app/inputtype/schema/ContentType';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {Descriptor} from '../app/page/Descriptor';
import {ContentId} from '../app/content/ContentId';
import {SelectPageDescriptorEvent} from './event/outgoing/manipulation/SelectPageDescriptorEvent';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import * as Q from 'q';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';

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

        this.controllerDropdown.onSelectionChanged((selectionChange: SelectionChange<Descriptor>) => {
            if (selectionChange.selected?.length > 0) {
                const pageDescriptor: Descriptor = selectionChange.selected[0];
                new SelectPageDescriptorEvent(pageDescriptor.getKey().toString()).fire();
            }
        });
    }

    private initElements() {
        this.infoBlock = new PagePlaceholderInfoBlock();
        this.controllerDropdown = new PageDescriptorDropdown(new ContentId(this.pageView.getLiveEditParams().contentId));
        this.pageDescriptorPlaceholder = new DivEl('page-descriptor-placeholder', StyleHelper.getCurrentPrefix());
    }

    private dataLoadedHandler: (event: LoadedDataEvent<Descriptor>) => Q.Promise<void> = (event: LoadedDataEvent<Descriptor>) => {
        if (event.getData().length > 0) {
            this.controllerDropdown.show();
            const type = new ContentTypeName(this.pageView.getLiveEditParams().contentType);
            if (!type.isPageTemplate()) {
                return new GetContentTypeByNameRequest(type).sendAndParse().then((contentType: ContentType) => {
                    this.infoBlock.setTextForContent(contentType.getDisplayName());
                }).catch((reason) => {
                    this.infoBlock.setTextForContent(type.toString());
                    DefaultErrorHandler.handle(reason);
                });
            } else {
                this.infoBlock.toggleHeader(true);
            }
            this.infoBlock.removeClass('empty');
        } else {
            this.controllerDropdown.hide();
            this.infoBlock.setEmptyText();
            this.infoBlock.addClass('empty');
        }

        return Q.resolve();
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
