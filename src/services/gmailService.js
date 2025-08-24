class GmailService {
    constructor(auth) {
        this.auth = auth;
        this.gmail = require('@googleapis/gmail').gmail({ version: 'v1', auth });
    }

    async fetchEmails(userId = 'me', pageToken = null) {
        try {
            const response = await this.gmail.users.messages.list({
                userId,
                pageToken,
                maxResults: 10,
                q: 'subject:PhD'
            });
            return response.data.messages || [];
        } catch (error) {
            throw new Error('Error fetching emails: ' + error.message);
        }
    }

    async getEmailDetails(userId, messageId) {
        try {
            const response = await this.gmail.users.messages.get({
                userId,
                id: messageId,
                format: 'full'
            });
            return response.data;
        } catch (error) {
            throw new Error('Error fetching email details: ' + error.message);
        }
    }
}

module.exports = GmailService;