import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {GetComponentDescriptorsRequest} from '../../resource/GetComponentDescriptorsRequest';
import {PageComponentType} from '../../page/region/PageComponentType';
import {Descriptor} from '../../page/Descriptor';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentId} from '../../content/ContentId';
import * as Q from 'q';
import {PagePlaceholderInfoBlock} from '../../../page-editor/PagePlaceholderInfoBlock';
import {PageDescriptorDropdown} from './contextwindow/inspect/page/PageDescriptorDropdown';
import {OptionSelectedEvent} from '@enonic/lib-admin-ui/ui/selector/OptionSelectedEvent';
import {ContentType} from '../../inputtype/schema/ContentType';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';

export class LiveEditPagePlaceholder
    extends DivEl {

    private readonly contentId: ContentId;

    private readonly contentType: ContentType;

    private pagePlaceholderInfoBlock?: PagePlaceholderInfoBlock;

    private controllerDropdown?: PageDescriptorDropdown;

    private controllerSelectedListeners: { (descriptor: Descriptor): void; }[] = [];

    private enabled: boolean = true;

    constructor(contentId: ContentId, type: ContentType) {
        super('page-placeholder');

        this.contentId = contentId;
        this.contentType = type;
    }

    loadControllers(): Q.Promise<Descriptor[]> {
        return this.createControllersRequest().sendAndParse().then((descriptors: Descriptor[]) => {
            this.handleControllersLoaded(descriptors);
            return Q.resolve(descriptors);
        }).catch((err) => {
            this.handleControllersLoaded([]);
            DefaultErrorHandler.handle(err);
            return Q.resolve([]);
        });
    }

    private handleControllersLoaded(descriptors: Descriptor[]): void {
        if (!this.pagePlaceholderInfoBlock) {
            this.pagePlaceholderInfoBlock = new PagePlaceholderInfoBlock();
            this.appendChild(this.pagePlaceholderInfoBlock);
        }

        if (descriptors.length > 0) {
            this.handleHasControllers();
        } else {
            this.handleNoControllers();
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
        this.controllerDropdown.hide();
    }

    private createControllersRequest(): GetComponentDescriptorsRequest {
        const req: GetComponentDescriptorsRequest = new GetComponentDescriptorsRequest();
        req.setComponentType(PageComponentType.get());
        req.setContentId(this.contentId);
        return req;
    }

    private createControllerDropdown(): PageDescriptorDropdown {
        const controllerDropdown: PageDescriptorDropdown = new PageDescriptorDropdown(this.contentId);
        controllerDropdown.setEnabled(this.enabled);
        controllerDropdown.addClass('page-placeholder-dropdown');

        controllerDropdown.onOptionSelected((event: OptionSelectedEvent<Descriptor>) => {
            this.notifyControllerSelected(event.getOption().getDisplayValue());
        });

        return controllerDropdown;
    }

    hasSelectedController(): boolean {
        return this.controllerDropdown?.hasSelectedOption();
    }

    getSelectedController(): Descriptor {
        return this.controllerDropdown?.getSelectedOption()?.getDisplayValue();
    }

    deselectOptions(): void {
        this.controllerDropdown?.deselectOptions();
    }

    selectController(descriptor: Descriptor, silent: boolean = false): void {
        if (!this.controllerDropdown || !descriptor)  {
            return;
        }

        const optionToSelect: Option<Descriptor> = this.controllerDropdown.createOption(descriptor);
        this.controllerDropdown.selectOption(optionToSelect, silent);
    }

    setErrorTexts(message: string, description: string): void {
        this.pagePlaceholderInfoBlock.setErrorTexts(message, description);
    }

    onControllerSelected(listener: { (descriptor: Descriptor): void; }) {
        this.controllerSelectedListeners.push(listener);
    }

    unControllerSelected(listener: { (descriptor: Descriptor): void; }) {
        this.controllerSelectedListeners = this.controllerSelectedListeners.filter((curr) => (curr !== listener));
    }

    private notifyControllerSelected(descriptor: Descriptor) {
        this.controllerSelectedListeners.forEach((listener) => listener(descriptor));
    }

    setEnabled(value: boolean): void {
        this.controllerDropdown?.setEnabled(value);
        this.enabled = value;
    }
}
