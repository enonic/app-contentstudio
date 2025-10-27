import {Body} from "@enonic/lib-admin-ui/dom/Body";
import {LegacyElement} from "@enonic/lib-admin-ui/ui2/LegacyElement";
import type {ReactElement} from "react";
import {ConfirmationDialog} from "./ConfirmationDialog";
import {Gate} from "./Gate";

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
  defaultConfirmEnabled = true,
  onConfirm,
  onCancel,
}: DialogPresetConfirmProps): ReactElement => {
  return (
      <ConfirmationDialog.Root open={open} onOpenChange={(next) => { if (!next) onCancel?.(); }}>
          <ConfirmationDialog.Portal>
              <ConfirmationDialog.Overlay/>
              <ConfirmationDialog.Content defaultConfirmEnabled={defaultConfirmEnabled}>
                  <ConfirmationDialog.DefaultHeader title={title} withClose />
                  <ConfirmationDialog.Body>{description}</ConfirmationDialog.Body>
                  <ConfirmationDialog.Footer onConfirm={onConfirm} onCancel={onCancel}/>
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
    }

    close(): void {
        this.setProps({open: false});
    }
}

type DialogPresetGatedConfirm = {
    expected: string | number;
    validate?: (value: string) => boolean;
    intent?: 'default' | 'danger';
} & Omit<DialogPresetConfirmProps, 'defaultSubmitEnabled'>;

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
  return (
    <ConfirmationDialog.Root open={open} onOpenChange={(next) => { if (!next) onCancel?.(); }}>
      <ConfirmationDialog.Portal>
        <ConfirmationDialog.Overlay/>
        <ConfirmationDialog.Content defaultConfirmEnabled={false}>
          <ConfirmationDialog.DefaultHeader title={title} />
          {description && (
            <ConfirmationDialog.Body>{description}</ConfirmationDialog.Body>
          )}
          <Gate.Root>
            <Gate.Hint value={expected} />
            <Gate.Input
              min='0'
              inputMode='numeric'
              expected={expected}
              validate={validate}
              autoFocus
            />
          </Gate.Root>
          <ConfirmationDialog.Footer intent={intent} onConfirm={onConfirm} onCancel={onCancel} />
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
  }

  close(): void {
    this.setProps({open: false});
  }
}
