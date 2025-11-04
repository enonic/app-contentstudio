package com.enonic.xp.app.contentstudio.rest.resource.schema.content;

import java.util.Collection;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.collect.ImmutableList;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.contentstudio.json.schema.content.ContentTypeJson;
import com.enonic.xp.app.contentstudio.json.schema.content.ContentTypeSummaryJson;
import com.enonic.xp.app.contentstudio.json.schema.content.ContentTypeSummaryListJson;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.schema.SchemaImageHelper;
import com.enonic.xp.app.contentstudio.rest.resource.schema.formfragment.CmsFormFragmentResolver;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.schema.content.CmsFormFragmentService;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeNames;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.ContentTypes;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.security.RoleKeys;

import static com.google.common.base.Strings.isNullOrEmpty;

@Path(ResourceConstants.REST_ROOT + "schema/content")
@Produces("application/json")
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class ContentTypeResource
    implements JaxRsComponent
{
    private static final SchemaImageHelper HELPER = new SchemaImageHelper();

    private ContentTypeService contentTypeService;

    private LocaleService localeService;

    private CmsFormFragmentService cmsFormFragmentService;

    @GET
    public ContentTypeJson get( @QueryParam("name") final String nameAsString, @Context HttpServletRequest request )
    {
        final ContentTypeName name = ContentTypeName.from( nameAsString );
        final GetContentTypeParams getContentTypes = GetContentTypeParams.from( name );

        final ContentType contentType = contentTypeService.getByName( getContentTypes );
        if ( contentType == null )
        {
            throw new WebApplicationException( String.format( "ContentType [%s] not found", name ), Response.Status.NOT_FOUND );
        }
        final LocaleMessageResolver localeMessageResolver =
            new LocaleMessageResolver( this.localeService, contentType.getName().getApplicationKey(), request.getLocales() );

        final ContentTypeIconUrlResolver contentTypeIconUrlResolver =
            new ContentTypeIconUrlResolver( new ContentTypeIconResolver( contentTypeService ), request );

        return ContentTypeJson.
            create().
            setContentType( contentType ).
            setContentTypeIconUrlResolver( contentTypeIconUrlResolver ).
            setCmsFormFragmentResolver( new CmsFormFragmentResolver( this.cmsFormFragmentService ) ).
            setLocaleMessageResolver( localeMessageResolver ).
            setRequest( request ).
            build();
    }

    @GET
    @Path("all")
    public ContentTypeSummaryListJson all( @Context HttpServletRequest request )
    {
        return list( request );
    }

    @GET
    @Path("list")
    public ContentTypeSummaryListJson list( @Context HttpServletRequest request )
    {
        final ContentTypes contentTypes = contentTypeService.getAll();
        final ContentTypeIconUrlResolver contentTypeIconUrlResolver =
            new ContentTypeIconUrlResolver( new ContentTypeIconResolver( contentTypeService ), request );
        ImmutableList.Builder<ContentTypeSummaryJson> summariesJsonBuilder = new ImmutableList.Builder();

        contentTypes.forEach( contentType -> {
            summariesJsonBuilder.add( new ContentTypeSummaryJson( contentType, contentTypeIconUrlResolver,
                                                                  new LocaleMessageResolver( localeService, contentType.getName()
                                                                      .getApplicationKey(), request.getLocales() ), request ) );
        } );

        return new ContentTypeSummaryListJson( summariesJsonBuilder.build() );
    }

    @GET
    @Path("getMimeTypes")
    public Collection<String> getMimeTypes( @QueryParam("typeNames") final String typeNames )
    {
        return contentTypeService.getMimeTypes( ContentTypeNames.from( typeNames.split( "," ) ) );
    }

    @GET
    @Path("byApplication")
    public ContentTypeSummaryListJson getByApplication( @QueryParam("applicationKey") final String applicationKey,
                                                        @Context HttpServletRequest request )
    {
        final ContentTypes contentTypes = contentTypeService.getByApplication( ApplicationKey.from( applicationKey ) );
        final ContentTypeIconUrlResolver contentTypeIconUrlResolver =
            new ContentTypeIconUrlResolver( new ContentTypeIconResolver( contentTypeService ), request );
        final LocaleMessageResolver localeMessageResolver =
            new LocaleMessageResolver( this.localeService, ApplicationKey.from( applicationKey ), request.getLocales() );
        return new ContentTypeSummaryListJson( contentTypes, contentTypeIconUrlResolver, localeMessageResolver, request );
    }

    @GET
    @Path("icon/{contentTypeName}")
    @Produces("image/*")
    public Response getIcon( @PathParam("contentTypeName") final String contentTypeNameAsString,
                             @QueryParam("size") @DefaultValue("128") final int size, @QueryParam("hash") final String hash )
        throws Exception
    {
        final ContentTypeName contentTypeName = ContentTypeName.from( contentTypeNameAsString );
        final Icon icon = new ContentTypeIconResolver( contentTypeService ).resolveIcon( contentTypeName );
        if ( icon == null )
        {
            throw new WebApplicationException( Response.Status.NOT_FOUND );
        }

        final byte[] image = HELPER.readIconImage( icon, size );
        final Response.ResponseBuilder responseBuilder = Response.ok( image, icon.getMimeType() );

        if ( !isNullOrEmpty( hash ) )
        {
            applyMaxAge( Integer.MAX_VALUE, responseBuilder );
        }
        return responseBuilder.build();
    }

    private void applyMaxAge( int maxAge, final Response.ResponseBuilder responseBuilder )
    {
        final CacheControl cacheControl = new CacheControl();
        cacheControl.setMaxAge( maxAge );
        responseBuilder.cacheControl( cacheControl );
    }

    @Reference
    public void setContentTypeService( final ContentTypeService contentTypeService )
    {
        this.contentTypeService = contentTypeService;
    }

    @Reference
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }

    @Reference
    public void setCmsFormFragmentService( final CmsFormFragmentService cmsFormFragmentService )
    {
        this.cmsFormFragmentService = cmsFormFragmentService;
    }
}
