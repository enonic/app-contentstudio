import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalViewer} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';


export class PrincipalsListBox extends ListBox<Principal> {

    protected createItemView(item: Principal, _readOnly: boolean): DivEl {
        const viewer: PrincipalViewer = new PrincipalViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: Principal): string {
        return item.getKey().getId();
    }

}
