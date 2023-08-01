import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {RichComboBox} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ContentInputTypeViewContext} from '../../ContentInputTypeViewContext';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {BaseInputTypeManagingAdd} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {ContentPath} from '../../../content/ContentPath';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationBasedName} from '@enonic/lib-admin-ui/application/ApplicationBasedName';
import {FormItem} from '@enonic/lib-admin-ui/form/FormItem';

export class ContentInputTypeManagingAdd<RAW_VALUE_TYPE>
    extends BaseInputTypeManagingAdd {

    protected context: ContentInputTypeViewContext;

    protected relationshipType: string;

    protected allowedContentTypes: string[];

    protected allowedContentPaths: string[];

    constructor(context: ContentInputTypeViewContext, className?: string) {
        super(context, className);
    }

    protected getContentComboBox(): RichComboBox<RAW_VALUE_TYPE> {
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

    private getRelationShipType(inputConfig: Record<string, Record<string, string>[]>): string {
        const relationshipTypeConfig = inputConfig['relationshipType'] ? inputConfig['relationshipType'][0] : {};
        return relationshipTypeConfig['value'];
    }

    private getAllowedContentTypes(inputConfig: Record<string, Record<string, string>[]>): string[] {
        const applicationKey: ApplicationKey = (this.context.input as FormItem).getApplicationKey();
        const allowContentTypeConfig = inputConfig['allowContentType'] || [];
        return allowContentTypeConfig
            .map((cfg) => this.prependApplicationName(applicationKey, cfg['value']))
            .filter((val) => !!val);
    }

    private getAllowedContentPaths(inputConfig: Record<string, Record<string, string>[]>): string[] {
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
        const inputConfig: Record<string, Record<string, string>[]> = this.context.inputConfig;

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
}
