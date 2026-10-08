require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createRemoteJWKSet, jwtVerify } = require('jose');

const app = express();
const PORT = process.env.PORT || 3000;

// リバースプロキシ環境（Render等）対応
app.set('trust proxy', 1);

// =================================================================
// A2. 静的ファイルの公開範囲を public/ ディレクトリに限定
// (server.js, package.json, .env 等の漏洩防止)
// =================================================================
app.use(express.static(path.join(__dirname, 'public')));

// =================================================================
// A3. CORS ホワイトリスト設定
// 環境変数 ALLOWED_ORIGINS (カンマ区切り) に設定されたオリジンのみ許可
// =================================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [
        'https://utamaro1221.github.io',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5500',
        'http://localhost:8080'
    ];

const corsOptions = {
    origin: function (origin, callback) {
        // 同一オリジン (originが空) またはホワイトリストに一致する場合は許可
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    },
    credentials: true
};
app.use(cors(corsOptions));

// =================================================================
// A4. ボディサイズ制限 (100kb)
// =================================================================
app.use(express.json({ limit: '100kb' }));

// =================================================================
// A4. レート制限ミドルウェア (IP単位)
// =================================================================
const generateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20, // AI生成系は1分間に20回
    message: { error: 'AI生成リクエストが多すぎます。1分後にやり直してください。' },
    standardHeaders: true,
    legacyHeaders: false
});

const placesLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60, // スポット検索は1分間に60回
    message: { error: 'スポット検索リクエストが多すぎます。1分後にやり直してください。' },
    standardHeaders: true,
    legacyHeaders: false
});

const photoLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 120, // 写真取得は1分間に120回
    message: { error: '写真リクエストが多すぎます。1分後にやり直してください。' },
    standardHeaders: true,
    legacyHeaders: false
});

const routesLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30, // ルート計算は1分間に30回
    message: { error: 'ルート検索リクエストが多すぎます。1分後にやり直してください。' },
    standardHeaders: true,
    legacyHeaders: false
});

