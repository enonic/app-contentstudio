import DOMPurify from 'dompurify';
import { ReactElement } from 'react';
import { CustomSelectorItem } from './CustomSelectorInput';
import { ItemLabel } from '../../../../../shared/ui/ItemLabel';
import { Tooltip } from '@enonic/ui';

export const CustomSelectorItemView = ({
    item,
    listMode,
    tooltipTabIndex = 0,
}: {
    item: CustomSelectorItem;
    listMode: 'list' | 'flat';
    tooltipTabIndex?: 0 | -1;
}): ReactElement => {
    return listMode === 'list' ? (
        <CustomSelectorItemListView item={item} />
    ) : (
        <CustomSelectorItemFlatView item={item} tooltipTabIndex={tooltipTabIndex} />
    );
};

CustomSelectorItemView.displayName = 'CustomSelectorItemView';

const CustomSelectorItemListView = ({
    item: { displayName, description, icon, iconUrl },
}: {
    item: CustomSelectorItem;
}): ReactElement => {
    const hasIcon = icon || iconUrl;

    const Icon = hasIcon ? (
        icon ? (
            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(icon.data, { ADD_TAGS: ['use'] }) }} />
        ) : (
            <img src={iconUrl} alt={displayName} />
        )
    ) : null;

    return <ItemLabel icon={Icon} primary={displayName} secondary={description} className="w-full min-w-0" />;
};

const CustomSelectorItemFlatView = ({
    item: { displayName, description, icon, iconUrl },
    tooltipTabIndex,
}: {
    item: CustomSelectorItem;
    tooltipTabIndex: 0 | -1;
}): ReactElement => {
    const hasIcon = icon || iconUrl;

    return (
        <div className="flex items-center gap-2.5 min-w-0 w-full">
            {hasIcon && (
                <div className="relative w-[36cqw] max-w-[240px] flex items-center justify-center shrink-0">
                    {icon ? (
                        <span
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(icon.data, { ADD_TAGS: ['use'] }) }}
                            className="object-contain object-center w-full max-h-[240px]"
                        />
                    ) : (
                        <img
                            src={iconUrl}
                            alt={displayName}
                            className="object-contain object-center w-full max-h-[240px]"
                        />
                    )}
                </div>
            )}

            <div className="min-w-0">
                <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">
                    {displayName}
                </span>

                {description && (
                    <Tooltip delay={300} value={description}>
                        <span
                            tabIndex={tooltipTabIndex}
                            className="text-subtle text-sm block whitespace-nowrap overflow-hidden text-ellipsis text-left group-data-[tone=inverse]:text-alt focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                        >
                            {description}
                        </span>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};
