# Email Notification Setup

This application includes equipment expiration email notifications. To enable email sending, you need to integrate with an email service provider.

## Recommended Email Services

### 1. Resend (Recommended)
- Simple API and great developer experience
- Free tier: 100 emails/day
- Website: https://resend.com

**Setup:**
1. Sign up at https://resend.com
2. Get your API key
3. Add to environment variables: `RESEND_API_KEY=your_key_here`
4. Uncomment the Resend code in `/app/api/cron/check-equipment/route.ts`

### 2. SendGrid
- Reliable and scalable
- Free tier: 100 emails/day
- Website: https://sendgrid.com

### 3. AWS SES
- Cost-effective for high volume
- Requires AWS account

## Setting Up Cron Jobs

The email notification system requires a cron job to run periodically. You can set this up in Vercel:

1. Go to your Vercel project settings
2. Navigate to "Cron Jobs"
3. Add a new cron job:
   - **Path:** `/api/cron/check-equipment`
   - **Schedule:** `0 9 * * *` (runs daily at 9 AM)
   - **Description:** Check for expiring equipment and send notifications

## Testing Notifications

You can manually trigger the notification check by calling:
\`\`\`bash
curl -X GET https://your-domain.com/api/cron/check-equipment
\`\`\`

## Current Behavior

Without an email service configured, the system will:
- Log email content to the console
- Mark equipment as notified in the database
- Track which equipment needs notifications

Once you configure an email service, emails will be sent automatically.
