import {CompareExpr} from 'lib-admin-ui/query/expr/CompareExpr';
import {FieldExpr} from 'lib-admin-ui/query/expr/FieldExpr';
import {ValueExpr} from 'lib-admin-ui/query/expr/ValueExpr';
import {LogicalExpr} from 'lib-admin-ui/query/expr/LogicalExpr';
import {LogicalOperator} from 'lib-admin-ui/query/expr/LogicalOperator';
import {Expression} from 'lib-admin-ui/query/expr/Expression';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentTreeSelectorQueryRequest} from '../../app/resource/ContentTreeSelectorQueryRequest';
import {ContentTreeSelectorItem} from '../../app/item/ContentTreeSelectorItem';

export class FragmentOptionDataRequest
    extends ContentTreeSelectorQueryRequest<ContentTreeSelectorItem> {

    private parentSitePath: string;

    constructor() {
        super();
        this.setContentTypeNames([ContentTypeName.FRAGMENT.toString()]);
    }

    protected createSearchExpression(searchString: string): Expression {
        if (this.parentSitePath) {
            let searchConstraint = super.createSearchExpression(searchString);
            let nearestSiteConstraint = this.createParentSiteFragmentsOnlyQuery();
            return new LogicalExpr(searchConstraint, LogicalOperator.AND, nearestSiteConstraint);
        } else {
            return super.createSearchExpression(searchString);
        }
    }

    private createParentSiteFragmentsOnlyQuery(): CompareExpr {
        return CompareExpr.like(new FieldExpr('_path'), ValueExpr.string('/content' + this.parentSitePath + '/*'));
    }

    setParentSitePath(sitePath: string) {
        this.parentSitePath = sitePath;
    }

    getParentSitePath(): string {
        return this.parentSitePath;
    }

}
