"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const academic_routes_js_1 = __importDefault(require("./routes/academic.routes.js"));
const housing_routes_js_1 = __importDefault(require("./routes/housing.routes.js"));
const complaints_routes_js_1 = __importDefault(require("./routes/complaints.routes.js"));
const fees_routes_js_1 = __importDefault(require("./routes/fees.routes.js"));
const dining_routes_js_1 = __importDefault(require("./routes/dining.routes.js"));
const events_routes_js_1 = __importDefault(require("./routes/events.routes.js"));
const notifications_routes_js_1 = __importDefault(require("./routes/notifications.routes.js"));
const admin_routes_js_1 = __importDefault(require("./routes/admin.routes.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Middlewares
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health Check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'online',
        portal: 'Rishihood One Academic & Housing Portal',
        institution: 'Rishihood University, Sonipat',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use('/api/auth', auth_routes_js_1.default);
app.use('/api/academic', academic_routes_js_1.default);
app.use('/api/housing', housing_routes_js_1.default);
app.use('/api/complaints', complaints_routes_js_1.default);
app.use('/api/fees', fees_routes_js_1.default);
app.use('/api/dining', dining_routes_js_1.default);
app.use('/api/events', events_routes_js_1.default);
app.use('/api/notifications', notifications_routes_js_1.default);
app.use('/api/admin', admin_routes_js_1.default);
// Error handling middleware
app.use(errorHandler_js_1.errorHandler);
// Start Server
app.listen(PORT, () => {
    console.log(`🏛️ Rishihood One Backend running on http://localhost:${PORT}`);
    console.log(`📍 Institution: Rishihood University, Sonipat, Haryana`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
