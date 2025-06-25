import {Body} from "@enonic/lib-admin-ui/dom/Body";
import type {ReactElement} from "react";
import {useEffect, useRef} from "react";
import {ConfirmationDialog, useConfirmationDialog} from "./ConfirmationDialog";
import {Gate} from "./Gate";
import {LegacyElement} from "../LegacyElement";

type DialogPresetConfirmProps = {
    open?: boolean;
    title: string;
    description?: string;
    defaultConfirmEnabled?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
};

const DialogPresetConfirm = ({
    open = false,
    title,
    description,
    defaultConfirmEnabled,
    onConfirm,
    onCancel,
}: DialogPresetConfirmProps): ReactElement => {
    return (
        <ConfirmationDialog.Root open={open} onOpenChange={(next) => {if (!next) onCancel?.();}}>
            <ConfirmationDialog.Portal>
                <ConfirmationDialog.Overlay />
                <ConfirmationDialog.Content defaultConfirmEnabled={defaultConfirmEnabled}>
                    <ConfirmationDialog.DefaultHeader title={title} />
                    <ConfirmationDialog.Body className="mb-7">{description}</ConfirmationDialog.Body>
                    <ConfirmationDialog.Footer onConfirm={onConfirm} onCancel={onCancel} />
                </ConfirmationDialog.Content>
            </ConfirmationDialog.Portal>
        </ConfirmationDialog.Root>
    );
};

export const DialogPreset = {
    Confirm: DialogPresetConfirm,
};

export class DialogPresetConfirmElement
    extends LegacyElement<typeof DialogPresetConfirm, DialogPresetConfirmProps> {

    constructor(props: DialogPresetConfirmProps) {
        super({...props}, DialogPresetConfirm);
    }

    open(): void {
        Body.get().appendChild(this);
        this.setProps({open: true});
    }

    close(): void {
        this.setProps({open: false});
        Body.get().removeChild(this);
    }
}

type DialogPresetGatedConfirm = {
    expected: string | number;
    validate?: (value: string) => boolean;
    intent?: 'default' | 'danger';
} & Omit<DialogPresetConfirmProps, 'defaultSubmitEnabled'>;

type DialogPresetConfirmDeleteContentProps = {
    gateInputRef: React.RefObject<HTMLInputElement>;
    confirmButtonRef: React.RefObject<HTMLButtonElement>;
} & Omit<DialogPresetGatedConfirm, 'open'>;

// Internal component that renders inside ConfirmationDialog.Content to access ConfirmationDialogProvider context.
// This allows useConfirmationDialog() to work properly and track the confirmEnabled state set by Gate.Input validation.
const DialogPresetConfirmDeleteContent = ({
    gateInputRef,
    confirmButtonRef,
    title,
    description,
    expected,
    validate,
    intent,
    onConfirm,
    onCancel,
}: DialogPresetConfirmDeleteContentProps): ReactElement => {
    const {confirmEnabled} = useConfirmationDialog();

    // Shift focus to confirm button when Gate becomes valid
    useEffect(() => {
        if (confirmEnabled) {
            confirmButtonRef.current?.focus();
        }
    }, [confirmEnabled, confirmButtonRef]);

    return (
        <>
            <ConfirmationDialog.DefaultHeader title={title} />
            {description && (
                <ConfirmationDialog.Body>{description}</ConfirmationDialog.Body>
            )}
            <Gate className="mt-7 mb-9.5">
                <Gate.Hint value={expected} />
                <Gate.Input
                    ref={gateInputRef}
                    inputMode='numeric'
                    expected={expected}
                    validate={validate}
                />
            </Gate>
            <ConfirmationDialog.Footer
                ref={confirmButtonRef}
                intent={intent}
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        </>
    );
};

const DialogPresetConfirmDelete = ({
    open = false,
    title,
    description,
    expected,
    validate,
    onConfirm,
    onCancel,
    intent = 'danger',
}: DialogPresetGatedConfirm): ReactElement => {
    const gateInputRef = useRef<HTMLInputElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    // Handle initial focus when dialog opens - prevent default and focus Gate input
    const handleOpenAutoFocus = (event: Event): void => {
        event.preventDefault();
        gateInputRef.current?.focus();
    };

    return (
        <ConfirmationDialog.Root
            open={open}
            onOpenChange={(next) => {if (!next) onCancel?.();}}
        >
            <ConfirmationDialog.Portal>
                <ConfirmationDialog.Overlay />
                <ConfirmationDialog.Content
                    defaultConfirmEnabled={false}
                    onOpenAutoFocus={handleOpenAutoFocus}
                >
                    <DialogPresetConfirmDeleteContent
                        gateInputRef={gateInputRef}
                        confirmButtonRef={confirmButtonRef}
                        title={title}
                        description={description}
                        expected={expected}
                        validate={validate}
                        intent={intent}
                        onConfirm={onConfirm}
                        onCancel={onCancel}
                    />
                </ConfirmationDialog.Content>
            </ConfirmationDialog.Portal>
        </ConfirmationDialog.Root>
    );
};

export class DialogPresetConfirmDeletePreset
    extends LegacyElement<typeof DialogPresetConfirmDelete, DialogPresetGatedConfirm> {

    constructor(props: DialogPresetGatedConfirm) {
        super({...props}, DialogPresetConfirmDelete);
    }

    open(): void {
        Body.get().appendChild(this);
        this.setProps({open: true});
    }

    close(): void {
        this.setProps({open: false});
        Body.get().removeChild(this);
    }
}
