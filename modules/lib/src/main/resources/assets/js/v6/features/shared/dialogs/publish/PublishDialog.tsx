import {Button, Dialog, Separator} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Calendar} from 'lucide-react';
import type {ReactElement} from 'react';
import {setPublishDialogOpen} from '../../../store/dialogs.store';
import {useI18n} from '../../../hooks/useI18n';
import {$dialogs} from '../../../store/dialogs.store';
import {SelectionStatusBar} from '../SelectionStatusBar';

export const PublishDialog = (): ReactElement => {
    const {publishDialogOpen} = useStore($dialogs);

    const title = useI18n('dialog.publish');
    const separatorLabel = useI18n('dialog.publish.dependants');
    const scheduleLabel = useI18n('action.schedule');
    const publishLabel = useI18n('action.publishNow');

    const handleSchedule = () => {
        console.log('schedule');
    };

    const handlePublish = () => {
        console.log('publish');
    };

    return (
        <Dialog.Root open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    className="w-full h-full max-w-full max-h-full sm:w-auto sm:h-fit gap-7.5 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
                >

                    <SelectionStatusBar />
                    <Dialog.DefaultHeader title={title} withClose />

                    <Dialog.Body className="p-0">
                        <p>Main List</p>
                        <Separator label={separatorLabel} />
                        <p>Dependant List</p>
                    </Dialog.Body>

                    <Dialog.Footer>
                        <Button label={scheduleLabel} variant="outline" onClick={handleSchedule} endIcon={Calendar} />
                        <Button label={publishLabel} variant="solid" onClick={handlePublish} />
                    </Dialog.Footer>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

PublishDialog.displayName = 'PublishDialog';
