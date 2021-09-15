import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {RichComboBox} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ContentInputTypeViewContext} from '../../ContentInputTypeViewContext';
import {ContentServerEventsHandler} from '../../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import {ContentServerChangeItem} from '../../../event/ContentServerChangeItem';
import {ValueType} from 'lib-admin-ui/data/ValueType';
import {BaseInputTypeManagingAdd} from 'lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {ContentPath} from '../../../content/ContentPath';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ApplicationBasedName} from 'lib-admin-ui/application/ApplicationBasedName';
import {FormItem} from 'lib-admin-ui/form/FormItem';

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

        this.readConfig();

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

    protected readConfig(): void {
        const inputConfig: { [element: string]: { [name: string]: string }[]; } = this.config.inputConfig;
        const applicationKey: ApplicationKey = (<FormItem>this.config.input).getApplicationKey();
        const relationshipTypeConfig = inputConfig['relationshipType'] ? inputConfig['relationshipType'][0] : {};
        this.relationshipType = relationshipTypeConfig['value'];

        const allowContentTypeConfig = inputConfig['allowContentType'] || [];
        this.allowedContentTypes = allowContentTypeConfig
            .map((cfg) => this.prependApplicationName(applicationKey, cfg['value']))
            .filter((val) => !!val);

        const allowContentPathConfig = inputConfig['allowPath'] || [];
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
