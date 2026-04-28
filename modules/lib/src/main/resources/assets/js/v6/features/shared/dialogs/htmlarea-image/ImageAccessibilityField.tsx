import {Input, RadioGroup} from '@enonic/ui';
import {type ReactElement, useCallback} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useHtmlAreaImageDialogContext} from './HtmlAreaImageDialogContext';

export const ImageAccessibilityField = (): ReactElement => {
    const {
        state: {accessibility, altText, showValidation},
        validationErrors,
        setAccessibility,
        setAltText,
    } = useHtmlAreaImageDialogContext();

    const accessibilityTitle = useI18n('dialog.image.accessibility.title');
    const decorativeLabel = useI18n('dialog.image.accessibility.decorative');
    const informativeLabel = useI18n('dialog.image.accessibility.informative');
    const altTextPlaceholder = useI18n('dialog.image.accessibility.informative.placeholder');

    const accessibilityError = showValidation ? validationErrors.accessibility : undefined;
    const altTextError = showValidation ? validationErrors.altText : undefined;

    const scrollRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            requestAnimationFrame(() => {
                node.scrollIntoView({behavior: 'smooth', block: 'nearest'});
            });
        }
    }, []);

    return (
        <div className='flex flex-col gap-2'>
            <RadioGroup.Root
                name='image-accessibility'
                value={accessibility}
                onValueChange={(value) => {
                    setAccessibility(value as 'decorative' | 'informative');
                }}
                error={!!accessibilityError}
                errorMessage={accessibilityError}
                required
            >
                <label className='text-sm font-medium'>
                    {accessibilityTitle}
                    <span className='text-error'> *</span>
                </label>
                <RadioGroup.Item value='decorative'>
                    <RadioGroup.Indicator />
                    <span>{decorativeLabel}</span>
                </RadioGroup.Item>
                <RadioGroup.Item value='informative'>
                    <RadioGroup.Indicator />
                    <span>{informativeLabel}</span>
                </RadioGroup.Item>
            </RadioGroup.Root>

                <div ref={scrollRef}>
                    <Input
                        value={altText}
                        placeholder={altTextPlaceholder}
                        onChange={(event) => setAltText(event.currentTarget.value)}
                        error={altTextError}
                        disabled={accessibility !== 'informative'}
                    />
                </div>
        </div>
    );
};

ImageAccessibilityField.displayName = 'ImageAccessibilityField';
