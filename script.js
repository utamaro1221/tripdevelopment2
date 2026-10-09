import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInAnonymously,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    open3DRouteSimulation,
    close3DRouteSimulation,
    start3DAnimation,
    pause3DAnimation,
    reset3DAnimation,
    simUpdateHUD,
    loadGoogleMaps,
    fetchRoutesData,
    fetchPlaceDetails,
    generateFallbackLatLngPath,
    getPathPointAndHeading
} from "./simulation3d.js";

window.open3DRouteSimulation = open3DRouteSimulation;
window.close3DRouteSimulation = close3DRouteSimulation;
window.start3DAnimation = start3DAnimation;
window.pause3DAnimation = pause3DAnimation;
window.reset3DAnimation = reset3DAnimation;
window.simUpdateHUD = simUpdateHUD;
window.loadGoogleMaps = loadGoogleMaps;
window.fetchRoutesData = fetchRoutesData;
window.fetchPlaceDetails = fetchPlaceDetails;
window.generateFallbackLatLngPath = generateFallbackLatLngPath;
window.getPathPointAndHeading = getPathPointAndHeading;

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDeC3R7NLajt8zesqmQalgoeYSdtmicOPk",
    authDomain: "tripdevelopment-d109d.firebaseapp.com",
    projectId: "tripdevelopment-d109d",
    storageBucket: "tripdevelopment-d109d.firebasestorage.app",
    messagingSenderId: "15713811869",
    appId: "1:15713811869:web:0928db27dfa1d906e3c374",
    measurementId: "G-ZLZET7PJMS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
window._auth = auth;

// ==========================================
// 🛡️ XSS防止・サニタイズユーティリティ (A7)
// ==========================================
function escapeHTML(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
window.escapeHTML = escapeHTML;

function sanitizeUrl(url) {
    if (!url || typeof url !== "string") return "#";
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return "#";
}
window.sanitizeUrl = sanitizeUrl;

// ==========================================
// 🛡️ 認証ヘッダー取得ユーティリティ (A6)
// ==========================================
async function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && auth.currentUser) {
        try {
            const token = await auth.currentUser.getIdToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch (e) {
            console.warn("Failed to get Firebase ID token:", e);
        }
    }
    return headers;
}
window.getAuthHeaders = getAuthHeaders;

// ==========================================
// 🌟 429エラー対策: 画像の遅延読み込み (Lazy Loading) オブザーバー
// ==========================================
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            const placeName = card.dataset.placeName;
            const imgEl = card.querySelector('img');

            if (placeName && imgEl && (imgEl.src.includes('unsplash.com') || imgEl.src.includes('loremflickr.com'))) {
                fetchPlacePhoto(placeName).then(url => {
                    const resolvedUrl = (url && !url.includes('placehold.co')) ? url : NO_IMAGE_URL;
                    imgEl.src = resolvedUrl;
                    const place = kinkiPlaces.find(p => p.name === placeName);
                    if (place) place.img = resolvedUrl;
                });
            }
            observer.unobserve(card);
        }
    });
}, {
    rootMargin: '100px 0px',
    threshold: 0.1
});
// ==========================================
// 🌟 本物の Google Places API を呼び出す関数
// ==========================================
const NO_IMAGE_URL = "https://placehold.co/800x600/e2e8f0/94a3b8?text=No+Image";

window.fetchPlacePhoto = async function (placeName) {
    if (!placeName) return NO_IMAGE_URL;

    if (typeof placeName === 'string' && placeName.startsWith("http")) {
        return placeName;
    }

    try {
        const url = new URL("https://tripdevelopment2.onrender.com/api/travel/places");
        const headers = await getAuthHeaders();

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ textQuery: placeName, purpose: "photo", languageCode: "ja" })
        });

        if (!response.ok) throw new Error(`Places API Error: ${response.status}`);
        const data = await response.json();

        if (data.places && data.places.length > 0 && data.places[0].photos && data.places[0].photos.length > 0) {
            const photoName = data.places[0].photos[0].name;
            return `https://tripdevelopment2.onrender.com/api/travel/photo?name=${encodeURIComponent(photoName)}&maxWidthPx=800`;
        }

    } catch (error) {
        console.error(`[API通信エラー] ${placeName} の写真取得に失敗:`, error);
    }

    return NO_IMAGE_URL;
};

const nameDisplayModeMap = {
    "清水寺": { kanji: "清水寺", ruby: "<ruby>清水寺<rt>きよみずでら</rt></ruby>", hiragana: "きよみずでら" },
    "有馬温泉": { kanji: "有馬温泉", ruby: "<ruby>有馬温泉<rt>ありまおんせん</rt></ruby>", hiragana: "ありまおんせん" },
    "道頓堀": { kanji: "道頓堀", ruby: "<ruby>道頓堀<rt>どうとんぼり</rt></ruby>", hiragana: "どうとんぼり" },
    "奈良公園": { kanji: "奈良公園", ruby: "<ruby>奈良公園<rt>ならこうえん</rt></ruby>", hiragana: "ならこうえん" },
    "メタセコイア並木": { kanji: "メタセコイア並木", ruby: "メタセコイア<ruby>並木<rt>なみき</rt></ruby>", hiragana: "めたせこいあなみき" },
    "那智の滝": { kanji: "那智の滝", ruby: "<ruby>那智<rt>なち</rt></ruby>の<ruby>滝<rt>たき</rt></ruby>", hiragana: "なちのたき" },
    "姫路城": { kanji: "姫路城", ruby: "<ruby>姫路城<rt>ひめじじょう</rt></ruby>", hiragana: "ひめじじょう" },
    "嵐山竹林の小径": { kanji: "嵐山竹林の小径", ruby: "<ruby>嵐山竹林<rt>あらしやまちくりん</rt></ruby>の<ruby>小径<rt>こみち</rt></ruby>", hiragana: "あらしやまちくりんのこみち" },
    "白良浜": { kanji: "白良浜", ruby: "<ruby>白良浜<rt>しららはま</rt></ruby>", hiragana: "しららはま" },
    "比叡山延暦寺": { kanji: "比叡山延暦寺", ruby: "<ruby>比叡山延暦寺<rt>ひえいざんえんりゃくじ</rt></ruby>", hiragana: "ひえいざんえんりゃくじ" },
    "黒門市場": { kanji: "黒門市場", ruby: "<ruby>黒門市場<rt>くろもんいちば</rt></ruby>", hiragana: "くろもんいちば" },
    "伏見稲荷大社": { kanji: "伏見稲荷大社", ruby: "<ruby>伏見稲荷大社<rt>ふしみいなりたいしゃ</rt></ruby>", hiragana: "ふしみいなりたいしゃ" },
    "竹田城跡": { kanji: "竹田城跡", ruby: "<ruby>竹田城跡<rt>たけだじょうせき</rt></ruby>", hiragana: "たけだじょうせき" },
    "吉野山": { kanji: "吉野山", ruby: "<ruby>吉野山<rt>よしのやま</rt></ruby>", hiragana: "よしのやま" },
    "高野山 金剛峯寺": { kanji: "高野山 金剛峯寺", ruby: "<ruby>高野山<rt>こうやさん</rt></ruby> <ruby>金剛峯寺<rt>こんごうぶじ</rt></ruby>", hiragana: "こうやさんこんごうぶじ" },
    "近江八幡の水郷": { kanji: "近江八幡の水郷", ruby: "<ruby>近江八幡<rt>おうみはちまん</rt></ruby>の<ruby>水郷<rt>すいごう</rt></ruby>", hiragana: "おうみはちまんのすいごう" },
    "天橋立": { kanji: "天橋立", ruby: "<ruby>天橋立<rt>あまのはしだて</rt></ruby>", hiragana: "あまのはしだて" },
    "彦根城": { kanji: "彦根城", ruby: "<ruby>彦根城<rt>ひこねじょう</rt></ruby>", hiragana: "ひこねじょう" },
    "アドベンチャーワールド": { kanji: "アドベンチャーワールド", ruby: "アドベンチャーワールド", hiragana: "aどべんちゃーわーるど" },
    "熊野古道": { kanji: "熊野古道", ruby: "<ruby>熊野古道<rt>くまのこどう</rt></ruby>", hiragana: "くまのこどう" },
    "大阪城公園": { kanji: "大阪城公園", ruby: "<ruby>大阪城公園<rt>おおさかじょうこうえん</rt></ruby>", hiragana: "おおさかじょうこうえん" },
    "法隆寺": { kanji: "法隆寺", ruby: "<ruby>法隆寺<rt>ほうりゅうじ</rt></ruby>", hiragana: "ほうりゅうじ" },
    "城崎温泉": { kanji: "城崎温泉", ruby: "<ruby>城崎温泉<rt>きのさきおんせん</rt></ruby>", hiragana: "きのさきおんせん" }
};

let currentNameMode = 0;

function getDisplayName(name) {
    if (!name) return "";
    const modes = ["kanji", "ruby", "hiragana"];
    const mode = modes[currentNameMode];
    const data = nameDisplayModeMap[name];
    if (data) {
        return data[mode] || escapeHTML(name);
    }
    return escapeHTML(name);
}

function formatItineraryHtml(text) {
    if (!text) return "";
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html = html.replace(/\n/g, "<br>");
    Object.keys(nameDisplayModeMap).forEach(key => {
        const regex = new RegExp(key, "g");
        html = html.replace(regex, `<span class="place-name" data-original-name="${key}">${getDisplayName(key)}</span>`);
    });
    return html;
}

window.toggleNameDisplayMode = function () {
    currentNameMode = (currentNameMode + 1) % 3;
    const btn = document.getElementById("rubi-switch");
    if (btn) {
        const labels = ["漢字のみ", "漢字＋ルビ", "ひらがな"];
        btn.textContent = labels[currentNameMode];
    }
    const placeElements = document.querySelectorAll(".place-name");
    placeElements.forEach(el => {
        const origName = el.getAttribute("data-original-name");
        if (origName) {
            el.innerHTML = getDisplayName(origName);
        }
    });
};

