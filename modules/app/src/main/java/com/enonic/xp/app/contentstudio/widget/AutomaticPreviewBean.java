package com.enonic.xp.app.contentstudio.widget;

import java.util.Comparator;
import java.util.function.Supplier;

import com.enonic.xp.admin.widget.WidgetDescriptor;
import com.enonic.xp.admin.widget.WidgetDescriptorService;
import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.script.PortalScriptService;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.script.ScriptExports;
import com.enonic.xp.script.ScriptValue;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.web.HttpStatus;
import com.enonic.xp.web.WebException;

import static java.lang.Integer.parseInt;

public class AutomaticPreviewBean
    implements ScriptBean
{
    private Supplier<PortalRequest> portalRequestSupplier;

    private Supplier<PortalScriptService> scriptServiceSupplier;

    private Supplier<WidgetDescriptorService> widgetDescriptorSupplier;

    public static final String CAN_RENDER_METHOD_NAME = "canRender";

    public static final String ORDER_CONFIG_FIELD = "order";

    public static final String AUTO_CONFIG_FIELD = "auto";

    @Override
    public void initialize( final BeanContext beanContext )
    {
        this.scriptServiceSupplier = beanContext.getService( PortalScriptService.class );
        this.widgetDescriptorSupplier = beanContext.getService( WidgetDescriptorService.class );
        this.portalRequestSupplier = beanContext.getBinding( PortalRequest.class );
    }

    public Object renderByInterface( final String interfaceName )
    {
        final PortalRequest portalRequest = this.portalRequestSupplier.get();
        // Add automatic flag to the request parameters for other widgets
        // to know if they were called directly or not
        portalRequest.getParams().put( "auto", "true" );
        final PortalRequestMapper portalRequestMapper = new PortalRequestMapper( portalRequest );

        final ScriptExports matchingScript = this.widgetDescriptorSupplier.get()
            .getByInterfaces( interfaceName ).stream()
            .filter( widget -> Boolean.parseBoolean( widget.getConfig().get( AUTO_CONFIG_FIELD ) ) )
            .sorted( Comparator.comparingInt( widget -> parseInt( widget.getConfig().get( ORDER_CONFIG_FIELD ) ) ) )
            .map( ( descriptor ) -> this.toScriptExports( descriptor, portalRequestMapper ) )
            .filter( script -> script != null && script.hasMethod( "get" ) )
            .findFirst().orElse( null );

        if ( matchingScript != null )
        {
            final ScriptValue response = matchingScript.executeMethod( "get", portalRequestMapper );
            return new ScriptValueMapper( response );
        }

        throw new WebException( HttpStatus.IM_A_TEAPOT, "No widget found for interface: " + interfaceName );
    }

    private ScriptExports toScriptExports( WidgetDescriptor widgetDescriptor, final PortalRequestMapper portalRequestMapper )
    {

        ResourceKey script = ResourceKey.from( widgetDescriptor.getApplicationKey(),
                                               "/admin/widgets/" + widgetDescriptor.getName() +
                                                   "/" + widgetDescriptor.getName() + ".js" );

        if ( this.scriptServiceSupplier.get().hasScript( script ) )
        {
            ScriptExports scriptExports = this.scriptServiceSupplier.get().execute( script );

            boolean canRender = scriptExports.hasMethod( CAN_RENDER_METHOD_NAME ) &&
                scriptExports.executeMethod( CAN_RENDER_METHOD_NAME, portalRequestMapper ).getValue( Boolean.class );

            if ( canRender )
            {
                return scriptExports;
            }
        }

        return null;
    }
}
