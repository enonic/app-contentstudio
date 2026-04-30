import {Button, FilledSquareCheck, IconButton, Menu, useActiveItemFocus, useMenu} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Ellipsis, OctagonAlert, Square} from 'lucide-react';
import {type ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $hasPage,
    $mixinsMenuItems,
    setDraftMixinEnabled,
} from '../../../store/wizardContent.store';
import {$invalidTabs, $validationVisibility} from '../../../store/wizardValidation.store';

type ConfirmMenuItemProps = {
    disabled: boolean;
    onConfirm: () => void;
};

const CONFIRM_ITEM_ID = 'mixin-confirm';

const ConfirmMenuItem = ({disabled, onConfirm}: ConfirmMenuItemProps): ReactElement => {
    const {active, registerItem, unregisterItem} = useMenu();
    const confirmLabel = useI18n('action.confirm');
    const buttonRef = useRef<HTMLButtonElement>(null);
    const isActive = active === CONFIRM_ITEM_ID;

    useEffect(() => {
        registerItem(CONFIRM_ITEM_ID, disabled, buttonRef.current);
        return () => unregisterItem(CONFIRM_ITEM_ID);
    }, [disabled, registerItem, unregisterItem]);

    useActiveItemFocus({
        ref: buttonRef,
        isActive,
        disabled,
    });

    return (
        <div className="px-4.5 py-2.5 ml-auto">
            <Button
                ref={buttonRef}
                id={CONFIRM_ITEM_ID}
                className="font-semibold text-base"
                size="sm"
                variant="solid"
                label={confirmLabel}
                disabled={disabled}
                onClick={onConfirm}
            />
        </div>
    );
};

ConfirmMenuItem.displayName = 'ConfirmMenuItem';

export const MixinMenu = (): ReactElement => {
    const hasPage = useStore($hasPage);
    const menuItems = useStore($mixinsMenuItems);
    const invalidTabs = useStore($invalidTabs);
    const validationVisibility = useStore($validationVisibility);

    const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
    const [open, setOpen] = useState(false);

    const showErrors = validationVisibility === 'all';
    const hasPendingChanges = pendingChanges.size > 0;
    const showMenu = hasPage || menuItems.length > 0;

    const handleOpenChange = useCallback((isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setPendingChanges(new Map());
        }
    }, []);

    const handleToggle = useCallback((name: string, currentEnabled: boolean) => {
        setPendingChanges((prev) => {
            const next = new Map(prev);
            if (next.has(name) && next.get(name) === currentEnabled) {
                next.delete(name);
            } else {
                next.set(name, !currentEnabled);
            }
            return next;
        });
    }, []);

    const handleApply = useCallback(() => {
        for (const [name, enabled] of pendingChanges) {
            setDraftMixinEnabled(name, enabled);
        }
        setPendingChanges(new Map());
        setOpen(false);
    }, [pendingChanges]);

    if (!showMenu) {
        return null;
    }

    return (
        <Menu open={open} onOpenChange={handleOpenChange}>
            <Menu.Trigger asChild>
                <IconButton className="shrink-0" icon={Ellipsis} size="sm" variant="text"/>
            </Menu.Trigger>
            <Menu.Portal>
                <Menu.Content align="end">
                    {hasPage && (
                        <Menu.Item className="font-semibold text-base px-4.5 py-1 gap-2.5" disabled>
                            <span className="flex-1">Page</span>
                            <FilledSquareCheck className="size-4"/>
                        </Menu.Item>
                    )}
                    {menuItems.map((item) => {
                        const effectiveEnabled = item.isOptional
                                                 ? (pendingChanges.get(item.name) ?? item.isEnabled)
                                                 : true;

                        return (
                            <Menu.Item
                                className="font-semibold text-base px-4.5 py-1 gap-2.5 max-w-60"
                                key={item.name}
                                disabled={!item.isOptional}
                                onSelect={(e) => {
                                    e.preventDefault();
                                    if (item.isOptional) {
                                        handleToggle(item.name, effectiveEnabled);
                                    }
                                }}
                            >
                                <span className="flex-1 truncate">{item.displayName}</span>
                                {(item.unknown || (showErrors && effectiveEnabled && invalidTabs.has(item.name))) && (
                                    <OctagonAlert className="size-3 shrink-0 text-error" strokeWidth={2.5}/>
                                )}
                                {effectiveEnabled ? <FilledSquareCheck className="size-4"/> : <Square className="size-4"/>}
                            </Menu.Item>
                        );
                    })}
                    {menuItems.some((item) => item.isOptional) && (
                        <ConfirmMenuItem disabled={!hasPendingChanges} onConfirm={handleApply}/>
                    )}
                </Menu.Content>
            </Menu.Portal>
        </Menu>
    );
};

MixinMenu.displayName = 'MixinMenu';
