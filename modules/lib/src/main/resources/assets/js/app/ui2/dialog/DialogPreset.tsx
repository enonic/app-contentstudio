import {Body} from "@enonic/lib-admin-ui/dom/Body";
import {LegacyElement} from "@enonic/lib-admin-ui/ui2/LegacyElement";
import type {ReactElement, ReactNode} from "react";
import {ConfirmationDialog} from "./ConfirmationDialog";

type DialogPresetConfirmProps = {
  open?: boolean;
  title: string;
  description?: string;
  defaultSubmitEnabled?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
};

const DialogPresetConfirm = ({
  open = false,
  title,
  description,
  defaultSubmitEnabled = true,
  onSubmit,
  onCancel,
}: DialogPresetConfirmProps): ReactElement => {
  return (
      <ConfirmationDialog.Root open={open} onOpenChange={(next) => { if (!next) onCancel?.(); }}>
          <ConfirmationDialog.Portal>
              <ConfirmationDialog.Overlay/>
              <ConfirmationDialog.Content defaultSubmitEnabled={defaultSubmitEnabled}>
                  <ConfirmationDialog.DefaultHeader title={title} withClose />
                  <ConfirmationDialog.Body>{description}</ConfirmationDialog.Body>
                  <ConfirmationDialog.Footer onSubmit={onSubmit} onCancel={onCancel}/>
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
