package com.enonic.xp.app.contentstudio;

import java.util.List;
import java.util.stream.Collectors;

import com.enonic.xp.admin.tool.AdminToolDescriptor;
import com.enonic.xp.admin.tool.AdminToolDescriptorService;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.script.serializer.MapSerializable;
import com.enonic.xp.security.PrincipalKeys;

public final class GetAdminToolsScriptBean
    implements ScriptBean
{
    private AdminToolDescriptorService adminToolDescriptorService;

    private LocaleService localeService;

    public List<MapSerializable> execute()
    {
        final PrincipalKeys principals = ContextAccessor.current().
            getAuthInfo().
            getPrincipals();
        final StringTranslator stringTranslator = new StringTranslator( this.localeService );

        return adminToolDescriptorService.getAllowedAdminToolDescriptors( principals ).
            stream().
            filter( this::isStudioApp ).
            map( adminToolDescriptor -> new AdminToolMapper( adminToolDescriptor,
                                                             adminToolDescriptorService.getIconByKey( adminToolDescriptor.getKey() ),
                                                             stringTranslator) ).
            collect( Collectors.toList() );
    }

    private boolean isStudioApp( AdminToolDescriptor adminToolDescriptor )
    {
        return adminToolDescriptor.getApplicationKey().toString().startsWith( "com.enonic.app.contentstudio" );
    }

    @Override
    public void initialize( final BeanContext context )
    {
        this.adminToolDescriptorService = context.getService( AdminToolDescriptorService.class ).get();
        this.localeService = context.getService( LocaleService.class ).get();
    }
}
