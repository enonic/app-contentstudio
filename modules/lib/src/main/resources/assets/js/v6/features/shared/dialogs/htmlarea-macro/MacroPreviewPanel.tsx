import {type ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useHtmlAreaMacroDialogContext} from './HtmlAreaMacroDialogContext';

const COMPONENT_NAME = 'MacroPreviewPanel';
const MAX_IFRAME_HEIGHT = 500;
const MIN_IFRAME_HEIGHT = 150;
const RESIZE_DEBOUNCE_MS = 500;

function buildIframeContent(
    html: string,
    pageContributions: { headBegin: string[]; headEnd: string[]; bodyBegin: string[]; bodyEnd: string[] },
): string {
    let result = '';
    pageContributions.headBegin.forEach(s => result += s);
    pageContributions.headEnd.forEach(s => result += s);
    pageContributions.bodyBegin.forEach(s => result += s);
    result += html;
    pageContributions.bodyEnd.forEach(s => result += s);
    return result;
}

export const MacroPreviewPanel = (): ReactElement => {
    const {
        state: {previewLoading, previewResolved, previewHtml, previewPageContributions, selectedDescriptor},
        hasPreviewScripts,
    } = useHtmlAreaMacroDialogContext();

    const previewLoadingLabel = useI18n('dialog.macro.tab.preview.loading');
    const incompleteLabel = useI18n('dialog.macro.form.incomplete');
    const previewTitle = useI18n('dialog.macro.tab.preview');

    if (!selectedDescriptor) {
        return <div data-component={COMPONENT_NAME} />;
    }

    if (previewLoading) {
        return (
            <div data-component={COMPONENT_NAME} className='flex items-center justify-center py-8'>
                <span className='text-sm text-subtle'>{previewLoadingLabel}</span>
            </div>
        );
    }

    if (!previewResolved) {
        return (
            <div data-component={COMPONENT_NAME} className='py-4 text-sm text-subtle'>
                {incompleteLabel}
            </div>
        );
    }

    if (hasPreviewScripts && previewPageContributions) {
        return (
            <PreviewIframe
                html={previewHtml}
                pageContributions={previewPageContributions}
                title={previewTitle}
            />
        );
    }

    return (
        <div
            data-component={COMPONENT_NAME}
            className='preview-content py-2'
            dangerouslySetInnerHTML={{__html: previewHtml}}
        />
    );
};

MacroPreviewPanel.displayName = COMPONENT_NAME;

type PreviewIframeProps = {
    html: string;
    pageContributions: { headBegin: string[]; headEnd: string[]; bodyBegin: string[]; bodyEnd: string[] };
    title: string;
};

const PreviewIframe = ({html, pageContributions, title}: PreviewIframeProps): ReactElement => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState(MIN_IFRAME_HEIGHT);
    const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const observerRef = useRef<MutationObserver | null>(null);

    const adjustHeight = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        try {
            const frameDoc = iframe.contentWindow?.document ?? iframe.contentDocument;
            if (!frameDoc?.body) return;

            const scrollHeight = frameDoc.body.scrollHeight;
            const newHeight = Math.max(MIN_IFRAME_HEIGHT, Math.min(scrollHeight, MAX_IFRAME_HEIGHT));
            setHeight(newHeight);
        } catch {
            // iframe cross-origin safety
        }
    }, []);

    const debouncedAdjustHeight = useCallback(() => {
        if (resizeTimerRef.current) {
            clearTimeout(resizeTimerRef.current);
        }
        resizeTimerRef.current = setTimeout(adjustHeight, RESIZE_DEBOUNCE_MS);
    }, [adjustHeight]);

    // Clean up timer and observer on unmount
    useEffect(() => {
        return () => {
            if (resizeTimerRef.current) {
                clearTimeout(resizeTimerRef.current);
            }
            observerRef.current?.disconnect();
        };
    }, []);

    const handleLoad = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        // Disconnect previous observer before writing new content
        observerRef.current?.disconnect();
        observerRef.current = null;

        try {
            const frameDoc = iframe.contentWindow?.document ?? iframe.contentDocument;
            if (!frameDoc) return;

            frameDoc.open();
            frameDoc.write(buildIframeContent(html, pageContributions));
            frameDoc.close();

            debouncedAdjustHeight();

            // Watch for DOM mutations to auto-adjust height
            if (frameDoc.body) {
                const observer = new MutationObserver(debouncedAdjustHeight);
                observer.observe(frameDoc.body, {
                    attributes: true,
                    childList: true,
                    characterData: true,
                });
                observerRef.current = observer;
            }
        } catch {
            // iframe cross-origin safety
        }
    }, [html, pageContributions, debouncedAdjustHeight]);

    return (
        <iframe
            ref={iframeRef}
            className='w-full border-0'
            style={{height: `${height}px`}}
            onLoad={handleLoad}
            title={title}
        />
    );
};

PreviewIframe.displayName = 'PreviewIframe';
