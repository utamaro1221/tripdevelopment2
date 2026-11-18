require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createRemoteJWKSet, jwtVerify } = require('jose');

const app = express();
const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

app.set('trust proxy', 1);

app.use(express.static(path.join(__dirname, 'public')));

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [
        'https://utamaro1221.github.io',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost:8080'
    ];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    },
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '100kb' }));

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

const generateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: { error: 'AI生成リクエストが多すぎます。1分後にやり直してください。' },
    standardHeaders: true,
    legacyHeaders: false
});

const placesLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: { error: 'スポット検索リクエストが多すぎます。1分後にやり直してください。' },
    standardHeaders: true,
    legacyHeaders: false
});

const photoLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 120,
    message: { error: '写真リクエストが多すぎます。1分後にやり直してください。' },
    standardHeaders: true,
    legacyHeaders: false
});

const routesLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: { error: 'ルート検索リクエストが多すぎます。1分後にやり直してください。' },
    standardHeaders: true,
    legacyHeaders: false
});

function getJSTDateString() {
    const now = new Date();
    const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return jstDate.toISOString().split('T')[0];
}

const dailyStats = {
    date: getJSTDateString(),
    geminiCount: 0,
    placesCount: 0,
    photoCount: 0,
    routesCount: 0,
    weatherCount: 0
};

function checkAndIncrementDailyLimit(apiType) {
    const today = getJSTDateString();
    if (dailyStats.date !== today) {
        dailyStats.date = today;
        dailyStats.geminiCount = 0;
        dailyStats.placesCount = 0;
        dailyStats.photoCount = 0;
        dailyStats.routesCount = 0;
        dailyStats.weatherCount = 0;
    }

    if (apiType === 'gemini') {
        const limit = parseInt(process.env.DAILY_GEMINI_LIMIT, 10) || 100;
        if (dailyStats.geminiCount >= limit) return false;
        dailyStats.geminiCount++;
    } else if (apiType === 'places') {
        const limit = parseInt(process.env.DAILY_PLACES_LIMIT, 10) || 300;
        if (dailyStats.placesCount >= limit) return false;
        dailyStats.placesCount++;
    } else if (apiType === 'photo') {
        const limit = parseInt(process.env.DAILY_PHOTO_LIMIT, 10) || 600;
        if (dailyStats.photoCount >= limit) return false;
        dailyStats.photoCount++;
    } else if (apiType === 'routes') {
        const limit = parseInt(process.env.DAILY_ROUTES_LIMIT, 10) || 200;
        if (dailyStats.routesCount >= limit) return false;
        dailyStats.routesCount++;
    } else if (apiType === 'weather') {
        const limit = parseInt(process.env.DAILY_WEATHER_LIMIT, 10) || 300;
        if (dailyStats.weatherCount >= limit) return false;
        dailyStats.weatherCount++;
    }
    return true;
}

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'tora-1c525';
const JWKS = createRemoteJWKSet(
    new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

async function authenticateFirebaseUser(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: '認証エラー: 有効な Bearer トークンが必要です。アプリにログイン（またはゲスト開始）してください。'
        });
    }

    const token = authHeader.split('Bearer ')[1].trim();
    try {
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
            audience: FIREBASE_PROJECT_ID,
            algorithms: ['RS256']
        });
        req.user = payload;
        next();
    } catch (err) {
        console.warn('Firebase JWT verify failed:', err.message);
        return res.status(401).json({
            error: '認証エラー: トークンが無効または有効期限切れです。再認証してください。'
        });
    }
}

function isValidJapanLatLng(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    return lat >= 20.0 && lat <= 46.0 && lng >= 122.0 && lng <= 154.0;
}

