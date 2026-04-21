package com.enonic.app.main;

import java.util.function.Supplier;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.style.StyleDescriptor;
import com.enonic.xp.style.StyleDescriptorService;
import com.enonic.xp.util.GenericValue;

public final class GetStyleBean
    implements ScriptBean
{
    private Supplier<StyleDescriptorService> serviceSupplier;

    private ApplicationKey application;

    public void setApplication( final String application )
    {
        this.application = ApplicationKey.from( application );
    }

    public String execute()
    {
        final StyleDescriptor styleDescriptor = serviceSupplier.get().getByApplication( application );

        if ( styleDescriptor == null )
        {
            return "";
        }

        final StringBuilder builder = new StringBuilder();

        styleDescriptor.getElements().forEach( element -> {
            final GenericValue editor = element.getEditor();
            editor.optional( "css" ).ifPresent( style -> builder.append( style.asString() ).append( "\n" ) );
        } );

        return builder.toString();
    }

    @Override
    public void initialize( final BeanContext beanContext )
    {
        this.serviceSupplier = beanContext.getService( StyleDescriptorService.class );
    }
}
