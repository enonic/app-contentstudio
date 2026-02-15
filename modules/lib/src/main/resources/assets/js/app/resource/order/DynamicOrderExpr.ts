import {OrderExpr, OrderExprBuilder} from './OrderExpr';
import {type OrderExprJson} from '../json/OrderExprJson';
import {type OrderExprWrapperJson} from '../json/OrderExprWrapperJson';

export class DynamicOrderExpr
    extends OrderExpr {

    private function: string;

    constructor(builder: DynamicOrderExprBuilder) {
        super(builder);
        this.function = builder.function;
    }

    getFunction(): string {
        return this.function;
    }

    toString() {
        return this.function + ' ' + super.getDirection();
    }

    static fromString(s: string): DynamicOrderExpr {
        const parts = s.trim().split(' ');
        return new DynamicOrderExprBuilder().setFunction(parts[0]).setDirection(parts[1]).build() as DynamicOrderExpr;
    }

    toJson(): OrderExprJson {
        return {
            function: this.function,
            direction: this.getDirection()
        };
    }

    toWrappedJson(): OrderExprWrapperJson {
        return {
            DynamicOrderExpr: this.toJson()
        };
    }
}

export class DynamicOrderExprBuilder
    extends OrderExprBuilder {

    function: string;

    constructor(json?: OrderExprJson) {
        super(json);
        this.function = json.function;
    }

    public setFunction(value: string): DynamicOrderExprBuilder {
        this.function = value;
        return this;
    }

    public build(): DynamicOrderExpr {
        return new DynamicOrderExpr(this);
    }
}