app.post('/api/travel/generate', generateLimiter, authenticateFirebaseUser, async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Gemini API Error: GEMINI_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: 'サーバー側の Gemini API キー (GEMINI_API_KEY) が設定されていません。' });
    }

    const body = req.body;
    if (!body || !Array.isArray(body.contents) || body.contents.length === 0) {
        return res.status(400).json({ error: 'リクエスト検証エラー: contents配列が指定されていないか空です。' });
    }

    if (body.contents.length > 20) {
        return res.status(400).json({ error: 'リクエスト検証エラー: contentsの数が多すぎます（最大20件）。' });
    }

    for (const content of body.contents) {
        if (!Array.isArray(content.parts) || content.parts.length === 0) {
            return res.status(400).json({ error: 'リクエスト検証エラー: parts配列が不正です。' });
        }
        if (content.parts.length > 10) {
            return res.status(400).json({ error: 'リクエスト検証エラー: partsの数が多すぎます（最大10件）。' });
        }
        for (const part of content.parts) {
            if (typeof part.text !== 'string' || part.text.length > 10000) {
                return res.status(400).json({ error: 'リクエスト検証エラー: partのtextが文字列でないか、10,000文字を超えています。' });
            }
        }
    }

    if (!checkAndIncrementDailyLimit('gemini')) {
        console.error("Gemini API Error: Daily usage limit reached.");
        return res.status(429).json({ error: 'Gemini APIの1日の利用上限に達しました。明日またお試しください。' });
    }

    try {
        const FIXED_MODEL = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${FIXED_MODEL}:generateContent`;

        const systemInstructionText =
            "各スポットに付与する季節タグ（season tag）は、プラン全体で提案している季節と必ず一致させること。もし特定の季節に限定されないスポットの場合は『通年』または『通年おすすめ』というタグを出力すること。\n" +
            "ホテル名・施設名・住所・説明文などのすべての固有名詞・場所情報は、必ず日本語（漢字・ひらがな・カタカナ）で出力すること。英語表記（ローマ字含む）は絶対に使用しないこと。";

        const requestPayload = {
            contents: body.contents,
            systemInstruction: {
                parts: [{ text: systemInstructionText }]
            }
        };

        if (body.generationConfig) {
            requestPayload.generationConfig = body.generationConfig;
        }

        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestPayload)
        }, 12000);

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            console.error("Gemini API Error: Failed to parse JSON response from Gemini API.", jsonErr);
            return res.status(502).json({ error: 'Gemini API からの応答の解析に失敗しました。' });
        }

        if (!response.ok) {
            console.error("Gemini API Error: API returned error status:", response.status, data);
            if (response.status === 429) {
                return res.status(429).json({
                    error: 'Gemini APIのレート制限（429 Too Many Requests）に達しました。しばらく時間を置いてから再試行してください。',
                    details: data
                });
            }
            return res.status(response.status).json({
                error: data.error?.message || `Gemini APIエラー (Status: ${response.status})`,
                details: data
            });
        }

        if (data.promptFeedback && data.promptFeedback.blockReason) {
            console.warn("Gemini API blocked prompt:", data.promptFeedback);
            return res.status(422).json({
                error: `セーフティフィルタによりリクエストがブロックされました (理由: ${data.promptFeedback.blockReason})。入力内容を変更してお試しください。`
            });
        }

        if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
            console.warn("Gemini API returned empty candidates:", data);
            return res.status(502).json({
                error: 'AIからの応答候補（candidates）が空でした。条件を変えて再度お試しください。'
            });
        }

        const firstCandidate = data.candidates[0];
        if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP' && firstCandidate.finishReason !== 'MAX_TOKENS') {
            console.warn("Gemini API abnormal finishReason:", firstCandidate.finishReason);
            return res.status(422).json({
                error: `AIの生成が中断されました (finishReason: ${firstCandidate.finishReason})。`
            });
        }

        const partText = firstCandidate?.content?.parts?.[0]?.text;
        if (!partText) {
            console.warn("Gemini API candidate has no text:", firstCandidate);
            return res.status(502).json({
                error: 'AIからの応答テキストが空でした。再度お試しください。'
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Gemini API Error: Network or internal exception occurred:", error);
        res.status(500).json({ error: 'サーバー内部で通信エラーが発生しました。', message: error.message });
    }
});

const FIELD_MASKS = {
    photo: 'places.id,places.displayName,places.photos',
    hotel: 'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.photos',
    spot: 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos'
};

app.post('/api/travel/places', placesLimiter, authenticateFirebaseUser, async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.MAPS_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Places API Error: GOOGLE_MAPS_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: 'Google Maps API key is not configured on the server.' });
    }

    const body = req.body || {};
    const textQuery = typeof body.textQuery === 'string' ? body.textQuery.trim() : '';

    if (!textQuery || textQuery.length === 0 || textQuery.length > 100) {
        return res.status(400).json({ error: 'textQuery は1〜100文字の文字列で指定してください。' });
    }

    if (!checkAndIncrementDailyLimit('places')) {
        console.error("Places API Error: Daily usage limit reached.");
        return res.status(429).json({ error: 'Places APIの1日の利用上限に達しました。' });
    }

    const purpose = body.purpose || 'hotel';
    const fieldMask = FIELD_MASKS[purpose] || FIELD_MASKS.hotel;
    const maxResultCount = Math.min(Math.max(parseInt(body.maxResultCount, 10) || 5, 1), 10);

    const googlePayload = {
        textQuery: textQuery,
        languageCode: 'ja',
        regionCode: 'JP',
        maxResultCount: maxResultCount
    };

    if (body.locationBias && body.locationBias.circle && body.locationBias.circle.center) {
        const { latitude, longitude } = body.locationBias.circle.center;
        const radius = Number(body.locationBias.circle.radius) || 5000;
        if (isValidJapanLatLng(latitude, longitude)) {
            googlePayload.locationBias = {
                circle: {
                    center: { latitude, longitude },
                    radius: Math.min(Math.max(radius, 500), 50000)
                }
            };
        }
    }

    try {
        const url = 'https://places.googleapis.com/v1/places:searchText';
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask,
                'Accept-Language': 'ja'
            },
            body: JSON.stringify(googlePayload)
        }, 8000);

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            console.error("Places API Error: Failed to parse JSON response.", jsonErr);
            return res.status(502).json({ error: 'Failed to parse JSON response from Places API.' });
        }

        if (!response.ok) {
            console.error("Places API Error: API returned error status:", response.status, data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error("Places API Error: Network or internal exception occurred:", error);
        res.status(500).json({ error: 'Failed to fetch from Places API', message: error.message });
    }
});

const PHOTO_NAME_REGEX = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

app.get('/api/travel/photo', photoLimiter, async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.MAPS_API_KEY || process.env.GOOGLE_API_KEY;
    const photoName = req.query.name;

    if (!apiKey) {
        console.error("Places Photo API Error: GOOGLE_MAPS_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: 'API key not configured' });
    }

    if (!photoName || typeof photoName !== 'string' || !PHOTO_NAME_REGEX.test(photoName)) {
        return res.status(400).json({ error: 'Invalid photo resource name format.' });
    }

    const rawWidth = parseInt(req.query.maxWidthPx, 10) || 400;
    const maxWidthPx = Math.min(Math.max(rawWidth, 100), 800);

    if (!checkAndIncrementDailyLimit('photo')) {
        console.error("Places Photo API Error: Daily usage limit reached.");
        return res.status(429).json({ error: 'Photo API daily limit reached.' });
    }

    try {
        const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}`;
        const response = await fetchWithTimeout(url, {
            headers: {
                'X-Goog-Api-Key': apiKey
            }
        }, 7000);

        if (!response.ok) {
            console.error("Places Photo API Error: Failed to fetch photo:", response.status);
            return res.status(response.status).end();
        }

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }
        res.setHeader('Cache-Control', 'public, max-age=86400');

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.send(buffer);
    } catch (error) {
        console.error('Error proxying photo:', error);
        res.status(500).end();
    }
});

