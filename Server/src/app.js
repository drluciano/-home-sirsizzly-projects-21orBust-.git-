const express = require("express");
const path = require("path");

const deckRoutes = require("./routes/deckRoutes");
const roundRoutes = require("./routes/roundRoutes");
const runRoutes = require("./routes/runRoutes");
const runprogressionRoutes = require("./routes/runprogressionRoutes");
const runstateRoutes = require("./routes/runstateRoutes");
const shopRoutes = require("./routes/shopRoutes");

const app = express();

app.use(express.json());

// static assets – THIS IS THE LOCKED PATH
app.use("/images", express.static(path.join(__dirname, "..", "public")));

// api routes
app.use("/api/deck", deckRoutes);
app.use("/api/round", roundRoutes);
app.use("/api/run", runRoutes);
app.use("/api/run/progression", runprogressionRoutes);
app.use("/api/run/state", runstateRoutes);
app.use("/api/shop", shopRoutes);

module.exports = app;
