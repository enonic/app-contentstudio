import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Principal} from 'lib-admin-ui/security/Principal';
import {PrincipalViewer} from 'lib-admin-ui/ui/security/PrincipalViewer';


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
