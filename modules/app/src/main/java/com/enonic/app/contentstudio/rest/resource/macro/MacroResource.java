package com.enonic.app.contentstudio.rest.resource.macro;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.html.HtmlEscapers;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationKeys;
import com.enonic.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.app.contentstudio.rest.resource.macro.json.ApplicationKeysParam;
import com.enonic.app.contentstudio.rest.resource.macro.json.MacroDescriptorJson;
import com.enonic.app.contentstudio.rest.resource.macro.json.MacrosJson;
import com.enonic.app.contentstudio.rest.resource.macro.json.PreviewMacroJson;
import com.enonic.app.contentstudio.rest.resource.macro.json.PreviewMacroResultJson;
import com.enonic.app.contentstudio.rest.resource.macro.json.PreviewMacroStringResultJson;
import com.enonic.app.contentstudio.rest.resource.macro.json.PreviewStringMacroJson;
import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.data.Property;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.macro.Macro;
import com.enonic.xp.macro.MacroDescriptor;
import com.enonic.xp.macro.MacroDescriptorService;
import com.enonic.xp.macro.MacroKey;
import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalRequestAccessor;
import com.enonic.xp.portal.PortalResponse;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.portal.macro.MacroContext;
import com.enonic.xp.portal.macro.MacroProcessor;
import com.enonic.xp.portal.macro.MacroProcessorFactory;
import com.enonic.xp.portal.url.PageUrlParams;
import com.enonic.xp.portal.url.PortalUrlService;
import com.enonic.xp.portal.url.UrlTypeConstants;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.site.Site;
import com.enonic.xp.web.HttpMethod;

import static com.google.common.base.Strings.nullToEmpty;

