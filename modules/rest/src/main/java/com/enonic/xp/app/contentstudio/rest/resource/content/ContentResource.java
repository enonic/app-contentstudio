package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.io.InputStream;
import java.net.URL;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Multimap;
import com.google.common.io.ByteSource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import com.enonic.xp.app.ApplicationWildcardMatcher;
import com.enonic.xp.app.contentstudio.json.content.CompareContentResultsJson;
import com.enonic.xp.app.contentstudio.json.content.ContentIdJson;
import com.enonic.xp.app.contentstudio.json.content.ContentJson;
import com.enonic.xp.app.contentstudio.json.content.ContentListJson;
import com.enonic.xp.app.contentstudio.json.content.ContentPermissionsJson;
import com.enonic.xp.app.contentstudio.json.content.ContentSummaryJson;
import com.enonic.xp.app.contentstudio.json.content.ContentTreeSelectorListJson;
import com.enonic.xp.app.contentstudio.json.content.ContentVersionJson;
import com.enonic.xp.app.contentstudio.json.content.ContentsExistByPathJson;
import com.enonic.xp.app.contentstudio.json.content.ContentsExistJson;
import com.enonic.xp.app.contentstudio.json.content.DependenciesAggregationJson;
import com.enonic.xp.app.contentstudio.json.content.DependenciesJson;
import com.enonic.xp.app.contentstudio.json.content.GetActiveContentVersionsResultJson;
import com.enonic.xp.app.contentstudio.json.content.GetContentVersionsForViewResultJson;
import com.enonic.xp.app.contentstudio.json.content.GetContentVersionsResultJson;
import com.enonic.xp.app.contentstudio.json.content.ReorderChildrenResultJson;
import com.enonic.xp.app.contentstudio.json.content.RootPermissionsJson;
import com.enonic.xp.app.contentstudio.json.content.attachment.AttachmentJson;
import com.enonic.xp.app.contentstudio.json.content.attachment.AttachmentListJson;
import com.enonic.xp.app.contentstudio.json.task.TaskResultJson;
import com.enonic.xp.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.app.contentstudio.rest.LimitingInputStream;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.AbstractContentQueryResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ApplyContentPermissionsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.BatchContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.CompareContentsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentIdsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentIdsPermissionsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentPathsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentQueryJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentSelectorQueryJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentTreeSelectorJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentTreeSelectorQueryJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentWithRefsResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.CreateContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.CreateMediaFromUrlJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.DeleteAttachmentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.DeleteContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.DuplicateContentsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.EffectivePermissionAccessJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.EffectivePermissionJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.EffectivePermissionMemberJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.FindIdsByParentsResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.GetContentVersionsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.GetDependenciesJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.GetDependenciesResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.GetDescendantsOfContents;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.HasUnpublishedChildrenResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.LocaleListJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.LocalizeContentsJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.MarkAsReadyJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.MoveContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.PublishContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ReorderChildJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ReorderChildrenJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ResetContentInheritJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ResolvePublishContentResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ResolvePublishDependenciesJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.RevertContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.SetChildOrderJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.UnpublishContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.UpdateContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.query.ContentQueryWithChildren;
import com.enonic.xp.app.contentstudio.rest.resource.content.task.ApplyPermissionsRunnableTask;
import com.enonic.xp.app.contentstudio.rest.resource.content.task.DeleteRunnableTask;
import com.enonic.xp.app.contentstudio.rest.resource.content.task.DuplicateRunnableTask;
import com.enonic.xp.app.contentstudio.rest.resource.content.task.MoveRunnableTask;
import com.enonic.xp.app.contentstudio.rest.resource.content.task.PublishRunnableTask;
import com.enonic.xp.app.contentstudio.rest.resource.content.task.UnpublishRunnableTask;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.FindContentVersionsCommand;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.GetActiveContentVersionsCommand;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.ContentTypeIconResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.ContentTypeIconUrlResolver;
import com.enonic.xp.attachment.Attachment;
import com.enonic.xp.attachment.AttachmentNames;
import com.enonic.xp.attachment.Attachments;
import com.enonic.xp.attachment.CreateAttachment;
import com.enonic.xp.attachment.CreateAttachments;
import com.enonic.xp.branch.Branch;
import com.enonic.xp.branch.Branches;
import com.enonic.xp.content.ActiveContentVersionEntry;
import com.enonic.xp.content.CompareContentResult;
import com.enonic.xp.content.CompareContentResults;
import com.enonic.xp.content.CompareContentsParams;
import com.enonic.xp.content.CompareStatus;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentAlreadyExistsException;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentDependencies;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentIndexPath;
import com.enonic.xp.content.ContentName;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentPaths;
import com.enonic.xp.content.ContentQuery;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.ContentValidityParams;
import com.enonic.xp.content.ContentValidityResult;
import com.enonic.xp.content.ContentVersion;
import com.enonic.xp.content.ContentVersionId;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.CreateMediaParams;
import com.enonic.xp.content.FindContentByParentParams;
import com.enonic.xp.content.FindContentByParentResult;
import com.enonic.xp.content.FindContentIdsByParentResult;
import com.enonic.xp.content.FindContentIdsByQueryResult;
import com.enonic.xp.content.FindContentVersionsParams;
import com.enonic.xp.content.FindContentVersionsResult;
import com.enonic.xp.content.GetActiveContentVersionsParams;
import com.enonic.xp.content.GetActiveContentVersionsResult;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.content.GetPublishStatusesParams;
import com.enonic.xp.content.GetPublishStatusesResult;
import com.enonic.xp.content.HasUnpublishedChildrenParams;
import com.enonic.xp.content.RenameContentParams;
import com.enonic.xp.content.ReorderChildContentsParams;
import com.enonic.xp.content.ReorderChildContentsResult;
import com.enonic.xp.content.ReorderChildParams;
import com.enonic.xp.content.ResolvePublishDependenciesParams;
import com.enonic.xp.content.ResolveRequiredDependenciesParams;
import com.enonic.xp.content.SetContentChildOrderParams;
import com.enonic.xp.content.SyncContentService;
import com.enonic.xp.content.UpdateContentParams;
import com.enonic.xp.content.UpdateMediaParams;
import com.enonic.xp.content.WorkflowInfo;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.extractor.BinaryExtractor;
import com.enonic.xp.extractor.ExtractedData;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.index.ChildOrder;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.query.expr.CompareExpr;
import com.enonic.xp.query.expr.FieldExpr;
import com.enonic.xp.query.expr.FieldOrderExpr;
import com.enonic.xp.query.expr.OrderExpr;
import com.enonic.xp.query.expr.QueryExpr;
import com.enonic.xp.query.expr.ValueExpr;
import com.enonic.xp.query.filter.BooleanFilter;
import com.enonic.xp.query.filter.IdFilter;
import com.enonic.xp.query.parser.QueryParser;
import com.enonic.xp.repository.IndexException;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.relationship.RelationshipTypeService;
import com.enonic.xp.security.Principal;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.PrincipalKeys;
import com.enonic.xp.security.PrincipalQuery;
import com.enonic.xp.security.PrincipalQueryResult;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.acl.AccessControlEntry;
import com.enonic.xp.security.acl.AccessControlList;
import com.enonic.xp.security.acl.Permission;
import com.enonic.xp.security.auth.AuthenticationInfo;
import com.enonic.xp.task.TaskService;
import com.enonic.xp.util.BinaryReference;
import com.enonic.xp.util.ByteSizeParser;
import com.enonic.xp.util.Exceptions;
import com.enonic.xp.web.HttpStatus;
import com.enonic.xp.web.multipart.MultipartForm;
import com.enonic.xp.web.multipart.MultipartItem;

import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;
import static com.google.common.base.Strings.isNullOrEmpty;
import static com.google.common.base.Strings.nullToEmpty;
import static java.lang.Math.toIntExact;
import static java.util.Optional.ofNullable;

