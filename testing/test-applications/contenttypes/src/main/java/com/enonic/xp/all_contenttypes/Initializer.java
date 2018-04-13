package com.enonic.xp.all_contenttypes;

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
    private static final String[] FOLDER_IMAGES =
        {"book.jpg", "man.jpg", "man2.jpg", "fl.jpg", "nord.jpg", "whale.jpg", "hand.jpg", "spumans.jpg", "elephant.jpg", "renault.jpg"};

    private static final String[] BAT_FILES = {"server.bat", "start.bat"};

    private static final String FOLDER_NAME = "all-content-types-images";

    private static final String SHORTCUT_NAME = "shortcut-imported";

    private static final String TEST_FOLDER_NAME = "selenium-tests-folder";

    private static final String TEST_FOLDER_DISPLAY_NAME = "folder for selenium tests";

    private static final String FOLDER_DISPLAY_NAME = "All Content types images";

    private static final AccessControlList PERMISSIONS =
        AccessControlList.of( AccessControlEntry.create().principal( PrincipalKey.ofAnonymous() ).allow( Permission.READ ).build(),
                              AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allow( Permission.READ ).build(),
                              AccessControlEntry.create().principal( RoleKeys.AUTHENTICATED ).allowAll().build(),
                              AccessControlEntry.create().principal( RoleKeys.CONTENT_MANAGER_ADMIN ).allowAll().build() );

    private ContentService contentService;

    private IndexService indexService;


    private final Logger LOG = LoggerFactory.getLogger( Initializer.class );

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

        addFolderWithImage();
        // set permissions  for folder with images
        final Content imagesFolder = contentService.getByPath( imagesPath );
        if ( imagesFolder != null )
        {
            final UpdateContentParams setAppPermissions = new UpdateContentParams().
                contentId( imagesFolder.getId() ).
                editor( ( content ) -> {
                    content.permissions = PERMISSIONS;
                    content.inheritPermissions = false;
                } );
            contentService.update( setAppPermissions );

            contentService.applyPermissions( ApplyContentPermissionsParams.create().
                contentId( imagesFolder.getId() ).

                build() );
        }

        final ContentPath emptyFolderPath = ContentPath.from( "/" + TEST_FOLDER_NAME );
        if ( hasContent( emptyFolderPath ) )
        {
            return;
        }

        ///////////////////////////////////////////////////////////////////////
        addTestFolder();
        // set permissions  for empty folder
        final Content emptyFolder = contentService.getByPath( emptyFolderPath );
        if ( emptyFolder != null )
        {
            final UpdateContentParams setAppPermissions = new UpdateContentParams().
                contentId( emptyFolder.getId() ).
                editor( ( content ) -> {
                    content.permissions = PERMISSIONS;
                    content.inheritPermissions = false;
                } );
            contentService.update( setAppPermissions );

            contentService.applyPermissions( ApplyContentPermissionsParams.create().
                contentId( emptyFolder.getId() ).
                build() );
        }


    }

    private CreateContentParams.Builder makeFolder()
    {
        return CreateContentParams.create().
            owner( PrincipalKey.ofAnonymous() ).
            contentData( new PropertyTree() ).
            type( ContentTypeName.folder() ).
            inheritPermissions( true );
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

    private void addFolderWithImage()
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
                    LOG.info( "Initialized content for 'All content types'" );
                }
            }
        }
    }

    private void addTestFolder()
        throws Exception
    {
        final ContentPath testFolderPath = ContentPath.from( "/" + TEST_FOLDER_NAME );
        if ( !hasContent( testFolderPath ) )
        {
            contentService.create( makeFolder().
                name( TEST_FOLDER_NAME ).
                displayName( TEST_FOLDER_DISPLAY_NAME ).
                parent( ContentPath.ROOT ).
                permissions( PERMISSIONS ).
                inheritPermissions( false ).
                build() );

            for ( final String fileName : BAT_FILES )
            {
                try
                {
                    createBatContent( testFolderPath, fileName );
                }
                catch ( Exception e )
                {
                    LOG.info( "Error when creating bat-content" + e.getMessage() );
                }
                finally
                {
                    LOG.info( "Initialized content for 'All content types'" );
                }
            }
            addSHContent( testFolderPath );
            addEXEContent( testFolderPath );
            createSVG_Content( testFolderPath );
            createPPTX_Content( testFolderPath );
            createTXT_Content( testFolderPath );
            createPDF_Content( testFolderPath );
            addShortcut( testFolderPath );
        }

    }

    private void addShortcut( final ContentPath parent )
    {
        contentService.create( makeShortcut().
            name( SHORTCUT_NAME ).
            displayName( SHORTCUT_NAME ).
            parent( parent ).
            permissions( PERMISSIONS ).
            inheritPermissions( false ).
            build() );
    }

    private CreateContentParams.Builder makeShortcut()
    {
        return CreateContentParams.create().
            owner( PrincipalKey.ofAnonymous() ).
            contentData( new PropertyTree() ).
            type( ContentTypeName.shortcut() ).
            inheritPermissions( true );
    }

    private void createCODE_Content( final ContentPath parent )
        throws Exception
    {
        String fileName = "test.js";
        final byte[] bytes = loadFileAsBytes( fileName );
        if ( bytes == null )
        {
            return;
        }

        final CreateMediaParams params = new CreateMediaParams().
            mimeType( "text/javascript" ).
            name( fileName ).
            parent( parent ).byteSource( ByteSource.wrap( bytes ) );
        contentService.create( params ).getId();
        LOG.info( "content added :  " + fileName );
    }

    private void createTXT_Content( final ContentPath parent )
        throws Exception
    {
        String fileName = "test-text.txt";
        final byte[] bytes = loadFileAsBytes( fileName );
        if ( bytes == null )
        {
            return;
        }

        final CreateMediaParams params = new CreateMediaParams().
            mimeType( "text/plain" ).
            name( fileName ).
            parent( parent ).byteSource( ByteSource.wrap( bytes ) );
        contentService.create( params ).getId();
        LOG.info( "content added :  " + fileName );
    }

    private void createPDF_Content( final ContentPath parent )
        throws Exception
    {
        String fileName = "pdf.pdf";
        final byte[] bytes = loadFileAsBytes( fileName );
        if ( bytes == null )
        {
            LOG.info( "PDF :  " + fileName + "not loaded" );
            return;
        }

        final CreateMediaParams params = new CreateMediaParams().
            mimeType( "application/pdf" ).
            name( fileName ).
            parent( parent ).byteSource( ByteSource.wrap( bytes ) );
        try
        {
            contentService.create( params ).getId();
        }
        catch ( Exception e )
        {
            LOG.info( "Exception" + e.getMessage() );
        }

        LOG.info( "content added :  " + fileName );
    }


    private void createSVG_Content( final ContentPath parent )
        throws Exception
    {
        String fileName = "circles.svg";
        final byte[] bytes = loadFileAsBytes( fileName );
        if ( bytes == null )
        {
            return;
        }

        final CreateMediaParams params = new CreateMediaParams().
            mimeType( "image/svg+xml" ).
            name( fileName ).
            parent( parent ).byteSource( ByteSource.wrap( bytes ) );
        contentService.create( params ).getId();
        LOG.info( "content added :  " + fileName );
    }

    private void createPPTX_Content( final ContentPath parent )
        throws Exception
    {
        String fileName = "presentation.pptx";
        final byte[] bytes = loadFileAsBytes( fileName );
        if ( bytes == null )
        {
            return;
        }

        final CreateMediaParams params = new CreateMediaParams().
            mimeType( "application/vnd.ms-powerpoint" ).
            name( fileName ).
            parent( parent ).byteSource( ByteSource.wrap( bytes ) );
        contentService.create( params ).getId();
        LOG.info( "content added :  " + fileName );
    }

    private void addEXEContent( final ContentPath parent )
    {
        String fileName = "Notepad2.exe";
        final byte[] bytes = loadFileAsBytes( fileName );
        if ( bytes == null )
        {
            return;
        }

        final CreateMediaParams params = new CreateMediaParams().
            mimeType( "application/exe" ).
            name( fileName ).
            parent( parent ).byteSource( ByteSource.wrap( bytes ) );
        contentService.create( params ).getId();
        LOG.info( "content added :  " + fileName );

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
        LOG.info( "content added :  " + fileName );

    }

    private void createBatContent( final ContentPath parent, final String fileName )
        throws Exception
    {
        final byte[] bytes = loadFileAsBytes( fileName );
        if ( bytes == null )
        {
            return;
        }

        final CreateMediaParams params = new CreateMediaParams().
            mimeType( "application/x-bat" ).
            name( fileName ).
            parent( parent ).byteSource( ByteSource.wrap( bytes ) );
        contentService.create( params ).getId();
        LOG.info( "content added :  " + fileName );
    }


    private void addSHContent( final ContentPath parent )
        throws Exception
    {
        String fileName = "server.sh";
        final byte[] bytes = loadFileAsBytes( fileName );
        if ( bytes == null )
        {
            return;
        }

        final CreateMediaParams params = new CreateMediaParams().
            mimeType( "application/x-sh" ).
            name( fileName ).
            parent( parent ).byteSource( ByteSource.wrap( bytes ) );
        contentService.create( params ).getId();
        LOG.info( "content added :  " + fileName );
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
            LOG.info( "error  " + e.getMessage() );
            System.out.println( "error " + e.getMessage() );
            return null;
        }
    }

    private byte[] loadFileAsBytes( final String fileName )
    {
        final String filePath = "/site/files/" + fileName;

        try
        {
            return Resources.toByteArray( getClass().getResource( filePath ) );
        }
        catch ( Exception e )
        {
            LOG.info( "error  " + e.getMessage() );
            System.out.println( "error " + e.getMessage() );
            return null;
        }
    }

    private <T> T runAs( final Context context, final Callable<T> runnable )
    {
        return context.callWith( runnable );
    }
}
