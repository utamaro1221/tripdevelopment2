require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 3000,
    message: { error: 'リクエストが多すぎます。1分後にやり直してください。' },
    standardHeaders: true,
    legacyHeaders: false,
});

const dailyStats = {
    date: new Date().toDateString(),
    geminiCount: 0,
    rakutenCount: 0,
    weatherCount: 0
};

function checkAndIncrementDailyLimit(apiType) {
    const today = new Date().toDateString();

    if (dailyStats.date !== today) {
        dailyStats.date = today;
        dailyStats.geminiCount = 0;
        dailyStats.rakutenCount = 0;
        dailyStats.weatherCount = 0;
    }

    if (apiType === 'gemini') {
        const limit = parseInt(process.env.DAILY_GEMINI_LIMIT) || 100;
        if (dailyStats.geminiCount >= limit) {
            return false;
        }
        dailyStats.geminiCount++;
    } else if (apiType === 'rakuten') {
        const limit = parseInt(process.env.DAILY_RAKUTEN_LIMIT) || 300;
        if (dailyStats.rakutenCount >= limit) {
            return false;
        }
        dailyStats.rakutenCount++;
    } else if (apiType === 'weather') {
        const limit = parseInt(process.env.DAILY_WEATHER_LIMIT) || 300;
        if (dailyStats.weatherCount >= limit) {
            return false;
        }
        dailyStats.weatherCount++;
    }

    return true;
}

app.get('/api/travel/hotels', apiLimiter, async (req, res) => {
    const { keyword } = req.query;

    if (!keyword) {
        return res.status(400).json({ error: 'キーワード (keyword) が必要です。' });
    }

    const appId = process.env.RAKUTEN_APPLICATION_ID;
    const accessKey = process.env.RAKUTEN_ACCESS_KEY;
    if (!appId || !accessKey) {
        return res.status(500).json({ error: 'サーバー側の楽天トラベル アプリIDまたはアクセスキーが設定されていません。' });
    }

    if (!checkAndIncrementDailyLimit('rakuten')) {
        return res.status(429).json({ error: '楽天トラベルAPIの1日の利用上限に達しました。明日またお試しください。' });
    }

    try {
        const url = new URL('https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20170426');
        url.searchParams.append('format', 'json');
        url.searchParams.append('applicationId', appId);
        url.searchParams.append('accessKey', accessKey); // 新仕様の必須キー
        url.searchParams.append('keyword', keyword);
        url.searchParams.append('hits', '5');

        const response = await fetch(url.toString(), {
            headers: {
                'Referer': 'https://utamaro1221.github.io' // Renderからの通信を通すために明記
            }
        });
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: '通信に失敗しました' });
    }
});

app.post('/api/travel/generate', apiLimiter, async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Gemini API Error: GEMINI_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: 'サーバー側の Gemini API キー (GEMINI_API_KEY) が設定されていません。' });
    }

    if (!req.body || !req.body.contents) {
        console.error("Gemini API Error: Request body or contents is missing/null.");
        return res.status(400).json({ error: 'リクエストボディまたはコンテンツが指定されていません。' });
    }

    if (req.body.contents) {
        req.body.contents.forEach(content => {
            if (content.parts) {
                content.parts.forEach(part => {
                    if (typeof part.text === 'string') {
                        part.text += "\n各スポットに付与する季節タグ（season tag）は、プラン全体で提案している季節と必ず一致させること。もし特定の季節に限定されないスポットの場合は『通年』または『通年おすすめ』というタグを出力すること。";
                    }
                });
            }
        });
    }

    if (!checkAndIncrementDailyLimit('gemini')) {
        console.error("Gemini API Error: Daily usage limit reached.");
        return res.status(429).json({ error: 'Gemini APIの1日の利用上限に達しました。明日またお試しください。' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            console.error("Gemini API Error: Failed to parse JSON response from Gemini API.", jsonErr);
            return res.status(502).json({ error: 'Gemini API からの応答の解析に失敗しました。' });
        }

        if (!response.ok) {
            console.error("Gemini API Error: API returned error status:", response.status, data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (err) {
        console.error("Gemini API Error: Unexpected crash in generation endpoint.", err);
        res.status(500).json({ error: 'Gemini APIでの生成処理に失敗しました。' });
    }
});

app.post('/api/travel/places', apiLimiter, async (req, res) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
        console.error("Places API Error: GOOGLE_PLACES_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: 'サーバー側の Google Places API キー (GOOGLE_PLACES_API_KEY) が設定されていません。' });
    }

    try {
        const url = 'https://places.googleapis.com/v1/places:searchText';
        const fieldMask = req.headers['x-goog-fieldmask'] || 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.photos';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask
            },
            body: JSON.stringify(req.body)
        });

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            console.error("Places API Error: Failed to parse JSON response from Places API.", jsonErr);
            return res.status(502).json({ error: 'Places API からの応答の解析に失敗しました。' });
        }

        if (!response.ok) {
            console.error("Places API Error: API returned error status:", response.status, data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (err) {
        console.error("Places API Error: Unexpected crash in places endpoint.", err);
        res.status(500).json({ error: 'スポット情報の取得に失敗しました。' });
    }
});

