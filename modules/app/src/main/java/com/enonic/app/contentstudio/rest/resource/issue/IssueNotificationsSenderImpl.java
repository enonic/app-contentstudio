package com.enonic.app.contentstudio.rest.resource.issue;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.enonic.xp.mail.MailService;
import com.enonic.xp.mail.SendMailParams;

@Component
public class IssueNotificationsSenderImpl
    implements IssueNotificationsSender
{
    private static final Logger LOG = LoggerFactory.getLogger( IssueNotificationsSenderImpl.class );

    private final MailService mailService;

    @Activate
    public IssueNotificationsSenderImpl( @Reference final MailService mailService )
    {
        this.mailService = mailService;
    }

    @Override
    public void notifyIssueCreated( final IssueNotificationParams params )
    {
        if ( isRecipientsPresent( params ) )
        {
            final SendMailParams mailMessage =
                new IssueCreatedMailMessageGenerator( params ).generateMessage( mailService.getDefaultFromEmail() );

            sendMailMessage( mailMessage );
        }
    }

    @Override
    public void notifyIssuePublished( final IssuePublishedNotificationParams params )
    {
        if ( isRecipientsPresent( params ) )
        {
            final SendMailParams mailMessage =
                new IssuePublishedMailMessageGenerator( params ).generateMessage( mailService.getDefaultFromEmail() );

            sendMailMessage( mailMessage );
        }
    }

    @Override
    public void notifyIssueUpdated( final IssueUpdatedNotificationParams params )
    {
        if ( isRecipientsPresent( params ) )
        {
            final SendMailParams mailMessage =
                new IssueUpdatedMailMessageGenerator( params ).generateMessage( mailService.getDefaultFromEmail() );

            sendMailMessage( mailMessage );
        }
    }

    @Override
    public void notifyIssueCommented( final IssueCommentedNotificationParams params )
    {
        if ( isRecipientsPresent( params ) )
        {
            final SendMailParams mailMessage =
                new IssueCommentedMailMessageGenerator( params ).generateMessage( mailService.getDefaultFromEmail() );

            sendMailMessage( mailMessage );
        }
    }

    private boolean isRecipientsPresent( final IssueNotificationParams params )
    {
        if ( params.hasValidCreator() )
        {
            return true;
        }

        if ( params.getApprovers().isEmpty() )
        {
            return false;
        }

        return params.getApprovers().stream().anyMatch( user -> user.getEmail() != null );
    }

    private void sendMailMessage( final SendMailParams mailMessage )
    {
        if ( mailMessage == null )
        {
            return;
        }

        try
        {
            mailService.send( mailMessage );
        }
        catch ( final Exception e )
        {
            LOG.error( "Failed to send issue notification email", e );
        }
    }
}
