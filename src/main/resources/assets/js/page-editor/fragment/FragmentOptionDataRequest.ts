import '../../api';
import CompareExpr = api.query.expr.CompareExpr;
import FieldExpr = api.query.expr.FieldExpr;
import ValueExpr = api.query.expr.ValueExpr;
import LogicalExpr = api.query.expr.LogicalExpr;
import LogicalOperator = api.query.expr.LogicalOperator;
import Expression = api.query.expr.Expression;
import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;
import ContentTreeSelectorQueryRequest = api.content.ContentTreeSelectorQueryRequest;
import ContentTypeName = api.schema.content.ContentTypeName;

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
