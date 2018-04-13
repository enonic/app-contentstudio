package com.enonic.xp.simplesite;

import java.util.concurrent.Callable;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.io.ByteSource;
import com.google.common.io.Resources;

import com.enonic.xp.content.ApplyContentPermissionsParams;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.CreateContentParams;
import com.enonic.xp.content.CreateMediaParams;
import com.enonic.xp.content.UpdateContentParams;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.index.IndexService;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.User;
import com.enonic.xp.security.acl.AccessControlEntry;
import com.enonic.xp.security.acl.AccessControlList;
import com.enonic.xp.security.acl.Permission;
import com.enonic.xp.security.auth.AuthenticationInfo;


@Component(immediate = true)
public class Initializer
{
    private final static Logger LOG = LoggerFactory.getLogger( Initializer.class );

    private static final String[] FOLDER_IMAGES =
        {"bro.jpg", "Pop_02.jpg", "Pop_03.jpg", "Pop_04.jpg", "seng.jpg", "foss.jpg", "telk.png", "geek.png", "enterprise.png", "item1.png",
            "item2.png", "team1.png", "team2.png"};

    private static final AccessControlList PERMISSIONS =
        AccessControlList.of( AccessControlEntry.create().principal( PrincipalKey.ofAnonymous() ).allow( Permission.READ ).build(),
                              AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allow( Permission.READ ).build(),
                              AccessControlEntry.create().principal( RoleKeys.AUTHENTICATED ).allowAll().build(),
                              AccessControlEntry.create().principal( RoleKeys.CONTENT_MANAGER_ADMIN ).allowAll().build() );

    private static final String FOLDER_DISPLAY_NAME = "Images for simple page";

    private static final String FOLDER_NAME = "imagearchive";

    private ContentService contentService;

    private IndexService indexService;

    @Activate
    public void initialize()
        throws Exception
    {
        if ( this.indexService.isMaster() )
        {
            runAs( createInitContext(), () -> {
                doInitialize();
                return null;
            } );
        }
    }

    private Context createInitContext()
    {
        return ContextBuilder.from( ContextAccessor.current() ).
            authInfo( AuthenticationInfo.create().principals( RoleKeys.CONTENT_MANAGER_ADMIN ).user( User.ANONYMOUS ).build() ).
            branch( ContentConstants.BRANCH_DRAFT ).
            repositoryId( ContentConstants.CONTENT_REPO.getId() ).
            build();
    }

    private void doInitialize()
        throws Exception
    {
        final ContentPath imagesPath = ContentPath.from( "/" + FOLDER_NAME );
        if ( hasContent( imagesPath ) )
        {
            return;
        }
        folderWithImage();
        // set permissions
        final Content moduleContent = contentService.getByPath( imagesPath );
        if ( moduleContent != null )
        {
            final UpdateContentParams setAppPermissions = new UpdateContentParams().
                contentId( moduleContent.getId() ).
                editor( ( content ) -> {
                    content.permissions = PERMISSIONS;
                    content.inheritPermissions = false;
                } );
            contentService.update( setAppPermissions );

            contentService.applyPermissions( ApplyContentPermissionsParams.create().
                contentId( moduleContent.getId() ).
                build() );
        }
    }

    private void folderWithImage()
        throws Exception
    {
        final ContentPath testFolderPath = ContentPath.from( "/" + FOLDER_NAME );
        if ( !hasContent( testFolderPath ) )
        {
            contentService.create( makeFolder().
                name( FOLDER_NAME ).
                displayName( FOLDER_DISPLAY_NAME ).
                parent( ContentPath.ROOT ).
                permissions( PERMISSIONS ).
                inheritPermissions( false ).
                build() );

            for ( final String fileName : FOLDER_IMAGES )
            {
                try
                {
                    createImageContent( testFolderPath, fileName );
                }
                finally
                {
                    LOG.info( "added image content content for simple page' app: " + fileName );
                }
            }
        }
    }

    private boolean hasContent( final ContentPath path )
    {
        try
        {
            return this.contentService.getByPath( path ) != null;
        }
        catch ( final Exception e )
        {
            return false;
        }
    }

    private void createImageContent( final ContentPath parent, final String fileName )
        throws Exception
    {

        final byte[] bytes = loadImageFileAsBytes( fileName );
        if ( bytes == null )
        {
            return;
        }
        final CreateMediaParams params = new CreateMediaParams().
            mimeType( "image/jpeg" ).
            name( fileName ).
            parent( parent ).byteSource( ByteSource.wrap( bytes ) );
        contentService.create( params ).getId();
    }

    private byte[] loadImageFileAsBytes( final String fileName )
    {
        final String filePath = "/site/images/" + fileName;
        try
        {
            return Resources.toByteArray( getClass().getResource( filePath ) );
        }
        catch ( Exception e )
        {
            LOG.info( "error when loads  :  " + fileName );
            System.out.println( "error " + e.getMessage() );
            return null;
        }
    }

    private CreateContentParams createFolder()
    {

        return CreateContentParams.create().

            type( ContentTypeName.templateFolder() ).parent( ContentPath.ROOT ).displayName( "Simple Page Images" ).
            requireValid( true ).owner( PrincipalKey.ofAnonymous() ).
            contentData( new PropertyTree() ).type( ContentTypeName.folder() ).
            build();
    }

    private CreateContentParams.Builder makeFolder()
    {
        return CreateContentParams.create().
            owner( PrincipalKey.ofAnonymous() ).
            contentData( new PropertyTree() ).
            type( ContentTypeName.folder() ).
            inheritPermissions( true );
    }

    private <T> T runAs( final Context context, final Callable<T> runnable )
    {
        return context.callWith( runnable );
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }

    @Reference
    public void setIndexService( final IndexService indexService )
    {
        this.indexService = indexService;
    }

}
