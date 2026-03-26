import {Checkbox, Input, Selector} from '@enonic/ui';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {type UrlProtocol, useHtmlAreaLinkDialogContext} from './HtmlAreaLinkDialogContext';

const COMPONENT_NAME = 'UrlTabPanel';

const PROTOCOLS: {value: UrlProtocol; label: string}[] = [
    {value: 'https://', label: 'Https'},
    {value: 'http://', label: 'Http'},
    {value: 'ftp://', label: 'Ftp'},
    {value: 'tel:', label: 'Tel'},
];

export const UrlTabPanel = (): ReactElement => {
    const {
        state: {urlProtocol, urlValue, urlTarget},
        validationErrors: errors,
        setUrlProtocol,
        setUrlValue,
        setUrlTarget,
    } = useHtmlAreaLinkDialogContext();

    const urlLabel = useI18n('dialog.link.formitem.url');
    const typeLabel = useI18n('field.type');
    const openInNewTabLabel = useI18n('dialog.link.formitem.openinnewtab');
    const relativeLabel = useI18n('dialog.link.urlprotocols.relative');

    return (
        <div data-component={COMPONENT_NAME} className='flex flex-col gap-4 pt-4'>
            <div className='flex flex-col'>
                <label className='mb-2 block text-base font-semibold text-main'>{urlLabel} *</label>
                <div className='flex gap-2'>
                    <Selector.Root
                        value={urlProtocol}
                        onValueChange={(val) => setUrlProtocol(val as UrlProtocol)}
                    >
                        <Selector.Trigger className='w-fit shrink-0'>
                            <span className='flex-1'>{`<${typeLabel}>`}</span>
                            <Selector.Icon />
                        </Selector.Trigger>
                        <Selector.Content onPointerDown={event => event.stopPropagation()}>
                            <Selector.Viewport>
                                {PROTOCOLS.map((p) => (
                                    <Selector.Item key={p.value} value={p.value}>
                                        <Selector.ItemText>{p.label}</Selector.ItemText>
                                        <Selector.ItemIndicator />
                                    </Selector.Item>
                                ))}
                                <Selector.Item value=''>
                                    <Selector.ItemText>{relativeLabel}</Selector.ItemText>
                                    <Selector.ItemIndicator />
                                </Selector.Item>
                            </Selector.Viewport>
                        </Selector.Content>
                    </Selector.Root>
                    <Input
                        value={urlValue}
                        required
                        error={errors.url}
                        onChange={(e) => setUrlValue((e.target as HTMLInputElement).value)}
                        className='flex-1'
                    />
                </div>
            </div>
            <Checkbox
                checked={urlTarget}
                onCheckedChange={(checked) => setUrlTarget(checked === true)}
                label={openInNewTabLabel}
            />
        </div>
    );
};

UrlTabPanel.displayName = COMPONENT_NAME;