@SuppressWarnings("UnusedDeclaration")
@Path(REST_ROOT + "{content:(content|" + CONTENT_CMS_PATH + "/content)}")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs", configurationPid = "com.enonic.app.contentstudio")
public final class ContentResource
    implements JaxRsComponent
{
    public static final String DEFAULT_SORT_FIELD = "modifiedTime";

    public static final int GET_ALL_SIZE_FLAG = -1;

    private static final Set<String> ALLOWED_PROTOCOLS = Set.of( "http", "https" );

    private static final String DEFAULT_FROM_PARAM = "0";

    private static final String DEFAULT_SIZE_PARAM = "500";

    private static final String EXPAND_FULL = "full";

    private static final String EXPAND_SUMMARY = "summary";

    private static final String EXPAND_NONE = "none";

    private static final int MAX_EFFECTIVE_PERMISSIONS_PRINCIPALS = 10;

    private static final Logger LOG = LoggerFactory.getLogger( ContentResource.class );

    private ContentService contentService;

    private NodeService nodeService;

    private ContentPrincipalsResolver principalsResolver;

    private SecurityService securityService;

    private RelationshipTypeService relationshipTypeService;

    private BinaryExtractor extractor;

    private TaskService taskService;

    private ContentTypeService contentTypeService;

    private LocaleService localeService;

    private SyncContentService syncContentService;

    private JsonObjectsFactory jsonObjectsFactory;

    private volatile long uploadMaxFileSize;

    private ApplicationWildcardMatcher.Mode contentTypeParseMode;

    @Activate
    @Modified
    public void activate( final AdminRestConfig config )
    {
        uploadMaxFileSize = ByteSizeParser.parse( config.uploadMaxFileSize() );
        contentTypeParseMode = ApplicationWildcardMatcher.Mode.valueOf( config.contentTypePatternMode() );
    }

    @POST
    @Path("create")
    public ContentJson create( final CreateContentJson params, @Context HttpServletRequest request )
    {
        final Content persistedContent = contentService.create( params.getCreateContent() );
        return jsonObjectsFactory.createContentJson( persistedContent, request );
    }

    @POST
    @Path("createMedia")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public ContentJson createMedia( final MultipartForm form, @Context HttpServletRequest request )
        throws Exception
    {
        final CreateMediaParams createMediaParams = new CreateMediaParams();

        final MultipartItem mediaFile = form.get( "file" );
        checkSize( mediaFile );
        createMediaParams.name( form.getAsString( "name" ) )
            .mimeType( mediaFile.getContentType().toString() )
            .byteSource( mediaFile.getBytes() );

        final String parentParam = form.getAsString( "parent" );
        if ( parentParam.startsWith( "/" ) )
        {
            createMediaParams.parent( ContentPath.from( parentParam ) );
        }
        else
        {
            final Content parentContent = ContextBuilder.copyOf(ContextAccessor.current()).branch(ContentConstants.BRANCH_DRAFT).build().callWith(() -> contentService.getById( ContentId.from( parentParam ) ) );
            createMediaParams.parent( parentContent.getPath() );
        }

        final String focalX = form.getAsString( "focalX" );
        final String focalY = form.getAsString( "focalY" );

        if ( !nullToEmpty( focalX ).isBlank() )
        {
            createMediaParams.focalX( Double.parseDouble( focalX ) );
        }
        if ( !nullToEmpty( focalY ).isBlank() )
        {
            createMediaParams.focalY( Double.parseDouble( focalY ) );
        }

        final Content persistedContent = ContextBuilder.copyOf(ContextAccessor.current()).branch(ContentConstants.BRANCH_DRAFT).build().callWith(() -> contentService.create( createMediaParams ));

        return jsonObjectsFactory.createContentJson( persistedContent, request );
    }

    @POST
    @Path("createMediaFromUrl")
    public ContentJson createMediaFromUrl( final CreateMediaFromUrlJson params, @Context HttpServletRequest request )
        throws Exception
    {
        final URL url = new URL( params.getUrl() );
        if ( !ALLOWED_PROTOCOLS.contains( url.getProtocol() ) )
        {
            throw new IllegalArgumentException( "Illegal protocol" );
        }

        final CreateMediaParams createMediaParams = new CreateMediaParams();

        createMediaParams.name( params.getName() );

        try (InputStream inputStream = url.openStream())
        {
            createMediaParams.byteSource( ByteSource.wrap( new LimitingInputStream<>( inputStream, uploadMaxFileSize,
                                                                                      () -> new IllegalStateException(
                                                                                          "File size exceeds maximum allowed upload size" ) ).readAllBytes() ) );
        }

        final String parent = params.getParent();
        if ( parent.startsWith( "/" ) )
        {
            createMediaParams.parent( ContentPath.from( parent ) );
        }
        else
        {
            final Content parentContent = contentService.getById( ContentId.from( parent ) );
            createMediaParams.parent( parentContent.getPath() );
        }

        final Content persistedContent = contentService.create( createMediaParams );

        return jsonObjectsFactory.createContentJson( persistedContent, request );
    }

    @POST
    @Path("updateMedia")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public ContentJson updateMedia( final MultipartForm form, @Context HttpServletRequest request )
    {
        final UpdateMediaParams params =
            new UpdateMediaParams().content( ContentId.from( form.getAsString( "content" ) ) ).name( form.getAsString( "name" ) );

        final MultipartItem mediaFile = form.get( "file" );
        checkSize( mediaFile );
        params.mimeType( mediaFile.getContentType().toString() );
        params.byteSource( mediaFile.getBytes() );

        final String focalX = form.getAsString( "focalX" );
        final String focalY = form.getAsString( "focalY" );

        if ( !nullToEmpty( focalX ).isBlank() )
        {
            params.focalX( Double.parseDouble( focalX ) );
        }
        if ( !nullToEmpty( focalY ).isBlank() )
        {
            params.focalY( Double.parseDouble( focalY ) );
        }

        final Content persistedContent = contentService.update( params );

        return jsonObjectsFactory.createContentJson( persistedContent, request );
    }

    @POST
    @Path("updateThumbnail")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public ContentJson updateThumbnail( final MultipartForm form, @Context HttpServletRequest request )
    {
        final Content persistedContent = this.doCreateAttachment( AttachmentNames.THUMBNAIL, form );

        return jsonObjectsFactory.createContentJson( persistedContent, request );
    }

    @POST
    @Path("createAttachment")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public AttachmentJson createAttachment( final MultipartForm form )
    {
        final String attachmentName = form.getAsString( "name" );

        final Content persistedContent = this.doCreateAttachment( attachmentName, form );

        return new AttachmentJson( persistedContent.getAttachments().byName( attachmentName ) );

    }

    @POST
    @Path("deleteAttachment")
    public ContentJson deleteAttachment( final DeleteAttachmentJson json, @Context HttpServletRequest request )
    {
        final UpdateContentParams params =
            new UpdateContentParams().contentId( json.getContentId() ).removeAttachments( json.getAttachmentReferences() );

        final Content content = contentService.update( params );
        return jsonObjectsFactory.createContentJson( content, request );
    }

    @POST
    @Path("duplicate")
    public TaskResultJson duplicate( final DuplicateContentsJson params )
    {
        return DuplicateRunnableTask.create()
            .params( params )
            .description( "Duplicate content" )
            .taskService( taskService )
            .contentService( contentService )
            .authInfo( ContextAccessor.current().getAuthInfo() )
            .build()
            .createTaskResult();
    }

    @POST
    @Path("localize")
    public ContentListJson<ContentSummaryJson> localize( final LocalizeContentsJson params, @Context HttpServletRequest request )
    {
        if ( params.getContentIds().isEmpty() )
        {
            throw new WebApplicationException( "Can't localize content: no content IDs provided" );
        }

        final Locale language = params.getLanguage();

        final List<Content> updatedItems =
            params.getContentIds().stream().map( id -> this.localizeContent( id, language ) ).collect( Collectors.toList() );

        final Contents contents = Contents.from( updatedItems );

        final ContentListMetaData metaData =
            ContentListMetaData.create().totalHits( contents.getSize() ).hits( contents.getSize() ).build();

        return new ContentListJson<>( contents, metaData, c -> jsonObjectsFactory.createContentSummaryJson(c, request) );
    }

    private Content localizeContent( final ContentId id, final Locale language )
    {
        final UpdateContentParams updateContentParams = new UpdateContentParams().contentId( id ).editor( edit -> {
            if ( language != null )
            {
                edit.language = language;
            }
        } );

        return contentService.update( updateContentParams );
    }

    @POST
    @Path("move")
    public TaskResultJson move( final MoveContentJson params )
    {
        return MoveRunnableTask.create()
            .params( params )
            .description( "Move content" )
            .taskService( taskService )
            .contentService( contentService )
            .build()
            .createTaskResult();
    }

    @POST
    @Path("update")
    public ContentJson update( final UpdateContentJson json, @Context HttpServletRequest request )
    {
        if ( contentNameIsOccupied( json.getRenameContentParams() ) )
        {
            throw new WebApplicationException( String.format( "Content [%s] could not be updated. A content with that name already exists",
                                                              json.getRenameContentParams().getNewName() ), Response.Status.CONFLICT );
        }
        validatePublishInfo( json );

        final UpdateContentParams updateParams = json.getUpdateContentParams();

        final AccessControlList permissionsBeforeSave = contentService.getById( updateParams.getContentId() ).getPermissions();

        final Content updatedContent = ContextBuilder.copyOf(ContextAccessor.current()).branch(ContentConstants.BRANCH_DRAFT).build().callWith(() -> contentService.update( updateParams ));

       /* if ( !permissionsBeforeSave.equals( updatedContent.getPermissions() ) )
        {
            this.contentService.applyPermissions( json.getApplyContentPermissionsParams() );
        }*/

        if ( json.getContentName().equals( updatedContent.getName() ) )
        {
            return jsonObjectsFactory.createContentJson( updatedContent, request );
        }

        try
        {
            // in case content with same name and path was created in between content updated and renamed
            final RenameContentParams renameParams = makeRenameParams( json.getRenameContentParams() );
            final Content renamedContent = contentService.rename( renameParams );
            return jsonObjectsFactory.createContentJson( renamedContent, request );
        }
        catch ( ContentAlreadyExistsException e )
        {
            // catching to throw exception with better message and other error code
            throw new WebApplicationException(
                String.format( "Content could not be renamed to [%s]. A content with that name already exists",
                               json.getRenameContentParams().getNewName() ), e, Response.Status.CONFLICT );

        }
    }

    private RenameContentParams makeRenameParams( final RenameContentParams renameParams )
    {
        if ( renameParams.getNewName().isUnnamed() && !renameParams.getNewName().hasUniqueness() )
        {
            return RenameContentParams.create().newName( ContentName.uniqueUnnamed() ).contentId( renameParams.getContentId() ).build();
        }

        return renameParams;
    }

    @POST
    @Path("delete")
    public TaskResultJson delete( final DeleteContentJson params )
    {
        return DeleteRunnableTask.create()
            .params( params )
            .description( "Delete content" )
            .taskService( taskService )
            .contentService( contentService )
            .build()
            .createTaskResult();
    }

    @POST
    @Path("getDependencies")
    public GetDependenciesResultJson getDependencies( final GetDependenciesJson params, @Context HttpServletRequest request )
    {
        final boolean isMasterQuery = ContentConstants.BRANCH_MASTER.equals( params.getBranch() );

        return ContextBuilder.from( ContextAccessor.current() )
            .branch( isMasterQuery ? ContentConstants.BRANCH_MASTER : ContentConstants.BRANCH_DRAFT )
            .build()
            .callWith( () -> new GetDependenciesResultJson( doGetDependencies( params, request ) ) );
    }

    private Map<String, DependenciesJson> doGetDependencies( final GetDependenciesJson params, final HttpServletRequest request )
    {
        final Map<String, DependenciesJson> result = new HashMap<>();
        final ContentTypeIconUrlResolver resolver =
            new ContentTypeIconUrlResolver( new ContentTypeIconResolver( contentTypeService ), request );

        params.getContentIds().forEach( ( id -> {
            final ContentDependencies dependencies = contentService.getDependencies( id );

            final List<DependenciesAggregationJson> inbound = dependencies.getInbound()
                .stream()
                .map( aggregation -> new DependenciesAggregationJson( aggregation, resolver ) )
                .collect( Collectors.toList() );

            final List<DependenciesAggregationJson> outbound = dependencies.getOutbound()
                .stream()
                .map( aggregation -> new DependenciesAggregationJson( aggregation, resolver ) )
                .collect( Collectors.toList() );

            result.put( id.toString(), new DependenciesJson( inbound, outbound ) );
        } ) );

        return result;
    }

    @POST
    @Path("publish")
    public TaskResultJson publish( final PublishContentJson params )
    {
        return PublishRunnableTask.create()
            .params( params )
            .description( "Publish content" )
            .taskService( taskService )
            .contentService( contentService )
            .build()
            .createTaskResult();
    }

    @POST
    @Path("unpublish")
    public TaskResultJson unpublish( final UnpublishContentJson params )
    {
        return UnpublishRunnableTask.create()
            .params( params )
            .description( "Unpublish content" )
            .taskService( taskService )
            .contentService( contentService )
            .build()
            .createTaskResult();
    }

    @POST
    @Path("markAsReady")
    public void markAsReady( final MarkAsReadyJson params )
    {
        ContentIds.from( params.getContentIds() ).stream().filter( contentService::contentExists ).forEach( this::markContentAsReady );
    }

    private void markContentAsReady( final ContentId contentId )
    {
        final UpdateContentParams updateParams =
            new UpdateContentParams().contentId( contentId ).editor( edit -> edit.workflowInfo = WorkflowInfo.ready() );

        contentService.update( updateParams );
    }

    @POST
    @Path("hasUnpublishedChildren")
    public HasUnpublishedChildrenResultJson hasUnpublishedChildren( final ContentIdsJson ids )
    {
        final HasUnpublishedChildrenResultJson.Builder result = HasUnpublishedChildrenResultJson.create();

        ids.getContentIds().forEach( contentId -> {
            final Boolean hasChildren =
                this.contentService.hasUnpublishedChildren( HasUnpublishedChildrenParams.create().contentId( contentId ).build() );

            result.addHasChildren( contentId, hasChildren );
        } );

        return result.build();
    }

    @POST
    @Path("findIdsByParents")
    public FindIdsByParentsResultJson findIdsByParents( final ContentIdsJson ids )
    {
        final ArrayList<ContentId> childrenIds = new ArrayList<>();
        ids.getContentIds().stream().forEach( id -> {
            FindContentByParentParams params = FindContentByParentParams.create().parentId( id ).recursive( true ).build();
            childrenIds.addAll( this.contentService.findIdsByParent( params ).getContentIds().getSet() );
        } );

        return FindIdsByParentsResultJson.create().setRequestedContents( ContentIds.from( childrenIds ) ).build();
    }

    @POST
    @Path("resolvePublishContent")
    public ResolvePublishContentResultJson resolvePublishContent( final ResolvePublishDependenciesJson params )
    {
        //Resolved the requested ContentPublishItem
        final ContentIds requestedContentIds = ContentIds.from( params.getIds() );
        final ContentIds excludeContentIds = ContentIds.from( params.getExcludedIds() );
        final ContentIds excludeChildrenIds = ContentIds.from( params.getExcludeChildrenIds() );

        //Resolves publish dependencies
        final ResolvePublishDependenciesParams resolveParams = ResolvePublishDependenciesParams.create()
            .contentIds( requestedContentIds )
            .excludedContentIds( excludeContentIds )
            .excludeChildrenIds( excludeChildrenIds )
            .build();
        final CompareContentResults compareResults = contentService.resolvePublishDependencies( resolveParams );

        //Resolved the dependent ContentPublishItem
        final List<ContentId> contentIds = compareResults.contentIds()
            .stream()
            .filter( contentId -> !requestedContentIds.contains( contentId ) )
            .collect( Collectors.toList() );
        final ContentIds dependentContentIds = ContentIds.from( contentIds );

        final ContentIds fullPublishList = ContentIds.create().addAll( dependentContentIds ).addAll( requestedContentIds ).build();

        //Resolve required ids
        final ContentIds requiredIds = this.contentService.resolveRequiredDependencies(
            ResolveRequiredDependenciesParams.create().contentIds( fullPublishList ).build() );

        final AuthenticationInfo authInfo = ContextAccessor.current().getAuthInfo();

        final Predicate<ContentId> publishNotAllowedCondition = id -> !this.contentService.getById( id ).getPermissions()
            .isAllowedFor( ContextAccessor.current().getAuthInfo().getPrincipals(), Permission.PUBLISH );

        //Get all outbound dependencies for current requested and required
        final OutboundDependenciesIds outboundDependenciesIds = this.getOutboundDependenciesIds( fullPublishList );

        //check if user has access to publish every content
        final ContentIds notPublishableContentIds = authInfo.hasRole( RoleKeys.ADMIN )
            ? ContentIds.empty()
            : ContentIds.from( fullPublishList.stream().filter( publishNotAllowedCondition ).collect( Collectors.toList() ) );

        //check that not all contents are pending delete
        final Boolean isSomePublishable = fullPublishList.getSize() > 0;

        //filter required dependant ids
        final ContentIds requiredDependantIds = ContentIds.from(
            requiredIds.stream().filter( contentId -> !requestedContentIds.contains( contentId ) ).collect( Collectors.toList() ) );

        // Check out content validity
        final ContentValidityResult contentValidity =
            this.contentService.getContentValidity( ContentValidityParams.create().contentIds( fullPublishList ).build() );

        final ContentIds problematicContentIds = contentValidity.getAllProblematicContentIds();
        final ContentIds notValidContentIds = contentValidity.getNotValidContentIds();
        final ContentIds notReadyContentIds = contentValidity.getNotReadyContentIds();

        //sort all dependant content ids
        final ContentIds sortedDependentContentIds = sortContentIds( dependentContentIds, "_path" );

        // Sort all content ids with problems
        final ContentIds sortedProblematicContentIds = sortContentIds( problematicContentIds, "_path" );

        //Returns the JSON result
        return ResolvePublishContentResultJson.create()
            .setRequestedContents( requestedContentIds )
            .setDependentContents(
                this.problematicDependantsOnTop( sortedDependentContentIds, requestedContentIds, sortedProblematicContentIds ) )
            .setRequiredContents( requiredDependantIds )
            .setNotPublishableContents( notPublishableContentIds )
            .setSomePublishable( isSomePublishable )
            .setContainsInvalid( !notValidContentIds.isEmpty() )
            .setInvalidContents( notValidContentIds )
            .setContainsNotReady( !notReadyContentIds.isEmpty() )
            .setNotReadyContents( notReadyContentIds )
            .setNextDependentContents( outboundDependenciesIds.getExistingOutboundIds() )
            .setNotFoundOutboundContents( outboundDependenciesIds.getNonExistingOutboundIds() )
            .build();
    }

    private OutboundDependenciesIds getOutboundDependenciesIds( final ContentIds contentIds )
    {
        final ContentIds allOutboundIds = ContentIds.from( contentIds.stream().map( id -> {
            try
            {
                return this.contentService.getOutboundDependencies( id );
            }
            catch ( ContentNotFoundException e )
            {
                return ContentIds.empty();
            }
        } ).flatMap( ContentIds::stream ).filter( id -> !contentIds.contains( id ) ).collect( Collectors.toList() ) );

        final ContentIds existingOutboundIds = sortContentIds( allOutboundIds, "_path" );
        final ContentIds nonExistingOutboundIds =
            ContentIds.from( allOutboundIds.stream().filter( id -> !existingOutboundIds.contains( id ) )
            .collect( Collectors.toList() ) );

        final CompareContentResults compareResults =
            contentService.compare( CompareContentsParams.create().contentIds( existingOutboundIds ).build() );

        final ContentIds existingWithoutMoved = ContentIds.from( compareResults.stream()
                                    .filter( result -> result.getCompareStatus() != CompareStatus.EQUAL )
                                    .map( CompareContentResult::getContentId )
                                    .collect( Collectors.toList() ) );

        return new OutboundDependenciesIds( existingWithoutMoved, nonExistingOutboundIds );
    }

    private ContentIds sortContentIds( final ContentIds contentIds, final String field )
    {
        if ( contentIds.isEmpty() || nullToEmpty( field ).isBlank() )
        {
            return contentIds;
        }

        return this.contentService.find(
                ContentQuery.create().filterContentIds( contentIds ).queryExpr( QueryParser.parse( "order by " + field ) ).size( -1 ).build() )
            .getContentIds();
    }

    private ContentIds problematicDependantsOnTop( final ContentIds dependentContentIdList, final ContentIds requestedContentIds,
                                                   final ContentIds problematicContentIds )
    {
        return ContentIds.from( Stream.concat( problematicContentIds.stream().filter( ( e ) -> !requestedContentIds.contains( e ) ),
                                               dependentContentIdList.stream()
                                                   .filter( ( e ) -> !problematicContentIds.contains( e ) &&
                                                       !requestedContentIds.contains( e ) ) ).collect( Collectors.toList() ) );
    }

    @POST
    @Path("applyPermissions")
    public TaskResultJson applyPermissions( final ApplyContentPermissionsJson jsonParams )
    {
        return ApplyPermissionsRunnableTask.create()
            .params( jsonParams.toParams() )
            .description( "Apply content permissions" )
            .taskService( taskService )
            .contentService( contentService )
            .build()
            .createTaskResult();
    }

    @GET
    @Path("rootPermissions")
    public RootPermissionsJson getRootPermissions()
    {
        final AccessControlList rootPermissions = ContextBuilder.from( ContextAccessor.current() )
            .authInfo( AuthenticationInfo.copyOf( ContextAccessor.current().getAuthInfo() ).principals( RoleKeys.ADMIN ).build() )
            .build()
            .callWith( contentService::getRootPermissions );

        return new RootPermissionsJson( rootPermissions, principalsResolver );
    }

    @POST
    @Path("setChildOrder")
    public ContentJson setChildOrder( final SetChildOrderJson params, @Context HttpServletRequest request )
    {
        final Content updatedContent = this.contentService.setChildOrder( SetContentChildOrderParams.create()
                                                                              .childOrder( params.getChildOrder().getChildOrder() )
                                                                              .contentId( ContentId.from( params.getContentId() ) )
                                                                              .build() );
        return jsonObjectsFactory.createContentJson( updatedContent, request );
    }

    @POST
    @Path("reorderChildren")
    public ReorderChildrenResultJson reorderChildContents( final ReorderChildrenJson params )
    {
        Content content = this.contentService.getById( ContentId.from( params.getContentId() ) );

        //If a initial sort is required before the manual reordering
        if ( params.getChildOrder() != null && !params.getChildOrder().getChildOrder().equals( content.getChildOrder() ) )
        {
            content = this.contentService.setChildOrder( SetContentChildOrderParams.create()
                                                             .childOrder( params.getChildOrder().getChildOrder() )
                                                             .contentId( ContentId.from( params.getContentId() ) )
                                                             .build() );
        }

        //If the content is not already manually ordered, sets it to manually ordered
        if ( !content.getChildOrder().isManualOrder() )
        {
            if ( params.isManualOrder() )
            {

                this.contentService.setChildOrder( SetContentChildOrderParams.create()
                                                       .childOrder( ChildOrder.manualOrder() )
                                                       .contentId( ContentId.from( params.getContentId() ) )
                                                       .build() );
            }
            else
            {
                throw new WebApplicationException(
                    String.format( "Not allowed to reorder children manually, current parentOrder = [%s].", content.getChildOrder() ),
                    Response.Status.BAD_REQUEST );
            }
        }

        //Applies the manual movements
        final ReorderChildContentsParams.Builder builder =
            ReorderChildContentsParams.create().contentId( ContentId.from( params.getContentId() ) );

        for ( final ReorderChildJson reorderChildJson : params.getReorderChildren() )
        {
            final String moveBefore = reorderChildJson.getMoveBefore();
            builder.add( ReorderChildParams.create()
                             .contentToMove( ContentId.from( reorderChildJson.getContentId() ) )
                             .contentToMoveBefore( nullToEmpty( moveBefore ).isBlank() ? null : ContentId.from( moveBefore ) )
                             .build() );
        }

        final ReorderChildContentsResult result = this.contentService.reorderChildren( builder.build() );

        return new ReorderChildrenResultJson( result );
    }

    @GET
    public ContentIdJson getById( @QueryParam("id") final String idParam, @QueryParam("versionId") final String versionIdParam,
                                  @QueryParam("expand") @DefaultValue(EXPAND_FULL) final String expandParam,
                                  @Context HttpServletRequest request )
    {

        final ContentId id = ContentId.from( idParam );
        Content content;
        if ( versionIdParam == null )
        {
            content = contentService.getById( id );
        }
        else
        {
            final ContentVersionId versionId = ContentVersionId.from( versionIdParam );
            content = contentService.getByIdAndVersionId( id, versionId );
        }

        if ( content == null )
        {
            throw new WebApplicationException( String.format( "Content [%s] was not found", idParam ), Response.Status.NOT_FOUND );
        }
        else if ( EXPAND_NONE.equalsIgnoreCase( expandParam ) )
        {
            return new ContentIdJson( id );
        }
        else if ( EXPAND_SUMMARY.equalsIgnoreCase( expandParam ) )
        {
            return jsonObjectsFactory.createContentSummaryJson( content, request );
        }
        else
        {
            return jsonObjectsFactory.createContentJson( content, request );
        }
    }

    @POST
    @Path("resolveByIds")
    public ContentListJson<ContentSummaryJson> getByIds( final ContentIdsJson params, @Context HttpServletRequest request )
    {
        final Contents contents = contentService.getByIds( new GetContentByIdsParams( params.getContentIds() ) );

        final ContentListMetaData metaData =
            ContentListMetaData.create().totalHits( contents.getSize() ).hits( contents.getSize() ).build();

        return new ContentListJson<>( contents, metaData, c -> jsonObjectsFactory.createContentSummaryJson(c, request) );
    }

    @POST
    @Path("isReadOnlyContent")
    public List<String> checkContentsReadOnly( final ContentIdsJson params )
    {
        final Contents contents = contentService.getByIds( new GetContentByIdsParams( params.getContentIds() ) );

        final AuthenticationInfo authInfo = ContextAccessor.current().getAuthInfo();

        if ( authInfo.hasRole( RoleKeys.ADMIN ) )
        {
            return new ArrayList<>();
        }

        final List<String> result = new ArrayList<>();

        contents.stream().forEach( content -> {
            if ( !content.getPermissions().isAllowedFor( authInfo.getPrincipals(), Permission.MODIFY ) )
            {
                result.add( content.getId().toString() );
            }
        } );

        return result;
    }

    @GET
    @Path("bypath")
    public ContentIdJson getByPath( @QueryParam("path") final String pathParam,
                                    @QueryParam("expand") @DefaultValue(EXPAND_FULL) final String expandParam,
                                    @Context HttpServletRequest request )
    {
        final Content content = contentService.getByPath( ContentPath.from( pathParam ) );

        if ( content == null )
        {
            throw new WebApplicationException( String.format( "Content [%s] was not found", pathParam ), Response.Status.NOT_FOUND );
        }
        else if ( EXPAND_NONE.equalsIgnoreCase( expandParam ) )
        {
            return new ContentIdJson( content.getId() );
        }
        else if ( EXPAND_SUMMARY.equalsIgnoreCase( expandParam ) )
        {
            return jsonObjectsFactory.createContentSummaryJson( content, request );
        }
        else
        {
            return jsonObjectsFactory.createContentJson( content, request );
        }
    }

    @GET
    @Path("contentPermissions")
    public RootPermissionsJson getPermissionsById( @QueryParam("id") final String contentId )
    {
        final AccessControlList permissions = contentService.getById( ContentId.from( contentId ) ).getPermissions();
        return new RootPermissionsJson( permissions, principalsResolver );
    }

    @POST
    @Path("contentPermissionsByIds")
    public List<ContentPermissionsJson> getPermissionsByIds( final ContentIdsJson params )
    {
        final List<ContentPermissionsJson> result = new ArrayList<>();
        for ( final ContentId contentId : params.getContentIds() )
        {
            final AccessControlList permissions = contentService.getById( contentId ).getPermissions();
            result.add( new ContentPermissionsJson( contentId.toString(), permissions, principalsResolver ) );
        }

        return result;
    }

    @POST
    @Path("contentsExist")
    public ContentsExistJson contentsExist( final ContentIdsJson params )
    {
        final ContentsExistJson result = new ContentsExistJson();
        for ( final ContentId contentId : params.getContentIds() )
        {
            result.add( contentId, contentService.contentExists( contentId ) );
        }

        return result;
    }

    @POST
    @Path("contentsExistByPath")
    public ContentsExistByPathJson contentsExistByPath( final ContentPathsJson params )
    {
        final ContentsExistByPathJson result = new ContentsExistByPathJson();
        for ( final ContentPath contentPath : params.getContentPaths() )
        {
            result.add( contentPath, contentService.contentExists( contentPath ) );
        }

        return result;
    }

    @POST
    @Path("allowedActions")
    public List<String> getPermittedActions( final ContentIdsPermissionsJson params )
    {
        final List<Permission> permissions =
            params.getPermissions().size() > 0 ? params.getPermissions() : Arrays.asList( Permission.values() );

        final AuthenticationInfo authInfo = ContextAccessor.current().getAuthInfo();

        if ( authInfo.hasRole( RoleKeys.ADMIN ) )
        {
            return permissions.stream().map( Enum::name ).collect( Collectors.toList() );
        }

        final List<AccessControlList> contentsPermissions =
            params.getContentIds().getSize() > 0 ? contentService.getByIds( new GetContentByIdsParams( params.getContentIds() ) )
                .stream()
                .map( Content::getPermissions )
                .collect( Collectors.toList() ) : Collections.singletonList( contentService.getRootPermissions() );

        final List<String> result = new ArrayList<>();

        permissions.forEach( permission -> {
            if ( userHasPermission( authInfo, permission, contentsPermissions ) )
            {
                result.add( permission.name() );
            }
        } );

        return result;
    }

    private boolean userHasPermission( final AuthenticationInfo authInfo, final Permission permission,
                                       final List<AccessControlList> contentsPermissions )
    {
        final PrincipalKeys authInfoPrincipals = authInfo.getPrincipals();

        return contentsPermissions.stream()
            .allMatch( contentPermissions -> contentPermissions.isAllowedFor( authInfoPrincipals, permission ) );
    }

    @POST
    @Path("nearestSite")
    @Consumes(MediaType.APPLICATION_JSON)
    public ContentJson getNearest( final GetNearestSiteJson params, @Context HttpServletRequest request )
    {
        final ContentId contentId = params.getGetNearestSiteByContentId();
        final Content nearestSite = this.contentService.getNearestSite( contentId );
        if ( nearestSite != null )
        {
            return jsonObjectsFactory.createContentJson( nearestSite, request );
        }
        else
        {
            return null;
        }
    }

    @GET
    @Path("list")
    public ContentListJson<?> listById( @QueryParam("parentId") @DefaultValue("") final String parentIdParam,
                                        @QueryParam("expand") @DefaultValue(EXPAND_SUMMARY) final String expandParam,
                                        @QueryParam("from") @DefaultValue(DEFAULT_FROM_PARAM) final Integer fromParam,
                                        @QueryParam("size") @DefaultValue(DEFAULT_SIZE_PARAM) final Integer sizeParam,
                                        @QueryParam("childOrder") @DefaultValue("") final String childOrder,
                                        @Context HttpServletRequest request)
    {
        final FindContentByParentParams params = FindContentByParentParams.create()
            .from( fromParam )
            .size( sizeParam )
            .parentId( isNullOrEmpty( parentIdParam ) ? null : ContentId.from( parentIdParam ) )
            .childOrder( ChildOrder.from( childOrder ) )
            .build();

        return doGetByParent( expandParam, params, request );
    }

    @POST
    @Path("batch")
    public ContentListJson<ContentSummaryJson> listBatched( final BatchContentJson json, @Context HttpServletRequest request )
    {
        final ContentPaths contentsToBatch = ContentPaths.from( json.getContentPaths() );

        final Contents contents = contentService.getByPaths( contentsToBatch );

        final ContentListMetaData metaData =
            ContentListMetaData.create().totalHits( contents.getSize() ).hits( contents.getSize() ).build();

        return new ContentListJson<>( contents, metaData, c -> jsonObjectsFactory.createContentSummaryJson(c, request) );
    }

    private ContentListJson<?> doGetByParent( final String expandParam, final FindContentByParentParams params,
                                              final HttpServletRequest request )
    {
        final FindContentByParentResult result = contentService.findByParent( params );

        final ContentListMetaData metaData =
            ContentListMetaData.create().totalHits( result.getTotalHits() ).hits( result.getHits() ).build();

        if ( EXPAND_NONE.equalsIgnoreCase( expandParam ) )
        {
            return new ContentListJson<>( result.getContents(), metaData, content -> new ContentIdJson( content.getId() ) );
        }
        else if ( EXPAND_FULL.equalsIgnoreCase( expandParam ) )
        {
            return new ContentListJson<>( result.getContents(), metaData, c -> jsonObjectsFactory.createContentJson( c, request ) );
        }
        else
        {
            return new ContentListJson<>( result.getContents(), metaData, c -> jsonObjectsFactory.createContentSummaryJson( c, request ) );
        }
    }

    @POST
    @Path("getDescendantsOfContents")
    public List<ContentIdJson> getDescendantsOfContents( final GetDescendantsOfContents json )
    {
        final ContentPaths contentsPaths = ContentPaths.from( json.getContentPaths() );

        FindContentIdsByQueryResult result = ContentQueryWithChildren.create()
            .contentService( this.contentService )
            .contentsPaths( contentsPaths )
            .size( GET_ALL_SIZE_FLAG )
            .build()
            .find();

        final boolean isFilterNeeded = json.getFilterStatuses() != null && json.getFilterStatuses().size() > 0;

        if ( isFilterNeeded )
        {
            return this.filterIdsByStatus( result.getContentIds(), json.getFilterStatuses() )
                .map( ContentIdJson::new )
                .collect( Collectors.toList() );
        }
        else
        {
            return result.getContentIds().stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        }
    }

    @POST
    @Path("resolveForUnpublish")
    public ContentWithRefsResultJson resolveForUnpublish( final ContentIdsJson params )
    {
        return ContextBuilder.from( ContextAccessor.current() )
            .attribute( "ignorePublishTimes", Boolean.TRUE )
            .branch( ContentConstants.BRANCH_MASTER )
            .build()
            .callWith( () -> doResolveReferences( params.getContentIds() ) );
    }

    @POST
    @Path("resolveForDelete")
    public ContentWithRefsResultJson resolveForDelete( final ContentIdsJson params )
    {
        return doResolveReferences( params.getContentIds() );
    }

    private ContentWithRefsResultJson doResolveReferences( final ContentIds contentIds )
    {
        final Contents parents = contentService.getByIds( new GetContentByIdsParams( contentIds ) );

        final FindContentIdsByQueryResult children = ContentQueryWithChildren.create()
            .contentService( this.contentService )
            .contentsPaths( parents.getPaths() )
            .size( GET_ALL_SIZE_FLAG )
            .build()
            .find();

        final List<ContentId> idsToRemove = Stream.concat( parents.getIds().stream(), children.getContentIds()
            .stream()
            .filter( id -> !parents.getIds().contains( id ) ) ).collect( Collectors.toList() );

        final List<String> idsToRemoveAsStrings = idsToRemove.stream().map( ContentId::toString ).collect( Collectors.toList() );

        final BooleanFilter inboundDependenciesFilter = BooleanFilter.create()
            .must( BooleanFilter.create()
                       .should( IdFilter.create()
                                    .fieldName( ContentIndexPath.REFERENCES.getPath() )
                                    .values( idsToRemoveAsStrings )
                                    .build() )
                       .build() )
            .mustNot( IdFilter.create().fieldName( ContentIndexPath.ID.getPath() ).values( idsToRemoveAsStrings ).build() )
            .build();

        final ContentIds inboundDependencies = this.contentService.find(
            ContentQuery.create().queryFilter( inboundDependenciesFilter ).size( GET_ALL_SIZE_FLAG ).build() ).getContentIds();

        final Map<ContentId, Set<ContentId>> map = new HashMap<>();

        inboundDependencies.forEach( inboundDependencyId -> {
            final ContentIds outboundRefs = contentService.getOutboundDependencies( inboundDependencyId );
            final Set<ContentId> referencedIds =
                outboundRefs.stream().filter( idsToRemove::contains ).collect( Collectors.toSet() );

            referencedIds.forEach( referencedId -> {
                final Set<ContentId> inbounds = map.computeIfAbsent( referencedId, ( id ) -> new HashSet() );
                inbounds.add( inboundDependencyId );
            } );

        } );

        return ContentWithRefsResultJson.create()
            .addContentIds( idsToRemove )
            .addInboundDependencies( map.entrySet()
                                         .stream()
                                         .map( entry -> ContentWithRefsResultJson.InboundDependenciesJson.create()
                                             .id( entry.getKey() )
                                             .addInboundDependencies( entry.getValue() )
                                             .build() )
                                         .collect( Collectors.toList() ) )
            .build();
    }

    private Stream<ContentId> filterIdsByStatus( final ContentIds ids, final Collection<CompareStatus> statuses )
    {
        final CompareContentResults compareResults =
            contentService.compare( CompareContentsParams.create().contentIds( ids ).build() );
        final Map<ContentId, CompareContentResult> compareResultMap = compareResults.getCompareContentResultsMap();

        return compareResultMap.entrySet()
            .stream()
            .filter( entry -> statuses.contains( entry.getValue().getCompareStatus() ) )
            .map( Map.Entry::getKey );
    }

    @POST
    @Path("countContentsWithDescendants")
    public long countContentsWithDescendants( final GetDescendantsOfContents json )
    {
        final ContentPaths paths = ContentPaths.from( json.getContentPaths() );
        List<ContentPath> filteredPaths =
            paths.stream().filter( contentPath -> paths.stream().noneMatch( contentPath::isChildOf ) ).collect( Collectors.toList() );
        return this.countContentsAndTheirChildren( ContentPaths.from( filteredPaths ) );
    }

    @POST
    @Path("query")
    @Consumes(MediaType.APPLICATION_JSON)
    public AbstractContentQueryResultJson query( final ContentQueryJson contentQueryJson, @Context HttpServletRequest request )
    {
        final ContentQueryJsonToContentQueryConverter selectorQueryProcessor = ContentQueryJsonToContentQueryConverter.create()
            .contentQueryJson( contentQueryJson )
            .contentService( this.contentService )
            .build();

        final ContentQuery contentQuery = selectorQueryProcessor.createQuery();

        if ( contentQuery == null )
        {
            return FindContentByQuertResultJsonFactory.create().expand( contentQueryJson.getExpand() ).build().execute();
        }

        final boolean isMasterQuery = ContentConstants.BRANCH_MASTER.equals( contentQueryJson.getBranch() );

        final Branch branch = isMasterQuery ? ContentConstants.BRANCH_MASTER : ContentConstants.BRANCH_DRAFT;

        return ContextBuilder.from( ContextAccessor.current() ).branch( branch ).build().callWith( () -> {
            final FindContentIdsByQueryResult findResult = contentService.find( contentQuery );
            final Contents contents = contentService.getByIds( new GetContentByIdsParams( findResult.getContentIds() ) );

            return FindContentByQuertResultJsonFactory.create()
                .contents( contents )
                .aggregations( findResult.getAggregations() )
                .jsonObjectsFactory( jsonObjectsFactory )
                .request( request )
                .expand( contentQueryJson.getExpand() )
                .hits( findResult.getHits() )
                .totalHits( findResult.getTotalHits() )
                .build()
                .execute();
        } );
    }

    @GET
    @Path("findVariants")
    public ContentListJson<ContentSummaryJson> findVariants( @QueryParam("id") final String id,
                                                             @QueryParam("from") @DefaultValue(value = "0") final Integer fromParam,
                                                             @QueryParam("size") @DefaultValue(value = "10") final Integer sizeParam,
                                                             @Context HttpServletRequest request )
    {
        final QueryExpr queryExpr =
            QueryExpr.from( CompareExpr.eq( FieldExpr.from( "variantOf" ), ValueExpr.string( Objects.requireNonNull( id ) ) ),
                            new FieldOrderExpr( FieldExpr.from( "modifiedTime" ), OrderExpr.Direction.DESC ) );

        final FindContentIdsByQueryResult queryResult =
            contentService.find( ContentQuery.create().queryExpr( queryExpr ).size( sizeParam ).from( fromParam ).build() );

        final Contents contents = contentService.getByIds( new GetContentByIdsParams( queryResult.getContentIds() ) );

        final ContentListMetaData metaData =
            ContentListMetaData.create().totalHits( contents.getSize() ).hits( contents.getSize() ).build();

        return new ContentListJson<>( contents, metaData, c -> jsonObjectsFactory.createContentSummaryJson(c, request) );
    }

    @POST
    @Path("selectorQuery")
    @Consumes(MediaType.APPLICATION_JSON)
    public AbstractContentQueryResultJson selectorQuery( final ContentSelectorQueryJson contentQueryJson,
                                                         @Context HttpServletRequest request )
    {
        FindContentIdsByQueryResult findResult;
        try
        {
            findResult = findContentsBySelectorQuery( contentQueryJson );
        }
        catch ( IndexException e )
        {
            throw Exceptions.newRuntime( "Failed to find contents" ).withCause( e );
        }

        return FindContentByQuertResultJsonFactory.create()
            .contents( this.contentService.getByIds( new GetContentByIdsParams( findResult.getContentIds() ) ) )
            .aggregations( findResult.getAggregations() )
            .jsonObjectsFactory( jsonObjectsFactory )
            .request( request )
            .expand( contentQueryJson.getExpand() )
            .hits( findResult.getHits() )
            .totalHits( findResult.getTotalHits() )
            .build()
            .execute();
    }

    @POST
    @Path("treeSelectorQuery")
    @Consumes(MediaType.APPLICATION_JSON)
    public ContentTreeSelectorListJson treeSelectorQuery( final ContentTreeSelectorQueryJson contentQueryJson,
                                                          @Context HttpServletRequest request )
    {
        final Integer from = contentQueryJson.getFrom();
        contentQueryJson.setFrom( 0 );

        final Integer size = contentQueryJson.getSize();
        contentQueryJson.setSize( -1 );

        final ContentPaths targetContentPaths = findContentPathsBySelectorQuery( contentQueryJson );

        final ContentPath parentPath = contentQueryJson.getParentPath();
        final int parentPathSize = parentPath != null ? parentPath.elementCount() : 0;

        final Set<ContentPath> layerPaths = targetContentPaths.stream()
            .filter( path -> parentPath == null || path.isChildOf( parentPath ) )
            .map( path -> path.getAncestorPath( path.elementCount() - parentPathSize - 1 ) )
            .collect( Collectors.toSet() );

        if ( layerPaths.isEmpty() )
        {
            return ContentTreeSelectorListJson.empty();
        }

        final ChildOrder layerOrder = parentPath == null
            ? ContentConstants.DEFAULT_CONTENT_REPO_ROOT_ORDER
            : contentQueryJson.getChildOrder() != null ? contentQueryJson.getChildOrder() : ContentConstants.DEFAULT_CHILD_ORDER;

        final FindContentByParentResult findLayerContentsResult = contentService.findByParent( FindContentByParentParams.create()
                                                                                                   .parentPath( parentPath != null
                                                                                                                    ? parentPath
                                                                                                                    : ContentPath.from(
                                                                                                                        "/" ) )
                                                                                                   .childOrder( layerOrder )
                                                                                                   .size( -1 )
                                                                                                   .build() );

        final List<Content> layersContents = findLayerContentsResult.getContents()
            .stream()
            .filter( content -> layerPaths.contains( content.getPath() ) )
            .collect( Collectors.toList() );

        final List<ContentTreeSelectorJson> resultItems = layersContents.stream()
            .map( content -> new ContentTreeSelectorJson( jsonObjectsFactory.createContentJson( content, request ),
                                                          targetContentPaths.contains( content.getPath() ), targetContentPaths.stream()
                                                              .anyMatch( path -> path.isChildOf( content.getPath() ) ) ) )
            .collect( Collectors.toList() );

        final ContentListMetaData metaData = ContentListMetaData.create()
            .hits( findLayerContentsResult.getHits() )
            .totalHits( findLayerContentsResult.getTotalHits() )
            .build();

        return new ContentTreeSelectorListJson( resultItems, metaData );
    }

    private FindContentIdsByQueryResult findContentsBySelectorQuery( final ContentSelectorQueryJson contentQueryJson )
    {
        return contentService.find( makeConverterFromSelectorQuery( contentQueryJson ).createQuery() );
    }

    private ContentPaths findContentPathsBySelectorQuery( final ContentSelectorQueryJson contentQueryJson )
    {
        return contentService.findPaths( makeConverterFromSelectorQuery( contentQueryJson ).createQuery() ).getContentPaths();
    }

    private ContentSelectorQueryJsonToContentQueryConverter makeConverterFromSelectorQuery(
        final ContentSelectorQueryJson contentQueryJson )
    {
        return ContentSelectorQueryJsonToContentQueryConverter.create()
            .contentQueryJson( contentQueryJson )
            .contentService( this.contentService )
            .contentTypeService( this.contentTypeService )
            .relationshipTypeService( this.relationshipTypeService )
            .contentTypeParseMode( this.contentTypeParseMode )
            .build();
    }

    @POST
    @Path("compare")
    public CompareContentResultsJson compare( final CompareContentsJson params )
    {
        final ContentIds contentIds = ContentIds.from( params.getIds() );
        final CompareContentResults compareResults =
            contentService.compare( CompareContentsParams.create().contentIds( contentIds ).build() );
        final GetPublishStatusesResult getPublishStatusesResult =
            contentService.getPublishStatuses( GetPublishStatusesParams.create().contentIds( contentIds ).build() );
        return new CompareContentResultsJson( compareResults, getPublishStatusesResult );
    }

    @POST
    @Path("getVersions")
    public GetContentVersionsResultJson getContentVersions( final GetContentVersionsJson params )
    {
        final ContentId contentId = ContentId.from( params.getContentId() );
        final int from = params.getFrom() != null ? params.getFrom() : 0;
        final int size = params.getSize() != null ? params.getSize() : 10;
        final FindContentVersionsCommand contentVersionsCommand = new FindContentVersionsCommand( nodeService );
        final FindContentVersionsResult result = contentVersionsCommand.getContentVersions( contentId, from, size );

        return new GetContentVersionsResultJson( result, this.principalsResolver );
    }

    @GET
    @Path("getActiveVersions")
    public GetActiveContentVersionsResultJson getActiveVersions( @QueryParam("id") final String id )
    {
        final ContentId contentId = ContentId.from( id );
        final Branches branches = Branches.from( ContentConstants.BRANCH_DRAFT, ContentConstants.BRANCH_MASTER );
        final GetActiveContentVersionsCommand activeContentVersionsCommand = new GetActiveContentVersionsCommand( nodeService );
        final GetActiveContentVersionsResult activeVersions = activeContentVersionsCommand.getActiveVersions( contentId, branches );

        return new GetActiveContentVersionsResultJson( activeVersions, this.principalsResolver );
    }

    @POST
    @Path("getVersionsForView")
    public GetContentVersionsForViewResultJson getContentVersionsForView( final GetContentVersionsJson params )
    {
        final ContentId contentId = ContentId.from( params.getContentId() );
        final int from = params.getFrom() != null ? params.getFrom() : 0;
        final int size = params.getSize() != null ? params.getSize() : 50;
        final FindContentVersionsCommand contentVersionsCommand = new FindContentVersionsCommand( nodeService );
        final FindContentVersionsResult allVersions = contentVersionsCommand.getContentVersions( contentId, from, size );

        final GetActiveContentVersionsCommand activeContentVersionsCommand = new GetActiveContentVersionsCommand( nodeService );
        final Branches branches = Branches.from( ContentConstants.BRANCH_DRAFT, ContentConstants.BRANCH_MASTER );
        final GetActiveContentVersionsResult activeVersions = activeContentVersionsCommand.getActiveVersions( contentId, branches );

        return new GetContentVersionsForViewResultJson( allVersions, activeVersions, this.principalsResolver );
    }

    @GET
    @Path("getAttachments")
    public List<AttachmentJson> getAttachments( @QueryParam("id") final String idParam )
    {
        final ContentId id = ContentId.from( idParam );
        final Content content = contentService.getById( id );

        return AttachmentListJson.toJson( content.getAttachments() );
    }

    @GET
    @Path("locales")
    public LocaleListJson getLocales( @QueryParam("query") final String query )
    {
        Locale[] locales = Locale.getAvailableLocales();
        if ( !nullToEmpty( query ).isBlank() )
        {
            String trimmedQuery = query.trim().toLowerCase();
            locales = Arrays.stream( locales )
                .filter( locale -> nullToEmpty( locale.toLanguageTag() ).toLowerCase().contains( trimmedQuery ) ||
                    nullToEmpty( locale.getDisplayName( locale ) ).toLowerCase().contains( trimmedQuery ) ||
                    nullToEmpty( locale.getLanguage() ).toLowerCase().contains( trimmedQuery ) ||
                    nullToEmpty( locale.getDisplayLanguage( locale ) ).toLowerCase().contains( trimmedQuery ) ||
                    nullToEmpty( locale.getVariant() ).toLowerCase().contains( trimmedQuery ) ||
                    nullToEmpty( locale.getDisplayVariant( locale ) ).toLowerCase().contains( trimmedQuery ) ||
                    nullToEmpty( locale.getCountry() ).toLowerCase().contains( trimmedQuery ) ||
                    nullToEmpty( locale.getDisplayCountry( locale ) ).toLowerCase().contains( trimmedQuery ) ||
                    nullToEmpty( getFormattedDisplayName( locale ) ).toLowerCase().contains( trimmedQuery ) &&
                        !isNullOrEmpty( locale.toLanguageTag() ) && !isNullOrEmpty( locale.getDisplayName() ) )
                .toArray( Locale[]::new );
        }
        else
        {
            locales = Arrays.stream( locales )
                .filter( ( locale ) -> !isNullOrEmpty( locale.toLanguageTag() ) && !isNullOrEmpty( locale.getDisplayName() ) )
                .toArray( Locale[]::new );
        }
        return new LocaleListJson( locales );
    }

    @GET
    @Path("effectivePermissions")
    public List<EffectivePermissionJson> getEffectivePermissions( @QueryParam("id") final String idParam )
    {
        final ContentId id = ContentId.from( idParam );
        final AccessControlList acl = contentService.getById( id ).getPermissions();

        final Multimap<Access, PrincipalKey> accessMembers = ArrayListMultimap.create();
        for ( AccessControlEntry ace : acl )
        {
            final Access access = Access.fromPermissions( ace.getAllowedPermissions() );
            accessMembers.put( access, ace.getPrincipal() );
        }

        final Map<Access, Integer> accessCount = new HashMap<>();
        final Map<Access, List<Principal>> accessPrincipals = new HashMap<>();

        final UserMembersResolver resolver = new UserMembersResolver( this.securityService );
        for ( Access access : Access.values() )
        {
            final Set<PrincipalKey> resolvedMembers = new HashSet<>();
            final Collection<PrincipalKey> permissionPrincipals = accessMembers.get( access );
            if ( permissionPrincipals.contains( RoleKeys.EVERYONE ) )
            {
                final PrincipalQueryResult totalUsersResult = this.getTotalUsers();
                accessCount.put( access, totalUsersResult.getTotalSize() );
                accessPrincipals.put( access, totalUsersResult.getPrincipals().getList() );
                continue;
            }

            for ( PrincipalKey principal : permissionPrincipals )
            {
                if ( principal.isUser() )
                {
                    resolvedMembers.add( principal );
                }
                else
                {
                    final PrincipalKeys members = resolver.getUserMembers( principal );
                    resolvedMembers.addAll( members.getSet() );
                }
            }

            accessCount.put( access, toIntExact( resolvedMembers.stream().filter( PrincipalKey::isUser ).count() ) );
            final List<Principal> principals = resolvedMembers.stream()
                .filter( PrincipalKey::isUser )
                .map( ( key ) -> this.securityService.getUser( key ).orElse( null ) )
                .filter( Objects::nonNull )
                .limit( MAX_EFFECTIVE_PERMISSIONS_PRINCIPALS )
                .collect( Collectors.toList() );
            accessPrincipals.put( access, principals );
        }

        final List<EffectivePermissionJson> permissionsJson = new ArrayList<>();
        for ( Access access : Access.values() )
        {
            final EffectivePermissionAccessJson accessJson = new EffectivePermissionAccessJson();
            accessJson.count = accessCount.get( access );
            accessJson.users = accessPrincipals.get( access )
                .stream()
                .map( ( p ) -> new EffectivePermissionMemberJson( p.getKey().toString(), p.getDisplayName() ) )
                .toArray( EffectivePermissionMemberJson[]::new );

            permissionsJson.add( new EffectivePermissionJson( access.name(), accessJson ) );
        }
        return permissionsJson;
    }

    @GET
    @Path("listIds")
    public List<ContentIdJson> listChildrenIds( @QueryParam("parentId") final String parentId,
                                                @QueryParam("childOrder") @DefaultValue("") final String childOrder )
    {

        final FindContentByParentParams params = FindContentByParentParams.create()
            .parentId( isNullOrEmpty( parentId ) ? null : ContentId.from( parentId ) )
            .childOrder( isNullOrEmpty( childOrder ) ? null : ChildOrder.from( childOrder ) )
            .build();

        final FindContentIdsByParentResult result = this.contentService.findIdsByParent( params );
        return result.getContentIds().stream().map( ContentIdJson::new ).collect( Collectors.toList() );
    }

    @POST
    @Path("revert")
    public ContentVersionJson revert( final RevertContentJson params )
    {
        final ContentVersionId contentVersionId = ContentVersionId.from( params.getVersionId() );

        final Content versionedContent = contentService.getByIdAndVersionId( ContentId.from( params.getContentId() ), contentVersionId );

        if ( versionedContent == null )
        {
            throw new WebApplicationException(
                String.format( "Content with contentKey [%s] and versionId [%s] not found", params.getContentId(), params.getVersionId() ),
                Response.Status.NOT_FOUND );
        }

        final Content currentContent = contentService.getById( ContentId.from( params.getContentId() ) );

        if ( !currentContent.getChildOrder().equals( versionedContent.getChildOrder() ) )
        {
            contentService.setChildOrder( SetContentChildOrderParams.create()
                                              .contentId( currentContent.getId() )
                                              .childOrder( versionedContent.getChildOrder() )
                                              .build() );
        }

        final Content revertedContent = contentService.update( prepareUpdateContentParams( versionedContent, contentVersionId ) );

        final ContentVersion contentVersion = contentService.getActiveVersions( GetActiveContentVersionsParams.create()
                                                                                    .branches(
                                                                                        Branches.from( ContentConstants.BRANCH_DRAFT ) )
                                                                                    .contentId( revertedContent.getId() )
                                                                                    .build() )
            .getActiveContentVersions()
            .stream()
            .findAny()
            .map( ActiveContentVersionEntry::getContentVersion )
            .orElse( null );

        if ( contentVersion != null )
        {
            return new ContentVersionJson( contentVersion, principalsResolver );
        }

        return null;
    }

    @POST
    @Path("restoreInherit")
    public void restoreInherit( final ResetContentInheritJson paramsJson )
    {
        this.syncContentService.resetInheritance( paramsJson.toParams() );
    }

    private UpdateContentParams prepareUpdateContentParams( final Content versionedContent, final ContentVersionId contentVersionId )
    {
        final UpdateContentParams updateParams = new UpdateContentParams().contentId( versionedContent.getId() ).editor( edit -> {
            edit.data = versionedContent.getData();
            edit.displayName = versionedContent.getDisplayName();
            edit.extraDatas = versionedContent.getAllExtraData();
            edit.page = versionedContent.getPage();
            edit.language = versionedContent.getLanguage();
            edit.owner = versionedContent.getOwner();
            edit.thumbnail = versionedContent.getThumbnail();
            edit.workflowInfo = WorkflowInfo.inProgress();
//            edit.permissions = versionedContent.getPermissions();   // check - Do not copy permissions
        } );

        updateAttachments( versionedContent, contentVersionId, updateParams );

        return updateParams;
    }

    private void updateAttachments( final Content versionedContent, final ContentVersionId contentVersionId,
                                    final UpdateContentParams updateParams )
    {
        final Content content = contentService.getById( versionedContent.getId() );

        final List<BinaryReference> sourceAttachments = ofNullable( content.getAttachments() ).orElse( Attachments.empty() )
            .stream()
            .map( Attachment::getBinaryReference )
            .collect( Collectors.toList() );

        final List<BinaryReference> targetAttachments = ofNullable( versionedContent.getAttachments() ).orElse( Attachments.empty() )
            .stream()
            .map( Attachment::getBinaryReference )
            .collect( Collectors.toList() );

        List<BinaryReference> difference;
        if ( sourceAttachments.size() > targetAttachments.size() )
        {
            difference = sourceAttachments.stream().filter( ref -> !targetAttachments.contains( ref ) ).collect( Collectors.toList() );
        }
        else
        {
            difference = targetAttachments.stream().filter( ref -> !sourceAttachments.contains( ref ) ).collect( Collectors.toList() );
        }

        if ( !difference.isEmpty() )
        {
            updateParams.clearAttachments( true );
            updateParams.createAttachments(
                createAttachments( versionedContent.getId(), contentVersionId, versionedContent.getAttachments() ) );
        }
    }

    private CreateAttachments createAttachments( final ContentId contentId, final ContentVersionId contentVersionId,
                                                 final Attachments attachments )
    {
        final CreateAttachments.Builder createBuilder = CreateAttachments.create();

        attachments.forEach( attachment -> {
            final CreateAttachment createAttachment = createAttachment( contentId, contentVersionId, attachment );

            if ( createAttachment != null )
            {
                createBuilder.add( createAttachment );
            }
        } );

        final CreateAttachments createAttachments = createBuilder.build();

        return createAttachments.isNotEmpty() ? createAttachments : null;
    }

    private CreateAttachment createAttachment( final ContentId contentId, final ContentVersionId contentVersionId,
                                               final Attachment sourceAttachment )
    {
        final ByteSource sourceBinary = contentService.getBinary( contentId, contentVersionId, sourceAttachment.getBinaryReference() );

        if ( sourceBinary != null )
        {
            return CreateAttachment.create()
                .name( sourceAttachment.getName() )
                .mimeType( sourceAttachment.getMimeType() )
                .byteSource( sourceBinary )
                .text( sourceAttachment.getTextContent() )
                .label( sourceAttachment.getLabel() )
                .build();
        }

        return null;
    }

    private Content doCreateAttachment( final String attachmentName, final MultipartForm form )
    {
        final MultipartItem mediaFile = form.get( "file" );
        checkSize( mediaFile );
        final ExtractedData extractedData = this.extractor.extract( mediaFile.getBytes() );

        final CreateAttachment attachment = CreateAttachment.create()
            .name( attachmentName )
            .mimeType( mediaFile.getContentType().toString() )
            .byteSource( mediaFile.getBytes() )
            .text( extractedData.getText() )
            .build();

        final UpdateContentParams params = new UpdateContentParams().contentId( ContentId.from( form.getAsString( "id" ) ) )
            .createAttachments( CreateAttachments.from( attachment ) );

        return contentService.update( params );
    }

    private void checkSize( final MultipartItem mediaFile )
    {
        if ( mediaFile.getSize() > uploadMaxFileSize )
        {
            throw new IllegalStateException( "File size exceeds maximum allowed upload size" );
        }
    }

    private PrincipalQueryResult getTotalUsers()
    {
        final PrincipalQuery query = PrincipalQuery.create().includeUsers().size( MAX_EFFECTIVE_PERMISSIONS_PRINCIPALS ).build();
        return this.securityService.query( query );
    }

    private String getFormattedDisplayName( Locale locale )
    {
        return locale.getDisplayName( locale ) + " (" + locale.toLanguageTag() + ")";
    }

    private long countContentsAndTheirChildren( final ContentPaths contentsPaths )
    {
        return contentsPaths.getSize() + ( contentsPaths.isEmpty() ? 0 : countChildren( contentsPaths ) );
    }

    private long countChildren( final ContentPaths contentsPaths )
    {
        return ContentQueryWithChildren.create()
            .contentService( this.contentService )
            .contentsPaths( contentsPaths )
            .build()
            .find()
            .getTotalHits();
    }

    private boolean contentNameIsOccupied( final RenameContentParams renameParams )
    {
        Content content = contentService.getById( renameParams.getContentId() );
        if ( content.getName().equals( renameParams.getNewName() ) )
        {
            return false;
        }

        ContentPath newPath = ContentPath.from( content.getParentPath(), renameParams.getNewName().toString() );
        try
        {
            contentService.getByPath( newPath );
        }
        catch ( ContentNotFoundException e )
        {
            return false;
        }

        return true;
    }

    private void validatePublishInfo( final UpdateContentJson updateContentJson )
    {

        final Instant publishToInstant = updateContentJson.getPublishToInstant();
        if ( publishToInstant != null )
        {
            final Instant publishFromInstant = updateContentJson.getPublishFromInstant();
            if ( publishFromInstant == null )
            {
                throw new WebApplicationException( "[Online to] date/time cannot be set without [Online from]",
                                                   HttpStatus.UNPROCESSABLE_ENTITY.value() );
            }
            if ( publishToInstant.compareTo( publishFromInstant ) < 0 )
            {
                throw new WebApplicationException( "[Online from] date/time must be earlier than [Online to]",
                                                   HttpStatus.UNPROCESSABLE_ENTITY.value() );
            }
        }
    }


    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }

    @Reference
    public void setNodeService( final NodeService nodeService )
    {
        this.nodeService = nodeService;
    }

    @Reference
    public void setContentTypeService( final ContentTypeService contentTypeService )
    {
        this.contentTypeService = contentTypeService;
    }

    @Reference
    public void setSecurityService( final SecurityService securityService )
    {
        this.principalsResolver = new ContentPrincipalsResolver( securityService );
        this.securityService = securityService;
    }

    @Reference
    public void setRelationshipTypeService( final RelationshipTypeService relationshipTypeService )
    {
        this.relationshipTypeService = relationshipTypeService;
    }

    @Reference
    public void setExtractor( final BinaryExtractor extractor )
    {
        this.extractor = extractor;
    }

    @Reference
    public void setTaskService( final TaskService taskService )
    {
        this.taskService = taskService;
    }

    @Reference
    public void setSyncContentService( final SyncContentService syncContentService )
    {
        this.syncContentService = syncContentService;
    }

    @Reference
    public void setJsonObjectsFactory( final JsonObjectsFactory jsonObjectsFactory )
    {
        this.jsonObjectsFactory = jsonObjectsFactory;
    }

    @Reference
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }
}
