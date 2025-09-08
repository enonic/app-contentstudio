package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URL;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import org.assertj.core.api.Assertions;
import org.jboss.resteasy.core.ResteasyContext;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatcher;
import org.mockito.Mockito;
import org.mockito.stubbing.Answer;

import com.google.common.collect.ImmutableSet;
import com.google.common.io.ByteSource;
import com.google.common.net.HttpHeaders;
import com.sun.net.httpserver.HttpServer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;

import com.enonic.xp.aggregation.Aggregation;
import com.enonic.xp.aggregation.Aggregations;
import com.enonic.xp.aggregation.Bucket;
import com.enonic.xp.aggregation.BucketAggregation;
import com.enonic.xp.aggregation.Buckets;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.contentstudio.json.aggregation.BucketAggregationJson;
import com.enonic.xp.app.contentstudio.json.content.ActiveContentVersionEntryJson;
import com.enonic.xp.app.contentstudio.json.content.CompareContentResultJson;
import com.enonic.xp.app.contentstudio.json.content.CompareContentResultsJson;
import com.enonic.xp.app.contentstudio.json.content.ContentIdJson;
import com.enonic.xp.app.contentstudio.json.content.ContentJson;
import com.enonic.xp.app.contentstudio.json.content.ContentListJson;
import com.enonic.xp.app.contentstudio.json.content.ContentSummaryJson;
import com.enonic.xp.app.contentstudio.json.content.ContentTreeSelectorListJson;
import com.enonic.xp.app.contentstudio.json.content.ContentVersionJson;
import com.enonic.xp.app.contentstudio.json.content.ContentVersionViewJson;
import com.enonic.xp.app.contentstudio.json.content.ContentsExistByPathJson;
import com.enonic.xp.app.contentstudio.json.content.ContentsExistJson;
import com.enonic.xp.app.contentstudio.json.content.GetActiveContentVersionsResultJson;
import com.enonic.xp.app.contentstudio.json.content.GetContentVersionsResultJson;
import com.enonic.xp.app.contentstudio.json.content.attachment.AttachmentJson;
import com.enonic.xp.app.contentstudio.json.task.TaskResultJson;
import com.enonic.xp.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.AbstractContentQueryResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ApplyContentPermissionsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.CompareContentsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentIdsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentPathsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentQueryJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentTreeSelectorQueryJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentWithRefsResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.DeleteContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.DuplicateContentsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.GetContentVersionsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.GetDependenciesJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.GetDependenciesResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.GetDescendantsOfContents;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.HasUnpublishedChildrenResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.LocaleJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.LocaleListJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.LocalizeContentsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.MoveContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.PublishContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ResetContentInheritJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.RevertContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.UnpublishContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.ContentVersion;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.ContentVersionPublishInfo;
import com.enonic.xp.attachment.Attachment;
import com.enonic.xp.attachment.Attachments;
import com.enonic.xp.attachment.CreateAttachment;
import com.enonic.xp.blob.BlobKeys;
import com.enonic.xp.blob.NodeVersionKey;
import com.enonic.xp.branch.Branch;
import com.enonic.xp.content.CompareContentResult;
import com.enonic.xp.content.CompareContentResults;
import com.enonic.xp.content.CompareContentsParams;
import com.enonic.xp.content.CompareStatus;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentAlreadyExistsException;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentDependencies;
import com.enonic.xp.content.ContentDependenciesAggregation;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentInheritType;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentPaths;
import com.enonic.xp.content.ContentPropertyNames;
import com.enonic.xp.content.ContentPublishInfo;
import com.enonic.xp.content.ContentQuery;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.ContentValidityParams;
import com.enonic.xp.content.ContentValidityResult;
import com.enonic.xp.content.ContentVersionId;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.CreateContentParams;
import com.enonic.xp.content.CreateMediaParams;
import com.enonic.xp.content.ExtraData;
import com.enonic.xp.content.FindContentByParentParams;
import com.enonic.xp.content.FindContentByParentResult;
import com.enonic.xp.content.FindContentIdsByParentResult;
import com.enonic.xp.content.FindContentIdsByQueryResult;
import com.enonic.xp.content.FindContentPathsByQueryResult;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.content.GetPublishStatusResult;
import com.enonic.xp.content.GetPublishStatusesParams;
import com.enonic.xp.content.GetPublishStatusesResult;
import com.enonic.xp.content.HasUnpublishedChildrenParams;
import com.enonic.xp.content.PublishStatus;
import com.enonic.xp.content.RenameContentParams;
import com.enonic.xp.content.ResetContentInheritParams;
import com.enonic.xp.content.ResolvePublishDependenciesParams;
import com.enonic.xp.content.ResolveRequiredDependenciesParams;
import com.enonic.xp.content.SortContentParams;
import com.enonic.xp.content.SortContentResult;
import com.enonic.xp.content.SyncContentService;
import com.enonic.xp.content.UpdateContentParams;
import com.enonic.xp.content.UpdateMediaParams;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.LocalScope;
import com.enonic.xp.core.impl.schema.content.BuiltinContentTypesAccessor;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.extractor.BinaryExtractor;
import com.enonic.xp.extractor.ExtractedData;
import com.enonic.xp.form.Form;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.index.ChildOrder;
import com.enonic.xp.jaxrs.impl.MockRestResponse;
import com.enonic.xp.node.GetActiveNodeVersionsParams;
import com.enonic.xp.node.GetActiveNodeVersionsResult;
import com.enonic.xp.node.GetNodeVersionsParams;
import com.enonic.xp.node.NodeId;
import com.enonic.xp.node.NodePath;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.node.NodeVersion;
import com.enonic.xp.node.NodeVersionId;
import com.enonic.xp.node.NodeVersionMetadata;
import com.enonic.xp.node.NodeVersionQueryResult;
import com.enonic.xp.node.NodeVersionsMetadata;
import com.enonic.xp.page.Page;
import com.enonic.xp.page.PageRegions;
import com.enonic.xp.page.PageTemplateKey;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.region.LayoutDescriptorService;
import com.enonic.xp.region.PartComponent;
import com.enonic.xp.region.PartDescriptor;
import com.enonic.xp.region.PartDescriptorService;
import com.enonic.xp.region.Region;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.schema.xdata.XDataName;
import com.enonic.xp.security.IdProviderKey;
import com.enonic.xp.security.Principal;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.PrincipalQuery;
import com.enonic.xp.security.PrincipalQueryResult;
import com.enonic.xp.security.PrincipalRelationship;
import com.enonic.xp.security.PrincipalRelationships;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.User;
import com.enonic.xp.security.acl.AccessControlEntry;
import com.enonic.xp.security.acl.AccessControlList;
import com.enonic.xp.security.acl.Permission;
import com.enonic.xp.security.auth.AuthenticationInfo;
import com.enonic.xp.session.SessionMock;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteConfigs;
import com.enonic.xp.task.SubmitLocalTaskParams;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;
import com.enonic.xp.util.BinaryReference;
import com.enonic.xp.util.BinaryReferences;
import com.enonic.xp.web.HttpStatus;
import com.enonic.xp.web.multipart.MultipartForm;
import com.enonic.xp.web.multipart.MultipartItem;

import static com.enonic.xp.security.acl.Permission.CREATE;
import static com.enonic.xp.security.acl.Permission.DELETE;
import static com.enonic.xp.security.acl.Permission.MODIFY;
import static com.enonic.xp.security.acl.Permission.READ;
import static com.google.common.base.Strings.isNullOrEmpty;
import static java.util.Arrays.asList;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.isA;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.only;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

