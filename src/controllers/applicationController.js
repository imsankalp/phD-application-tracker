const { google } = require('googleapis');
const Application = require('../models/Application');
const User = require('../models/User');
const GmailService = require('../services/gmailService');
const ScrapingService = require('../services/scrapingService');

class ApplicationController {
    async createApplication(req, res) {
        try {
            const payload = { ...req.body, user: req.user.id };
            const app = await Application.create(payload);
            return res.status(201).json(app);
        } catch (err) {
            return res.status(500).json({ message: 'Failed to create application', error: err.message });
        }
    }

    async getAllApplications(req, res) {
        try {
            const apps = await Application.find({ user: req.user.id }).sort({ submissionDate: -1 });
            return res.json(apps);
        } catch (err) {
            return res.status(500).json({ message: 'Failed to fetch applications', error: err.message });
        }
    }

    async getApplicationById(req, res) {
        try {
            const app = await Application.findOne({ _id: req.params.id, user: req.user.id });
            if (!app) return res.status(404).json({ message: 'Not found' });
            return res.json(app);
        } catch (err) {
            return res.status(500).json({ message: 'Failed to fetch application', error: err.message });
        }
    }

    async updateApplication(req, res) {
        try {
            const app = await Application.findOneAndUpdate(
                { _id: req.params.id, user: req.user.id },
                req.body,
                { new: true }
            );
            if (!app) return res.status(404).json({ message: 'Not found' });
            return res.json(app);
        } catch (err) {
            return res.status(500).json({ message: 'Failed to update application', error: err.message });
        }
    }

    async deleteApplication(req, res) {
        try {
            const app = await Application.findOneAndDelete({ _id: req.params.id, user: req.user.id });
            if (!app) return res.status(404).json({ message: 'Not found' });
            return res.json({ success: true });
        } catch (err) {
            return res.status(500).json({ message: 'Failed to delete application', error: err.message });
        }
    }

    async getApplicationStatus(req, res) {
        try {
            const app = await Application.findOne({ _id: req.params.id, user: req.user.id }).select('applicationStatus');
            if (!app) return res.status(404).json({ message: 'Not found' });
            return res.json({ status: app.applicationStatus });
        } catch (err) {
            return res.status(500).json({ message: 'Failed to fetch status', error: err.message });
        }
    }

    async getInterviewSchedule(req, res) {
        try {
            const app = await Application.findOne({ _id: req.params.id, user: req.user.id }).select('interviewDate');
            if (!app) return res.status(404).json({ message: 'Not found' });
            return res.json({ interviewDate: app.interviewDate });
        } catch (err) {
            return res.status(500).json({ message: 'Failed to fetch interview schedule', error: err.message });
        }
    }

    // Sync applications from user's Gmail
    async syncFromGmail(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user || !user.googleTokens?.refreshToken) {
                return res.status(400).json({ message: 'Google account not connected' });
            }
            const oauth2Client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET,
                process.env.GMAIL_REDIRECT_URI
            );
            oauth2Client.setCredentials({
                refresh_token: user.googleTokens.refreshToken,
                access_token: user.googleTokens.accessToken,
                expiry_date: user.googleTokens.tokenExpiryDate ? new Date(user.googleTokens.tokenExpiryDate).getTime() : undefined,
            });

            const gmailService = new GmailService(oauth2Client);
            const scrapingService = new ScrapingService(gmailService);
            const items = await scrapingService.processEmails();

            const upserts = await Promise.all(items.map(async (item) => {
                const update = {
                    user: req.user.id,
                    applicationId: item.applicationId,
                    applicationStatus: item.applicationStatus || 'Submitted',
                    interviewDate: item.interviewDate || null,
                    notes: item.notes || '',
                    submissionDate: item.submissionDate || new Date(),
                };
                return Application.findOneAndUpdate(
                    { user: req.user.id, sourceEmailId: item.sourceEmailId },
                    { $set: update, $setOnInsert: { sourceEmailId: item.sourceEmailId } },
                    { new: true, upsert: true }
                );
            }));

            return res.json({ synced: upserts.length });
        } catch (err) {
            return res.status(500).json({ message: 'Sync failed', error: err.message });
        }
    }
}

module.exports = ApplicationController;