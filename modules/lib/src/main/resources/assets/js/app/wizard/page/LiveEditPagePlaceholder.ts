import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Descriptor} from '../../page/Descriptor';
import {ContentId} from '../../content/ContentId';
import {PagePlaceholderInfoBlock} from '../../../page-editor/PagePlaceholderInfoBlock';
import {PageDescriptorDropdown} from './contextwindow/inspect/page/PageDescriptorDropdown';
import {OptionSelectedEvent} from '@enonic/lib-admin-ui/ui/selector/OptionSelectedEvent';
import {ContentType} from '../../inputtype/schema/ContentType';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PageEventsManager} from '../PageEventsManager';

export class LiveEditPagePlaceholder
    extends DivEl {

    private readonly contentId: ContentId;

    private readonly contentType: ContentType;

    private pagePlaceholderInfoBlock?: PagePlaceholderInfoBlock;

    private controllerDropdown?: PageDescriptorDropdown;

    private enabled: boolean = true;

    constructor(contentId: ContentId, type: ContentType) {
        super('page-placeholder');

        this.contentId = contentId;
        this.contentType = type;
    }

    setHasControllersMode(hasControllers: boolean): void {
        this.initPagePlaceholderInfoBlock();
        this.removeClass('page-not-renderable');

        if (hasControllers) {
            this.handleHasControllers();
        } else {
            this.handleNoControllers();
        }
    }

    private initPagePlaceholderInfoBlock(): void {
        if (!this.pagePlaceholderInfoBlock) {
            this.pagePlaceholderInfoBlock = new PagePlaceholderInfoBlock();
            this.appendChild(this.pagePlaceholderInfoBlock);
        }
    }

    private handleHasControllers(): void {
        if (!this.controllerDropdown) {
            this.controllerDropdown = this.createControllerDropdown();
            this.appendChild(this.controllerDropdown);
        }

        this.addClass('icon-insert-template');
        this.pagePlaceholderInfoBlock.setTextForContent(this.contentType.getDisplayName());
        this.controllerDropdown.show();
    }

    private handleNoControllers(): void {
        this.removeClass('icon-insert-template');
        this.pagePlaceholderInfoBlock.setEmptyText();
        this.controllerDropdown?.hide();
    }

    private createControllerDropdown(): PageDescriptorDropdown {
        const controllerDropdown: PageDescriptorDropdown = new PageDescriptorDropdown(this.contentId);
        controllerDropdown.setEnabled(this.enabled);
        controllerDropdown.addClass('page-placeholder-dropdown');

        controllerDropdown.onOptionSelected((event: OptionSelectedEvent<Descriptor>) => {
            PageEventsManager.get().notifyPageControllerSetRequested(event.getOption().getDisplayValue().getKey());
        });

        return controllerDropdown;
    }

    deselectOptions(): void {
        this.controllerDropdown?.deselectOptions();
    }

    setErrorTexts(message: string, description: string): void {
        this.pagePlaceholderInfoBlock.setErrorTexts(message, description);
    }

    setEnabled(value: boolean): void {
        this.controllerDropdown?.setEnabled(value);
        this.enabled = value;
    }

    setPageIsNotRenderableMode(): void {
        this.initPagePlaceholderInfoBlock();
        this.removeClass('icon-insert-template');
        this.controllerDropdown?.hide();
        this.controllerDropdown?.deselectOptions(true);
        this.setErrorTexts(i18n('field.preview.failed'), i18n('field.preview.failed.description'));
        this.addClass('page-not-renderable');
    }
}
