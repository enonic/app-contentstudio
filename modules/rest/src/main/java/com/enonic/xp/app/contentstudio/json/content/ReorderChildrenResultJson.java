package com.enonic.xp.app.contentstudio.json.content;

import com.enonic.xp.content.SortContentResult;

public class ReorderChildrenResultJson
{
    private final int movedChildren;

    public ReorderChildrenResultJson( final SortContentResult result )
    {
        this.movedChildren = result.getMovedChildren().getSize();
    }

    @SuppressWarnings("UnusedDeclaration")
    public int getMovedChildren()
    {
        return movedChildren;
    }
}
