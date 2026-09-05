import { cn, Combobox, Listbox } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import {
    createPortal,
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FocusEvent,
    type KeyboardEvent,
} from 'react';
import type { ExtensionView } from '../../../../app/view/context/ExtensionView';
import { $contextPanelMode, $isContextOpen } from '../../../shared/app-state/browsePanels.store';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { WidgetIcon } from '../../../shared/ui/icons/WidgetIcon';
import { LegacyElement } from '../../../shared/ui/LegacyElement';

type WidgetsSelectorProps = {
    widgetViews?: ExtensionView[];
    externalSelectedWidgetView?: ExtensionView;
    mobileToolbarTarget?: HTMLElement;
};

const WIDGETS_SELECTOR_NAME = 'WidgetsSelector';
const TOOLBAR_HANDLED_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Escape']);

const stopToolbarKeyHandling = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.target instanceof HTMLInputElement && TOOLBAR_HANDLED_KEYS.has(event.key)) {
        event.stopPropagation();
    }
};

export const WidgetsSelector = ({
    widgetViews = [],
    externalSelectedWidgetView = undefined,
    mobileToolbarTarget,
}: WidgetsSelectorProps) => {
    const mode = useStore($contextPanelMode);
    const isContextOpen = useStore($isContextOpen);
    const placeholder = useI18n('field.option.placeholder');
    const notFoundLabel = useI18n('field.contextPanel.selector.notfound');
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState<string | undefined>();
    const [selectedWidgetKey, setSelectedWidgetKey] = useState<readonly string[]>([]);

    const filteredWidgetViews = useMemo(() => {
        if (!isOpen || !searchValue) return widgetViews;

        return widgetViews.filter((widgetView) =>
            widgetView.getExtensionName().toLowerCase().includes(searchValue.toLowerCase()),
        );
    }, [isOpen, searchValue, widgetViews]);

    const selectedWidgetView = useMemo(
        () => getWidgetViewFromKey(widgetViews, selectedWidgetKey?.[0]),
        [widgetViews, selectedWidgetKey],
    );
    const selectedWidgetLabel = selectedWidgetView?.getExtensionName();
    const inputValue = isOpen ? searchValue : selectedWidgetLabel;
    const mobileToolbarTargetElement = mode === 'mobile' && isContextOpen ? mobileToolbarTarget : undefined;
    const PopupContainer = mobileToolbarTargetElement ? Combobox.Portal : Fragment;

    // TODO: Enonic UI - backwards compatibility due to the active widget being handled by ContextView
    useEffect(() => {
        if (!externalSelectedWidgetView) return;

        const key = getWidgetKeyForSelector(externalSelectedWidgetView);

        handleSelectionChange([key]);
    }, [externalSelectedWidgetView]);

    const handleSelectionChange = useCallback(
        (selectedWidgetKey: readonly string[]) => {
            // Unable to deselect a widget
            if (selectedWidgetKey.length === 0) return;

            const key = selectedWidgetKey[0];

            setSelectedWidgetKey([key]);
            setSearchValue(undefined);
            getWidgetViewFromKey(widgetViews, key)?.setActive();
        },
        [widgetViews],
    );

    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open);

        if (!open) {
            setSearchValue(undefined);
        }
    }, []);

    const handleInputFocus = useCallback(
        (event: FocusEvent<HTMLInputElement>): void => {
            if (!isOpen && event.currentTarget.value) {
                event.currentTarget.select();
            }
        },
        [isOpen],
    );

    const selector = (
        <div
            data-component={WIDGETS_SELECTOR_NAME}
            className={cn(
                mobileToolbarTargetElement ? 'flex h-full min-w-0 items-center' : 'h-15 border-b border-bdr-soft p-1.5',
            )}
        >
            <Combobox.Root
                value={inputValue}
                onChange={setSearchValue}
                onOpenChange={handleOpenChange}
                selection={selectedWidgetKey}
                onSelectionChange={handleSelectionChange}
                closeOnBlur={true}
            >
                <Combobox.Content
                    className={cn('w-full', mobileToolbarTargetElement ? 'flex h-full items-center' : 'h-12')}
                >
                    <Combobox.Control className={cn('border-none', mobileToolbarTargetElement && 'h-9 w-full')}>
                        <Combobox.Search
                            className={cn('relative', mobileToolbarTargetElement && 'h-9 gap-2 px-3.5 py-0')}
                            onKeyDown={mobileToolbarTargetElement ? stopToolbarKeyHandling : undefined}
                        >
                            {selectedWidgetView && !isOpen && (
                                <div
                                    className={cn(
                                        'pointer-events-none flex items-center',
                                        mobileToolbarTargetElement ? 'shrink-0' : 'absolute inset-y-0 left-4.5',
                                    )}
                                >
                                    <WidgetIcon
                                        widgetView={selectedWidgetView}
                                        strokeWidth={mobileToolbarTargetElement ? 1.5 : undefined}
                                        className={cn('shrink-0', mobileToolbarTargetElement ? 'size-5' : 'size-4')}
                                    />
                                </div>
                            )}
                            <Combobox.Input
                                placeholder={placeholder}
                                onFocus={handleInputFocus}
                                className={cn(
                                    mobileToolbarTargetElement && 'h-5 text-sm',
                                    selectedWidgetView && !isOpen && 'font-semibold',
                                    selectedWidgetView && !isOpen && !mobileToolbarTargetElement && 'pl-10',
                                )}
                            />
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>
                    <PopupContainer>
                        <Combobox.Popup>
                            <Listbox.Content className="max-h-60 rounded-sm">
                                {filteredWidgetViews.length > 0 ? (
                                    filteredWidgetViews.map((widgetView) => {
                                        const key = getWidgetKeyForSelector(widgetView);
                                        const name = widgetView.getExtensionName();
                                        const description = widgetView.getExtensionDescription();

                                        return (
                                            <Listbox.Item key={key} value={key}>
                                                <WidgetIcon widgetView={widgetView} className="size-6 shrink-0" />
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="leading-5.5 font-semibold truncate group-data-[tone=inverse]:text-alt">
                                                        {name}
                                                    </span>
                                                    <small className="leading-4.5 text-sm text-subtle truncate group-data-[tone=inverse]:text-alt">
                                                        {description}
                                                    </small>
                                                </div>
                                            </Listbox.Item>
                                        );
                                    })
                                ) : (
                                    <div className="px-4 py-3 text-sm text-subtle">{notFoundLabel}</div>
                                )}
                            </Listbox.Content>
                        </Combobox.Popup>
                    </PopupContainer>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );

    return mobileToolbarTargetElement ? createPortal(selector, mobileToolbarTargetElement) : selector;
};

