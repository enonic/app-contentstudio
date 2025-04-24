import {ProjectAccessControlEntry} from '../../../../access/ProjectAccessControlEntry';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalContainerSelectedEntryView} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerSelectedEntryView';
import {getProjectAccessOptions} from '../../../../access/ProjectAccess';
import {AccessSelector} from '../../../../../security/AccessSelector';
import {AccessChangedEvent} from '../../../../../security/AccessChangedEvent';

export class ProjectAccessControlEntryView
    extends PrincipalContainerSelectedEntryView<ProjectAccessControlEntry> {

    private accessSelector: AccessSelector;

    public static debug: boolean = false;

    constructor(ace: ProjectAccessControlEntry, readonly: boolean = false) {
        super(ace, readonly);
    }

    setEditable(editable: boolean) {
        super.setEditable(editable);
        this.toggleClass('readonly', !editable);
        if (this.accessSelector) {
            this.accessSelector.setEnabled(editable);
        }
    }

    public setItem(ace: ProjectAccessControlEntry) {
        super.setItem(ace);

        const principal: Principal = Principal.create().setKey(ace.getPrincipal().getKey()).setModifiedTime(
            ace.getPrincipal().getModifiedTime()).setDisplayName(
            ace.getPrincipal().getDisplayName()).build();
        this.setObject(principal);

        this.doLayout(principal);
    }

    public getItem(): ProjectAccessControlEntry {
        return new ProjectAccessControlEntry(this.item.getPrincipal(), this.item.getAccess());
    }

    doLayout(object: Principal) {
        super.doLayout(object);
        this.addClass('project-access-control-entry');

        // permissions will be set on access selector value change

        if (!this.accessSelector) {
            this.accessSelector = new AccessSelector(getProjectAccessOptions(), 'project-access-selector');
            this.accessSelector.setEnabled(this.isEditable());
            this.accessSelector.onValueChanged((event: AccessChangedEvent) => {
                this.item.setAccess(event.getNewValue());
                this.notifyValueChanged(this.getItem());
            });
            this.appendChild(this.accessSelector);
        }
        this.accessSelector.setValue(this.item.getAccess(), true);

        this.appendRemoveButton();
    }
}
