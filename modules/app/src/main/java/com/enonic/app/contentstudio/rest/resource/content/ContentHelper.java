package com.enonic.app.contentstudio.rest.resource.content;

import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.node.NodePath;

public class ContentHelper
{
    public static NodePath getContentRoot()
    {
        final NodePath nodePath = (NodePath) ContextAccessor.current().getAttribute( "contentRootPath");
        return nodePath != null ? nodePath : ContentConstants.CONTENT_ROOT_PATH;
    }
}
