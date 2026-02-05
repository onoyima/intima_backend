import { storage } from "./storage";

const ICEBREAKERS = [
    "If our connection was a song, what genre would it be?",
    "What's your most controversial opinion about modern dating?",
    "What's the best way to spend a rainy afternoon together?",
    "What's one thing on your bucket list that most people would find surprising?",
    "Slow and passionate or playful and kinky? What's your dominant mood today?",
    "If we could teleport anywhere in the world right now, where would you take me?",
    "What's your secret 'guilty pleasure' that you rarely tell anyone about?",
    "Would you rather have a deep conversation under the stars or a playful night in a private club?"
];

export async function getIcebreaker(coupleId: number): Promise<string> {
    // In a real app, we would use the couple's interest profile to tailor this
    const random = Math.floor(Math.random() * ICEBREAKERS.length);
    return ICEBREAKERS[random];
}

export async function registerAIRoutes(app: any) {
    app.post("/api/ai/icebreaker", async (req: any, res: any) => {
        const { coupleId } = req.body;
        const suggestion = await getIcebreaker(coupleId);
        res.json({ suggestion });
    });

    app.post("/api/ai/fantasy", async (req: any, res: any) => {
        const { tags, style } = req.body;
        const fantasy = {
            title: `${style} Fantasy: ${tags?.[0] || 'A Secret Encounter'}`,
            act1: "The atmosphere is thick with anticipation as you both meet in a dimly lit, private lounge...",
            act2: "Slowly, the tension builds. Every touch feels electric, every whisper a promise of what's to come...",
            act3: "Finally, the world outside vanishes as you both surrender to the moment, lost in each other...",
            suggestion: "Why not try incorporating a blindfold to heighten the other senses?"
        };
        res.json(fantasy);
    });

    app.post("/api/ai/tease", async (req: any, res: any) => {
        const { mode } = req.body;
        const teasers: Record<string, string[]> = {
            romantic: ["I was just thinking about the way you looked today...", "I wish I could hold you right now."],
            playful: ["I bet I can make you blush in 3 words...", "Stop being so cute, it's distracting."],
            erotic: ["I'm currently imagining what I'd do if you were here...", "My hands are missing the curve of your waist."],
            healing: ["Checking in on you. I'm here if you need to vent.", "Take a deep breath, you're doing amazing."]
        };
        const list = teasers[mode?.toLowerCase()] || teasers.romantic;
        res.json({ suggestion: list[Math.floor(Math.random() * list.length)] });
    });

    app.post("/api/ai/repair", async (req: any, res: any) => {
        const suggestions = [
            "I value our connection more than being right. Can we talk?",
            "I'm feeling a bit disconnected, can we just hold each other for a second?",
            "I hear what you're saying, and I want to understand better.",
            "Help me understand how my actions affected you."
        ];
        res.json({ suggestion: suggestions[Math.floor(Math.random() * suggestions.length)] });
    });

    app.post("/api/ai/consent/log", async (req: any, res: any) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const { action, partnerId } = req.body;
        await storage.logConsent((req.user as any).id, action, partnerId);
        res.json({ success: true });
    });

    /**
     * SECTION J: Relationship & Marital Issue Solver
     */
    app.post("/api/ai/solve", async (req: any, res: any) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const { issue, severity } = req.body;
        const userId = (req.user as any).id;

        // Fetch preferences for better context
        const prefs = await storage.getUserPreferences(userId);

        const solutions: Record<string, string> = {
            libido_mismatch: "Libido mismatch is natural. Based on your preference for 'Sensual' connection, try focusing on non-sexual touch for 3 days to rebuild intimacy without pressure.",
            communication: "Communication gaps often stem from fear of judgment. Try the 'Healing' mode in your chat vault to discuss boundaries safely.",
            distance: "Emotional distance can be bridged with small shared rituals. Try a 'Playful' game session to rediscover your shared spark.",
            trust: "Rebuilding trust starts with transparency. Use the 'Check-in' feature to share your daily feelings without accusation.",
            routine: "Boredom is the enemy of desire. Surprise your partner with a 'Fantasy' card from the game deck tonight.",
            default: "Relationship growth requires patience. Focus on active listening and validating your partner's feelings."
        };

        let type = 'default';
        const lowerIssue = issue?.toLowerCase() || '';
        if (lowerIssue.includes('libido') || lowerIssue.includes('sex')) type = 'libido_mismatch';
        else if (lowerIssue.includes('talk') || lowerIssue.includes('listen') || lowerIssue.includes('communicat')) type = 'communication';
        else if (lowerIssue.includes('distant') || lowerIssue.includes('apart')) type = 'distance';
        else if (lowerIssue.includes('trust') || lowerIssue.includes('cheat')) type = 'trust';
        else if (lowerIssue.includes('boring') || lowerIssue.includes('routine')) type = 'routine';

        res.json({
            advice: solutions[type],
            style: prefs?.sexStyle || "Unknown",
            intensity: prefs?.intensityPreference || 1
        });
    });

    const INSIGHTS = [
        "Connection isn't just about presence, it's about the quality of the gaps in between. Try a 5-minute deep eye contact session today.",
        "Vulnerability is the currency of intimacy. Share one fear with your partner tonight.",
        "Touch releases oxytocin, reducing stress. Hold hands for 5 minutes without saying a word.",
        "Your partner's 'complaints' are often hidden requests for love. Listen for the need behind the words.",
        "Passion is a discipline. Schedule 20 minutes of 'us time' with no phones allowed."
    ];

    app.get("/api/ai/insight", async (_req: any, res: any) => {
        const insight = INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)];
        res.json({ insight });
    });
}
