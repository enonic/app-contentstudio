import {ListItem} from '@enonic/ui';
import {type MouseEvent} from 'react';
import {ContentLabel} from '../../../shared/content/ContentLabel';
import {LayerIndicator} from '../../../shared/icons/LayerIndicator';
import {StatusBadge} from '../../../shared/status/StatusBadge';
import {$activeId, setActive} from '../../../store/contentTreeSelection.store';
import {LAYERS_WIDGET_NAME} from '../../../utils/widget/layers';
import {openContextWidget} from '../../context/openContextWidget';
import {type ContentData} from './ContentData';

export type ContentTreeListItemProps = {
    content: ContentData;
    showPath?: boolean;
};

export const ContentTreeListItem = ({content, showPath = false}: ContentTreeListItemProps): React.ReactElement => {
    const {item} = content;
    const isInherited = item.isInherited();
    const isLocalised = isInherited && !item.isDataInherited();

    // ? stopPropagation bypasses the row handler that would clear selection.
    const handleLayersClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if ($activeId.get() !== content.id) {
            setActive(content.id);
        }
        openContextWidget(LAYERS_WIDGET_NAME, {contentId: content.id});
    };

    const stopRowActivation = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
    };

    return (
        <ListItem className='p-0' role='presentation'>
            <ListItem.Left className='flex-1'>
                <ContentLabel content={item} variant={showPath ? 'detailed' : 'normal'} />
            </ListItem.Left>
            <ListItem.Right>
                {isInherited && (
                    <LayerIndicator
                        isLocalised={isLocalised}
                        onClick={handleLayersClick}
                        onDblClick={stopRowActivation}
                        tabIndex={-1}
                    />
                )}
                <StatusBadge status={content.publishStatus} />
            </ListItem.Right>
        </ListItem>
    );
};
