import {Checkbox, Selector, ToggleGroup} from '@enonic/ui';
import {AlignCenter, AlignJustify, AlignLeft, AlignRight} from 'lucide-react';
import {type ReactElement, useMemo} from 'react';
import {Style} from '../../../../../app/inputtype/ui/text/styles/Style';
import {StyleHelper} from '../../../../../app/inputtype/ui/text/styles/StyleHelper';
import {Styles} from '../../../../../app/inputtype/ui/text/styles/Styles';
import {useI18n} from '../../../hooks/useI18n';
import {useHtmlAreaImageDialogContext} from './HtmlAreaImageDialogContext';

export const ImageToolbar = (): ReactElement => {
    const {
        state: {alignment, processingStyleName, customWidthEnabled, customWidthPercent, contentId},
        setAlignment,
        setProcessingStyle,
        setCustomWidth,
        setCustomWidthPercent,
    } = useHtmlAreaImageDialogContext();

    const customWidthLabel = useI18n('dialog.image.customwidth');
    const styleApplyLabel = useI18n('dialog.image.style.apply');

    const imageStyles = useMemo(() => {
        if (!contentId) {
            return [];
        }
        return Styles.getForImage(contentId);
    }, [contentId]);

    const isOriginalImage = StyleHelper.isOriginalImage(processingStyleName);
    const customWidthDisabled = isOriginalImage;

    const selectedStyleValue = processingStyleName || 'none';

    return (
        <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-5 flex-wrap'>
                <ToggleGroup.Root
                    type='single'
                    value={alignment}
                    onValueChange={(value) => {
                        if (value) {
                            setAlignment(value as 'justify' | 'left' | 'center' | 'right');
                        }
                    }}
                >
                    <ToggleGroup.Item value='justify' aria-label='Justify'>
                        <AlignJustify size={16} />
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value='left' aria-label='Left'>
                        <AlignLeft size={16} />
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value='center' aria-label='Center'>
                        <AlignCenter size={16} />
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value='right' aria-label='Right'>
                        <AlignRight size={16} />
                    </ToggleGroup.Item>
                </ToggleGroup.Root>

                {imageStyles.length > 0 && (
                    <div className='grow basis-40'>
                        <Selector.Root
                            value={selectedStyleValue}
                            onValueChange={(value) => {
                                setProcessingStyle(value === 'none' ? '' : value);
                            }}
                        >
                            <Selector.Trigger className='min-w-40'>
                                <Selector.Value placeholder={styleApplyLabel}>
                                    {(value) => {
                                        if (value === 'none') {
                                            return Style.getEmpty('image').getLabel();
                                        }
                                        return imageStyles.find(s => s.getName() === value)?.getLabel() ?? value;
                                    }}
                                </Selector.Value>
                                <Selector.Icon />
                            </Selector.Trigger>
                            <Selector.Content portal={false}>
                                <Selector.Viewport>
                                    <Selector.Item value='none'>
                                        <Selector.ItemText>
                                            {Style.getEmpty('image').getLabel()}
                                        </Selector.ItemText>
                                    </Selector.Item>
                                    {imageStyles.map((style) => (
                                        <Selector.Item key={style.getName()} value={style.getName()}>
                                            <Selector.ItemText>
                                                {style.getLabel()}
                                            </Selector.ItemText>
                                        </Selector.Item>
                                    ))}
                                </Selector.Viewport>
                            </Selector.Content>
                        </Selector.Root>
                    </div>
                )}

                <Checkbox
                    label={customWidthLabel}
                    checked={customWidthEnabled}
                    disabled={customWidthDisabled}
                    onCheckedChange={(checked) => {
                        setCustomWidth(checked === true);
                    }}
                />
            </div>

            {customWidthEnabled && (
                <div className='flex items-center gap-2'>
                    <input
                        type='range'
                        min={0}
                        max={100}
                        step={1}
                        value={customWidthPercent}
                        className='flex-1'
                        onChange={(e) => setCustomWidthPercent(Number(e.currentTarget.value))}
                        onInput={(e) => setCustomWidthPercent(Number(e.currentTarget.value))}
                    />
                    <span className='text-sm min-w-10 text-right'>{customWidthPercent}%</span>
                </div>
            )}
        </div>
    );
};

ImageToolbar.displayName = 'ImageToolbar';
