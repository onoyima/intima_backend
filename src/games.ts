export const TRUTHS = [
    "What was your first impression of me, and how has it changed?",
    "What's a fantasy you've never shared with anyone?",
    "What is the one thing I do that makes you feel most loved?",
    "What's your biggest 'turn-off' that I might not know about?",
    "If we could spend a whole day doing anything intimate, what would it be?",
    "What is your favorite part of my body, and why?",
    "What's the most adventurous place you've ever thought about having sex?",
    "What did you think was my most attractive quality when we met?",
];

export const DARES = [
    "Send me a voice note describing exactly what you want to do to me next time we meet.",
    "Give me a 5-minute massage (or describe one in detail if remote).",
    "Blindfold yourself for the next 10 minutes and let me guide your hands.",
    "Eat a piece of fruit in the most provocative way possible while I watch.",
    "Whisper your deepest desire in my ear for 60 seconds.",
    "Take off one piece of clothing of my choice.",
];

export const DESIRES = [
    "Choose a roleplay scenario for us to try tonight.",
    "Pick one 'taboo' topic we've never discussed and let's explore it for 10 minutes.",
    "Describe your perfect 'morning after' with me.",
    "Show me exactly how you like to be touched in a specific area.",
];

export const DATING_FUN = [
    "If we were characters in a romance movie, which ones would we be?",
    "Plan our dream getaway in 3 minutes. Go!",
    "What is the first thing you'd do if we won the lottery tomorrow?",
    "Re-enact our first kiss with a twist.",
];

export const SEX_STYLES = [
    "Try a position we've never tried before (or describe it).",
    "Experiment with 'Slow Burn' - no touching for the first 10 minutes of foreplay.",
    "Introduce a toy or accessory to our session tonight.",
    "Switch who is 'in charge' for the next 30 minutes.",
];

export async function registerGameRoutes(app: any) {
    const { storage } = await import("./storage");

    app.get("/api/games/content", (req: any, res: any) => {
        res.json({
            truths: TRUTHS,
            dares: DARES,
            desires: DESIRES,
            datingFun: DATING_FUN,
            sexStyles: SEX_STYLES
        });
    });

    app.post("/api/games/:sessionId/action", async (req: any, res: any) => {
        const { sessionId } = req.params;
        const { action, gameState } = req.body;
        const session = await storage.updateGameSession(Number(sessionId), { gameState });
        res.json(session);
    });
}
