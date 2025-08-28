const { google } = require('googleapis');

class GmailService {
    constructor(auth) {
        this.auth = auth;
        this.gmail = google.gmail({ version: 'v1', auth });
    }

    async listMessages({ userId = 'me', pageToken = null, maxResults = 25, query = 'subject:PhD' } = {}) {
        try {
            const response = await this.gmail.users.messages.list({
                userId,
                pageToken,
                maxResults,
                q: query,
            });
            return response.data.messages || [];
        } catch (error) {
            throw new Error('Error fetching emails: ' + error.message);
        }
    }

    async getMessage(userId, messageId) {
        try {
            const response = await this.gmail.users.messages.get({
                userId,
                id: messageId,
                format: 'full',
            });
            return response.data;
        } catch (error) {
            throw new Error('Error fetching email details: ' + error.message);
        }
    }

    getMessageBody(message) {
        // Try to get the plain/text or html body
        const parts = message.payload?.parts || [];
        let data = message.payload?.body?.data;
        if (!data && parts && parts.length) {
            // search for text/plain first
            const plain = parts.find(p => p.mimeType === 'text/plain' && p.body?.data);
            const html = parts.find(p => p.mimeType === 'text/html' && p.body?.data);
            data = (plain || html || parts[0]).body?.data;
        }
        if (!data) return '';
        const buff = Buffer.from(data, 'base64');
        return buff.toString('utf-8');
    }
}

module.exports = GmailService;