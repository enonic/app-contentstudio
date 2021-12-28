package com.enonic.xp.app.contentstudio;

import java.util.function.Supplier;

import com.enonic.xp.app.contentstudio.service.VisitorService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;

public abstract class ContentVisitorHandler
    implements ScriptBean
{
    protected Supplier<VisitorService> contentVisitorServiceSupplier;

    protected String contentId;

    protected String sessionId;

    protected String userKey;

    @Override
    public void initialize( final BeanContext beanContext )
    {
        this.contentVisitorServiceSupplier = beanContext.getService( VisitorService.class );
    }

    public void setContentId( final String contentId )
    {
        this.contentId = contentId;
    }

    public void setSessionId( final String sessionId )
    {
        this.sessionId = sessionId;
    }

    public void setUserKey( final String userKey )
    {
        this.userKey = userKey;
    }
}
