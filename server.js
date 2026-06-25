require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.get('/api/travel/weather', apiLimiter, async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: '経緯度情報 (latitude, longitude) が必要です。' });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'サーバー側の天気APIキー (OPENWEATHER_API_KEY) が設定されていません。' });
    }

    if (!checkAndIncrementDailyLimit('weather')) {
        return res.status(429).json({ error: '天気APIの1日の利用上限に達しました。明日またお試しください。' });
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=ja&appid=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Weather API returned status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: '天気情報の取得に失敗しました。' });
    }
});

app.get('/api/travel/hotels', apiLimiter, async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: '経緯度情報 (latitude, longitude) が必要です。' });
    }

    const appId = process.env.RAKUTEN_APP_ID;
    if (!appId) {
        return res.status(500).json({ error: 'サーバー側の楽天トラベル アプリID (RAKUTEN_APP_ID) が設定されていません。' });
    }

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

        const response = await fetch(url.toString());
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
        return res.status(500).json({ error: 'サーバー側の Gemini API キー (GEMINI_API_KEY) が設定されていません。' });
    }

    if (!checkAndIncrementDailyLimit('gemini')) {
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

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Gemini APIでの生成処理に失敗しました。' });
    }
});

app.post('/api/travel/places', apiLimiter, async (req, res) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
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

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'スポット情報の取得に失敗しました。' });
    }
});

app.get('/api/travel/photo', apiLimiter, async (req, res) => {
    const { name, maxWidthPx } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!name) return res.status(400).send('パラメータ "name" が必要です。');
    if (!apiKey) return res.status(500).send('APIキーが設定されていません。');

    try {
        const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidthPx || 800}&key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
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
        res.status(500).send('写真の取得に失敗しました。');
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
        const { origin, destination } = req.body;
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