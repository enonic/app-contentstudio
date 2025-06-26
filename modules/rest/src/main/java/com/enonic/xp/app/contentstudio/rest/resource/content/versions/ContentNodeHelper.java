package com.enonic.xp.app.contentstudio.rest.resource.content.versions;

import com.enonic.xp.content.ContentPath;
import com.enonic.xp.node.NodePath;

import static com.enonic.xp.archive.ArchiveConstants.ARCHIVE_ROOT_NAME;
import static com.enonic.xp.content.ContentConstants.CONTENT_ROOT_NAME;

public class ContentNodeHelper
{
    public static ContentPath translateNodePathToContentPath( final NodePath nodePath )
    {
        if ( nodePath.isEmpty() )
        {
            throw new IllegalArgumentException( "Node path is not a content path: " + nodePath );
        }

        final String rootNodeName = getContentRootName( nodePath);

        if ( CONTENT_ROOT_NAME.equals( rootNodeName ) || ARCHIVE_ROOT_NAME.equals( rootNodeName ) )
        {
            final int beginIndex = nodePath.toString().indexOf( "/", 1 );
            if ( beginIndex == -1 )
            {
                return ContentPath.ROOT;
            }
            else
            {
                return ContentPath.from( nodePath.toString().substring( beginIndex ) );
            }
        }

        throw new IllegalArgumentException( "Node path is not a content path: " + nodePath );
    }

    public static String getContentRootName( final NodePath nodePath )
    {
        final String pathString = nodePath.toString();
        final int endIndex = pathString.indexOf( "/", 1 );
        return pathString.substring( 1, endIndex == -1 ? pathString.length() : endIndex );
    }
}


