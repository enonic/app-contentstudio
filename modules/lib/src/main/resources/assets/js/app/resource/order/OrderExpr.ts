import {type OrderExprJson} from '../json/OrderExprJson';
import {type OrderExprWrapperJson} from '../json/OrderExprWrapperJson';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class OrderExpr
    implements Equitable {

    private direction: string;

    constructor(builder: OrderExprBuilder) {
        this.direction = builder.direction;
    }

    static toArrayJson(expressions: OrderExpr[]): OrderExprWrapperJson[] {
        return expressions.map(expr => expr.toWrappedJson());
    }

    getDirection(): string {
        return this.direction;
    }

    toJson(): OrderExprJson {
        throw new Error('Must be implemented by inheritors');
    }

    toWrappedJson(): OrderExprWrapperJson {
        throw new Error('Must be implemented by inheritors');
    }

    toString(): string {
        throw new Error('Must be implemented by inheritors');
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, OrderExpr)) {
            return false;
        }
        const other = o as OrderExpr;
        if (this.direction.toLowerCase() !== other.getDirection().toLowerCase()) {
            return false;
        }
        return true;
    }

}

export class OrderExprBuilder {

    direction: string;

    constructor(json?: OrderExprJson) {
        if (json) {
            this.direction = json.direction;
        }
    }

    public setDirection(value: string): OrderExprBuilder {
        this.direction = value;
        return this;
    }

    public build(): OrderExpr {
        return new OrderExpr(this);
    }
}
