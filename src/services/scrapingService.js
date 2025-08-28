const { parseEmailContent } = require('../utils/emailParser');

class ScrapingService {
    constructor(gmailService) {
        this.gmailService = gmailService;
    }

    async scrapeApplicationDataFromMessage(message) {
        const body = this.gmailService.getMessageBody(message);
        const parsed = parseEmailContent(body || '');
        return {
            applicationId: parsed.applicationId,
            applicationStatus: parsed.status,
            interviewDate: parsed.interviewDate || null,
            notes: '',
            sourceEmailId: message.id,
        };
    }

    async processEmails() {
        const messages = await this.gmailService.listMessages();
        const applicationDataList = [];
        for (const msg of messages) {
            const full = await this.gmailService.getMessage('me', msg.id);
            const data = await this.scrapeApplicationDataFromMessage(full);
            applicationDataList.push(data);
        }
        return applicationDataList;
    }
}

module.exports = ScrapingService;