// =================================================================
// A4. JST基準の日次利用カウンタと上限管理
// ※注意: 日次カウンタはインメモリで管理されるため、Render等の再起動や
//         インスタンスのスピンダウンでリセットされます。
// =================================================================
function getJSTDateString() {
    const now = new Date();
    // UTCに9時間加算してJST日付を算出
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

// =================================================================
// A6. Firebase ID トークン検証 (JWKSによる軽量検証)
// /generate, /places, /routes を認証必須化
// =================================================================
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'tripdevelopment-d109d';
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

// =================================================================
// ヘルパー: 日本国内の緯度経度バリデーション
// =================================================================
function isValidJapanLatLng(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    // 日本のおよその緯度・経度範囲 (離島含む): 緯度 20〜46, 経度 122〜154
    return lat >= 20.0 && lat <= 46.0 && lng >= 122.0 && lng <= 154.0;
}

// =================================================================
// A5, A8. Gemini API エンドポイント
// - APIキーは x-goog-api-key ヘッダーで送信
// - 指示文は systemInstruction に設定
// - 入力検証 (contents構造・parts数・文字数・モデルサーバー固定)
// - candidates欠落 / blockReason / finishReason のハンドリング
// =================================================================
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

    // contents 内の parts と文字数検証
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
        // モデルはサーバー側で固定 (クライアントからの指定は受け付けない)
        const FIXED_MODEL = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${FIXED_MODEL}:generateContent`;

        // systemInstruction にルールを移設
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

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey // クエリパラメータではなくヘッダーで安全に渡す
            },
            body: JSON.stringify(requestPayload)
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
            return res.status(response.status).json({
                error: data.error?.message || 'Gemini APIからエラーが返却されました。'
            });
        }

        // promptFeedback.blockReason の検証
        if (data.promptFeedback && data.promptFeedback.blockReason) {
            console.warn("Gemini Prompt Blocked:", data.promptFeedback);
            return res.status(400).json({
                error: `AIの安全性ポリシーによりリクエストがブロックされました (理由: ${data.promptFeedback.blockReason})。入力内容を変更してお試しください。`,
                details: data.promptFeedback
            });
        }

        // candidates の存在チェック
        const candidate = data.candidates && data.candidates[0];
        if (!candidate) {
            console.warn("Gemini no candidates returned:", data);
            return res.status(502).json({ error: 'AIからの回答候補が生成されませんでした。時間をおいて再試行してください。' });
        }

        // finishReason のハンドリング
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            console.warn("Gemini candidate finishReason:", candidate.finishReason);
            if (candidate.finishReason === 'SAFETY') {
                return res.status(400).json({ error: 'AIの安全性ポリシーに抵触したため出力が中断されました。' });
            }
            if (candidate.finishReason === 'MAX_TOKENS') {
                return res.status(400).json({ error: '生成内容が最大トークン数を超過したため終了しました。日数を減らして再試行してください。' });
            }
        }

        res.json(data);
    } catch (err) {
        console.error("Gemini API Error: Unexpected crash in generation endpoint.", err);
        res.status(500).json({ error: 'Gemini APIでの生成処理中にサーバー内部エラーが発生しました。' });
    }
});

// =================================================================
// A5. Google Places API エンドポイント
// - クライアントからの X-Goog-FieldMask 指定を廃止
// - purpose ('photo' | 'hotel' | 'spot') に応じた最小 FieldMask をサーバーで決定
// - textQuery 検証
// =================================================================
app.post('/api/travel/places', placesLimiter, authenticateFirebaseUser, async (req, res) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
        console.error("Places API Error: GOOGLE_PLACES_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: 'サーバー側の Google Places API キー (GOOGLE_PLACES_API_KEY) が設定されていません。' });
    }

    const { textQuery, purpose, languageCode } = req.body || {};
    if (!textQuery || typeof textQuery !== 'string' || textQuery.trim().length === 0) {
        return res.status(400).json({ error: 'リクエスト検証エラー: textQuery (文字列) は必須です。' });
    }
    if (textQuery.length > 200) {
        return res.status(400).json({ error: 'リクエスト検証エラー: textQuery が長すぎます（200文字以内）。' });
    }

    if (!checkAndIncrementDailyLimit('places')) {
        return res.status(429).json({ error: 'Places APIの1日の利用上限に達しました。明日またお試しください。' });
    }

    // 用途に応じた最小限の FieldMask をサーバー側で固定 (Enterprise SKU の過剰課金を防ぐ)
    let fieldMask;
    if (purpose === 'hotel') {
        fieldMask = 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos';
    } else if (purpose === 'spot') {
        fieldMask = 'places.displayName,places.formattedAddress,places.location,places.photos';
    } else {
        // デフォルト: photo のみ必要な場合
        fieldMask = 'places.displayName,places.photos';
    }

    try {
        const url = 'https://places.googleapis.com/v1/places:searchText';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask
            },
            body: JSON.stringify({
                textQuery: textQuery.trim(),
                languageCode: languageCode || 'ja'
            })
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
            return res.status(response.status).json({
                error: data.error?.message || 'Places APIでエラーが発生しました。'
            });
        }

        res.json(data);
    } catch (err) {
        console.error("Places API Error: Unexpected crash in places endpoint.", err);
        res.status(500).json({ error: 'スポット情報の取得に失敗しました。' });
    }
});

// =================================================================
// A5. Google Places Photo エンドポイント
// - name を正規表現で厳格検証
// - maxWidthPx を 1〜1600 に制限
// - 失敗時は 404 を返却
// - 成功時は Cache-Control: public, max-age=86400
// =================================================================
const PHOTO_NAME_REGEX = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

app.get('/api/travel/photo', photoLimiter, async (req, res) => {
    const { name, maxWidthPx } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!name || typeof name !== 'string' || !PHOTO_NAME_REGEX.test(name)) {
        return res.status(400).json({ error: 'パラメータ "name" の形式が不正です。' });
    }

    if (!apiKey) {
        console.error("Photo API Error: GOOGLE_PLACES_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: 'APIキーが設定されていません。' });
    }

    if (!checkAndIncrementDailyLimit('photo')) {
        return res.status(429).json({ error: 'Photo APIの1日の利用上限に達しました。明日またお試しください。' });
    }

    // maxWidthPx: 1〜1600
    let width = parseInt(maxWidthPx, 10);
    if (isNaN(width) || width < 1) width = 800;
    if (width > 1600) width = 1600;

    try {
        const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}&key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn("Photo API upstream error status:", response.status);
            return res.status(404).json({ error: '写真が見つかりませんでした。' });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24時間キャッシュ

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
    } catch (err) {
        console.error("Photo API Error: Failed to fetch photo:", err.message);
        return res.status(404).json({ error: '写真の取得に失敗しました。' });
    }
});

// =================================================================
// ルートポリラインデコード関数
// =================================================================
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

// =================================================================
// A4, A5. Google Routes API エンドポイント
// - レート制限 & 日次上限
// - GOOGLE_MAPS_API_KEY 存在チェック
// - intermediates 25件以下
// - 緯度経度の日本国内範囲バリデーション
// =================================================================
app.post('/api/travel/routes', routesLimiter, authenticateFirebaseUser, async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("Routes API Error: GOOGLE_MAPS_API_KEY is not defined.");
        return res.status(500).json({ error: 'サーバー側の GOOGLE_MAPS_API_KEY が設定されていません。' });
    }

    if (!checkAndIncrementDailyLimit('routes')) {
        return res.status(429).json({ error: 'Routes APIの1日の利用上限に達しました。明日またお試しください。' });
    }

    try {
        const { origin, destination, intermediates } = req.body || {};
        if (!origin || !destination) {
            return res.status(400).json({ error: "リクエスト検証エラー: origin と destination が必要です。" });
        }

        const oLat = parseFloat(origin.lat);
        const oLng = parseFloat(origin.lng);
        const dLat = parseFloat(destination.lat);
        const dLng = parseFloat(destination.lng);

        if (!isValidJapanLatLng(oLat, oLng)) {
            return res.status(400).json({ error: "リクエスト検証エラー: origin の座標が日本国内の有効範囲外です。" });
        }
        if (!isValidJapanLatLng(dLat, dLng)) {
            return res.status(400).json({ error: "リクエスト検証エラー: destination の座標が日本国内の有効範囲外です。" });
        }

        const requestBody = {
            origin: {
                location: {
                    latLng: { latitude: oLat, longitude: oLng }
                }
            },
            destination: {
                location: {
                    latLng: { latitude: dLat, longitude: dLng }
                }
            },
            travelMode: "DRIVE"
        };

        if (Array.isArray(intermediates)) {
            if (intermediates.length > 25) {
                return res.status(400).json({ error: "リクエスト検証エラー: intermediates は最大25件までです。" });
            }
            const validatedIntermediates = [];
            for (let i = 0; i < intermediates.length; i++) {
                const p = intermediates[i];
                const pLat = parseFloat(p.lat);
                const pLng = parseFloat(p.lng);
                if (!isValidJapanLatLng(pLat, pLng)) {
                    return res.status(400).json({
                        error: `リクエスト検証エラー: 経由地 #${i + 1} の座標が日本国内の有効範囲外です。`
                    });
                }
                validatedIntermediates.push({
                    location: {
                        latLng: { latitude: pLat, longitude: pLng }
                    }
                });
            }
            if (validatedIntermediates.length > 0) {
                requestBody.intermediates = validatedIntermediates;
            }
        }

        const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "routes.polyline.encodedPolyline"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.text();
            console.error("Google Routes API upstream error:", response.status, errData);
            return res.status(response.status).json({ error: "Google Routes API error" });
        }

        const data = await response.json();
        if (data.routes && data.routes.length > 0 && data.routes[0].polyline && data.routes[0].polyline.encodedPolyline) {
            const path = decodePolyline(data.routes[0].polyline.encodedPolyline);
            return res.json({ path });
        }
        return res.json({ path: [] });
    } catch (error) {
        console.error("Routes endpoint error:", error);
        return res.status(500).json({ error: "ルート生成中に内部エラーが発生しました。" });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});