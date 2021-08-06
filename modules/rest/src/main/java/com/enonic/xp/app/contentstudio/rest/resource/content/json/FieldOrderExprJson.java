package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.index.IndexPath;
import com.enonic.xp.query.expr.FieldOrderExpr;
import com.enonic.xp.query.expr.OrderExpr;

public class FieldOrderExprJson
    extends OrderExprJson
{
    private final String fieldName;

    private final String direction;

    private final FieldOrderExpr orderExpr;

    public FieldOrderExprJson( final FieldOrderExpr orderExpr )
    {
        this.fieldName = orderExpr.getField().getFieldPath();
        this.direction = orderExpr.getDirection().name();
        this.orderExpr = orderExpr;
    }

    @JsonCreator
    public FieldOrderExprJson( @JsonProperty("fieldName") final String fieldName, //
                               @JsonProperty("direction") final String direction )
    {
        super();
        this.fieldName = fieldName;
        this.direction = direction;

        this.orderExpr = FieldOrderExpr.create( IndexPath.from( fieldName ), OrderExpr.Direction.valueOf( direction ) );
    }

    @SuppressWarnings("UnusedDeclaration")
    public String getFieldName()
    {
        return fieldName;
    }

    @SuppressWarnings("UnusedDeclaration")
    public String getDirection()
    {
        return direction;
    }

    @Override
    @JsonIgnore
    public OrderExpr getOrderExpr()
    {
        return this.orderExpr;
    }
}