app.get('/api/travel/photo', apiLimiter, async (req, res) => {
    const { name, maxWidthPx } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!name) {
        console.error("Photo API Error: Parameter 'name' is missing.");
        return res.status(400).send('パラメータ "name" が必要です。');
    }
    if (!apiKey) {
        console.error("Photo API Error: GOOGLE_PLACES_API_KEY is not defined in environment variables.");
        return res.status(500).send('APIキーが設定されていません。');
    }

    try {
        const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidthPx || 800}&key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error("Photo API Error: Failed to fetch media from Places API. Status:", response.status);
            throw new Error(`Photo API Error: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.send(buffer);
    } catch (err) {
        console.error("Photo API Error: Failed to retrieve photo. Fallback to placeholder image.", err);
        const fallbackUrl = "https://placehold.co/800x600/f1f5f9/64748b?text=No+Image";
        try {
            const fallbackRes = await fetch(fallbackUrl);
            if (fallbackRes.ok) {
                const arrayBuffer = await fallbackRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                res.setHeader('Content-Type', 'image/png');
                return res.status(200).send(buffer);
            }
        } catch (fallbackErr) {
            console.error("Fallback image fetch failed:", fallbackErr);
        }
        res.status(200).json({ error: "no_image", defaultUrl: fallbackUrl });
    }
});

function decodePolyline(encoded) {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return points;
}

app.post('/api/travel/routes', async (req, res) => {
    try {
        const { origin, destination, intermediates } = req.body;
        if (!origin || !destination) {
            return res.status(400).json({ error: "Invalid request body" });
        }
        const requestBody = {
            origin: {
                location: {
                    latLng: {
                        latitude: parseFloat(origin.lat),
                        longitude: parseFloat(origin.lng)
                    }
                }
            },
            destination: {
                location: {
                    latLng: {
                        latitude: parseFloat(destination.lat),
                        longitude: parseFloat(destination.lng)
                    }
                }
            },
            travelMode: "DRIVE"
        };
        if (Array.isArray(intermediates) && intermediates.length > 0) {
            requestBody.intermediates = intermediates.map(p => ({
                location: {
                    latLng: {
                        latitude: parseFloat(p.lat),
                        longitude: parseFloat(p.lng)
                    }
                }
            }));
        }
        const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
                "X-Goog-FieldMask": "routes.polyline.encodedPolyline"
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            return res.status(response.status).json({ error: "Google Routes API error" });
        }
        const data = await response.json();
        if (data.routes && data.routes.length > 0 && data.routes[0].polyline && data.routes[0].polyline.encodedPolyline) {
            const path = decodePolyline(data.routes[0].polyline.encodedPolyline);
            return res.json({ path });
        }
        return res.json({ path: [] });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT);