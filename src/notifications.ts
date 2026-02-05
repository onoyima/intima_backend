import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

export async function sendPushNotification(
    pushToken: string | null | undefined,
    title: string,
    body: string,
    type: string,
    data?: any
) {
    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
        console.log(`No valid push token provided.`);
        return;
    }

    // 3. Construct the message
    const messages: ExpoPushMessage[] = [{
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: { ...data, type },
    }];

    // 4. Send the notification
    try {
        const ticketChunk = await expo.sendPushNotificationsAsync(messages);
        console.log('Notification sent successfully:', ticketChunk);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}
