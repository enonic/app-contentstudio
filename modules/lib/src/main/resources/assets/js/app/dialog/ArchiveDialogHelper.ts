import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui2/ActionButton';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DependencyParams} from '../browse/DependencyParams';
import {DependencyType} from '../browse/DependencyType';
import {ShowDependenciesEvent} from '../browse/ShowDependenciesEvent';
import {ContentId} from '../content/ContentId';
import {Branch} from '../versioning/Branch';

export class ArchiveDialogHelper {
    static createShowReferences(contentId: ContentId, branch?: Branch): ActionButton {
        const action = new Action(i18n('action.showReferences')).onExecuted(() => {
            const params = DependencyParams.create()
                .setContentId(contentId)
                .setDependencyType(DependencyType.INBOUND)
                .setBranch(branch)
                .build();
            new ShowDependenciesEvent(params).fire();
        });

        return new ActionButton({action, className: 'show-ref'});
    }

    static mountShowReferences(
        host: HTMLElement,
        contentId: ContentId,
        branch?: Branch
    ): () => void {
        const btn = ArchiveDialogHelper.createShowReferences(contentId, branch);
        const el = btn.getHTMLElement();
        host.appendChild(el);

        return () => {
            try {
                btn.remove();
            } catch {
                el.parentNode?.removeChild(el);
            }
        };
    }
}
