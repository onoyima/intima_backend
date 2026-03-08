export const TRUTHS = [
    "What was your first impression of me, and how has it changed?",
    "What's a fantasy you've never shared with anyone?",
    "What is the one thing I do that makes you feel most loved?",
    "What's your biggest 'turn-off' that I might not know about?",
    "If we could spend a whole day doing anything intimate, what would it be?",
    "What is your favorite part of my body, and why?",
    "What's the most adventurous place you've ever thought about having sex?",
    "What did you think was my most attractive quality when we met?",
    "Describe your most memorable sexual experience with me.",
    "Is there anything you’ve wanted to try in bed but were afraid to ask?",
];

export const DARES = [
    "Send me a voice note describing exactly what you want to do to me next time we meet.",
    "Give me a 5-minute massage (or describe one in detail if remote).",
    "Blindfold yourself for the next 10 minutes and let me guide your hands.",
    "Eat a piece of fruit in the most provocative way possible while I watch.",
    "Whisper your deepest desire in my ear for 60 seconds.",
    "Take off one piece of clothing of my choice.",
    "Kiss me somewhere other than my lips for 60 seconds.",
    "Send me a naugthy photo (if we are apart) or strike a pose (if together).",
];

export const DESIRES = [
    "Choose a roleplay scenario for us to try tonight.",
    "Pick one 'taboo' topic we've never discussed and let's explore it for 10 minutes.",
    "Describe your perfect 'morning after' with me.",
    "Show me exactly how you like to be touched in a specific area.",
    "Tell me a fantasy where we are strangers meeting for the first time.",
    "Describe an outfit you would love to see me wear.",
];

export const DATING_FUN = [
    "If we were characters in a romance movie, which ones would we be?",
    "Plan our dream getaway in 3 minutes. Go!",
    "What is the first thing you'd do if we won the lottery tomorrow?",
    "Re-enact our first kiss with a twist.",
    "What is our song, and if we don't have one, what should it be?",
    "Tell me your favorite date night memory of us.",
];

export const SEX_STYLES = [
    "Try a position we've never tried before (or describe it).",
    "Experiment with 'Slow Burn' - no touching for the first 10 minutes of foreplay.",
    "Introduce a toy or accessory to our session tonight.",
    "Switch who is 'in charge' for the next 30 minutes.",
    "Explore sensory play: use a feather, ice cube, or silk scarf.",
    "Try having sex in a different room of the house.",
];

export const ICEBREAKERS = [
    "What's the best concert you've ever been to?",
    "If you could have dinner with any historical figure, who would it be?",
    "What's your favorite way to spend a Sunday?",
    "What's the most spontaneous thing you've ever done?",
    "If you could live anywhere in the world, where would it be?",
    "What's a hobby you've always wanted to pick up?",
    "Who is your celebrity crush?",
    "What's 3 things on your bucket list?",
];

export const WOULD_YOU_RATHER = [
    "Would you rather always have to say everything on your mind or never be able to speak again?",
    "Would you rather be able to fly or be invisible?",
    "Would you rather have a pause button or a rewind button for your life?",
    "Would you rather give up your phone or your car for a month?",
    "Would you rather explore space or the ocean?",
    "Would you rather fight 1 horse-sized duck or 100 duck-sized horses?",
    "Would you rather always be 10 minutes late or always be 20 minutes early?",
];

export const BAD_BITCH = [
    "Tell me your most aggressive fantasy where you take full control.",
    "What is the most 'expensive' thing you want me to do to you?",
    "If you were a queen and I was your servant, what would be your first order?",
    "Describe a time you felt incredibly powerful and sexy.",
    "What is your 'Bad Bitch' anthem and what move does it inspire?",
    "Demand that I worship one part of your body right now.",
];

export const SEXY_DADDY = [
    "How do you like to show your dominance in the bedroom?",
    "What is the most 'Daddy' thing I can do to make you feel in control?",
    "Describe your ideal submissive scenario for me.",
    "What's a rule you'd want to set for me that I have to follow all day?",
    "Tell me a story about a time you felt like the ultimate provider.",
    "What's the deepest register of your voice you can use to tell me what to do?",
];

export async function registerGameRoutes(app: any) {
    const { storage } = await import("./storage");

    app.get("/api/games/content", (req: any, res: any) => {
        res.json({
            truths: TRUTHS,
            dares: DARES,
            desires: DESIRES,
            datingFun: DATING_FUN,
            sexStyles: SEX_STYLES,
            icebreakers: ICEBREAKERS,
            wouldYouRather: WOULD_YOU_RATHER,
            badBitch: BAD_BITCH,
            sexyDaddy: SEXY_DADDY
        });
    });

    app.post("/api/games/:sessionId/action", async (req: any, res: any) => {
        const { sessionId } = req.params;
        const { action, gameState } = req.body;
        const session = await storage.updateGameSession(Number(sessionId), { gameState });
        res.json(session);
    });

    app.post("/api/games/:sessionId/next", async (req: any, res: any) => {
        const { sessionId } = req.params;
        const session = await storage.getGameSession(Number(sessionId));
        if (!session) return res.status(404).json({ message: "Session not found" });

        let deck: string[] = [];
        switch (session.gameType) {
            case 'truth': deck = TRUTHS; break;
            case 'dare': deck = DARES; break;
            case 'desire': deck = DESIRES; break;
            case 'dating_fun': deck = DATING_FUN; break;
            case 'sex_styles': deck = SEX_STYLES; break;
            default: deck = TRUTHS;
        }

        const randomCard = deck[Math.floor(Math.random() * deck.length)];
        const nextStep = (session.currentStep || 0) + 1;

        await storage.updateGameSession(Number(sessionId), {
            currentStep: nextStep,
            gameState: { ...(session.gameState as any), currentCard: randomCard }
        });

        res.json({ card: randomCard, step: nextStep });
    });
}