public class ContentResourceTest
    extends AdminResourceTestSupport
{

    private static final IdProviderKey SYSTEM = IdProviderKey.system();

    private final LocalDate currentDate = LocalDate.of( 2013, 8, 23 );

    private final Instant fixedTime = Instant.parse( "2013-08-23T12:55:09.162Z" );

    Set<ContentType> knownContentTypes;

    ContentResource resource;

    AdminRestConfig config;

    private ContentTypeService contentTypeService;

    private ContentService contentService;

    private NodeService nodeService;

    private SecurityService securityService;

    private TaskService taskService;

    private BinaryExtractor binaryExtractor;

    private LayoutDescriptorService layoutDescriptorService;

    private PartDescriptorService partDescriptorService;

    private SyncContentService syncContentService;

    private HttpServletRequest request;

    @Override
    protected ContentResource getResourceInstance()
    {
        contentTypeService = mock( ContentTypeService.class );

        resource = new ContentResource();

        contentService = mock( ContentService.class );
        resource.setContentService( contentService );
        resource.setContentTypeService( contentTypeService );

        knownContentTypes = new HashSet<>( BuiltinContentTypesAccessor.getAll().stream().toList() );

        lenient().when( contentTypeService.getByName(
                argThat( argument -> knownContentTypes.stream().anyMatch( ct -> ct.getName().equals( argument.getContentTypeName() ) ) ) ) )
            .thenAnswer( (Answer<ContentType>) invocation -> knownContentTypes.stream()
                .filter( ct -> ct.getName().equals( invocation.<GetContentTypeParams>getArgument( 0 ).getContentTypeName() ) )
                .findAny()
                .orElseThrow() );

        securityService = mock( SecurityService.class );
        resource.setSecurityService( securityService );

        binaryExtractor = mock( BinaryExtractor.class );
        resource.setExtractor( binaryExtractor );

        taskService = mock( TaskService.class );
        resource.setTaskService( taskService );

        layoutDescriptorService = mock( LayoutDescriptorService.class );
        partDescriptorService = mock( PartDescriptorService.class );

        syncContentService = mock( SyncContentService.class );
        resource.setSyncContentService( syncContentService );

        nodeService = mock( NodeService.class );
        resource.setNodeService( nodeService );

        final ComponentDisplayNameResolverImpl componentNameResolver = new ComponentDisplayNameResolverImpl();
        componentNameResolver.setContentService( contentService );
        componentNameResolver.setLayoutDescriptorService( layoutDescriptorService );
        componentNameResolver.setPartDescriptorService( partDescriptorService );

        final JsonObjectsFactory jsonObjectsFactory = new JsonObjectsFactory();
        jsonObjectsFactory.setComponentNameResolver( componentNameResolver );
        jsonObjectsFactory.setSecurityService( securityService );
        jsonObjectsFactory.setContentTypeService( contentTypeService );
        resource.setJsonObjectsFactory( jsonObjectsFactory );

        config = mock( AdminRestConfig.class, invocation -> invocation.getMethod().getDefaultValue() );
        resource.activate( config );

        this.request = mock( HttpServletRequest.class );
        when( request.getServerName() ).thenReturn( "localhost" );
        when( request.getScheme() ).thenReturn( "http" );
        when( request.getServerPort() ).thenReturn( 80 );
        when( request.getLocales() ).thenReturn( Collections.enumeration( Collections.singleton( Locale.US ) ) );
        ResteasyContext.getContextDataMap().put( HttpServletRequest.class, request );

        return resource;
    }

    @Test
    public void get_content_by_path()
        throws Exception
    {
        final Content content = createContent( "aaa", "my_a_content", "myapplication:my_type" );

        final PropertyTree data = content.getData();

        data.setLong( "myArray[0]", 1L );
        data.setLong( "myArray[1]", 2L );

        data.setDouble( "mySetWithArray.myArray[0]", 3.14159 );
        data.setDouble( "mySetWithArray.myArray[1]", 1.333 );

        when( contentService.getByPath( isA( ContentPath.class ) ) ).thenReturn( content );

        String jsonString = request().path( "content/bypath" ).queryParam( "path", "/my_a_content" ).get().getAsString();

        assertJson( "get_content_full.json", jsonString );
    }

    @Test
    public void get_content_summary_by_path()
        throws Exception
    {
        final Content aContent = createContent( "aaa", "my_a_content", "myapplication:my_type" );

        final PropertyTree aContentData = aContent.getData();
        aContentData.setLocalDate( "myProperty", currentDate );
        aContentData.setLong( "mySet.setProperty1", 1L );
        aContentData.setLong( "mySet.setProperty2", 2L );

        when( contentService.getByPath( isA( ContentPath.class ) ) ).thenReturn( aContent );

        String jsonString =
            request().path( "content/bypath" ).queryParam( "path", "/my_a_content" ).queryParam( "expand", "summary" ).get().getAsString();

        assertJson( "get_content_summary.json", jsonString );
    }

    @Test
    public void get_content_permissions_by_id()
        throws Exception
    {
        final User admin = User.create().displayName( "Admin" ).key( PrincipalKey.from( "user:system:admin" ) ).login( "admin" ).build();
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.from( "user:system:admin" ) ) )
            .thenReturn( Optional.of( admin ) );
        final User anon = User.create().displayName( "Anonymous" ).key( PrincipalKey.ofAnonymous() ).login( "anonymous" ).build();
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.ofAnonymous() ) )
            .thenReturn( Optional.of( anon ) );

        final AccessControlList permissions = getTestPermissions();
        final Content content = createContent( "aaa", "my_a_content", "myapplication:my_type", permissions );

        when( contentService.getById( any( ContentId.class ) ) ).thenReturn( content );

        String jsonString = request().path( "content/contentPermissions" ).queryParam( "id", "my-a-content" ).get().getAsString();

        assertJson( "get_content_permissions_success.json", jsonString );
    }

    @Test
    public void get_content_permissions_by_ids()
        throws Exception
    {
        final User admin = User.create().displayName( "Admin" ).key( PrincipalKey.from( "user:system:admin" ) ).login( "admin" ).build();
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.from( "user:system:admin" ) ) )
            .thenReturn( Optional.of( admin ) );
        final User anon = User.create().displayName( "Anonymous" ).key( PrincipalKey.ofAnonymous() ).login( "anonymous" ).build();
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.ofAnonymous() ) )
            .thenReturn( Optional.of( anon ) );

        final AccessControlList permissionsForContent1 = getTestPermissions();

        final Content content1 = createContent( "aaa", "my_a_content", "myapplication:my_type", permissionsForContent1 );
        final Content content2 = createContent( "bbb", "my_b_content", "myapplication:my_type" );

        when( contentService.getById( content1.getId() ) ).thenReturn( content1 );

        when( contentService.getById( content2.getId() ) ).thenReturn( content2 );

        when( partDescriptorService.getByKey( DescriptorKey.from( "mainapplication:partTemplateName" ) ) ).thenReturn(
            PartDescriptor.create()
                .key( DescriptorKey.from( "mainapplication:partTemplateName" ) )
                .displayName( "my-component" )
                .config( Form.create().build() )
                .build() );

        String jsonString = request().path( "content/contentPermissionsByIds" )
            .entity( readFromFile( "get_permissions_by_ids.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "get_content_permissions_by_ids_success.json", jsonString );
    }

    @Test
    public void get_content_by_path_not_found()
        throws Exception
    {
        when( contentService.getByIds( isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.empty() );

        final MockRestResponse response = request().path( "content/bypath" ).queryParam( "path", "/my_a_content" ).get();

        assertEquals( response.getStatus(), 404 );
    }

    @Test
    public void get_content_id_by_path_and_version()
        throws Exception
    {
        final Content aContent = createContent( "aaa", "my_a_content", "myapplication:my_type" );

        final PropertyTree aContentData = aContent.getData();
        aContentData.setLocalDate( "myProperty", this.currentDate );

        aContentData.setLong( "mySet.setProperty1", 1L );
        aContentData.setLong( "mySet.setProperty2", 2L );

        when( contentService.getByPath( eq( ContentPath.from( "/my_a_content" ) ) ) ).thenReturn( aContent );

        String jsonString =
            request().path( "content/bypath" ).queryParam( "path", "/my_a_content" ).queryParam( "expand", "none" ).get().getAsString();

        assertJson( "get_content_id.json", jsonString );
    }

    @Test
    public void get_content_by_path_and_version_not_found()
        throws Exception
    {
        when( contentService.getByPath( eq( ContentPath.from( "/my_a_content" ) ) ) ).thenReturn( null );

        final MockRestResponse response = request().path( "content/bypath" ).queryParam( "path", "/my_a_content" ).get();
        assertEquals( response.getStatus(), 404 );
    }

    @Test
    public void get_content_by_id()
        throws Exception
    {
        final Content aContent = createContent( "aaa", "my_a_content", "myapplication:my_type" );
        final ContentId contentId = aContent.getId();

        final PropertyTree aContentData = aContent.getData();

        aContentData.setLong( "myArray[0]", 1L );
        aContentData.setLong( "myArray[1]", 2L );

        aContentData.setDouble( "mySetWithArray.myArray[0]", 3.14159 );
        aContentData.setDouble( "mySetWithArray.myArray[1]", 1.333 );

        when( contentService.getById( contentId ) ).thenReturn( aContent );

        String jsonString = request().path( "content" ).queryParam( "id", contentId.toString() ).get().getAsString();

        verify( contentService, only() ).getById( contentId );

        assertJson( "get_content_full.json", jsonString );
    }

    @Test
    public void get_site_content_by_id()
        throws Exception
    {
        PropertyTree siteConfigConfig = new PropertyTree();
        siteConfigConfig.setLong( "A", 1L );
        SiteConfig siteConfig =
            SiteConfig.create().application( ApplicationKey.from( "myapplication" ) ).config( siteConfigConfig ).build();

        Site content = createSite( "aaa", "my_a_content", SiteConfigs.from( siteConfig ) );

        PropertyTree contentData = content.getData();
        contentData.setString( "myProperty", "myValue" );

        when( contentService.getById( ContentId.from( "aaa" ) ) ).thenReturn( content );

        String jsonString = request().path( "content" ).queryParam( "id", "aaa" ).get().getAsString();

        assertJson( "get_content_with_site.json", jsonString );
    }

    @Test
    public void get_page_content_by_id()
        throws Exception
    {
        PropertyTree componentConfig = new PropertyTree();
        componentConfig.setString( "my-prop", "value" );

        PartComponent component =
            PartComponent.create().descriptor( DescriptorKey.from( "mainapplication:partTemplateName" ) ).config( componentConfig ).build();

        Region region = Region.create().name( "my-region" ).add( component ).build();

        PageRegions regions = PageRegions.create().add( region ).build();

        PropertyTree pageConfig = new PropertyTree();
        pageConfig.setString( "background-color", "blue" );
        Page page = Page.create().template( PageTemplateKey.from( "mypagetemplate" ) ).regions( regions ).config( pageConfig ).build();

        Content content = createContent( "aaa", "my_a_content", "myapplication:my_type" );
        content = Content.create( content ).page( page ).build();

        PropertyTree contentData = content.getData();
        contentData.setString( "myProperty", "myValue" );

        when( contentService.getById( ContentId.from( "aaa" ) ) ).thenReturn( content );

        when( partDescriptorService.getByKey( DescriptorKey.from( "mainapplication:partTemplateName" ) ) ).thenReturn(
            PartDescriptor.create()
                .key( DescriptorKey.from( "mainapplication:partTemplateName" ) )
                .displayName( "my-component" )
                .config( Form.create().build() )
                .build() );

        String jsonString = request().path( "content" ).queryParam( "id", "aaa" ).get().getAsString();

        assertJson( "get_content_with_page.json", jsonString );
    }

    @Test
    public void get_content_summary_by_id()
        throws Exception
    {
        final Content aContent = createContent( "aaa", "my_a_content", "myapplication:my_type" );

        final PropertyTree aContentData = aContent.getData();
        aContentData.setLocalDate( "myProperty", this.currentDate );

        aContentData.setLong( "mySet.setProperty1", 1L );
        aContentData.setLong( "mySet.setProperty2", 2L );

        when( contentService.getById( ContentId.from( "aaa" ) ) ).thenReturn( aContent );

        String jsonString = request().path( "content" ).queryParam( "id", "aaa" ).queryParam( "expand", "summary" ).get().getAsString();

        assertJson( "get_content_summary.json", jsonString );
    }

    @Test
    public void get_content_by_id_not_found()
        throws Exception
    {
        when( contentService.getByIds( isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.empty() );

        final MockRestResponse response = request().path( "content" ).queryParam( "id", "aaa" ).get();
        assertEquals( 404, response.getStatus() );
    }

    @Test
    public void get_content_id_by_id_and_version()
        throws Exception
    {
        final Content aContent = createContent( "aaa", "my_a_content", "myapplication:my_type" );
        final ContentId contentId = aContent.getId();
        final ContentVersionId versionId = ContentVersionId.from( "123" );

        final PropertyTree aContentData = aContent.getData();

        aContentData.setString( "myArray[0]", "arrayValue1" );
        aContentData.setString( "myArray[1]", "arrayValue2" );

        aContentData.setDouble( "mySetWithArray.myArray[0]", 3.14159 );
        aContentData.setDouble( "mySetWithArray.myArray[1]", 1.333 );

        when( contentService.getByIdAndVersionId( eq( contentId ), eq( versionId ) ) ).thenReturn( aContent );

        String jsonString = request().path( "content" )
            .queryParam( "id", "aaa" )
            .queryParam( "versionId", versionId.toString() )
            .queryParam( "expand", "none" )
            .get()
            .getAsString();
        verify( contentService, only() ).getByIdAndVersionId( contentId, versionId );

        assertJson( "get_content_id.json", jsonString );
    }

    @Test
    public void get_content_by_id_and_version_not_found()
        throws Exception
    {
        final ContentId contentId = ContentId.from( "aaa" );
        final ContentVersionId versionId = ContentVersionId.from( "123" );
        when( contentService.getByIdAndVersionId( eq( contentId ), eq( versionId ) ) ).thenReturn( null );

        final MockRestResponse response =
            request().path( "content" ).queryParam( "id", contentId.toString() ).queryParam( "versionId", versionId.toString() ).get();

        verify( contentService, only() ).getByIdAndVersionId( contentId, versionId );

        assertEquals( response.getStatus(), 404 );
    }

    @Test
    public void list_content_by_id()
        throws Exception
    {
        final Content cContent = createContent( "ccc", "my_c_content", "myapplication:my_type" );
        when( contentService.getById( isA( ContentId.class ) ) ).thenReturn( cContent );

        final Content aContent = createContent( "aaa", "my_a_content", "myapplication:my_type" );
        final Content bContent = createContent( "bbb", "my_b_content", "myapplication:my_type" );
        when( contentService.findByParent( isA( FindContentByParentParams.class ) ) ).thenReturn(
            FindContentByParentResult.create().contents( Contents.from( aContent, bContent ) ).hits( 2 ).totalHits( 2 ).build() );

        String jsonString = request().path( "content/list" ).queryParam( "parentId", "ccc" ).get().getAsString();

        assertJson( "list_content_summary.json", jsonString );
    }

    @Test
    public void list_content_full_by_id()
        throws Exception
    {
        final Content cContent = createContent( "ccc", "my_c_content", "myapplication:my_type" );
        when( contentService.getById( isA( ContentId.class ) ) ).thenReturn( cContent );

        final Content aContent = createContent( "aaa", "my_a_content", "myapplication:my_type" );
        final Content bContent = createContent( "bbb", "my_b_content", "myapplication:my_type" );
        when( contentService.findByParent( isA( FindContentByParentParams.class ) ) ).thenReturn(
            FindContentByParentResult.create().contents( Contents.from( aContent, bContent ) ).hits( 2 ).totalHits( 2 ).build() );

        String jsonString =
            request().path( "content/list" ).queryParam( "parentId", "ccc" ).queryParam( "expand", "full" ).get().getAsString();

        assertJson( "list_content_full.json", jsonString );
    }

    @Test
    public void list_root_content_id_by_id()
        throws Exception
    {
        final Content aContent = createContent( "aaa", "my_a_content", "myapplication:my_type" );
        final Content bContent = createContent( "bbb", "my_b_content", "myapplication:my_type" );
        when( contentService.findByParent( isA( FindContentByParentParams.class ) ) ).thenReturn(
            FindContentByParentResult.create().contents( Contents.from( aContent, bContent ) ).hits( 2 ).totalHits( 2 ).build() );

        String jsonString = request().path( "content/list" ).queryParam( "expand", "none" ).get().getAsString();

        assertJson( "list_content_id.json", jsonString );
    }

    @Test
    public void batch_content()
        throws Exception
    {

        final Content aContent = createContent( "aaa", "my_a_content", "myapplication:my_type" );
        final Content bContent = createContent( "bbb", "my_b_content", "myapplication:my_type" );

        when( contentService.getByPaths( isA( ContentPaths.class ) ) ).thenReturn( Contents.from( aContent, bContent ) );

        // Request 3 contents and receive 2 (1 should not be found)
        String jsonString = request().path( "content/batch" )
            .entity( readFromFile( "batch_content_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "batch_content_summary.json", jsonString );
    }

    @Test
    public void create_content_exception()
        throws Exception
    {
        IllegalArgumentException e = new IllegalArgumentException( "Exception occured." );

        when( contentService.create( isA( CreateContentParams.class ) ) ).thenThrow( e );

        final MockRestResponse post = request().path( "content/create" )
            .entity( readFromFile( "create_content_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post();

        assertEquals( 500, post.getStatus() );
        assertEquals( "Exception occured.", post.getAsString() );
    }

    @Test
    public void create_content_success()
        throws Exception
    {
        Content content = createContent( "content-id", "content-path", "myapplication:content-type" );
        when( contentService.create( isA( CreateContentParams.class ) ) ).thenReturn( content );

        String jsonString = request().path( "content/create" )
            .entity( readFromFile( "create_content_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "create_content_success.json", jsonString );
    }

    @Test
    public void create_content_inherit()
        throws Exception
    {
        Content content = createContent( "content-id", "content-path", "myapplication:content-type",
                                         Set.of( ContentInheritType.CONTENT, ContentInheritType.PARENT, ContentInheritType.NAME,
                                                 ContentInheritType.SORT ), ProjectName.from( "origin" ) );
        when( contentService.create( isA( CreateContentParams.class ) ) ).thenReturn( content );

        String jsonString = request().path( "content/create" )
            .entity( readFromFile( "create_content_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "create_content_inherit_success.json", jsonString );
    }

    @Test
    public void update_content_new_name_occurred()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.getById( any() ) ).thenReturn( content );

        MockRestResponse response = request().path( "content/update" )
            .entity( readFromFile( "update_content_params_new_name_occured.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post();

        assertEquals( HttpStatus.CONFLICT.value(), response.getStatus() );
    }


    @Test
    public void update_content_failure()
        throws Exception
    {
        Exception e = ContentNotFoundException.create().contentId( ContentId.from( "content-id" ) ).build();

        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.getById( any() ) ).thenReturn( content );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenThrow( e );

        final MockRestResponse post = request().path( "content/update" )
            .entity( readFromFile( "update_content_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post();

        assertEquals( 500, post.getStatus() );
        assertEquals( "Content with id [content-id] not found", post.getAsString() );
    }

    @Test
    public void update_content_nothing_updated()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( content );
        when( contentService.getById( any() ) ).thenReturn( content );
        when( contentService.getById( content.getId() ) ).thenReturn( content );
        String jsonString = request().path( "content/update" )
            .entity( readFromFile( "update_content_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        verify( contentService, times( 0 ) ).rename( isA( RenameContentParams.class ) );

        assertJson( "update_content_nothing_updated.json", jsonString );
    }

    @Test
    public void update_content_success()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( content );
        when( contentService.getById( any() ) ).thenReturn( content );
        String jsonString = request().path( "content/update" )
            .entity( readFromFile( "update_content_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        verify( contentService, times( 0 ) ).rename( isA( RenameContentParams.class ) );

        assertJson( "update_content_success.json", jsonString );
    }

    @Test
    public void update_content_inherit_success()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( content );
        when( contentService.getById( any() ) ).thenReturn( content );
        String jsonString = request().path( "content/update" )
            .entity( readFromFile( "update_content_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        verify( contentService, times( 0 ) ).rename( isA( RenameContentParams.class ) );

        assertJson( "update_content_inherit_success.json", jsonString );
    }

    @Test
    public void update_content_renamed_to_unnamed()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( content );
        when( contentService.getById( any() ) ).thenReturn( content );
        when( contentService.rename( any() ) ).thenReturn( content );
        when( contentService.getByPath( any() ) ).thenThrow( ContentNotFoundException.class );
        when( contentService.getById( content.getId() ) ).thenReturn( content );
        String jsonString = request().path( "content/update" )
            .entity( readFromFile( "update_content_renamed_to_unnamed.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();
        ArgumentCaptor<RenameContentParams> argumentCaptor = ArgumentCaptor.forClass( RenameContentParams.class );

        verify( contentService, times( 1 ) ).rename( argumentCaptor.capture() );
        assertTrue( argumentCaptor.getValue().getNewName().hasUniqueness() );
    }

    @Test
    public void update_content_renamed()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( content );
        when( contentService.getById( any() ) ).thenReturn( content );
        when( contentService.rename( any() ) ).thenReturn( content );
        when( contentService.getByPath( any() ) ).thenThrow( ContentNotFoundException.class );
        when( contentService.getById( content.getId() ) ).thenReturn( content );
        request().path( "content/update" )
            .entity( readFromFile( "update_content_renamed.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();
        ArgumentCaptor<RenameContentParams> argumentCaptor = ArgumentCaptor.forClass( RenameContentParams.class );

        verify( contentService, times( 1 ) ).rename( argumentCaptor.capture() );
        assertTrue( argumentCaptor.getValue().getNewName().toString().equals( "new-name" ) );
    }


    @Test
    public void update_content_success_publish_dates_are_updated()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( content );
        when( contentService.getById( any() ) ).thenReturn( content );
        when( contentService.getById( content.getId() ) ).thenReturn( content );
        String jsonString = request().path( "content/update" )
            .entity( readFromFile( "update_content_params_with_publish_dates.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        verify( contentService, times( 0 ) ).rename( isA( RenameContentParams.class ) );

        assertJson( "update_content_success.json", jsonString );
    }

   /* @Test
    public void update_content_with_new_permissions()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( content );
        when( contentService.getById( any() ) ).thenReturn( content );
        when( contentService.getPermissionsById( content.getId() ) ).
            thenReturn( AccessControlList.of( AccessControlEntry.create().
                allow( Permission.WRITE_PERMISSIONS ).
                principal( PrincipalKey.from( "user:store:user" ) ).
                build() ) );

        request().path( "content/update" ).
            entity( readFromFile( "update_content_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        verify( contentService, times( 1 ) ).applyPermissions( any() );
    }*/

    @Test
    public void update_content_without_publish_from()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( content );
        when( contentService.getById( any() ) ).thenReturn( content );
        final int status = request().path( "content/update" )
            .entity( readFromFile( "update_content_params_without_publish_from.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getStatus();
        assertEquals( 422, status );
    }

    @Test
    public void update_content_with_invalid_publish_info()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( content );
        when( contentService.getById( any() ) ).thenReturn( content );
        final int status = request().path( "content/update" )
            .entity( readFromFile( "update_content_params_with_invalid_publish_info.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getStatus();
        assertEquals( 422, status );
    }

    @Test
    public void publish_content_with_message()
        throws Exception
    {
        ArgumentCaptor<SubmitLocalTaskParams> captor = ArgumentCaptor.forClass( SubmitLocalTaskParams.class );
        when( taskService.submitLocalTask( any( SubmitLocalTaskParams.class ) ) ).thenReturn( TaskId.from( "1" ) );

        final MockRestResponse res = request().path( "content/publish" )
            .entity( readFromFile( "publish_content_with_message.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post();

        verify( taskService ).submitLocalTask( captor.capture() );
        SubmitLocalTaskParams params = captor.getValue();

        assertEquals( 200, res.getStatus() );
        assertEquals( "Publish content", params.getDescription() );
    }

    @Test
    public void applyPermissions()
        throws Exception
    {

        ContentResource contentResource = getResourceInstance();
        when( taskService.submitLocalTask( any( SubmitLocalTaskParams.class ) ) ).thenReturn( TaskId.from( "task-id" ) );

        final ApplyContentPermissionsJson json = mock( ApplyContentPermissionsJson.class );

        TaskResultJson result = contentResource.applyPermissions( json );

        assertEquals( "task-id", result.getTaskId() );
    }

    @Test
    public void getPermissions()
        throws Exception
    {
        final User admin = User.create().displayName( "Admin" ).key( PrincipalKey.from( "user:system:admin" ) ).login( "admin" ).build();
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.from( "user:system:admin" ) ) )
            .thenReturn( Optional.of( admin ) );
        final User anon = User.create().displayName( "Anonymous" ).key( PrincipalKey.ofAnonymous() ).login( "anonymous" ).build();
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.ofAnonymous() ) )
            .thenReturn( Optional.of( anon ) );

        final AccessControlList permissions = getTestPermissions();
        when( contentService.getRootPermissions() ).thenReturn( permissions );

        String jsonString = request().path( "content/rootPermissions" ).get().getAsString();

        verify( contentService, times( 1 ) ).getRootPermissions();

        assertJson( "get_content_root_permissions_success.json", jsonString );
    }

    @Test
    public void getRootPermissionsWithNullPrincipal()
        throws Exception
    {
        final User admin = User.create().displayName( "Admin" ).key( PrincipalKey.from( "user:system:admin" ) ).login( "admin" ).build();
        Mockito.<Optional<? extends Principal>>when( securityService.getPrincipal( PrincipalKey.from( "user:system:admin" ) ) )
            .thenReturn( Optional.of( admin ) );
        final User anon = User.create().displayName( "Anonymous" ).key( PrincipalKey.ofAnonymous() ).login( "anonymous" ).build();
        when( securityService.getPrincipal( PrincipalKey.ofAnonymous() ) ).thenReturn( Optional.ofNullable( null ) );

        final AccessControlList permissions = getTestPermissions();
        when( contentService.getRootPermissions() ).thenReturn( permissions );

        String jsonString = request().path( "content/rootPermissions" ).get().getAsString();

        verify( contentService, times( 1 ) ).getRootPermissions();

        assertJson( "get_content_root_permissions_with_null_principal.json", jsonString );
    }

    @Test
    public void setChildOrder()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        when( contentService.sort( isA( SortContentParams.class ) ) ).thenReturn( SortContentResult.create().content( content ).build() );

        String jsonString = request().path( "content/setChildOrder" )
            .entity( readFromFile( "set_order_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        verify( contentService, times( 1 ) ).sort( isA( SortContentParams.class ) );

        assertJson( "set_order_success.json", jsonString );
    }

    @Test
    public void update_content_already_exists()
        throws Exception
    {
        Content content = createContent( "content-id", "new-content-name", "myapplication:content-type" );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( content );
        when( contentService.getById( any() ) ).thenReturn( content );

        when( contentService.rename( any() ) ).thenThrow(
            new ContentAlreadyExistsException( ContentPath.from( "/path" ), RepositoryId.from( "some.repo" ), Branch.from( "draft" ) ) );
        when( contentService.getByPath( any() ) ).thenThrow( ContentNotFoundException.class );

        when( contentService.getById( content.getId() ) ).thenReturn( content );
        MockRestResponse response = request().path( "content/update" )
            .entity( readFromFile( "update_content_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post();
        assertEquals( HttpStatus.CONFLICT.value(), response.getStatus() );
    }

    @Test
    public void reorderChildrenContents()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        content = Content.create( content ).childOrder( ChildOrder.defaultOrder() ).build();
        when( contentService.getById( isA( ContentId.class ) ) ).thenReturn( content );

        when( contentService.sort( isA( SortContentParams.class ) ) ).thenReturn(
            SortContentResult.create().content( content ).movedChildren( ContentIds.from( "a", "b" ) ).build() );

        String jsonString = request().path( "content/reorderChildren" )
            .entity( readFromFile( "reorder_children_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        verify( contentService, times( 1 ) ).sort( isA( SortContentParams.class ) );

        assertJson( "reorder_children_success.json", jsonString );
    }

    @Test
    public void resortReorderChildrenContents()
        throws Exception
    {
        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        content = Content.create( content ).childOrder( ChildOrder.defaultOrder() ).build();
        when( contentService.getById( isA( ContentId.class ) ) ).thenReturn( content );
        when( contentService.sort( isA( SortContentParams.class ) ) ).thenReturn( SortContentResult.create().content( content ).movedChildren( ContentIds.from( "a", "b" ) ).build() );

        String jsonString = request().path( "content/reorderChildren" )
            .entity( readFromFile( "resort_reorder_children_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        verify( contentService, times( 1 ) ).sort( isA( SortContentParams.class ) );

        assertJson( "reorder_children_success.json", jsonString );
    }

    @Test
    public void countContentsWithDescendants_check_children_filtered()
    {
        Set<String> contentPaths = new HashSet<>( asList( "/root/a", "/root/a/b", "/root/c", "root/a/b/c" ) );

        GetDescendantsOfContents json = new GetDescendantsOfContents();
        json.setContentPaths( contentPaths );

        ContentResource contentResource = getResourceInstance();
        when( this.contentService.find( isA( ContentQuery.class ) ) ).thenReturn(
            FindContentIdsByQueryResult.create().totalHits( 0L ).build() );

        assertEquals( 2L, contentResource.countContentsWithDescendants( json ) );
    }

    @Test
    public void countContentsWithDescendants_empty_json()
    {
        GetDescendantsOfContents json = new GetDescendantsOfContents();
        json.setContentPaths( new HashSet<>() );

        ContentResource contentResource = getResourceInstance();

        assertEquals( 0L, contentResource.countContentsWithDescendants( json ) );
    }

    @Test
    public void countContentsWithDescendants_no_children()
    {
        Set<String> contentPaths = new HashSet<>( asList( "/root/a", "/root/b", "/root/c" ) );

        GetDescendantsOfContents json = new GetDescendantsOfContents();
        json.setContentPaths( contentPaths );

        ContentResource contentResource = getResourceInstance();
        when( this.contentService.find( isA( ContentQuery.class ) ) ).thenReturn(
            FindContentIdsByQueryResult.create().totalHits( 0L ).build() );

        assertEquals( 3L, contentResource.countContentsWithDescendants( json ) );
    }

    @Test
    public void has_unpublished_children()
        throws Exception
    {
        final Content contentA = mock( Content.class );
        final Content contentB = mock( Content.class );

        when( contentA.getId() ).thenReturn( ContentId.from( "aaa" ) );
        when( contentB.getId() ).thenReturn( ContentId.from( "bbb" ) );

        ContentResource contentResource = getResourceInstance();

        when( contentService.hasUnpublishedChildren( any( HasUnpublishedChildrenParams.class ) ) ).thenReturn( true, false );

        final HasUnpublishedChildrenResultJson result = contentResource.hasUnpublishedChildren(
            new ContentIdsJson( Arrays.asList( contentA.getId().toString(), contentB.getId().toString() ) ) );

        assertEquals(
            result.getContents().contains( new HasUnpublishedChildrenResultJson.HasUnpublishedChildrenJson( contentA.getId(), true ) ),
            true );
        assertEquals(
            result.getContents().contains( new HasUnpublishedChildrenResultJson.HasUnpublishedChildrenJson( contentB.getId(), false ) ),
            true );
    }

    @Test
    public void find_ids_by_parents()
        throws Exception
    {
        final ContentId childId1 = ContentId.from( "childId1" );
        final ContentId childId2 = ContentId.from( "childId2" );
        final ContentIds childrenIds = ContentIds.from( childId1, childId2 );

        when( contentService.findIdsByParent( isA( FindContentByParentParams.class ) ) ).thenReturn(
            FindContentIdsByParentResult.create().contentIds( childrenIds ).build() );

        String jsonString = request().path( "content/findIdsByParents" )
            .entity( readFromFile( "find_ids_by_parents_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "find_ids_by_parents.json", jsonString );

    }

    @Test
    public void resolve_publish_contents()
        throws Exception
    {
        final ContentId requestedId = ContentId.from( "requested-contentId" );
        final ContentId dependantId = ContentId.from( "dependant-contentId" );
        final ContentId requiredId = ContentId.from( "required-contentId" );
        final ContentId nextMissingId = ContentId.from( "next-missing-contentId" );
        final ContentId nextId = ContentId.from( "next-contentId" );
        final Content nextContent = mock( Content.class );
        when( nextContent.getId() ).thenReturn( nextId );
        when( nextContent.getPermissions() ).thenReturn( AccessControlList.empty() );
        final ContentIds outboundIds = ContentIds.from( nextId, nextMissingId );

        final CompareContentResult requested = new CompareContentResult( CompareStatus.NEW, requestedId );
        final CompareContentResult dependant = new CompareContentResult( CompareStatus.NEW, dependantId );
        final CompareContentResult next = new CompareContentResult( CompareStatus.NEW, nextId );

        when( contentService.resolvePublishDependencies( isA( ResolvePublishDependenciesParams.class ) ) ).thenReturn(
            CompareContentResults.create().add( requested ).add( dependant ).build() );
        when( contentService.resolveRequiredDependencies( isA( ResolveRequiredDependenciesParams.class ) ) ).thenReturn(
            ContentIds.from( requiredId ) );
        when( contentService.compare( isA( CompareContentsParams.class ) ) ).thenReturn(
            CompareContentResults.create().add( next ).build() );
        when( contentService.getById( isA( ContentId.class ) ) ).thenReturn( nextContent );
        when( contentService.getOutboundDependencies( isA( ContentId.class ) ) ).thenReturn( outboundIds );
        when( contentService.getByIds( isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( nextContent ) );
        when( contentService.find( isA( ContentQuery.class ) ) ).thenReturn(
                FindContentIdsByQueryResult.create().contents( ContentIds.from( nextId ) ).totalHits( 1L ).build() )
            .thenReturn( FindContentIdsByQueryResult.create().contents( ContentIds.from( dependantId ) ).totalHits( 1L ).build() );

        doReturn( ContentValidityResult.create().notValidContentIds( ContentIds.from( dependantId ) ).build() ).when( this.contentService )
            .getContentValidity( isA( ContentValidityParams.class ) );

        String jsonString = request().path( "content/resolvePublishContent" )
            .entity( readFromFile( "resolve_publish_content_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "resolve_publish_content.json", jsonString );
    }

    @Test
    public void getEffectivePermissions()
        throws Exception
    {
        final User user1 = createUser( "User 1" );
        final User user2 = createUser( "User 2" );
        final User user3 = createUser( "User 3" );
        final User user4 = createUser( "User 4" );
        final PrincipalKey groupA = PrincipalKey.ofGroup( SYSTEM, "groupA" );
        final PrincipalKey groupB = PrincipalKey.ofGroup( SYSTEM, "groupB" );
        when( securityService.getUser( user1.getKey() ) ).thenReturn( Optional.of( user1 ) );
        when( securityService.getUser( user2.getKey() ) ).thenReturn( Optional.of( user2 ) );
        when( securityService.getUser( user3.getKey() ) ).thenReturn( Optional.of( user3 ) );
        when( securityService.getUser( user4.getKey() ) ).thenReturn( Optional.of( user4 ) );

        final PrincipalRelationships group1Memberships =
            PrincipalRelationships.from( PrincipalRelationship.from( groupA ).to( user1.getKey() ) );
        when( this.securityService.getRelationships( eq( groupA ) ) ).thenReturn( group1Memberships );

        final PrincipalRelationships group2Memberships =
            PrincipalRelationships.from( PrincipalRelationship.from( groupB ).to( user3.getKey() ) );
        when( this.securityService.getRelationships( eq( groupB ) ) ).thenReturn( group2Memberships );

        final Permission[] ACCESS_WRITE = {Permission.READ, Permission.CREATE, Permission.DELETE, Permission.MODIFY};
        final Permission[] ACCESS_PUBLISH = {Permission.READ, Permission.CREATE, Permission.DELETE, Permission.MODIFY, Permission.PUBLISH};
        final AccessControlList permissions =
            AccessControlList.of( AccessControlEntry.create().principal( user1.getKey() ).allowAll().build(),
                                  AccessControlEntry.create().principal( groupA ).allow( ACCESS_WRITE ).build(),
                                  AccessControlEntry.create().principal( groupB ).allow( Permission.READ ).build(),
                                  AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allow( ACCESS_PUBLISH ).build() );

        final PrincipalQueryResult totalUsers =
            PrincipalQueryResult.create().totalSize( 200 ).addPrincipals( asList( user1, user2, user3, user4 ) ).build();
        when( this.securityService.query( any( PrincipalQuery.class ) ) ).thenReturn( totalUsers );

        final Content content = createContent( "my-content", "my-content", "myapplication:content-type", permissions );
        when( contentService.getById( isA( ContentId.class ) ) ).thenReturn( content );

        String jsonString = request().path( "content/effectivePermissions" ).queryParam( "id", "my-content" ).get().getAsString();

        assertJson( "get_effective_permissions_success.json", jsonString );
    }

    @Test
    public void deleteAttachment()
        throws Exception
    {
        Content content = Content.create()
            .id( ContentId.from( "123" ) )
            .parentPath( ContentPath.ROOT )
            .name( "one" )
            .displayName( "one" )
            .type( ContentTypeName.folder() )
            .build();

        final BinaryReferences attachmentNames = BinaryReferences.from( "file1.jpg", "file2.txt" );
        when( contentService.update( argThat(
            (ArgumentMatcher<UpdateContentParams>) param -> param.getContentId().equals( content.getId() ) &&
                param.getRemoveAttachments().equals( attachmentNames ) ) ) ).thenReturn( content );

        String jsonString = request().path( "content/deleteAttachment" )
            .entity( readFromFile( "delete_attachments_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "delete_attachments_success.json", jsonString );
    }

    @Test
    public void get_permitted_actions_for_admin()
        throws Exception
    {
        final User user = User.create()
            .key( PrincipalKey.ofUser( IdProviderKey.system(), "user1" ) )
            .displayName( "User 1" )
            .email( "user1@enonic.com" )
            .login( "user1" )
            .build();

        final LocalScope localScope = ContextAccessor.current().getLocalScope();

        final AuthenticationInfo authInfo = AuthenticationInfo.create().user( user ).principals( RoleKeys.ADMIN ).build();
        localScope.setAttribute( authInfo );
        localScope.setSession( new SessionMock() );

        //checking that admin has all requested permissions
        String jsonString = request().path( "content/allowedActions" )
            .entity( readFromFile( "get_permitted_actions_params_root.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertEquals( "[\"CREATE\",\"PUBLISH\",\"DELETE\"]", jsonString );

        //checking that admin has all permissions when no permissions set in request
        jsonString = request().path( "content/allowedActions" )
            .entity( readFromFile( "get_permitted_actions_params_root_all_permissions.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "get_permitted_actions_admin_allowed_all.json", jsonString );

    }

    @Test
    public void get_permitted_actions_single_content()
        throws Exception
    {
        final User user = User.create()
            .key( PrincipalKey.ofUser( IdProviderKey.system(), "user1" ) )
            .displayName( "User 1" )
            .email( "user1@enonic.com" )
            .login( "user1" )
            .build();

        final LocalScope localScope = ContextAccessor.current().getLocalScope();

        final AuthenticationInfo authInfo =
            AuthenticationInfo.create().user( user ).principals( RoleKeys.EVERYONE, RoleKeys.AUTHENTICATED ).build();
        localScope.setAttribute( authInfo );
        localScope.setSession( new SessionMock() );

        final AccessControlList nodePermissions = AccessControlList.create()
            .add( AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allow( CREATE ).build() )
            .add( AccessControlEntry.create().principal( RoleKeys.AUTHENTICATED ).allow( DELETE ).build() )
            .build();

        Content content = Content.create().id( ContentId.from( "id" ) ).path( "/myroot/mysub" ).permissions( nodePermissions ).build();

        when( contentService.getByIds( isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( content ) );

        //["CREATE", "PUBLISH", "DELETE", "MODIFY"] permissions requested, checking  that only create and delete allowed on provided content
        String jsonString = request().path( "content/allowedActions" )
            .entity( readFromFile( "get_permitted_actions_params_single_content.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertEquals( "[\"CREATE\",\"DELETE\"]", jsonString );

        //all root permissions requested for user, root allows only 'CREATE' and 'DELETE', checking that only 'CREATE' and 'DELETE' returned
        final AccessControlList rootPermissions = AccessControlList.create()
            .add( AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allow( READ ).build() )
            .add( AccessControlEntry.create().principal( RoleKeys.AUTHENTICATED ).allow( CREATE ).build() )
            .build();

        when( contentService.getRootPermissions() ).thenReturn( rootPermissions );

        jsonString = request().path( "content/allowedActions" )
            .entity( readFromFile( "get_permitted_actions_params_root_all_permissions.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertEquals( "[\"READ\",\"CREATE\"]", jsonString );
    }

    @Test
    public void get_permitted_actions_multiple_contents()
        throws Exception
    {
        final User user = User.create()
            .key( PrincipalKey.ofUser( IdProviderKey.system(), "user1" ) )
            .displayName( "User 1" )
            .email( "user1@enonic.com" )
            .login( "user1" )
            .build();

        final LocalScope localScope = ContextAccessor.current().getLocalScope();

        final AuthenticationInfo authInfo =
            AuthenticationInfo.create().user( user ).principals( RoleKeys.EVERYONE, RoleKeys.AUTHENTICATED ).build();
        localScope.setAttribute( authInfo );
        localScope.setSession( new SessionMock() );

        final AccessControlList nodePermissions1 = AccessControlList.create()
            .add( AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allow( READ ).build() )
            .add( AccessControlEntry.create().principal( RoleKeys.AUTHENTICATED ).allow( READ ).build() )
            .build();

        final AccessControlList nodePermissions2 = AccessControlList.create()
            .add( AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allow( READ, CREATE ).build() )
            .add( AccessControlEntry.create().principal( RoleKeys.AUTHENTICATED ).allow( READ, CREATE, MODIFY, DELETE ).build() )
            .build();

        Content content1 = Content.create().id( ContentId.from( "id0" ) ).path( "/myroot/mysub" ).permissions( nodePermissions1 ).build();
        Content content2 = Content.create().id( ContentId.from( "id1" ) ).path( "/myroot/mysub2" ).permissions( nodePermissions2 ).build();

        when( contentService.getByIds( isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( content1, content2 ) );

        //requesting ["CREATE", "PUBLISH", "DELETE", "MODIFY"] on 2 contents, checking that nothing allowed because all contents must have required permissions
        String jsonString = request().path( "content/allowedActions" )
            .entity( readFromFile( "get_permitted_actions_params_multiple_contents.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertEquals( "[]", jsonString );
    }

    @Test
    public void treeSelectorQuery_empty()
    {
        ContentResource contentResource = getResourceInstance();

        when( this.contentService.findPaths( isA( ContentQuery.class ) ) ).thenReturn( FindContentPathsByQueryResult.create().build() );

        ContentTreeSelectorQueryJson json = initContentTreeSelectorQueryJson( null );
        ContentTreeSelectorListJson result = contentResource.treeSelectorQuery( json, request );

        assertEquals( ContentTreeSelectorListJson.empty(), result );
    }

    @Test
    public void treeSelectorQuery()
    {
        ContentResource contentResource = getResourceInstance();

        Content content1 = createContent( "content-id1", "content-name1", "myapplication:content-type" );
        Content content2 =
            createContent( "content-id2", content1.getPath(), "content-name2", "myapplication:content-type", AccessControlList.empty() );
        Content content3 =
            createContent( "content-id3", content2.getPath(), "content-name3", "myapplication:content-type", AccessControlList.empty() );
        Content content4 =
            createContent( "content-id4", content3.getPath(), "content-name4", "myapplication:content-type", AccessControlList.empty() );

        when( this.contentService.getByIds( new GetContentByIdsParams( ContentIds.from( content1.getId() ) ) ) ).thenReturn(
            Contents.from( content1 ) );
        when( this.contentService.getByIds( new GetContentByIdsParams( ContentIds.from( content2.getId() ) ) ) ).thenReturn(
            Contents.from( content2 ) );
        when( this.contentService.getByIds( new GetContentByIdsParams( ContentIds.from( content3.getId() ) ) ) ).thenReturn(
            Contents.from( content3 ) );
        when( this.contentService.getByIds( new GetContentByIdsParams( ContentIds.from( content4.getId() ) ) ) ).thenReturn(
            Contents.from( content4 ) );

        when( this.contentService.findPaths( isA( ContentQuery.class ) ) ).thenReturn( FindContentPathsByQueryResult.create()
                                                                                           .contentPaths(
                                                                                               ContentPaths.from( content4.getPath() ) )
                                                                                           .hits( 1 )
                                                                                           .totalHits( 1 )
                                                                                           .build() );

        doReturn( FindContentByParentResult.create().totalHits( 1L ).contents( Contents.from( content1 ) ).build() ).when(
            this.contentService ).findByParent( isA( FindContentByParentParams.class ) );

        ContentTreeSelectorQueryJson json = initContentTreeSelectorQueryJson( null );
        ContentTreeSelectorListJson result = contentResource.treeSelectorQuery( json, request );
        assertEquals( result.getItems().get( 0 ).getContent().getId(), content1.getId().toString() );

        doReturn( FindContentByParentResult.create().totalHits( 1L ).contents( Contents.from( content2 ) ).build() ).when(
            this.contentService ).findByParent( isA( FindContentByParentParams.class ) );

        json = initContentTreeSelectorQueryJson( content1.getPath() );
        result = contentResource.treeSelectorQuery( json, request );
        assertEquals( result.getItems().get( 0 ).getContent().getId(), content2.getId().toString() );

        doReturn( FindContentByParentResult.create().totalHits( 1L ).contents( Contents.from( content3 ) ).build() ).when(
            this.contentService ).findByParent( isA( FindContentByParentParams.class ) );

        json = initContentTreeSelectorQueryJson( content2.getPath() );
        result = contentResource.treeSelectorQuery( json, request );
        assertEquals( result.getItems().get( 0 ).getContent().getId(), content3.getId().toString() );
    }

    @Test
    public void createMedia()
        throws Exception
    {
        ContentResource contentResource = getResourceInstance();

        ByteSource byteSource = ByteSource.wrap( "bytes".getBytes() );

        MultipartItem multipartItem = mock( MultipartItem.class );
        when( multipartItem.getContentType() ).thenReturn( com.google.common.net.MediaType.JPEG );
        when( multipartItem.getBytes() ).thenReturn( byteSource );

        MultipartForm multipartForm = mock( MultipartForm.class );
        when( multipartForm.getAsString( "content" ) ).thenReturn( "content-id" );
        when( multipartForm.getAsString( "name" ) ).thenReturn( "name" );
        when( multipartForm.getAsString( "parent" ) ).thenReturn( "/parentPath" );
        when( multipartForm.getAsString( "focalX" ) ).thenReturn( "2" );
        when( multipartForm.getAsString( "focalY" ) ).thenReturn( "1" );
        when( multipartForm.get( "file" ) ).thenReturn( multipartItem );

        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );

        CreateMediaParams paramsss = new CreateMediaParams().name( "name" )
            .mimeType( "image/jpeg" )
            .byteSource( byteSource )
            .focalX( 2.0 )
            .focalY( 1.0 )
            .parent( ContentPath.from( "/parentPath" ) );

        when( this.contentService.create( paramsss ) ).thenReturn( content );

        contentResource.createMedia( multipartForm, request );

        verify( this.contentService, times( 1 ) ).create( paramsss );

    }

    @Test
    public void updateMedia()
    {
        ContentResource contentResource = getResourceInstance();

        ByteSource byteSource = ByteSource.wrap( "bytes".getBytes() );

        MultipartItem multipartItem = mock( MultipartItem.class );
        when( multipartItem.getContentType() ).thenReturn( com.google.common.net.MediaType.JPEG );
        when( multipartItem.getBytes() ).thenReturn( byteSource );

        MultipartForm multipartForm = mock( MultipartForm.class );
        when( multipartForm.getAsString( "content" ) ).thenReturn( "content-id" );
        when( multipartForm.getAsString( "name" ) ).thenReturn( "name" );
        when( multipartForm.getAsString( "focalX" ) ).thenReturn( "2" );
        when( multipartForm.getAsString( "focalY" ) ).thenReturn( "1" );
        when( multipartForm.get( "file" ) ).thenReturn( multipartItem );

        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );

        UpdateMediaParams params = new UpdateMediaParams().content( ContentId.from( "content-id" ) )
            .name( "name" )
            .mimeType( "image/jpeg" )
            .byteSource( byteSource )
            .focalX( 2.0 )
            .focalY( 1.0 );

        when( this.contentService.update( any( UpdateMediaParams.class ) ) ).thenReturn( content );

        contentResource.updateMedia( multipartForm, request );

        verify( this.contentService, times( 1 ) ).update(
            argThat( (ArgumentMatcher<UpdateMediaParams>) argument -> params.getContent().equals( argument.getContent() ) ) );
    }

    @Test
    public void updateMedia_exceed_max_upload_size()
        throws Exception
    {
        ContentResource contentResource = getResourceInstance();
        when( config.uploadMaxFileSize() ).thenReturn( "1b" );
        contentResource.activate( config );

        ByteSource byteSource = ByteSource.wrap( "bytes".getBytes() );

        MultipartItem multipartItem = mock( MultipartItem.class );
        when( multipartItem.getContentType() ).thenReturn( com.google.common.net.MediaType.JPEG );
        when( multipartItem.getBytes() ).thenReturn( byteSource );
        when( multipartItem.getSize() ).thenReturn( byteSource.size() );

        MultipartForm multipartForm = mock( MultipartForm.class );
        when( multipartForm.getAsString( "content" ) ).thenReturn( "content-id" );
        when( multipartForm.getAsString( "name" ) ).thenReturn( "name" );
        when( multipartForm.getAsString( "focalX" ) ).thenReturn( "2" );
        when( multipartForm.getAsString( "focalY" ) ).thenReturn( "1" );
        when( multipartForm.get( "file" ) ).thenReturn( multipartItem );

        assertThrows( IllegalStateException.class, () -> contentResource.updateMedia( multipartForm, request ) );
    }

    @Test
    public void getDependencies()
    {
        ContentResource contentResource = getResourceInstance();

        Content content1 = createContent( "content-id1", "content-name1", "myapplication:content-type" );
        Content content2 = createContent( "content-id2", "content-name2", "myapplication:content-type" );

        when( contentService.getDependencies( content1.getId() ) ).thenReturn( ContentDependencies.create()
                                                                                   .inboundDependencies( Collections.singleton(
                                                                                       new ContentDependenciesAggregation(
                                                                                           ContentTypeName.folder(), 2L ) ) )
                                                                                   .outboundDependencies( Collections.singleton(
                                                                                       new ContentDependenciesAggregation(
                                                                                           ContentTypeName.media(), 1L ) ) )
                                                                                   .build() );

        when( contentService.getDependencies( content2.getId() ) ).thenReturn(
            ContentDependencies.create().inboundDependencies( new HashSet<>() ).outboundDependencies( new HashSet<>() ).build() );

        GetDependenciesResultJson result = contentResource.getDependencies(
            new GetDependenciesJson( List.of( content1.getId().toString(), content2.getId().toString() ),
                                     ContentConstants.BRANCH_DRAFT.getValue() ), request );

        assertEquals( 1, result.getDependencies().get( content1.getId().toString() ).getInbound().size() );
        assertEquals( 2L, result.getDependencies().get( content1.getId().toString() ).getInbound().get( 0 ).getCount() );
        assertEquals( ContentTypeName.folder().toString(),
                      result.getDependencies().get( content1.getId().toString() ).getInbound().get( 0 ).getType() );

        assertEquals( 1, result.getDependencies().get( content1.getId().toString() ).getOutbound().size() );
        assertEquals( 1L, result.getDependencies().get( content1.getId().toString() ).getOutbound().get( 0 ).getCount() );
        assertEquals( ContentTypeName.media().toString(),
                      result.getDependencies().get( content1.getId().toString() ).getOutbound().get( 0 ).getType() );
    }

    @Test
    public void duplicate()
    {
        ContentResource contentResource = getResourceInstance();
        when( taskService.submitLocalTask( any( SubmitLocalTaskParams.class ) ) ).thenReturn( TaskId.from( "task-id" ) );

        TaskResultJson result = contentResource.duplicate( new DuplicateContentsJson( new ArrayList<>() ) );

        assertEquals( "task-id", result.getTaskId() );
    }

    @Test
    public void move()
    {
        ContentResource contentResource = getResourceInstance();
        when( taskService.submitLocalTask( any( SubmitLocalTaskParams.class ) ) ).thenReturn( TaskId.from( "task-id" ) );

        TaskResultJson result = contentResource.move( new MoveContentJson() );

        assertEquals( "task-id", result.getTaskId() );
    }

    @Test
    public void delete()
    {
        ContentResource contentResource = getResourceInstance();
        when( taskService.submitLocalTask( any( SubmitLocalTaskParams.class ) ) ).thenReturn( TaskId.from( "task-id" ) );

        TaskResultJson result = contentResource.delete( new DeleteContentJson() );

        assertEquals( "task-id", result.getTaskId() );
    }


    @Test
    public void publish()
    {
        ContentResource contentResource = getResourceInstance();
        when( taskService.submitLocalTask( any( SubmitLocalTaskParams.class ) ) ).thenReturn( TaskId.from( "task-id" ) );

        TaskResultJson result = contentResource.publish( new PublishContentJson() );

        assertEquals( "task-id", result.getTaskId() );
    }

    @Test
    public void unpublish()
    {
        ContentResource contentResource = getResourceInstance();
        when( taskService.submitLocalTask( any( SubmitLocalTaskParams.class ) ) ).thenReturn( TaskId.from( "task-id" ) );

        TaskResultJson result = contentResource.unpublish( new UnpublishContentJson() );

        assertEquals( "task-id", result.getTaskId() );
    }

    @Test
    public void getByIds()
    {
        ContentResource contentResource = getResourceInstance();

        Content content1 = createContent( "content-id1", "content-name1", "myapplication:content-type" );

        Content content2 = createContent( "content-id2", "content-name2", "myapplication:content-type" );

        when( contentService.getByIds( any(GetContentByIdsParams.class) ) ).thenReturn(
            Contents.from( content1, content2 ) );

        ContentListJson result =
            contentResource.getByIds( new ContentIdsJson( List.of( content1.getId().toString(), content2.getId().toString() ) ), request );

        assertEquals( 2L, result.getMetadata().getHits() );
        assertEquals( 2L, result.getMetadata().getTotalHits() );

        assertEquals( 2, result.getContents().size() );
        assertEquals( new ContentSummaryJson( content1, new ContentIconUrlResolver( contentTypeService, request ),
                                              new ContentListTitleResolver( contentTypeService ) ), result.getContents().get( 0 ) );
        assertEquals( new ContentSummaryJson( content2, new ContentIconUrlResolver( contentTypeService, request ),
                                              new ContentListTitleResolver( contentTypeService ) ), result.getContents().get( 1 ) );
    }

    @Test
    public void checkContentsReadOnly()
    {
        ContentResource contentResource = getResourceInstance();

        Content content1 = Content.create( createContent( "content-id1", "content-name1", "myapplication:content-type" ) )
            .permissions(
                AccessControlList.create().add( AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allowAll().build() ).build() )
            .build();

        Content content2 = createContent( "content-id2", "content-name2", "myapplication:content-type" );

        when( contentService.getByIds( any(GetContentByIdsParams.class) ) ).thenReturn( Contents.from( content1, content2 ) );

        List<String> result = contentResource.checkContentsReadOnly(
            new ContentIdsJson( List.of( content1.getId().toString(), content2.getId().toString() ) ) );

        assertEquals( 1, result.size() );
        assertEquals( content2.getId().toString(), result.get( 0 ) );
    }

    @Test
    public void contentsExists()
    {
        ContentResource contentResource = getResourceInstance();

        Content content1 = createContent( "content-id1", "content-name1", "myapplication:content-type" );
        Content content2 = createContent( "content-id2", "content-name2", "myapplication:content-type" );

        when( contentService.contentExists( content2.getId() ) ).thenReturn( true );

        ContentsExistJson result =
            contentResource.contentsExist( new ContentIdsJson( List.of( content1.getId().toString(), content2.getId().toString() ) ) );

        assertFalse( result.getContentsExistJson().get( 0 ).exists() );
        assertTrue( result.getContentsExistJson().get( 1 ).exists() );
    }

    @Test
    public void contentsExistByPath()
    {
        ContentResource contentResource = getResourceInstance();

        Content content1 = createContent( "content-id1", "content-name1", "myapplication:content-type" );
        Content content2 = createContent( "content-id2", "content-name2", "myapplication:content-type" );

        when( contentService.contentExists( content2.getPath() ) ).thenReturn( true );

        ContentsExistByPathJson result = contentResource.contentsExistByPath(
            new ContentPathsJson( List.of( content1.getPath().toString(), content2.getPath().toString() ) ) );

        assertFalse( result.getContentsExistJson().get( 0 ).exists() );
        assertTrue( result.getContentsExistJson().get( 1 ).exists() );
    }

    @Test
    public void getNearest_null()
    {
        ContentResource contentResource = getResourceInstance();

        ContentJson result = contentResource.getNearest( new GetNearestSiteJson( "non-existed-content-id" ), request );

        assertEquals( null, result );
    }

    @Test
    public void getNearest()
    {
        ContentResource contentResource = getResourceInstance();

        PropertyTree siteConfigConfig = new PropertyTree();
        siteConfigConfig.setLong( "A", 1L );
        SiteConfig siteConfig =
            SiteConfig.create().application( ApplicationKey.from( "myapplication" ) ).config( siteConfigConfig ).build();

        Site site = createSite( "aaa", "my_a_content", SiteConfigs.from( siteConfig ) );

        when( contentService.getNearestSite( site.getId() ) ).thenReturn( site );

        ContentJson result = contentResource.getNearest( new GetNearestSiteJson( site.getId().toString() ), request );

        final ComponentDisplayNameResolverImpl componentNameResolver = new ComponentDisplayNameResolverImpl();
        componentNameResolver.setContentService( contentService );
        componentNameResolver.setLayoutDescriptorService( layoutDescriptorService );
        componentNameResolver.setPartDescriptorService( partDescriptorService );

        assertEquals( new ContentJson( site, new ContentIconUrlResolver( contentTypeService, request ),
                                       new ContentPrincipalsResolver( securityService ), componentNameResolver,
                                       new ContentListTitleResolver( contentTypeService ), Collections.emptyList() ), result );
    }

    @Test
    public void getDescendantsOfContents()
    {
        ContentResource contentResource = getResourceInstance();

        Content content1 = createContent( "content-id1", "content-name1", "myapplication:content-type" );
        Content content2 = createContent( "content-id2", "content-name2", "myapplication:content-type" );

        GetDescendantsOfContents params = new GetDescendantsOfContents();
        // TODO Unfortunately test relies on order paths in Set. Replace with Set.of then assertion is fixed.
        params.setContentPaths( ImmutableSet.of( content1.getPath().toString(), content2.getPath().toString() ) );

        final ArgumentCaptor<ContentQuery> argumentCaptor = ArgumentCaptor.forClass( ContentQuery.class );

        FindContentIdsByQueryResult findResult = FindContentIdsByQueryResult.create()
            .aggregations( Aggregations.empty() )
            .hits( 1L )
            .totalHits( 10L )
            .contents( ContentIds.from( content1.getId(), content2.getId() ) )
            .build();

        when( contentService.find( isA( ContentQuery.class ) ) ).thenReturn( findResult );

        List<ContentIdJson> result = contentResource.getDescendantsOfContents( params );

        verify( this.contentService, times( 1 ) ).find( argumentCaptor.capture() );

        assertEquals(
            "((_path LIKE '/content/content-name1/*' OR _path LIKE '/content/content-name2/*') AND _path NOT IN ('/content/content-name1', '/content/content-name2')) ORDER BY _path ASC",
            argumentCaptor.getValue().getQueryExpr().toString() );

        assertTrue( result.contains( new ContentIdJson( content1.getId() ) ) );
        assertTrue( result.contains( new ContentIdJson( content2.getId() ) ) );
    }

    @Test
    public void getDescendantsOfContents_filtered()
    {
        ContentResource contentResource = getResourceInstance();

        Content content1 = createContent( "content-id1", "content-name1", "myapplication:content-type" );
        Content content2 = createContent( "content-id2", "content-name2", "myapplication:content-type" );

        GetDescendantsOfContents params = new GetDescendantsOfContents();
        // TODO Unfortunately test relies on order paths in Set.  Replace with Set.of then assertion is fixed.
        params.setContentPaths( ImmutableSet.of( content1.getPath().toString(), content2.getPath().toString() ) );
        params.setFilterStatuses( Collections.singleton( CompareStatus.NEW ) );

        final ArgumentCaptor<ContentQuery> argumentCaptor = ArgumentCaptor.forClass( ContentQuery.class );

        FindContentIdsByQueryResult findResult = FindContentIdsByQueryResult.create()
            .aggregations( Aggregations.empty() )
            .hits( 1L )
            .totalHits( 10L )
            .contents( ContentIds.from( content1.getId(), content2.getId() ) )
            .build();

        when( contentService.find( isA( ContentQuery.class ) ) ).thenReturn( findResult );

        when( contentService.compare( any( CompareContentsParams.class ) ) ).thenReturn(
            CompareContentResults.create().add( new CompareContentResult( CompareStatus.NEW, content1.getId() ) ).build() );

        List<ContentIdJson> result = contentResource.getDescendantsOfContents( params );

        verify( this.contentService, times( 1 ) ).find( argumentCaptor.capture() );

        assertEquals(
            "((_path LIKE '/content/content-name1/*' OR _path LIKE '/content/content-name2/*') AND _path NOT IN ('/content/content-name1', '/content/content-name2')) ORDER BY _path ASC",
            argumentCaptor.getValue().getQueryExpr().toString() );

        assertTrue( result.contains( new ContentIdJson( content1.getId() ) ) );
        assertEquals( 1, result.size() );
    }

    @Test
    public void resolveForUnpublish()
    {
        final ContentResource contentResource = getResourceInstance();

        final Content content1 = createContent( "content-id1", "content-name1", "myapplication:content-type" );
        final Content content2 = createContent( "content-id2", "content-name2", "myapplication:content-type" );

        final ArgumentCaptor<ContentQuery> argumentCaptor = ArgumentCaptor.forClass( ContentQuery.class );

        final FindContentIdsByQueryResult findResult = FindContentIdsByQueryResult.create()
            .aggregations( Aggregations.empty() )
            .hits( 1L )
            .totalHits( 10L )
            .contents( ContentIds.from( content1.getId(), content2.getId() ) )
            .build();

        when( contentService.getByIds( any(GetContentByIdsParams.class) ) ).thenReturn(
            Contents.from( content1, content2 ) );
        when( contentService.find( isA( ContentQuery.class ) ) ).thenReturn( findResult );
        when( contentService.getOutboundDependencies( ContentId.from( "content-id1" ) ) ).thenReturn(
            ContentIds.from( "content-id1", "content-id2" ) );
        when( contentService.getOutboundDependencies( ContentId.from( "content-id2" ) ) ).thenReturn( ContentIds.from( "content-id1" ) );

        ContentWithRefsResultJson result =
            contentResource.resolveForUnpublish( new ContentIdsJson( List.of( "content-id1", "content-id2" ) ) );

        verify( this.contentService, times( 2 ) ).find( argumentCaptor.capture() );

        assertTrue( result.getContentIds().contains( new ContentIdJson( content1.getId() ) ) );
        assertTrue( result.getContentIds().contains( new ContentIdJson( content2.getId() ) ) );
    }

    @Test
    public void resolveForDelete()
    {
        final ContentResource contentResource = getResourceInstance();

        final Content content1 = createContent( "content-id1", "content-name1", "myapplication:content-type" );
        final Content content2 =
            createContent( "content-id2", content1.getPath(), "content-name2", "myapplication:content-type", AccessControlList.empty() );

        when( contentService.getByIds(any(GetContentByIdsParams.class) ) ).thenReturn(
            Contents.from( content1, content2 ) );

        final FindContentIdsByQueryResult idsToRemove = FindContentIdsByQueryResult.create()
            .aggregations( Aggregations.empty() )
            .hits( 2L )
            .totalHits( 2L )
            .contents( ContentIds.from( content1.getId(), content2.getId() ) )
            .build();

        final FindContentIdsByQueryResult inbound = FindContentIdsByQueryResult.create()
            .aggregations( Aggregations.empty() )
            .hits( 2L )
            .totalHits( 2L )
            .contents( ContentIds.from( "content-id3", "content-id4" ) )
            .build();

        when( contentService.find( isA( ContentQuery.class ) ) ).thenReturn( idsToRemove ).thenReturn( inbound );
        when( contentService.getOutboundDependencies( ContentId.from( "content-id3" ) ) ).thenReturn(
            ContentIds.from( "content-id1", "content-id2" ) );
        when( contentService.getOutboundDependencies( ContentId.from( "content-id4" ) ) ).thenReturn( ContentIds.from( "content-id1" ) );

        final ContentWithRefsResultJson result =
            contentResource.resolveForDelete( new ContentIdsJson( List.of( "content-id1", "content-id2" ) ) );

        assertEquals( 2, result.getContentIds().size() );
        assertEquals( 2, result.getInboundDependencies().size() );
        assertEquals( "content-id1", result.getInboundDependencies().get( 0 ).getId().getId() );
        assertEquals( 2, result.getInboundDependencies().get( 0 ).getInboundDependencies().size() );
        assertEquals( "content-id2", result.getInboundDependencies().get( 1 ).getId().getId() );
        assertEquals( 1, result.getInboundDependencies().get( 1 ).getInboundDependencies().size() );
    }

    @Test
    public void query_highlight()
        throws Exception
    {
        //  when( contentService.create( isA( CreateContentParams.class ) ) );

        request().path( "content/query" )
            .entity( readFromFile( "create_media_from_url.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

    }

    @Test
    public void query()
    {
        ContentResource contentResource = getResourceInstance();

        Content content = createContent( "content-id1", "content-name1", "myapplication:content-type" );

        Aggregations aggregations = Aggregations.from( Aggregation.bucketAggregation( "aggregation" )
                                                           .buckets( Buckets.create()
                                                                         .add( Bucket.create().key( "bucketKey" ).docCount( 1 ).build() )
                                                                         .build() )
                                                           .build() );

        FindContentIdsByQueryResult findResult = FindContentIdsByQueryResult.create()
            .aggregations( aggregations )
            .hits( 1L )
            .totalHits( 10L )
            .contents( ContentIds.from( content.getId() ) )
            .build();

        when( contentService.find( isA( ContentQuery.class ) ) ).thenReturn( findResult );

        when( contentService.getByIds( any(GetContentByIdsParams.class) ) ).thenReturn( Contents.from( content ) );

        AbstractContentQueryResultJson result = contentResource.query(
            new ContentQueryJson( "", 0, 10, new ArrayList<>(), null, null, null, null, null, null,
                                  ContentConstants.BRANCH_DRAFT.getValue() ), request );

        assertEquals( 1, result.getContents().size() );
        assertTrue( result.getContents().contains( new ContentIdJson( content.getId() ) ) );

        assertEquals( 10L, result.getMetadata().getTotalHits() );
        assertEquals( 1L, result.getMetadata().getHits() );
        assertEquals( new BucketAggregationJson( (BucketAggregation) aggregations.get( "aggregation" ) ),
                      result.getAggregations().toArray()[0] );
    }


    @Test
    public void selectorQuery()
    {
        ContentResource contentResource = getResourceInstance();

        Content content = createContent( "content-id1", "content-name1", "myapplication:content-type" );

        Aggregations aggregations = Aggregations.from( Aggregation.bucketAggregation( "aggregation" )
                                                           .buckets( Buckets.create()
                                                                         .add( Bucket.create().key( "bucketKey" ).docCount( 1 ).build() )
                                                                         .build() )
                                                           .build() );

        FindContentIdsByQueryResult findResult = FindContentIdsByQueryResult.create()
            .aggregations( aggregations )
            .hits( 1L )
            .totalHits( 10L )
            .contents( ContentIds.from( content.getId() ) )
            .build();

        when( contentService.find( isA( ContentQuery.class ) ) ).thenReturn( findResult );

        when( contentService.getByIds( any(GetContentByIdsParams.class) ) ).thenReturn( Contents.from( content ) );

        AbstractContentQueryResultJson result = contentResource.selectorQuery(
            new ContentTreeSelectorQueryJson( "", 0, 10, null, null, null, new ArrayList<>(), new ArrayList<>(), null,  null, null ),
            request );

        assertEquals( 1, result.getContents().size() );
        assertTrue( result.getContents().contains( new ContentIdJson( content.getId() ) ) );

        assertEquals( 10L, result.getMetadata().getTotalHits() );
        assertEquals( 1L, result.getMetadata().getHits() );
        assertEquals( new BucketAggregationJson( (BucketAggregation) aggregations.get( "aggregation" ) ),
                      result.getAggregations().toArray()[0] );
    }

    @Test
    public void compare()
    {
        ContentResource contentResource = getResourceInstance();

        Content content = createContent( "content-id1", "content-name1", "myapplication:content-type" );

        CompareContentsJson params = new CompareContentsJson();
        params.ids = Collections.singleton( content.getId().toString() );

        CompareContentResult compareContentResult = new CompareContentResult( CompareStatus.NEW, content.getId() );

        when( contentService.compare( any( CompareContentsParams.class ) ) ).thenReturn(
            CompareContentResults.create().add( new CompareContentResult( CompareStatus.NEW, content.getId() ) ).build() );

        GetPublishStatusResult getPublishStatusResult = new GetPublishStatusResult( content.getId(), PublishStatus.ONLINE );

        when( contentService.getPublishStatuses( any( GetPublishStatusesParams.class ) ) ).thenReturn(
            GetPublishStatusesResult.create().add( getPublishStatusResult ).build() );

        CompareContentResultsJson result = contentResource.compare( params );

        assertTrue(
            result.getCompareContentResults().contains( new CompareContentResultJson( compareContentResult, getPublishStatusResult ) ) );

    }

    @Test
    public void updateThumbnail()
        throws IOException
    {
        ContentResource contentResource = getResourceInstance();

        ByteSource byteSource = ByteSource.wrap( "bytes".getBytes() );

        MultipartItem multipartItem = mock( MultipartItem.class );
        when( multipartItem.getContentType() ).thenReturn( com.google.common.net.MediaType.JPEG );
        when( multipartItem.getBytes() ).thenReturn( byteSource );

        MultipartForm multipartForm = mock( MultipartForm.class );
        when( multipartForm.getAsString( "name" ) ).thenReturn( "_thumbnail" );
        when( multipartForm.getAsString( "id" ) ).thenReturn( "id" );
        when( multipartForm.get( "file" ) ).thenReturn( multipartItem );

        Map<String, List<String>> data = new HashMap<>();
        data.put( HttpHeaders.CONTENT_TYPE, List.of( com.google.common.net.MediaType.JPEG.toString() ) );

        ExtractedData extractedData = ExtractedData.create().metadata( data ).text( "myTextValue" ).imageOrientation( "1" ).build();

        when( this.binaryExtractor.extract( any() ) ).thenReturn( extractedData );

        ArgumentCaptor<UpdateContentParams> argumentCaptor = ArgumentCaptor.forClass( UpdateContentParams.class );

        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );

        when( this.contentService.update( any( UpdateContentParams.class ) ) ).thenReturn( content );

        contentResource.updateThumbnail( multipartForm, request );

        verify( this.contentService, times( 1 ) ).update( argumentCaptor.capture() );

        assertTrue( argumentCaptor.getValue().getContentId().toString().equals( "id" ) );
        final CreateAttachment createAttachment = argumentCaptor.getValue().getCreateAttachments().stream().findFirst().get();
        assertEquals( "_thumbnail", createAttachment.getName() );
        assertEquals( com.google.common.net.MediaType.JPEG.toString(), createAttachment.getMimeType() );
        assertTrue( createAttachment.getByteSource().contentEquals( byteSource ) );
    }


    @Test
    public void createAttachment()
        throws IOException
    {
        ContentResource contentResource = getResourceInstance();

        ByteSource byteSource = ByteSource.wrap( "bytes".getBytes() );

        MultipartItem multipartItem = mock( MultipartItem.class );
        when( multipartItem.getContentType() ).thenReturn( com.google.common.net.MediaType.JPEG );
        when( multipartItem.getBytes() ).thenReturn( byteSource );

        MultipartForm multipartForm = mock( MultipartForm.class );
        when( multipartForm.getAsString( "name" ) ).thenReturn( "name" );
        when( multipartForm.getAsString( "id" ) ).thenReturn( "id" );
        when( multipartForm.get( "file" ) ).thenReturn( multipartItem );

        Map<String, List<String>> data = new HashMap<>();
        data.put( HttpHeaders.CONTENT_TYPE, List.of( com.google.common.net.MediaType.JPEG.toString() ) );

        ExtractedData extractedData = ExtractedData.create().metadata( data ).text( "myTextValue" ).imageOrientation( "1" ).build();

        when( this.binaryExtractor.extract( any() ) ).thenReturn( extractedData );

        Content content = mock( Content.class );
        ArgumentCaptor<UpdateContentParams> argumentCaptor = ArgumentCaptor.forClass( UpdateContentParams.class );
        Attachment attachment = Attachment.create().name( "name" ).mimeType( "image/jpeg" ).size( 666 ).build();

        when( content.getAttachments() ).thenReturn( Attachments.create().add( attachment ).build() );

        when( this.contentService.update( any( UpdateContentParams.class ) ) ).thenReturn( content );

        contentResource.createAttachment( multipartForm );

        verify( this.contentService, times( 1 ) ).update( argumentCaptor.capture() );
        assertTrue( argumentCaptor.getValue().getContentId().toString().equals( "id" ) );
        final CreateAttachment createAttachment = argumentCaptor.getValue().getCreateAttachments().stream().findFirst().get();
        assertEquals( "name", createAttachment.getName() );
        assertEquals( "image/jpeg", createAttachment.getMimeType() );
        assertTrue( createAttachment.getByteSource().contentEquals( byteSource ) );
    }

    @Test
    public void getActiveVersions()
    {
        ContentResource contentResource = getResourceInstance();

        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );

        ContentVersion contentVersion = ContentVersion.create()
            .id( ContentVersionId.from( "a" ) )
            .modified( Instant.now() )
            .modifier( PrincipalKey.ofAnonymous() )
            .publishInfo( ContentVersionPublishInfo.create()
                              .message( "My version" )
                              .publisher( PrincipalKey.ofAnonymous() )
                              .timestamp( Instant.ofEpochSecond( 1562056003L ) )
                              .build() )
            .build();

        when( securityService.getPrincipal( PrincipalKey.ofAnonymous() ) ).thenReturn( (Optional) Optional.of( User.ANONYMOUS ) );

        when( securityService.getUser( PrincipalKey.ofAnonymous() ) ).thenReturn( Optional.of( User.ANONYMOUS ) );

        mockVersions();

        GetActiveContentVersionsResultJson result = contentResource.getActiveVersions( content.getId().toString() );

        final ActiveContentVersionEntryJson[] resultArray = result.getActiveContentVersions().toArray(ActiveContentVersionEntryJson[]::new);
        assertTrue( resultArray.length == 1 );
        assertEquals( "nodeVersionNew", resultArray[0].getContentVersion().getId() );
    }

    @Test
    public void getContentVersionsForView()
    {
        ContentResource contentResource = getResourceInstance();

        Content content = createContent( "content-id", "content-name", "myapplication:content-type" );
        ContentVersion contentVersion = ContentVersion.create()
            .id( ContentVersionId.from( "a" ) )
            .modified( Instant.now() )
            .modifier( PrincipalKey.ofAnonymous() )
            .publishInfo( ContentVersionPublishInfo.create()
                              .message( "My version" )
                              .publisher( PrincipalKey.ofAnonymous() )
                              .timestamp( Instant.ofEpochSecond( 1562056003L ) )
                              .build() )
            .build();

        when( securityService.getPrincipal( PrincipalKey.ofAnonymous() ) ).thenReturn( (Optional) Optional.of( User.ANONYMOUS ) );

        when( securityService.getUser( PrincipalKey.ofAnonymous() ) ).thenReturn( Optional.of( User.ANONYMOUS ) );

        mockVersions();

        GetContentVersionsResultJson result =
            contentResource.getContentVersions( new GetContentVersionsJson( 0, 10, content.getId().toString() ) );

        final ContentVersionJson[] resultArray = result.getContentVersions().toArray(ContentVersionJson[]::new);
        assertTrue( resultArray.length == 2 );
        assertEquals( "DEF", resultArray[1].getDisplayName() );
    }

    private void mockVersions()
    {
        final NodeVersionKey nodeVersionKey1 = NodeVersionKey.from( "a", "b",  "c" );
        final NodeVersionMetadata newNodeVersionMeta = NodeVersionMetadata.create().
            nodeId( NodeId.from( "nodeId1" ) ).
            nodeVersionId( NodeVersionId.from( "nodeVersionNew" ) ).
            nodeVersionKey( nodeVersionKey1 ).
            nodePath( new NodePath( "/content/new" ) ).
            binaryBlobKeys( BlobKeys.empty() ).
            timestamp( Instant.ofEpochSecond( 1000 ) ).
            build();

        final NodeVersionKey nodeVersionKey2 = NodeVersionKey.from( "d", "e",  "f" );
        final NodeVersionMetadata oldNodeVersionMeta = NodeVersionMetadata.create().
            nodeId( NodeId.from( "nodeId1" ) ).
            nodeVersionId( NodeVersionId.from( "nodeVersionOld" ) ).
            nodeVersionKey( nodeVersionKey2 ).
            nodePath( new NodePath( "/content/old" ) ).
            binaryBlobKeys( BlobKeys.empty() ).
            timestamp( Instant.ofEpochSecond( 500 ) ).
            build();

        final NodeVersionsMetadata nodeVersionsMetadata = NodeVersionsMetadata.create( NodeId.from( "nodeId1" ) ).
            add( newNodeVersionMeta ).
            add( oldNodeVersionMeta ).
            build();

        final NodeVersionQueryResult nodeVersionQueryResult = NodeVersionQueryResult.create().
            entityVersions( nodeVersionsMetadata ).
            from( 0 ).
            to( 2 ).
            hits( 2 ).
            totalHits( 40 ).
            build();

        final PropertyTree data1 = new PropertyTree();
        data1.setString( ContentPropertyNames.DISPLAY_NAME, "ABC" );
        data1.setInstant( ContentPropertyNames.MODIFIED_TIME, Instant.now() );
        data1.setString( ContentPropertyNames.MODIFIER, PrincipalKey.ofAnonymous().toString() );
        final NodeVersion nodeVersion1 = NodeVersion.create().data( data1 ).build();

        final PropertyTree data2 = new PropertyTree();
        data2.setString( ContentPropertyNames.DISPLAY_NAME, "DEF" );
        data2.setInstant( ContentPropertyNames.MODIFIED_TIME, Instant.now() );
        data2.setString( ContentPropertyNames.MODIFIER, PrincipalKey.ofAnonymous().toString() );
        final NodeVersion nodeVersion2 = NodeVersion.create().data( data2 ).build();

        when( nodeService.findVersions( any ( GetNodeVersionsParams.class ) ) ).thenReturn( nodeVersionQueryResult  );

        when( nodeService.getActiveVersions( any( GetActiveNodeVersionsParams.class ) ) ).thenReturn(
            GetActiveNodeVersionsResult.create().add( ContentConstants.BRANCH_DRAFT, newNodeVersionMeta ).build() );
        when( nodeService.getByNodeVersionKey( nodeVersionKey1 ) ).thenReturn( nodeVersion1 );
        when( nodeService.getByNodeVersionKey( nodeVersionKey2 ) ).thenReturn( nodeVersion2 );
    }

    @Test
    public void getAttachments()
    {
        ContentResource contentResource = getResourceInstance();

        Attachment attachment = Attachment.create().name( "logo.png" ).mimeType( "image/png" ).label( "small" ).size( 6789 ).build();

        Content content = Content.create()
            .id( ContentId.from( "123" ) )
            .parentPath( ContentPath.ROOT )
            .name( "one" )
            .displayName( "one" )
            .type( ContentTypeName.folder() )
            .attachments( Attachments.create().add( attachment ).build() )
            .build();

        when( contentService.getById( content.getId() ) ).thenReturn( content );

        List<AttachmentJson> result = contentResource.getAttachments( content.getId().toString() );

        assertEquals( new AttachmentJson( attachment ), result.get( 0 ) );
    }

    @Test
    public void getLocales()
    {
        ContentResource contentResource = getResourceInstance();

        Locale[] availableLocales = Stream.of( Locale.getAvailableLocales() )
            .filter( locale -> !isNullOrEmpty( locale.toLanguageTag() ) && !isNullOrEmpty( locale.getDisplayName() ) )
            .toArray( Locale[]::new );

        if ( availableLocales.length > 0 )
        {
            Locale locale = availableLocales[0];

            assertTrue( contentResource.getLocales( locale.toLanguageTag() ).getLocales().contains( new LocaleJson( locale ) ) );
            if ( !isNullOrEmpty( ( locale.getDisplayName( locale ) ) ) )
            {
                assertTrue(
                    contentResource.getLocales( locale.getDisplayName( locale ) ).getLocales().contains( new LocaleJson( locale ) ) );
            }
            if ( !isNullOrEmpty( ( locale.getLanguage() ) ) )
            {
                assertTrue( contentResource.getLocales( locale.getLanguage() ).getLocales().contains( new LocaleJson( locale ) ) );
            }
            if ( !isNullOrEmpty( ( locale.getDisplayLanguage( locale ) ) ) )
            {
                assertTrue(
                    contentResource.getLocales( locale.getDisplayLanguage( locale ) ).getLocales().contains( new LocaleJson( locale ) ) );
            }
            if ( !isNullOrEmpty( ( locale.getVariant() ) ) )
            {
                assertTrue( contentResource.getLocales( locale.getVariant() ).getLocales().contains( new LocaleJson( locale ) ) );
            }
            if ( !isNullOrEmpty( ( locale.getDisplayVariant( locale ) ) ) )
            {
                assertTrue(
                    contentResource.getLocales( locale.getDisplayVariant( locale ) ).getLocales().contains( new LocaleJson( locale ) ) );
            }
            if ( !isNullOrEmpty( ( locale.getCountry() ) ) )
            {
                assertTrue( contentResource.getLocales( locale.getCountry() ).getLocales().contains( new LocaleJson( locale ) ) );
            }
            if ( !isNullOrEmpty( ( locale.getDisplayCountry( locale ) ) ) )
            {
                assertTrue(
                    contentResource.getLocales( locale.getDisplayCountry( locale ) ).getLocales().contains( new LocaleJson( locale ) ) );
            }
        }

    }

    @Test
    public void getLocales_all()
    {
        ContentResource contentResource = getResourceInstance();

        Locale[] expectedLocales = Arrays.stream( Locale.getAvailableLocales() )
            .filter( ( locale ) -> !isNullOrEmpty( locale.toLanguageTag() ) && !isNullOrEmpty( locale.getDisplayName() ) )
            .toArray( Locale[]::new );

        LocaleListJson result = contentResource.getLocales( "" );
        assertEquals( expectedLocales.length, result.getLocales().size() );
    }


    @Test
    public void listChildrenIds()
    {
        ContentResource contentResource = getResourceInstance();

        Content parentContent = createContent( "content-id1", "content-name1", "myapplication:content-type" );
        Content content1 = createContent( "content-id2", parentContent.getPath(), "content-name2", "myapplication:content-type",
                                          AccessControlList.empty() );
        Content content2 = createContent( "content-id3", parentContent.getPath(), "content-name3", "myapplication:content-type",
                                          AccessControlList.empty() );
        Content content3 = createContent( "content-id4", parentContent.getPath(), "content-name4", "myapplication:content-type",
                                          AccessControlList.empty() );

        when( this.contentService.findIdsByParent( any( FindContentByParentParams.class ) ) ).thenReturn(
            FindContentIdsByParentResult.create()
                .contentIds( ContentIds.from( content1.getId(), content2.getId(), content3.getId() ) )
                .build() );

        List<ContentIdJson> result =
            contentResource.listChildrenIds( parentContent.getId().toString(), ChildOrder.defaultOrder().toString() );

        assertTrue( result.contains( new ContentIdJson( content1.getId() ) ) );
        assertTrue( result.contains( new ContentIdJson( content2.getId() ) ) );
        assertTrue( result.contains( new ContentIdJson( content3.getId() ) ) );
    }

    @Test
    public void testLoadImage()
        throws Exception
    {
        HttpServer server = HttpServer.create( new InetSocketAddress( 0 ), 0 );
        server.start();
        try
        {
            URL imageUrl = new URL( "http://localhost:" + server.getAddress().getPort() );

            server.createContext( "/", exchange -> {

                exchange.sendResponseHeaders( 200, 0 );
                getClass().getResourceAsStream( "coliseum.jpg" ).transferTo( exchange.getResponseBody() );
                exchange.close();
            } );

            final Content content = createContent( "aaa", "my_a_content", "myapplication:my_type" );
            final String json = "{\"url\": \"" + imageUrl + "\",\"parent\": \"/content\", \"name\": \"imageToUpload.jpg\"}";

            when( contentService.create( any( CreateMediaParams.class ) ) ).thenReturn( content );

            request().path( "content/createMediaFromUrl" ).entity( json, MediaType.APPLICATION_JSON_TYPE ).post().getAsString();

            verify( contentService ).create( isA( CreateMediaParams.class ) );
        }
        finally
        {
            server.stop( 0 );
        }
    }

    @Test
    public void testLoadImage_exceeds_max_upload_size()
        throws Exception
    {
        HttpServer server = HttpServer.create( new InetSocketAddress( 0 ), 0 );
        server.start();
        try
        {
            URL imageUrl = new URL( "http://localhost:" + server.getAddress().getPort() );

            server.createContext( "/", exchange -> {

                exchange.sendResponseHeaders( 200, 0 );
                getClass().getResourceAsStream( "coliseum.jpg" ).transferTo( exchange.getResponseBody() );
                exchange.close();
            } );

            final Content content = createContent( "aaa", "my_a_content", "myapplication:my_type" );
            final String json = "{\"url\": \"" + imageUrl + "\",\"parent\": \"/content\", \"name\": \"imageToUpload.jpg\"}";

            when( contentService.create( any( CreateMediaParams.class ) ) ).thenReturn( content );

            when( config.uploadMaxFileSize() ).thenReturn( "1b" );
            resource.activate( config );

            final MockRestResponse post =
                request().path( "content/createMediaFromUrl" ).entity( json, MediaType.APPLICATION_JSON_TYPE ).post();

            assertEquals( 500, post.getStatus() );
            assertEquals( "File size exceeds maximum allowed upload size", post.getAsString() );
        }
        finally
        {
            server.stop( 0 );
        }
    }

    @Test
    public void testLoadImageFromFile()
        throws Exception
    {
        final Content content = createContent( "aaa", "my_a_content", "myapplication:my_type" );
        final URL url = getClass().getResource( "coliseum.jpg" );
        final String json = "{\"url\": \"" + url.toString() + "\",\"parent\": \"/content\", \"name\": \"imageToUpload.jpg\"}";

        when( contentService.create( any( CreateMediaParams.class ) ) ).thenReturn( content );

        final MockRestResponse post = request().path( "content/createMediaFromUrl" ).entity( json, MediaType.APPLICATION_JSON_TYPE ).post();

        assertEquals( 500, post.getStatus() );
        assertEquals( "Illegal protocol", post.getAsString() );
    }

    @Test
    public void testLoadImageWithMalformedUrl()
        throws Exception
    {
        final MockRestResponse post = request().path( "content/createMediaFromUrl" )
            .entity( readFromFile( "create_media_from_url.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post();

        assertEquals( 500, post.getStatus() );
        assertEquals( "no protocol: some_url", post.getAsString() );
    }

    @Test
    public void testRevert_by_id()
    {
        // prepare
        final ContentResource instance = getResourceInstance();
        final RevertContentJson params = new RevertContentJson( "content-id", "versionKey" );
        final Content updatedContent = createContent( "content-id", "content-name", "myapplication:content-type" );
        final PrincipalKey principalKey = RoleKeys.ADMIN;

        // mock
        final Content versionedContent = mock( Content.class );
        final Content currentContent = mock( Content.class );
        final ByteSource byteSource = mock( ByteSource.class );
        final ContentVersion contentVersion =
            ContentVersion.create().id( ContentVersionId.from( "contentVersionId" ) ).modifier( principalKey ).build();

        final Attachments attachments =
            Attachments.create().add( Attachment.create().name( "attachment" ).mimeType( "mimeType" ).size( 1000L ).build() ).build();

        when( versionedContent.getId() ).thenReturn( ContentId.from( "nodeId" ) );
        when( versionedContent.getAttachments() ).thenReturn( attachments );
        when( contentService.getByIdAndVersionId( any( ContentId.class ), any( ContentVersionId.class ) ) ).thenReturn( versionedContent );
        when( contentService.getById( any( ContentId.class ) ) ).thenReturn( currentContent );
        when( contentService.update( any( UpdateContentParams.class ) ) ).thenReturn( updatedContent );
        when( versionedContent.getChildOrder() ).thenReturn( ChildOrder.create().build() );
        when( currentContent.getId() ).thenReturn( ContentId.from( "nodeId" ) );
        when( currentContent.getChildOrder() ).thenReturn( ChildOrder.manualOrder() );
        when( contentService.getBinary( any( ContentId.class ), any( ContentVersionId.class ), any( BinaryReference.class ) ) ).thenReturn(
            byteSource );
        mockVersions();

        // test
        final ContentVersionJson result = instance.revert( params );

        // assert
        assertNotNull( result );
        assertEquals( "nodeVersionNew", result.getId() );

        // verify
        verify( this.contentService, times( 1 ) ).getByIdAndVersionId( any( ContentId.class ), any( ContentVersionId.class ) );
        verify( this.contentService, times( 1 ) ).getBinary( any( ContentId.class ), any( ContentVersionId.class ),
                                                             any( BinaryReference.class ) );
        verify( this.contentService, times( 1 ) ).update( any( UpdateContentParams.class ) );
        verify( this.contentService, times( 1 ) ).sort( any( SortContentParams.class ) );
        verify( this.contentService, times( 2 ) ).getById( any( ContentId.class ) );
        verifyNoMoreInteractions( contentService );
    }

    @Test
    public void testRevert_by_path()
    {
        // prepare
        final ContentResource instance = getResourceInstance();
        final RevertContentJson params = new RevertContentJson( "content-id", "versionKey" );
        final Content updatedContent = createContent( "content-id", "content-name", "myapplication:content-type" );
        final PrincipalKey principalKey = RoleKeys.ADMIN;

        // mock
        final Content versionedContent = mock( Content.class );
        final Content currentContent = mock( Content.class );
        final ContentVersion contentVersion =
            ContentVersion.create().id( ContentVersionId.from( "contentVersionId" ) ).modifier( principalKey ).build();

        when( versionedContent.getId() ).thenReturn( ContentId.from( "nodeId" ) );
        when( versionedContent.getChildOrder() ).thenReturn( ChildOrder.create().build() );
        when( currentContent.getId() ).thenReturn( ContentId.from( "nodeId" ) );
        when( currentContent.getChildOrder() ).thenReturn( ChildOrder.create().build() );
        when( contentService.getByIdAndVersionId( any( ContentId.class ), any( ContentVersionId.class ) ) ).thenReturn( versionedContent );
        when( contentService.getByPath( any( ContentPath.class ) ) ).thenReturn( currentContent );
        when( contentService.update( any( UpdateContentParams.class ) ) ).thenReturn( updatedContent );
        when( contentService.getById( any( ContentId.class ) ) ).thenReturn( currentContent );
        mockVersions();

        // test
        final ContentVersionJson result = instance.revert( params );

        // assert
        assertNotNull( result );
        assertEquals( "nodeVersionNew", result.getId() );

        // verify
        verify( this.contentService, times( 1 ) ).getByIdAndVersionId( any( ContentId.class ), any( ContentVersionId.class ) );
        verify( this.contentService, times( 1 ) ).update( any( UpdateContentParams.class ) );
        verify( this.contentService, times( 2 ) ).getById( any( ContentId.class ) );
        verifyNoMoreInteractions( contentService );
    }

    @Test
    public void testRevert_not_found()
    {
        // prepare
        final ContentResource instance = getResourceInstance();
        final RevertContentJson params = new RevertContentJson( "content-id1", "versionKey" );

        // mock
        when( contentService.getByIdAndVersionId( any( ContentId.class ), any( ContentVersionId.class ) ) ).thenReturn( null );

        // test & assert
        final WebApplicationException exception = assertThrows( WebApplicationException.class, () -> instance.revert( params ) );

        assertEquals( "Content with contentKey [content-id1] and versionId [versionKey] not found", exception.getMessage() );

        // verify
        verify( this.contentService, times( 1 ) ).getByIdAndVersionId( any( ContentId.class ), any( ContentVersionId.class ) );
        verifyNoMoreInteractions( contentService );
    }

    @Test
    public void test_localize_content()
    {
        final String contentId = "content-id";
        final ContentResource instance = getResourceInstance();
        final List<String> ids = new ArrayList<>();
        ids.add( contentId );
        final LocalizeContentsJson params = new LocalizeContentsJson( ids, "en" );

        ArgumentCaptor<UpdateContentParams> argumentCaptor = ArgumentCaptor.forClass( UpdateContentParams.class );
        Content content = createContent( contentId, "content-name", "myapplication:content-type" );
        when( this.contentService.update( any( UpdateContentParams.class ) ) ).thenReturn( content );

        instance.localize( params, request );

        verify( this.contentService, times( 1 ) ).update( argumentCaptor.capture() );
        assertTrue( argumentCaptor.getValue().getContentId().equals( ContentId.from( contentId ) ) );
    }

    @Test
    public void test_localize_content_no_ids()
    {
        final ContentResource instance = getResourceInstance();
        final LocalizeContentsJson params = new LocalizeContentsJson( new ArrayList<>(), "en" );

        // test & assert
        final WebApplicationException exception = assertThrows( WebApplicationException.class, () -> instance.localize( params, request ) );

        assertEquals( "Can't localize content: no content IDs provided", exception.getMessage() );

        // verify
        verifyNoMoreInteractions( contentService );
    }

    @Test
    public void testRestoreInherit()
    {
        final ContentResource instance = getResourceInstance();
        final ResetContentInheritJson params = new ResetContentInheritJson( "contentId", "test-project", List.of( "NAME", "PARENT" ) );

        final ArgumentCaptor<ResetContentInheritParams> captor = ArgumentCaptor.forClass( ResetContentInheritParams.class );

        instance.restoreInherit( params );

        verify( this.syncContentService, times( 1 ) ).resetInheritance( captor.capture() );

        assertEquals( params.toParams().getContentId(), captor.getValue().getContentId() );
        assertEquals( params.toParams().getInherit(), captor.getValue().getInherit() );
        assertEquals( params.toParams().getProjectName(), captor.getValue().getProjectName() );
    }

    private ContentTreeSelectorQueryJson initContentTreeSelectorQueryJson( final ContentPath parentPath )
    {
        final ContentTreeSelectorQueryJson json = mock( ContentTreeSelectorQueryJson.class );

        when( json.getFrom() ).thenReturn( 0 );
        when( json.getSize() ).thenReturn( -1 );
        when( json.getQueryExprString() ).thenReturn( "" );
        when( json.getContentTypeNames() ).thenReturn( Collections.emptyList() );
        when( json.getParentPath() ).thenReturn( parentPath );

        return json;
    }

    private User createUser( final String displayName )
    {
        final String userId = displayName.replace( " ", "" ).toLowerCase();
        return User.create().displayName( userId ).key( PrincipalKey.ofUser( SYSTEM, userId ) ).login( userId ).build();
    }

    private Content createContent( final String id, final ContentPath parentPath, final String name, final String contentTypeName,
                                   final AccessControlList permissions )
    {
        knownContentTypes.add( createContentType( contentTypeName ) );

        final PropertyTree metadata = new PropertyTree();
        metadata.setLong( "myProperty", 1L );

        return Content.create()
            .id( ContentId.from( id ) )
            .parentPath( parentPath )
            .name( name )
            .valid( true )
            .createdTime( this.fixedTime )
            .creator( PrincipalKey.from( "user:system:admin" ) )
            .owner( PrincipalKey.from( "user:myStore:me" ) )
            .language( Locale.ENGLISH )
            .displayName( "My Content" )
            .modifiedTime( this.fixedTime )
            .modifier( PrincipalKey.from( "user:system:admin" ) )
            .type( ContentTypeName.from( contentTypeName ) )
            .addExtraData( new ExtraData( XDataName.from( "myApplication:myField" ), metadata ) )
            .publishInfo( ContentPublishInfo.create()
                              .from( Instant.parse( "2016-11-02T10:36:00Z" ) )
                              .to( Instant.parse( "2016-11-22T10:36:00Z" ) )
                              .first( Instant.parse( "2016-11-02T10:36:00Z" ) )
                              .build() )
            .permissions( permissions )
            .build();
    }

    private Content createContent( final String id, final String name, final String contentTypeName )
    {
        return createContent( id, ContentPath.ROOT, name, contentTypeName, AccessControlList.empty() );
    }

    private Content createContent( final String id, final String name, final String contentTypeName, final AccessControlList permissions )
    {
        return createContent( id, ContentPath.ROOT, name, contentTypeName, permissions );
    }

    private Content createContent( final String id, final String name, final String contentTypeName, final Set<ContentInheritType> inherit,
                                   final ProjectName originProjectName )
    {
        knownContentTypes.add( createContentType( contentTypeName ) );
        return Content.create( this.createContent( id, ContentPath.ROOT, name, contentTypeName, AccessControlList.empty() ) )
            .setInherit( inherit )
            .originProject( originProjectName )
            .build();
    }

    private Site createSite( final String id, final String name, SiteConfigs siteConfigs )
    {
        return Site.create()
            .siteConfigs( siteConfigs )
            .id( ContentId.from( id ) )
            .parentPath( ContentPath.ROOT )
            .name( name )
            .valid( true )
            .createdTime( this.fixedTime )
            .creator( PrincipalKey.from( "user:system:admin" ) )
            .owner( PrincipalKey.from( "user:myStore:me" ) )
            .language( Locale.ENGLISH )
            .displayName( "My Site" )
            .modifiedTime( this.fixedTime )
            .modifier( PrincipalKey.from( "user:system:admin" ) )
            .build();
    }

    private ContentType createContentType( String name )
    {
        return ContentType.create()
            .superType( ContentTypeName.structured() )
            .displayName( "My type" )
            .name( name )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();
    }

    private AccessControlList getTestPermissions()
    {
        return AccessControlList.of( AccessControlEntry.create().principal( PrincipalKey.from( "user:system:admin" ) ).allowAll().build(),
                                     AccessControlEntry.create().principal( PrincipalKey.ofAnonymous() ).allow( READ ).build() );
    }

    private void assertContentVersionJsonsEquality( final ContentVersionJson first, final ContentVersionJson second )
    {
        Assertions.assertThat( first ).usingRecursiveComparison().isEqualTo( second );
        assertEquals( first.getModifier(), second.getModifier() );
        assertEquals( first.getTimestamp(), second.getTimestamp() );
        assertEquals( first.getDisplayName(), second.getDisplayName() );
        assertEquals( first.getModified(), second.getModified() );
        assertEquals( first.getComment(), second.getComment() );
        assertEquals( first.getId(), second.getId() );
        assertEquals( first.getModifierDisplayName(), second.getModifierDisplayName() );

        assertEquals( first.getPublishInfo().getTimestamp(), second.getPublishInfo().getTimestamp() );
        assertEquals( first.getPublishInfo().getPublisher(), second.getPublishInfo().getPublisher() );
        assertEquals( first.getPublishInfo().getMessage(), second.getPublishInfo().getMessage() );
        assertEquals( first.getPublishInfo().getPublisherDisplayName(), second.getPublishInfo().getPublisherDisplayName() );
    }

    private void assertContentVersionViewJsonsEquality( final ContentVersionViewJson first, final ContentVersionViewJson second )
    {
        assertContentVersionJsonsEquality( first, second );
        assertEquals( first.getWorkspaces(), second.getWorkspaces() );
    }
}
