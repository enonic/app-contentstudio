import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {RichComboBox} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ContentInputTypeViewContext} from '../../ContentInputTypeViewContext';
import {ContentServerEventsHandler} from '../../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import {ContentServerChangeItem} from '../../../event/ContentServerChangeItem';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {BaseInputTypeManagingAdd} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {ContentPath} from '../../../content/ContentPath';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationBasedName} from '@enonic/lib-admin-ui/application/ApplicationBasedName';
import {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {MovedContentItem} from '../../../browse/MovedContentItem';

export class ContentInputTypeManagingAdd<RAW_VALUE_TYPE>
    extends BaseInputTypeManagingAdd {

    protected context: ContentInputTypeViewContext;

    protected relationshipType: string;

    protected allowedContentTypes: string[];

    protected allowedContentPaths: string[];

    protected contentDeletedListener: (paths: ContentServerChangeItem[], pending?: boolean) => void;

    constructor(context: ContentInputTypeViewContext, className?: string) {
        super(context, className);

        this.handleContentDeletedEvent();
        this.handleContentUpdatedEvent();
    }

    protected getContentComboBox(): RichComboBox<any> {
        throw new Error('Should be overridden by inheritor');
    }

    protected getContentPath(_raw: RAW_VALUE_TYPE): ContentPath {
        throw new Error('Should be overridden by inheritor');
    }

    protected getSelectedOptions(): SelectedOption<RAW_VALUE_TYPE>[] {
        return this.getSelectedOptionsView().getSelectedOptions();
    }

    protected getSelectedOptionsView(): SelectedOptionsView<RAW_VALUE_TYPE> {
        return this.getContentComboBox().getSelectedOptionView();
    }

    private prependApplicationName(applicationKey: ApplicationKey, name: string): string {
        if (!applicationKey) {
            return name;
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
            return name;
        }

        return new ApplicationBasedName(applicationKey, name).toString();
    }

    private getRelationShipType(inputConfig: { [element: string]: { [name: string]: string }[]; }): string {
        const relationshipTypeConfig = inputConfig['relationshipType'] ? inputConfig['relationshipType'][0] : {};
        return relationshipTypeConfig['value'];
    }

    private getAllowedContentTypes(inputConfig: { [element: string]: { [name: string]: string }[]; }): string[] {
        const applicationKey: ApplicationKey = (<FormItem>this.context.input).getApplicationKey();
        const allowContentTypeConfig = inputConfig['allowContentType'] || [];
        return allowContentTypeConfig
            .map((cfg) => this.prependApplicationName(applicationKey, cfg['value']))
            .filter((val) => !!val);
    }

    private getAllowedContentPaths(inputConfig: { [element: string]: { [name: string]: string }[]; }): string[] {
        const allowContentPathConfig = inputConfig['allowPath'] || [];
        if (allowContentPathConfig.length > 0) {
            return allowContentPathConfig
                    .map((cfg) => cfg['value'])
                    .filter((val) => !!val);
        }
        if (!StringHelper.isBlank(this.getDefaultAllowPath())) {
            return [this.getDefaultAllowPath()];
        }

        return [];
    }

    protected readInputConfig(): void {
        const inputConfig: { [element: string]: { [name: string]: string }[]; } = this.context.inputConfig;

        this.relationshipType = this.getRelationShipType(inputConfig);
        this.allowedContentTypes = this.getAllowedContentTypes(inputConfig);
        this.allowedContentPaths = this.getAllowedContentPaths(inputConfig);
    }

    protected getDefaultAllowPath(): string {
        return '';
    }

    getValueType(): ValueType {
        return null;
    }

    private handleContentUpdatedEvent() {
        const contentUpdatedListener = (statuses: ContentSummaryAndCompareStatus[], oldPaths?: ContentPath[]) => {

            if (this.getSelectedOptions().length === 0) {
                return;
            }

            statuses.forEach((status: ContentSummaryAndCompareStatus, index: number) => {
                let selectedOption: SelectedOption<RAW_VALUE_TYPE>;

                if (oldPaths) {
                    selectedOption = this.findSelectedOptionByContentPath(oldPaths[index]);
                } else {
                    selectedOption = this.getSelectedOptionsView().getById(status.getContentId().toString());
                }
                if (selectedOption) {
                    this.getContentComboBox().updateOption(selectedOption.getOption(), status.getContentSummary());
                }
            });
        };

        const contentMovedListener = (movedItems: MovedContentItem[]) => {
            if (this.getSelectedOptions().length === 0) {
                return;
            }

            movedItems.forEach((movedItem: MovedContentItem) => {
                const selectedOption: SelectedOption<RAW_VALUE_TYPE> = this.findSelectedOptionByContentPath(movedItem.oldPath);

                if (selectedOption) {
                    this.getContentComboBox().updateOption(selectedOption.getOption(), movedItem.item.getContentSummary());
                }
            });
        };

        const handler: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();
        handler.onContentMoved(contentMovedListener);
        handler.onContentRenamed(contentUpdatedListener);
        handler.onContentUpdated(contentUpdatedListener);

        this.onRemoved(() => {
            handler.unContentUpdated(contentUpdatedListener);
            handler.unContentRenamed(contentUpdatedListener);
            handler.unContentMoved(contentMovedListener);
        });
    }

    private findSelectedOptionByContentPath(contentPath: ContentPath): SelectedOption<RAW_VALUE_TYPE> {
        let selectedOptions = this.getSelectedOptions();
        for (let i = 0; i < selectedOptions.length; i++) {
            let option = selectedOptions[i];
            if (contentPath.equals(this.getContentPath(option.getOption().getDisplayValue()))) {
                return option;
            }
        }
        return null;
    }

    private handleContentDeletedEvent() {
        this.contentDeletedListener = (paths: ContentServerChangeItem[], pending?: boolean) => {
            if (this.getSelectedOptions().length === 0) {
                return;
            }

            let selectedContentIdsMap: {} = {};
            this.getSelectedOptions().forEach((selectedOption: any) => {
                if (!!selectedOption.getOption().displayValue && !!selectedOption.getOption().displayValue.getContentId()) {
                    selectedContentIdsMap[selectedOption.getOption().displayValue.getContentId().toString()] = '';
                }
            });

            paths.filter(deletedItem => !pending && selectedContentIdsMap.hasOwnProperty(deletedItem.getContentId().toString()))
                .forEach((deletedItem) => {
                    let option = this.getSelectedOptionsView().getById(deletedItem.getContentId().toString());
                    if (option != null) {
                        this.getSelectedOptionsView().removeOption(option.getOption(), false);
                    }
                });
        };

        let handler = ContentServerEventsHandler.getInstance();
        handler.onContentDeleted(this.contentDeletedListener);

        this.onRemoved(() => {
            handler.unContentDeleted(this.contentDeletedListener);
        });
    }
}
