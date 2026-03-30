import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {Checkbox, Combobox, Listbox, useCombobox} from '@enonic/ui';
import {type ReactElement} from 'react';
import {ContentTypeFilterItemView} from './ContentTypeFilterItemView';

type ContentTypeFilterComboboxListProps = {
    items: ContentTypeSummary[];
};

const COMPONENT_NAME = 'ContentTypeFilterComboboxList';

export const ContentTypeFilterComboboxList = ({items}: ContentTypeFilterComboboxListProps): ReactElement => {
    const {selection, selectionMode} = useCombobox();

    return (
        <Combobox.ListContent className="max-h-60 rounded-sm">
            {items.map((contentType) => {
                const key = contentType.getContentTypeName().toString();

                return (
                    <Listbox.Item key={key} value={key}>
                        <ContentTypeFilterItemView contentType={contentType} />
                        {selectionMode !== 'single' && (
                            <Checkbox tabIndex={-1} checked={selection.has(key)} onClick={(event) => event.preventDefault()} />
                        )}
                    </Listbox.Item>
                );
            })}
        </Combobox.ListContent>
    );
};

ContentTypeFilterComboboxList.displayName = COMPONENT_NAME;
