package com.enonic.app.contentstudio.json.content;

import java.util.Set;

public class ContentVersionHelper
{
    public static final String CREATE_KEY = "content.create";

    public static final String DUPLICATE_KEY = "content.duplicate";

    public static final String IMPORT_KEY = "content.import";

    public static final String UPDATE_KEY = "content.update";

    public static final String PERMISSIONS_KEY = "content.permissions";

    public static final String MOVE_KEY = "content.move";

    public static final String SORT_KEY = "content.sort";

    public static final String PATCH_KEY = "content.patch";

    public static final String ARCHIVE_KEY = "content.archive";

    public static final String RESTORE_KEY = "content.restore";

    public static final String PUBLISH_KEY = "content.publish";

    public static final String UNPUBLISH_KEY = "content.unpublish";

    public static final String METADATA_KEY = "content.updateMetadata";

    public static final Set<String> CHANGE_OPERATIONS =
        Set.of( CREATE_KEY, DUPLICATE_KEY, IMPORT_KEY, UPDATE_KEY, PERMISSIONS_KEY, MOVE_KEY, SORT_KEY, PATCH_KEY, ARCHIVE_KEY,
                RESTORE_KEY, METADATA_KEY );
}
