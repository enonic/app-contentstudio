import {Input, Tab} from '@enonic/ui';
import {type ReactElement, useEffect, useRef} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {type LinkType, useHtmlAreaLinkDialogContext} from './HtmlAreaLinkDialogContext';
import {AnchorTabPanel} from './AnchorTabPanel';
import {ContentTabPanel} from './ContentTabPanel';
import {EmailTabPanel} from './EmailTabPanel';
import {UrlTabPanel} from './UrlTabPanel';

const COMPONENT_NAME = 'HtmlAreaLinkDialogContent';

export const HtmlAreaLinkDialogContent = (): ReactElement => {
    const {
        state: {open, linkText, linkTextEditable, tooltip, activeTab, anchors},
        validationErrors: errors,
        setActiveTab,
        setLinkText,
        setTooltip,
    } = useHtmlAreaLinkDialogContext();
    const linkTextInputRef = useRef<HTMLInputElement | null>(null);
    const wasOpenRef = useRef(false);

    const textLabel = useI18n('dialog.link.formitem.text');
    const tooltipLabel = useI18n('dialog.link.formitem.tooltip');
    const contentTabLabel = useI18n('dialog.link.tabname.content');
    const urlTabLabel = useI18n('dialog.link.tabname.url');
    const emailTabLabel = useI18n('dialog.link.tabname.email');
    const anchorTabLabel = useI18n('dialog.link.tabname.anchor');

    const hasAnchors = anchors.length > 0;

    useEffect(() => {
        const justOpened = open && !wasOpenRef.current;
        wasOpenRef.current = open;

        if (justOpened && linkTextEditable && linkText.trim() === '') {
            linkTextInputRef.current?.focus({focusVisible: true});
        }
    }, [open, linkText, linkTextEditable]);

    return (
        <div data-component={COMPONENT_NAME} className='flex flex-col gap-5'>
            {linkTextEditable && (
                <Input
                    ref={linkTextInputRef}
                    label={`${textLabel} *`}
                    value={linkText}
                    required
                    error={errors.linkText}
                    onChange={(e) => setLinkText((e.target as HTMLInputElement).value)}
                />
            )}
            <Input
                label={tooltipLabel}
                value={tooltip}
                onChange={(e) => setTooltip((e.target as HTMLInputElement).value)}
            />
            <Tab.Root
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as LinkType)}
            >
                <Tab.List>
                    <Tab.DefaultTrigger value='content'>{contentTabLabel}</Tab.DefaultTrigger>
                    <Tab.DefaultTrigger value='url'>{urlTabLabel}</Tab.DefaultTrigger>
                    <Tab.DefaultTrigger value='email'>{emailTabLabel}</Tab.DefaultTrigger>
                    {hasAnchors && <Tab.DefaultTrigger value='anchor'>{anchorTabLabel}</Tab.DefaultTrigger>}
                </Tab.List>
                <Tab.Content value='content'>
                    <ContentTabPanel />
                </Tab.Content>
                <Tab.Content value='url'>
                    <UrlTabPanel />
                </Tab.Content>
                <Tab.Content value='email'>
                    <EmailTabPanel />
                </Tab.Content>
                {hasAnchors && (
                    <Tab.Content value='anchor'>
                        <AnchorTabPanel />
                    </Tab.Content>
                )}
            </Tab.Root>
        </div>
    );
};

HtmlAreaLinkDialogContent.displayName = COMPONENT_NAME;
