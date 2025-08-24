module.exports = {
    gmail: {
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        redirectUri: process.env.GMAIL_REDIRECT_URI,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
    mongoURI: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
};