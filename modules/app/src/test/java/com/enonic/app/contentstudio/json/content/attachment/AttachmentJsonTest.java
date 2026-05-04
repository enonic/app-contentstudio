package com.enonic.app.contentstudio.json.content.attachment;

import org.junit.jupiter.api.Test;

import com.enonic.xp.attachment.Attachment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class AttachmentJsonTest
{
    @Test
    void exposesAllAttachmentFields()
    {
        final Attachment attachment = Attachment.create()
            .name( "report.pdf" )
            .label( "source" )
            .mimeType( "application/pdf" )
            .size( 12345 )
            .sha512( "abc123" )
            .build();

        final AttachmentJson json = new AttachmentJson( attachment );

        assertEquals( "report.pdf", json.getName() );
        assertEquals( "source", json.getLabel() );
        assertEquals( "application/pdf", json.getMimeType() );
        assertEquals( 12345L, json.getSize() );
        assertEquals( "abc123", json.getSha512() );
        assertEquals( attachment, json.getAttachment() );
    }

    @Test
    void nullSha512()
    {
        final Attachment attachment = Attachment.create()
            .name( "image.png" )
            .mimeType( "image/png" )
            .size( 42 )
            .build();

        final AttachmentJson json = new AttachmentJson( attachment );

        assertNull( json.getSha512() );
    }
}
