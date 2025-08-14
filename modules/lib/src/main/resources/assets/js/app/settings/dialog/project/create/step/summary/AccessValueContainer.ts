import {SummaryValueContainer} from './SummaryValueContainer';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import Q from 'q';
import {PrincipalsContainer} from './PrincipalsContainer';

export class AccessValueContainer
    extends SummaryValueContainer {

    protected currentUser?: Principal;

    private readonly principalsContainer: PrincipalsContainer;

    constructor(currentUser?: Principal) {
        super('access-container');

        this.currentUser = currentUser;
        this.principalsContainer = new PrincipalsContainer(currentUser);
    }

    setPrincipals(principals: Principal[]): AccessValueContainer {
        this.principalsContainer.setItems(principals);
        this.principalsContainer.setVisible(principals.length > 0);

        return this;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.principalsContainer);

            return rendered;
        });
    }
}
