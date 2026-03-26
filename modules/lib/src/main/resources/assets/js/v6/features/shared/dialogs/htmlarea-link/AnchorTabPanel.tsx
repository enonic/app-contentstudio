import {Selector} from '@enonic/ui';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useHtmlAreaLinkDialogContext} from './HtmlAreaLinkDialogContext';

const COMPONENT_NAME = 'AnchorTabPanel';

export const AnchorTabPanel = (): ReactElement => {
    const {
        state: {anchorValue, anchors},
        validationErrors: errors,
        setAnchorValue,
    } = useHtmlAreaLinkDialogContext();

    const anchorLabel = useI18n('dialog.link.tabname.anchor');

    return (
        <div data-component={COMPONENT_NAME} className='flex flex-col gap-4 pt-4'>
            <Selector.Root
                value={anchorValue}
                onValueChange={setAnchorValue}
            >
                <Selector.Trigger className={errors.anchor ? 'border-enonic-red-500' : ''}>
                    <Selector.Value placeholder={anchorLabel} />
                    <Selector.Icon />
                </Selector.Trigger>
                <Selector.Content onPointerDown={event => event.stopPropagation()}>
                    <Selector.Viewport>
                        {anchors.map((anchor) => (
                            <Selector.Item key={anchor} value={anchor}>
                                <Selector.ItemText>{anchor}</Selector.ItemText>
                                <Selector.ItemIndicator />
                            </Selector.Item>
                        ))}
                    </Selector.Viewport>
                </Selector.Content>
            </Selector.Root>
        </div>
    );
};

AnchorTabPanel.displayName = COMPONENT_NAME;
