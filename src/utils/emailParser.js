exports.parseEmailContent = (emailContent) => {
    const applicationData = {};

    // Example parsing logic
    const applicationMatch = emailContent.match(/Application ID: (\w+)/);
    const statusMatch = emailContent.match(/Status: (\w+)/);
    const interviewMatch = emailContent.match(/Interview Date: (\d{4}-\d{2}-\d{2})/);

    if (applicationMatch) {
        applicationData.applicationId = applicationMatch[1];
    }
    if (statusMatch) {
        applicationData.status = statusMatch[1];
    }
    if (interviewMatch) {
        applicationData.interviewDate = new Date(interviewMatch[1]);
    }

    return applicationData;
};

exports.extractRelevantInfo = (emails) => {
    return emails.map(email => {
        return this.parseEmailContent(email.body);
    });
};