import {type ReactElement, useCallback, useEffect, useRef} from 'react';
import {Styles} from '../../../../../app/inputtype/ui/text/styles/Styles';
import {useI18n} from '../../../hooks/useI18n';
import {useHtmlAreaImageDialogContext} from './HtmlAreaImageDialogContext';

export const ImagePreview = (): ReactElement => {
    const {
        state: {
            selectedImageContent,
            contentId,
            previewLoading,
            processingStyleName,
            alignment,
            customWidthEnabled,
            customWidthPercent,
        },
        figureClasses: figureClassStr,
        figureStyle: figureStyleObj,
        setPreviewLoading,
        resolvePreviewImageSrc,
    } = useHtmlAreaImageDialogContext();

    const loadingLabel = useI18n('action.loading');

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const figureRef = useRef<HTMLElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const adjustIframeHeight = useCallback(() => {
        const iframe = iframeRef.current;
        const img = imgRef.current;
        if (!iframe || !img) {
            return;
        }
        const height = img.offsetHeight || img.naturalHeight;
        if (height > 0) {
            iframe.style.height = `${height + 10}px`;
        }
    }, []);

    const injectCss = useCallback((doc: Document) => {
        const head = doc.head;
        const cssPaths = Styles.getCssPaths(contentId);
        for (const cssPath of cssPaths) {
            const link = doc.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            head.appendChild(link);
        }
    }, [contentId]);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !selectedImageContent) {
            return;
        }

        figureRef.current = null;
        imgRef.current = null;

        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) {
            return;
        }

        const containerWidth = iframe.parentElement?.clientWidth ?? 600;
        const {src, dataSrc} = resolvePreviewImageSrc(selectedImageContent, containerWidth);

        iframeDoc.open();
        iframeDoc.write('<!DOCTYPE html><html><head></head><body class="preview-frame-body" style="margin:0;padding:0;"></body></html>');
        iframeDoc.close();

        injectCss(iframeDoc);

        const figure = iframeDoc.createElement('figure');
        figure.className = figureClassStr || 'captioned editor-align-justify';

        const styleStr = Object.entries(figureStyleObj).map(([k, v]) => `${k}:${v}`).join(';');
        if (styleStr) {
            figure.setAttribute('style', styleStr);
        }

        const img = iframeDoc.createElement('img');
        img.src = src;
        img.setAttribute('data-src', dataSrc);
        img.style.width = '100%';

        img.onload = () => {
            setPreviewLoading(false);
            imgRef.current = img;
            adjustIframeHeight();
        };

        img.onerror = () => {
            setPreviewLoading(false);
        };

        figure.appendChild(img);
        iframeDoc.body.appendChild(figure);
        figureRef.current = figure;

        setPreviewLoading(true);
    }, [selectedImageContent]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const figure = figureRef.current;
        if (!figure) {
            return;
        }

        figure.className = figureClassStr || 'captioned editor-align-justify';

        const styleStr = Object.entries(figureStyleObj).map(([k, v]) => `${k}:${v}`).join(';');
        figure.setAttribute('style', styleStr || '');

        if (selectedImageContent && imgRef.current) {
            const iframe = iframeRef.current;
            const containerWidth = iframe?.parentElement?.clientWidth ?? 600;
            const {src, dataSrc} = resolvePreviewImageSrc(selectedImageContent, containerWidth);
            imgRef.current.src = src;
            imgRef.current.setAttribute('data-src', dataSrc);
        }

        setTimeout(adjustIframeHeight, 100);
    }, [figureClassStr, figureStyleObj, processingStyleName, alignment, customWidthEnabled, customWidthPercent, selectedImageContent, adjustIframeHeight, resolvePreviewImageSrc]);

    return (
        <div className='relative'>
            <iframe
                ref={iframeRef}
                className='w-full border-0 transition-[height] duration-200'
                style={{minHeight: '100px'}}
                title='Image preview'
            />
            {previewLoading && (
                <div className='absolute inset-0 flex items-center justify-center bg-surface/50'>
                    <div className='text-sm text-subtle'>{loadingLabel}</div>
                </div>
            )}
        </div>
    );
};

ImagePreview.displayName = 'ImagePreview';
