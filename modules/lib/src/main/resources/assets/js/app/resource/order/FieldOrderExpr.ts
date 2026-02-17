import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {OrderExpr, OrderExprBuilder} from './OrderExpr';
import {type OrderExprJson} from '../json/OrderExprJson';
import {type OrderExprWrapperJson} from '../json/OrderExprWrapperJson';

export class FieldOrderExpr
    extends OrderExpr {

    private fieldName: string;

    constructor(builder: FieldOrderExprBuilder) {
        super(builder);
        this.fieldName = builder.fieldName;
    }

    getFieldName(): string {
        return this.fieldName;
    }

    toJson(): OrderExprJson {
        return {
            fieldName: this.fieldName,
            direction: this.getDirection()
        };
    }

    toWrappedJson(): OrderExprWrapperJson {
        return {
            FieldOrderExpr: this.toJson()
        };
    }

    toString() {
        return this.fieldName + ' ' + super.getDirection();
    }

    static fromString(s: string): FieldOrderExpr {
        const parts = s.trim().split(' ');
        return new FieldOrderExprBuilder().setFieldName(parts[0]).setDirection(parts[1]).build() as FieldOrderExpr;
    }

    equals(o: Equitable): boolean {
        if (!super.equals(o)) {
            return false;
        }
        if (!ObjectHelper.iFrameSafeInstanceOf(o, FieldOrderExpr)) {
            return false;
        }
        const other = o as FieldOrderExpr;
        if (this.fieldName.toLowerCase() !== other.getFieldName().toLowerCase()) {
            return false;
        }
        return true;
    }
}

export class FieldOrderExprBuilder
    extends OrderExprBuilder {

    fieldName: string;

    constructor(json?: OrderExprJson) {
        super(json);
        if (json) {
            this.fieldName = json.fieldName;
        }
    }

    public setFieldName(value: string): FieldOrderExprBuilder {
        this.fieldName = value;
        return this;
    }

    public build(): FieldOrderExpr {
        return new FieldOrderExpr(this);
    }
}
