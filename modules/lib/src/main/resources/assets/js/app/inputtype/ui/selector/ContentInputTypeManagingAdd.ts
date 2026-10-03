import { isBlank } from '../../../../v6/shared/lib/format/isBlank';
import { type SelectedOption } from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import { type SelectedOptionsView } from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import { type ContentInputTypeViewContext } from '../../ContentInputTypeViewContext';
import { type ValueType } from '@enonic/lib-admin-ui/data/ValueType';
import { BaseInputTypeManagingAdd } from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import { type ContentPath } from '../../../content/ContentPath';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { ApplicationBasedName } from '@enonic/lib-admin-ui/application/ApplicationBasedName';
import { type FormItem } from '@enonic/lib-admin-ui/form/FormItem';
import { RawInputConfig } from '@enonic/lib-admin-ui/form/Input';

export abstract class ContentInputTypeManagingAdd<RAW_VALUE_TYPE> extends BaseInputTypeManagingAdd {
    declare protected context: ContentInputTypeViewContext;

    protected allowedContentTypes: string[];

    protected allowedContentPaths: string[];

    constructor(context: ContentInputTypeViewContext, className?: string) {
        super(context, className);
    }

    protected getContentPath(_raw: RAW_VALUE_TYPE): ContentPath {
        throw new Error('Should be overridden by inheritor');
    }

    protected getSelectedOptions(): SelectedOption<RAW_VALUE_TYPE>[] {
        return this.getSelectedOptionsView().getSelectedOptions();
    }

    protected abstract getSelectedOptionsView(): SelectedOptionsView<RAW_VALUE_TYPE>;

    private prependApplicationName(applicationKey: ApplicationKey, name: string): string {
        if (!applicationKey) {
            return name;
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
            return name;
        }

        return new ApplicationBasedName(applicationKey, name).toString();
    }

    private getAllowedContentTypes(inputConfig: RawInputConfig): string[] {
        const applicationKey: ApplicationKey = ApplicationKey.fromString(
            (this.context.input as FormItem).getApplicationKey(),
        );
        const allowContentTypeConfig = inputConfig['allowContentType'] || [];
        return allowContentTypeConfig
            .map((cfg) => this.prependApplicationName(applicationKey, cfg['value'] as string))
            .filter((val) => !!val);
    }

    private getAllowedContentPaths(inputConfig: RawInputConfig): string[] {
        const allowContentPathConfig = inputConfig['allowPath'] || [];
        if (allowContentPathConfig.length > 0) {
            return allowContentPathConfig.map((cfg) => cfg['value'] as string).filter((val) => !!val);
        }
        if (!isBlank(this.getDefaultAllowPath())) {
            return [this.getDefaultAllowPath()];
        }

        return [];
    }

    protected readInputConfig(): void {
        const inputConfig: RawInputConfig = this.context.inputConfig;

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