app.get('/api/travel/weather', async (req, res) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        console.error("OpenWeather API Error: OPENWEATHER_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: 'OpenWeather API key is not configured on the server.' });
    }

    const lat = parseFloat(req.query.latitude || req.query.lat);
    const lon = parseFloat(req.query.longitude || req.query.lon);

    if (!isValidJapanLatLng(lat, lon)) {
        return res.status(400).json({ error: '日本国内の有効な緯度・経度 (lat, lon) を指定してください。' });
    }

    if (!checkAndIncrementDailyLimit('weather')) {
        return res.status(429).json({ error: 'Weather APIの1日の利用上限に達しました。' });
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`;
        const response = await fetchWithTimeout(url, {}, 6000);

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            console.error("OpenWeather API Error: Failed to parse JSON response.", jsonErr);
            return res.status(502).json({ error: 'Failed to parse JSON response from OpenWeather API.' });
        }

        if (!response.ok) {
            console.error("OpenWeather API Error: API returned error status:", response.status, data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error("OpenWeather API Error: Network or internal exception occurred:", error);
        res.status(500).json({ error: 'Failed to fetch from OpenWeather API', message: error.message });
    }
});

function decodePolyline(encoded) {
    if (!encoded) return [];
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return poly;
}

app.post('/api/travel/routes', routesLimiter, authenticateFirebaseUser, async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.MAPS_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Routes API Error: GOOGLE_MAPS_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: 'Google Maps API key is not configured on the server.' });
    }

    const { origin, destination, intermediates } = req.body || {};
    if (!origin || !destination || !isValidJapanLatLng(Number(origin.lat), Number(origin.lng)) || !isValidJapanLatLng(Number(destination.lat), Number(destination.lng))) {
        return res.status(400).json({ error: '日本国内の有効な origin および destination 座標が必要です。' });
    }

    if (intermediates && (!Array.isArray(intermediates) || intermediates.length > 5)) {
        return res.status(400).json({ error: 'intermediates は最大5件までの配列で指定してください。' });
    }

    if (!checkAndIncrementDailyLimit('routes')) {
        console.error("Routes API Error: Daily usage limit reached.");
        return res.status(429).json({ error: 'Routes APIの1日の利用上限に達しました。' });
    }

    try {
        const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        const requestBody = {
            origin: {
                location: {
                    latLng: { latitude: Number(origin.lat), longitude: Number(origin.lng) }
                }
            },
            destination: {
                location: {
                    latLng: { latitude: Number(destination.lat), longitude: Number(destination.lng) }
                }
            },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: false,
            languageCode: 'ja-JP',
            units: 'METRIC'
        };

        if (Array.isArray(intermediates) && intermediates.length > 0) {
            const validIntermediates = intermediates.filter(pt => pt && isValidJapanLatLng(Number(pt.lat), Number(pt.lng)));
            if (validIntermediates.length > 0) {
                requestBody.intermediates = validIntermediates.map(pt => ({
                    location: {
                        latLng: { latitude: Number(pt.lat), longitude: Number(pt.lng) }
                    }
                }));
            }
        }

        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
            },
            body: JSON.stringify(requestBody)
        }, 8000);

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            console.error("Routes API Error: Failed to parse JSON response.", jsonErr);
            return res.status(502).json({ error: 'Failed to parse JSON response from Routes API.' });
        }

        if (!response.ok) {
            console.error("Routes API Error: API returned error status:", response.status, data);
            return res.status(response.status).json(data);
        }

        const route = data.routes && data.routes[0];
        if (!route) {
            return res.status(404).json({ error: 'No route found.' });
        }

        const encodedPolyline = route.polyline && route.polyline.encodedPolyline;
        const decodedPath = decodePolyline(encodedPolyline);

        res.json({
            distanceMeters: route.distanceMeters || 0,
            duration: route.duration || '0s',
            encodedPolyline: encodedPolyline || '',
            path: decodedPath
        });
    } catch (error) {
        console.error("Routes API Error: Network or internal exception occurred:", error);
        res.status(500).json({ error: 'Failed to fetch from Routes API', message: error.message });
    }
});

app.use((err, req, res, next) => {
    console.error("Express Error Middleware:", err.message || err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.status || 500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
