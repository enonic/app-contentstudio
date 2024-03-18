package com.enonic.xp.app.contentstudio.rest.resource.issue;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.mail.MailService;
import com.enonic.xp.mail.SendMailParams;

@Component
public class IssueNotificationsSenderImpl
    implements IssueNotificationsSender
{
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
            final SendMailParams mailMessage = new IssueCreatedMailMessageGenerator( params ).generateMessage();
            if ( mailMessage != null )
            {
                mailService.send( mailMessage );
            }
        }
    }

    @Override
    public void notifyIssuePublished( final IssuePublishedNotificationParams params )
    {
        if ( isRecipientsPresent( params ) )
        {
            final SendMailParams mailMessage = new IssuePublishedMailMessageGenerator( params ).generateMessage();
            if ( mailMessage != null )
            {
                mailService.send( mailMessage );
            }
        }
    }

    @Override
    public void notifyIssueUpdated( final IssueUpdatedNotificationParams params )
    {
        if ( isRecipientsPresent( params ) )
        {
            final SendMailParams mailMessage = new IssueUpdatedMailMessageGenerator( params ).generateMessage();
            if ( mailMessage != null )
            {
                mailService.send( mailMessage );
            }
        }
    }

    @Override
    public void notifyIssueCommented( final IssueCommentedNotificationParams params )
    {
        if ( isRecipientsPresent( params ) )
        {
            final SendMailParams mailMessage = new IssueCommentedMailMessageGenerator( params ).generateMessage();
            if ( mailMessage != null )
            {
                mailService.send( mailMessage );
            }
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
}
