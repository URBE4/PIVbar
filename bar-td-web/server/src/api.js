import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export function initializeAPI(app, db, io) {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    app.post('/api/register', async (req, res) => {
        try {
            const { username, email, password } = req.body;
            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Missing fields' });
            }

            const existingUser = await db.collection('users').findOne({
                $or: [{ username }, { email }]
            });

            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await db.collection('users').insertOne({
                username,
                email,
                password: hashedPassword,
                createdAt: new Date(),
                stats: {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    maxWave: 0,
                    totalKills: 0
                },
                clanId: null
            });

            const token = jwt.sign({ userId: result.insertedId }, JWT_SECRET);
            res.json({ success: true, token, userId: result.insertedId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Missing fields' });
            }

            const user = await db.collection('users').findOne({ username });
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ userId: user._id }, JWT_SECRET);
            res.json({ success: true, token, userId: user._id, username: user.username });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/leaderboard', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const leaderboard = await db.collection('leaderboard')
                .find()
                .sort({ score: -1 })
                .limit(limit)
                .toArray();
            res.json({ success: true, leaderboard });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/clans', async (req, res) => {
        try {
            const { name, description, userId } = req.body;
            if (!name || !userId) {
                return res.status(400).json({ error: 'Missing fields' });
            }

            const existingClan = await db.collection('clans').findOne({ name });
            if (existingClan) return res.status(400).json({ error: 'Clan name already taken' });

            const result = await db.collection('clans').insertOne({
                name,
                description: description || '',
                leaderId: userId,
                members: [userId],
                createdAt: new Date(),
                stats: { totalScore: 0, gamesWon: 0, rank: 0 }
            });

            await db.collection('users').updateOne({ _id: userId }, { $set: { clanId: result.insertedId } });
            res.json({ success: true, clanId: result.insertedId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/clans/join', async (req, res) => {
        try {
            const { clanName, userId } = req.body;
            if (!clanName || !userId) {
                return res.status(400).json({ error: 'Missing fields' });
            }

            const clan = await db.collection('clans').findOne({ name: clanName });
            if (!clan) return res.status(404).json({ error: 'Clan not found' });
            if (clan.members.length >= 50) return res.status(400).json({ error: 'Clan is full' });

            await db.collection('clans').updateOne({ _id: clan._id }, { $push: { members: userId } });
            await db.collection('users').updateOne({ _id: userId }, { $set: { clanId: clan._id } });
            res.json({ success: true, clanId: clan._id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/clans/:clanId', async (req, res) => {
        try {
            const clan = await db.collection('clans').findOne({ _id: req.params.clanId });
            if (!clan) return res.status(404).json({ error: 'Clan not found' });

            const members = await db.collection('users')
                .find({ _id: { $in: clan.members } })
                .project({ password: 0 })
                .toArray();

            res.json({ success: true, clan: { ...clan, members } });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/game/record', async (req, res) => {
        try {
            const { userId, wave, score, kills, victory } = req.body;
            if (!userId) return res.status(400).json({ error: 'Missing userId' });

            await db.collection('game_records').insertOne({ userId, wave, score, kills, victory, timestamp: new Date() });

            const existingRecord = await db.collection('leaderboard').findOne({ userId });
            if (existingRecord) {
                if (score > existingRecord.score) {
                    await db.collection('leaderboard').updateOne({ userId }, { $set: { score, wave, kills, updatedAt: new Date() } });
                }
            } else {
                await db.collection('leaderboard').insertOne({ userId, score, wave, kills, createdAt: new Date(), updatedAt: new Date() });
            }

            await db.collection('users').updateOne({ _id: userId }, {
                $inc: {
                    'stats.gamesPlayed': 1,
                    'stats.gamesWon': victory ? 1 : 0,
                    'stats.totalKills': kills,
                    'stats.maxWave': wave > 0 ? wave : 0
                }
            });

            const user = await db.collection('users').findOne({ _id: userId });
            if (user && user.clanId) {
                await db.collection('clans').updateOne({ _id: user.clanId }, {
                    $inc: {
                        'stats.totalScore': score,
                        'stats.gamesWon': victory ? 1 : 0
                    }
                });
            }

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/clans/ranking', async (req, res) => {
        try {
            const clans = await db.collection('clans').find().sort({ 'stats.totalScore': -1 }).limit(50).toArray();
            res.json({ success: true, clans });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}
