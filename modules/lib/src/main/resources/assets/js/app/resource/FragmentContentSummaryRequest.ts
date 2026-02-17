import {CompareExpr} from '@enonic/lib-admin-ui/query/expr/CompareExpr';
import {FieldExpr} from '@enonic/lib-admin-ui/query/expr/FieldExpr';
import {ValueExpr} from '@enonic/lib-admin-ui/query/expr/ValueExpr';
import {LogicalExpr} from '@enonic/lib-admin-ui/query/expr/LogicalExpr';
import {LogicalOperator} from '@enonic/lib-admin-ui/query/expr/LogicalOperator';
import {type ConstraintExpr} from '@enonic/lib-admin-ui/query/expr/ConstraintExpr';
import {ContentSummaryRequest} from './ContentSummaryRequest';

export class FragmentContentSummaryRequest
    extends ContentSummaryRequest {

    private parentSitePath: string;

    protected createSearchExpression(): ConstraintExpr {
        if (this.parentSitePath) {
            const searchConstraint = super.createSearchExpression();
            const nearestSiteConstraint = this.createParentSiteFragmentsOnlyQuery();
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