WidgetsSelector.displayName = WIDGETS_SELECTOR_NAME;

// We need to convert the widget key to a string that is an valid id.
function getWidgetKeyForSelector(widgetView?: ExtensionView): string | undefined {
    if (!widgetView) {
        return undefined;
    }

    return widgetView.getExtensionKey().replace(/[.:]/g, '-');
}

function getWidgetViewFromKey(widgetViews: ExtensionView[], key: string): ExtensionView | undefined {
    return widgetViews.find((wv) => getWidgetKeyForSelector(wv) === key);
}

export default class WidgetsSelectorElement extends LegacyElement<typeof WidgetsSelector, WidgetsSelectorProps> {
    constructor(props: WidgetsSelectorProps) {
        super(props, WidgetsSelector);
    }

    // Backwards compatibility

    updateState(widgetView: ExtensionView): void {
        this.props.setKey('externalSelectedWidgetView', widgetView);
    }

    setMobileToolbarTarget(target?: HTMLElement): void {
        this.props.setKey('mobileToolbarTarget', target);
    }

    updateExtensionsSelector(widgetViews: ExtensionView[], selectedView?: ExtensionView): void {
        this.props.setKey('widgetViews', widgetViews);

        if (selectedView) {
            this.props.setKey('externalSelectedWidgetView', selectedView);
        }
    }
}
