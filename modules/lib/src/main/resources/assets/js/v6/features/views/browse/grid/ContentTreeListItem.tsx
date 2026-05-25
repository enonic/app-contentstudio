import {cn, IconButton, ListItem, Tooltip} from '@enonic/ui';
import {Layers} from 'lucide-react';
import {type MouseEvent} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {ContentLabel} from '../../../shared/content/ContentLabel';
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
    const localisedLabel = useI18n('widget.layers.localised');
    const notLocalisedLabel = useI18n('widget.layers.notLocalised');
    const layerLabel = isLocalised ? localisedLabel : notLocalisedLabel;

    // ? stopPropagation bypasses the row handler that would clear selection.
    const handleLayersClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if ($activeId.get() !== content.id) {
            setActive(content.id);
        }

        openContextWidget(LAYERS_WIDGET_NAME);
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
                    <Tooltip delay={300} value={layerLabel}>
                        <IconButton
                            size='sm'
                            icon={Layers}
                            aria-label={layerLabel}
                            onClick={handleLayersClick}
                            onDblClick={stopRowActivation}
                            tabIndex={-1}
                            className={cn('shrink-0 bg-transparent hover:bg-transparent', !isLocalised && 'opacity-40')}
                        />
                    </Tooltip>
                )}
                <StatusBadge status={content.publishStatus} />
            </ListItem.Right>
        </ListItem>
    );
};
