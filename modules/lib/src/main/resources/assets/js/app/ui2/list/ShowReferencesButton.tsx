import {Button} from '@enonic/ui';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DependencyParams} from '../../browse/DependencyParams';
import {DependencyType} from '../../browse/DependencyType';
import {ShowDependenciesEvent} from '../../browse/ShowDependenciesEvent';
import type {Branch} from '../../versioning/Branch';
import type {ContentId} from '../../content/ContentId';

export type ShowReferencesButtonProps = {
    contentId: ContentId;
    target?: Branch;
};

export function ShowReferencesButton({
                                         contentId,
                                         target,
                                     }: ShowReferencesButtonProps) {
    const fire = () => {
        const params = DependencyParams.create()
            .setContentId(contentId)
            .setDependencyType(DependencyType.INBOUND)
            .setBranch(target)
            .build();
        new ShowDependenciesEvent(params).fire();
    };

    return (
        <Button
            className={'show-ref'}
            label={i18n('action.showReferences')}
            onClick={fire}
        />
    );
}
