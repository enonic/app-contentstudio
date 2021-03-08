import {CompareExpr} from 'lib-admin-ui/query/expr/CompareExpr';
import {FieldExpr} from 'lib-admin-ui/query/expr/FieldExpr';
import {ValueExpr} from 'lib-admin-ui/query/expr/ValueExpr';
import {LogicalExpr} from 'lib-admin-ui/query/expr/LogicalExpr';
import {LogicalOperator} from 'lib-admin-ui/query/expr/LogicalOperator';
import {ConstraintExpr} from 'lib-admin-ui/query/expr/ConstraintExpr';
import {ContentSummaryRequest} from './ContentSummaryRequest';

export class FragmentContentSummaryRequest
    extends ContentSummaryRequest {

    private parentSitePath: string;

    protected createSearchExpression(): ConstraintExpr {
        if (this.parentSitePath) {
            let searchConstraint = super.createSearchExpression();
            let nearestSiteConstraint = this.createParentSiteFragmentsOnlyQuery();
            return new LogicalExpr(searchConstraint, LogicalOperator.AND, nearestSiteConstraint);
        } else {
            return super.createSearchExpression();
        }
    }

    private createParentSiteFragmentsOnlyQuery(): CompareExpr {
        return CompareExpr.like(new FieldExpr('_path'), ValueExpr.string('/content' + this.parentSitePath + '/*'));
    }

    setParentSitePath(sitePath: string) {
        this.parentSitePath = sitePath;
    }

}
