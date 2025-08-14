import {CheckedValueInput, ValidityStatus, ValueValidationState} from '../../inputtype/text/CheckedValueInput';
import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentPath} from '../../content/ContentPath';
import {ContentExistsByPathRequest} from '../../resource/ContentExistsByPathRequest';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class RenameInput
    extends CheckedValueInput {

    private initialPath: ContentPath;

    constructor() {
        super('rename-input');
    }

    protected getLabelText(): string {
        return i18n('dialog.rename.label');
    }

    protected validate(value: string): Q.Promise<ValueValidationState> {
        if (StringHelper.isBlank(value) || value === this.initialPath.getName()) {
            return Q.resolve(new ValueValidationState(ValidityStatus.INVALID));
        }

        return new ContentExistsByPathRequest(this.getNewPath().toString()).sendAndParse().then((exists: boolean) => {
            if (exists) {
                return new ValueValidationState(ValidityStatus.INVALID, i18n('path.not.available'));
            }

            return new ValueValidationState(ValidityStatus.VALID, i18n('path.available'));
        });
    }

    setInitialPath(value: ContentPath): RenameInput {
        this.initialPath = value;
        this.setValue(this.initialPath.getName(), true);
        return this;
    }

    private getNewPath(): ContentPath {
        return ContentPath.create().fromParent(this.initialPath.getParentPath(), this.getValue()).build();
    }

}
