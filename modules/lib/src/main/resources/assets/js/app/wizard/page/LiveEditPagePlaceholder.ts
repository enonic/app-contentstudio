import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Descriptor} from '../../page/Descriptor';
import {ContentId} from '../../content/ContentId';
import {PagePlaceholderInfoBlock} from '../../../page-editor/PagePlaceholderInfoBlock';
import {PageDescriptorDropdown} from './contextwindow/inspect/page/PageDescriptorDropdown';
import {ContentType} from '../../inputtype/schema/ContentType';
import {PageEventsManager} from '../PageEventsManager';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class LiveEditPagePlaceholder
    extends DivEl {

    private contentId: ContentId;

    private contentType: ContentType;

    private pagePlaceholderInfoBlock?: PagePlaceholderInfoBlock;

    private controllerDropdown?: PageDescriptorDropdown;

    private enabled: boolean = true;

    constructor(contentId?: ContentId, type?: ContentType) {
        super('page-placeholder');
        this.addClass('icon-insert-template');

        this.contentId = contentId;
        this.contentType = type;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.pagePlaceholderInfoBlock = new PagePlaceholderInfoBlock(this.contentType);

            this.controllerDropdown = this.createControllerDropdown(this.contentId);
            this.appendChildren<Element>(this.pagePlaceholderInfoBlock, this.controllerDropdown);
            return rendered;
        });
    }

    private createControllerDropdown(contentId?: ContentId): PageDescriptorDropdown {
        const controllerDropdown: PageDescriptorDropdown = new PageDescriptorDropdown(contentId);
        controllerDropdown.setEnabled(this.enabled);
        controllerDropdown.addClass('page-placeholder-dropdown');

        controllerDropdown.onSelectionChanged((selectionChange: SelectionChange<Descriptor>) => {
            if (selectionChange.selected?.length > 0) {
                PageEventsManager.get().notifyPageControllerSetRequested(selectionChange.selected[0].getKey());
            }
        });

        return controllerDropdown;
    }

    setContentType(contentType: ContentType): void {
        this.contentType = contentType;
        if (this.pagePlaceholderInfoBlock) {
            this.pagePlaceholderInfoBlock.setTextForContent(contentType.getDisplayName());
        }
    }

    setContentId(contentId: ContentId): void {
        this.contentId = contentId;
        if (this.controllerDropdown) {
            this.controllerDropdown?.setContentId(contentId);
        }
    }

    deselectOptions(): void {
        this.controllerDropdown?.reset();
    }

    setReloadNeeded(): void {
        this.controllerDropdown?.setLoadWhenListShown();
    }

    setEnabled(value: boolean): void {
        this.controllerDropdown?.setEnabled(value);
        this.enabled = value;
    }

}
