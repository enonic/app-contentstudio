package com.enonic.app.contentstudio.rest.resource.security;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;

import com.enonic.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.jaxrs.impl.MockRestResponse;
import com.enonic.xp.security.Group;
import com.enonic.xp.security.IdProviderKey;
import com.enonic.xp.security.Principal;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.PrincipalKeys;
import com.enonic.xp.security.PrincipalQuery;
import com.enonic.xp.security.PrincipalQueryResult;
import com.enonic.xp.security.PrincipalRelationship;
import com.enonic.xp.security.PrincipalRelationships;
import com.enonic.xp.security.Principals;
import com.enonic.xp.security.Role;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.User;
import com.enonic.xp.web.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class SecurityResourceTest
    extends AdminResourceTestSupport
{
    private static final Instant NOW = Instant.ofEpochSecond( 0 );

    private static final Clock clock = Clock.fixed( NOW, ZoneId.of( "UTC" ) );

    private static final IdProviderKey ID_PROVIDER_1 = IdProviderKey.from( "local" );

    private static final IdProviderKey ID_PROVIDER_2 = IdProviderKey.from( "file-store" );

    private SecurityService securityService;

    @Override
    protected SecurityResource getResourceInstance()
    {
        securityService = mock( SecurityService.class );

        final SecurityResource resource = new SecurityResource();

        resource.setSecurityService( securityService );

        return resource;
    }

    @Test
    public void findPrincipals()
        throws Exception
    {
        final ArgumentCaptor<PrincipalQuery> queryCaptor = ArgumentCaptor.forClass( PrincipalQuery.class );

        final PrincipalQueryResult principalQueryResult = PrincipalQueryResult.create().addPrincipal( User.anonymous() ).
            addPrincipal( Role.create().key( RoleKeys.EVERYONE ).displayName( "everyone" ).build() ).
            build();

        when( securityService.query( isA( PrincipalQuery.class ) ) ).thenReturn( principalQueryResult );

        String result = request().
            path( "security/principals" ).
            queryParam( "types", "user,role" ).
            queryParam( "query", "query" ).
            queryParam( "idProviderKey", "enonic" ).
            queryParam( "from", "0" ).
            queryParam( "size", "10" ).
            get().getAsString();

        verify( securityService, times( 1 ) ).query( queryCaptor.capture() );

        assertEquals( "query", queryCaptor.getValue().getSearchText() );
        assertEquals( 2, queryCaptor.getValue().getPrincipalTypes().size() );
        assertEquals( 0, queryCaptor.getValue().getFrom() );
        assertEquals( 10, queryCaptor.getValue().getSize() );

        assertJson( "findPrincipalsResult.json", result );
    }

    @Test
    public void findPrincipalsWrongPrincipalType()
        throws Exception
    {
        MockRestResponse result = request().
            path( "security/principals" ).
            queryParam( "types", "wrongType" ).
            get();

        assertEquals( HttpStatus.INTERNAL_SERVER_ERROR.value(), result.getStatus() );
    }

    @Test
    public void getUsersFromPrincipals()
        throws Exception
    {
        final Principals principals = createPrincipalsFromUsers();
        assertIterableEquals( principals.getList(), principals.getUsers() );
    }

    @Test
    public void getRolesFromPrincipals()
        throws Exception
    {
        final Principals principals = createPrincipalsFromRoles();
        assertIterableEquals( principals.getList(), principals.getRoles() );
    }

    @Test
    public void getGroupsFromPrincipals()
        throws Exception
    {
        final Principals principals = createPrincipalsFromGroups();
        assertIterableEquals( principals.getList(), principals.getGroups() );
    }

    @Test
    public void getPrincipalUserById()
        throws Exception
    {
        final User user1 = User.create().
            key( PrincipalKey.ofUser( ID_PROVIDER_1, "a" ) ).
            displayName( "Alice" ).
            modifiedTime( Instant.now( clock ) ).
            email( "alice@a.org" ).
            login( "alice" ).
            build();

        final Optional<? extends Principal> userRes = Optional.of( user1 );
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.from( "user:local:alice" ) ) ).thenReturn(
            userRes );

        String jsonString = request().
            path( "security/principals/" + URLEncoder.encode( "user:local:alice", StandardCharsets.UTF_8 ) ).
            get().getAsString();

        assertJson( "getPrincipalUserById.json", jsonString );
    }

    @Test
    public void getPrincipalUserByIdWithMemberships()
        throws Exception
    {
        final User user1 = User.create().
            key( PrincipalKey.ofUser( ID_PROVIDER_1, "a" ) ).
            displayName( "Alice" ).
            modifiedTime( Instant.now( clock ) ).
            email( "alice@a.org" ).
            login( "alice" ).
            build();
        final Group group1 = Group.create().
            key( PrincipalKey.ofGroup( IdProviderKey.system(), "group-a" ) ).
            displayName( "Group A" ).
            modifiedTime( Instant.now( clock ) ).
            description( "group a" ).
            build();
        final Group group2 = Group.create().
            key( PrincipalKey.ofGroup( IdProviderKey.system(), "group-b" ) ).
            displayName( "Group B" ).
            description( "group b" ).
            modifiedTime( Instant.now( clock ) ).
            build();

        final Optional<? extends Principal> userRes = Optional.of( user1 );
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.from( "user:local:a" ) ) ).thenReturn(
            userRes );
        final PrincipalKeys membershipKeys = PrincipalKeys.from( group1.getKey(), group2.getKey() );
        when( securityService.getMemberships( PrincipalKey.from( "user:local:a" ) ) ).thenReturn( membershipKeys );
        final Principals memberships = Principals.from( group1, group2 );
        when( securityService.getPrincipals( membershipKeys ) ).thenReturn( memberships );

        String jsonString = request().
            path( "security/principals/" + URLEncoder.encode( "user:local:a", StandardCharsets.UTF_8 ) ).
            queryParam( "memberships", "true" ).
            get().getAsString();

        assertJson( "getPrincipalUserByIdWithMemberships.json", jsonString );
    }

    @Test
    public void getPrincipalGroupById()
        throws Exception
    {
        final Group group = Group.create().
            key( PrincipalKey.ofGroup( IdProviderKey.system(), "group-a" ) ).
            displayName( "Group A" ).
            description( "group a" ).
            modifiedTime( Instant.now( clock ) ).
            build();

        final Optional<? extends Principal> userRes = Optional.of( group );
        Mockito.<Optional<? extends Principal>>when(
            securityService.getPrincipal( PrincipalKey.from( "group:system:group-a" ) ) ).thenReturn( userRes );

        PrincipalRelationship member1 = PrincipalRelationship.from( group.getKey() ).to( PrincipalKey.from( "user:system:user1" ) );
        PrincipalRelationship member2 = PrincipalRelationship.from( group.getKey() ).to( PrincipalKey.from( "user:system:user2" ) );
        PrincipalRelationships members = PrincipalRelationships.from( member1, member2 );
        when( securityService.getRelationships( PrincipalKey.from( "group:system:group-a" ) ) ).thenReturn( members );

        String jsonString = request().
            path( "security/principals/" + URLEncoder.encode( "group:system:group-a", StandardCharsets.UTF_8 ) ).
            get().getAsString();

        assertJson( "getPrincipalGroupById.json", jsonString );
    }

    @Test
    public void getPrincipalGroupByIdWithMemberships()
        throws Exception
    {
        final Group group = Group.create().
            key( PrincipalKey.ofGroup( IdProviderKey.system(), "group-a" ) ).
            displayName( "Group A" ).
            description( "group a" ).
            modifiedTime( Instant.now( clock ) ).
            build();

        final Role role = Role.create().
            key( PrincipalKey.ofRole( "superuser" ) ).
            displayName( "Super user role" ).
            modifiedTime( Instant.now( clock ) ).
            description( "super u" ).
            build();

        final Optional<? extends Principal> userRes = Optional.of( group );
        Mockito.<Optional<? extends Principal>>when(
            securityService.getPrincipal( PrincipalKey.from( "group:system:group-a" ) ) ).thenReturn( userRes );

        PrincipalRelationship member1 = PrincipalRelationship.from( group.getKey() ).to( PrincipalKey.from( "user:system:user1" ) );
        PrincipalRelationship member2 = PrincipalRelationship.from( group.getKey() ).to( PrincipalKey.from( "user:system:user2" ) );
        PrincipalRelationships members = PrincipalRelationships.from( member1, member2 );
        when( securityService.getRelationships( PrincipalKey.from( "group:system:group-a" ) ) ).thenReturn( members );

        final PrincipalKeys membershipKeys = PrincipalKeys.from( role.getKey() );
        when( securityService.getMemberships( PrincipalKey.from( "group:system:group-a" ) ) ).thenReturn( membershipKeys );
        final Principals memberships = Principals.from( role );
        when( securityService.getPrincipals( membershipKeys ) ).thenReturn( memberships );

        String jsonString = request().
            path( "security/principals/" + URLEncoder.encode( "group:system:group-a", StandardCharsets.UTF_8 ) ).
            queryParam( "memberships", "true" ).
            get().getAsString();

        assertJson( "getPrincipalGroupByIdWithMemberships.json", jsonString );
    }

    @Test
    public void getPrincipalRoleById()
        throws Exception
    {
        final Role role = Role.create().
            key( PrincipalKey.ofRole( "superuser" ) ).
            displayName( "Super user role" ).
            modifiedTime( Instant.now( clock ) ).
            description( "super u" ).
            build();

        final Optional<? extends Principal> userRes = Optional.of( role );
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.from( "role:superuser" ) ) ).thenReturn(
            userRes );

        PrincipalRelationship membership1 = PrincipalRelationship.from( role.getKey() ).to( PrincipalKey.from( "user:system:user1" ) );
        PrincipalRelationship membership2 = PrincipalRelationship.from( role.getKey() ).to( PrincipalKey.from( "user:system:user2" ) );
        PrincipalRelationships memberships = PrincipalRelationships.from( membership1, membership2 );
        when( securityService.getRelationships( PrincipalKey.from( "role:superuser" ) ) ).thenReturn( memberships );

        String jsonString = request().
            path( "security/principals/" + URLEncoder.encode( "role:superuser", StandardCharsets.UTF_8 ) ).
            get().getAsString();

        assertJson( "getPrincipalRoleById.json", jsonString );
    }

    @Test
    public void getPrincipalByIdNotFound()
    {
        SecurityResource securityResource = getResourceInstance();

        final Optional<? extends Principal> userRes = Optional.ofNullable( null );
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.from( "role:superuser" ) ) )
            .thenReturn( userRes );

        final WebApplicationException ex = assertThrows( WebApplicationException.class, () -> {
            securityResource.getPrincipalByKey( "role:superuser", null );
        } );
        assertEquals( "Principal [role:superuser] was not found", ex.getMessage() );
    }

    @Test
    public void getPrincipalsByKeys()
        throws Exception
    {
        final Role role = Role.create().
            key( PrincipalKey.ofRole( "superuser" ) ).
            displayName( "Super user role" ).
            modifiedTime( Instant.now( clock ) ).
            description( "super u" ).
            build();

        final User user = User.create().
            key( PrincipalKey.ofUser( ID_PROVIDER_1, "a" ) ).
            displayName( "Alice" ).
            modifiedTime( Instant.now( clock ) ).
            email( "alice@a.org" ).
            login( "alice" ).
            build();

        final Group group = Group.create().
            key( PrincipalKey.ofGroup( IdProviderKey.system(), "group-a" ) ).
            displayName( "Group A" ).
            description( "group a" ).
            modifiedTime( Instant.now( clock ) ).
            build();

        when( securityService.getPrincipals( PrincipalKeys.from( user.getKey(), group.getKey(), role.getKey() ) ) ).thenReturn(
            Principals.from( user, group, role ) );

        when( securityService.getRelationships( PrincipalKey.from( group.getKey().toString() ) ) ).thenReturn(
            PrincipalRelationships.empty() );
        when( securityService.getRelationships( PrincipalKey.from( role.getKey().toString() ) ) ).thenReturn(
            PrincipalRelationships.empty() );

        final String jsonString = request().
            path( "security/principals/resolveByKeys" ).entity( readFromFile( "getPrincipalsByKeysParams.json" ),
                                                                MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertJson( "getPrincipalsByKeys.json", jsonString );
    }

    private Principals createPrincipalsFromUsers()
    {
        final User user1 = User.create().
            key( PrincipalKey.ofUser( ID_PROVIDER_1, "a" ) ).
            displayName( "Alice" ).
            modifiedTime( Instant.now( clock ) ).
            email( "alice@a.org" ).
            login( "alice" ).
            build();

        final User user2 = User.create().
            key( PrincipalKey.ofUser( ID_PROVIDER_2, "b" ) ).
            displayName( "Bobby" ).
            modifiedTime( Instant.now( clock ) ).
            email( "bobby@b.org" ).
            login( "bobby" ).
            build();
        return Principals.from( user1, user2 );
    }

    private Principals createPrincipalsFromRoles()
    {
        final Role role1 = Role.create().
            key( PrincipalKey.ofRole( "a" ) ).
            displayName( "Destructors" ).
            modifiedTime( Instant.now( clock ) ).
            build();

        final Role role2 = Role.create().
            key( PrincipalKey.ofRole( "b" ) ).
            displayName( "Overlords" ).
            modifiedTime( Instant.now( clock ) ).
            build();
        return Principals.from( role1, role2 );
    }

    private Principals createPrincipalsFromGroups()
    {
        final Group group1 = Group.create().
            key( PrincipalKey.ofGroup( ID_PROVIDER_1, "a" ) ).
            displayName( "Destructors" ).
            modifiedTime( Instant.now( clock ) ).
            build();

        final Group group2 = Group.create().
            key( PrincipalKey.ofGroup( ID_PROVIDER_2, "b" ) ).
            displayName( "Overlords" ).
            modifiedTime( Instant.now( clock ) ).
            build();
        return Principals.from( group1, group2 );
    }
}