@Path(ResourceConstants.REST_ROOT + "cms/{project:([^/]+)}/macro")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class MacroResource
    implements JaxRsComponent
{

    private MacroDescriptorService macroDescriptorService;

    private MacroProcessorFactory macroProcessorFactory;

    private PortalUrlService portalUrlService;

    private ContentService contentService;

    private LocaleService localeService;

    private MixinService mixinService;

    @POST
    @Path("getByApps")
    public MacrosJson getMacrosByApps( final ApplicationKeysParam appKeys, @Context HttpServletRequest request )
    {
        final Set<ApplicationKey> keys = appKeys.getKeys();
        keys.add( ApplicationKey.SYSTEM );

        final List<MacroDescriptorJson> macroDescriptorJsons = new ArrayList<>();

        final MacroIconUrlResolver macroIconUrlResolver =
            new MacroIconUrlResolver( new MacroIconResolver( this.macroDescriptorService ), request );

        ApplicationKeys.from( keys ).forEach( applicationKey -> {
            macroDescriptorJsons.addAll( this.macroDescriptorService.getByApplication( applicationKey )
                                             .stream()
                                             .map( macroDescriptor -> MacroDescriptorJson.create()
                                                 .setMacroDescriptor( macroDescriptor )
                                                 .setMacroIconUrlResolver( macroIconUrlResolver )
                                                 .setLocaleMessageResolver(
                                                     new LocaleMessageResolver( localeService, applicationKey, request.getLocales() ) )
                                                 .setInlineMixinResolver( new InlineMixinResolver( mixinService ) )
                                                 .build() )
                                             .collect( Collectors.toList() ) );
        } );

        return new MacrosJson( macroDescriptorJsons );
    }

    @POST
    @Path("preview")
    public PreviewMacroResultJson macroPreview( @PathParam("project") final String projectName,
                                                @Context HttpServletRequest request,
                                                final PreviewMacroJson previewMacroJson )
    {
        final MacroKey macroKey = previewMacroJson.getMacroKey();
        final MacroDescriptor macroDescriptor = this.macroDescriptorService.getByKey( macroKey );
        if ( macroDescriptor == null )
        {
            throw new WebApplicationException( Response.Status.NOT_FOUND );
        }
        final MacroProcessor macroProcessor = macroProcessorFactory.fromScript( macroDescriptor.toControllerResourceKey() );
        if ( macroProcessor == null )
        {
            throw new WebApplicationException( Response.Status.NOT_FOUND );
        }

        final ApplicationKey appKey = macroDescriptor.getKey().getApplicationKey();

        final PortalRequest portalRequest = createPortalRequest( request, previewMacroJson.getContentPath(), appKey, projectName );
        final MacroContext macroContext = createMacroContext( macroDescriptor, previewMacroJson.getFormData(), portalRequest );

        final PortalResponse response = macroProcessor.process( macroContext );
        final Macro macro = createMacro( macroDescriptor, previewMacroJson.getFormData() );
        return new PreviewMacroResultJson( macro, response );
    }

    @POST
    @Path("previewString")
    public PreviewMacroStringResultJson macroPreviewString( final PreviewStringMacroJson previewStringMacroJson )
    {
        final MacroKey macroKey = previewStringMacroJson.getMacroKey();
        final MacroDescriptor macroDescriptor = this.macroDescriptorService.getByKey( macroKey );
        if ( macroDescriptor == null )
        {
            throw new WebApplicationException( Response.Status.NOT_FOUND );
        }

        final Macro macro = createMacro( macroDescriptor, previewStringMacroJson.getFormData() );
        return new PreviewMacroStringResultJson( macro );
    }

    private PortalRequest createPortalRequest( final HttpServletRequest req, final ContentPath contentPath, final ApplicationKey appKey,
                                               final String projectName )
    {
        final PortalRequest portalRequest = new PortalRequest();
        final String baseUri = "/admin/site/" + RenderMode.EDIT;
        final RepositoryId repositoryId = ProjectName.from( projectName ).getRepoId();

        portalRequest.setRawRequest( req );
        portalRequest.setMethod( HttpMethod.GET );
        portalRequest.setContentType( req.getContentType() );
        portalRequest.setBaseUri( baseUri );
        portalRequest.setMode( RenderMode.EDIT );
        portalRequest.setBranch( ContentConstants.BRANCH_DRAFT );
        portalRequest.setScheme( req.getScheme() );
        portalRequest.setHost( req.getServerName() );
        portalRequest.setPort( req.getServerPort() );
        portalRequest.setRemoteAddress( req.getRemoteAddr() );
        portalRequest.setContentPath( contentPath );
        portalRequest.setRepositoryId( repositoryId );
        portalRequest.setRawPath( baseUri + "/" + projectName + "/" + ContentConstants.BRANCH_DRAFT + contentPath );

        setHeaders( req, portalRequest );
        setCookies( req, portalRequest );

        final PortalRequest oldPortalRequest = PortalRequestAccessor.get();
        try
        {
            PortalRequestAccessor.set( portalRequest );

            final PageUrlParams pageFullUrlParams = new PageUrlParams().path( contentPath.toString() ).type( UrlTypeConstants.ABSOLUTE );
            final PageUrlParams pageUrlParams = new PageUrlParams().path( contentPath.toString() );

            portalRequest.setUrl( portalUrlService.pageUrl( pageFullUrlParams ) );
            portalRequest.setPath( portalUrlService.pageUrl( pageUrlParams ) );
        }
        finally
        {
            PortalRequestAccessor.set( oldPortalRequest );
        }

        portalRequest.setApplicationKey( appKey );
        final Content content = getContent( contentPath );
        portalRequest.setContent( content );
        portalRequest.setSite( resolveSite( content ) );
        return portalRequest;
    }

    private MacroContext createMacroContext( final MacroDescriptor macroDescriptor, final PropertyTree formData,
                                             final PortalRequest portalRequest )
    {
        final MacroContext.Builder context = MacroContext.create().name( macroDescriptor.getName() );
        String body = nullToEmpty( formData.getString( "body" ) );
        body = HtmlEscapers.htmlEscaper().escape( body );
        context.body( body );
        for ( Property prop : formData.getProperties() )
        {
            if ( !"body".equals( prop.getName() ) && prop.hasNotNullValue() )
            {
                final String value = HtmlEscapers.htmlEscaper().escape( prop.getValue().asString() );
                context.param( prop.getName(), value );
            }
        }
        context.request( portalRequest );
        return context.build();
    }

    private Macro createMacro( final MacroDescriptor macroDescriptor, final PropertyTree formData )
    {
        final Macro.Builder context = Macro.create().name( macroDescriptor.getName() );
        final String body = nullToEmpty( formData.getString( "body" ) );
        context.body( body );
        for ( Property prop : formData.getProperties() )
        {
            if ( !"body".equals( prop.getName() ) && prop.hasNotNullValue() )
            {
                context.param( prop.getName(), prop.getValue().asString() );
            }
        }
        return context.build();
    }

    private Content getContent( final ContentPath contentPath )
    {
        try
        {
            return this.contentService.getByPath( contentPath );
        }
        catch ( ContentNotFoundException e )
        {
            return null;
        }
    }

    private Site resolveSite( final Content content )
    {
        if ( content == null )
        {
            return null;
        }
        try
        {
            return this.contentService.getNearestSite( content.getId() );
        }
        catch ( ContentNotFoundException e )
        {
            return null;
        }
    }

    private void setHeaders( final HttpServletRequest from, final PortalRequest to )
    {
        for ( final String key : Collections.list( from.getHeaderNames() ) )
        {
            to.getHeaders().put( key, from.getHeader( key ) );
        }
    }

    private void setCookies( final HttpServletRequest from, final PortalRequest to )
    {
        final Cookie[] cookies = from.getCookies();
        if ( cookies == null )
        {
            return;
        }

        for ( final Cookie cookie : cookies )
        {
            to.getCookies().put( cookie.getName(), cookie.getValue() );
        }
    }

    @Reference
    public void setMacroDescriptorService( final MacroDescriptorService macroDescriptorService )
    {
        this.macroDescriptorService = macroDescriptorService;
    }

    @Reference
    public void setMacroProcessorFactory( final MacroProcessorFactory macroProcessorFactory )
    {
        this.macroProcessorFactory = macroProcessorFactory;
    }

    @Reference
    public void setPortalUrlService( final PortalUrlService portalUrlService )
    {
        this.portalUrlService = portalUrlService;
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }

    @Reference
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }

    @Reference
    public void setMixinService( final MixinService mixinService )
    {
        this.mixinService = mixinService;
    }
}
