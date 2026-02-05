import { storage } from "./storage";
import { type Express } from "express";

export async function registerAdminRoutes(app: Express) {
    // Middleware to check if user is admin
    const requireAdmin = (req: any, res: any, next: any) => {
        if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
            return res.status(403).json({ message: "Admin access required" });
        }
        next();
    };

    app.get("/api/admin/stats", requireAdmin, async (req, res) => {
        const stats = await storage.getSystemStats();
        res.json(stats);
    });

    app.get("/api/admin/users", requireAdmin, async (req, res) => {
        const users = await storage.listAllUsers();
        res.json(users);
    });

    app.patch("/api/admin/users/:userId/role", requireAdmin, async (req, res) => {
        const { userId } = req.params;
        const { role } = req.body;
        const user = await storage.updateUserRole(userId, role);
        res.json(user);
    });

    app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
        const withdrawals = await storage.listAllWithdrawals();
        res.json(withdrawals);
    });

    app.post("/api/admin/withdrawals/:id/process", requireAdmin, async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        await storage.processWithdrawal(Number(id), status);
        res.json({ success: true });
    });

    app.get("/api/admin/audits", requireAdmin, async (req, res) => {
        const audits = await storage.listAudits();
        res.json(audits);
    });
}
