import DOMPurify from 'dompurify';
import {ReactElement} from 'react';
import {CustomSelectorItem} from './CustomSelectorInput';
import {ItemLabel} from '../../../ItemLabel';
import {Tooltip} from '@enonic/ui';

export const CustomSelectorItemView = ({item, listMode}: {item: CustomSelectorItem; listMode: 'list' | 'flat'}): ReactElement => {
    return listMode === 'list' ? <CustomSelectorItemListView item={item} /> : <CustomSelectorItemFlatView item={item} />;
};

const CustomSelectorItemListView = ({item: {displayName, description, icon, iconUrl}}: {item: CustomSelectorItem}): ReactElement => {
    const hasIcon = icon || iconUrl;

    const Icon = hasIcon ? (
        icon ? (
            <span dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(icon.data, {ADD_TAGS: ['use']})}} />
        ) : (
            <img src={iconUrl} alt={displayName} />
        )
    ) : null;

    return <ItemLabel icon={Icon} primary={displayName} secondary={description} className="w-full min-w-0" />;
};

const CustomSelectorItemFlatView = ({item: {displayName, description, icon, iconUrl}}: {item: CustomSelectorItem}): ReactElement => {
    const hasIcon = icon || iconUrl;

    return (
        <div className="flex items-center gap-2.5 min-w-0 w-full">
            {hasIcon && (
                <div className="relative w-[36cqw] max-w-[240px] flex items-center justify-center shrink-0">
                    {icon ? (
                        <span
                            dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(icon.data, {ADD_TAGS: ['use']})}}
                            className="object-contain object-center w-full max-h-[240px]"
                        />
                    ) : (
                        <img src={iconUrl} alt={displayName} className="object-contain object-center w-full max-h-[240px]" />
                    )}
                </div>
            )}

            <div className="min-w-0">
                <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</span>

                {description && (
                    <Tooltip delay={300} value={description}>
                        <span className="text-subtle text-sm block whitespace-nowrap overflow-hidden text-ellipsis text-left group-data-[tone=inverse]:text-alt">
                            {description}
                        </span>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};
