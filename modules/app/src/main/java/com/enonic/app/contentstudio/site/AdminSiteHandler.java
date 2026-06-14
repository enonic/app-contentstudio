package com.enonic.app.contentstudio.site;

import java.util.Arrays;
import java.util.concurrent.Callable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalRequestAccessor;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.project.Project;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.auth.AuthenticationInfo;
import com.enonic.xp.site.Site;
import com.enonic.xp.web.HttpStatus;
import com.enonic.xp.web.WebException;
import com.enonic.xp.web.csp.ContentSecurityPolicy;
import com.enonic.xp.web.csp.CspSource;
import com.enonic.xp.web.WebRequest;
import com.enonic.xp.web.WebResponse;
import com.enonic.xp.web.exception.ExceptionMapper;
import com.enonic.xp.web.exception.ExceptionRenderer;
import com.enonic.xp.web.handler.BaseWebHandler;
import com.enonic.xp.web.handler.WebHandler;
import com.enonic.xp.web.handler.WebHandlerChain;

import static com.google.common.base.Strings.nullToEmpty;

@Component(immediate = true, service = WebHandler.class, configurationPid = "com.enonic.app.contentstudio")
public class AdminSiteHandler
    extends BaseWebHandler
{
    protected ExceptionMapper exceptionMapper;

    protected ExceptionRenderer exceptionRenderer;

    public static final String ADMIN_SITE_PREFIX = "/admin/com.enonic.app.contentstudio/site/";

    private static final Pattern ADMIN_SITE_PATH_PATTERN = Pattern.compile(
        "^(?<base>/admin/com.enonic.app.contentstudio/site/(?<mode>edit|preview|admin|inline))/(?<project>[^/]+)/(?<branch>[^/]+)(?<path>.*)" );

    private final ContentService contentService;

    private final ProjectService projectService;

    private volatile String inlineContentSecurityPolicy;

    private volatile String previewContentSecurityPolicy;

    @Activate
    public AdminSiteHandler( @Reference final ContentService contentService, @Reference final ProjectService projectService,
                             @Reference final ExceptionMapper exceptionMapper, @Reference final ExceptionRenderer exceptionRenderer )
    {
        super( -51 );
        this.contentService = contentService;
        this.projectService = projectService;
        this.exceptionMapper = exceptionMapper;
        this.exceptionRenderer = exceptionRenderer;
    }

    @Activate
    @Modified
    public void activate( final AdminSiteConfig config )
    {
        inlineContentSecurityPolicy = config.site_inline_contentSecurityPolicy();
        previewContentSecurityPolicy = config.site_preview_contentSecurityPolicy();
    }

    @Override
    protected boolean canHandle( final WebRequest webRequest )
    {
        return webRequest.getBasePath().startsWith( ADMIN_SITE_PREFIX );
    }

    protected PortalRequest createPortalRequest( final WebRequest webRequest, final WebResponse webResponse )
    {
        final Matcher matcher = ADMIN_SITE_PATH_PATTERN.matcher( webRequest.getBasePath() );
        if ( !matcher.matches() )
        {
            throw WebException.notFound( "Invalid admin site URL" );
        }
        final PortalRequest portalRequest = new PortalRequest( webRequest );

        final ProjectName projectName;
        final Branch branch;
        final RenderMode mode;
        final ContentPath contentPath;
        try
        {
            mode = RenderMode.from( matcher.group( "mode" ) );
            projectName = ProjectName.from( matcher.group( "project" ) );
            branch = Branch.from( matcher.group( "branch" ) );
            contentPath = ContentPath.from( matcher.group( "path" ) );
        }
        catch ( IllegalArgumentException e )
        {
            throw new WebException( HttpStatus.NOT_FOUND, "Invalid admin site URL", e );
        }
        final RepositoryId repositoryId = projectName.getRepoId();

        portalRequest.setBaseUri( matcher.group( "base" ) );
        portalRequest.setRepositoryId( repositoryId );
        portalRequest.setBranch( branch );
        portalRequest.setMode( mode );
        portalRequest.setContentPath( contentPath );

        final Project project = callAsContentAdmin( repositoryId, branch, () -> projectService.get( projectName ) );
        portalRequest.setProject( project );

        if ( contentPath.isRoot() )
        {
            return portalRequest;
        }

        if ( mode == RenderMode.EDIT )
        {
            final ContentId contentId = tryConvertToContentId( contentPath.toString() );

            final Content contentById =
                contentId != null ? callAsContentAdmin( repositoryId, branch, () -> getContentById( contentId ) ) : null;

            final Content content =
                contentById != null ? contentById : callAsContentAdmin( repositoryId, branch, () -> this.getContentByPath( contentPath ) );

            if ( content == null )
            {
                portalRequest.setSite(
                    callAsContentAdmin( repositoryId, branch, () -> this.contentService.findNearestSiteByPath( contentPath ) ) );
            }
            else if ( !content.getPath().isRoot() )
            {
                portalRequest.setContent( content );
                portalRequest.setContentPath( content.getPath() );
                portalRequest.setSite( content.isSite()
                                           ? (Site) content
                                           : callAsContentAdmin( repositoryId, branch,
                                                                 () -> this.contentService.getNearestSite( content.getId() ) ) );
            }
        }
        else
        {
            final Content content = callAsContentAdmin( repositoryId, branch, () -> getContentByPath( contentPath ) );

            if ( content != null )
            {
                portalRequest.setContent( content );
                portalRequest.setContentPath( content.getPath() );
                portalRequest.setSite( content.isSite()
                                           ? (Site) content
                                           : callAsContentAdmin( repositoryId, branch,
                                                                 () -> this.contentService.findNearestSiteByPath( content.getPath() ) ) );
            }
            else
            {
                portalRequest.setSite(
                    callAsContentAdmin( repositoryId, branch, () -> this.contentService.findNearestSiteByPath( contentPath ) ) );
            }
        }

        return portalRequest;
    }

    @Override
    protected WebResponse doHandle( final WebRequest webRequest, final WebResponse webResponse, final WebHandlerChain webHandlerChain )
    {
        final WebResponse response = doHandle0( webRequest, webResponse, webHandlerChain );
        final PortalRequest request = PortalRequestAccessor.get( webRequest.getRawRequest() );

        final RenderMode mode = request.getMode();

        if ( mode == RenderMode.LIVE || mode == null || request.getEndpointPath() != null )
        {
            return response;
        }

        final ContentSecurityPolicy policy = request.getContentSecurityPolicy();

        if ( mode == RenderMode.INLINE )
        {
            // The inline view renders selected content in an admin-origin iframe on tree selection
            // and injects the page-editor viewer (viewer.js). Content Studio enforces script-src
            // 'self' for it directly (like edit mode) — config must not be able to break the editor —
            // and frame-ancestors 'self' so the panel can frame it. The configurable baseline then
            // gap-fills the remaining containment directives, without touching what the page set.
            policy.frameAncestors( CspSource.SELF ).scriptSrc( CspSource.SELF );
            applyBaseline( policy, inlineContentSecurityPolicy );
        }
        else if ( mode == RenderMode.EDIT )
        {
            policy.frameAncestors( CspSource.SELF )
                .imgSrc( CspSource.WILDCARD, CspSource.DATA )
                .fontSrc( CspSource.WILDCARD, CspSource.DATA )
                .frameSrc( CspSource.WILDCARD )
                .mediaSrc( CspSource.WILDCARD )
                .objectSrc( CspSource.NONE )
                .connectSrc( CspSource.SELF )
                .reset( "script-src", "style-src" )
                .scriptSrc( CspSource.SELF )
                .styleSrc( CspSource.WILDCARD, CspSource.UNSAFE_INLINE )
                .nonceScriptSrc();
        }
        else if ( mode == RenderMode.PREVIEW )
        {
            // Preview opens as a separate top-level tab and injects nothing, so it only gap-fills:
            // lock down a page that ships no CSP, but never touch a directive a good app declared.
            applyBaseline( policy, previewContentSecurityPolicy );
        }
        return response;
    }

    private static void applyBaseline( final ContentSecurityPolicy policy, final String baseline )
    {
        // Gap-fill: add a baseline directive only when the page did not declare it, so a good app's
        // own directives (an external script-src host, or even a strict script-src 'none') are left
        // exactly as declared. A page with no CSP of its own gets the full baseline.
        if ( nullToEmpty( baseline ).isBlank() )
        {
            return;
        }
        for ( final String part : baseline.split( ";" ) )
        {
            final String[] tokens = part.trim().split( "\\s+" );
            if ( !tokens[0].isEmpty() )
            {
                policy.addIfAbsent( tokens[0], Arrays.copyOfRange( tokens, 1, tokens.length ) );
            }
        }
    }

    private WebResponse doHandle0( final WebRequest webRequest, final WebResponse webResponse, final WebHandlerChain webHandlerChain )
    {
        final PortalRequest portalRequest;
        if ( webRequest instanceof PortalRequest )
        {
            portalRequest = (PortalRequest) webRequest;
        }
        else
        {
            portalRequest = createPortalRequest( webRequest, webResponse );
        }

        try
        {
            PortalRequestAccessor.set( portalRequest.getRawRequest(), portalRequest );

            final RepositoryId repositoryId = portalRequest.getRepositoryId();
            if ( repositoryId != null )
            {
                ContextAccessor.current().getLocalScope().setAttribute( repositoryId );
            }
            final Branch branch = portalRequest.getBranch();
            if ( branch != null )
            {
                ContextAccessor.current().getLocalScope().setAttribute( branch );
            }

            final WebResponse returnedWebResponse = webHandlerChain.handle( portalRequest, webResponse );
            exceptionMapper.throwIfNeeded( returnedWebResponse );
            return returnedWebResponse;
        }
        catch ( Exception e )
        {
            return handleError( portalRequest, e );
        }
    }

    private WebResponse handleError( final WebRequest webRequest, final Exception e )
    {
        final WebException webException = exceptionMapper.map( e );
        final WebResponse webResponse = exceptionRenderer.render( webRequest, webException );
        webRequest.getRawRequest().setAttribute( "error.handled", Boolean.TRUE );

        return webResponse;
    }


    private static ContentId tryConvertToContentId( final String contentPathString )
    {
        try
        {
            return ContentId.from( contentPathString.substring( 1 ) );
        }
        catch ( Exception e )
        {
            return null;
        }
    }

    private Content getContentById( final ContentId contentId )
    {
        try
        {
            return this.contentService.getById( contentId );
        }
        catch ( final ContentNotFoundException e )
        {
            return null;
        }
    }

    private Content getContentByPath( final ContentPath contentPath )
    {
        try
        {
            return this.contentService.getByPath( contentPath );
        }
        catch ( final ContentNotFoundException e )
        {
            return null;
        }
    }

    private static <T> T callAsContentAdmin( final RepositoryId repositoryId, final Branch branch, final Callable<T> callable )
    {
        final Context context = ContextAccessor.current();
        return ContextBuilder.from( context )
            .repositoryId( repositoryId )
            .branch( branch )
            .authInfo( AuthenticationInfo.copyOf( context.getAuthInfo() ).principals( RoleKeys.CONTENT_MANAGER_ADMIN ).build() )
            .build()
            .callWith( callable );
    }
}
