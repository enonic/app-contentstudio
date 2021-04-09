import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {RichComboBox} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {BaseInputTypeManagingAdd} from 'lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {ContentInputTypeViewContext} from '../../ContentInputTypeViewContext';
import {ContentServerEventsHandler} from '../../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import {ContentServerChangeItem} from '../../../event/ContentServerChangeItem';
import {ValueType} from 'lib-admin-ui/data/ValueType';

export class ContentInputTypeManagingAdd<RAW_VALUE_TYPE>
    extends BaseInputTypeManagingAdd {

    protected config: ContentInputTypeViewContext;

    protected relationshipType: string;

    protected allowedContentTypes: string[];

    protected allowedContentPaths: string[];

    protected contentDeletedListener: (paths: ContentServerChangeItem[], pending?: boolean) => void;

    constructor(className?: string, config?: ContentInputTypeViewContext) {
        super(className);
        this.addClass('input-type-view');
        this.config = config;

        this.readConfig(config.inputConfig);

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

    protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        let relationshipTypeConfig = inputConfig['relationshipType'] ? inputConfig['relationshipType'][0] : {};
        this.relationshipType = relationshipTypeConfig['value'];

        let allowContentTypeConfig = inputConfig['allowContentType'] || [];
        this.allowedContentTypes = allowContentTypeConfig.map((cfg) => cfg['value']).filter((val) => !!val);

        let allowContentPathConfig = inputConfig['allowPath'] || [];
        this.allowedContentPaths =
            allowContentPathConfig.length > 0 ? allowContentPathConfig.map((cfg) => cfg['value']).filter((val) => !!val) :
            (!StringHelper.isBlank(this.getDefaultAllowPath())
             ? [this.getDefaultAllowPath()]
             : []);
    }

    protected getDefaultAllowPath(): string {
        return '';
    }

    getValueType(): ValueType {
        return null;
    }

    private handleContentUpdatedEvent() {
        const contentUpdatedOrMovedListener = (statuses: ContentSummaryAndCompareStatus[], oldPaths?: ContentPath[]) => {

            if (this.getSelectedOptions().length === 0) {
                return;
            }

            statuses.forEach((status, index) => {
                let selectedOption;
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

        let handler = ContentServerEventsHandler.getInstance();
        handler.onContentMoved(contentUpdatedOrMovedListener);
        handler.onContentRenamed(contentUpdatedOrMovedListener);
        handler.onContentUpdated(contentUpdatedOrMovedListener);

        this.onRemoved(() => {
            handler.unContentUpdated(contentUpdatedOrMovedListener);
            handler.unContentRenamed(contentUpdatedOrMovedListener);
            handler.unContentMoved(contentUpdatedOrMovedListener);
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
