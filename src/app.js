const express = require("express");
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(express.json());

app.use("/api", apiRoutes);
app.use("/auth", authRoutes);
app.use(errorHandler);


module.exports = app;
