// Assign to field of the publish or request dialog's second step: a checkbox that, once
// ticked, asks for the users to assign the publish request to.

import { Checkbox } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useId } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { PrincipalSelector, usePrincipalSearch, usePrincipalSelection } from '../../../shared/selectors/principal';
import { setPublishOrRequestAssignChecked, setPublishOrRequestAssignees } from '../../model/commands/fields';
import { $isPublishOrRequestAssignOpen, $publishOrRequestFields } from '../../model/publishOrRequestFields.store';

const PUBLISH_OR_REQUEST_ASSIGN_FIELD_NAME = 'PublishOrRequestAssignField';

export const PublishOrRequestAssignField = (): ReactElement => {
    const { assignChecked } = useStore($publishOrRequestFields, { keys: ['assignChecked'] });
    const isOpen = useStore($isPublishOrRequestAssignOpen);

    const helpId = useId();

    const label = useI18n('dialog.publishOrRequest.assign');
    const helpText = useI18n('dialog.publishOrRequest.assign.help');

    return (
        <div data-component={PUBLISH_OR_REQUEST_ASSIGN_FIELD_NAME} className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
                <Checkbox
                    className="font-semibold"
                    checked={assignChecked}
                    onCheckedChange={(checked) => setPublishOrRequestAssignChecked(checked === true)}
                    label={label}
                    aria-describedby={helpId}
                />
                {/* ? Indented by the box of the checkbox and the gap after it, as the selector below. */}
                <p id={helpId} className="pl-6 text-sm text-subtle">
                    {helpText}
                </p>
            </div>

            {isOpen && <AssigneesSelector />}
        </div>
    );
};

PublishOrRequestAssignField.displayName = PUBLISH_OR_REQUEST_ASSIGN_FIELD_NAME;

// *
// * Internal
// *

// The selector of the assignees. Apart from the field, so the users load only once it shows.
function AssigneesSelector(): ReactElement {
    const { assigneeIds } = useStore($publishOrRequestFields, { keys: ['assigneeIds'] });

    const { options, handleSearchChange } = usePrincipalSearch();
    const selectedOptions = usePrincipalSelection({ principalIds: assigneeIds });

    const assigneesLabel = useI18n('field.assignees');
    const applyLabel = useI18n('action.apply');
    const noResultsLabel = useI18n('dialog.search.result.noResults');

    return (
        <PrincipalSelector
            className="pl-6"
            ariaLabel={assigneesLabel}
            options={options}
            selectedOptions={selectedOptions}
            selection={assigneeIds}
            applyLabel={applyLabel}
            emptyLabel={noResultsLabel}
            onSelectionChange={setPublishOrRequestAssignees}
            onSearchChange={handleSearchChange}
        />
    );
}
