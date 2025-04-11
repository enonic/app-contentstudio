package com.enonic.xp.app.contentstudio.rest.resource.security;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.security.json.FetchPrincipalsByKeysJson;
import com.enonic.xp.app.contentstudio.rest.resource.security.json.FindPrincipalsResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.security.json.GroupJson;
import com.enonic.xp.app.contentstudio.rest.resource.security.json.PrincipalJson;
import com.enonic.xp.app.contentstudio.rest.resource.security.json.RoleJson;
import com.enonic.xp.app.contentstudio.rest.resource.security.json.UserJson;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.security.Group;
import com.enonic.xp.security.IdProviderKey;
import com.enonic.xp.security.Principal;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.PrincipalKeys;
import com.enonic.xp.security.PrincipalQuery;
import com.enonic.xp.security.PrincipalQueryResult;
import com.enonic.xp.security.PrincipalRelationship;
import com.enonic.xp.security.PrincipalRelationships;
import com.enonic.xp.security.PrincipalType;
import com.enonic.xp.security.Principals;
import com.enonic.xp.security.Role;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.User;

import static com.google.common.base.Strings.isNullOrEmpty;
import static com.google.common.base.Strings.nullToEmpty;
import static java.util.stream.Collectors.toList;


@SuppressWarnings("UnusedDeclaration")
@Path(ResourceConstants.REST_ROOT + "security")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class SecurityResource
    implements JaxRsComponent
{
    private SecurityService securityService;

    private List<PrincipalType> parsePrincipalTypes( final String types )
    {
        final List<PrincipalType> principalTypes = new ArrayList<>();
        if ( !nullToEmpty( types ).isBlank() )
        {
            final String[] typeItems = types.split( "," );
            for ( String typeItem : typeItems )
            {
                try
                {
                    principalTypes.add( PrincipalType.valueOf( typeItem.toUpperCase() ) );
                }
                catch ( IllegalArgumentException e )
                {
                    throw new WebApplicationException( "Invalid principal type: " + typeItem );
                }
            }
        }
        return principalTypes;
    }

    @GET
    @Path("principals")
    public FindPrincipalsResultJson findPrincipals( @QueryParam("types") final String types, @QueryParam("query") final String query,
                                                    @QueryParam("idProviderKey") final String idProviderKey,
                                                    @QueryParam("from") final Integer from, @QueryParam("size") final Integer size )
    {

        final List<PrincipalType> principalTypes = parsePrincipalTypes( types );

        final PrincipalQuery.Builder principalQuery = PrincipalQuery.create().
            getAll().
            includeTypes( principalTypes ).
            searchText( query );

        if ( !isNullOrEmpty( idProviderKey ) )
        {
            principalQuery.idProvider( IdProviderKey.from( idProviderKey ) );
        }

        if ( from != null )
        {
            principalQuery.from( from );
        }

        if ( size != null )
        {
            principalQuery.size( size );
        }

        final PrincipalQueryResult result = securityService.query( principalQuery.build() );
        return new FindPrincipalsResultJson( result.getPrincipals(), result.getTotalSize() );
    }

    @POST
    @Path("principals/resolveByKeys")
    public List<PrincipalJson> getPrincipalsByKeys( final FetchPrincipalsByKeysJson json )
    {
        final PrincipalKeys principalKeys = PrincipalKeys.from( json.getKeys().stream().map( PrincipalKey::from ).collect( toList() ) );

        final Principals principalsResult = securityService.getPrincipals( principalKeys );

        return principalsResult.stream().map( principal -> this.principalToJson( principal, json.getResolveMemberships() ) ).collect(
            toList() );
    }

    @GET
    @Path("principals/{key:.+}")
    public PrincipalJson getPrincipalByKey( @PathParam("key") final String keyParam,
                                            @QueryParam("memberships") final String resolveMembershipsParam )
    {
        final boolean resolveMemberships = "true".equals( resolveMembershipsParam );
        final PrincipalKey principalKey = PrincipalKey.from( keyParam );
        final Optional<? extends Principal> principalResult = securityService.getPrincipal( principalKey );

        if ( principalResult.isEmpty() )
        {
            throw new WebApplicationException( String.format( "Principal [%s] was not found", keyParam ), Response.Status.NOT_FOUND );
        }

        final Principal principal = principalResult.get();

        return this.principalToJson( principal, resolveMemberships );
    }

    private PrincipalJson principalToJson( final Principal principal, final Boolean resolveMemberships )
    {

        if ( principal == null )
        {
            return null;
        }

        final PrincipalKey principalKey = principal.getKey();

        switch ( principalKey.getType() )
        {
            case USER:
                if ( resolveMemberships )
                {
                    final PrincipalKeys membershipKeys = securityService.getMemberships( principalKey );
                    final Principals memberships = securityService.getPrincipals( membershipKeys );
                    return new UserJson( (User) principal, memberships );
                }
                else
                {
                    return new UserJson( (User) principal );
                }

            case GROUP:
                final PrincipalKeys groupMembers = getMembers( principalKey );
                if ( resolveMemberships )
                {
                    final PrincipalKeys membershipKeys = securityService.getMemberships( principalKey );
                    final Principals memberships = securityService.getPrincipals( membershipKeys );
                    return new GroupJson( (Group) principal, groupMembers, memberships );
                }
                else
                {
                    return new GroupJson( (Group) principal, groupMembers );
                }

            case ROLE:
                final PrincipalKeys roleMembers = getMembers( principalKey );
                return new RoleJson( (Role) principal, roleMembers );
        }
        return null;
    }

    private PrincipalKeys getMembers( final PrincipalKey principal )
    {
        final PrincipalRelationships relationships = this.securityService.getRelationships( principal );
        final List<PrincipalKey> members = relationships.stream().map( PrincipalRelationship::getTo ).collect( toList() );
        return PrincipalKeys.from( members );
    }

    @Reference
    public void setSecurityService( final SecurityService securityService )
    {
        this.securityService = securityService;
    }

}
