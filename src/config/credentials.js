module.exports = {
    gmail: {
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        redirectUri: process.env.GMAIL_REDIRECT_URI,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
    MONGODB_URI: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
};