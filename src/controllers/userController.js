const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/User');

class UserController {
    async register(req, res) {
        try {
            const { username, email, password } = req.body;
            if (!username || !email || !password) {
                return res.status(400).json({ message: 'username, email and password are required' });
            }
            const existing = await User.findOne({ $or: [{ email }, { username }] });
            if (existing) {
                return res.status(409).json({ message: 'User already exists' });
            }
            const hash = await bcrypt.hash(password, 10);
            const user = await User.create({ username, email, password: hash });
            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
            return res.status(201).json({ token, user: { id: user._id, username, email } });
        } catch (err) {
            return res.status(500).json({ message: 'Registration failed', error: err.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'email and password are required' });
            const user = await User.findOne({ email });
            if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });
            const ok = await bcrypt.compare(password, user.password);
            if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
            return res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
        } catch (err) {
            return res.status(500).json({ message: 'Login failed', error: err.message });
        }
    }
    
    async logout(req, res) {
        // Stateless JWT logout handled on client by discarding token.
        return res.json({ message: 'Logged out' });
    }

    async getUserProfile(req, res) {
        try {
            const user = await User.findById(req.user.id).select('-password -googleTokens');
            if (!user) return res.status(404).json({ message: 'User not found' });
            return res.json(user);
        } catch (err) {
            return res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
        }
    }

    async updateUserProfile(req, res) {
        try {
            const updates = {};
            if (req.body.username) updates.username = req.body.username;
            if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 10);
            const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password -googleTokens');
            return res.json(user);
        } catch (err) {
            return res.status(500).json({ message: 'Failed to update profile', error: err.message });
        }
    }

    // Google OAuth initiate: returns URL
    async googleInitiate(req, res) {
        try {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET,
                process.env.GMAIL_REDIRECT_URI
            );
            const scopes = [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ];
            const url = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                prompt: 'consent',
                scope: scopes
            });
            return res.json({ url });
        } catch (err) {
            return res.status(500).json({ message: 'Failed to initiate Google OAuth', error: err.message });
        }
    }

    // Google OAuth callback: exchange code, upsert user, return JWT
    async googleCallback(req, res) {
        try {
            const { code } = req.query;
            if (!code) return res.status(400).json({ message: 'Missing code' });
            const oauth2Client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET,
                process.env.GMAIL_REDIRECT_URI
            );
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const me = await oauth2.userinfo.get();
            const { id: googleId, email, name } = me.data;

            let user = await User.findOne({ $or: [{ googleId }, { email }] });
            if (!user) {
                user = await User.create({ username: name || email.split('@')[0], email, googleId, googleTokens: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    tokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
                }});
            } else {
                user.googleId = googleId;
                user.googleTokens = {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token || user.googleTokens?.refreshToken,
                    tokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : user.googleTokens?.tokenExpiryDate,
                };
                await user.save();
            }

            const jwtToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
            return res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email } });
        } catch (err) {
            return res.status(500).json({ message: 'Google OAuth failed', error: err.message });
        }
    }
}

module.exports = UserController;