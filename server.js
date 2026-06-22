require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// CORSの許可
app.use(cors());

// POSTリクエストのJSON解析
app.use(express.json());

// 静的ファイルの配信（フロントエンドの HTML/CSS/JS がある場所）
app.use(express.static(__dirname));

// 連打防止（IPごとのレートリミット）
// 1分間に最大30リクエストまで
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1分
    max: 30,
    message: { error: 'リクエストが多すぎます。1分後にやり直してください。' },
    standardHeaders: true,
    legacyHeaders: false,
});

// メモリ上での簡易的な1日あたりリクエスト制限（デイリーリミット）
const dailyStats = {
    date: new Date().toDateString(),
    geminiCount: 0,
    rakutenCount: 0
};

/**
 * デイリーリミットのチェックと加算を行う関数
 * @param {string} apiType 'gemini' | 'rakuten'
 * @returns {boolean} 上限以下ならtrue、上限を超えていればfalse
 */
function checkAndIncrementDailyLimit(apiType) {
    const today = new Date().toDateString();
    
    // 日付が変わっていたらカウントをリセット
    if (dailyStats.date !== today) {
        dailyStats.date = today;
        dailyStats.geminiCount = 0;
        dailyStats.rakutenCount = 0;
    }

    if (apiType === 'gemini') {
        const limit = parseInt(process.env.DAILY_GEMINI_LIMIT) || 100;
        if (dailyStats.geminiCount >= limit) {
            return false;
        }
        dailyStats.geminiCount++;
        console.log(`[Gemini API] Request accepted. Daily Count: ${dailyStats.geminiCount}/${limit}`);
    } else if (apiType === 'rakuten') {
        const limit = parseInt(process.env.DAILY_RAKUTEN_LIMIT) || 300;
        if (dailyStats.rakutenCount >= limit) {
            return false;
        }
        dailyStats.rakutenCount++;
        console.log(`[Rakuten API] Request accepted. Daily Count: ${dailyStats.rakutenCount}/${limit}`);
    }

    return true;
}

// 楽天トラベルAPI中継エンドポイント
app.get('/api/travel/hotels', apiLimiter, async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: '経緯度情報 (latitude, longitude) が必要です。' });
    }

    const appId = process.env.RAKUTEN_APP_ID;
    if (!appId) {
        return res.status(500).json({ error: 'サーバー側の楽天トラベル アプリID (RAKUTEN_APP_ID) が設定されていません。' });
    }

    // デイリーリミットチェック
    if (!checkAndIncrementDailyLimit('rakuten')) {
        return res.status(429).json({ error: '楽天トラベルAPIの1日の利用上限に達しました。明日またお試しください。' });
    }

    try {
        const url = new URL('https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426');
        url.searchParams.append('format', 'json');
        url.searchParams.append('applicationId', appId);
        url.searchParams.append('latitude', latitude);
        url.searchParams.append('longitude', longitude);
        url.searchParams.append('searchRadius', '3');
        url.searchParams.append('datumType', '1');
        url.searchParams.append('hits', '5');

        console.log(`[Rakuten API] Fetching hotels for lat:${latitude}, lon:${longitude}`);
        const response = await fetch(url.toString());
        
        if (!response.ok) {
            throw new Error(`Rakuten API returned status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('[Rakuten Proxy Error]', err);
        res.status(500).json({ error: '楽天トラベルAPIからの情報取得に失敗しました。' });
    }
});

// Gemini API中継エンドポイント
app.post('/api/travel/generate', apiLimiter, async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'サーバー側の Gemini API キー (GEMINI_API_KEY) が設定されていません。' });
    }

    // デイリーリミットチェック
    if (!checkAndIncrementDailyLimit('gemini')) {
        return res.status(429).json({ error: 'Gemini APIの1日の利用上限に達しました。明日またお試しください。' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        console.log('[Gemini API] Requesting content generation...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Gemini API Error Response]', data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (err) {
        console.error('[Gemini Proxy Error]', err);
        res.status(500).json({ error: 'Gemini APIでの生成処理に失敗しました。' });
    }
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Proxy server is running on http://localhost:${PORT}`);
    console.log(`==================================================`);
});
