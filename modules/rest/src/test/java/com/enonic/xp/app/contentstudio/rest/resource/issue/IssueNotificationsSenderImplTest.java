package com.enonic.xp.app.contentstudio.rest.resource.issue;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.enonic.xp.content.CompareContentResult;
import com.enonic.xp.content.CompareContentResults;
import com.enonic.xp.content.CompareContentsParams;
import com.enonic.xp.content.CompareStatus;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.issue.Issue;
import com.enonic.xp.issue.IssueComment;
import com.enonic.xp.issue.IssueId;
import com.enonic.xp.issue.PublishRequest;
import com.enonic.xp.issue.PublishRequestItem;
import com.enonic.xp.mail.MailService;
import com.enonic.xp.mail.SendMailParams;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.security.IdProviderKey;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.PrincipalKeys;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.User;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class IssueNotificationsSenderImplTest
{
    private MailService mailService;

    private SecurityService securityService;

    private ContentService contentService;

    private IssueNotificationsSenderImpl issueNotificationsSender;

    private ContentTypeService contentTypeService;

    IssueNotificationParamsFactory.Builder notificationFactoryBuilder;

    private LocaleService localeService;

    private ArgumentCaptor<SendMailParams> mailCaptor;

    @BeforeEach
    public void setUp()
    {
        mailService = mock( MailService.class );
        securityService = mock( SecurityService.class );
        contentService = mock( ContentService.class );
        issueNotificationsSender = new IssueNotificationsSenderImpl( mailService );
        contentTypeService = mock( ContentTypeService.class );
        localeService = mock( LocaleService.class );

        notificationFactoryBuilder =
            IssueNotificationParamsFactory.create().contentService( contentService ).securityService( securityService ).localeService(
                localeService ).contentTypeService( contentTypeService );

        mailCaptor = ArgumentCaptor.forClass( SendMailParams.class );

        final MessageBundle messageBundle = mock( MessageBundle.class );
        when( localeService.getBundle( any(), any() ) ).thenReturn( messageBundle );
    }

    @Test
    public void testNotifyIssueCreatedWithSingleApprover()
        throws Exception
    {
        final User creator = generateUser();
        final User approver = generateUser( "other@user.com" );
        final Issue issue = createIssue( creator.getKey(), PrincipalKeys.from( approver.getKey() ) );
        final Contents contents = Contents.empty();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        when( securityService.getUser( issue.getApproverIds().first() ) ).thenReturn( Optional.of( approver ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( contents );

        IssueNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( creator.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            createdParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssueCreated( params ) );

        final SendMailParams msg = getMessageSent();
        verifyRecipients( msg, Set.of( approver.getEmail() ) );
        verifyIssueLink( msg );
        verify( securityService, times( 2 ) ).getUser( any() );
        verify( mailService, times( 1 ) ).send( any( SendMailParams.class ) );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyIssueCreatedBySingleApprover()
        throws InterruptedException
    {
        final User creator = generateUser();
        final User approver = generateUser();
        final Issue issue = createIssue( creator.getKey(), PrincipalKeys.from( approver.getKey() ) );
        final Contents contents = Contents.empty();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        when( securityService.getUser( issue.getApproverIds().first() ) ).thenReturn( Optional.of( approver ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( contents );

        IssueNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( creator.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            createdParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssueCreated( params ) );

        verify( securityService, times( 2 ) ).getUser( any() );
        verify( mailService, never() ).send( any( SendMailParams.class ) );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyIssueCreatedByOneOfApprovers()
        throws Exception
    {
        final User creator = generateUser();
        final List<User> approvers = Arrays.asList( generateUser(), generateUser( "other@user.com" ), generateUser( "more@user.com" ) );
        final PrincipalKeys approverIds =
            PrincipalKeys.from( approvers.stream().map( approver -> approver.getKey() ).collect( Collectors.toList() ) );
        final Issue issue = createIssue( creator.getKey(), approverIds );
        final Contents contents = Contents.empty();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        approvers.stream()
            .forEach( approver -> when( securityService.getUser( approver.getKey() ) ).thenReturn( Optional.of( approver ) ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( contents );

        IssueNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( creator.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            createdParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssueCreated( params ) );

        final SendMailParams msg = getMessageSent();
        verifyRecipients( msg, Set.of( approvers.get( 1 ).getEmail(), approvers.get( 2 ).getEmail() ) );
        verifyIssueLink( msg );
        verify( securityService, times( 4 ) ).getUser( any() );
        verify( mailService, times( 1 ) ).send( any( SendMailParams.class ) );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyExistingIssueAssigned()
        throws Exception
    {
        final User creator = generateUser();
        final User modifier = generateUser( "modifier@user.com" );
        final List<User> approvers =
            Arrays.asList( generateUser( "modifier@user.com" ), generateUser( "other@user.com" ), generateUser( "more@user.com" ) );
        final PrincipalKeys approverIds =
            PrincipalKeys.from( approvers.stream().map( approver -> approver.getKey() ).collect( Collectors.toList() ) );
        final Issue issue = createIssue( creator.getKey(), modifier.getKey(), approverIds );
        final Contents contents = Contents.empty();

        when( securityService.getUser( issue.getModifier() ) ).thenReturn( Optional.of( modifier ) );
        approvers.stream()
            .forEach( approver -> when( securityService.getUser( approver.getKey() ) ).thenReturn( Optional.of( approver ) ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( contents );

        IssueNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( creator.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            createdParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssueCreated( params ) );

        final SendMailParams msg = getMessageSent();
        verifyRecipients( msg, approvers.stream().map( approver -> approver.getEmail() ).collect( Collectors.toSet() ) );
        verifyIssueLink( msg );
        verify( securityService, times( 4 ) ).getUser( any() );
        verify( mailService, times( 1 ) ).send( any( SendMailParams.class ) );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    private void verifyRecipients( final SendMailParams msg, final Set<String> recipients )
        throws Exception
    {
        final Set<String> allRecipients = new HashSet<>();
        allRecipients.addAll( msg.getTo() );
        allRecipients.addAll( msg.getCc() );
        allRecipients.addAll( msg.getBcc() );

        assertEquals( recipients, allRecipients );
    }

    private SendMailParams getMessageSent()
        throws Exception
    {
        verify( mailService ).send( mailCaptor.capture() );
        SendMailParams msg = mailCaptor.getValue();
        return msg;
    }

    private void verifyIssueLink( final SendMailParams msg )
        throws Exception
    {
        assertTrue( msg.getBody().contains( "url/main#/myproject/issue" ) );
    }

    private void verifyIssueLink( final SendMailParams msg, final String link )
        throws Exception
    {
        assertTrue( msg.getBody().contains( link ) );
    }

    @Test
    public void testNotifyIssueUpdated()
        throws Exception
    {
        final User creator = generateUser();
        final User approver = generateUser( "other@user.com" );
        final Issue issue = createIssue( creator.getKey(), PrincipalKeys.from( approver.getKey() ) );
        final Content content = Content.create().
            id( ContentId.from( "aaa" ) ).
            type( ContentTypeName.folder() ).
            name( "name" ).
            parentPath( ContentPath.from( "/aaa" ) ).
            build();

        final CompareContentResults compareResults = CompareContentResults.create().
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "aaa" ) ) ).
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "contentId2" ) ) ).
            build();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        when( securityService.getUser( issue.getApproverIds().first() ) ).thenReturn( Optional.of( approver ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( content ) );
        when( contentService.compare( any( CompareContentsParams.class ) ) ).thenReturn( compareResults );
        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) )
            .thenReturn( ContentType.create()
                             .name( "mycontenttype" )
                             .icon( Icon.from( new byte[]{1}, "image/svg+xml", Instant.now() ) )
                             .setBuiltIn( true )
                             .build() );

        IssueUpdatedNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( creator.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            updatedParams();

        createContextRepo( "repoid" ).runWith( () -> issueNotificationsSender.notifyIssueUpdated( params ) );

        final SendMailParams msg = getMessageSent();
        verifyRecipients( msg, Set.of( approver.getEmail(), creator.getEmail() ) );
        verifyIssueLink( msg, "url/main#/repoid/issue" );
        verify( mailService, times( 1 ) ).send( any( SendMailParams.class ) );
        verify( securityService, times( 2 ) ).getUser( any() );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyIssueUpdatedByCreator()
        throws Exception
    {
        final User creator = User.ANONYMOUS;
        final Issue issue = createIssue( creator.getKey(), PrincipalKeys.empty() );
        final Content content = Content.create().
            id( ContentId.from( "aaa" ) ).
            type( ContentTypeName.folder() ).
            name( "name" ).
            parentPath( ContentPath.from( "/aaa" ) ).
            build();

        final CompareContentResults compareResults = CompareContentResults.create().
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "aaa" ) ) ).
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "contentId2" ) ) ).
            build();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( content ) );
        when( contentService.compare( any( CompareContentsParams.class ) ) ).thenReturn( compareResults );
        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) )
            .thenReturn( ContentType.create()
                             .name( "mycontenttype" )
                             .icon( Icon.from( new byte[]{1}, "image/svg+xml", Instant.now() ) )
                             .setBuiltIn( true )
                             .build() );

        IssueUpdatedNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( creator.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            updatedParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssueCreated( params ) );

        verify( mailService, never() ).send( any( SendMailParams.class ) );
        verify( securityService, times( 1 ) ).getUser( any() );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyIssueUpdatedByOneOfApprovers()
        throws Exception
    {
        final User creator = generateUser();
        final List<User> approvers = Arrays.asList( User.ANONYMOUS, generateUser( "other@user.com" ), generateUser( "more@user.com" ) );
        final PrincipalKeys approverIds =
            PrincipalKeys.from( approvers.stream().map( approver -> approver.getKey() ).collect( Collectors.toList() ) );
        final Issue issue = createIssue( creator.getKey(), approverIds );
        final Content content = Content.create().
            id( ContentId.from( "aaa" ) ).
            type( ContentTypeName.folder() ).
            name( "name" ).
            parentPath( ContentPath.from( "/aaa" ) ).
            build();

        final CompareContentResults compareResults = CompareContentResults.create().
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "aaa" ) ) ).
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "contentId2" ) ) ).
            build();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        approvers.stream()
            .forEach( approver -> when( securityService.getUser( approver.getKey() ) ).thenReturn( Optional.of( approver ) ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( content ) );
        when( contentService.compare( any( CompareContentsParams.class ) ) ).thenReturn( compareResults );
        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) )
            .thenReturn( ContentType.create()
                             .name( "mycontenttype" )
                             .icon( Icon.from( new byte[]{1}, "image/svg+xml", Instant.now() ) )
                             .setBuiltIn( true )
                             .build() );

        IssueUpdatedNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( creator.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            updatedParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssueUpdated( params ) );

        final SendMailParams msg = getMessageSent();
        verifyRecipients( msg, Set.of( approvers.get( 1 ).getEmail(), approvers.get( 2 ).getEmail(), creator.getEmail() ) );
        verifyIssueLink( msg );
        verify( mailService, times( 1 ) ).send( any( SendMailParams.class ) );
        verify( securityService, times( 4 ) ).getUser( any() );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyIssueCommented()
        throws Exception
    {
        final User creator = generateUser();
        final User approver = generateUserNoEmail();
        final Issue issue = createIssue( creator.getKey(), PrincipalKeys.from( approver.getKey() ) );
        final Content content = Content.create().
            id( ContentId.from( "aaa" ) ).
            type( ContentTypeName.folder() ).
            name( "name" ).
            parentPath( ContentPath.from( "/aaa" ) ).
            build();
        final Contents contents = Contents.from( content );
        final CompareContentResults compareResults = CompareContentResults.create().
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "aaa" ) ) ).
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "contentId2" ) ) ).
            build();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        when( securityService.getUser( issue.getApproverIds().first() ) ).thenReturn( Optional.of( approver ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( contents );
        when( contentService.compare( any( CompareContentsParams.class ) ) ).thenReturn( compareResults );
        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) )
            .thenReturn( ContentType.create()
                             .name( "mycontenttype" )
                             .icon( Icon.from( new byte[]{1}, "image/svg+xml", Instant.now() ) )
                             .setBuiltIn( true )
                             .build() );

        IssueCommentedNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( User.ANONYMOUS.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            commentedParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssueCommented( params ) );

        final SendMailParams msg = getMessageSent();
        verifyRecipients( msg, Set.of( creator.getEmail() ) );
        verifyIssueLink( msg );
        verify( mailService, times( 1 ) ).send( any( SendMailParams.class ) );
        verify( securityService, times( 2 ) ).getUser( any() );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyIssueCommentedBySingleApprover()
        throws Exception
    {
        final User creator = generateUserNoEmail();
        final User approver = User.ANONYMOUS;
        final Issue issue = createIssue( creator.getKey(), PrincipalKeys.from( approver.getKey() ) );
        final Content content = Content.create().
            id( ContentId.from( "aaa" ) ).
            type( ContentTypeName.folder() ).
            name( "name" ).
            parentPath( ContentPath.from( "/aaa" ) ).
            build();
        final Contents contents = Contents.from( content );
        final CompareContentResults compareResults = CompareContentResults.create().
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "aaa" ) ) ).
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "contentId2" ) ) ).
            build();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        when( securityService.getUser( issue.getApproverIds().first() ) ).thenReturn( Optional.of( approver ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( contents );
        when( contentService.compare( any( CompareContentsParams.class ) ) ).thenReturn( compareResults );
        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) )
            .thenReturn( ContentType.create()
                             .name( "mycontenttype" )
                             .icon( Icon.from( new byte[]{1}, "image/svg+xml", Instant.now() ) )
                             .setBuiltIn( true )
                             .build() );

        IssueCommentedNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( User.ANONYMOUS.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            commentedParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssueCommented( params ) );

        verify( mailService, never() ).send( any( SendMailParams.class ) );
        verify( securityService, times( 2 ) ).getUser( any() );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyIssueCommentedByOneOfApprovers()
        throws Exception
    {
        final User creator = generateUser();
        final List<User> approvers = Arrays.asList( User.ANONYMOUS, generateUser( "other@user.com" ) );
        final PrincipalKeys approverIds =
            PrincipalKeys.from( approvers.stream().map( approver -> approver.getKey() ).collect( Collectors.toList() ) );
        final Issue issue = createIssue( creator.getKey(), approverIds );
        final Content content = Content.create().
            id( ContentId.from( "aaa" ) ).
            type( ContentTypeName.folder() ).
            name( "name" ).
            parentPath( ContentPath.from( "/aaa" ) ).
            build();
        final Contents contents = Contents.from( content );
        final CompareContentResults compareResults = CompareContentResults.create().
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "aaa" ) ) ).
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "contentId2" ) ) ).
            build();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        approvers.stream()
            .forEach( approver -> when( securityService.getUser( approver.getKey() ) ).thenReturn( Optional.of( approver ) ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( contents );
        when( contentService.compare( any( CompareContentsParams.class ) ) ).thenReturn( compareResults );
        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) )
            .thenReturn( ContentType.create()
                             .name( "mycontenttype" )
                             .icon( Icon.from( new byte[]{1}, "image/svg+xml", Instant.now() ) )
                             .setBuiltIn( true )
                             .build() );

        IssueCommentedNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( User.ANONYMOUS.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            commentedParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssueCommented( params ) );

        final SendMailParams msg = getMessageSent();
        verifyRecipients( msg, Set.of( approvers.get( 1 ).getEmail(), creator.getEmail() ) );
        verifyIssueLink( msg );
        verify( mailService, times( 1 ) ).send( any( SendMailParams.class ) );
        verify( securityService, times( 3 ) ).getUser( any() );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyIssuePublished()
        throws Exception
    {
        final User creator = generateUser();
        final User approver = generateUser( "other@user.com" );
        final Issue issue = createIssue( creator.getKey(), PrincipalKeys.from( approver.getKey() ) );
        final Contents contents = Contents.empty();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        when( securityService.getUser( issue.getApproverIds().first() ) ).thenReturn( Optional.of( approver ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( contents );

        IssuePublishedNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( creator.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            publishedParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssuePublished( params ) );

        final SendMailParams msg = getMessageSent();
        verifyRecipients( msg, Set.of( approver.getEmail(), creator.getEmail() ) );
        verifyIssueLink( msg );
        verify( mailService, times( 1 ) ).send( any( SendMailParams.class ) );
        verify( securityService, times( 2 ) ).getUser( any() );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyIssuePublishedByCreator()
        throws Exception
    {
        final User creator = User.ANONYMOUS;
        final User approver = generateUserNoEmail();
        final Issue issue = createIssue( creator.getKey(), PrincipalKeys.from( approver.getKey() ) );
        final Contents contents = Contents.empty();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        when( securityService.getUser( approver.getKey() ) ).thenReturn( Optional.of( approver ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( contents );

        IssuePublishedNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( creator.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            publishedParams();

        createContextRepo( "myproject" ).runWith( () -> issueNotificationsSender.notifyIssuePublished( params ) );

        verify( mailService, never() ).send( any( SendMailParams.class ) );
        verify( securityService, times( 2 ) ).getUser( any() );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    @Test
    public void testNotifyIssuePublishedByOneOfApprovers()
        throws Exception
    {
        final User creator = generateUser();
        final List<User> approvers = Arrays.asList( User.ANONYMOUS, generateUser( "other@user.com" ) );
        final PrincipalKeys approverIds =
            PrincipalKeys.from( approvers.stream().map( approver -> approver.getKey() ).collect( Collectors.toList() ) );
        final Issue issue = createIssue( creator.getKey(), approverIds );
        final Content content = Content.create().
            id( ContentId.from( "aaa" ) ).
            type( ContentTypeName.folder() ).
            name( "name" ).
            parentPath( ContentPath.from( "/aaa" ) ).
            build();
        final Contents contents = Contents.from( content );
        final CompareContentResults compareResults = CompareContentResults.create().
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "aaa" ) ) ).
            add( new CompareContentResult( CompareStatus.NEW, ContentId.from( "contentId2" ) ) ).
            build();

        when( securityService.getUser( issue.getCreator() ) ).thenReturn( Optional.of( creator ) );
        approvers.stream()
            .forEach( approver -> when( securityService.getUser( approver.getKey() ) ).thenReturn( Optional.of( approver ) ) );
        when( contentService.getByIds( any( GetContentByIdsParams.class ) ) ).thenReturn( contents );
        when( contentService.compare( any( CompareContentsParams.class ) ) ).thenReturn( compareResults );
        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) )
            .thenReturn( ContentType.create()
                             .name( "mycontenttype" )
                             .icon( Icon.from( new byte[]{1}, "image/svg+xml", Instant.now() ) )
                             .setBuiltIn( true )
                             .build() );

        IssuePublishedNotificationParams params = notificationFactoryBuilder.
            issue( issue ).
            comments( this.createComments( creator.getKey() ) ).
            url( "url" ).
            localeService( localeService ).
            locales( Collections.enumeration( Collections.singleton( Locale.US ) ) ).
            build().
            publishedParams();

        createContextRepo( "testrepo" ).runWith( () -> issueNotificationsSender.notifyIssuePublished( params ) );

        final SendMailParams msg = getMessageSent();
        verifyRecipients( msg, Set.of( approvers.get( 1 ).getEmail(), creator.getEmail() ) );
        verifyIssueLink( msg, "url/main#/testrepo/issue" );
        verify( mailService, times( 1 ) ).send( any( SendMailParams.class ) );
        verify( securityService, times( 3 ) ).getUser( any() );
        verify( contentService, times( 1 ) ).getByIds( any() );
        verify( contentService, times( 1 ) ).compare( any( CompareContentsParams.class ) );
    }

    private Context createContextRepo( final String projectName )
    {
        return ContextBuilder.
            from( ContextAccessor.current() ).
            repositoryId( ProjectName.from( projectName ).getRepoId() ).
            branch( ContentConstants.BRANCH_DRAFT ).
            build();
    }

    private Issue createIssue( final PrincipalKey creator, final PrincipalKeys approvers )
    {
        return createIssue( creator, null, approvers );
    }

    private Issue createIssue( final PrincipalKey creator, final PrincipalKey modifier, final PrincipalKeys approvers )
    {
        return Issue.create()
            .
                id( IssueId.create() )
            .
                title( "title" )
            .
                description( "description" )
            .
                creator( creator )
            .
                createdTime( Instant.now().minus( 3, ChronoUnit.MINUTES ) )
            .
                modifier( modifier )
            .
                modifiedTime( modifier != null ? Instant.now() : null )
            .
                addApproverIds( approvers )
            .setPublishRequest( PublishRequest.create()
                                    .addExcludeId( ContentId.from( "exclude-id" ) )
                                    .addItem(
                                        PublishRequestItem.create().id( ContentId.from( "content-id" ) ).includeChildren( true ).build() )
                                    .build() )
            .build();
    }

    private List<IssueComment> createComments( final PrincipalKey creator )
    {
        final IssueComment comment = IssueComment.create().
            text( "Comment One" ).
            creator( creator ).
            creatorDisplayName( "Creator" ).
            build();
        return List.of( comment );
    }

    private User generateUser( final String email )
    {
        final String userId = UUID.randomUUID().toString();
        final User.Builder builder =
            User.create().key( PrincipalKey.ofUser( IdProviderKey.createDefault(), userId ) ).login( userId ).displayName( "Some User" );
        if ( email != null )
        {
            builder.email( email );
        }

        return builder.build();
    }

    private User generateUser()
    {
        return generateUser( "some@user.com" );
    }

    private User generateUserNoEmail()
    {
        return generateUser( null );
    }
}
