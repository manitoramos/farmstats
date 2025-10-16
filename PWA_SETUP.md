# Progressive Web App (PWA) Setup

This application is now a Progressive Web App with push notification support.

## Features

- **Installable**: Users can install the app on their device
- **Offline Support**: Basic caching for offline functionality
- **Push Notifications**: Receive alerts for expiring equipment

## Push Notifications Setup

To enable push notifications, you need to generate VAPID keys:

### 1. Generate VAPID Keys

\`\`\`bash
npx web-push generate-vapid-keys
\`\`\`

### 2. Add Environment Variables

Add the generated keys to your environment variables:

\`\`\`
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=your_email@example.com
\`\`\`

### 3. Install web-push Library

\`\`\`bash
npm install web-push
\`\`\`

### 4. Update Cron Job

Modify `/app/api/cron/check-equipment/route.ts` to send push notifications using the web-push library.

## Testing PWA

1. **Local Testing**: Use Chrome DevTools > Application > Service Workers
2. **Install Prompt**: Visit the app on mobile or use Chrome's install button
3. **Notifications**: Click "Enable Push Notifications" in the Equipment Alerts tab

## Production Deployment

When deploying to production:

1. Ensure HTTPS is enabled (required for PWA)
2. Set up proper caching strategies
3. Configure push notification service
4. Test on multiple devices and browsers

## Browser Support

- Chrome/Edge: Full support
- Safari: Limited push notification support
- Firefox: Full support
- Mobile browsers: Varies by platform
