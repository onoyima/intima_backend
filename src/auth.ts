import passport from "passport";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import type { Express } from "express";
import { users } from "@shared/schema";
import { db, connection } from "./db";
import { eq } from "drizzle-orm";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Initialize MySQL Session Store
const MySQLStore = MySQLStoreFactory(session as any);

export function setupAuth(app: Express) {
    const sessionStore = new MySQLStore({
        clearExpired: true,
        checkExpirationInterval: 900000,
        expiration: 86400000,
        createDatabaseTable: true,
        schema: {
            tableName: 'sessions',
            columnNames: {
                session_id: 'sid',
                expires: 'expire',
                data: 'sess'
            }
        }
    }, connection as any);

    app.use(session({
        secret: process.env.SESSION_SECRET || "intima_secret_key",
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // Google Strategy
    if (process.env.GOOGLE_CLIENT_ID) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
        }, async (_token, _tokenSecret, profile, done) => {
            try {
                const email = profile.emails?.[0].value || "";
                const [existing] = await db.select().from(users).where(eq(users.email, email));

                if (existing) return done(null, existing);

                const { storage } = await import("./storage");
                const newUser = await storage.createUser({
                    email: email,
                    firstName: profile.name?.givenName || "New",
                    lastName: profile.name?.familyName || "User",
                    profileImageUrl: profile.photos?.[0].value,
                });

                done(null, newUser);
            } catch (err) {
                done(err);
            }
        }));
    }

    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const [user] = await db.select().from(users).where(eq(users.id, id));
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}

export function registerAuthRoutes(app: Express) {
    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get("/api/auth/google/callback",
        passport.authenticate("google", { failureRedirect: "/login" }),
        (req, res) => {
            // Check if we should redirect back to the mobile app
            const isMobile = req.session && (req.session as any).isMobile;
            if (isMobile) {
                delete (req.session as any).isMobile;
                // Redirect back to Expo Go using a common scheme
                return res.redirect("exp://135.129.124.12:8081");
            }
            res.redirect("/");
        }
    );

    app.get("/api/auth/user", (req, res) => {
        if (req.isAuthenticated()) {
            return res.json(req.user);
        }
        res.status(401).json({ message: "Not authenticated" });
    });

    app.get("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.redirect("/");
        });
    });

    // Development Login Bypass for Mobile/Local Testing
    app.post("/api/login", async (req, res) => {
        const { username } = req.body; // Using username as email for testing
        const email = username.includes("@") ? username : "testuser@intima.com";

        try {
            const [existing] = await db.select().from(users).where(eq(users.email, email));
            let user = existing;

            if (!user) {
                const { storage } = await import("./storage");
                user = await storage.createUser({
                    email: email,
                    firstName: "Test",
                    lastName: "User",
                    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Test",
                });
            }

            req.login(user, (err) => {
                if (err) return res.status(500).json({ message: "Login failed" });
                return res.json(user);
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // Helper to set session flag for mobile redirects
    app.get("/api/auth/mobile-init", (req, res) => {
        if (req.session) {
            (req.session as any).isMobile = true;
        }
        res.redirect("/api/auth/google");
    });
}