// ==========================================
// 1. 観光スポットデータ定義 (全国・モックデータ)
// ==========================================
const kinkiPlaces = [
    {
        id: 101,
        name: "小樽運河",
        prefecture: "北海道",
        season: "冬",
        category: "history",
        description: "歴史ある石造り倉庫群が運河沿いに立ち並ぶ小樽を代表する観光地。夕暮れ時にはガス灯が灯り、レトロでロマンチックな雰囲気が漂います。四季折々の景観が美しく、散策路を歩きながら運河クルーズや周辺のガラス工房・スイーツ巡りを楽しむことができます。",
        img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "リラックス"],
        lat: 43.1996,
        lon: 140.9996,
        companion: ["カップル", "一人旅", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 102,
        name: "奥入瀬渓流",
        prefecture: "青森",
        season: "夏",
        category: "nature",
        description: "十和田湖から流れる清流沿いに約14km続く日本屈指の景勝地。苔むした岩や鬱蒼とした緑のトンネル、躍動感あふれる大小無数の滝が織りなす清涼な癒やしの散策路です。",
        img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop",
        tags: ["自然", "リラックス", "アクティブ"],
        lat: 40.5286,
        lon: 140.9702,
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 103,
        name: "中尊寺金色堂",
        prefecture: "岩手",
        season: "秋",
        category: "history",
        description: "奥州藤原氏の栄華を今に伝える世界文化遺産。堂全体が金箔で覆われた極楽浄土の空間は圧巻の美しさで、秋の紅葉に包まれる参道「月見坂」の風情も見事です。",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "リラックス"],
        lat: 39.0016,
        lon: 141.1001,
        companion: ["一人旅", "カップル"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 104,
        name: "松島",
        prefecture: "宮城",
        season: "秋",
        category: "nature",
        description: "日本三景の一つに数えられる名勝。松島湾に浮かぶ大小260余りの島々が織りなす多島美は、遊覧船からのクルーズ観光や瑞巌寺周辺の歴史散策とともに存分に楽しめます。",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "リラックス"],
        lat: 38.3712,
        lon: 141.0664,
        companion: ["カップル", "友人グループ", "一人旅"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "観光"
    },
    {
        id: 105,
        name: "田沢湖",
        prefecture: "秋田",
        season: "夏",
        category: "nature",
        description: "水深423.4mと日本一の深さを誇る神秘的なカルデラ湖。瑠璃色に輝く透明な湖面と、湖畔にたたずむ黄金の「たつこ像」、周囲の山々が織りなす大自然のパノラマが魅力です。",
        img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop",
        tags: ["自然", "リラックス", "観光"],
        lat: 39.7214,
        lon: 140.6622,
        companion: ["カップル", "一人旅", "友人グループ"],
        budget: "低予算",
        transport: "自家用車",
        purpose: "リフレッシュ"
    },
    {
        id: 106,
        name: "銀山温泉",
        prefecture: "山形",
        season: "冬",
        category: "healing",
        description: "大正ロマンの風情が漂う木造多層建築の旅館が銀山川沿いに並ぶ温泉街。ガス灯が灯る夕暮れ時のノスタルジックな風景や、雪景色に包まれる冬の幻想的な夜は息をのむ美しさです。",
        img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop",
        tags: ["温泉・癒やし", "歴史", "リラックス"],
        lat: 38.5705,
        lon: 140.5306,
        companion: ["カップル", "一人旅"],
        budget: "ラグジュアリー",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 107,
        name: "大内宿",
        prefecture: "福島",
        season: "秋",
        category: "history",
        description: "江戸時代の面影を色濃く残す茅葺き屋根の民家が街道沿いに並ぶ旧宿場町。名物のネギを箸代わりにして食べる「高遠そば」を味わいながら昔ながらの街道情緒を満喫できます。",
        img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=500&auto=format&fit=crop",
        tags: ["歴史", "グルメ", "観光"],
        lat: 37.3340,
        lon: 139.8608,
        companion: ["友人グループ", "カップル", "一人旅"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "歴史探訪"
    },
    {
        id: 108,
        name: "国営ひたち海浜公園",
        prefecture: "茨城",
        season: "春",
        category: "nature",
        description: "四季折々の花々が咲き誇る広大な国営公園。春には「みはらしの丘」一面を青一色に染めるネモフィラ、秋には鮮やかな紅葉のコキアが広がり、圧倒的な絶景を楽しめます。",
        img: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "アクティブ"],
        lat: 36.4025,
        lon: 140.5985,
        companion: ["子連れ", "カップル", "友人グループ"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "アクティビティ"
    },
    {
        id: 109,
        name: "日光東照宮",
        prefecture: "栃木",
        season: "秋",
        category: "history",
        description: "徳川家康を祀る日本を代表する世界遺産。国宝・陽明門をはじめとする豪華絢爛な極彩色の彫刻美や、「見ざる・言わざる・聞かざる」の三猿、眠り猫など見どころが満載です。",
        img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "自然"],
        lat: 36.7580,
        lon: 139.5989,
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 110,
        name: "草津温泉",
        prefecture: "群馬",
        season: "冬",
        category: "healing",
        description: "日本屈指の自然湧出量を誇る名湯。温泉街の中心に位置する「湯畑」の立ち上る湯けむりと伝統の「湯もみ」ショー、効能豊かな強酸性の湯が心身をじんわりと癒やしてくれます。",
        img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop",
        tags: ["温泉・癒やし", "リラックス", "グルメ"],
        lat: 36.6208,
        lon: 138.5960,
        companion: ["友人グループ", "カップル", "一人旅"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 111,
        name: "川越一番街（小江戸川越）",
        prefecture: "埼玉",
        season: "秋",
        category: "history",
        description: "重厚な蔵造りの町家が立ち並ぶ「小江戸」の歴史街道。シンボルである「時の鐘」や菓子屋横丁など、江戸・明治の情緒に浸りながらサツマイモスイーツの食べ歩きが人気です。",
        img: "https://images.unsplash.com/photo-1533050487297-09b450131914?w=500&auto=format&fit=crop",
        tags: ["歴史", "グルメ", "観光"],
        lat: 35.9238,
        lon: 139.4827,
        companion: ["カップル", "友人グループ", "一人旅"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 112,
        name: "成田山新勝寺",
        prefecture: "千葉",
        season: "冬",
        category: "history",
        description: "開山1000年以上の歴史を誇る全国屈指の霊場。広大な境内には重要文化財の堂塔がそびえ、レトロな表参道に並ぶ老舗うなぎ料理店での食事とともに参拝散策を楽しめます。",
        img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop",
        tags: ["歴史", "グルメ", "観光"],
        lat: 35.7865,
        lon: 140.3182,
        companion: ["一人旅", "カップル", "子連れ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 113,
        name: "浅草寺・雷門",
        prefecture: "東京",
        season: "春",
        category: "history",
        description: "都内最古の寺院で、巨大な赤提灯が掲げられた「雷門」が下町のランドマーク。活気あふれる仲見世通りでの伝統和菓子巡りや五重塔の眺めなど、江戸の伝統美が息づいています。",
        img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "グルメ"],
        lat: 35.7148,
        lon: 139.7967,
        companion: ["友人グループ", "カップル", "一人旅"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "観光"
    },
    {
        id: 114,
        name: "横浜みなとみらい21",
        prefecture: "神奈川",
        season: "通年",
        category: "city",
        description: "爽やかな海風が吹き抜ける先進的なウォーターフロント都市。赤レンガ倉庫や大観覧車、ランドマークタワーが織りなす煌びやかな夜景とショッピング・グルメを満喫できます。",
        img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=500&auto=format&fit=crop",
        tags: ["都市", "観光", "グルメ"],
        lat: 35.4547,
        lon: 139.6314,
        companion: ["カップル", "友人グループ", "子連れ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "観光"
    },
    {
        id: 115,
        name: "清津峡渓谷トンネル",
        prefecture: "新潟",
        season: "夏",
        category: "nature",
        description: "日本三大峡谷の一つとして名高い柱状節理の雄大な渓谷。トンネル最奥の「パノラマステーション」の水盤に映り込む渓谷美はSNSでも大人気のアート空間です。",
        img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "リラックス"],
        lat: 36.9587,
        lon: 138.7494,
        companion: ["カップル", "友人グループ", "一人旅"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "リフレッシュ"
    },
    {
        id: 116,
        name: "黒部ダム",
        prefecture: "富山",
        season: "夏",
        category: "nature",
        description: "北アルプスの大自然に囲まれた日本最大級のアーチ式ダム。毎秒10トン以上の水が霧状となって吹き出す大迫力の観光放水や立山黒部アルペンルートの大絶景が広がります。",
        img: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=500&auto=format&fit=crop",
        tags: ["自然", "アクティブ", "観光"],
        lat: 36.5664,
        lon: 137.6621,
        companion: ["友人グループ", "一人旅", "子連れ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "アクティビティ"
    },
    {
        id: 117,
        name: "兼六園",
        prefecture: "石川",
        season: "春",
        category: "nature",
        description: "加賀百万石の美意識を受け継ぐ日本三名園の一つ。徽軫灯籠や霞ヶ池を中心に、春の桜、新緑のカキツバタ、秋の紅葉、冬の雪吊りと四季を通じて優美な庭園美を誇ります。",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop",
        tags: ["自然", "歴史", "リラックス"],
        lat: 36.5621,
        lon: 136.6627,
        companion: ["一人旅", "カップル", "子連れ"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 118,
        name: "東尋坊",
        prefecture: "福井",
        season: "夏",
        category: "nature",
        description: "日本海の荒波によって削り出された巨大な柱状節理の断崖絶壁。世界でも数カ所しかない地質学的名所であり、遊覧船からの見上げる絶壁や夕日の絶景は圧巻です。",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "アクティブ"],
        lat: 36.2372,
        lon: 136.1264,
        companion: ["友人グループ", "一人旅", "カップル"],
        budget: "低予算",
        transport: "自家用車",
        purpose: "観光"
    },
    {
        id: 119,
        name: "河口湖（富士山絶景スポット）",
        prefecture: "山梨",
        season: "春",
        category: "nature",
        description: "雄大な富士山を湖面に映す「逆さ富士」で有名な富士五湖随一の観光名所。パノラマロープウェイや湖畔散策路から望む四季折々の富士山と桜・紅葉の対比が格別です。",
        img: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "リラックス"],
        lat: 35.5050,
        lon: 138.7700,
        companion: ["カップル", "友人グループ", "子連れ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 120,
        name: "上高地",
        prefecture: "長野",
        season: "夏",
        category: "nature",
        description: "北アルプスの麓に広がる日本を代表する山岳景勝地。シンボルの河童橋から望む穂高連峰の威容と、澄み渡る梓川のせせらぎが日常を忘れさせる極上の静寂を届けます。",
        img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop",
        tags: ["自然", "リラックス", "アクティブ"],
        lat: 36.2486,
        lon: 137.6375,
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 121,
        name: "白川郷合掌造り集落",
        prefecture: "岐阜",
        season: "冬",
        category: "history",
        description: "急勾配の茅葺き屋根が特徴的な合掌造り家屋が残る世界遺産の山村集落。冬の雪に包まれた幻想的なライトアップや、懐かしい日本の原風景が心に染み渡ります。",
        img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=500&auto=format&fit=crop",
        tags: ["歴史", "自然", "観光"],
        lat: 36.2566,
        lon: 136.9066,
        companion: ["カップル", "友人グループ", "一人旅"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "歴史探訪"
    },
    {
        id: 122,
        name: "三島スカイウォーク",
        prefecture: "静岡",
        season: "春",
        category: "nature",
        description: "日本最長400mの人道専用吊り橋。富士山と駿河湾の大パノラマを橋の上から同時に一望でき、ジップラインなど大自然を肌で感じるアクティビティも充実しています。",
        img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop",
        tags: ["自然", "アクティブ", "観光"],
        lat: 35.1264,
        lon: 138.9757,
        companion: ["友人グループ", "子連れ", "カップル"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "アクティビティ"
    },
    {
        id: 123,
        name: "名古屋城",
        prefecture: "愛知",
        season: "春",
        category: "history",
        description: "金鯱が屋根に輝く尾張徳川家の名城。復元された本丸御殿の豪華絢爛な障壁画や伝統木造技術、金シャチ横丁での名古屋めし食べ歩きを心ゆくまで堪能できます。",
        img: "https://images.unsplash.com/photo-1533050487297-09b450131914?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "グルメ"],
        lat: 35.1848,
        lon: 136.8997,
        companion: ["一人旅", "友人グループ", "子連れ"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 124,
        name: "伊勢神宮（内宮・おはらい町）",
        prefecture: "三重",
        season: "通年",
        category: "history",
        description: "日本人の心のふるさととして親しまれる最高位の神社。五十鈴川の清流を渡る宇治橋や神聖な杜に佇む正宮の参拝後、おはらい町・おかげ横丁で名物赤福や伊勢うどんを楽しめます。",
        img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=500&auto=format&fit=crop",
        tags: ["歴史", "グルメ", "リラックス"],
        lat: 34.4550,
        lon: 136.7258,
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 125,
        name: "鳥取砂丘",
        prefecture: "鳥取",
        season: "秋",
        category: "nature",
        description: "日本海沿岸に広がる日本最大級の海岸砂丘。風が作り出す美しい風紋や「馬の背」からの広大な海の眺望、ラクダ乗りやパラグライダーなど壮大な自然体験が魅力です。",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop",
        tags: ["自然", "アクティブ", "観光"],
        lat: 35.5398,
        lon: 134.2255,
        companion: ["友人グループ", "カップル", "子連れ"],
        budget: "低予算",
        transport: "自家用車",
        purpose: "アクティビティ"
    },
    {
        id: 126,
        name: "出雲大社",
        prefecture: "島根",
        season: "秋",
        category: "history",
        description: "縁結びの神として知られる大国主大神を祀る日本屈指の古社。神楽殿の大注連縄は圧巻の大きさを誇り、全国から神々が集まる神在月にはひときわ厳かな空気に包まれます。",
        img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=500&auto=format&fit=crop",
        tags: ["歴史", "リラックス", "観光"],
        lat: 35.4019,
        lon: 132.6855,
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 127,
        name: "倉敷美観地区",
        prefecture: "岡山",
        season: "春",
        category: "history",
        description: "白壁の土蔵と柳並木が倉敷川沿いに続く風情あふれる町並み。大原美術館の鑑賞や舟流し体験、町家を改装したお洒落なカフェ・倉敷デニムショップ巡りが楽しめます。",
        img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "グルメ"],
        lat: 34.5956,
        lon: 133.7716,
        companion: ["カップル", "一人旅", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "観光"
    },
    {
        id: 128,
        name: "厳島神社（宮島）",
        prefecture: "広島",
        season: "秋",
        category: "history",
        description: "満潮時には海の上に浮かぶようにそびえる朱塗りの大鳥居と社殿が神秘的な世界文化遺産。野生の鹿が出迎える参道や名物のもみじ饅頭・焼き牡蠣の食べ歩きも魅力です。",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "グルメ"],
        lat: 34.2960,
        lon: 132.3198,
        companion: ["カップル", "友人グループ", "一人旅"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 129,
        name: "角島大橋",
        prefecture: "山口",
        season: "夏",
        category: "nature",
        description: "エメラルドグリーンの日本海をまたぐ全長1,780mの美しい橋。CMや映画のロケ地としても名高く、白い砂浜と澄んだ海を眺めながらの爽快なシーサイドドライブが楽しめます。",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "アクティブ"],
        lat: 34.3547,
        lon: 130.8872,
        companion: ["カップル", "友人グループ", "一人旅"],
        budget: "低予算",
        transport: "自家用車",
        purpose: "アクティビティ"
    },
    {
        id: 130,
        name: "鳴門の渦潮",
        prefecture: "徳島",
        season: "春",
        category: "nature",
        description: "鳴門海峡の激しい潮流によって生まれる世界最大級の自然現象。観潮船で渦のすぐ近くまで迫る大迫力のクルーズや、大鳴門橋の遊歩道「渦の道」からの見下ろし体験が人気です。",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop",
        tags: ["自然", "アクティブ", "観光"],
        lat: 34.2389,
        lon: 134.6402,
        companion: ["友人グループ", "子連れ", "カップル"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "アクティビティ"
    },
    {
        id: 131,
        name: "金刀比羅宮",
        prefecture: "香川",
        season: "秋",
        category: "history",
        description: "「こんぴらさん」の愛称で信仰を集める海の守護神。本宮まで785段の石段を登り切った展望台からの讃岐平野の眺望と、参道沿いでの本場讃岐うどん巡りが旅の醍醐味です。",
        img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=500&auto=format&fit=crop",
        tags: ["歴史", "グルメ", "アクティブ"],
        lat: 34.1843,
        lon: 133.8203,
        companion: ["一人旅", "友人グループ", "カップル"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 132,
        name: "道後温泉本館",
        prefecture: "愛媛",
        season: "冬",
        category: "healing",
        description: "3000年の歴史を誇る日本最古の温泉地を代表する木造三層楼のシンボル。公衆浴場として初の国指定重要文化財であり、夏目漱石ゆかりの湯と風情ある温泉街の散策に癒やされます。",
        img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop",
        tags: ["温泉・癒やし", "歴史", "リラックス"],
        lat: 33.8520,
        lon: 132.7847,
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 133,
        name: "桂浜",
        prefecture: "高知",
        season: "夏",
        category: "nature",
        description: "太平洋を望む弓状の美しい白砂青松の海岸。龍頭岬に立つ雄大な坂本龍馬像や、打ち寄せる豪快な波を眺めながら味わう藁焼きカツオのタタキなど土佐の魅力に浸れます。",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop",
        tags: ["自然", "歴史", "グルメ"],
        lat: 33.4975,
        lon: 133.5744,
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "低予算",
        transport: "自家用車",
        purpose: "観光"
    },
    {
        id: 134,
        name: "太宰府天満宮",
        prefecture: "福岡",
        season: "春",
        category: "history",
        description: "学問の神様・菅原道真公を祀る全国天満宮の総本宮。御神木の「飛梅」をはじめ境内に咲き誇る梅の花や、参道で焼き立てを味わう名物「梅ヶ枝餅」の食べ歩きが人気です。",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop",
        tags: ["歴史", "グルメ", "観光"],
        lat: 33.5215,
        lon: 130.5349,
        companion: ["友人グループ", "カップル", "一人旅"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 135,
        name: "吉野ヶ里歴史公園",
        prefecture: "佐賀",
        season: "秋",
        category: "history",
        description: "弥生時代最大級の環濠集落跡を復元した広大な国営歴史公園。物見やぐらや竪穴住居が建ち並び、古代日本の生活を体感できる勾玉づくりなどの体験も楽しめます。",
        img: "https://images.unsplash.com/photo-1533050487297-09b450131914?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "自然"],
        lat: 33.3243,
        lon: 130.3848,
        companion: ["子連れ", "友人グループ", "一人旅"],
        budget: "低予算",
        transport: "自家用車",
        purpose: "歴史探訪"
    },
    {
        id: 136,
        name: "グラバー園",
        prefecture: "長崎",
        season: "春",
        category: "history",
        description: "長崎港を見下ろす南山手の丘に位置する異国情緒あふれる洋館群。日本最古の木造洋風建築・旧グラバー住宅や美しい庭園、石畳に埋め込まれたハートストーン探しが人気です。",
        img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "リラックス"],
        lat: 32.7335,
        lon: 129.8698,
        companion: ["カップル", "一人旅", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "観光"
    },
    {
        id: 137,
        name: "熊本城",
        prefecture: "熊本",
        season: "春",
        category: "history",
        description: "名将・加藤清正が築いた「武者返し」の石垣で知られる日本三名城の一つ。復興を遂げた天守閣の威容や城彩苑での馬刺し・からし蓮根などの名物グルメを満喫できます。",
        img: "https://images.unsplash.com/photo-1533050487297-09b450131914?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "グルメ"],
        lat: 32.8062,
        lon: 130.7058,
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 138,
        name: "別府地獄めぐり",
        prefecture: "大分",
        season: "冬",
        category: "healing",
        description: "日本屈指の温泉湧出量を誇る別府の奇観を巡る名物観光。コバルトブルーの「海地獄」や真っ赤な「血の池地獄」など自然の神秘と、温泉の蒸気で作る地獄蒸し料理が格別です。",
        img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop",
        tags: ["温泉・癒やし", "グルメ", "観光"],
        lat: 33.3157,
        lon: 131.4770,
        companion: ["友人グループ", "子連れ", "カップル"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 139,
        name: "高千穂峡",
        prefecture: "宮崎",
        season: "夏",
        category: "nature",
        description: "阿蘇山の火山活動によって削られた柱状節理の深い渓谷。日本の滝百選「真名井の滝」を間近に見上げる貸しボート遊覧は、日本神話の舞台にふさわしい神秘の絶景です。",
        img: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=500&auto=format&fit=crop",
        tags: ["自然", "リラックス", "観光"],
        lat: 32.7009,
        lon: 131.3006,
        companion: ["カップル", "一人旅", "友人グループ"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "リフレッシュ"
    },
    {
        id: 140,
        name: "桜島（湯之平展望所）",
        prefecture: "鹿児島",
        season: "通年",
        category: "nature",
        description: "錦江湾に浮かぶようにそびえる鹿児島のシンボルたる活火山。一般人が立ち入れる最高地点の展望所からは、荒々しい山肌と鹿児島市街・錦江湾のパノラマを一望できます。",
        img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "アクティブ"],
        lat: 31.5900,
        lon: 130.6570,
        companion: ["一人旅", "友人グループ", "カップル"],
        budget: "低予算",
        transport: "自家用車",
        purpose: "アクティビティ"
    },
    {
        id: 141,
        name: "沖縄美ら海水族館",
        prefecture: "沖縄",
        season: "夏",
        category: "nature",
        description: "世界最大級の大水槽「黒潮の海」で巨大なジンベエザメやナンヨウマンタが悠々と泳ぐ姿は圧巻。エメラルドグリーンの沖縄の美しい海をありのままに体感できる人気スポットです。",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "リラックス"],
        lat: 26.6943,
        lon: 127.8779,
        companion: ["子連れ", "カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "観光"
    },
    {
        id: 0,
        name: "清水寺",
        prefecture: "京都",
        season: "秋",
        category: "history",
        description: "「清水の舞台」で知られる世界遺産。秋には山全体が真っ赤な紅葉に染まり、夜間特別拝観では幻想的なライトアップが行われます。",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "リラックス"],
        lat: 34.9949,
        lon: 135.7850,
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 1,
        name: "有馬温泉",
        prefecture: "兵庫",
        season: "冬",
        category: "healing",
        description: "日本三古湯の一つ。鉄分を多く含み茶褐色をした「金泉」と、無色透明の「銀泉」の2つの名湯を楽しめる情緒あふれる温泉街です。",
        img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop",
        tags: ["癒やし", "リラックス", "グルメ"],
        lat: 34.7962,
        lon: 135.2474,
        companion: ["カップル", "一人旅", "子連れ"],
        budget: "ラグジュアリー",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 2,
        name: "道頓堀",
        prefecture: "大阪",
        season: "夏",
        category: "food",
        description: "巨大な看板やネオンが輝く大阪一の繁華街。たこ焼き、お好み焼き、串カツなどの食べ歩き天国で、活気溢れる体験ができます。",
        img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop",
        tags: ["グルメ", "アクティブ", "都市"],
        lat: 34.6687,
        lon: 135.5013,
        companion: ["友人グループ", "カップル", "子連れ"],
        budget: "低予算",
        transport: "徒歩",
        purpose: "グルメ"
    },
    {
        id: 3,
        name: "奈良公園",
        prefecture: "奈良",
        season: "春",
        category: "nature",
        description: "約1,200頭の野生の鹿が生息する広大な公園。春には満開の桜と鹿たちが織りなす、のどかで平和な絶景が広がります。",
        img: "https://images.unsplash.com/photo-1576675784201-0e142b423952?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "リラックス"],
        lat: 34.6851,
        lon: 135.8430,
        companion: ["子連れ", "カップル", "一人旅"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 4,
        name: "メタセコイア並木",
        prefecture: "滋賀",
        season: "秋",
        category: "nature",
        description: "マキノ高原へ続く約2.4kmの並木道。秋になると約500本のメタセコイアがレンガ色に美しく染まり、絶好のドライブコースとなります。",
        img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop",
        tags: ["自然", "リラックス", "アクティブ"],
        lat: 35.4795,
        lon: 136.0157,
        companion: ["カップル", "友人グループ"],
        budget: "低予算",
        transport: "自家用車",
        purpose: "アクティビティ"
    },
    {
        id: 5,
        name: "那智の滝",
        prefecture: "和歌山",
        season: "夏",
        category: "nature",
        description: "落差133m、日本一段差のある大滝。滝そのものが御神体とされており、降り注ぐ水しぶきと圧倒的なマイナスイオンに癒やされます。",
        img: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=500&auto=format&fit=crop",
        tags: ["自然", "歴史", "リラックス"],
        lat: 33.6751,
        lon: 135.8878,
        companion: ["一人旅", "カップル"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "リフレッシュ"
    },
    {
        id: 6,
        name: "姫路城",
        prefecture: "兵庫",
        season: "春",
        category: "history",
        description: "白鷺が羽を広げたような優美な姿から「白鷺城」と呼ばれる世界遺産。数々の国宝や重要文化財が当時の姿を残す名城です。",
        img: "https://images.unsplash.com/photo-1533050487297-09b450131914?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "アクティブ"],
        lat: 34.8394,
        lon: 134.6939,
        companion: ["一人旅", "友人グループ", "子連れ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 7,
        name: "嵐山竹林の小径",
        prefecture: "京都",
        season: "夏",
        category: "nature",
        description: "数万本の竹が天高く伸びる、京都屈指の散策路。夏は竹葉が擦れ合う涼やかな音と、隙間から漏れる木漏れ日が心地良いです。",
        img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=500&auto=format&fit=crop",
        tags: ["自然", "リラックス", "観光"],
        lat: 35.0156,
        lon: 135.6721,
        companion: ["カップル", "一人旅"],
        budget: "低予算",
        transport: "徒歩",
        purpose: "リフレッシュ"
    },
    {
        id: 8,
        name: "白良浜",
        prefecture: "和歌山",
        season: "夏",
        category: "nature",
        description: "真っ白でサラサラの砂と、驚くほど透き通ったエメラルドグリーンの海。まるでワイキキビーチのような関西屈指のリゾート地です。",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop",
        tags: ["自然", "リラックス", "アクティブ"],
        lat: 33.6822,
        lon: 135.3435,
        companion: ["友人グループ", "カップル", "子連れ"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "アクティビティ"
    },
    {
        id: 9,
        name: "比叡山延暦寺",
        prefecture: "滋賀",
        season: "秋",
        category: "history",
        description: "標高848mの比叡山全域を境内とする日本仏教の母山。静寂に包まれた厳かな杉木立の中に佇む堂塔は、歴史の重みを感じさせます。",
        img: "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=500&auto=format&fit=crop",
        tags: ["歴史", "自然", "リラックス"],
        lat: 35.0705,
        lon: 135.8410,
        companion: ["一人旅", "カップル"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 10,
        name: "黒門市場",
        prefecture: "大阪",
        season: "冬",
        category: "food",
        description: "「大阪の台所」として親しまれる活気ある市場。冬にはフグやカニ、マグロなどの新鮮な高級食材が並び、その場で調理して楽しめます。",
        img: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=500&auto=format&fit=crop",
        tags: ["グルメ", "都市", "観光"],
        lat: 34.6657,
        lon: 135.5068,
        companion: ["友人グループ", "カップル"],
        budget: "スタンダード",
        transport: "徒歩",
        purpose: "グルメ"
    },
    {
        id: 11,
        name: "伏見稲荷大社",
        prefecture: "京都",
        season: "冬",
        category: "history",
        description: "全国の稲荷神社の総本宮。朱塗りの鳥居がどこまでも続く「千本鳥居」は圧巻の一言。冬の張り詰めた空気の中での参拝は神秘的です。",
        img: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "アクティブ"],
        lat: 34.9671,
        lon: 135.7727,
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 12,
        name: "竹田城跡",
        prefecture: "兵庫",
        season: "秋",
        category: "history",
        description: "朝霧に包まれた姿が天空に浮かぶ城のように見えることから「天空の城」と呼ばれる名所。秋の早朝に現れる雲海は奇跡の美しさです。",
        img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&auto=format&fit=crop",
        tags: ["歴史", "自然", "アクティブ"],
        lat: 35.3002,
        lon: 134.8292,
        companion: ["カップル", "一人旅"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "アクティビティ"
    },
    {
        id: 13,
        name: "吉野山",
        prefecture: "奈良",
        season: "春",
        category: "nature",
        description: "日本一の桜の名所。春になると下千本から奥千本まで約3万本の桜が山肌を薄桃色に染め上げ、山全体がピンクの雲に包まれます。",
        img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop",
        tags: ["自然", "歴史", "リラックス"],
        lat: 34.3575,
        lon: 135.8705,
        companion: ["カップル", "一人旅", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 14,
        name: "高野山 金剛峯寺",
        prefecture: "和歌山",
        season: "秋",
        category: "history",
        description: "弘法大師空海が開創した真言密教の聖地。標高1,000mの山上盆地に広がる宗教都市で、秋はモミジが美しくお堂を彩ります。",
        img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500&auto=format&fit=crop",
        tags: ["歴史", "自然", "癒やし"],
        lat: 34.2142,
        lon: 135.5847,
        companion: ["一人旅", "カップル"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 15,
        name: "近江八幡の水郷",
        prefecture: "滋賀",
        season: "春",
        category: "healing",
        description: "琵琶湖沿いの湿地帯に広がる、昔ながらの美しい水郷景観。手漕ぎの屋形船に揺られながら、春の菜の花や新緑を楽しむ贅沢な時間です。",
        img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&auto=format&fit=crop",
        tags: ["癒やし", "歴史", "リラックス"],
        lat: 35.1408,
        lon: 136.1044,
        companion: ["カップル", "一人旅", "子連れ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 16,
        name: "天橋立",
        prefecture: "京都",
        season: "夏",
        category: "nature",
        description: "日本三景の一つ。何千本もの松が生い茂る約3.6kmの砂州。「股のぞき」で見ると、天地が逆転し龍が天に舞い昇るように見えます。",
        img: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "リラックス"],
        lat: 35.5699,
        lon: 135.1917,
        companion: ["カップル", "子連れ", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 17,
        name: "彦根城",
        prefecture: "滋賀",
        season: "春",
        category: "history",
        description: "江戸時代の天守が当時のまま残る国宝の城。春には約1,200本の桜が咲き誇り、お堀の水面に美しく映り込みます。",
        img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "リラックス"],
        lat: 35.2764,
        lon: 136.2518,
        companion: ["一人旅", "子連れ", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 18,
        name: "アドベンチャーワールド",
        prefecture: "和歌山",
        season: "冬",
        category: "nature",
        description: "動物園、水族館、遊園地が一体となったテーマパーク。愛らしいジャイアントパンダファミリーに間近で会うことができます。",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop",
        tags: ["自然", "アクティブ", "観光"],
        lat: 33.6644,
        lon: 135.3769,
        companion: ["子連れ", "カップル", "友人グループ"],
        budget: "ラグジュアリー",
        transport: "自家用車",
        purpose: "アクティビティ"
    },
    {
        id: 19,
        name: "熊野古道",
        prefecture: "和歌山",
        season: "秋",
        category: "history",
        description: "世界遺産に登録された神聖な参詣道。杉の大木に囲まれた美しい石畳の道を歩き、古代の巡礼者たちの歴史を感じられます。",
        img: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop",
        tags: ["歴史", "自然", "癒やし"],
        lat: 33.6698,
        lon: 135.8841,
        companion: ["一人旅", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "アクティビティ"
    },
    {
        id: 20,
        name: "大阪城公園",
        prefecture: "大阪",
        season: "春",
        category: "history",
        description: "大阪の中心部に広がる巨大な公園。復興された堂々たる大阪城天守閣と、春に咲き誇る数千本の桜の名所として知られます。",
        img: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "リラックス"],
        lat: 34.6873,
        lon: 135.5262,
        companion: ["子連れ", "カップル", "一人旅"],
        budget: "低予算",
        transport: "徒歩",
        purpose: "リフレッシュ"
    },
    {
        id: 21,
        name: "法隆寺",
        prefecture: "奈良",
        season: "秋",
        category: "history",
        description: "世界最古の木造建築群を有する世界遺産。聖徳太子ゆかりの寺で、五重塔をはじめ数々の国宝や仏教美術が安置されています。",
        img: "https://images.unsplash.com/photo-1578436127897-769e1b3f0f36?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "リラックス"],
        lat: 34.6141,
        lon: 135.7356,
        companion: ["一人旅", "カップル"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 22,
        name: "城崎温泉",
        prefecture: "兵庫",
        season: "冬",
        category: "healing",
        description: "志賀直哉の小説ゆかりの風情ある温泉街。浴衣を着て川沿いの柳並木を歩きながら「外湯めぐり」を楽しむのが醍醐味です。",
        img: "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=500&auto=format&fit=crop",
        tags: ["癒やし", "リラックス", "グルメ"],
        lat: 35.6262,
        lon: 134.8109,
        companion: ["カップル", "一人旅", "友人グループ"],
        budget: "ラグジュアリー",
        transport: "公共交通機関",
        purpose: "リフレッシュ"
    },
    {
        id: 23,
        name: "天龍寺",
        prefecture: "京都",
        season: "春",
        category: "history",
        description: "京都・嵐山に位置する禅寺。日本最古の回遊式庭園「曹源池庭園」から眺める、嵐山を借景とした春の桜は息をのむ美しさです。",
        img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=500&auto=format&fit=crop",
        tags: ["歴史", "自然", "リラックス"],
        lat: 35.0158,
        lon: 135.6776,
        companion: ["一人旅", "カップル"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪"
    },
    {
        id: 24,
        name: "琵琶湖バレイ",
        prefecture: "滋賀",
        season: "夏",
        category: "nature",
        description: "打見山と蓬莱山の山頂に広がる高原リゾート。標高1,100mの「びわ湖テラス」からは、琵琶湖の圧倒的なパノラマを一望できます。",
        img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop",
        tags: ["自然", "アクティブ", "観光"],
        lat: 35.2084,
        lon: 135.8953,
        companion: ["カップル", "友人グループ", "子連れ"],
        budget: "ラグジュアリー",
        transport: "自家用車",
        purpose: "アクティビティ"
    },
    {
        id: 25,
        name: "六甲山テラス",
        prefecture: "兵庫",
        season: "秋",
        category: "nature",
        description: "神戸市街や大阪湾を見下ろす山頂エリア。秋は紅葉とともに、空気が澄み渡ることで「1000万ドルの夜景」が一段と輝きます。",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop",
        tags: ["自然", "観光", "都市"],
        lat: 34.7745,
        lon: 135.2631,
        companion: ["カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "リフレッシュ"
    }
];

// ==========================================
// 1-B. 都道府県別リアル名所プリセット & 動的生成ロジック
// ==========================================
const PREFECTURE_COORDINATES = {
    "北海道": { lat: 43.064, lon: 141.346 },
    "青森": { lat: 40.824, lon: 140.740 },
    "岩手": { lat: 39.703, lon: 141.152 },
    "宮城": { lat: 38.268, lon: 140.871 },
    "秋田": { lat: 39.718, lon: 140.102 },
    "山形": { lat: 38.240, lon: 140.363 },
    "福島": { lat: 37.750, lon: 140.467 },
    "茨城": { lat: 36.341, lon: 140.446 },
    "栃木": { lat: 36.565, lon: 139.883 },
    "群馬": { lat: 36.390, lon: 139.060 },
    "埼玉": { lat: 35.856, lon: 139.648 },
    "千葉": { lat: 35.607, lon: 140.123 },
    "東京": { lat: 35.689, lon: 139.692 },
    "神奈川": { lat: 35.447, lon: 139.642 },
    "新潟": { lat: 37.902, lon: 139.023 },
    "富山": { lat: 36.695, lon: 137.211 },
    "石川": { lat: 36.594, lon: 136.625 },
    "福井": { lat: 36.065, lon: 136.221 },
    "山梨": { lat: 35.663, lon: 138.568 },
    "長野": { lat: 36.651, lon: 138.181 },
    "岐阜": { lat: 35.391, lon: 136.722 },
    "静岡": { lat: 34.976, lon: 138.383 },
    "愛知": { lat: 35.180, lon: 136.906 },
    "三重": { lat: 34.730, lon: 136.508 },
    "滋賀": { lat: 35.004, lon: 135.868 },
    "京都": { lat: 35.021, lon: 135.755 },
    "大阪": { lat: 34.686, lon: 135.520 },
    "兵庫": { lat: 34.691, lon: 135.183 },
    "奈良": { lat: 34.685, lon: 135.832 },
    "和歌山": { lat: 34.226, lon: 135.167 },
    "鳥取": { lat: 35.503, lon: 134.238 },
    "島根": { lat: 35.472, lon: 133.050 },
    "岡山": { lat: 34.661, lon: 133.934 },
    "広島": { lat: 34.396, lon: 132.459 },
    "山口": { lat: 34.186, lon: 131.470 },
    "徳島": { lat: 34.065, lon: 134.559 },
    "香川": { lat: 34.340, lon: 134.043 },
    "愛媛": { lat: 33.841, lon: 132.765 },
    "高知": { lat: 33.559, lon: 133.531 },
    "福岡": { lat: 33.606, lon: 130.418 },
    "佐賀": { lat: 33.249, lon: 130.298 },
    "長崎": { lat: 32.744, lon: 129.873 },
    "熊本": { lat: 32.789, lon: 130.741 },
    "大分": { lat: 33.238, lon: 131.612 },
    "宮崎": { lat: 31.911, lon: 131.423 },
    "鹿児島": { lat: 31.560, lon: 130.558 },
    "沖縄": { lat: 26.212, lon: 127.680 }
};

function normalizePrefectureName(pref) {
    if (!pref || pref === "all") return "all";
    return pref.replace(/(県|府|都)$/, "");
}

// 主要都道府県のリアルな名所プリセットデータ
const PRESET_REAL_SPOTS = {
    "東京": [
        {
            id: 2001,
            name: "東京タワー",
            prefecture: "東京",
            season: "通年",
            category: "city",
            description: "東京のシンボルとして親しまれる高さ333mの総合電波塔。メインデッキからは東京の街並みが一望でき、夜間の温かみのあるオレンジ色のライトアップも格別です。",
            img: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&auto=format&fit=crop",
            tags: ["都市", "観光", "リラックス"],
            lat: 35.6586,
            lon: 139.7454,
            companion: ["カップル", "友人グループ", "子連れ"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2002,
            name: "東京スカイツリー",
            prefecture: "東京",
            season: "通年",
            category: "city",
            description: "地上634mを誇る世界一高い自立式電波塔。天望デッキ・天望回廊からの大パノラマはもちろん、足元に広がる巨大複合施設「東京ソラマチ」での買い物やグルメも楽しめます。",
            img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop",
            tags: ["都市", "観光", "グルメ"],
            lat: 35.7100,
            lon: 139.8107,
            companion: ["カップル", "友人グループ", "家族"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2003,
            name: "明治神宮",
            prefecture: "東京",
            season: "通年",
            category: "history",
            description: "都心の喧騒を忘れさせる約70万平方メートルの広大な鎮守の森。初詣日本一の参拝者数を誇り、大鳥居や豊かな緑に包まれた参道は心安らぐパワースポットです。",
            img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop",
            tags: ["歴史", "リラックス", "自然"],
            lat: 35.6764,
            lon: 139.6993,
            companion: ["一人旅", "カップル", "家族"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        },
        {
            id: 2004,
            name: "上野恩賜公園",
            prefecture: "東京",
            season: "春",
            category: "nature",
            description: "日本最初の都市公園の一つで、春には桜の名所として賑わいます。園内には上野動物園や東京国立博物館、美術館が点在し、一日中文化と自然を満喫できます。",
            img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
            tags: ["自然", "観光", "歴史"],
            lat: 35.7140,
            lon: 139.7741,
            companion: ["家族", "子連れ", "カップル"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "リフレッシュ"
        },
        {
            id: 2005,
            name: "新宿御苑",
            prefecture: "東京",
            season: "秋",
            category: "nature",
            description: "皇室の庭園として造られた都会のオアシス。日本庭園、イギリス風景式庭園、フランス式整形庭園が巧みに組み合わされ、四季折々の草花と広大な芝生が広がります。",
            img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
            tags: ["自然", "リラックス", "観光"],
            lat: 35.6852,
            lon: 139.7100,
            companion: ["一人旅", "カップル", "友人グループ"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "リフレッシュ"
        },
        {
            id: 2006,
            name: "お台場海浜公園",
            prefecture: "東京",
            season: "夏",
            category: "city",
            description: "レインボーブリッジと東京湾の摩天楼を一望できる開放的なシーサイドスポット。自由の女神像や砂浜プロムナードがあり、夕暮れから夜にかけての夜景は息をのむ美しさです。",
            img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
            tags: ["都市", "観光", "リラックス"],
            lat: 35.6300,
            lon: 139.7760,
            companion: ["カップル", "友人グループ"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2007,
            name: "築地場外市場",
            prefecture: "東京",
            season: "通年",
            category: "food",
            description: "威勢の良い声が飛び交う食のワンダーランド。新鮮な海鮮丼、玉子焼き、寿司などの名物グルメを味わえる飲食店や食材店がひしめき、活気あふれる食べ歩きが楽しめます。",
            img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
            tags: ["グルメ", "観光", "都市"],
            lat: 35.6655,
            lon: 139.7708,
            companion: ["友人グループ", "カップル", "一人旅"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "グルメ巡り"
        },
        {
            id: 2008,
            name: "六本木ヒルズ展望台 東京シティビュー",
            prefecture: "東京",
            season: "冬",
            category: "city",
            description: "海抜250mの屋内展望台から東京タワーをはじめとする煌びやかなメガシティの夜景を一望。森美術館も隣接し、ハイセンスなアートと絶景を同時に堪能できます。",
            img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop",
            tags: ["都市", "観光", "リラックス"],
            lat: 35.6599,
            lon: 139.7290,
            companion: ["カップル", "友人グループ"],
            budget: "ラグジュアリー",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2009,
            name: "皇居外苑・二重橋",
            prefecture: "東京",
            season: "秋",
            category: "history",
            description: "江戸城の面影を伝える石垣や美しい松並木が広がる国民公園。二重橋や伏見櫓を望むクラシカルな景観は、東京の中心地ならではの格式と静寂を感じさせます。",
            img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop",
            tags: ["歴史", "観光", "散策"],
            lat: 35.6795,
            lon: 139.7570,
            companion: ["一人旅", "カップル", "家族"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        }
    ],
    "北海道": [
        {
            id: 2011,
            name: "函館山展望台",
            prefecture: "北海道",
            season: "秋",
            category: "nature",
            description: "世界三大夜景の一つにも数えられる極上のパノラマビュー。扇状に広がる函館市街の灯りと津軽海峡の闇が織りなすドラマチックな景観をロープウェイで登って楽しめます。",
            img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
            tags: ["自然", "観光", "リラックス"],
            lat: 41.7588,
            lon: 140.7044,
            companion: ["カップル", "友人グループ"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2012,
            name: "富良野 ファーム富田",
            prefecture: "北海道",
            season: "夏",
            category: "nature",
            description: "丘一面を鮮やかな紫に染める日本屈指のラベンダー畑。十勝岳連峰を背景に広がる虹色の花畑や、名物のラベンダーソフトクリームが夏の北海道の代名詞です。",
            img: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop",
            tags: ["自然", "観光", "グルメ"],
            lat: 43.4183,
            lon: 142.4278,
            companion: ["カップル", "家族", "友人グループ"],
            budget: "低予算",
            transport: "自家用車",
            purpose: "リフレッシュ"
        },
        {
            id: 2013,
            name: "旭川市旭山動物園",
            prefecture: "北海道",
            season: "通年",
            category: "activity",
            description: "動物本来の生態を引き出す「行動展示」で全国的に有名な動物園。水中トンネルを飛ぶように泳ぐペンギンや円柱水槽を通るアザラシなど、驚きと感動の連続です。",
            img: "https://images.unsplash.com/photo-1533050487297-09b450131914?w=800&auto=format&fit=crop",
            tags: ["アクティブ", "観光", "自然"],
            lat: 43.7686,
            lon: 142.4797,
            companion: ["子連れ", "家族", "カップル"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "アクティビティ"
        },
        {
            id: 2014,
            name: "美瑛 白金青い池",
            prefecture: "北海道",
            season: "夏",
            category: "nature",
            description: "アルミニウムを含む地下水が混ざり合うことで生まれた神秘的なコバルトブルーの水面。水面に立ち枯れたカラマツが幻想的な美しさを醸し出す絶景スポットです。",
            img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
            tags: ["自然", "リラックス", "観光"],
            lat: 43.4936,
            lon: 142.6141,
            companion: ["カップル", "一人旅", "友人グループ"],
            budget: "低予算",
            transport: "自家用車",
            purpose: "リフレッシュ"
        },
        {
            id: 2015,
            name: "登別温泉 地獄谷",
            prefecture: "北海道",
            season: "冬",
            category: "healing",
            description: "毎分3000リットルもの温泉が湧き出す登別温泉の源泉地。立ち上る白煙と荒々しい岩肌はまるで地獄そのもので、周辺の旅館で多彩な泉質の名湯を堪能できます。",
            img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop",
            tags: ["温泉・癒やし", "自然", "リラックス"],
            lat: 42.4975,
            lon: 141.1444,
            companion: ["カップル", "一人旅", "家族"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "リフレッシュ"
        },
        {
            id: 2016,
            name: "札幌大通公園・テレビ塔",
            prefecture: "北海道",
            season: "冬",
            category: "city",
            description: "札幌市の中心部を東西に貫く緑豊かなオアシス。冬にはさっぽろ雪まつり、夏にはビアガーデンが開催され、テレビ塔の展望台からは札幌市街を一望できます。",
            img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop",
            tags: ["都市", "イベント", "観光"],
            lat: 43.0598,
            lon: 141.3554,
            companion: ["友人グループ", "子連れ", "カップル"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2017,
            name: "五稜郭タワー＆公園",
            prefecture: "北海道",
            season: "春",
            category: "history",
            description: "日本初のフランス築城方式による美しい星形要塞。地上107mのタワー展望台からは巨大な星形の全景を見下ろすことができ、春には1600本もの桜が咲き誇ります。",
            img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop",
            tags: ["歴史", "観光", "自然"],
            lat: 41.7969,
            lon: 140.7569,
            companion: ["一人旅", "カップル", "家族"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        },
        {
            id: 2018,
            name: "知床五湖",
            prefecture: "北海道",
            season: "夏",
            category: "nature",
            description: "世界自然遺産・知床の大自然に抱かれた原生林の中の湖沼群。高架木道からは雄大な知床連山と湖面に映る大自然を安全に散策でき、野生動物との出会いも魅力です。",
            img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop",
            tags: ["自然", "アクティブ", "リラックス"],
            lat: 44.1258,
            lon: 145.0831,
            companion: ["一人旅", "友人グループ", "カップル"],
            budget: "スタンダード",
            transport: "自家用車",
            purpose: "リフレッシュ"
        }
    ],
    "大阪": [
        {
            id: 2021,
            name: "ユニバーサル・スタジオ・ジャパン",
            prefecture: "大阪",
            season: "通年",
            category: "activity",
            description: "世界中からファンが集まる日本屈指のテーマパーク。マリオの世界やハリー・ポッターなど圧巻のクオリティを誇るアトラクションやショーが一日中楽しめます。",
            img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop",
            tags: ["アクティブ", "観光", "都市"],
            lat: 34.6654,
            lon: 135.4323,
            companion: ["友人グループ", "子連れ", "カップル"],
            budget: "ラグジュアリー",
            transport: "公共交通機関",
            purpose: "アクティビティ"
        },
        {
            id: 2022,
            name: "通天閣・新世界",
            prefecture: "大阪",
            season: "通年",
            category: "city",
            description: "大阪の下町情緒が色濃く残るレトロタウン。展望台のビリケンさんに願掛けした後は、名物の串かつ屋台や将棋クラブが並ぶジャンジャン横丁の活気を満喫。",
            img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
            tags: ["都市", "グルメ", "歴史"],
            lat: 34.6525,
            lon: 135.5063,
            companion: ["友人グループ", "一人旅", "カップル"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "グルメ巡り"
        },
        {
            id: 2023,
            name: "梅田スカイビル 空中庭園展望台",
            prefecture: "大阪",
            season: "通年",
            category: "city",
            description: "2棟のビルが連結した独特のフォルムが世界的に評価されるランドマーク。地上173mの屋上回廊「スカイ・ウォーク」から吹き抜ける風とともに360度大パノラマを望めます。",
            img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop",
            tags: ["都市", "観光", "リラックス"],
            lat: 34.7059,
            lon: 135.4897,
            companion: ["カップル", "友人グループ"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2024,
            name: "海遊館",
            prefecture: "大阪",
            season: "通年",
            category: "activity",
            description: "太平洋を取り囲む自然環境を再現した世界最大級の水族館。巨大な中央水槽を優雅に泳ぐ巨大なジンベエザメや愛らしいワモンアザラシを間近で観察できます。",
            img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
            tags: ["アクティブ", "観光", "リラックス"],
            lat: 34.6545,
            lon: 135.4289,
            companion: ["子連れ", "カップル", "家族"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2025,
            name: "万博記念公園・太陽の塔",
            prefecture: "大阪",
            season: "秋",
            category: "nature",
            description: "1970年大阪万博の跡地に広がる広大な緑地公園。岡本太郎デザインの「太陽の塔」がそびえ立ち、四季の草花や日本庭園、バーベキュー広場など見どころが尽きません。",
            img: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop",
            tags: ["自然", "観光", "歴史"],
            lat: 34.8115,
            lon: 135.5318,
            companion: ["家族", "子連れ", "友人グループ"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "リフレッシュ"
        },
        {
            id: 2026,
            name: "なんばグランド花月",
            prefecture: "大阪",
            season: "通年",
            category: "city",
            description: "「笑いの殿堂」として吉本新喜劇や人気芸人の漫才・落語が365日毎日上演される劇場。大阪ならではの爆笑ライブとお笑いグッズの買い物が楽しめます。",
            img: "https://images.unsplash.com/photo-1533050487297-09b450131914?w=800&auto=format&fit=crop",
            tags: ["都市", "エンタメ", "観光"],
            lat: 34.6657,
            lon: 135.5031,
            companion: ["友人グループ", "家族", "カップル"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2027,
            name: "和宗総本山 四天王寺",
            prefecture: "大阪",
            season: "春",
            category: "history",
            description: "推古天皇元年（593年）に聖徳太子が創建した日本仏法最初の官寺。五重塔や金堂が一直線に並ぶ伽藍配置は日本最古の様式を今に伝えています。",
            img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop",
            tags: ["歴史", "観光", "リラックス"],
            lat: 34.6533,
            lon: 135.5165,
            companion: ["一人旅", "家族", "カップル"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        }
    ],
    "京都": [
        {
            id: 2031,
            name: "祇園 花見小路通",
            prefecture: "京都",
            season: "春",
            category: "history",
            description: "石畳の通りに紅殻格子とすだれの美しい町家が並ぶ京都随一の花街。夕暮れ時には舞妓さんの姿を見かけることもあり、風情ある京料理や甘味処を巡る贅沢な時間を過ごせます。",
            img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
            tags: ["歴史", "グルメ", "観光"],
            lat: 35.0037,
            lon: 135.7750,
            companion: ["カップル", "一人旅", "友人グループ"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        },
        {
            id: 2032,
            name: "貴船神社",
            prefecture: "京都",
            season: "夏",
            category: "nature",
            description: "万物の命の源である水の神を祀る古社。朱塗りの春日灯篭が並ぶ石段参道は息をのむ美しさで、夏には貴船川にせり出した風流な川床料理と涼風を楽しめます。",
            img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
            tags: ["自然", "歴史", "リラックス"],
            lat: 35.1217,
            lon: 135.7629,
            companion: ["カップル", "一人旅"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "リフレッシュ"
        },
        {
            id: 2033,
            name: "元離宮二条城",
            prefecture: "京都",
            season: "秋",
            category: "history",
            description: "徳川家康が築城し、大政奉還の舞台となった世界遺産。国宝・二の丸御殿の豪華絢爛な障壁画や歩くと音が鳴る「鴬張りの廊下」、広大な回遊式庭園が見どころです。",
            img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop",
            tags: ["歴史", "観光", "自然"],
            lat: 35.0142,
            lon: 135.7482,
            companion: ["一人旅", "カップル", "家族"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        },
        {
            id: 2034,
            name: "南禅寺 水路閣",
            prefecture: "京都",
            season: "秋",
            category: "history",
            description: "臨済宗南禅寺派の大本山。境内に突如現れる明治期の赤煉瓦アーチ橋「水路閣」は静寂の禅寺と近代土木が調和したフォトジェニックな名所で、三門からの眺望も見事です。",
            img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop",
            tags: ["歴史", "観光", "自然"],
            lat: 35.0116,
            lon: 135.7942,
            companion: ["カップル", "一人旅", "友人グループ"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        },
        {
            id: 2035,
            name: "平等院鳳凰堂",
            prefecture: "京都",
            season: "春",
            category: "history",
            description: "十円硬貨の意匠でおなじみの極楽浄土を具現化した国宝建築。阿字池の中島に優美に翼を広げる鳳凰堂の水面リフレクションや、宇治茶の香る宇治の街散策が魅力です。",
            img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop",
            tags: ["歴史", "観光", "リラックス"],
            lat: 34.8893,
            lon: 135.8078,
            companion: ["一人旅", "カップル", "家族"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        },
        {
            id: 2036,
            name: "錦市場",
            prefecture: "京都",
            season: "通年",
            category: "food",
            description: "「京都の台所」として約400年の歴史を持つ全長390mの商店街。京野菜、湯葉、漬物、串刺しのハモや天ぷらなど、老舗が手がける多彩な味覚の食べ歩きが楽しめます。",
            img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
            tags: ["グルメ", "観光", "都市"],
            lat: 35.0050,
            lon: 135.7649,
            companion: ["友人グループ", "カップル", "一人旅"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "グルメ巡り"
        },
        {
            id: 2037,
            name: "銀閣寺（慈照寺）",
            prefecture: "京都",
            season: "秋",
            category: "history",
            description: "室町幕府8代将軍・足利義政が築いた東山文化を象徴する国宝寺院。質素で洗練された観音殿や、白砂を盛り上げた「向月台」「銀沙灘」、苔庭の美しさに心が洗われます。",
            img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
            tags: ["歴史", "リラックス", "自然"],
            lat: 35.0272,
            lon: 135.7982,
            companion: ["一人旅", "カップル"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        }
    ],
    "沖縄": [
        {
            id: 2041,
            name: "恩納村 万座毛",
            prefecture: "沖縄",
            season: "夏",
            category: "nature",
            description: "隆起サンゴ礁の断崖に広がる天然芝生と、象の鼻に似た奇岩がシンボルの名勝。眼下に広がるエメラルドグリーンの東シナ海と心地よい潮風を満喫できます。",
            img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
            tags: ["自然", "観光", "リラックス"],
            lat: 26.5049,
            lon: 127.8502,
            companion: ["カップル", "友人グループ", "家族"],
            budget: "低予算",
            transport: "レンタカー",
            purpose: "リフレッシュ"
        },
        {
            id: 2042,
            name: "古宇利大橋＆古宇利島",
            prefecture: "沖縄",
            season: "夏",
            category: "nature",
            description: "全長1,960mを誇る離島架橋。まるでエメラルドブルーの海上を走っているかのような爽快なドライブが楽しめ、島内のハートロックやカフェ巡りも大人気です。",
            img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
            tags: ["自然", "ドライブ", "観光"],
            lat: 26.6961,
            lon: 128.0244,
            companion: ["カップル", "友人グループ"],
            budget: "低予算",
            transport: "レンタカー",
            purpose: "観光"
        },
        {
            id: 2043,
            name: "首里城公園",
            prefecture: "沖縄",
            season: "通年",
            category: "history",
            description: "琉球王国の政治・外交・文化の中心であった世界遺産。朱塗りの守礼門や歓会門、復興へ歩みを進める正殿エリアなど、独自の琉球文化と高台からの那覇市街の眺めが魅力です。",
            img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop",
            tags: ["歴史", "観光", "文化"],
            lat: 26.2170,
            lon: 127.7195,
            companion: ["家族", "一人旅", "カップル"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        },
        {
            id: 2044,
            name: "那覇 国際通り",
            prefecture: "沖縄",
            season: "通年",
            category: "city",
            description: "約1.6kmにわたってお土産屋、沖縄料理店、カフェが立ち並ぶメインストリート。「奇跡の1マイル」と呼ばれ、夜遅くまで三線の音色と活気あふれる賑わいが続きます。",
            img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
            tags: ["都市", "グルメ", "買い物"],
            lat: 26.2152,
            lon: 127.6853,
            companion: ["友人グループ", "カップル", "一人旅"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "グルメ巡り"
        },
        {
            id: 2045,
            name: "石垣島 川平湾",
            prefecture: "沖縄",
            season: "夏",
            category: "nature",
            description: "ミシュラン・グリーンガイド・ジャポンで三ツ星を獲得した日本屈指の景勝地。光の加減で刻々と色を変える七色の海をグラスボートで巡り、色鮮やかな熱帯魚とサンゴ礁を鑑賞できます。",
            img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
            tags: ["自然", "リラックス", "アクティブ"],
            lat: 24.4533,
            lon: 124.1438,
            companion: ["カップル", "家族", "一人旅"],
            budget: "スタンダード",
            transport: "レンタカー",
            purpose: "リフレッシュ"
        },
        {
            id: 2046,
            name: "宮古島 与那覇前浜ビーチ",
            prefecture: "沖縄",
            season: "夏",
            category: "nature",
            description: "「東洋一の美しさ」と称される約7kmに及ぶパウダーサンドの白い砂浜。宮古ブルーと呼ばれる奇跡のような透明度の海と、対岸の来間島を結ぶ来間大橋の景色は圧巻です。",
            img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop",
            tags: ["自然", "リラックス", "アクティブ"],
            lat: 24.7336,
            lon: 125.2636,
            companion: ["カップル", "友人グループ", "一人旅"],
            budget: "低予算",
            transport: "レンタカー",
            purpose: "リフレッシュ"
        },
        {
            id: 2047,
            name: "美浜アメリカンビレッジ",
            prefecture: "沖縄",
            season: "通年",
            category: "city",
            description: "西海岸沿いに広がるアメリカの西海岸リゾートを思わせる巨大エンタメタウン。フォトジェニックな街並み、多彩なセレクトショップ、美しい夕日を望むテラス席が魅力です。",
            img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop",
            tags: ["都市", "買い物", "グルメ"],
            lat: 26.3160,
            lon: 127.7570,
            companion: ["友人グループ", "カップル", "家族"],
            budget: "スタンダード",
            transport: "レンタカー",
            purpose: "観光"
        }
    ],
    "福岡": [
        {
            id: 2051,
            name: "糸島・桜井二見ヶ浦",
            prefecture: "福岡",
            season: "夏",
            category: "nature",
            description: "青い玄界灘に浮かぶ夫婦岩と真っ白な鳥居が印象的な景勝地。「日本の夕日百選」にも選ばれており、海岸線沿いにおしゃれなカフェやクラフトショップが並びます。",
            img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
            tags: ["自然", "ドライブ", "リラックス"],
            lat: 33.6425,
            lon: 130.1983,
            companion: ["カップル", "友人グループ"],
            budget: "低予算",
            transport: "自家用車",
            purpose: "リフレッシュ"
        },
        {
            id: 2052,
            name: "門司港レトロ",
            prefecture: "福岡",
            season: "秋",
            category: "history",
            description: "明治・大正期のレトロな洋館や赤煉瓦建築が立ち並ぶ港町。重要文化財の門司港駅舎や関門海峡のパノラマビュー、名物「焼きカレー」を堪能できます。",
            img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
            tags: ["歴史", "グルメ", "観光"],
            lat: 33.9458,
            lon: 130.9614,
            companion: ["カップル", "家族", "一人旅"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        },
        {
            id: 2053,
            name: "中洲屋台街",
            prefecture: "福岡",
            season: "通年",
            category: "food",
            description: "那珂川沿いに暖簾が並ぶ博多の夜の代名詞。本場の博多とんこつラーメン、一口餃子、焼き鳥など、店主やお隣の旅人との会話を楽しみながら活気ある夜を満喫できます。",
            img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
            tags: ["グルメ", "都市", "ナイトライフ"],
            lat: 33.5910,
            lon: 130.4072,
            companion: ["友人グループ", "一人旅", "カップル"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "グルメ巡り"
        },
        {
            id: 2054,
            name: "福岡タワー",
            prefecture: "福岡",
            season: "冬",
            category: "city",
            description: "高さ234m、海浜タワーとしては日本一の高さを誇るシーサイドタワー。8000枚ものハーフミラーで覆われた三角柱の美しい外観と、博多湾を見渡す360度展望が自慢です。",
            img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop",
            tags: ["都市", "観光", "リラックス"],
            lat: 33.5933,
            lon: 130.3515,
            companion: ["カップル", "友人グループ", "子連れ"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2055,
            name: "櫛田神社",
            prefecture: "福岡",
            season: "夏",
            category: "history",
            description: "「お櫛田さん」の愛称で親しまれる博多の総鎮守。博多祇園山笠のクライマックス「追い山」のスタート地点であり、境内には迫力ある飾り山笠が一年中展示されています。",
            img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop",
            tags: ["歴史", "観光", "パワースポット"],
            lat: 33.5930,
            lon: 130.4106,
            companion: ["一人旅", "カップル", "家族"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        },
        {
            id: 2056,
            name: "柳川 川下り",
            prefecture: "福岡",
            season: "春",
            category: "nature",
            description: "掘割（水路）が網の目のように巡る水郷・柳川をどんこ舟でゆったり下る風情満点の舟旅。船頭さんの巧みな竿さばきと歌声を聞きながら、名物うなぎのせいろ蒸しも味わえます。",
            img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop",
            tags: ["自然", "グルメ", "歴史"],
            lat: 33.1614,
            lon: 130.4078,
            companion: ["家族", "カップル", "シニア"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "リフレッシュ"
        }
    ],
    "神奈川": [
        {
            id: 2061,
            name: "鎌倉大仏 高徳院",
            prefecture: "神奈川",
            season: "通年",
            category: "history",
            description: "古都・鎌倉のシンボルである国宝の阿弥陀如来坐像。屋外に露坐する高さ約11.3mの大仏様は圧巻の存在感で、胎内に入って内側から見学することもできます。",
            img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop",
            tags: ["歴史", "観光", "パワースポット"],
            lat: 35.3168,
            lon: 139.5357,
            companion: ["一人旅", "カップル", "家族"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        },
        {
            id: 2062,
            name: "江の島・シーキャンドル",
            prefecture: "神奈川",
            season: "夏",
            category: "nature",
            description: "相模湾に浮かぶ歴史と自然に満ちた人気リゾートアイランド。展望灯台シーキャンドルからの富士山と夕日の絶景、岩屋洞窟、新鮮な生しらす丼が楽しめます。",
            img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
            tags: ["自然", "観光", "グルメ"],
            lat: 35.2997,
            lon: 139.4794,
            companion: ["カップル", "友人グループ", "一人旅"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2063,
            name: "箱根神社・平和の鳥居",
            prefecture: "神奈川",
            season: "秋",
            category: "history",
            description: "芦ノ湖畔の深緑に囲まれた関東屈指の名社。湖上に朱色に映える「平和の鳥居」は国内外から参拝者が訪れるパワースポットで、富士山を望む遊覧船クルーズも人気です。",
            img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
            tags: ["歴史", "自然", "リラックス"],
            lat: 35.2048,
            lon: 139.0253,
            companion: ["カップル", "家族", "一人旅"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "リフレッシュ"
        },
        {
            id: 2064,
            name: "大涌谷",
            prefecture: "神奈川",
            season: "冬",
            category: "nature",
            description: "約3000年前の水蒸気爆発でできた箱根火山の火口原。白煙と硫黄の香りが立ち込めるダイナミックな景観と、1個食べると7年寿命が延びると伝わる名物「黒たまご」が有名です。",
            img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop",
            tags: ["自然", "観光", "グルメ"],
            lat: 35.2428,
            lon: 139.0194,
            companion: ["家族", "友人グループ", "カップル"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "観光"
        },
        {
            id: 2065,
            name: "横浜中華街",
            prefecture: "神奈川",
            season: "通年",
            category: "food",
            description: "500軒以上の中国料理店や雑貨店がひしめく東アジア最大級の中華街。小籠包、焼き小籠包、タピオカなどの食べ歩きや、本格広東料理・四川料理のフルコースを堪能できます。",
            img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
            tags: ["グルメ", "都市", "買い物"],
            lat: 35.4428,
            lon: 139.6455,
            companion: ["友人グループ", "家族", "カップル"],
            budget: "スタンダード",
            transport: "公共交通機関",
            purpose: "グルメ巡り"
        },
        {
            id: 2066,
            name: "鶴岡八幡宮",
            prefecture: "神奈川",
            season: "春",
            category: "history",
            description: "源頼朝が創建した鎌倉武家文化の中心。段葛の桜並木を抜けた先にある大石段と朱塗りの本宮は壮麗で、小町通りでのショッピングやカフェ巡りと合わせて散策できます。",
            img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop",
            tags: ["歴史", "観光", "散策"],
            lat: 35.3260,
            lon: 139.5564,
            companion: ["一人旅", "カップル", "家族"],
            budget: "低予算",
            transport: "公共交通機関",
            purpose: "歴史探訪"
        }
    ]
};

// 多彩な観光スポット生成用テンプレート (47都道府県すべてに対応)
const SPOT_TEMPLATES = [
    {
        nameSuffix: "スカイパノラマ展望台",
        category: "nature",
        season: "秋",
        tags: ["自然", "観光", "リラックス"],
        companion: ["カップル", "友人グループ", "一人旅"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "リフレッシュ",
        img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
        desc: "標高の高い丘陵地から地域一帯の街並みと雄大な山並みを一望できる絶景スポット。夕景から夜景へと移り変わるトワイライトタイムは息を呑む美しさです。"
    },
    {
        nameSuffix: "歴史街道 蔵の街並み",
        category: "history",
        season: "春",
        tags: ["歴史", "観光", "グルメ"],
        companion: ["カップル", "一人旅", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "歴史探訪",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
        desc: "江戸・明治期の面影を色濃く残す白壁の蔵屋敷や町家が立ち並ぶ風情ある散策エリア。伝統的な和菓子処や古民家カフェでゆったりとした時間を過ごせます。"
    },
    {
        nameSuffix: "清流ネイチャー渓谷",
        category: "nature",
        season: "夏",
        tags: ["自然", "リラックス", "アクティブ"],
        companion: ["友人グループ", "カップル", "子連れ"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "リフレッシュ",
        img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop",
        desc: "エメラルドグリーンに澄み渡る清流と四季の木々に包まれた癒やしの渓谷。マイナスイオンあふれる滝や遊歩道が整備され、夏には涼やかな川遊びも楽しめます。"
    },
    {
        nameSuffix: "名湯 湯けむり温泉郷",
        category: "healing",
        season: "冬",
        tags: ["温泉・癒やし", "リラックス", "グルメ"],
        companion: ["カップル", "一人旅", "家族"],
        budget: "ラグジュアリー",
        transport: "公共交通機関",
        purpose: "リフレッシュ",
        img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop",
        desc: "古くから旅人の疲れを癒やしてきた名湯。立ち並ぶ湯宿の露天風呂からは情緒豊かな景色を堪能でき、地元の旬の味覚をふんだんに使った会席料理も自慢です。"
    },
    {
        nameSuffix: "ご当地グルメ横丁＆朝市",
        category: "food",
        season: "通年",
        tags: ["グルメ", "観光", "都市"],
        companion: ["友人グループ", "カップル", "一人旅"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "グルメ巡り",
        img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
        desc: "地元の新鮮な海の幸・山の幸や郷土料理の屋台が軒を連ねる活気あふれるグルメエリア。名物料理の食べ歩きやお土産探しに最適なスポットです。"
    },
    {
        nameSuffix: "フラワーヒルズ高原植物園",
        category: "nature",
        season: "春",
        tags: ["自然", "観光", "リラックス"],
        companion: ["カップル", "子連れ", "家族"],
        budget: "低予算",
        transport: "自家用車",
        purpose: "観光",
        img: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop",
        desc: "広大な丘一面に季節の花々が咲き誇る人気ガーデン。春の花壇や秋の紅葉、フォトジェニックなカフェテラスなど、心地よい高原の風を感じながら散策できます。"
    },
    {
        nameSuffix: "鎮守の杜 古社総本宮",
        category: "history",
        season: "通年",
        tags: ["歴史", "観光", "リラックス"],
        companion: ["一人旅", "カップル", "家族"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "歴史探訪",
        img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop",
        desc: "千年以上の歴史を誇る格式高い古社。巨木が生い茂る厳かな参道を歩くだけで心が洗われるパワースポットとして全国から多くの参拝客が訪れます。"
    },
    {
        nameSuffix: "ウォーターフロント シーサイドパーク",
        category: "city",
        season: "夏",
        tags: ["都市", "観光", "アクティブ"],
        companion: ["カップル", "友人グループ", "子連れ"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "観光",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
        desc: "海風が吹き抜ける開放的なベイエリア。芝生広場やプロムナード、夜にはライトアップされた水辺の景色がロマンチックなデートスポットとしても人気です。"
    },
    {
        nameSuffix: "フォレスト・アドベンチャーの森",
        category: "activity",
        season: "夏",
        tags: ["アクティブ", "自然", "観光"],
        companion: ["友人グループ", "子連れ", "家族"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "アクティビティ",
        img: "https://images.unsplash.com/photo-1533050487297-09b450131914?w=800&auto=format&fit=crop",
        desc: "自然の森をそのまま生かした樹上アスレチックやジップラインが楽しめる体験型アウトドアパーク。子どもから大人まで爽快なスリルを体感できます。"
    },
    {
        nameSuffix: "現代アート＆カルチャーミュージアム",
        category: "city",
        season: "通年",
        tags: ["都市", "観光", "リラックス"],
        companion: ["一人旅", "カップル", "友人グループ"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "観光",
        img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop",
        desc: "独創的な現代アート展示と洗練された建築デザインが融合した文化施設。静かな空間で芸術作品に触れ、併設されたブックカフェでくつろぎのひとときを楽しめます。"
    },
    {
        nameSuffix: "伝統工芸と手仕事の里",
        category: "history",
        season: "秋",
        tags: ["歴史", "グルメ", "観光"],
        companion: ["カップル", "家族", "一人旅"],
        budget: "スタンダード",
        transport: "自家用車",
        purpose: "歴史探訪",
        img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop",
        desc: "代々受け継がれてきた伝統工芸の工房が集まる落ち着いた集落。職人の技を間近で見学できるほか、自作の器や染め物づくりなどの体験教室が充実しています。"
    },
    {
        nameSuffix: "サンセット岬 オーシャンビュー展望台",
        category: "nature",
        season: "夏",
        tags: ["自然", "観光", "リラックス"],
        companion: ["カップル", "一人旅", "友人グループ"],
        budget: "低予算",
        transport: "自家用車",
        purpose: "リフレッシュ",
        img: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&auto=format&fit=crop",
        desc: "水平線に沈む夕陽が絶景の岬。広がる海と打ち寄せる波の音に包まれながら、遮るもののない大パノラマを楽しめるドライブコースのハイライトです。"
    },
    {
        nameSuffix: "星空ネイチャーキャンプ＆グランピング",
        category: "activity",
        season: "秋",
        tags: ["自然", "アクティブ", "リラックス"],
        companion: ["友人グループ", "カップル", "家族"],
        budget: "ラグジュアリー",
        transport: "自家用車",
        purpose: "アクティビティ",
        img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
        desc: "満天の星空の下で贅沢なグランピング体験。焚き火を囲みながら地元食材のBBQを堪能し、日常の喧騒から離れた特別な夜を過ごせます。"
    },
    {
        nameSuffix: "クラフトビール＆ワイナリーテラス",
        category: "food",
        season: "秋",
        tags: ["グルメ", "観光", "リラックス"],
        companion: ["カップル", "友人グループ", "大人旅"],
        budget: "スタンダード",
        transport: "公共交通機関",
        purpose: "グルメ巡り",
        img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
        desc: "葡萄畑やホップ畑を望む開放的なテラスで、醸造仕立てのクラフトドリンクとペアリング料理を堪能できる人気ワイナリー＆ブルワリーです。"
    },
    {
        nameSuffix: "城址公園 四季の天守閣",
        category: "history",
        season: "春",
        tags: ["歴史", "自然", "観光"],
        companion: ["一人旅", "カップル", "家族"],
        budget: "低予算",
        transport: "公共交通機関",
        purpose: "歴史探訪",
        img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop",
        desc: "戦国・江戸の歴史を刻む壮大な石垣と復元天守がそびえる名城跡。春には千本桜が咲き誇り、お堀の水面に映える桜並木は圧巻の美観を誇ります。"
    }
];

// 動的スポット生成関数
function generateDynamicSpots(prefecture, neededCount, startId = 10000) {
    const coords = PREFECTURE_COORDINATES[prefecture] || { lat: 35.689, lon: 139.692 };
    const generated = [];

    for (let i = 0; i < neededCount; i++) {
        const tmpl = SPOT_TEMPLATES[i % SPOT_TEMPLATES.length];
        const spotId = startId + i;
        const latOffset = Number((((i * 17) % 13 - 6) * 0.008).toFixed(4));
        const lonOffset = Number((((i * 23) % 15 - 7) * 0.009).toFixed(4));

        generated.push({
            id: spotId,
            name: `${prefecture} ${tmpl.nameSuffix}`,
            prefecture: prefecture,
            season: tmpl.season,
            category: tmpl.category,
            description: `${prefecture}を訪れたら外せない注目のスポット。${tmpl.desc}`,
            img: tmpl.img,
            tags: [...tmpl.tags],
            lat: Number((coords.lat + latOffset).toFixed(4)),
            lon: Number((coords.lon + lonOffset).toFixed(4)),
            companion: [...tmpl.companion],
            budget: tmpl.budget,
            transport: tmpl.transport,
            purpose: tmpl.purpose
        });
    }
    return generated;
}

// 都道府県ごとに15〜20件の観光スポットを確実に確保する関数
function ensurePrefectureSpots(prefInput, targetCount = 16) {
    if (!prefInput || prefInput === "all") {
        return;
    }
    const normPref = normalizePrefectureName(prefInput);
    const existing = kinkiPlaces.filter(p => normalizePrefectureName(p.prefecture) === normPref);

    if (existing.length >= targetCount) {
        return;
    }

    const needed = targetCount - existing.length;
    const existingNames = new Set(kinkiPlaces.map(p => p.name));
    const newSpots = [];

    // 1. 主要県リアルプリセットにあれば優先追加
    if (PRESET_REAL_SPOTS[normPref]) {
        for (const spot of PRESET_REAL_SPOTS[normPref]) {
            if (!existingNames.has(spot.name) && newSpots.length < needed) {
                newSpots.push(spot);
                existingNames.add(spot.name);
            }
        }
    }

    // 2. まだ不足があれば動的ジェネレータで補完
    if (newSpots.length < needed) {
        const stillNeeded = needed - newSpots.length;
        const maxId = kinkiPlaces.reduce((max, p) => Math.max(max, p.id || 0), 3000);
        const dynamicSpots = generateDynamicSpots(normPref, stillNeeded, maxId + 1);
        for (const dSpot of dynamicSpots) {
            if (!existingNames.has(dSpot.name)) {
                newSpots.push(dSpot);
                existingNames.add(dSpot.name);
            }
        }
    }

    if (newSpots.length > 0) {
        kinkiPlaces.push(...newSpots);
    }
}

// 2. モックホテルデータ (楽天トラベル連携用)
// ==========================================
const mockHotels = {
    "京都": [
        { name: "嵐山 辨慶", rating: "4.8", price: "￥28,000〜", desc: "嵐山の大自然を望む極上の温泉旅館。川のせせらぎと季節の会席料理を堪能。" },
        { name: "京都ブライトンホテル", rating: "4.5", price: "￥14,000〜", desc: "京都御所近くの閑静な佇まい。伝統工芸を散りばめたモダンな客室が魅力。" }
    ],
    "大阪": [
        { name: "ホテル阪急インターナショナル", rating: "4.6", price: "￥19,000〜", desc: "梅田の中心に位置するラグジュアリーホテル。高層階からの素晴らしい夜景。" },
        { name: "スイスホテル南海大阪", rating: "4.4", price: "￥16,000〜", desc: "なんば駅直結でアクセス抜群。難波の街を見下ろすスタイリッシュな空間。" }
    ],
    "兵庫": [
        { name: "兵衛向陽閣", rating: "4.7", price: "￥24,000〜", desc: "創業700年の歴史を持つ有馬の名宿。自慢の三つの大浴場で金泉を満喫。" },
        { name: "神戸メリケンパークオリエンタルホテル", rating: "4.5", price: "￥12,000〜", desc: "波をモチーフにした神戸のランドマーク。全室バルコニー付きのオーシャンビュー。" }
    ],
    "奈良": [
        { name: "奈良ホテル", rating: "4.6", price: "￥20,000〜", desc: "明治創業の「関西の迎賓館」。重厚な木造建築と和洋折衷のクラシカルな世界観。" },
        { name: "ピアッツァホテル奈良", rating: "4.2", price: "￥8,500〜", desc: "JR奈良駅すぐの機能的で清潔なシティホテル。大和伝統食を取り入れた朝食が人気。" }
    ],
    "滋賀": [
        { name: "琵琶湖ホテル", rating: "4.4", price: "￥13,500〜", desc: "全室レイクビューの温泉リゾート。大津港に面し、夜には大噴水ライトアップが目前に。" },
        { name: "セトレ マリーナびわ湖", rating: "4.6", price: "￥18,000〜", desc: "比良山系と琵琶湖を望むプライベートホテル。滋賀の地元食材を活かした極上イタリアン。" }
    ],
    "和歌山": [
        { name: "白浜温泉 むさし", rating: "4.3", price: "￥15,000〜", desc: "白良浜まで徒歩1分の好立地。和歌山の新鮮な海の幸バイキングと多彩な源泉掛け流し。" },
        { name: "インフィニート ホテル＆スパ 南紀白浜", rating: "4.7", price: "￥26,000〜", desc: "高台から太平洋を一望する絶景インフィニティ温泉。欧米スタイルの上質なスパリゾート。" }
    ],
    "北海道": [
        { name: "運河の宿 おたる ふる川", rating: "4.7", price: "￥22,000〜", desc: "小樽運河の目の前に位置するノスタルジックな温泉宿。運河を望む展望風呂が自慢。" },
        { name: "ホテルノルド小樽", rating: "4.4", price: "￥12,000〜", desc: "小樽運河を望むヨーロッパ調のクラシックホテル。最上階のラウンジからの眺望が格別。" }
    ]
};

// ==========================================
// 3. アプリの状態管理 (Local Storage 連携)
// ==========================================
let likes = JSON.parse(localStorage.getItem("kw_likes")) || [];
let anmaris = JSON.parse(localStorage.getItem("kw_anmaris")) || [];
let favorites = JSON.parse(localStorage.getItem("kw_favorites")) || [];
let plans = JSON.parse(localStorage.getItem("kw_plans")) || [];
let detailedPrefs = {
    companion: { "一人旅": 25, "カップル": 25, "友人グループ": 25, "子連れ": 25 },
    budget: { "低予算": 33, "スタンダード": 34, "ラグジュアリー": 33 },
    transport: { "自家用車": 33, "公共交通機関": 34, "徒歩": 33 },
    purpose: { "リフレッシュ": 25, "アクティビティ": 25, "グルメ": 25, "歴史探訪": 25 }
};
let dismissedSuggestions = [];
let currentSuggestions = [];

const defaultSharedPlans = [
    {
        id: 10001,
        author: "ひろし (温泉ソムリエ)",
        avatar: "explorer",
        destination: "有馬温泉",
        prefecture: "兵庫",
        date: "2026-11-23",
        nights: 2,
        people: 2,
        budget: 50000,
        itineraryText: `【有馬温泉を巡る 2泊3日 旅行プラン】\n📅 日程: 2026-11-23 〜 | 👥 人数: 2名様 | 💰 予算目安: 50,000円程度\n🌟 重視: グルメ, 温泉・癒やし\n\n--- 🗺️ スケジュール提案 ---\n■ 1日目:\n  ・午後: 神戸三宮からバスで有馬温泉へ直行。情緒あるレトロな温泉街を散策。\n  ・夕方: 有馬の金泉・銀泉を楽しめる伝統の旅館にチェックイン。\n  ・夜間: 旬の但馬牛や瀬戸内の新鮮な魚介をあしらった会席料理に舌鼓。\n\n■ 2日目:\n  ・午前: 瑞宝寺公園で紅葉や新緑をハイキング。\n  ・昼食: 炭酸せんべいや有馬ビールを片手に温泉街で食べ歩き。\n  ・午後: 六甲有馬ロープウェーで六甲山山頂へ登り、絶景を堪能。\n  ・夜間: 宿の露天風呂で星空を眺めながらゆったり。\n\n■ 最終日:\n  ・午前: 温泉寺の参拝と、お土産屋でのショッピング。\n  ・午後: カフェで名物の「炭酸和菓子」とお茶を頂きリフレッシュ。\n  ・夕方: バスまたは神戸電鉄で帰路へ。`
    },
    {
        id: 10002,
        author: "さくら",
        avatar: "wanderer",
        destination: "清水寺",
        prefecture: "京都",
        date: "2026-10-15",
        nights: 1,
        people: 1,
        budget: 30000,
        itineraryText: `【清水寺を巡る 1泊2日 旅行プラン】\n📅 日程: 2026-10-15 〜 | 👥 人数: 1名様 | 💰 予算目安: 30,000円程度\n🌟 重視: 観光・歴史, 自然・癒やし\n\n--- 🗺️ スケジュール提案 ---\n■ 1日目:\n  ・午前: JR京都駅到着。市バスで清水寺方面へ移動。\n  ・昼食: 清水坂近くで湯豆腐セットとお抹茶を味わう。\n  ・午後: 世界遺産・清水寺をゆっくり参拝。清水の舞台からの眺望と音羽の滝を体験。\n  ・夕方: 三寧坂（産念坂）・二寧坂を風情を感じながら散策し、和雑貨店巡り。\n  ・夜間: 東山の町家を改装したお洒落なゲストハウスにチェックイン。近隣の居酒屋で京風おばんざいディナー。\n\n■ 最終日:\n  ・午前: 早朝の静かな八坂神社と円山公園を散策。\n  ・午後: 祇園エリアで老舗甘味処のパフェを堪能。\n  ・夕方: 京都駅でお土産（八つ橋など）を調達して解散。`
    },
    {
        id: 10003,
        author: "たびびとA",
        avatar: "adventurer",
        destination: "奈良公園",
        prefecture: "奈良",
        date: "2026-09-05",
        nights: 1,
        people: 4,
        budget: 40000,
        itineraryText: `【奈良公園を巡る 1泊2日 旅行プラン】\n📅 日程: 2026-09-05 〜 | 👥 人数: 4名様 | 💰 予算目安: 40,000円程度\n🌟 重視: 観光・歴史, 自然・癒やし\n\n--- 🗺️ スケジュール提案 ---\n■ 1日目:\n  ・午前: 近鉄奈良駅に集合。徒歩で奈良公園へ。\n  ・午後: 東大寺大仏殿で大仏様を拝観。南大門の金剛力士像に圧倒される。その後、公園内の鹿と戯れ鹿せんべいを与える。\n  ・夕方: 若草山麓を散策し、夕日に染まる古都 of 絶景を眺める。\n  ・夜間: 奈良公園近くの和風旅館にチェックイン。大和ポークのしゃぶしゃぶを楽しむ。\n\n■ 最終日:\n  ・午前: 春日大社を参拝。朱塗りの本殿と燈籠の回廊を見学。\n  ・昼食: ならまち（旧市街）で名物の柿の葉寿司や大和茶粥ランチ。\n  ・午後: ならまちのクラフトビール店やカフェで旅の振り返り。\n  ・夕方: お土産を片手に近鉄奈良駅より解散。`
    }
];

let sharedPlans = JSON.parse(localStorage.getItem("kw_shared_plans"));
if (!sharedPlans || sharedPlans.length === 0) {
    sharedPlans = [...defaultSharedPlans];
    localStorage.setItem("kw_shared_plans", JSON.stringify(sharedPlans));
}

// アカウント・UI設定の読み込み
let userName = localStorage.getItem("kw_username") || "トラベラー";
let userAvatar = localStorage.getItem("kw_avatar") || "traveler";
let headerTitle = localStorage.getItem("kw_headertitle");
if (headerTitle === "Kinki Wander" || !headerTitle) {
    headerTitle = "Japan Wander";
    localStorage.setItem("kw_headertitle", "Japan Wander");
}
let currentTheme = localStorage.getItem("kw_theme") || "mc-blue";
let currentFontSize = localStorage.getItem("kw_fontsize") || "100";
let currentLanguage = localStorage.getItem("kw_lang") || "ja";


// カード関連の一時状態
let activeFilters = { season: "all", category: "all" };
let currentCardPool = [];
let nextPoolIndex = 0;
let isDragging = false;
let activePlanTarget = null;
let currentPriority = ["グルメ"];
let recommendationMode = false;
let isSplashAnimationFinished = false;
let isAuthStateResolved = false;
let chatEditMode = false;
let chatHistory = [];

window.tryEnteringApp = function () {
    if (!isSplashAnimationFinished || !isAuthStateResolved) return;

    if (auth.currentUser) {
        const splash = document.getElementById("launch-screen");
        if (splash) {
            splash.classList.add("fade-out");
            setTimeout(() => {
                splash.classList.add("hidden");
                const panel = document.getElementById("onboarding-panel");
                if (panel) {
                    panel.classList.remove("slide-in");
                    panel.classList.add("hidden");
                }
            }, 800);
        }
    } else {
        const splash = document.getElementById("launch-screen");
        if (splash) {
            splash.classList.remove("hidden", "fade-out");
        }
        const panel = document.getElementById("onboarding-panel");
        if (panel) {
            panel.classList.remove("hidden");
            // Force reflow
            void panel.offsetWidth;
            panel.classList.add("slide-in");
        }
    }
};

// ログイン状態の監視とUI更新
onAuthStateChanged(auth, (user) => {
    isAuthStateResolved = true;
    updateAuthUI(user);
    if (isSplashAnimationFinished) {
        tryEnteringApp();
    }
});

function updateAuthUI(user) {
    const settingsUserStatus = document.getElementById("settingsUserStatus");
    const settingsAuthBtn = document.getElementById("settingsAuthBtn");
    const shareLoggedOut = document.getElementById("shareLoggedOutState");
    const shareLoggedIn = document.getElementById("shareLoggedInState");

    const nameEl = document.getElementById("userName");
    const statusEl = document.getElementById("userStatus");
    const myPageName = document.getElementById("myPageName");
    const myPageStatus = document.getElementById("myPageStatus");

    if (user) {
        if (user.isAnonymous) {
            // ゲストログイン状態
            userName = "ゲストトラベラー";
            if (nameEl) nameEl.textContent = userName;
            if (statusEl) statusEl.textContent = "ゲストモードで利用中";
            if (myPageName) myPageName.textContent = userName;
            if (myPageStatus) myPageStatus.textContent = "ゲストモードで利用中";

            if (settingsUserStatus) {
                settingsUserStatus.innerHTML = `
                    <div class="auth-status-card logged-out">
                        <span class="material-icons status-icon">account_circle</span>
                        <div>
                            <div class="status-title">ゲストトラベラー</div>
                            <div class="status-desc">ログインすると予定をクラウド同期できます</div>
                        </div>
                    </div>
                `;
            }
            if (settingsAuthBtn) {
                settingsAuthBtn.innerHTML = `
                    <button class="btn-primary" style="background-color: var(--accent-anmari); width: 100%;" onclick="logoutUser()">
                        <span class="material-icons" style="font-size: 1.1rem; vertical-align: middle; margin-right: 6px;">logout</span>
                        ログアウト (ゲスト終了)
                    </button>
                `;
            }

            // ゲストは共有機能を使えない
            if (shareLoggedOut) shareLoggedOut.classList.remove("hidden");
            if (shareLoggedIn) shareLoggedIn.classList.add("hidden");
        } else {
            // 本ログイン状態
            userName = user.displayName || user.email.split('@')[0];
            if (nameEl) nameEl.textContent = userName;
            if (statusEl) statusEl.textContent = "アカウント同期中 (連携済み)";
            if (myPageName) myPageName.textContent = userName;
            if (myPageStatus) myPageStatus.textContent = "アカウント同期中 (連携済み)";

            if (settingsUserStatus) {
                settingsUserStatus.innerHTML = `
                    <div class="auth-status-card logged-in">
                        <span class="material-icons status-icon">verified_user</span>
                        <div>
                            <div class="status-title">同期完了</div>
                            <div class="status-desc">アカウント連携済み</div>
                        </div>
                    </div>
                `;
            }
            if (settingsAuthBtn) {
                settingsAuthBtn.innerHTML = `
                    <button class="btn-primary" style="background-color: var(--accent-anmari); width: 100%;" onclick="logoutUser()">
                        <span class="material-icons" style="font-size: 1.1rem; vertical-align: middle; margin-right: 6px;">logout</span>
                        ログアウト
                    </button>
                `;
            }

            // ログイン済みの場合は共有機能を利用可能
            if (shareLoggedOut) shareLoggedOut.classList.add("hidden");
            if (shareLoggedIn) shareLoggedIn.classList.remove("hidden");
        }
    } else {
        // 未ログイン状態
        userName = localStorage.getItem("kw_username") || "トラベラー";
        if (nameEl) nameEl.textContent = userName;
        if (statusEl) statusEl.textContent = "全国エリア探索中";
        if (myPageName) myPageName.textContent = userName;
        if (myPageStatus) myPageStatus.textContent = "全国エリア探索中";

        if (settingsUserStatus) {
            settingsUserStatus.innerHTML = `
                <div class="auth-status-card logged-out">
                    <span class="material-icons status-icon">no_accounts</span>
                    <div>
                        <div class="status-title">未連携</div>
                        <div class="status-desc">ログインすると予定をクラウド同期できます</div>
                    </div>
                </div>
            `;
        }
        if (settingsAuthBtn) {
            settingsAuthBtn.innerHTML = `
                <button class="btn-primary" style="width: 100%;" onclick="openAuthModal()">
                    <span class="material-icons" style="font-size: 1.1rem; vertical-align: middle; margin-right: 6px;">login</span>
                    アカウント連携 / ログイン
                </button>
            `;
        }

        // 未ログインは共有機能を使えない
        if (shareLoggedOut) shareLoggedOut.classList.remove("hidden");
        if (shareLoggedIn) shareLoggedIn.classList.add("hidden");
    }
}

// ==========================================
// 4. 初期化処理 (アプリ起動時)
// ==========================================
window.onload = function () {
    initApp();
};

function initApp() {
    // 起動スプラッシュの3秒タイマー
    setTimeout(() => {
        isSplashAnimationFinished = true;
        if (isAuthStateResolved) {
            tryEnteringApp();
        }
    }, 3000);

    // UIの設定反映
    applyTheme(currentTheme);
    applyFontSize(currentFontSize);
    applyAccountSettings();
    document.getElementById("textSizeSlider").value = currentFontSize;
    document.getElementById("settingsUsername").value = userName;
    document.getElementById("settingsHeaderTitle").value = headerTitle;
    document.getElementById("settingsLang").value = currentLanguage;



    // テーマボタンのアクティブ表示同期
    document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
    if (currentTheme === "mc-blue") document.getElementById("btnThemeMcBlue")?.classList.add("active");
    if (currentTheme === "mc-emerald") document.getElementById("btnThemeMcEmerald")?.classList.add("active");
    if (currentTheme === "mc-amber") document.getElementById("btnThemeMcAmber")?.classList.add("active");
    if (currentTheme === "mc-dark") document.getElementById("btnThemeMcDark")?.classList.add("active");

    // 「興味なし」リストの自動削除 (15日経過したものをパージ)
    purgeOldAnmaris();

    // 検索カードプールの準備 (初期おすすめスポット反映)
    loadInitialSpot();

    // ホームカウントとリストの表示
    updateGridCounts();
    updateCountdown();
    simulateWeather();
    renderSavedSpotsHome();
    renderHomePlans();

    // チャート表示の更新
    updateChart();

    // 共有リストの更新
    renderShareView();

    const rubyBtn = document.getElementById("rubi-switch");
    if (rubyBtn) {
        rubyBtn.addEventListener("click", () => {
            toggleNameDisplayMode();
        });
    }
}

function saveToStorage() {
    localStorage.setItem("kw_likes", JSON.stringify(likes));
    localStorage.setItem("kw_anmaris", JSON.stringify(anmaris));
    localStorage.setItem("kw_favorites", JSON.stringify(favorites));
    localStorage.setItem("kw_plans", JSON.stringify(plans));
    localStorage.setItem("kw_username", userName);
    localStorage.setItem("kw_avatar", userAvatar);
    localStorage.setItem("kw_headertitle", headerTitle);
    localStorage.setItem("kw_theme", currentTheme);
    localStorage.setItem("kw_fontsize", currentFontSize);
    localStorage.setItem("kw_lang", currentLanguage);

}
// ==========================================
// 5. 共通UI：ナビゲーション・サイドバー
// ==========================================
window.toggleSidebar = function () {
    const sidebar = document.getElementById("appSidebar");
    const overlay = document.getElementById("sidebarOverlay");
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
};

window.switchView = function (viewId, element) {
    // 全てのViewを非表示にする
    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));

    // 対象のViewを表示する
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.remove("hidden");

    // サイドバーのメニュー項目のアクティブ状態更新
    document.querySelectorAll(".sidebar-item").forEach(item => item.classList.remove("active"));
    if (element) {
        element.classList.add("active");
    } else {
        // 設定などで外部から呼ばれた場合のアクティブ項目同期
        const items = document.querySelectorAll(".sidebar-item");
        items.forEach(item => {
            const labelText = item.querySelector("span:last-child").textContent;
            if (viewId === "swipe" && labelText.includes("探す")) item.classList.add("active");
            if (viewId === "plan" && labelText.includes("予定")) item.classList.add("active");
            if (viewId === "home" && labelText.includes("ホーム")) item.classList.add("active");
            if (viewId === "mypage" && labelText.includes("マイページ")) item.classList.add("active");
            if (viewId === "settings" && labelText.includes("マイページ")) item.classList.add("active");
        });
    }

    // 各画面特有の更新トリガー
    if (viewId === "mypage") {
        updateGridCounts();
        updateChart();
        renderShareView();
    }
    if (viewId === "home") {
        updateGridCounts();
        updateCountdown();
        simulateWeather();
        renderSavedSpotsHome();
        renderHomePlans();
    }
    if (viewId === "plan") {
        renderLikedList();
        renderProactiveSuggestions();

        const proactiveView = document.getElementById("aiProactiveView");
        if (proactiveView) proactiveView.classList.remove("hidden");
        const form = document.getElementById("planForm");
        if (form) form.classList.add("hidden");
        const results = document.getElementById("planResults");
        if (results) results.classList.add("hidden");
        const loading = document.getElementById("planLoading");
        if (loading) loading.classList.add("hidden");
        const err = document.getElementById("planError");
        if (err) err.classList.add("hidden");
    }

    // モバイル用サイドバーを閉じる
    const sidebar = document.getElementById("appSidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        overlay.classList.remove("open");
    }
};

// Toast通知表示
function showToast(message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    const icon = document.createElement("span");
    icon.className = "material-icons";
    icon.style.cssText = "font-size: 1.2rem; color: var(--primary-color);";
    icon.textContent = "info";

    const textSpan = document.createElement("span");
    textSpan.textContent = String(message != null ? message : "");

    toast.appendChild(icon);
    toast.appendChild(textSpan);
    container.appendChild(toast);

    // 1.2秒後にフェードアウトして削除
    setTimeout(() => {
        toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 300);
    }, 1200);
}

// ==========================================
// 6. 検索機能 (スワイプ & プリフェッチ)
// ==========================================
// 6. 検索機能 (スワイプ & プリフェッチ & 連続動作)
// ==========================================
let isSwipeAnimating = false; // スワイプアニメーション中の二重操作ガード

window.applyFilters = function () {
    const seasonSelect = document.getElementById("filterSeason");
    const catSelect = document.getElementById("filterCategory");
    const prefSelect = document.getElementById("filterPrefecture");
    const tagSelect = document.getElementById("filterTag");
    const selectedPref = prefSelect ? prefSelect.value : "all";
    const selectedTag = tagSelect ? tagSelect.value : "all";

    // 🌟 1. 観光スポット候補の増量: 選択された都道府県のスポットを動的に16件確保
    if (selectedPref !== "all") {
        ensurePrefectureSpots(selectedPref, 16);
    } else {
        // 「すべて」の場合も主要都道府県を中心に充実させる
        ["東京", "北海道", "京都", "大阪", "沖縄", "福岡", "神奈川"].forEach(p => ensurePrefectureSpots(p, 10));
    }

    const tagToCategoryMap = {
        "歴史・文化": "history",
        "自然・アウトドア": "nature",
        "グルメ": "food",
        "温泉・癒やし": "healing"
    };
    const selectedCategory = tagToCategoryMap[selectedTag] || "all";

    activeFilters.season = seasonSelect ? seasonSelect.value : "all";
    activeFilters.prefecture = selectedPref;
    if (catSelect) {
        activeFilters.category = catSelect.value;
    }

    const normSelectedPref = normalizePrefectureName(selectedPref);

    currentCardPool = kinkiPlaces.filter(place => {
        const matchSeason = (activeFilters.season === "all" || place.season === activeFilters.season || (place.season && place.season.includes("通年")));
        const matchCat = (activeFilters.category === "all" || place.category === activeFilters.category);
        const normPlacePref = normalizePrefectureName(place.prefecture);
        const matchPref = (normSelectedPref === "all" ||
            normPlacePref === normSelectedPref ||
            place.prefecture === selectedPref ||
            place.prefecture.startsWith(normSelectedPref) ||
            normSelectedPref.startsWith(normPlacePref));
        const matchTag = (selectedCategory === "all" || place.category === selectedCategory);
        const isAlreadySelected = likes.some(l => l.id === place.id) || anmaris.some(a => a.id === place.id);

        let matchRecommendation = true;
        if (recommendationMode) {
            const highestVal = Math.max(...standStats);
            const highestIndex = standStats.indexOf(highestVal);
            matchRecommendation = matchesGenre(place, highestIndex);
        }

        return matchSeason && matchCat && matchPref && matchTag && !isAlreadySelected && matchRecommendation;
    });

    if (recommendationMode) {
        currentCardPool.forEach(place => {
            place.tempCompatibilityScore = calculateCompatibilityScore(place);
        });
        currentCardPool.sort((a, b) => b.tempCompatibilityScore - a.tempCompatibilityScore);
    }

    nextPoolIndex = 0;
    renderStack();

    if (currentCardPool.length === 0 && selectedPref === "all") {
        const existingNames = kinkiPlaces.map(p => p.name);
        fetchGeminiPlaces(existingNames).then(newPlaces => {
            if (newPlaces && newPlaces.length > 0) {
                kinkiPlaces.unshift(...newPlaces);
                applyFilters();
            }
        }).catch(err => {
            console.error("自動観光スポット取得に失敗しました:", err);
        });
    }
};

window.startPersonalizedSearch = function () {
    calculateStandStats(); // 最新数値を計算
    const highestVal = Math.max(...standStats);
    const highestIndex = standStats.indexOf(highestVal);
    const labels = ["温泉・癒やし", "自然・景観", "歴史・文化", "グルメ", "アクティビティ", "都市・ショッピング"];
    const topGenreLabel = labels[highestIndex];

    recommendationMode = true;

    // UIのバナー表示と更新
    const banner = document.getElementById("personalizedRecommendationBanner");
    const genreText = document.getElementById("recommendationGenreName");
    if (banner) banner.classList.remove("hidden");
    if (genreText) genreText.textContent = topGenreLabel;

    showToast(`💡 ${topGenreLabel}特化レコメンドモードを開始しました！`);

    // スワイプ画面に切り替える
    switchView("swipe");
};

window.disableRecommendationMode = function () {
    recommendationMode = false;
    const banner = document.getElementById("personalizedRecommendationBanner");
    if (banner) banner.classList.add("hidden");

    showToast("標準検索モードに戻しました。");
    applyFilters();
};

function matchesGenre(place, genreIndex) {
    if (genreIndex === 0) return place.category === "healing" || place.tags.includes("癒やし") || place.tags.includes("リラックス");
    if (genreIndex === 1) return place.category === "nature" || place.tags.includes("自然");
    if (genreIndex === 2) return place.category === "history" || place.tags.includes("歴史");
    if (genreIndex === 3) return place.category === "food" || place.tags.includes("グルメ");
    if (genreIndex === 4) return place.tags.includes("アクティブ");
    if (genreIndex === 5) return place.tags.includes("都市") || place.tags.includes("観光");
    return true;
}

function renderStack() {
    const stack = document.getElementById("card-stack");
    const container = document.getElementById("swipeActionsContainer");
    if (!stack) return;
    stack.innerHTML = "";

    if (currentCardPool.length === 0) {
        if (container) container.classList.add("hidden");
        stack.innerHTML = `
            <div class="empty-stack-view">
                <span class="material-icons empty-icon" style="color: var(--primary-color);">task_alt</span>
                <h3>すべての候補をチェックしました！</h3>
                <p>気になるスポットは見つかりましたか？保存したスポットからAIによる旅行日程を作成できます。</p>
                <div class="empty-stack-view-actions">
                    <button class="btn-primary" onclick="resetSwipeHistory()">🔄 スワイプ履歴をリセット</button>
                    <button class="btn-primary" style="background-color: var(--secondary-color);" onclick="switchView('plan')">📋 予定を作成する</button>
                </div>
            </div>
        `;
        return;
    }

    if (container) container.classList.remove("hidden");

    // 最初のカードと、バックグラウンドでの待機カード(最大3枚)をDOMに追加
    // 重なり順のため、後ろのカードを先に挿入する
    const cardsToLoad = Math.min(3, currentCardPool.length);
    for (let i = cardsToLoad - 1; i >= 0; i--) {
        const place = currentCardPool[i];
        const card = createCardElement(place, i === 0);
        stack.appendChild(card);
    }
}

// カードの事前読み込み (プリフェッチ画像)
function prefetchNextImages() {
    if (currentCardPool.length > 1) {
        const prefetchCount = Math.min(4, currentCardPool.length);
        for (let i = 1; i < prefetchCount; i++) {
            const imgUrl = currentCardPool[i].img;
            if (imgUrl) {
                const img = new Image();
                img.src = imgUrl;
            }
        }
    }
}

function calculateCompatibilityScore(place) {
    let score = 0;

    // 1. 同行者
    if (place.companion) {
        let maxCompPref = 0;
        place.companion.forEach(c => {
            if (detailedPrefs.companion[c] > maxCompPref) {
                maxCompPref = detailedPrefs.companion[c];
            }
        });
        score += maxCompPref;
    }

    // 2. 予算
    if (place.budget && detailedPrefs.budget[place.budget]) {
        score += detailedPrefs.budget[place.budget];
    }

    // 3. 移動手段
    if (place.transport && detailedPrefs.transport[place.transport]) {
        score += detailedPrefs.transport[place.transport];
    }

    // 4. 目的
    if (place.purpose && detailedPrefs.purpose[place.purpose]) {
        score += detailedPrefs.purpose[place.purpose];
    }

    let avgScore = Math.round(score / 4);
    return Math.max(30, Math.min(99, avgScore));
}

function getSeasonEmoji(season) {
    if (season === "春") return "🌸";
    if (season === "夏") return "☀️";
    if (season === "秋") return "🍂";
    if (season === "冬") return "❄️";
    if (season === "通年" || season === "通年おすすめ") return "✨";
    return "🗓️";
}

function getSeasonText(season) {
    if (season === "通年" || season === "通年おすすめ") return season;
    return season + "おすすめ";
}

function getSeasonBadgeHtml(season) {
    return `<span class="card-season-badge">${getSeasonEmoji(season)} ${getSeasonText(season)}</span>`;
}

function getSugSeasonBadgeHtml(season) {
    let emoji = "🗓️";
    let text = season + "時期に最適";
    let style = "background: rgba(16, 185, 129, 0.1); color: #10b981;";
    if (season === "春") {
        emoji = "🌸";
        style = "background: rgba(244, 63, 94, 0.1); color: #f43f5e;";
    } else if (season === "夏") {
        emoji = "☀️";
        style = "background: rgba(14, 165, 233, 0.1); color: #0ea5e9;";
    } else if (season === "秋") {
        emoji = "🍂";
        style = "background: rgba(249, 115, 22, 0.1); color: #f97316;";
    } else if (season === "冬") {
        emoji = "❄️";
        style = "background: rgba(99, 102, 241, 0.1); color: #6366f1;";
    } else if (season === "通年" || season === "通年おすすめ") {
        emoji = "✨";
        text = season;
        style = "background: rgba(234, 179, 8, 0.1); color: #eab308;";
    }
    return `<span class="sug-season-badge" style="${style} padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">${emoji} ${text}</span>`;
}

function createCardElement(data, isTopCard) {
    const card = document.createElement("div");
    card.className = "swipe-card spot-card";
    // 表示優先順位の設定
    card.style.zIndex = isTopCard ? 5 : 1;
    if (!isTopCard) {
        card.style.pointerEvents = "none";
    }

    const isStarred = favorites.some(f => f.id === data.id);
    const isRecommended = recommendationMode;
    const matchScore = calculateCompatibilityScore(data);

    const safeName = escapeHTML(data.name);
    const safePref = escapeHTML(data.prefecture);
    const safeDesc = escapeHTML(data.description);
    const safeCompanion = escapeHTML(Array.isArray(data.companion) ? data.companion.join('・') : (data.companion || ''));
    const safeBudget = escapeHTML(data.budget || 'スタンダード');
    const safeTransport = escapeHTML(data.transport || '公共交通機関');
    const safePurpose = escapeHTML(data.purpose || '観光');
    const safeImg = escapeHTML(data.img || NO_IMAGE_URL);

    card.innerHTML = `
        <div class="card-img-container">
            <img src="${safeImg}" class="card-img" alt="${safeName}" onerror="this.onerror=null;this.src='${NO_IMAGE_URL}'">
            <span class="card-prefecture-badge">📍 ${safePref}</span>
            ${getSeasonBadgeHtml(data.season)}
            ${isRecommended ? `<span class="card-match-badge"><span class="material-icons" style="font-size: 0.95rem; vertical-align: middle;">bolt</span>AIマッチ度 ${matchScore}%</span>` : ''}
            <div class="swipe-stamp stamp-like">いいね</div>
            <div class="swipe-stamp stamp-anmari">興味なし</div>
        </div>
        <button class="card-star-btn ${isStarred ? 'starred' : ''}" onclick="toggleFavorite(this, event, ${data.id})"><span class="material-icons-outlined star-icon">${isStarred ? 'star' : 'star_border'}</span></button>
        <div class="card-info">
            <h3><span class="place-name" data-original-name="${safeName}">${getDisplayName(data.name)}</span></h3>
            <div class="card-tags-container">
                <span class="tag-pill"><span class="material-icons">people</span>${safeCompanion}</span>
                <span class="tag-pill"><span class="material-icons">payments</span>${safeBudget}</span>
                <span class="tag-pill"><span class="material-icons">commute</span>${safeTransport}</span>
                <span class="tag-pill"><span class="material-icons">explore</span>${safePurpose}</span>
            </div>
            <p class="spot-description">${safeDesc}</p>
        </div>
    `;

    if (isTopCard) {
        initCardDrag(card, data);
        prefetchNextImages();
    }

    card.dataset.placeName = data.name;
    imageObserver.observe(card);

    return card;
}

window.toggleFavorite = function (starBtn, event, id) {
    event.stopPropagation();
    const item = kinkiPlaces.find(p => p.id === id);
    const starIcon = starBtn.querySelector('.star-icon');
    const index = favorites.findIndex(f => f.id === id);

    if (index > -1) {
        favorites.splice(index, 1);
        starBtn.classList.remove("starred");
        if (starIcon) starIcon.textContent = "star_border";
        showToast("お気に入りから削除しました。");
    } else {
        if (item) favorites.push(item);
        starBtn.classList.add("starred");
        if (starIcon) starIcon.textContent = "star";
        showToast("お気に入りに追加しました！⭐");

        if (item && !likes.some(l => l.id === id)) {
            likes.push(item);
        }
    }
    saveToStorage();
    updateGridCounts();
};

// 🌟 2. スワイプ完了と連続表示の制御ロジック
function completeCardSwipe(cardEl, direction, placeData) {
    if (isSwipeAnimating) return;
    isSwipeAnimating = true;

    // スワイプ判定スタンプの表示強調
    const stampLike = cardEl.querySelector(".stamp-like");
    const stampAnmari = cardEl.querySelector(".stamp-anmari");
    if (direction === "like") {
        if (stampLike) stampLike.style.opacity = "1";
        if (stampAnmari) stampAnmari.style.opacity = "0";
    } else {
        if (stampAnmari) stampAnmari.style.opacity = "1";
        if (stampLike) stampLike.style.opacity = "0";
    }

    // 画面外へのスムーズなスワイプアウト演出
    const moveX = direction === "like" ? 900 : -900;
    const rotateAngle = direction === "like" ? 35 : -35;
    cardEl.style.transition = "transform 0.32s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.32s ease";
    cardEl.style.transform = `translateX(${moveX}px) rotate(${rotateAngle}deg)`;
    cardEl.style.opacity = "0";

    // データ処理（いいね/興味なし、スタンドパラメータ計算）
    handleSwipeAction(direction, placeData);

    // アニメーション完了後に次のカードへ切り替え（DOMの全再構築を避けてチラつきを防止）
    setTimeout(() => {
        const stack = document.getElementById("card-stack");
        if (cardEl.parentNode === stack) {
            cardEl.remove();
        }
        currentCardPool.shift(); // 先頭カードを消費

        if (currentCardPool.length === 0) {
            isSwipeAnimating = false;
            isDragging = false;
            renderStack();
            return;
        }

        // 残っているDOMカードの中から、新しい最前面カード（最後のDOM子要素）を有効化
        if (stack) {
            const remainingCards = stack.querySelectorAll(".swipe-card");
            if (remainingCards.length > 0) {
                const nextTopCard = remainingCards[remainingCards.length - 1];
                nextTopCard.style.zIndex = 5;
                nextTopCard.style.pointerEvents = "auto";
                initCardDrag(nextTopCard, currentCardPool[0]);
                prefetchNextImages();
            }

            // スタックの背面に控えるカードを1枚補充（常に最大3枚の重なりを維持）
            const currentDomCount = stack.querySelectorAll(".swipe-card").length;
            if (currentDomCount < 3 && currentCardPool.length > currentDomCount) {
                const backIndex = currentDomCount;
                if (currentCardPool[backIndex]) {
                    const newBackCard = createCardElement(currentCardPool[backIndex], false);
                    stack.insertBefore(newBackCard, stack.firstChild);
                }
            }
        }

        isSwipeAnimating = false;
        isDragging = false;
    }, 280);
}

function initCardDrag(card, data) {
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    const stampLike = card.querySelector(".stamp-like");
    const stampAnmari = card.querySelector(".stamp-anmari");

    card.addEventListener("pointerdown", e => {
        if (isSwipeAnimating) return;
        // お気に入りボタンをクリックした時はカードのドラッグを開始しない
        if (e.target.closest('.card-star-btn')) {
            return;
        }
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        card.style.transition = "none";
        card.setPointerCapture(e.pointerId);
    });

    card.addEventListener("pointermove", e => {
        if (!isDragging || isSwipeAnimating) return;
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;

        // 傾きと回転
        const rotate = currentX * 0.08;
        card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;

        // スワイプスタンプの透明度コントロール
        if (currentX > 30) {
            const opacity = Math.min(1, (currentX - 30) / 100);
            if (stampLike) stampLike.style.opacity = opacity;
            if (stampAnmari) stampAnmari.style.opacity = 0;
        } else if (currentX < -30) {
            const opacity = Math.min(1, (-currentX - 30) / 100);
            if (stampAnmari) stampAnmari.style.opacity = opacity;
            if (stampLike) stampLike.style.opacity = 0;
        } else {
            if (stampLike) stampLike.style.opacity = 0;
            if (stampAnmari) stampAnmari.style.opacity = 0;
        }
    });

    card.addEventListener("pointerup", e => {
        if (!isDragging) return;

        // スワイプ判定 (120px以上移動)
        if (Math.abs(currentX) > 120 && !isSwipeAnimating) {
            const dir = currentX > 0 ? "like" : "anmari";
            completeCardSwipe(card, dir, data);
        } else {
            // 元の位置に戻す
            card.style.transition = "transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.2)";
            card.style.transform = "translateX(0) rotate(0deg)";
            if (stampLike) stampLike.style.opacity = 0;
            if (stampAnmari) stampAnmari.style.opacity = 0;
            isDragging = false;
        }
    });

    card.addEventListener("pointercancel", () => {
        if (!isDragging) return;
        card.style.transition = "transform 0.3s ease";
        card.style.transform = "translateX(0) rotate(0deg)";
        if (stampLike) stampLike.style.opacity = 0;
        if (stampAnmari) stampAnmari.style.opacity = 0;
        isDragging = false;
    });
}

function handleSwipeAction(type, data) {
    if (type === "like") {
        if (!likes.some(l => l.id === data.id)) {
            likes.push(data);
            showToast(`❤️「${data.name}」をいいねしました！`);
        }
    } else {
        if (!anmaris.some(a => a.id === data.id)) {
            anmaris.push({ ...data, savedAt: Date.now() });
            showToast(`😐「${data.name}」は興味なしにしました`);
        }
    }
    saveToStorage();
    updateGridCounts();
    // スタンドパラメータのリアルタイム計算
    calculateStandStats();
}

window.resetSwipeHistory = function () {
    likes = [];
    anmaris = [];
    favorites = [];
    plans = [];
    saveToStorage();
    showToast("すべてのスワイプ履歴と予定をリセットしました。");
    applyFilters();
    calculateStandStats();
};

window.swipeTopCard = function (direction) {
    if (currentCardPool.length === 0 || isDragging || isSwipeAnimating) return;
    const stack = document.getElementById("card-stack");
    if (!stack) return;
    const remainingCards = stack.querySelectorAll(".swipe-card");
    if (remainingCards.length === 0) return;

    // 最前面カード（最後の子要素）
    const topCard = remainingCards[remainingCards.length - 1];
    if (!topCard) return;

    const data = currentCardPool[0];
    completeCardSwipe(topCard, direction, data);
};

// ==========================================
// 7. 予定機能 (入力テンプレート & AI・ホテル提案)
// ==========================================
function renderLikedList() {
    const listContainer = document.getElementById("likedList");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    if (likes.length === 0) {
        listContainer.innerHTML = `<div class="modal-empty">保存したスポットがまだありません。「探す」からスワイプしてください。</div>`;
        return;
    }

    likes.forEach(item => {
        const isSelected = activePlanTarget && activePlanTarget.id === item.id;
        const div = document.createElement("div");
        div.className = `liked-item ${isSelected ? 'selected' : ''}`;
        div.setAttribute("data-id", item.id);
        const safeName = escapeHTML(item.name);
        const safePref = escapeHTML(item.prefecture);
        const safeSeason = escapeHTML(item.season ? (item.season.includes('通年') ? item.season : item.season + '時期') : '通年');
        const safeImg = escapeHTML(item.img || NO_IMAGE_URL);
        div.innerHTML = `
            <img src="${safeImg}" class="liked-item-thumb" alt="${safeName}" onerror="this.onerror=null;this.src='${NO_IMAGE_URL}'">
            <div class="liked-item-info" style="flex:1; min-width:0;">
                <h4><span class="place-name" data-original-name="${safeName}">${getDisplayName(item.name)}</span></h4>
                <p>📍 ${safePref} / 🏷️ ${safeSeason}</p>
            </div>
            <button class="sim3d-launch-mini-btn" title="3Dルートシミュレーション">
                <span class="material-icons" style="font-size:1.1rem;">route</span>
            </button>
        `;
        div.querySelector(".liked-item-info").addEventListener("click", () => selectPlanTarget(item, div));
        div.querySelector(".sim3d-launch-mini-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            open3DRouteSimulation({ destination: item.name, lat: item.lat, lon: item.lon });
        });
        listContainer.appendChild(div);
    });
}

function selectPlanTarget(item, element) {
    activePlanTarget = item;
    document.querySelectorAll(".liked-item").forEach(i => {
        if (i.getAttribute("data-id") == item.id) {
            i.classList.add("selected");
        } else {
            i.classList.remove("selected");
        }
    });

    // プレースホルダーと先回り自動提案ビューを非表示にし、フォームを表示する
    const placeholder = document.getElementById("planFormPlaceholder");
    if (placeholder) placeholder.classList.add("hidden");
    const proactiveView = document.getElementById("aiProactiveView");
    if (proactiveView) proactiveView.classList.add("hidden");
    const results = document.getElementById("planResults");
    if (results) results.classList.add("hidden");
    const errorCard = document.getElementById("planError");
    if (errorCard) errorCard.classList.add("hidden");
    const loadingView = document.getElementById("planLoading");
    if (loadingView) loadingView.classList.add("hidden");

    const form = document.getElementById("planForm");
    if (form) form.classList.remove("hidden");
    const targetName = document.getElementById("planTargetName");
    if (targetName) targetName.innerHTML = `<span class="material-icons" style="vertical-align: middle; color: var(--primary-color);">location_on</span> <span class="place-name" data-original-name="${item.name}">${getDisplayName(item.name)}</span> 行き旅行プラン設定`;
}

async function fetchGeminiItinerary(name, pref, date, nightsText, people, budget, priorities, others, startStation) {
    const url = getApiUrl("/api/travel/generate");
    const standName = document.getElementById("standName")?.textContent || "トラベラー・スター";
    const standRank = document.getElementById("standRank")?.textContent || "";

    const promptText = `
あなたは旅行プランナーです。ユーザーの「旅行スタンド（Travel Stand）」の特性を最大限に活かした、目的地（${pref}）およびその周辺の魅力的で具体的な旅行プランを作成してください。

【旅行情報】
目的地: ${name} (${pref})
出発地（最寄り駅）: ${startStation || '東京駅'}
日付: ${date} 〜
期間: ${nightsText}
人数: ${people}名
予算目安: ${budget.toLocaleString()}円程度
重視ポイント: ${priorities.join(", ")}
ユーザーの旅行スタンド: ${standName} (${standRank})
その他要望: ${others}

【回答ルール】
1. タイトルは「【${name}を巡る ${nightsText} 旅行プラン】」から始めてください。
2. スケジュール提案は「■ 1日目:」「■ 2日目:」「■ 最終日:」などの形式で、具体的かつ時間（例: 午前、昼食、午後、夜間）を分けて記載してください。
3. ユーザーの旅行スタンド（例: 温泉の守護神、美食の支配者など）のコンセプトや特性に寄り添った、オリジナリティあふれる特別な体験・店舗・アクティビティ（実在または目的地ならではの魅力的な提案）を必ず1箇位置くなどして、旅行スタンドに言及した上で含めてください。
4. 口調は丁寧で、旅のワクワク感を高めるような魅力的な表現にしてください。
5. itineraryText の内容は純粋な日本語のテキスト（改行と通常の記号「・」「■」のみ）で出力し、マークダウンの装飾記号（** や *）は一切含めないでください。
6. 各スポットに付与する季節タグ（season tag）は、プラン全体で提案している季節と必ず一致させること。もし特定の季節に限定されないスポットの場合は『通年』または『通年おすすめ』というタグを出力すること。
7. 必ず以下のJSON形式のみで出力してください。JSONの外側にテキストを一切含めないでください。
{
  "itineraryText": "（上記ルールに従った旅行プランのプレーンテキスト）",
  "waypoints": [
    {"lat": 出発地の緯度, "lng": 出発地の経度, "name": "出発地名", "description": "出発地の一言紹介（30文字以内）"},
    {"lat": 経由地1の緯度, "lng": 経由地1の経度, "name": "経由地1の名前", "description": "こここでの見どころを一言（30文字以内）", "season": "季節タグ（例: 春、夏、秋、冬、通年、通年おすすめのいずれか）"},
    {"lat": 目的地の緯度, "lng": 目的地の経度, "name": "目的地名", "description": "目的地の魅力を一言（30文字以内）", "season": "季節タグ（例: 春、夏、秋、冬、通年、通年おすすめのいずれか）"}
  ]
}
waypointsは最低3つ以上のオブジェクトを含み、配列の最初の要素（インデックス0）は必ず出発地（${startStation || '東京駅'}）の正確な座標にしてください。最後の要素が目的地（${name}）の実際の緯度経度、その間に旅程上の主要経由地を含めてください。
`;

    const requestBody = {
        contents: [{
            parts: [{ text: promptText }]
        }]
    };

    try {
        const resData = await safeFetchJson(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
        const rawText = resData.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("JSON not found in Gemini response");
        }
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("Gemini APIでの旅行プラン生成に失敗しました:", error);
        throw error;
    }
}



window.togglePriorityPill = function (pill) {
    const val = pill.getAttribute("data-val");
    pill.classList.toggle("active");

    if (pill.classList.contains("active")) {
        if (!currentPriority.includes(val)) currentPriority.push(val);
    } else {
        currentPriority = currentPriority.filter(p => p !== val);
    }
};

window.backToPlanForm = function () {
    document.getElementById("planResults").classList.add("hidden");
    document.getElementById("planForm").classList.remove("hidden");
};

function getApiUrl(path) {
    const base = "https://tripdevelopment2.onrender.com";
    return `${base}${path}`;
}

// Safely fetch and parse JSON, checking response.ok first to avoid JSON parsing errors on HTML/text errors.
async function safeFetchJson(url, options = {}) {
    const opts = { ...options };
    opts.headers = { ...(opts.headers || {}) };
    if (auth && auth.currentUser) {
        try {
            const token = await auth.currentUser.getIdToken();
            if (token) {
                opts.headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (authErr) {
            console.warn("Failed to get Firebase token for safeFetchJson:", authErr);
        }
    }
    const response = await fetch(url, opts);
    if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
            const errData = await response.json();
            errMsg = errData.error || errMsg;
        } catch (e) {
            try {
                const textData = await response.text();
                if (textData && textData.length < 200) {
                    errMsg = textData;
                }
            } catch (textErr) { }
        }
        throw new Error(errMsg);
    }
    return await response.json();
}



// Gemini APIを中継サーバー経由で呼び出し、AIを用いて新しい観光地を生成する関数
async function fetchGeminiPlaces(excludeNames = []) {
    const url = getApiUrl("/api/travel/generate");
    const excludeStr = excludeNames.length > 0 ? `ただし、以下の観光地はすでに登録済みまたはスワイプ済みであるため、絶対に含めないでください: ${excludeNames.join(", ")}` : "";

    const selectedPrefecture = document.getElementById('filterPrefecture').value;
    const prefInstruction = selectedPrefecture === 'all' ? '日本全国の観光スポットの中から提案してください。' : `日本全国の観光スポットの中から、選択された都道府県（${selectedPrefecture}）に絞って提案してください。`;

    const promptText = `
${prefInstruction}スワイプ型旅行アプリで表示する魅力的な観光スポット（名所、歴史的建造物、温泉、グルメ街、自然など）を新たに「5件」考案し、日本語のJSON形式で出力してください。

${excludeStr}

出力するJSONは以下の構造の配列である必要があります：
[
  {
    "name": "観光地名（例: 清水寺）",
    "prefecture": "都道府県名（例: 京都、東京、北海道）※「都」「府」「県」は付けないでください。ただし「北海道」はそのまま「北海道」としてください",
    "season": "おすすめの時期（春、夏、秋、冬、通年、通年おすすめのいずれか。各スポットに付与する季節タグ（season tag）は、プラン全体で提案している季節と必ず一致させること。もし特定の季節に限定されないスポットの場合は『通年』または『通年おすすめ』を出力すること）",
    "category": "カテゴリ名（history, nature, food, healing のいずれか）",
    "description": "観光地の魅力を伝える魅力的な紹介文（2〜3文程度、100文字以内で、思わず行きたくなるような文章）",
    "tags": ["タグ1", "タグ2", "タグ3"],
    "companion": ["同行者タグ1", "同行者タグ2"],
    "budget": "予算目安",
    "transport": "移動手段",
    "purpose": "目的",
    "lat": 観光地の緯度（実在する大体の座標の数値）,
    "lon": 観光地の経度（実在する大体の座標の数値）
  }
]

※ JSON以外の説明文やマークダウンのデコレーションは一切含めず、純粋なJSON文字列のみを返してください。
`;

    const requestBody = {
        contents: [{
            parts: [{ text: promptText }]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    try {
        const resData = await safeFetchJson(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const jsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonText) {
            throw new Error("No text candidates in Gemini response");
        }
        const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("JSON array not found in Gemini response");
        }
        const newPlaces = JSON.parse(jsonMatch[0]);

        const baseId = Date.now();
        return newPlaces.map((place, idx) => {
            return {
                id: baseId + idx,
                name: place.name,
                prefecture: place.prefecture,
                season: place.season,
                category: place.category,
                description: place.description,
                tags: place.tags || ["観光"],
                companion: place.companion || ["カップル"],
                budget: place.budget || "スタンダード",
                transport: place.transport || "公共交通機関",
                purpose: place.purpose || "リフレッシュ",
                lat: place.lat,
                lon: place.lon,
                img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop"
            };
        });
    } catch (error) {
        console.error("Gemini APIでの観光地取得に失敗しました:", error);
        throw error;
    }
}

// AIでの観光地追加ボタンのアクション
window.generatePlacesWithAI = async function () {
    const stack = document.getElementById("card-stack");
    const container = document.getElementById("swipeActionsContainer");
    if (container) container.classList.add("hidden");

    stack.innerHTML = `
        <div class="empty-stack-view" style="animation: fadeIn 0.3s ease;">
            <div class="boat-spinner-container">
                <div class="water-circle"></div>
                <span class="material-icons boat-icon">sailing</span>
            </div>
            <h3 style="margin-top: 16px;">AIが新しい観光地を探索中...</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">日本全国の魅力的なスポットを生成しています</p>
            <!-- Shinkansen Progress Bar -->
            <div class="progress-container">
                <div class="progress-bar-track">
                    <div class="progress-bar-fill" id="placesProgressBarFill"></div>
                    <div class="progress-train-icon" id="placesProgressTrain">
                        <span class="material-icons">train</span>
                    </div>
                </div>
                <div class="progress-percentage" id="placesProgressPercent">0%</div>
            </div>
        </div>
    `;

    let progressValue = 0;
    const fill = document.getElementById("placesProgressBarFill");
    const train = document.getElementById("placesProgressTrain");
    const percent = document.getElementById("placesProgressPercent");

    let progressInterval = setInterval(() => {
        if (progressValue < 95) {
            progressValue += Math.floor(Math.random() * 4) + 2;
            if (progressValue > 95) progressValue = 95;
            if (fill) fill.style.width = `${progressValue}%`;
            if (train) train.style.left = `${progressValue}%`;
            if (percent) percent.textContent = `${progressValue}%`;
        }
    }, 80);

    try {
        const existingNames = kinkiPlaces.map(p => p.name);
        const newPlaces = await fetchGeminiPlaces(existingNames);

        clearInterval(progressInterval);
        if (fill) fill.style.width = "100%";
        if (train) train.style.left = "100%";
        if (percent) percent.textContent = "100%";
        await new Promise(resolve => setTimeout(resolve, 300));

        if (newPlaces && newPlaces.length > 0) {
            kinkiPlaces.unshift(...newPlaces);
            showToast("✨ AIが新しい観光スポットを " + newPlaces.length + " 件追加しました！");
            applyFilters();
        } else {
            throw new Error("Empty list returned");
        }
    } catch (err) {
        clearInterval(progressInterval);
        console.error(err);
        let errorMsgToShow = err.message;
        if (err.message.includes("429")) {
            errorMsgToShow = "本日のAI生成上限に達しました。明日またお試しください。";
        }
        showToast("⚠️ 自動生成に失敗しました: " + errorMsgToShow);
        stack.innerHTML = `
            <div class="empty-stack-view">
                <span class="material-icons empty-icon">error_outline</span>
                <h3>生成エラーが発生しました</h3>
                <p style="color: var(--accent-error); font-weight: 600;">エラー詳細: ${errorMsgToShow}</p>
                <p>本日の利用上限に達したか、サーバー側の設定に問題があります。</p>
                <div class="empty-stack-view-actions">
                    <button class="btn-primary" onclick="generatePlacesWithAI()">🔄 再試行する</button>
                    <button class="btn-primary" style="background-color: var(--text-muted); opacity: 0.8;" onclick="resetSwipeHistory()">履歴をリセットしてやり直す</button>
                </div>
            </div>
        `;
    }
};

const transitAccessRoutes = {
    "清水寺": "京都駅から京都市営バス206号系統で「五条坂」下車、徒歩約10分。または京阪本線「清水五条駅」から徒歩約25分。",
    "有馬温泉": "神戸電鉄有馬線「有馬温泉駅」下車すぐ。大阪・三宮から高速バス「有馬エクスプレス号」で約45〜60分。",
    "道頓堀": "大阪メトロ御堂筋線・四つ橋線・千日前線「なんば駅」14番出口から徒歩約5分。近鉄難波線「大阪難波駅」からもアクセス可能。",
    "奈良公園": "近鉄奈良線「近鉄奈良駅」から徒歩約10分。JR関西本線「奈良駅」から奈良交通バス（市内循環）で約7分、「大仏殿春日大社前」下車すぐ。",
    "メタセコイア並木": "JR湖西線「マキノ駅」からマキノ高原線コミュニティバスで約10分、「メタセコイア並木」下車すぐ。",
    "那智の滝": "JR紀勢本線「紀伊勝浦駅」から熊野御坊南海バスで約30分、「那智の滝前」下車、徒歩約5分。",
    "姫路城": "JR山陽新幹線・山陽本線「姫路駅」北口、または山陽電鉄「山陽姫路駅」から徒歩約15分。または神姫バスで約5分、「姫路城大手門前」下車すぐ。",
    "嵐山竹林の小径": "京福電鉄嵐山本線（嵐電）「嵐山駅」から徒歩約10分。JR山陰本線（嵯峨野線）「嵯峨嵐山駅」から徒歩約15分。",
    "白良浜": "JR紀勢本線「白浜駅」から明光バスで約15分、「白良浜」下車すぐ。",
    "比叡山延暦寺": "京阪石山坂本線「坂本比叡山口駅」から江若交通バスで「ケーブル坂本駅」へ、坂本ケーブルに乗り換え「ケーブル延暦寺駅」下車、徒歩約10分。",
    "黒門市場": "大阪メトロ千日前線・堺筋線「日本橋駅」10番出口から徒歩約3分。近鉄難波線「近鉄日本橋駅」からも至近。",
    "伏見稲荷大社": "JR奈良線「稲荷駅」下車すぐ。または京阪本線「伏見稲荷駅」から徒歩約5分。",
    "竹田城跡": "JR播但線「竹田駅」から「天空バス」で約20分、「竹田城跡」バス停下車、徒歩約20分（※登山道あり、歩きやすい靴を推奨）。",
    "吉野山": "近鉄吉野線「吉野駅」下車。下千本までは吉野山ロープウェイで約3分（桜シーズンは徒歩やシャトルバス運行あり）。",
    "高野山 金剛峯寺": "南海高野線「極楽橋駅」から南海高野山ケーブルで「高野山駅」へ、南海りんかんバスに乗り換え約10分、「金剛峯寺前」下車すぐ。",
    "近江八幡の水郷": "JR東海道本線（琵琶湖線）「近江八幡駅」から近江鉄道バスで約15分、「豊年橋」または「水郷めぐり乗船場」下車すぐ。",
    "天橋立": "京都丹後鉄道宮豊線「天橋立駅」下車、天橋立公園の入り口まで徒歩約5分。展望台へは天橋立ビューランドのモノレール・リフトを利用。",
    "彦根城": "JR東海道本線（琵琶湖線）「彦根駅」から徒歩約15分。彦根駅西口よりお城キャッスルロード経由でアクセス可能。",
    "アドベンチャーワールド": "JR紀勢本線「白浜駅」から明光バスで約10分、「アドベンチャーワールド」下車すぐ。大阪からJR特急くろしお直通もあり。",
    "熊野古道": "中辺路コースの起点へは、JR「紀伊勝浦駅」または「新宮駅」から路線バスで「滝尻王子」または「熊野那智大社」へアクセス。",
    "大阪城公園": "JR大阪環状線「大阪城公園駅」または「森ノ宮駅」下車すぐ。大阪メトロ中央線「谷町四丁目駅」からもアクセス可能。",
    "法隆寺": "JR関西本線「法隆寺駅」から奈良交通バス「法隆寺門前」行きで約8分、終点下車すぐ。または法隆寺駅から徒歩約20分。",
    "城崎温泉": "JR山陰本線「城崎温泉駅」下車、駅前がすぐ温泉街の中心地です（各外湯へは徒歩圏内）。",
    "天龍寺": "京福電鉄嵐山本線（嵐電）「嵐山駅」下車すぐ。JR嵯峨野線「嵯峨嵐山駅」から徒歩約13分。阪急嵐山線「嵐山駅」から徒歩約15分。",
    "琵琶湖バレイ": "JR湖西線「志賀駅」から江若交通バスで約10分、「びわ湖バレイ前」下車、ロープウェイで山頂テラスへ（乗車約5分）。",
    "六甲山テラス": "阪急神戸線「御影駅」から神戸市バス16系統で「六甲ケーブル下駅」へ。六甲ケーブルで山頂へ登り、六甲山上バスで「六甲ガーデンテラス」下車。"
};



const STATIC_PLAN_CACHE = {
    "京都": {
        getItinerary: (name, nightsText, people, budget) => `【${name}を巡る ${nightsText} 旅行プラン】

■ 1日目:
午前: 京都駅到着後、市バスで清水寺へ。清水の舞台から京都市街を一望し、産寧坂・二寧坂の石畳をのんびり散策。
昼食: 祇園四条エリアで京料理（湯豆腐・おばんざい）をゆっくり堪能。
午後: 八坂神社・円山公園を経て、祇園白川の石畳でフォトジェニックな散策を楽しむ。
夕食: 先斗町の名店で鴨川の夜景を眺めながら京懐石を堪能。
夜間: ライトアップされた八坂神社周辺を散策して1日目終了。

■ 2日目:
午前: 嵐山エリアへ出発。竹林の小径を朝一番に訪れ幻想的な雰囲気を体感。天龍寺の曹源池庭園を鑑賞。
昼食: 渡月橋を望む老舗で湯豆腐懐石を楽しむ。
午後: 金閣寺（鹿苑寺）にて黄金に輝く建築美を堪能。龍安寺の石庭で禅の精神に触れる。
夕食: 四条烏丸の創作京料理店でコース料理を楽しみ、旅の余韻に浸る。

■ アクセスのポイント:
・清水寺〜祇園エリアは徒歩でも巡れる距離です。
・嵐山へは京福電鉄（嵐電）嵐山本線が便利です（四条大宮駅から約20分）。
・金閣寺・龍安寺方面は市バス205号系統をご利用ください。
・${nightsText}の旅程を${people}名様、予算${budget.toLocaleString()}円を目安にお楽しみください。`,
        waypoints: [
            { lat: 34.9859, lng: 135.7585, name: "京都駅", description: "旅のスタート地点" },
            { lat: 34.9948, lng: 135.7850, name: "清水寺", description: "世界遺産の絶景スポット", season: "通年" },
            { lat: 35.0036, lng: 135.7783, name: "祇園・八坂神社", description: "京都の象徴的な神社", season: "通年" },
            { lat: 35.0170, lng: 135.6782, name: "嵐山・竹林の小径", description: "幻想的な竹林散策", season: "通年" },
            { lat: 35.0394, lng: 135.7292, name: "金閣寺", description: "黄金に輝く世界遺産", season: "通年" }
        ],
        hotels: [
            { name: "THE THOUSAND KYOTO", rating: "4.8 / 5.0", price: "¥¥¥", address: "京都府京都市下京区東塩小路町607", img: "", url: "https://www.google.com/maps/search/THE+THOUSAND+KYOTO" },
            { name: "ホテルグランヴィア京都", rating: "4.5 / 5.0", price: "¥¥¥", address: "京都府京都市下京区烏丸通塩小路下ル東塩小路町901", img: "", url: "https://www.google.com/maps/search/ホテルグランヴィア京都" },
            { name: "京都悠洛ホテル Mギャラリー", rating: "4.7 / 5.0", price: "¥¥¥¥", address: "京都府京都市東山区大和大路通三条下ル", img: "", url: "https://www.google.com/maps/search/京都悠洛ホテル" },
            { name: "ウェスティン都ホテル京都", rating: "4.6 / 5.0", price: "¥¥¥¥", address: "京都府京都市東山区粟田口華頂町1番地", img: "", url: "https://www.google.com/maps/search/ウェスティン都ホテル京都" },
            { name: "ホテルオークラ京都", rating: "4.4 / 5.0", price: "¥¥¥", address: "京都府京都市中京区河原町御池", img: "", url: "https://www.google.com/maps/search/ホテルオークラ京都" }
        ]
    }
};

window.generateTravelPlan = async function (event) {
    event.preventDefault();
    if (!activePlanTarget) return;

    const dateVal = document.getElementById("planDate").value;
    const nightsVal = parseInt(document.getElementById("planNights").value);
    const peopleVal = parseInt(document.getElementById("planPeople").value);
    const budgetVal = parseInt(document.getElementById("planBudget").value);
    const othersVal = document.getElementById("planOthers").value;
    const startStationVal = document.getElementById("planStartStation").value;

    document.getElementById("planForm").classList.add("hidden");
    const loadingView = document.getElementById("planLoading");
    loadingView.classList.remove("hidden");

    let progressValue = 0;
    const fill = document.getElementById("planProgressBarFill");
    const train = document.getElementById("planProgressTrain");
    const percent = document.getElementById("planProgressPercent");
    if (fill) fill.style.width = "0%";
    if (train) train.style.left = "0%";
    if (percent) percent.textContent = "0%";

    const startTime = Date.now();

    let progressInterval = setInterval(() => {
        if (progressValue < 95) {
            progressValue += Math.floor(Math.random() * 4) + 2;
            if (progressValue > 95) progressValue = 95;
            if (fill) fill.style.width = `${progressValue}%`;
            if (train) train.style.left = `${progressValue}%`;
            if (percent) percent.textContent = `${progressValue}%`;
        }
    }, 80);

    const targetPref = activePlanTarget.prefecture;
    const selectedNightsText = `${nightsVal}泊${nightsVal + 1}日`;
    let planObj = null;
    let succeeded = false;
    let fastMode = false;

    try {
        const cachedPlan = STATIC_PLAN_CACHE[targetPref];
        if (cachedPlan) {
            const itineraryText = cachedPlan.getItinerary(activePlanTarget.name, selectedNightsText, peopleVal, budgetVal);
            const waypoints = [...cachedPlan.waypoints];

            const hotelList = document.getElementById("hotelList");
            hotelList.innerHTML = "";
            cachedPlan.hotels.forEach(h => {
                const card = document.createElement("div");
                card.className = "hotel-card";
                const safeName = escapeHTML(h.name);
                const safeRating = escapeHTML(h.rating);
                const safeAddress = h.address ? escapeHTML(h.address) : "";
                const safePrice = (h.price && h.price !== '料金情報なし') ? escapeHTML(h.price) : "";
                const safeUrl = sanitizeUrl(h.url);
                card.innerHTML = `
                    <img src="${escapeHTML(h.img || activePlanTarget.img || NO_IMAGE_URL)}" class="hotel-img" alt="${safeName}" onerror="this.onerror=null;this.src='${NO_IMAGE_URL}'">
                    <div class="hotel-info">
                        <div>
                            <h4>${safeName}</h4>
                            <div class="hotel-rating">⭐ ${safeRating}</div>
                            ${safeAddress ? `<p style="font-size:0.8rem;color:#64748b;">${safeAddress}</p>` : ''}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            ${safePrice ? `<p>${safePrice}</p>` : ''}
                            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem; text-decoration: none;">地図で確認・予約</a>
                        </div>
                    </div>
                `;
                hotelList.appendChild(card);
            });

            planObj = {
                id: Date.now(),
                destination: activePlanTarget.name,
                prefecture: targetPref,
                date: dateVal,
                nights: nightsVal,
                people: peopleVal,
                budget: budgetVal,
                lat: activePlanTarget.lat,
                lon: activePlanTarget.lon,
                itineraryText: itineraryText,
                waypoints: waypoints
            };
            planObj.departure = startStationVal || planObj.destination || "";
            plans.push(planObj);
            saveToStorage();

            document.getElementById("aiPlanText").innerHTML = formatItineraryHtml(itineraryText);

            const transitText = transitAccessRoutes[activePlanTarget.name] || "公共交通機関の情報が見つかりませんでした。詳細なルートはナビアプリ等でご確認ください。";
            const transitEl = document.getElementById("aiPlanTransitText");
            if (transitEl) transitEl.textContent = transitText;

            showToast("⚡ 超高速キャッシュからプランを表示しました！");
            fastMode = true;
            succeeded = true;
            return;
        }

        let itineraryText = "";
        let waypoints = [];

        try {
            const geminiResult = await fetchGeminiItinerary(
                activePlanTarget.name, targetPref, dateVal, selectedNightsText,
                peopleVal, budgetVal, currentPriority, othersVal, startStationVal
            );
            itineraryText = geminiResult.itineraryText || "";
            waypoints = Array.isArray(geminiResult.waypoints) ? geminiResult.waypoints : [];
            showToast("✨ AIがあなたの旅行スタンドに合わせた特製プランを生成しました！");
        } catch (apiErr) {
            console.warn("AIプラン生成に失敗したため、推奨テンプレートを表示します:", apiErr);
            itineraryText = generateItineraryText(
                activePlanTarget.name, targetPref, dateVal, selectedNightsText,
                peopleVal, budgetVal, currentPriority, othersVal
            );
            showToast("⚠️ AI生成制限のため、推奨テンプレートでプランを作成しました。");
        }

        let startCoords = null;
        try {
            if (startStationVal && startStationVal.trim()) {
                startCoords = await new Promise((resolve, reject) => {
                    if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
                        reject(new Error("Geocoder not available"));
                        return;
                    }
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ address: startStationVal }, (results, status) => {
                        if (status === "OK" && results && results[0]) {
                            const loc = results[0].geometry.location;
                            resolve({ lat: loc.lat(), lng: loc.lng() });
                        } else {
                            reject(new Error("Geocoding status: " + status));
                        }
                    });
                });
            }
        } catch (geocodeErr) {
            console.warn("Geocoding failed:", geocodeErr);
        }

        if (startCoords) {
            if (waypoints.length > 0) {
                waypoints[0] = {
                    lat: startCoords.lat,
                    lng: startCoords.lng,
                    name: startStationVal || waypoints[0].name || "出発地",
                    description: waypoints[0].description || "出発地"
                };
            } else {
                waypoints = [
                    { lat: startCoords.lat, lng: startCoords.lng, name: startStationVal || "出発地", description: "出発地" },
                    { lat: (startCoords.lat + activePlanTarget.lat) / 2, lng: (startCoords.lng + activePlanTarget.lon) / 2, name: "経由地", description: "ルート上の経由地" },
                    { lat: activePlanTarget.lat, lng: activePlanTarget.lon, name: activePlanTarget.name, description: "目的地" }
                ];
            }
        } else {
            if (waypoints.length > 0) {
                if (typeof waypoints[0].lat !== 'number' || typeof waypoints[0].lng !== 'number') {
                    const fallbackLat = 34.7024;
                    const fallbackLng = 135.4959;
                    waypoints[0] = {
                        lat: fallbackLat,
                        lng: fallbackLng,
                        name: startStationVal || "出発地 (梅田)",
                        description: "出発地 (フォールバック)"
                    };
                }
            } else {
                const fallbackLat = 34.7024;
                const fallbackLng = 135.4959;
                waypoints = [
                    { lat: fallbackLat, lng: fallbackLng, name: startStationVal || "出発地 (梅田)", description: "出発地 (フォールバック)" },
                    { lat: (fallbackLat + activePlanTarget.lat) / 2, lng: (fallbackLng + activePlanTarget.lon) / 2, name: "経由地", description: "ルート上の経由地" },
                    { lat: activePlanTarget.lat, lng: activePlanTarget.lon, name: activePlanTarget.name, description: "目的地" }
                ];
            }
        }

        let hotels = [];
        let isHotelFallback = false;
        try {
            const placesRes = await safeFetchJson(getApiUrl('/api/travel/places'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    textQuery: `${activePlanTarget.name} 周辺 ホテル`,
                    purpose: 'hotel',
                    locationBias: {
                        circle: {
                            center: { latitude: activePlanTarget.lat, longitude: activePlanTarget.lon },
                            radius: 5000
                        }
                    },
                    maxResultCount: 5
                })
            });
            hotels = (placesRes.places || []).map(p => ({
                name: p.displayName?.text || "ホテル",
                rating: p.rating ? `${p.rating} / 5.0` : "評価なし",
                price: p.priceLevel ? "¥".repeat(p.priceLevel) : "料金情報なし",
                address: p.formattedAddress || "",
                img: p.photos?.[0]?.name ? `${getApiUrl('/api/travel/photo')}?name=${encodeURIComponent(p.photos[0].name)}&maxWidthPx=400` : "",
                url: `https://www.google.com/maps/search/${encodeURIComponent(p.displayName?.text || '')}`
            }));
            showToast("✨ 周辺のホテル情報を取得しました！");
        } catch (err) {
            console.warn("ホテル情報の取得に失敗したため、モックデータにフォールバックします。", err);
            hotels = (mockHotels[targetPref] || []).map(item => ({ ...item, address: item.desc }));
            isHotelFallback = true;
            if (err.message && err.message.includes("429")) {
                showToast("⚠️ 本日のホテル検索制限に達したため、推奨ホテルを表示します。");
            } else {
                showToast("⚠️ 最適なルートを計算中...");
            }
        }

        const hotelList = document.getElementById("hotelList");
        hotelList.innerHTML = "";

        if (isHotelFallback) {
            const notice = document.createElement("div");
            notice.className = "fallback-notice-banner";
            notice.innerHTML = `
                <span class="material-icons-outlined" style="font-size: 1.1rem; vertical-align: middle; margin-right: 6px; color: var(--accent-anmari);">cloud_off</span>
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--accent-anmari);">
                    API制限または接続エラーのため、推奨ホテル（オフライン表示）を案内しています。
                </span>
            `;
            hotelList.appendChild(notice);
        }

        if (hotels.length === 0) {
            const emptyDiv = document.createElement("div");
            emptyDiv.className = "modal-empty";
            emptyDiv.textContent = "周辺にホテルが見つかりませんでした。";
            hotelList.appendChild(emptyDiv);
        } else {
            hotels.forEach(h => {
                const card = document.createElement("div");
                card.className = "hotel-card";
                const safeName = escapeHTML(h.name);
                const safeRating = escapeHTML(h.rating);
                const safeAddress = h.address ? escapeHTML(h.address) : "";
                const safePrice = (h.price && h.price !== '料金情報なし') ? escapeHTML(h.price) : "";
                const safeUrl = sanitizeUrl(h.url || 'https://www.google.com/maps/search/ホテル');
                card.innerHTML = `
                    <img src="${escapeHTML(h.img || activePlanTarget.img || NO_IMAGE_URL)}" class="hotel-img" alt="${safeName}" onerror="this.onerror=null;this.src='${NO_IMAGE_URL}'">
                    <div class="hotel-info">
                        <div>
                            <h4>${safeName}</h4>
                            <div class="hotel-rating">⭐ ${safeRating}</div>
                            ${safeAddress ? `<p style="font-size:0.8rem;color:#64748b;">${safeAddress}</p>` : ''}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            ${safePrice ? `<p>${safePrice}</p>` : ''}
                            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem; text-decoration: none;">地図で確認・予約</a>
                        </div>
                    </div>
                `;
                hotelList.appendChild(card);
            });
        }

        planObj = {
            id: Date.now(),
            destination: activePlanTarget.name,
            prefecture: targetPref,
            date: dateVal,
            nights: nightsVal,
            people: peopleVal,
            budget: budgetVal,
            lat: activePlanTarget.lat,
            lon: activePlanTarget.lon,
            itineraryText: itineraryText,
            waypoints: waypoints
        };
        planObj.departure = document.getElementById("planStartStation")?.value || planObj.destination || "";
        plans.push(planObj);
        saveToStorage();

        document.getElementById("aiPlanText").innerHTML = formatItineraryHtml(itineraryText);

        const transitText = transitAccessRoutes[activePlanTarget.name] || "公共交通機関の情報が見つかりませんでした。詳細なルートはナビアプリ等でご確認ください。";
        const transitEl = document.getElementById("aiPlanTransitText");
        if (transitEl) transitEl.textContent = transitText;

        succeeded = true;

    } catch (error) {
        console.error("プラン生成中にエラーが発生しました:", error);
        showToast("⚠️ プラン作成に失敗しました。");
        document.getElementById("planError").classList.remove("hidden");

    } finally {
        clearInterval(progressInterval);

        if (fill) fill.style.width = "100%";
        if (train) train.style.left = "100%";
        if (percent) percent.textContent = "100%";

        const elapsedTime = Date.now() - startTime;
        const minDuration = fastMode ? 400 : 1400;
        if (elapsedTime < minDuration) {
            await new Promise(resolve => setTimeout(resolve, minDuration - elapsedTime));
        }

        await new Promise(resolve => setTimeout(resolve, 250));

        loadingView.classList.add("hidden");
        loadingView.style.display = "none";

        if (succeeded) {
            document.getElementById("planResults").classList.remove("hidden");

            updateCountdown();
            updateGridCounts();
            calculateStandStats();

            if (planObj) {
                const title = `${planObj.destination}の旅 (${planObj.nights}泊${planObj.nights + 1}日)`;
                const startDate = new Date(`${planObj.date}T09:00:00`);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + planObj.nights);
                endDate.setHours(18, 0, 0, 0);
                downloadICS(title, planObj.itineraryText, startDate, endDate);
                bindCalendarButton(planObj);
                bind3DSimButton(planObj);
            }
        }
    }
};

function bind3DSimButton(planData) {
    const btn = document.getElementById("launch3DSimBtn");
    if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener("click", () => {
            const wps = planData.waypoints || [];
            const labels = wps.map(function (wp, i) {
                if (i === 0) return "出発地";
                if (i === wps.length - 1) return planData.destination || "目的地";
                return "経由地" + i;
            });
            const enrichedPlan = Object.assign({}, planData, {
                waypointLabels: labels,
                departure: planData.departure || document.getElementById("planStartStation")?.value || ""
            });
            open3DRouteSimulation(enrichedPlan);
        });
    }
}

function bindCalendarButton(planData) {
    const btn = document.getElementById("addToCalendarBtn");
    if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener("click", () => {
            const title = `${planData.destination}の旅 (${planData.nights}泊${planData.nights + 1}日)`;
            const startDate = new Date(`${planData.date}T09:00:00`);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + planData.nights);
            endDate.setHours(18, 0, 0, 0);
            downloadICS(title, planData.itineraryText, startDate, endDate);
        });
    }
}

// 再試行
window.retryPlanGeneration = function () {
    document.getElementById("planError").classList.add("hidden");
    // フォーム送信をトリガー
    const mockEvent = { preventDefault: () => { } };
    generateTravelPlan(mockEvent);
};

function generateItineraryText(name, pref, date, nightsText, people, budget, priorities, others) {
    const startStr = `【${name}を巡る ${nightsText} 旅行プラン】\n📅 日程: ${date} 〜 | 👥 人数: ${people}名様 | 💰 予算目安: ${budget.toLocaleString()}円程度\n🌟 重視: ${priorities.join(", ")}\n`;

    let details = `\n--- 🗺️ スケジュール提案 ---\n`;
    details += `■ 1日目:\n`;
    details += `  ・午前: 各地から出発、JR${pref}内の主要駅にて集合。\n`;
    details += `  ・昼食: 地元の名産料理を堪能（おすすめ: ${pref}名物ランチ）。\n`;
    details += `  ・午後: ${name}を観光。現地ガイドや散策マップを片手にのんびり探索してください。\n`;
    details += `  ・夕方: 下記の推薦ホテルにチェックイン。\n`;
    details += `  ・夜間: ${priorities.includes("グルメ") ? "地元屈指の隠れ家割烹にてディナー。" : "宿の特製温泉に浸かって移動の疲れを癒やします。"}\n`;

    if (nightsText.includes("2泊") || nightsText.includes("3泊")) {
        details += `\n■ 2日目:\n`;
        details += `  ・午前: ホテルで朝食後、周辺の自然溢れる隠れスポットへハイキング。\n`;
        details += `  ・昼食: 景色の良いカフェでローカルスイーツと軽食。\n`;
        details += `  ・午後: 近くの体験型ワークショップ、または歴史的街並みを散策。\n`;
        details += `  ・夜間: 伝統工芸に囲まれた特別な宿にて会席料理に舌鼓。\n`;
    }

    details += `\n■ 最終日:\n`;
    details += `  ・午前: ホテルをゆっくりチェックアウト。地元商店街（市場）でお土産選び。\n`;
    details += `  ・午後: 旅のハイライトとして、絶景カフェでお茶をして思い出を共有。\n`;
    details += `  ・夕方: 駅へ移動し、帰路へ。お疲れ様でした！\n`;

    if (others.trim()) {
        details += `\n💡 ユーザーリクエスト反映:\n「${others}」を考慮し、移動時間をゆったりと確保し、ご希望に沿ったルート設定といたしました。`;
    }

    return startStr + details;
}

// ==========================================
// 8. ホーム機能 (「興味なし」データ自動削除 & 管理)
// ==========================================
function purgeOldAnmaris() {
    const now = Date.now();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
    const initialCount = anmaris.length;

    anmaris = anmaris.filter(item => {
        const savedTime = item.savedAt || now;
        return (now - savedTime) < fifteenDaysMs;
    });

    saveToStorage();
    const deletedCount = initialCount - anmaris.length;
    if (deletedCount > 0) {
        // わずかに遅らせてトーストを表示
        setTimeout(() => {
            showToast(`🧹 15日以上経過した「興味なし」データを ${deletedCount} 件自動クリーンアップしました。`);
        }, 1000);
    }
}

function updateGridCounts() {
    const savedEl = document.getElementById("savedSpotsCount");
    const anmariEl = document.getElementById("anmariCount");
    const planEl = document.getElementById("homePlansCount");

    if (savedEl) savedEl.textContent = likes.length;
    if (anmariEl) anmariEl.textContent = anmaris.length;
    if (planEl) planEl.textContent = plans.length;
}

function updateCountdown() {
    const el = document.getElementById("heroCountdownDays");
    const dest = document.getElementById("heroCountdownDest");

    const homeEmptyState = document.getElementById("home-empty-state");
    const homeHeroCard = document.getElementById("home-hero-card");

    if (plans.length === 0) {
        if (homeEmptyState) homeEmptyState.classList.remove("hidden");
        if (homeHeroCard) homeHeroCard.classList.add("hidden");

        const homeCtaBtn = document.getElementById("homeCtaBtn");
        if (homeCtaBtn) {
            if (likes.length > 0) {
                homeCtaBtn.textContent = "いいねしたスポットでプランを作る";
            } else {
                homeCtaBtn.textContent = "AIに次の旅行を相談する";
            }
        }

        renderSavedSpotsHome();
        renderHomePlans();
        return;
    }

    if (homeEmptyState) homeEmptyState.classList.add("hidden");
    if (homeHeroCard) homeHeroCard.classList.remove("hidden");

    // 未来の予定を日付でソートして直近のものを取得
    const sortedPlans = [...plans].filter(p => new Date(p.date) >= new Date().setHours(0, 0, 0, 0))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedPlans.length === 0) {
        if (el) el.textContent = "-- 日";
        if (dest) dest.textContent = "次の予定を作成してね";
        if (homeHeroCard) {
            homeHeroCard.style.backgroundImage = "url('https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop')";
            homeHeroCard.style.backgroundSize = "cover";
            homeHeroCard.style.backgroundPosition = "center";
        }
        renderSavedSpotsHome();
        renderHomePlans();
        return;
    }

    const next = sortedPlans[0];
    const diff = Math.ceil((new Date(next.date) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));

    if (el) {
        if (diff === 0) {
            el.textContent = "今日！";
        } else {
            el.textContent = `${diff} 日`;
        }
    }
    if (dest) dest.textContent = `📍 ${next.destination}`;

    const place = kinkiPlaces.find(p => p.name === next.destination);
    if (place && homeHeroCard) {
        homeHeroCard.style.backgroundImage = `url('${place.img}')`;
        homeHeroCard.style.backgroundSize = "cover";
        homeHeroCard.style.backgroundPosition = "center";
    } else if (homeHeroCard) {
        homeHeroCard.style.backgroundImage = "url('https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop')";
        homeHeroCard.style.backgroundSize = "cover";
        homeHeroCard.style.backgroundPosition = "center";
    }

    renderSavedSpotsHome();
    renderHomePlans();
}

// 天気予報を表示する関数 (サーバー中継で本物のデータを取得。エラー時は自動でモックにフォールバック)
async function simulateWeather() {
    const weatherIcon = document.getElementById("heroWeatherIcon");
    const weatherTemp = document.getElementById("heroWeatherTemp");
    const weatherDesc = document.getElementById("heroWeatherDesc");
    const weatherLocation = document.getElementById("heroWeatherLoc");

    if (plans.length === 0) {
        if (weatherIcon) weatherIcon.textContent = "🌤️";
        if (weatherTemp) weatherTemp.textContent = "--°C";
        if (weatherDesc) weatherDesc.textContent = "予定を登録すると表示されます";
        if (weatherLocation) weatherLocation.textContent = "目的地の天気";
        return;
    }

    const sortedPlans = [...plans].filter(p => new Date(p.date) >= new Date().setHours(0, 0, 0, 0))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedPlans.length === 0) return;
    const next = sortedPlans[0];

    const lat = next.lat || 34.6937;
    const lon = next.lon || 135.5023;
    const cacheKey = `weather_${lat}_${lon}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
        console.log("[Weather API] Returning cached weather data");
        const cachedData = JSON.parse(cached);
        if (weatherIcon) weatherIcon.textContent = cachedData.emoji;
        if (weatherTemp) weatherTemp.textContent = cachedData.temp;
        if (weatherDesc) weatherDesc.textContent = cachedData.desc;
        if (weatherLocation) weatherLocation.textContent = `📍 ${next.destination} (${next.prefecture})の天気`;
        return;
    }

    try {
        const url = new URL(getApiUrl("/api/travel/weather"));
        url.searchParams.append("latitude", lat);
        url.searchParams.append("longitude", lon);

        const data = await safeFetchJson(url.toString());

        const tempVal = Math.round(data.main.temp) + "°C";
        const descVal = data.weather[0].description;
        const emoji = getWeatherIconEmoji(data.weather[0].icon);

        const weatherResult = {
            temp: tempVal,
            desc: descVal,
            emoji: emoji
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(weatherResult));

        if (weatherIcon) weatherIcon.textContent = emoji;
        if (weatherTemp) weatherTemp.textContent = tempVal;
        if (weatherDesc) weatherDesc.textContent = descVal;
        if (weatherLocation) weatherLocation.textContent = `📍 ${next.destination} (${next.prefecture})の天気`;

    } catch (err) {
        console.warn("本物の天気データの取得に失敗したため、モックデータに切り替えます:", err);

        // 都府県に基づくダミー天候 (フォールバック)
        const weatherData = {
            "京都": { icon: "🌸", temp: "19°C", desc: "穏やかな晴れのち薄曇り" },
            "大阪": { icon: "☀️", temp: "24°C", desc: "快晴・絶好の食べ歩き日和" },
            "兵庫": { icon: "⚓", temp: "22°C", desc: "海風が心地よい晴れ" },
            "奈良": { icon: "🦌", temp: "18°C", desc: "小雨のち晴れ、緑が映える日" },
            "滋賀": { icon: "⛵", temp: "17°C", desc: "琵琶湖周辺は爽やかな強風" },
            "和歌山": { icon: "🍊", temp: "25°C", desc: "南風が暖かい夏日" }
        };

        const mockInfo = weatherData[next.prefecture] || { icon: "🌤️", temp: "20°C", desc: "快適な旅行日和" };
        if (weatherIcon) weatherIcon.textContent = mockInfo.icon;
        if (weatherTemp) weatherTemp.textContent = mockInfo.temp;
        if (weatherDesc) weatherDesc.textContent = mockInfo.desc;
        if (weatherLocation) weatherLocation.textContent = `📍 ${next.destination} (${next.prefecture})の天気`;
    }
}

// 天気アイコンコードを絵文字にマッピングするヘルパー関数
function getWeatherIconEmoji(iconCode) {
    if (!iconCode) return "🌤️";
    const map = {
        "01": "☀️", // clear sky
        "02": "⛅", // few clouds
        "03": "☁️", // scattered clouds
        "04": "☁️", // broken clouds
        "09": "🌧️", // shower rain
        "10": "🌦️", // rain
        "11": "⛈️", // thunderstorm
        "13": "❄️", // snow
        "50": "🌫️"  // mist
    };
    const prefix = iconCode.substring(0, 2);
    return map[prefix] || "🌤️";
}

// ---------------------------
// ホームスライダー（横スライド・Nike風）
// ---------------------------
let currentSlide = 0;
let sliderInterval;

window.goToSlide = function (index) {
    const track = document.getElementById("homeSliderTrack");
    const dots = document.querySelectorAll(".dot");
    if (!track) return;

    // トラックを横方向に移動 (各スライド幅は50%なので、インデックス倍して移動)
    track.style.transform = `translate3d(-${index * 50}%, 0, 0)`;

    dots.forEach((d, i) => d.classList.toggle("active", i === index));
    currentSlide = index;
};

function startSliderAuto() {
    clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        goToSlide((currentSlide + 1) % 2);
    }, 5000);
}

function initSliderSwipe() {
    const wrapper = document.querySelector(".home-slider-wrapper");
    if (!wrapper) return;
    let startX = 0;
    wrapper.addEventListener("pointerdown", e => { startX = e.clientX; });
    wrapper.addEventListener("pointerup", e => {
        const diff = e.clientX - startX;
        if (Math.abs(diff) > 50) {
            const next = diff < 0 ? Math.min(currentSlide + 1, 1) : Math.max(currentSlide - 1, 0);
            goToSlide(next);
            clearInterval(sliderInterval);
            startSliderAuto();
        }
    });
}

// ==========================================
// 9. データ機能 (スタンドパラメータロジック)
// ==========================================
let standStats = [50, 50, 50, 50, 50, 50]; // 温泉・癒やし, 自然・景観, 歴史・文化, グルメ, アクティビティ, 都市・ショッピング
let myChart = null;

function calculateStandStats() {
    let healing = 10;
    let nature = 10;
    let history = 10;
    let food = 10;
    let active = 10;
    let urban = 10;

    // 1. いいね(likes)からの加算
    likes.forEach(item => {
        if (item.category === "healing") healing += 25;
        if (item.category === "nature") nature += 25;
        if (item.category === "history") history += 25;
        if (item.category === "food") food += 25;

        if (item.tags.includes("癒やし") || item.tags.includes("リラックス")) healing += 15;
        if (item.tags.includes("自然")) nature += 15;
        if (item.tags.includes("歴史")) history += 15;
        if (item.tags.includes("グルメ")) food += 15;
        if (item.tags.includes("アクティブ")) active += 30;
        if (item.tags.includes("都市") || item.tags.includes("観光")) urban += 20;
    });

    // 2. 興味なし(anmaris)からの減算 (嗜好の除外を表現)
    anmaris.forEach(item => {
        if (item.category === "healing") healing -= 10;
        if (item.category === "nature") nature -= 10;
        if (item.category === "history") history -= 10;
        if (item.category === "food") food -= 10;

        if (item.tags.includes("癒やし") || item.tags.includes("リラックス")) healing -= 5;
        if (item.tags.includes("自然")) nature -= 5;
        if (item.tags.includes("歴史")) history -= 5;
        if (item.tags.includes("グルメ")) food -= 5;
        if (item.tags.includes("アクティブ")) active -= 10;
        if (item.tags.includes("都市") || item.tags.includes("観光")) urban -= 8;
    });

    // 3. 予定(plans)からの加算
    plans.forEach(plan => {
        const spot = kinkiPlaces.find(p => p.name === plan.destination);
        if (spot) {
            if (spot.category === "healing") healing += 20;
            if (spot.category === "nature") nature += 20;
            if (spot.category === "history") history += 20;
            if (spot.category === "food") food += 20;

            if (spot.tags.includes("アクティブ")) active += 20;
            if (spot.tags.includes("都市") || spot.tags.includes("観光")) urban += 15;
        } else {
            healing += 5;
            nature += 5;
            history += 5;
            food += 5;
        }
    });

    // 10から100の間にクランプ
    standStats = [
        Math.min(100, Math.max(10, healing)),
        Math.min(100, Math.max(10, nature)),
        Math.min(100, Math.max(10, history)),
        Math.min(100, Math.max(10, food)),
        Math.min(100, Math.max(10, active)),
        Math.min(100, Math.max(10, urban))
    ];

    // 新属性タグ（同行者, 予算レンジ, 移動手段, 目的・シーン）の重み計算
    let companions = { "一人旅": 0, "カップル": 0, "友人グループ": 0, "子連れ": 0 };
    let budgets = { "低予算": 0, "スタンダード": 0, "ラグジュアリー": 0 };
    let transports = { "自家用車": 0, "公共交通機関": 0, "徒歩": 0 };
    let purposes = { "リフレッシュ": 0, "アクティビティ": 0, "グルメ": 0, "歴史探訪": 0 };

    let totalCompanions = 0;
    let totalBudgets = 0;
    let totalTransports = 0;
    let totalPurposes = 0;

    function addDetailedWeights(spot, factor) {
        if (spot.companion) {
            spot.companion.forEach(c => {
                companions[c] = (companions[c] || 0) + factor;
                totalCompanions += factor;
            });
        }
        if (spot.budget) {
            budgets[spot.budget] = (budgets[spot.budget] || 0) + factor;
            totalBudgets += factor;
        }
        if (spot.transport) {
            transports[spot.transport] = (transports[spot.transport] || 0) + factor;
            totalTransports += factor;
        }
        if (spot.purpose) {
            purposes[spot.purpose] = (purposes[spot.purpose] || 0) + factor;
            totalPurposes += factor;
        }
    }

    likes.forEach(item => {
        let isFav = favorites.some(f => f.id === item.id);
        addDetailedWeights(item, isFav ? 3 : 1);
    });

    // 割合（％）に変換
    if (totalCompanions > 0) {
        for (let k in companions) companions[k] = Math.round((companions[k] / totalCompanions) * 100);
    } else {
        companions = { "一人旅": 25, "カップル": 25, "友人グループ": 25, "子連れ": 25 };
    }

    if (totalBudgets > 0) {
        for (let k in budgets) budgets[k] = Math.round((budgets[k] / totalBudgets) * 100);
    } else {
        budgets = { "低予算": 33, "スタンダード": 34, "ラグジュアリー": 33 };
    }

    if (totalTransports > 0) {
        for (let k in transports) transports[k] = Math.round((transports[k] / totalTransports) * 100);
    } else {
        transports = { "自家用車": 33, "公共交通機関": 34, "徒歩": 33 };
    }

    if (totalPurposes > 0) {
        for (let k in purposes) purposes[k] = Math.round((purposes[k] / totalPurposes) * 100);
    } else {
        purposes = { "リフレッシュ": 25, "アクティビティ": 25, "グルメ": 25, "歴史探訪": 25 };
    }

    detailedPrefs = { companion: companions, budget: budgets, transport: transports, purpose: purposes };

    saveToStorage();
    updateStandProfile();
}

function updateStandProfile() {
    const labels = ["温泉・癒やし", "自然・景観", "歴史・文化", "グルメ", "アクティビティ", "都市・ショッピング"];
    const highestVal = Math.max(...standStats);
    const highestIndex = standStats.indexOf(highestVal);

    let standName = "トラベラー・スター";
    let rankText = "C";

    // 突出したステータスに基づくスタンド名生成
    if (highestIndex === 0) standName = "温泉の守護神 (スパ・ガーディアン)";
    else if (highestIndex === 1) standName = "大自然の開拓者 (フォレスト・ウォーカー)";
    else if (highestIndex === 2) standName = "歴史の探求者 (クロニクル・アーカイブ)";
    else if (highestIndex === 3) standName = "美食の支配者 (グルメ・マスター)";
    else if (highestIndex === 4) standName = "冒険のアスリート (ワイルド・チャレンジャー)";
    else if (highestIndex === 5) standName = "都市のナビゲーター (アーバン・エクスプローラー)";

    // バランスが良い場合
    const sum = standStats.reduce((a, b) => a + b, 0);
    const avg = sum / 6;
    let isBalanced = true;
    standStats.forEach(s => {
        if (Math.abs(s - avg) > 15) isBalanced = false;
    });
    if (isBalanced) {
        standName = "調和の旅人 (ハーモニアス・ジャーニー)";
    }

    // ランク決定
    if (avg >= 85) rankText = "A (超極上トラベラー)";
    else if (avg >= 70) rankText = "B (アクティブトラベラー)";
    else if (avg >= 55) rankText = "C (標準的プランナー)";
    else if (avg >= 40) rankText = "D (マイペース旅人)";
    else rankText = "E (発展途上の冒険者)";

    const standNameEl = document.getElementById("standName");
    const standRankEl = document.getElementById("standRank");
    if (standNameEl) standNameEl.textContent = standName;
    if (standRankEl) standRankEl.textContent = `診断評価: Rank ${rankText}`;
}

function updateChart() {
    const canvas = document.getElementById("standChart");
    if (!canvas) return;

    calculateStandStats(); // パラメータを最新に再計算

    const ctx = canvas.getContext("2d");
    if (myChart) myChart.destroy();

    // テーマ色によるチャート線の色変更
    let themeColor = "#007cff";
    if (currentTheme === "mc-emerald") themeColor = "#10b981";
    else if (currentTheme === "mc-amber") themeColor = "#f59e0b";
    else if (currentTheme === "mc-dark") themeColor = "#3b82f6";

    myChart = new Chart(ctx, {
        type: "radar",
        data: {
            labels: ["温泉・癒やし", "自然・景観", "歴史・文化", "グルメ", "アクティビティ", "都市・ショッピング"],
            datasets: [{
                data: standStats,
                fill: true,
                backgroundColor: `${themeColor}20`,
                borderColor: themeColor,
                pointBackgroundColor: themeColor,
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: themeColor
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { display: false, stepSize: 20 },
                    grid: { color: "rgba(255,255,255,0.08)" },
                    angleLines: { color: "rgba(255,255,255,0.08)" },
                    pointLabels: { color: "#94a3b8", font: { family: "sans-serif", size: 12 } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    renderDetailedPrefBars();
}

function renderDetailedPrefBars() {
    const companionContainer = document.getElementById("companionPrefBars");
    const budgetContainer = document.getElementById("budgetPrefBars");
    const transportContainer = document.getElementById("transportPrefBars");
    const purposeContainer = document.getElementById("purposePrefBars");

    if (!companionContainer || !budgetContainer || !transportContainer || !purposeContainer) return;

    function buildBarsHTML(obj) {
        // 値の大きい順にソート
        const sorted = Object.entries(obj).sort((a, b) => b[1] - a[1]);
        return sorted.map(([key, val]) => `
            <div class="pref-bar-row" style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; margin-bottom: 6px;">
                <span style="width: 85px; text-align: left; font-weight: 600; color: var(--text-color);">${key}</span>
                <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color); position: relative;">
                    <div style="width: ${val}%; height: 100%; background: linear-gradient(90deg, var(--primary-color), #3b82f6); border-radius: 4px; transition: width 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);"></div>
                </div>
                <span style="width: 35px; text-align: right; color: var(--text-muted); font-weight: 600;">${val}%</span>
            </div>
        `).join("");
    }

    companionContainer.innerHTML = buildBarsHTML(detailedPrefs.companion);
    budgetContainer.innerHTML = buildBarsHTML(detailedPrefs.budget);
    transportContainer.innerHTML = buildBarsHTML(detailedPrefs.transport);
    purposeContainer.innerHTML = buildBarsHTML(detailedPrefs.purpose);
}

// ==========================================
// 10. 設定機能 (アカウント、テーマ、文字サイズ)
// ==========================================
window.updateSettingsFromUI = function () {
    const usernameInput = document.getElementById("settingsUsername");
    const headerTitleInput = document.getElementById("settingsHeaderTitle");

    userName = usernameInput ? usernameInput.value.trim() || "トラベラー" : "トラベラー";
    headerTitle = headerTitleInput ? headerTitleInput.value.trim() || "Japan Wander" : "Japan Wander";


    applyAccountSettings();
    saveToStorage();
};

window.selectAvatar = function (seed, element) {
    document.querySelectorAll(".avatar-opt").forEach(a => a.classList.remove("selected"));
    element.classList.add("selected");
    userAvatar = seed;

    applyAccountSettings();
    saveToStorage();
    showToast("アバターアイコンを変更しました！");
};

function applyAccountSettings() {
    const userAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${userAvatar}`;

    // サイドバー更新
    const nameEl = document.getElementById("userName");
    const avatarImg = document.getElementById("userAvatar");
    if (nameEl) nameEl.textContent = userName;
    if (avatarImg) avatarImg.src = userAvatarUrl;

    // モバイルヘッダー更新
    const mobileHeaderTitle = document.getElementById("headerTitle");
    const headerAvatarImg = document.getElementById("headerUserAvatar");
    if (mobileHeaderTitle) mobileHeaderTitle.textContent = headerTitle;
    if (headerAvatarImg) headerAvatarImg.src = userAvatarUrl;

    // マイページ更新
    const myPageName = document.getElementById("myPageName");
    const myPageAvatar = document.getElementById("myPageAvatar");
    if (myPageName) myPageName.textContent = userName;
    if (myPageAvatar) myPageAvatar.src = userAvatarUrl;
}

window.changeTheme = function (theme) {
    document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
    currentTheme = theme;

    let themeLabel = "M&C ブルー";
    // ボタンのアクティブ状態更新
    if (theme === "mc-blue") {
        document.getElementById("btnThemeMcBlue")?.classList.add("active");
        themeLabel = "M&C ブルー";
    }
    if (theme === "mc-emerald") {
        document.getElementById("btnThemeMcEmerald")?.classList.add("active");
        themeLabel = "エメラルド";
    }
    if (theme === "mc-amber") {
        document.getElementById("btnThemeMcAmber")?.classList.add("active");
        themeLabel = "アンバー";
    }
    if (theme === "mc-dark") {
        document.getElementById("btnThemeMcDark")?.classList.add("active");
        themeLabel = "チャコール";
    }

    applyTheme(theme);
    saveToStorage();
    showToast(`テーマを「${themeLabel}」に変更しました。`);
};

function applyTheme(theme) {
    document.body.className = "";
    document.body.classList.add(`theme-${theme}`);
}

window.changeFontSize = function (val) {
    currentFontSize = val;
    applyFontSize(val);

    const sizeText = document.getElementById("sizeValText");
    if (sizeText) sizeText.textContent = `${val}%`;
    saveToStorage();
};

function applyFontSize(val) {
    const scale = parseFloat(val) / 100;
    document.documentElement.style.setProperty("--app-font-size", `${16 * scale}px`);
}

window.changeLanguage = function (lang) {
    currentLanguage = lang;
    saveToStorage();
    if (lang === "en") {
        showToast("Simulation English selected (Main strings remain in Japanese).");
    } else {
        showToast("日本語に切り替えました。");
    }
};

// ==========================================
// 11. モーダルダイアログ (一覧表示)
// ==========================================
window.openModal = function (type) {
    const overlay = document.getElementById("modal-overlay");
    const title = document.getElementById("modalTitle");
    const body = document.getElementById("modalBody");

    const configs = {
        "favorites": { label: "⭐ お気に入りスポット", list: favorites, emptyMsg: "お気に入りはまだありません。" },
        "recent-likes": { label: "❤️ 最近いいねしたスポット", list: likes, emptyMsg: "いいねしたスポットはまだありません。" },
        "plans": { label: "📅 作成した旅行予定", list: plans, emptyMsg: "旅行予定はまだありません。予定タブから作成してください。" },
        "anmari": { label: "👎 興味なし（自動クリーンアップ予定）", list: anmaris, emptyMsg: "「興味なし」としたスポットはありません。" }
    };

    const cfg = configs[type];
    if (!cfg) return;

    title.textContent = cfg.label;

    if (cfg.list.length === 0) {
        body.innerHTML = `<div class="modal-empty">${cfg.emptyMsg}</div>`;
    } else {
        renderModalList(type, cfg.list, body);
    }

    overlay.classList.remove("hidden");
};

window.closeModal = function () {
    document.getElementById("modal-overlay").classList.add("hidden");
};

function renderModalList(type, list, container) {
    const now = Date.now();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;

    container.innerHTML = list.map(item => {
        const safeName = escapeHTML(item.name);
        const safePref = escapeHTML(item.prefecture);
        const safeSeason = escapeHTML(item.season ? (item.season.includes('通年') ? item.season : item.season + '時期') : '通年');
        const safeDesc = escapeHTML(item.description ? item.description.substring(0, 30) : '');

        if (type === "anmari") {
            const savedTime = item.savedAt || now;
            const daysPassed = (now - savedTime) / (1000 * 60 * 60 * 24);
            const daysLeft = Math.max(0, Math.ceil(15 - daysPassed));

            return `
                <div class="modal-item" id="modal-item-${item.id}">
                    <div class="modal-item-info">
                        <div class="modal-item-name">${getDisplayName(item.name)}</div>
                        <div class="modal-item-sub">📍 ${safePref} / ${safeSeason}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="modal-item-days">自動消滅まであと${daysLeft}日</span>
                        <button class="btn-item-delete" onclick="deleteModalItem('anmari', ${item.id})">
                            <span class="material-icons" style="font-size: 1.2rem;">delete</span>
                        </button>
                    </div>
                </div>
            `;
        } else if (type === "plans") {
            const safeDest = escapeHTML(item.destination);
            const safeDate = escapeHTML(item.date);
            const safePeople = escapeHTML(item.people);
            const nights = parseInt(item.nights, 10) || 0;
            return `
                <div class="modal-item" id="modal-item-${item.id}">
                    <div class="modal-item-info" style="flex: 1; cursor: pointer;" onclick="viewItineraryDetails(${item.id})">
                        <div class="modal-item-name">📅 ${safeDest} の旅 (${nights}泊${nights + 1}日)</div>
                        <div class="modal-item-sub">出発日: ${safeDate} | 人数: ${safePeople}名</div>
                    </div>
                    <button class="btn-item-delete" onclick="deleteModalItem('plans', ${item.id})">
                        <span class="material-icons" style="font-size: 1.2rem;">delete</span>
                    </button>
                </div>
            `;
        } else if (type === "favorites") {
            return `
                <div class="modal-item" id="modal-item-${item.id}">
                    <div class="modal-item-info">
                        <div class="modal-item-name">${getDisplayName(item.name)}</div>
                        <div class="modal-item-sub">📍 ${safePref} | ${safeDesc}...</div>
                    </div>
                    <button class="btn-item-delete" onclick="deleteModalItem('favorites', ${item.id})">
                        <span class="material-icons" style="font-size: 1.2rem;">star</span>
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="modal-item" id="modal-item-${item.id}">
                    <div class="modal-item-info">
                        <div class="modal-item-name">${getDisplayName(item.name)}</div>
                        <div class="modal-item-sub">📍 ${safePref} | ${safeDesc}...</div>
                    </div>
                    <button class="btn-item-delete" onclick="deleteModalItem('recent-likes', ${item.id})">
                        <span class="material-icons" style="font-size: 1.2rem;">delete</span>
                    </button>
                </div>
            `;
        }
    }).join("");
}

// 予定の詳細表示
window.viewItineraryDetails = function (planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    closeModal();

    // 予定タブを表示し、結果表示に切り替える
    switchView("plan");

    // いいねリストで該当スポットを選択状態にする
    renderLikedList();

    const planFormPlaceholder = document.getElementById("planFormPlaceholder");
    if (planFormPlaceholder) planFormPlaceholder.classList.add("hidden");
    const planForm = document.getElementById("planForm");
    if (planForm) planForm.classList.add("hidden");
    const planLoading = document.getElementById("planLoading");
    if (planLoading) planLoading.classList.add("hidden");
    const planError = document.getElementById("planError");
    if (planError) planError.classList.add("hidden");

    // ホテル推薦をこの府県に合わせて表示
    const hotels = (mockHotels[plan.prefecture] || []).map(item => ({ ...item, address: item.desc }));
    const hotelList = document.getElementById("hotelList");
    hotelList.innerHTML = "";

    const referenceSpot = kinkiPlaces.find(p => p.name === plan.destination) || kinkiPlaces[0];

    hotels.forEach(h => {
        const card = document.createElement("div");
        card.className = "hotel-card";
        const safeName = escapeHTML(h.name);
        const safeRating = escapeHTML(h.rating);
        const safeAddress = h.address ? escapeHTML(h.address) : "";
        const safePrice = (h.price && h.price !== '料金情報なし') ? escapeHTML(h.price) : "";
        const safeUrl = sanitizeUrl(h.url || 'https://www.google.com/maps/search/ホテル');
        card.innerHTML = `
            <img src="${escapeHTML(referenceSpot.img || NO_IMAGE_URL)}" class="hotel-img" alt="${safeName}" onerror="this.onerror=null;this.src='${NO_IMAGE_URL}'">
            <div class="hotel-info">
                <div>
                    <h4>${safeName}</h4>
                    <div class="hotel-rating">⭐ ${safeRating}</div>
                    ${safeAddress ? `<p style="font-size:0.8rem;color:#64748b;">${safeAddress}</p>` : ''}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    ${safePrice ? `<p>${safePrice}</p>` : ''}
                    <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem; text-decoration: none;">地図で確認・予約</a>
                </div>
            </div>
        `;
        hotelList.appendChild(card);
    });

    document.getElementById("aiPlanText").innerHTML = formatItineraryHtml(plan.itineraryText);

    // アクセス情報表示
    const transitText = transitAccessRoutes[plan.destination] || "公共交通機関の情報が見つかりませんでした。詳細なルートはナビアプリ等でご確認ください。";
    const transitEl = document.getElementById("aiPlanTransitText");
    if (transitEl) transitEl.textContent = transitText;

    document.getElementById("planResults").classList.remove("hidden");

    bindCalendarButton(plan);
    bind3DSimButton(plan);
};

// モーダル内の項目削除
window.deleteModalItem = function (type, id) {
    if (type === "anmari") {
        anmaris = anmaris.filter(a => a.id !== id);
    } else if (type === "plans") {
        plans = plans.filter(p => p.id !== id);
    } else if (type === "favorites") {
        favorites = favorites.filter(f => f.id !== id);
    } else if (type === "recent-likes") {
        likes = likes.filter(l => l.id !== id);
        // いいねが消えたら、予定画面側も影響されるので再読込
        if (activePlanTarget && activePlanTarget.id === id) {
            activePlanTarget = null;
            document.getElementById("planForm").classList.add("hidden");
            document.getElementById("planResults").classList.add("hidden");
            document.getElementById("planFormPlaceholder").classList.remove("hidden");
        }
    }

    saveToStorage();
    updateGridCounts();
    updateCountdown();
    simulateWeather();
    calculateStandStats();

    // モーダルのDOMを再描画
    const body = document.getElementById("modalBody");
    const list = type === "anmari" ? anmaris :
        type === "plans" ? plans :
            type === "favorites" ? favorites : likes;

    const configs = {
        "favorites": "お気に入りはまだありません。",
        "recent-likes": "いいねしたスポットはまだありません。",
        "plans": "旅行予定はまだありません。予定タブから作成してください。",
        "anmari": "「興味なし」としたスポットはありません。"
    };

    if (list.length === 0) {
        body.innerHTML = `<div class="modal-empty">${configs[type]}</div>`;
    } else {
        renderModalList(type, list, body);
    }

    showToast("項目を削除しました。");
};

// ==========================================
// 12. プラン共有・コミュニティ機能の制御ロジック
// ==========================================
window.renderShareView = function () {
    const sharedListContainer = document.getElementById("sharedPlansList");
    const myPlansContainer = document.getElementById("myPlansToShare");
    if (!sharedListContainer || !myPlansContainer) return;

    // 1. みんなの投稿プランを描画
    sharedListContainer.innerHTML = "";
    if (sharedPlans.length === 0) {
        sharedListContainer.innerHTML = `<div class="modal-empty">投稿されたプランはありません。</div>`;
    } else {
        sharedPlans.forEach(sp => {
            const nights = parseInt(sp.nights, 10) || 0;
            const nightsText = `${nights}泊${nights + 1}日`;
            const reactions = sp.reactions || { like: 0, heart: 0, fire: 0, wow: 0 };
            const standStatsArr = sp.standStats ? JSON.stringify(sp.standStats) : "null";
            const safeAuthor = escapeHTML(sp.author);
            const safeDate = escapeHTML(sp.date);
            const safePref = escapeHTML(sp.prefecture);
            const safeDest = escapeHTML(sp.destination);
            const safePeople = escapeHTML(sp.people);
            const safeBudget = escapeHTML(sp.budget ? sp.budget.toLocaleString() : "0");
            const safeItinerary = escapeHTML(sp.itineraryText || "").replace(/\n/g, "<br>");
            const safeAvatar = encodeURIComponent(sp.avatar || "traveler");

            const div = document.createElement("div");
            div.className = "shared-plan-card";
            div.innerHTML = `
                <div class="shared-card-header">
                    <div class="shared-author-info">
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${safeAvatar}" class="shared-author-avatar" alt="Avatar">
                        <div>
                            <span class="shared-author-name">${safeAuthor}</span>
                            <span class="shared-date-badge">プラン作成日: ${safeDate}</span>
                        </div>
                    </div>
                    <span class="shared-pref-badge">📍 ${safePref}</span>
                </div>
                <div class="shared-card-body">
                    <h4>📅 ${safeDest} の旅 (${nightsText})</h4>
                    <p class="shared-details">👥 ${safePeople}名様 | 💰 予算目安: ${safeBudget}円程度</p>
                    <div class="shared-itinerary-preview" onclick="toggleSharedItinerary(this)">
                        <div class="preview-text">${safeItinerary}</div>
                        <div class="preview-fade"></div>
                        <div class="preview-toggle-btn">行程をすべて表示</div>
                    </div>

                    <!-- 旅スタンド相性診断 UI -->
                    <div class="compatibility-container" id="compat-container-${sp.id}">
                        <button class="btn-compatibility" onclick="checkStandCompatibility(${sp.id}, ${standStatsArr})">
                            <span class="material-icons" style="font-size: 1.1rem; vertical-align: middle; margin-right: 4px;">bolt</span>
                            旅スタンド相性診断を行う
                        </button>
                    </div>

                    <!-- リアクションエリア -->
                    <div class="reactions-bar">
                        <button class="reaction-btn" onclick="reactToPlan(${sp.id}, 'like')">
                            <span>👍</span> <span class="react-count">${reactions.like}</span>
                        </button>
                        <button class="reaction-btn" onclick="reactToPlan(${sp.id}, 'heart')">
                            <span>❤️</span> <span class="react-count">${reactions.heart}</span>
                        </button>
                        <button class="reaction-btn" onclick="reactToPlan(${sp.id}, 'fire')">
                            <span>🔥</span> <span class="react-count">${reactions.fire}</span>
                        </button>
                        <button class="reaction-btn" onclick="reactToPlan(${sp.id}, 'wow')">
                            <span>😮</span> <span class="react-count">${reactions.wow}</span>
                        </button>
                    </div>
                </div>
                <div class="shared-card-footer">
                    <button class="btn-primary" style="padding: 8px 16px; font-size: 0.85rem;" onclick="useSharedPlan(${sp.id})">
                        <span class="material-icons-outlined" style="font-size: 1rem; vertical-align: middle; margin-right: 4px;">content_copy</span>
                        このプランを自分の予定にコピー
                    </button>
                </div>
            `;
            sharedListContainer.appendChild(div);
        });
    }

    // 2. マイプランの投稿候補を描画
    myPlansContainer.innerHTML = "";
    if (plans.length === 0) {
        myPlansContainer.innerHTML = `<div class="modal-empty" style="padding: 16px;">作成した旅行予定がありません。「予定」タブからAIプランを生成すると、ここに表示されて共有できます。</div>`;
    } else {
        plans.forEach(p => {
            const isAlreadyShared = sharedPlans.some(sp => sp.author.includes(userName) && sp.destination === p.destination && sp.date === p.date);
            const div = document.createElement("div");
            div.className = "my-shareable-item";
            div.innerHTML = `
                <div style="flex: 1;">
                    <span class="shareable-title">📅 ${p.destination} の旅 (${p.nights}泊${p.nights + 1}日)</span>
                    <span class="shareable-sub">日付: ${p.date} | 人数: ${p.people}名 | 予算: ${p.budget.toLocaleString()}円</span>
                </div>
                <button class="btn-primary" style="padding: 6px 14px; font-size: 0.8rem; background-color: ${isAlreadyShared ? 'var(--text-muted)' : 'var(--primary-color)'};" onclick="sharePlan(${p.id})" ${isAlreadyShared ? 'disabled' : ''}>
                    ${isAlreadyShared ? '投稿済み' : '共有する'}
                </button>
            `;
            myPlansContainer.appendChild(div);
        });
    }
};

window.checkStandCompatibility = function (id, targetStats) {
    if (!targetStats) {
        targetStats = [60, 50, 70, 60, 50, 40];
    }

    let sumDiff = 0;
    for (let i = 0; i < 6; i++) {
        sumDiff += Math.abs(standStats[i] - targetStats[i]);
    }
    const score = Math.max(30, Math.min(100, Math.round(100 - (sumDiff / 6))));

    let description = "ユニーク！新しい発見がある旅の組み合わせです。";
    let icon = "explore";
    let colorClass = "compat-unique";

    if (score >= 85) {
        description = "相性抜群！旅行の価値観が完全に一致しています。";
        icon = "verified";
        colorClass = "compat-perfect";
    } else if (score >= 70) {
        description = "高相性！とても楽しい旅になりそうです。";
        icon = "thumb_up";
        colorClass = "compat-high";
    } else if (score >= 50) {
        description = "標準的。お互いのこだわりを尊重し合える関係です。";
        icon = "handshake";
        colorClass = "compat-standard";
    }

    const container = document.getElementById(`compat-container-${id}`);
    if (container) {
        container.innerHTML = `
            <div class="compatibility-result-card ${colorClass}">
                <div class="compat-score-wrapper">
                    <span class="material-icons compat-icon">${icon}</span>
                    <span class="compat-percent">あなたとの相性: <strong>${score}%</strong></span>
                </div>
                <div class="compat-desc">${description}</div>
            </div>
        `;
        showToast(`⚡ スタンド相性診断結果: ${score}%！`);
    }
};

window.reactToPlan = function (id, reactionType) {
    const planIndex = sharedPlans.findIndex(s => s.id === id);
    if (planIndex === -1) return;

    if (!sharedPlans[planIndex].reactions) {
        sharedPlans[planIndex].reactions = { like: 0, heart: 0, fire: 0, wow: 0 };
    }

    sharedPlans[planIndex].reactions[reactionType]++;
    localStorage.setItem("kw_shared_plans", JSON.stringify(sharedPlans));

    renderShareView();
    showToast("リアクションを送信しました！");
};

window.toggleSharedItinerary = function (element) {
    element.classList.toggle("expanded");
    const btn = element.querySelector(".preview-toggle-btn");
    if (element.classList.contains("expanded")) {
        btn.textContent = "折りたたむ";
    } else {
        btn.textContent = "行程をすべて表示";
    }
};

window.sharePlan = function (planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // 既に共有されているかチェック
    const isAlreadyShared = sharedPlans.some(sp => sp.author.includes(userName) && sp.destination === plan.destination && sp.date === plan.date);
    if (isAlreadyShared) {
        showToast("このプランは既に共有されています。");
        return;
    }

    const newShared = {
        id: Date.now(),
        author: `${userName} (あなた)`,
        avatar: userAvatar,
        destination: plan.destination,
        prefecture: plan.prefecture,
        date: plan.date,
        nights: plan.nights,
        people: plan.people,
        budget: plan.budget,
        itineraryText: plan.itineraryText,
        reactions: { like: 0, heart: 0, fire: 0, wow: 0 },
        standStats: [...standStats]
    };

    sharedPlans.unshift(newShared);
    localStorage.setItem("kw_shared_plans", JSON.stringify(sharedPlans));

    showToast("✨ プランをコミュニティに共有しました！");
    renderShareView();
};

window.useSharedPlan = function (sharedPlanId) {
    const sp = sharedPlans.find(s => s.id === sharedPlanId);
    if (!sp) return;

    const newPlan = {
        id: Date.now(),
        destination: sp.destination,
        prefecture: sp.prefecture,
        date: new Date().toISOString().split('T')[0], // 今日をデフォルト出発日に設定
        nights: sp.nights,
        people: sp.people,
        budget: sp.budget,
        itineraryText: sp.itineraryText,
        lat: kinkiPlaces.find(p => p.name === sp.destination)?.lat || 34.6873,
        lon: kinkiPlaces.find(p => p.name === sp.destination)?.lon || 135.5262
    };

    plans.push(newPlan);
    saveToStorage();

    showToast(`📅 「${sp.destination}」のプランをあなたの予定にコピーしました！`);

    // ホーム画面へ遷移して追加された予定を表示
    switchView("home");
};

// ==========================================
// 13. Firebase Authentication 制御ロジック
// ==========================================
let isSignUpMode = false; // デフォルトはログイン（サインイン）モード

function clearAuthInputs() {
    const emailInput = document.getElementById("authEmail");
    const passInput = document.getElementById("authPassword");
    if (emailInput) emailInput.value = "";
    if (passInput) passInput.value = "";
}

window.toggleAuthMode = function (event) {
    if (event) event.preventDefault();
    isSignUpMode = !isSignUpMode;
    updateAuthModalUI();
};

function updateAuthModalUI() {
    const title = document.getElementById("authModalTitle");
    const submitBtn = document.getElementById("authSubmitBtn");
    const toggleText = document.getElementById("authToggleText");
    const toggleLink = document.getElementById("authToggleLink");

    if (isSignUpMode) {
        if (title) title.textContent = "新規アカウント登録";
        if (submitBtn) submitBtn.textContent = "登録する";
        if (toggleText) toggleText.textContent = "既にアカウントをお持ちですか？";
        if (toggleLink) toggleLink.textContent = "ログイン";
    } else {
        if (title) title.textContent = "ログイン";
        if (submitBtn) submitBtn.textContent = "ログイン";
        if (toggleText) toggleText.textContent = "アカウントをお持ちでないですか？";
        if (toggleLink) toggleLink.textContent = "新規登録";
    }
}

window.handleAuthSubmit = async function (event) {
    event.preventDefault();
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    if (password.length < 6) {
        showToast("⚠️ パスワードは6文字以上で入力してください。");
        return;
    }

    try {
        if (isSignUpMode) {
            await createUserWithEmailAndPassword(auth, email, password);
            showToast("✨ アカウントを作成し、ログインしました！");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showToast("🔑 ログインしました！");
        }
        clearAuthInputs();
    } catch (error) {
        console.error("認証エラー:", error);
        let errorMsg = "認証に失敗しました。";
        if (error.code === "auth/email-already-in-use") {
            errorMsg = "⚠️ このメールアドレスは既に登録されています。";
        } else if (error.code === "auth/invalid-email") {
            errorMsg = "⚠️ 無効なメールアドレス形式です。";
        } else if (error.code === "auth/weak-password") {
            errorMsg = "⚠️ パスワードが弱すぎます。";
        } else if (error.code === "auth/invalid-credential") {
            errorMsg = "⚠️ メールアドレスまたはパスワードが正しくありません。";
        } else {
            errorMsg = `エラー: ${error.message}`;
        }
        showToast(errorMsg);
    }
};

window.logoutUser = async function () {
    try {
        await signOut(auth);
        showToast("👋 ログアウトしました。");
    } catch (error) {
        console.error("ログアウトエラー:", error);
        showToast(`ログアウトに失敗しました: ${error.message}`);
    }
};

window.signInWithGoogle = async function () {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        showToast("🔑 Googleアカウントでログインしました！");
        clearAuthInputs();
    } catch (error) {
        console.error("Google認証エラー:", error);
        showToast(`⚠️ Googleログインに失敗しました: ${error.message}`);
    }
};

window.signInAsGuest = async function () {
    try {
        await signInAnonymously(auth);
        showToast("👤 ゲストとしてログインしました。");
        clearAuthInputs();
    } catch (error) {
        console.error("匿名ログインエラー:", error);
        showToast(`⚠️ ゲストログインに失敗しました: ${error.message}`);
    }
};

window.signInAsGuestSplash = async function () {
    await signInAsGuest();
};

window.handlePasswordReset = async function (event) {
    event.preventDefault();
    const email = document.getElementById("authEmail").value.trim();
    if (!email) {
        showToast("⚠️ メールアドレスを入力してください。");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        showToast("✅ パスワード再設定メールを送信しました。メールをご確認ください。");
    } catch (error) {
        console.error("パスワードリセットエラー:", error);
        let errorMsg = "パスワード再設定メールの送信に失敗しました。";
        if (error.code === "auth/invalid-email") {
            errorMsg = "⚠️ 無効なメールアドレス形式です。";
        } else if (error.code === "auth/user-not-found") {
            errorMsg = "⚠️ このメールアドレスは登録されていません。";
        } else {
            errorMsg = `エラー: ${error.message}`;
        }
        showToast(errorMsg);
    }
};

// ==========================================
// 14. AIチャットボット (旅行相談窓口) 制御ロジック
// ==========================================

window.openChatDrawer = function () {
    const drawer = document.getElementById("chat-drawer");
    if (drawer) {
        drawer.classList.remove("hidden");
        drawer.style.transform = "translateX(0)";
    }
};

window.closeChatDrawer = function () {
    const drawer = document.getElementById("chat-drawer");
    if (drawer) {
        drawer.classList.add("hidden");
        drawer.style.transform = "translateX(100%)";
    }
    chatHistory = [];
};

window.toggleChatEditMode = function () {
    chatEditMode = !chatEditMode;
    const btn = document.getElementById("chatEditModeBtn");
    if (chatEditMode) {
        btn.style.background = "var(--primary-color)";
        btn.style.color = "#fff";
        btn.style.borderColor = "var(--primary-color)";
        const targetPlan = plans[plans.length - 1];
        if (targetPlan) {
            appendChatBubble("ai", `✏️ プラン編集モードをONにしました。\n「${targetPlan.destination}の旅」を編集できます。\n例：「2日目を温泉にして」「グルメを増やして」など自然に話しかけてください。`);
        } else {
            appendChatBubble("ai", "⚠️ 編集できるプランがありません。先にプランを作成してください。");
            chatEditMode = false;
            btn.style.background = "transparent";
            btn.style.color = "var(--text-muted)";
        }
    } else {
        btn.style.background = "transparent";
        btn.style.color = "var(--text-muted)";
        btn.style.borderColor = "var(--border-color)";
        appendChatBubble("ai", "プラン編集モードをOFFにしました。通常の旅行相談モードに戻ります。");
    }
};

function appendChatBubble(sender, text) {
    const body = document.getElementById("chatDrawerBody");
    if (!body) return;

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble chat-bubble-${sender}`;
    const avatar = document.createElement("div");
    avatar.className = "chat-avatar";
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    const chatText = document.createElement("div");
    chatText.className = "chat-text";
    chatText.textContent = text;
    bubble.appendChild(avatar);
    bubble.appendChild(chatText);
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
}

function appendTypingIndicator() {
    const body = document.getElementById("chatDrawerBody");
    if (!body) return null;

    const typingId = "typing-" + Date.now();
    const bubble = document.createElement("div");
    bubble.id = typingId;
    bubble.className = "chat-typing-bubble";
    bubble.innerHTML = `
        <div class="chat-typing-boat-train">
            <span class="material-icons boat-icon-mini">sailing</span>
            <div class="chat-typing-track">
                <div class="chat-typing-train-icon">
                    <span class="material-icons">train</span>
                </div>
            </div>
        </div>
    `;
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
    return typingId;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ==========================================
// handleSendChatMessage - チャットメッセージ送信
// ==========================================
window.handleSendChatMessage = async function (event) {
    event.preventDefault();
    const input = document.getElementById("chatInput");
    if (!input) return;
    const messageText = input.value.trim();
    if (!messageText) return;

    input.value = "";
    appendChatBubble("user", messageText);

    const prefSelect = document.getElementById("chatPrefecture");
    let apiMessageText = messageText;
    if (prefSelect && prefSelect.value !== "all") {
        const prefVal = prefSelect.value;
        if (!messageText.includes(prefVal)) {
            apiMessageText = `${prefVal} ${messageText}`;
        }
    }

    if (messageText.includes("プラン作成") || messageText.includes("プランを作って") || messageText.includes("プランを立てて") || messageText.includes("プラン生成")) {
        if (activePlanTarget === null || activePlanTarget === undefined) {
            appendChatBubble("ai", "プランを作成するために、まずは気になるスポットを選択して目的地に設定してください！");
            return;
        }
        generateTravelPlan(event);
        return;
    }
    const typingId = appendTypingIndicator();

    try {
        const labels = ["温泉・癒やし", "自然・景観", "歴史・文化", "グルメ", "アクティビティ", "都市・ショッピング"];
        const prefStatsStr = standStats.map((val, idx) => `${labels[idx]}: ${val}%`).join(", ");
        const standName = document.getElementById("standName")?.textContent || "トラベラー・スター";
        const standRank = document.getElementById("standRank")?.textContent || "";

        let fullPrompt = "";

        if (chatEditMode && plans.length > 0) {
            const targetPlan = plans[plans.length - 1];
            fullPrompt = `あなたは旅行プランの編集AIです。以下のプランをユーザーの指示に従って書き換えてください。

【現在のプラン】
目的地: ${targetPlan.destination} (${targetPlan.prefecture})
日程: ${targetPlan.date}〜 ${targetPlan.nights}泊${targetPlan.nights + 1}日
人数: ${targetPlan.people}名
予算: ${targetPlan.budget.toLocaleString()}円
現在の行程テキスト:
${targetPlan.itineraryText}

【ルール】
- ユーザーの指示に従い行程テキストを書き換える
- 提案された地域または日本全国のスポットを提案すること
- 返答は必ず以下のJSON形式のみで返すこと：
{"message": "変更内容の説明（50文字以内）", "updatedItinerary": "書き換え後の行程テキスト全文"}

ユーザーの指示: ${apiMessageText}`;
        } else {
            fullPrompt = `ユーザー名: ${userName}
旅行の好みパラメータ: ${prefStatsStr}
旅行スタンド: ${standName} (${standRank})

あなたは旅行プランナーのAI相談員です。日本全国47都道府県のスポットを提案してください。回答は100〜150文字程度で簡潔に。

ユーザーからの相談: ${apiMessageText}`;
        }

        chatHistory.push({ role: "user", parts: [{ text: fullPrompt }] });

        const chatUrl = getApiUrl("/api/travel/generate");
        const data = await safeFetchJson(chatUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: chatHistory })
        });

        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "申し訳ありません、お答えを生成できませんでした。";
        chatHistory.push({ role: "model", parts: [{ text: replyText }] });

        removeTypingIndicator(typingId);

        if (chatEditMode && plans.length > 0) {
            try {
                const clean = replyText.replace(/```json|```/g, "").trim();
                const parsed = JSON.parse(clean);
                appendChatBubble("ai", parsed.message || "プランを更新しました！");
                plans[plans.length - 1].itineraryText = parsed.updatedItinerary;
                saveToStorage();
                const planTextEl = document.getElementById("aiPlanText");
                if (planTextEl) planTextEl.innerHTML = formatItineraryHtml(parsed.updatedItinerary);
                showToast("✏️ プランを更新しました！");
            } catch (e) {
                appendChatBubble("ai", replyText);
            }
        } else {
            appendChatBubble("ai", replyText);
        }

    } catch (error) {
        removeTypingIndicator(typingId);
        let errorMsg = "⚠️ メッセージの送信に失敗しました。";
        if (error.message?.includes("429")) {
            errorMsg = "⚠️ 本日のAIチャット利用上限に達しました。";
        }
        appendChatBubble("ai", errorMsg);
        console.error("Chat message send error:", error);
    }
};

// ==========================================
// 15. New Custom Helper Functions
// ==========================================
window.filterByCategory = function (category) {
    document.querySelectorAll("#categoryFilterRow .filter-btn").forEach(el => {
        if (el.getAttribute("data-category") === category) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
    });
    activeFilters.category = category;
    applyFilters();
};

window.resetAllFilters = function () {
    const prefSelect = document.getElementById("filterPrefecture");
    const seasonSelect = document.getElementById("filterSeason");
    if (prefSelect) prefSelect.value = "all";
    if (seasonSelect) seasonSelect.value = "all";
    document.querySelectorAll("#categoryFilterRow .filter-btn").forEach(el => el.classList.remove("active"));
    const allPill = document.querySelector("#categoryFilterRow .filter-btn[data-category='all']");
    if (allPill) allPill.classList.add("active");
    activeFilters.category = "all";
    activeFilters.season = "all";
    activeFilters.prefecture = "all";
    applyFilters();
};

window.toggleTagDropdown = function() {
    const row = document.getElementById("categoryFilterRow");
    if (!row) return;
    row.style.display = row.style.display === "none" || row.style.display === "" ? "flex" : "none";
};

window.renderSavedSpotsHome = function () {
    const scrollContainer = document.getElementById("savedSpotsScroll");
    if (!scrollContainer) return;
    scrollContainer.innerHTML = "";

    if (likes.length === 0) {
        scrollContainer.innerHTML = `
            <div class="saved-spots-empty">
                <span class="material-icons saved-spots-empty-icon">bookmark_border</span>
                保存したスポットはまだありません。<br>「探す」タブでスワイプして保存しましょう！
                <button class="btn-primary" onclick="switchView('swipe')">スポットを探す</button>
            </div>
        `;
        return;
    }

    likes.forEach(item => {
        const isStarred = favorites.some(f => f.id === item.id);
        const card = document.createElement("div");
        card.className = "saved-spot-thumbnail-card";
        card.setAttribute("data-id", item.id);
        const safeName = escapeHTML(item.name);
        const safePref = escapeHTML(item.prefecture);
        const safeImg = escapeHTML(item.img || NO_IMAGE_URL);
        card.innerHTML = `
                <img src="${safeImg}" alt="${safeName}" onerror="this.onerror=null;this.src='${NO_IMAGE_URL}'">
                <div class="thumbnail-overlay"></div>
                <span class="thumbnail-pref">📍 ${safePref}</span>
                <h4 class="thumbnail-name">${getDisplayName(item.name)}</h4>
                <button class="thumbnail-star-btn ${isStarred ? 'starred' : ''}" onclick="toggleFavoriteFromHome(this, event, ${item.id})">
                    <span class="material-icons star-icon">${isStarred ? 'star' : 'star_border'}</span>
                </button>
                <button class="thumbnail-sim3d-btn" title="3Dルートシミュレーション">
                    <span class="material-icons" style="font-size:1rem;">route</span>
                </button>
            `;
        card.querySelector(".thumbnail-overlay").addEventListener("click", () => selectPlanAndGo(item));
        card.querySelector(".thumbnail-name").addEventListener("click", () => selectPlanAndGo(item));
        card.querySelector(".thumbnail-pref").addEventListener("click", () => selectPlanAndGo(item));
        card.querySelector(".thumbnail-sim3d-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            open3DRouteSimulation({ destination: item.name, lat: item.lat, lon: item.lon });
        });
        card.dataset.placeName = item.name;
        imageObserver.observe(card);
        scrollContainer.appendChild(card);
    });

    if (window.Sortable && !scrollContainer._sortable) {
        scrollContainer._sortable = new Sortable(scrollContainer, {
            animation: 150,
            onEnd: function () {
                const newLikes = [];
                scrollContainer.querySelectorAll(".saved-spot-thumbnail-card").forEach(el => {
                    const id = parseInt(el.getAttribute("data-id"));
                    const item = likes.find(p => p.id === id);
                    if (item) {
                        newLikes.push(item);
                    }
                });
                likes = newLikes;
                saveToStorage();
            }
        });
    }
};
window.toggleFavoriteFromHome = function (starBtn, event, id) {
    event.stopPropagation();
    const item = kinkiPlaces.find(p => p.id === id);
    const starIcon = starBtn.querySelector('.star-icon');
    const index = favorites.findIndex(f => f.id === id);

    if (index > -1) {
        favorites.splice(index, 1);
        starBtn.classList.remove("starred");
        if (starIcon) starIcon.textContent = "star_border";
        showToast("お気に入りから削除しました。");
    } else {
        favorites.push(item);
        starBtn.classList.add("starred");
        if (starIcon) starIcon.textContent = "star";
        showToast("お気に入りに追加しました！⭐");

        // Ensure starred item is also in Saved Spots (likes)
        if (!likes.some(l => l.id === id)) {
            likes.push(item);
        }
    }
    saveToStorage();
    updateGridCounts();
    renderSavedSpotsHome();
};

window.selectPlanAndGo = function (item) {
    switchView("plan");
    renderLikedList();
    selectPlanTarget(item, null);
};

const HOME_PLANS_INITIAL_COUNT = 3;

window.renderHomePlans = function () {
    const plansContainer = document.getElementById("homePlansList");
    const plansSection = document.getElementById("homePlansSection");
    if (!plansContainer) return;

    plansContainer.innerHTML = "";

    if (plans.length === 0) {
        if (plansSection) plansSection.classList.add("hidden");
        return;
    }

    if (plansSection) plansSection.classList.remove("hidden");

    // 現在の展開状態を保持
    const isExpanded = plansContainer.dataset.expanded === "true";
    const displayPlans = isExpanded ? plans : plans.slice(0, HOME_PLANS_INITIAL_COUNT);

    displayPlans.forEach(plan => {
        const card = document.createElement("div");
        card.className = "home-plan-item";

        card.innerHTML = `
            <div class="home-plan-item-info" style="cursor:pointer; flex:1; min-width:0;">
                <span class="home-plan-dest">📅 ${plan.destination} の旅</span>
                <span class="home-plan-date">出発日: ${plan.date} | ${plan.nights}泊${plan.nights + 1}日 | ${plan.people}名</span>
            </div>
            <button class="sim3d-launch-mini-btn" title="3Dルートシミュレーション">
                <span class="material-icons" style="font-size:1.1rem;">route</span>
            </button>
            <button class="home-plan-delete-btn" title="この予定を削除" onclick="deleteHomePlan(event, ${plan.id})">
                <span class="material-icons">delete_outline</span>
            </button>
            <span class="material-icons arrow-icon" style="cursor:pointer;">chevron_right</span>
        `;

        card.querySelector(".sim3d-launch-mini-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            open3DRouteSimulation(plan);
        });
        card.querySelector(".home-plan-item-info").addEventListener("click", () => viewItineraryDetails(plan.id));
        card.querySelector(".arrow-icon").addEventListener("click", () => viewItineraryDetails(plan.id));

        plansContainer.appendChild(card);
    });

    // 3件超えている場合は「もっと見る / 折りたたむ」ボタンを追加
    if (plans.length > HOME_PLANS_INITIAL_COUNT) {
        const remaining = plans.length - HOME_PLANS_INITIAL_COUNT;
        const toggleBtn = document.createElement("button");
        toggleBtn.className = `home-plans-toggle-btn${isExpanded ? " expanded" : ""}`;
        toggleBtn.innerHTML = isExpanded
            ? `<span class="material-icons">expand_less</span> 折りたたむ`
            : `<span class="material-icons">expand_more</span> あと${remaining}件を見る`;

        toggleBtn.addEventListener("click", () => {
            plansContainer.dataset.expanded = isExpanded ? "false" : "true";
            renderHomePlans();
        });
        plansContainer.appendChild(toggleBtn);
    }
};

window.deleteHomePlan = function (event, planId) {
    event.stopPropagation();
    const index = plans.findIndex(p => p.id === planId);
    if (index === -1) return;

    const planName = plans[index].destination;
    plans.splice(index, 1);
    saveToStorage();
    updateGridCounts();
    updateCountdown();
    showToast(`「${planName} の旅」を削除しました。`);
};

window.handleHomeCta = function () {
    if (likes.length > 0) {
        switchView("plan");
    } else {
        const user = auth.currentUser;
        if (user && !user.isAnonymous) {
            openChatDrawer();
        } else {
            switchView("swipe");
        }
    }
};

// ==========================================
// AI 先回り自動提案機能の実装
// ==========================================
function generateProactiveItineraryText(title, spots, companion, transport, budget) {
    const dates = new Date();
    dates.setDate(dates.getDate() + 7); // デフォルトで来週
    const dateStr = dates.toISOString().split('T')[0];

    let text = `【AI先回り提案】${title}\n`;
    text += `📅 日程: ${dateStr} 〜 | 👥 人数: 2名様 | 💰 予算目安: ${budget}\n`;
    text += `🚗 移動手段: ${transport}\n\n`;
    text += `--- 🗺️ 行程スケジュール提案 ---\n`;

    if (spots.length === 1) {
        const s = spots[0];
        text += `■ 1日目 (日帰り):\n`;
        text += `  ・10:00: 各地より出発、${transport === "自家用車" ? "お車にて" : "公共交通機関を乗り継ぎ"}「${s.name}」へ移動。\n`;
        text += `  ・11:30: 「${s.name}」に到着。周辺の歴史ある景色を歩いて満喫します。\n`;
        text += `  ・13:00: 地元の名店にて特製の郷土料理ランチ。\n`;
        text += `  ・15:00: 周辺をお土産購入や散策でのんびり堪能。\n`;
        text += `  ・17:00: 帰路へ。お疲れ様でした！`;
    } else {
        const s1 = spots[0];
        const s2 = spots[1];
        text += `■ 1日目 (日帰り):\n`;
        text += `  ・09:30: 各地より出発。「${s1.name}」に向けて出発。\n`;
        text += `  ・10:30: 「${s1.name}」にて自然豊かなスポットを散策。\n`;
        text += `  ・12:00: ${s1.prefecture}の郷土料理や話題のランチを堪能。\n`;
        text += `  ・13:30: ${transport === "自家用車" ? "お車にて快適なドライブ" : "公共交通機関"}にて「${s2.name}」へ移動。\n`;
        text += `  ・14:30: 「${s2.name}」に到着し、美しい景色や体験を楽しみます。\n`;
        text += `  ・17:00: お土産を購入して思い出を語り合いながら帰路へ。`;
    }
    return text;
}

window.renderProactiveSuggestions = function () {
    const container = document.getElementById("proactiveSuggestionsList");
    if (!container) return;
    container.innerHTML = "";

    currentSuggestions = [];

    // 1. いいねリストのチェック
    let candidates = [];
    if (likes.length > 0) {
        let unusedLikes = likes.filter(l => !dismissedSuggestions.includes(l.name));

        if (unusedLikes.length > 0) {
            // 府県でグルーピング
            let byPref = {};
            unusedLikes.forEach(l => {
                if (!byPref[l.prefecture]) byPref[l.prefecture] = [];
                byPref[l.prefecture].push(l);
            });

            // 府県別のルート提案
            Object.entries(byPref).forEach(([pref, spots]) => {
                if (spots.length >= 2) {
                    candidates.push({
                        title: `${pref}の絶景と魅力をめぐる1日満喫旅`,
                        spots: [spots[0], spots[1]],
                        prefecture: pref,
                        season: spots[0].season,
                        companion: detailedPrefs.companion ? Object.entries(detailedPrefs.companion).sort((a, b) => b[1] - a[1])[0][0] : "カップル",
                        budget: detailedPrefs.budget ? Object.entries(detailedPrefs.budget).sort((a, b) => b[1] - a[1])[0][0] : "スタンダード",
                        transport: detailedPrefs.transport ? Object.entries(detailedPrefs.transport).sort((a, b) => b[1] - a[1])[0][0] : "公共交通機関",
                        purpose: detailedPrefs.purpose ? Object.entries(detailedPrefs.purpose).sort((a, b) => b[1] - a[1])[0][0] : "リフレッシュ"
                    });
                } else if (spots.length === 1) {
                    // 同府県の他スポットを探す
                    let otherSpot = kinkiPlaces.find(p => p.prefecture === pref && p.id !== spots[0].id && !dismissedSuggestions.includes(p.name));
                    if (otherSpot) {
                        candidates.push({
                            title: `${spots[0].name}と${otherSpot.name}を巡る ${pref}満喫プラン`,
                            spots: [spots[0], otherSpot],
                            prefecture: pref,
                            season: spots[0].season,
                            companion: detailedPrefs.companion ? Object.entries(detailedPrefs.companion).sort((a, b) => b[1] - a[1])[0][0] : "カップル",
                            budget: detailedPrefs.budget ? Object.entries(detailedPrefs.budget).sort((a, b) => b[1] - a[1])[0][0] : "スタンダード",
                            transport: detailedPrefs.transport ? Object.entries(detailedPrefs.transport).sort((a, b) => b[1] - a[1])[0][0] : "公共交通機関",
                            purpose: detailedPrefs.purpose ? Object.entries(detailedPrefs.purpose).sort((a, b) => b[1] - a[1])[0][0] : "リフレッシュ"
                        });
                    } else {
                        // 単一スポットでの提案
                        candidates.push({
                            title: `ゆっくり巡る ${spots[0].name}日帰りリフレッシュ旅`,
                            spots: [spots[0]],
                            prefecture: pref,
                            season: spots[0].season,
                            companion: detailedPrefs.companion ? Object.entries(detailedPrefs.companion).sort((a, b) => b[1] - a[1])[0][0] : "一人旅",
                            budget: detailedPrefs.budget ? Object.entries(detailedPrefs.budget).sort((a, b) => b[1] - a[1])[0][0] : "スタンダード",
                            transport: detailedPrefs.transport ? Object.entries(detailedPrefs.transport).sort((a, b) => b[1] - a[1])[0][0] : "公共交通機関",
                            purpose: detailedPrefs.purpose ? Object.entries(detailedPrefs.purpose).sort((a, b) => b[1] - a[1])[0][0] : "リフレッシュ"
                        });
                    }
                }
            });
        }
    }

    // 候補が足りない（またはいいねが無い）場合、デフォルトの人気提案を追加
    if (candidates.length < 2) {
        let defaultPairs = [
            {
                title: "【AI推奨】秋の京都歴史・自然巡り周遊ルート",
                spots: [kinkiPlaces[0], kinkiPlaces[11]], // 清水寺 & 伏見稲荷
                prefecture: "京都",
                season: "秋",
                companion: "カップル",
                budget: "スタンダード",
                transport: "公共交通機関",
                purpose: "歴史探訪"
            },
            {
                title: "【AI推奨】有馬温泉と六甲山絶景ドライブ",
                spots: [kinkiPlaces[1], kinkiPlaces[25]], // 有馬温泉 & 六甲山テラス
                prefecture: "兵庫",
                season: "冬",
                companion: "カップル",
                budget: "スタンダード",
                transport: "自家用車",
                purpose: "リフレッシュ"
            }
        ];

        defaultPairs.forEach(p => {
            const keyName = p.spots.map(s => s.name).join("-");
            if (!dismissedSuggestions.includes(keyName) && candidates.length < 2) {
                candidates.push(p);
            }
        });
    }

    // 候補の表示 (最大2件)
    let displayList = candidates.slice(0, 2);
    if (displayList.length === 0) {
        container.innerHTML = `<div class="modal-empty">現在、ご提案できる自動提案ルートがありません。</div>`;
        return;
    }

    displayList.forEach((sug, index) => {
        const sugId = index + 1;
        sug.id = sugId;
        currentSuggestions.push(sug);

        // タイムライン
        let timelineHTML = "";
        if (sug.spots.length === 1) {
            const sName = escapeHTML(sug.spots[0].name);
            timelineHTML = `
                ・10:00 - 出発して「${sName}」へ移動<br>
                ・11:30 - 「${sName}」到着＆観光<br>
                ・13:00 - 周辺の特産ランチ＆カフェ散策
            `;
        } else {
            const s1Name = escapeHTML(sug.spots[0].name);
            const s2Name = escapeHTML(sug.spots[1].name);
            timelineHTML = `
                ・09:30 - 出発して「${s1Name}」を観光<br>
                ・12:00 - 地元の名物ランチを堪能<br>
                ・13:30 - 「${s2Name}」へ移動＆散策
            `;
        }

        const isDefault = likes.length === 0;
        const safeTitle = escapeHTML(sug.title);
        const safeCompanion = escapeHTML(sug.companion);
        const safeTransport = escapeHTML(sug.transport);
        const safeBudget = escapeHTML(sug.budget);

        const card = document.createElement("div");
        card.className = "proactive-suggestion-card";
        card.setAttribute("id", `proactive-sug-${sugId}`);
        card.innerHTML = `
            <div class="sug-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="sug-tag-badge" style="background: rgba(var(--primary-color-rgb), 0.1); color: var(--primary-color); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">✨ AI先回り自動提案</span>
                ${getSugSeasonBadgeHtml(sug.season)}
            </div>
            
            <h4 class="sug-title" style="font-size: 1.05rem; font-weight: 800; margin-bottom: 12px; color: var(--text-color);">${safeTitle}</h4>
            
            <div class="sug-spots" style="display: flex; align-items: center; gap: 8px; background: var(--item-bg); padding: 10px; border-radius: 12px; margin-bottom: 10px;">
                ${sug.spots.map((spot, idx) => `
                    ${idx > 0 ? '<span class="sug-arrow" style="color: var(--text-muted); font-weight: bold;">➔</span>' : ''}
                    <div class="sug-spot-item" style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; color: var(--text-color);">
                        <img src="${escapeHTML(spot.img || NO_IMAGE_URL)}" class="sug-thumb" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;" alt="${escapeHTML(spot.name)}" onerror="this.onerror=null;this.src='${NO_IMAGE_URL}'">
                        <span>${escapeHTML(spot.name)}</span>
                    </div>
                `).join("")}
            </div>

            <div class="sug-meta" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
                <span style="font-size: 0.7rem; background: rgba(0,0,0,0.04); color: var(--text-muted); padding: 2px 8px; border-radius: 6px; font-weight: 600;">👥 ${safeCompanion}</span>
                <span style="font-size: 0.7rem; background: rgba(0,0,0,0.04); color: var(--text-muted); padding: 2px 8px; border-radius: 6px; font-weight: 600;">🚗 ${safeTransport}</span>
                <span style="font-size: 0.7rem; background: rgba(0,0,0,0.04); color: var(--text-muted); padding: 2px 8px; border-radius: 6px; font-weight: 600;">💰 ${safeBudget}</span>
            </div>

            <div class="sug-itinerary-preview" style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; border-left: 3px solid var(--border-color); padding-left: 8px; margin-bottom: 14px;">
                <strong>【行程のタイムライン案】</strong><br>
                ${timelineHTML}
            </div>

            ${isDefault ? `<div style="font-size: 0.7rem; color: var(--accent-anmari); margin-bottom: 10px; font-weight: bold;">※ いいねしたスポットが空のため、人気の組み合わせを表示しています。</div>` : ""}

            <div class="sug-actions" style="display: flex; gap: 8px;">
                <button class="btn-sug btn-adopt" onclick="adoptProactiveSuggestion(${sugId})" style="flex: 1.2; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 8px 12px; border-radius: 20px; border: none; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; background: var(--primary-color); color: white;">
                    <span class="material-icons" style="font-size: 0.95rem;">thumb_up</span> 採用する
                </button>
                <button class="btn-sug btn-edit" onclick="editProactiveSuggestion(${sugId})" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 8px 12px; border-radius: 20px; border: 1px solid var(--border-color); font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; background: var(--bg-color); color: var(--text-color);">
                    <span class="material-icons" style="font-size: 0.95rem;">edit</span> 編集
                </button>
                <button class="btn-sug btn-reject" onclick="rejectProactiveSuggestion(${sugId})" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 8px 12px; border-radius: 20px; border: none; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; background: rgba(239, 68, 68, 0.08); color: var(--accent-error);">
                    <span class="material-icons" style="font-size: 0.95rem;">close</span> 却下
                </button>
            </div>
        `;
        container.appendChild(card);
    });
};

window.adoptProactiveSuggestion = function (sugId) {
    const sug = currentSuggestions.find(s => s.id === sugId);
    if (!sug) return;

    const itineraryText = generateProactiveItineraryText(sug.title, sug.spots, sug.companion, sug.transport, sug.budget);

    const dates = new Date();
    dates.setDate(dates.getDate() + 7);
    const dateStr = dates.toISOString().split('T')[0];

    const budgetVal = sug.budget === "低予算" ? 30000 : sug.budget === "ラグジュアリー" ? 100000 : 50000;

    const planObj = {
        id: Date.now(),
        destination: sug.spots[0].name,
        prefecture: sug.prefecture,
        date: dateStr,
        nights: 1,
        people: 2,
        budget: budgetVal,
        lat: sug.spots[0].lat,
        lon: sug.spots[0].lon,
        itineraryText: itineraryText
    };

    plans.push(planObj);
    saveToStorage();

    showToast(`📅 プラン「${sug.title}」を予定に追加しました！`);

    updateCountdown();
    updateGridCounts();
    calculateStandStats();

    setTimeout(() => {
        switchView("home");
    }, 500);
};

window.editProactiveSuggestion = function (sugId) {
    const sug = currentSuggestions.find(s => s.id === sugId);
    if (!sug) return;

    const spot = sug.spots[0];
    activePlanTarget = spot;

    // いいねリストで選択
    document.querySelectorAll(".liked-item").forEach(i => {
        if (i.getAttribute("data-id") == spot.id) {
            i.classList.add("selected");
        } else {
            i.classList.remove("selected");
        }
    });

    const proactiveView = document.getElementById("aiProactiveView");
    if (proactiveView) proactiveView.classList.add("hidden");
    const form = document.getElementById("planForm");
    if (form) form.classList.remove("hidden");

    const dates = new Date();
    dates.setDate(dates.getDate() + 7);
    const dateStr = dates.toISOString().split('T')[0];

    document.getElementById("planDate").value = dateStr;
    document.getElementById("planNights").value = "1";
    document.getElementById("planPeople").value = "2";

    const budgetVal = sug.budget === "低予算" ? "30000" : sug.budget === "ラグジュアリー" ? "100000" : "50000";
    document.getElementById("planBudget").value = budgetVal;

    document.getElementById("planTargetName").innerHTML = `<span class="material-icons" style="vertical-align: middle; color: var(--primary-color);">location_on</span> <span class="place-name" data-original-name="${spot.name}">${getDisplayName(spot.name)}</span> 行き旅行プラン設定`;
    document.getElementById("planOthers").value = "AI先回り提案をカスタマイズ中";

    document.querySelectorAll("#priorityPills .priority-pill").forEach(p => {
        p.classList.remove("active");
    });
    const firstPill = document.querySelector(`#priorityPills .priority-pill[data-val="自然・癒やし"]`);
    if (firstPill) firstPill.classList.add("active");

    currentPriority = ["自然・癒やし"];

    showToast("✏️ 提案ルートの編集設定をプリセットしました。");
};

window.rejectProactiveSuggestion = function (sugId) {
    const sug = currentSuggestions.find(s => s.id === sugId);
    if (!sug) return;

    if (likes.length > 0) {
        sug.spots.forEach(s => {
            dismissedSuggestions.push(s.name);
        });
    } else {
        const keyName = sug.spots.map(s => s.name).join("-");
        dismissedSuggestions.push(keyName);
    }

    const cardEl = document.getElementById(`proactive-sug-${sugId}`);
    if (cardEl) {
        cardEl.style.transition = "transform 0.3s ease, opacity 0.3s ease";
        cardEl.style.transform = "scale(0.9) translateY(10px)";
        cardEl.style.opacity = "0";
        setTimeout(() => {
            cardEl.remove();
            renderProactiveSuggestions();
        }, 300);
    } else {
        renderProactiveSuggestions();
    }

    showToast("😐 提案ルートを却下しました。");
};

const filterPref = document.getElementById("filterPrefecture");
const chatPref = document.getElementById("chatPrefecture");
if (filterPref && chatPref) {
    filterPref.addEventListener("change", () => {
        chatPref.value = filterPref.value;
    });
    chatPref.addEventListener("change", () => {
        filterPref.value = chatPref.value;
        applyFilters();
    });
}

// ==========================================
// 15. アプリ起動時の初期スポット読み込み
// ==========================================
window.loadInitialSpot = function () {
    const prefSelect = document.getElementById("filterPrefecture");
    if (prefSelect) {
        prefSelect.value = "北海道";
    }
    const chatPrefSelect = document.getElementById("chatPrefecture");
    if (chatPrefSelect) {
        chatPrefSelect.value = "北海道";
    }
    activeFilters.prefecture = "北海道";

    // アプリ起動時に探す（スワイプ）画面を表示
    if (typeof switchView === "function") {
        const swipeNav = document.querySelector(".sidebar-item:nth-child(2)");
        switchView("swipe", swipeNav);
    }

    // フィルタを適用してモックデータの「小樽運河」をスポットカードに表示
    applyFilters();
};

// DOMContentLoaded イベントで初期スポット読み込みを実行
if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", () => {
        loadInitialSpot();
    });
} else {
    loadInitialSpot();
}