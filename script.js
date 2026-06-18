// ==========================================
// 1. 観光スポットデータ定義 (近畿地方限定)
// ==========================================
const kinkiPlaces = [
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
        lon: 135.7850
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
        lon: 135.2474
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
        lon: 135.5013
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
        lon: 135.8430
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
        lon: 136.0157
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
        lon: 135.8878
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
        lon: 134.6939
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
        lon: 135.6721
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
        lon: 135.3435
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
        lon: 135.8410
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
        lon: 135.5068
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
        lon: 135.7727
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
        lon: 134.8292
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
        lon: 135.8705
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
        lon: 135.5847
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
        lon: 136.1044
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
        lon: 135.1917
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
        lon: 136.2518
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
        lon: 135.3769
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
        lon: 135.8841
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
        lon: 135.5262
    },
    {
        id: 21,
        name: "法隆寺",
        prefecture: "奈良",
        season: "秋",
        category: "history",
        description: "世界最古の木造建築群を有する世界遺産。聖徳太子ゆかり of 寺で、五重塔をはじめ数々の国宝や仏教美術が安置されています。",
        img: "https://images.unsplash.com/photo-1578436127897-769e1b3f0f36?w=500&auto=format&fit=crop",
        tags: ["歴史", "観光", "リラックス"],
        lat: 34.6141,
        lon: 135.7356
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
        lon: 134.8109
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
        lon: 135.6776
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
        lon: 135.8953
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
        lon: 135.2631
    }
];

// ==========================================
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
    ]
};

// ==========================================
// 3. アプリの状態管理 (Local Storage 連携)
// ==========================================
let likes = JSON.parse(localStorage.getItem("kw_likes")) || [];
let anmaris = JSON.parse(localStorage.getItem("kw_anmaris")) || [];
let favorites = JSON.parse(localStorage.getItem("kw_favorites")) || [];
let plans = JSON.parse(localStorage.getItem("kw_plans")) || [];

// アカウント・UI設定の読み込み
let userName = localStorage.getItem("kw_username") || "トラベラー";
let userAvatar = localStorage.getItem("kw_avatar") || "traveler";
let headerTitle = localStorage.getItem("kw_headertitle") || "Kinki Wander";
let currentTheme = localStorage.getItem("kw_theme") || "mc-blue";
let currentFontSize = localStorage.getItem("kw_fontsize") || "100";
let currentLanguage = localStorage.getItem("kw_lang") || "ja";
let rakutenAppId = (localStorage.getItem("kw_rakuten_appid") || "").trim();
let geminiApiKey = (localStorage.getItem("kw_gemini_apikey") || "").trim();

// カード関連の一時状態
let activeFilters = { season: "all", category: "all" };
let currentCardPool = [];
let nextPoolIndex = 0;
let isDragging = false;
let activePlanTarget = null;
let currentPriority = ["グルメ"];

// ==========================================
// 4. 初期化処理 (アプリ起動時)
// ==========================================
window.onload = function () {
    initApp();
};

function initApp() {
    // UIの設定反映
    applyTheme(currentTheme);
    applyFontSize(currentFontSize);
    applyAccountSettings();
    document.getElementById("textSizeSlider").value = currentFontSize;
    document.getElementById("settingsUsername").value = userName;
    document.getElementById("settingsHeaderTitle").value = headerTitle;
    document.getElementById("settingsLang").value = currentLanguage;

    const rakutenInput = document.getElementById("settingsRakutenAppId");
    if (rakutenInput) rakutenInput.value = rakutenAppId;

    const geminiInput = document.getElementById("settingsGeminiApiKey");
    if (geminiInput) geminiInput.value = geminiApiKey;

    // テーマボタンのアクティブ表示同期
    document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
    if (currentTheme === "mc-blue") document.getElementById("btnThemeMcBlue")?.classList.add("active");
    if (currentTheme === "mc-emerald") document.getElementById("btnThemeMcEmerald")?.classList.add("active");
    if (currentTheme === "mc-amber") document.getElementById("btnThemeMcAmber")?.classList.add("active");
    if (currentTheme === "mc-dark") document.getElementById("btnThemeMcDark")?.classList.add("active");

    // 「あんまり」リストの自動削除 (15日経過したものをパージ)
    purgeOldAnmaris();

    // 検索カードプールの準備
    applyFilters();

    // ホームカウントの表示
    updateGridCounts();
    updateCountdown();
    simulateWeather();

    // スライダーの動作
    startSliderAuto();
    initSliderSwipe();

    // チャート表示の更新
    updateChart();
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
    localStorage.setItem("kw_rakuten_appid", rakutenAppId);
    localStorage.setItem("kw_gemini_apikey", geminiApiKey);
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
            if (viewId === "data" && labelText.includes("データ")) item.classList.add("active");
            if (viewId === "settings" && labelText.includes("設定")) item.classList.add("active");
        });
    }

    // 各画面特有の更新トリガー
    if (viewId === "data") updateChart();
    if (viewId === "home") {
        updateGridCounts();
        updateCountdown();
        simulateWeather();
    }
    if (viewId === "plan") {
        renderLikedList();
    }

    // モバイル用サイドバーを閉じる
    const sidebar = document.getElementById("appSidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        overlay.classList.remove("open");
    }
};

// Toast通知表示
function showToast(message) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span class="material-icons" style="font-size: 1.2rem; color: var(--primary-color);">info</span><span>${message}</span>`;
    container.appendChild(toast);

    // 3秒後にフェードアウトして削除
    setTimeout(() => {
        toast.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ==========================================
// 6. 検索機能 (スワイプ & プリフェッチ)
// ==========================================
window.applyFilters = function () {
    const seasonSelect = document.getElementById("filterSeason");
    const catSelect = document.getElementById("filterCategory");

    activeFilters.season = seasonSelect ? seasonSelect.value : "all";
    activeFilters.category = catSelect ? catSelect.value : "all";

    // フィルタ条件に合致するスポットプールを作成
    currentCardPool = kinkiPlaces.filter(place => {
        const matchSeason = (activeFilters.season === "all" || place.season === activeFilters.season);
        const matchCat = (activeFilters.category === "all" || place.category === activeFilters.category);

        // すでに「いいね」または「あんまり」に入っているものは除く (リセットされない限り)
        const isAlreadySelected = likes.some(l => l.id === place.id) || anmaris.some(a => a.id === place.id);

        return matchSeason && matchCat && !isAlreadySelected;
    });

    nextPoolIndex = 0;
    renderStack();
};

function renderStack() {
    const stack = document.getElementById("card-stack");
    const container = document.getElementById("swipeActionsContainer");
    stack.innerHTML = "";

    if (currentCardPool.length === 0) {
        if (container) container.classList.add("hidden");
        stack.innerHTML = `
            <div class="empty-stack-view">
                <span class="material-icons empty-icon">sentiment_dissatisfied</span>
                <h3>該当する観光スポットがありません</h3>
                <p>フィルター条件を緩めるか、AIを使って新しく観光地を生成してみましょう！</p>
                <div class="empty-stack-view-actions">
                    <button class="btn-primary" onclick="generatePlacesWithAI()">✨ AIで観光スポットを増やす</button>
                    <button class="btn-primary" style="background-color: var(--text-muted); opacity: 0.8;" onclick="resetSwipeHistory()">履歴をリセットしてやり直す</button>
                </div>
            </div>
        `;
        return;
    }

    if (container) container.classList.remove("hidden");

    // 最初のカードと、バックグラウンドでのプリフェッチカード(最大3枚)をDOMに追加
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
    // 現在表示中のカードの後ろに控えているカードの画像をブラウザにキャッシュさせる
    if (currentCardPool.length > 1) {
        const prefetchCount = Math.min(3, currentCardPool.length);
        for (let i = 1; i < prefetchCount; i++) {
            const imgUrl = currentCardPool[i].img;
            const img = new Image();
            img.src = imgUrl;
        }
    }
}

function createCardElement(data, isTopCard) {
    const card = document.createElement("div");
    card.className = "swipe-card";
    // 表示優先順位の設定
    card.style.zIndex = isTopCard ? 5 : 1;
    if (!isTopCard) {
        card.style.transform = "scale(0.95) translateY(10px)";
        card.style.pointerEvents = "none";
    }

    const isStarred = favorites.some(f => f.id === data.id);

    card.innerHTML = `
        <div class="card-img-container">
            <img src="${data.img}" class="card-img" alt="${data.name}">
            <span class="card-prefecture-badge">📍 ${data.prefecture}</span>
            <span class="card-season-badge">🍂 ${data.season}おすすめ</span>
            <div class="swipe-stamp stamp-like">いいね</div>
            <div class="swipe-stamp stamp-anmari">あんまり</div>
        </div>
        <button class="card-star-btn ${isStarred ? 'starred' : ''}" onclick="toggleFavorite(this, event, ${data.id})"><span class="material-icons-outlined star-icon">${isStarred ? 'star' : 'star_border'}</span></button>
        <div class="card-info">
            <h3>${data.name}</h3>
            <p>${data.description}</p>
        </div>
    `;

    if (isTopCard) {
        initCardDrag(card, data);
        prefetchNextImages();
    }

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
        favorites.push(item);
        starBtn.classList.add("starred");
        if (starIcon) starIcon.textContent = "star";
        showToast("お気に入りに追加しました！⭐");
    }
    saveToStorage();
    updateGridCounts();
};

function initCardDrag(card, data) {
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    const stampLike = card.querySelector(".stamp-like");
    const stampAnmari = card.querySelector(".stamp-anmari");

    card.addEventListener("pointerdown", e => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        card.style.transition = "none";
        card.setPointerCapture(e.pointerId);
    });

    card.addEventListener("pointermove", e => {
        if (!isDragging) return;
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;

        // 傾きと回転
        const rotate = currentX * 0.08;
        card.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${rotate}deg)`;

        // スワイプスタンプの透明度コントロール
        if (currentX > 30) {
            const opacity = Math.min(1, (currentX - 30) / 100);
            stampLike.style.opacity = opacity;
            stampAnmari.style.opacity = 0;
        } else if (currentX < -30) {
            const opacity = Math.min(1, (-currentX - 30) / 100);
            stampAnmari.style.opacity = opacity;
            stampLike.style.opacity = 0;
        } else {
            stampLike.style.opacity = 0;
            stampAnmari.style.opacity = 0;
        }
    });

    card.addEventListener("pointerup", e => {
        if (!isDragging) return;
        isDragging = false;

        // スワイプ判定 (120px以上移動)
        if (Math.abs(currentX) > 130) {
            const dir = currentX > 0 ? "like" : "anmari";
            card.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease";
            card.style.transform = `translate3d(${currentX > 0 ? 1000 : -1000}px, ${currentY}px, 0) rotate(${currentX > 0 ? 45 : -45}deg)`;
            card.style.opacity = "0";

            handleSwipeAction(dir, data);

            // 次のカードへ移行
            setTimeout(() => {
                card.remove();
                currentCardPool.shift();
                renderStack();
            }, 300);
        } else {
            // 元の位置に戻す (バネのようなスプリングイージング)
            card.style.transition = "transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.2)";
            card.style.transform = "translate3d(0, 0, 0) rotate(0deg)";
            stampLike.style.opacity = 0;
            stampAnmari.style.opacity = 0;
        }
    });
}

function handleSwipeAction(type, data) {
    if (type === "like") {
        if (!likes.some(l => l.id === data.id)) {
            likes.push(data);
            showToast(`❤️ 「${data.name}」をお気に入りに登録！`);
        }
    } else {
        if (!anmaris.some(a => a.id === data.id)) {
            anmaris.push({ ...data, savedAt: Date.now() });
            showToast(`😐 「${data.name}」はあんまりかも`);
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
    if (currentCardPool.length === 0 || isDragging) return;
    const stack = document.getElementById("card-stack");
    const topCard = stack.querySelector(".swipe-card");
    if (!topCard) return;

    const stampLike = topCard.querySelector(".stamp-like");
    const stampAnmari = topCard.querySelector(".stamp-anmari");

    // バッジを表示
    if (direction === "like") {
        if (stampLike) stampLike.style.opacity = "1";
    } else {
        if (stampAnmari) stampAnmari.style.opacity = "1";
    }

    isDragging = true; // 連打やドラッグ重複のブロック

    topCard.style.transition = "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s ease";
    topCard.style.transform = `translate3d(${direction === "like" ? 1000 : -1000}px, 0, 0) rotate(${direction === "like" ? 45 : -45}deg)`;
    topCard.style.opacity = "0";

    const data = currentCardPool[0];
    handleSwipeAction(direction === "like" ? "like" : "anmari", data);

    setTimeout(() => {
        topCard.remove();
        currentCardPool.shift();
        isDragging = false;
        renderStack();
    }, 350);
};

// ==========================================
// 7. 予定機能 (入力テンプレート & AI・ホテル提案)
// ==========================================
function renderLikedList() {
    const listContainer = document.getElementById("likedList");
    listContainer.innerHTML = "";

    if (likes.length === 0) {
        listContainer.innerHTML = `<div class="modal-empty">いいねした観光地がまだありません。「探す」からスワイプしてください。</div>`;
        return;
    }

    likes.forEach(item => {
        const isSelected = activePlanTarget && activePlanTarget.id === item.id;
        const div = document.createElement("div");
        div.className = `liked-item ${isSelected ? 'selected' : ''}`;
        div.onclick = () => selectPlanTarget(item, div);
        div.innerHTML = `
            <img src="${item.img}" class="liked-item-thumb">
            <div class="liked-item-info">
                <h4>${item.name}</h4>
                <p>📍 ${item.prefecture} / 🏷️ ${item.season}時期</p>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

function selectPlanTarget(item, element) {
    document.querySelectorAll(".liked-item").forEach(i => i.classList.remove("selected"));
    element.classList.add("selected");

    activePlanTarget = item;

    // プレースホルダーを非表示にし、フォームを表示する
    document.getElementById("planFormPlaceholder").classList.add("hidden");
    document.getElementById("planResults").classList.add("hidden");
    document.getElementById("planError").classList.add("hidden");
    document.getElementById("planLoading").classList.add("hidden");

    const form = document.getElementById("planForm");
    form.classList.remove("hidden");
    document.getElementById("planTargetName").innerHTML = `<span class="material-icons" style="vertical-align: middle; color: var(--primary-color);">location_on</span> ${item.name} 行き旅行プラン設定`;
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

// =================================================================
// JSONP通信を行う簡易ユーティリティ関数（CORS回避用）
function fetchJsonp(url) {
    return new Promise((resolve, reject) => {
        const callbackName = "rakuten_callback_" + Math.random().toString(36).substring(2, 15);
        url.searchParams.append("callback", callbackName);

        const script = document.createElement("script");
        script.src = url.toString();

        window[callbackName] = (data) => {
            resolve(data);
            cleanup();
        };

        script.onerror = () => {
            reject(new Error("JSONP request failed"));
            cleanup();
        };

        function cleanup() {
            delete window[callbackName];
            script.remove();
        }

        document.body.appendChild(script);
    });
}

// 実際の楽天トラベルAPI（SimpleHotelSearch）を呼び出す関数（CORS回避版）
async function fetchRakutenHotels(lat, lon, appId) {
    const url = new URL("https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426");
    
    url.searchParams.append("format", "json");
    url.searchParams.append("applicationId", appId);
    url.searchParams.append("latitude", lat);
    url.searchParams.append("longitude", lon);
    url.searchParams.append("searchRadius", "3");
    url.searchParams.append("datumType", "1");
    url.searchParams.append("hits", "5");

    try {
        // CORS回避のためfetchの代わりにJSONP通信を使用します
        const data = await fetchJsonp(url);
        
        if (data.hotels && data.hotels.length > 0) {
            return data.hotels.map(h => {
                const basicInfo = h.hotel[0].hotelBasicInfo;
                return {
                    name: basicInfo.hotelName,
                    rating: basicInfo.reviewAverage || "評価なし",
                    price: basicInfo.hotelMinCharge ? `￥${basicInfo.hotelMinCharge.toLocaleString()}〜` : "料金情報なし",
                    desc: basicInfo.hotelSpecial || "プラン詳細はリンク先をご確認ください。",
                    url: basicInfo.hotelInformationUrl,
                    img: basicInfo.hotelImageUrl || ""
                };
            });
        }
        return [];
    } catch (error) {
        console.error("楽天トラベルAPIの取得に失敗しました:", error);
        throw error;
    }
}

// Gemini APIを用いて新しい観光地を生成する関数
async function fetchGeminiPlaces(apiKey, excludeNames) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const excludeStr = excludeNames.length > 0 ? `ただし、以下の観光地はすでに登録済みまたはスワイプ済みであるため、絶対に含めないでください: ${excludeNames.join(", ")}` : "";

    const promptText = `
近畿地方（大阪府、京都府、兵庫県、奈良県、滋賀県、和歌山県）にある、スワイプ型旅行アプリで表示する魅力的な観光スポット（名所、歴史的建造物、温泉、グルメ街、自然など）を新たに「5件」考案し、日本語のJSON形式で出力してください。

${excludeStr}

出力するJSONは以下の構造の配列である必要があります：
[
  {
    "name": "観光地名（例: 清水寺）",
    "prefecture": "都府県名（例: 京都）※「都」「府」「県」は付けないでください（京都、大阪、兵庫、奈良、滋賀、和歌山）",
    "season": "おすすめの時期（春、夏、秋、冬のいずれか1文字）",
    "category": "カテゴリ名（history, nature, food, healing のいずれか）",
    "description": "観光地の魅力を伝える魅力的な紹介文（2〜3文程度、100文字以内で、思わず行きたくなるような文章）",
    "tags": ["タグ1", "タグ2", "タグ3"] ※ 観光地に関連する「自然」「グルメ」「歴史」「観光」「リラックス」「アクティブ」「癒やし」などのタグを3つ設定してください,
    "lat": 観光地の緯度（実在する大体の座標の数値）,
    "lon": 観光地の経度（実在する大体の座標の数値）
  }
]

※ JSON以外の説明文やマークダウンのデコレーション（\`\`\`json 等）は一切含めず、純粋なJSON文字列のみを返してください。
`;

    const requestBody = {
        contents: [{
            parts: [{ text: promptText }]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        let errMsg = `Gemini APIエラー: ${response.status}`;
        try {
            const errJson = await response.json();
            if (errJson.error && errJson.error.message) {
                errMsg += ` (${errJson.error.message})`;
            }
        } catch (e) {}
        
        if (response.status === 404) {
            try {
                const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                const listRes = await fetch(listUrl);
                if (listRes.ok) {
                    const listData = await listRes.json();
                    const modelNames = listData.models.map(m => m.name.replace("models/", ""));
                    console.log("利用可能なモデル:", modelNames);
                    errMsg += ` | 利用可能モデル: ${modelNames.join(", ")}`;
                }
            } catch (e) {
                console.error("モデル一覧の取得失敗:", e);
            }
        }
        throw new Error(errMsg);
    }

    const resData = await response.json();
    const jsonText = resData.candidates[0].content.parts[0].text;
    const newPlaces = JSON.parse(jsonText);
    
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
            lat: place.lat,
            lon: place.lon,
            img: `https://loremflickr.com/500/350/japan,sightseeing,${encodeURIComponent(place.name)}`
        };
    });
}

// AIでの観光地追加ボタンのアクション
window.generatePlacesWithAI = async function() {
    if (!geminiApiKey) {
        showToast("⚠️ 設定画面で Gemini API キーを設定してください。");
        setTimeout(() => {
            switchView("settings");
        }, 1500);
        return;
    }

    const stack = document.getElementById("card-stack");
    const container = document.getElementById("swipeActionsContainer");
    if (container) container.classList.add("hidden");
    
    stack.innerHTML = `
        <div class="empty-stack-view" style="animation: fadeIn 0.3s ease;">
            <div class="spinner"></div>
            <h3>AIが新しい観光地を探索中...</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">近畿地方の魅力的なスポットを生成しています</p>
        </div>
    `;

    try {
        const existingNames = kinkiPlaces.map(p => p.name);
        const newPlaces = await fetchGeminiPlaces(geminiApiKey, existingNames);
        
        if (newPlaces && newPlaces.length > 0) {
            kinkiPlaces.unshift(...newPlaces);
            showToast(`✨ AIが新しい観光スポットを ${newPlaces.length} 件追加しました！`);
            applyFilters();
        } else {
            throw new Error("Empty list returned");
        }
    } catch (err) {
        console.error(err);
        showToast(`⚠️ 自動生成に失敗しました: ${err.message}`);
        stack.innerHTML = `
            <div class="empty-stack-view">
                <span class="material-icons empty-icon">error_outline</span>
                <h3>生成エラーが発生しました</h3>
                <p style="color: var(--accent-error); font-weight: 600;">エラー詳細: ${err.message}</p>
                <p>Gemini APIキーが無効であるか、モデルの制限・ネットワーク接続に問題があります。</p>
                <div class="empty-stack-view-actions">
                    <button class="btn-primary" onclick="generatePlacesWithAI()">🔄 再試行する</button>
                    <button class="btn-primary" style="background-color: var(--text-muted); opacity: 0.8;" onclick="resetSwipeHistory()">履歴をリセットしてやり直す</button>
                </div>
            </div>
        `;
    }
};

// 旅行プランの生成 (※APIを中で await するため async 関数に変更)
window.generateTravelPlan = async function (event) {
    event.preventDefault();
    if (!activePlanTarget) return;

    const dateVal = document.getElementById("planDate").value;
    const nightsVal = parseInt(document.getElementById("planNights").value);
    const peopleVal = parseInt(document.getElementById("planPeople").value);
    const budgetVal = parseInt(document.getElementById("planBudget").value);
    const othersVal = document.getElementById("planOthers").value;
    const simulateError = document.getElementById("simulateApiError").checked;

    // フォームを隠してローディング表示
    document.getElementById("planForm").classList.add("hidden");
    const loadingView = document.getElementById("planLoading");
    loadingView.classList.remove("hidden");

    try {
        // デバッグ用の「APIエラーを再現」チェックボックスがONの場合
        if (simulateError) {
            throw new Error("Simulated API Error");
        }

        const targetPref = activePlanTarget.prefecture;
        const selectedNightsText = `${nightsVal}泊${nightsVal + 1}日`;

        // AI提案テキストの生成
        const itinerary = generateItineraryText(activePlanTarget.name, targetPref, dateVal, selectedNightsText, peopleVal, budgetVal, currentPriority, othersVal);

        // =================================================================
        // 【ここから楽天トラベルAPI連携の分岐処理】
        // =================================================================
        let hotels = [];
        if (rakutenAppId) {
            // ① アプリIDが設定されている場合は、本物のAPIを叩いて周辺のホテルを検索
            try {
                // 選択された観光地(activePlanTarget)の緯度(lat)・経度(lon)をAPIに渡します
                hotels = await fetchRakutenHotels(activePlanTarget.lat, activePlanTarget.lon, rakutenAppId);
                showToast("✨ 楽天トラベルAPIから周辺のホテル情報を取得しました！");
            } catch (err) {
                // API呼び出しでエラーが起きた場合は、従来のモックデータにフォールバック（自動切り替え）
                console.warn("楽天APIの取得に失敗したため、モックデータにフォールバックします。", err);
                hotels = mockHotels[targetPref] || [];
                showToast("⚠️ API接続エラーのため、モックホテルを表示します。");
            }
        } else {
            // ② アプリIDが未設定の場合は、1秒待機するダミー処理を挟んだ後、モックデータを表示
            await new Promise(resolve => setTimeout(resolve, 1000));
            hotels = mockHotels[targetPref] || [];
            showToast("ℹ️ アプリID未設定のため、モックホテルを表示します。");
        }
        // =================================================================

        // 取得したホテル情報をHTMLに描画する処理
        const hotelList = document.getElementById("hotelList");
        hotelList.innerHTML = "";

        if (hotels.length === 0) {
            hotelList.innerHTML = `<div class="modal-empty">周辺にホテルが見つかりませんでした。</div>`;
        } else {
            hotels.forEach(h => {
                const card = document.createElement("div");
                card.className = "hotel-card";
                card.innerHTML = `
                    <img src="${h.img || activePlanTarget.img}" class="hotel-img" alt="${h.name}">
                    <div class="hotel-info">
                        <div>
                            <h4>${h.name}</h4>
                            <div class="hotel-rating">⭐ ${h.rating} / 楽天トラベルユーザー評価</div>
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">${h.desc}</p>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="hotel-price">${h.price}</span>
                            <!-- 楽天トラベルの宿詳細ページ（h.url）へリンクします -->
                            <a href="${h.url || 'https://travel.rakuten.co.jp/'}" target="_blank" class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem; text-decoration: none;">空室確認・予約</a>
                        </div>
                    </div>
                `;
                hotelList.appendChild(card);
            });
        }

        // データを予定リストに保存
        const planObj = {
            id: Date.now(),
            destination: activePlanTarget.name,
            prefecture: targetPref,
            date: dateVal,
            nights: nightsVal,
            people: peopleVal,
            budget: budgetVal,
            lat: activePlanTarget.lat, // ダミー座標ではなく本物の観光地の緯度経度を保存
            lon: activePlanTarget.lon,
            itineraryText: itinerary
        };
        plans.push(planObj);
        saveToStorage();

        // 提案表示
        document.getElementById("aiPlanText").textContent = itinerary;
        loadingView.classList.add("hidden");
        document.getElementById("planResults").classList.remove("hidden");

        // ホーム画面のカウントダウン更新用
        updateCountdown();
        updateGridCounts();

        // 予定を入れたことによるスタンド能力の精密動作、持続力パラメータ更新
        calculateStandStats();

    } catch (error) {
        loadingView.classList.add("hidden");
        document.getElementById("planError").classList.remove("hidden");
        showToast("⚠️ プラン作成に失敗しました。");
    }
};

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
// 8. ホーム機能 (「あんまり」データ自動削除 & 管理)
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
            showToast(`🧹 15日以上経過した「あんまり」データを ${deletedCount} 件自動クリーンアップしました。`);
        }, 1000);
    }
}

function updateGridCounts() {
    document.getElementById("favCount").textContent = favorites.length;
    document.getElementById("recentLikeCount").textContent = likes.length;
    document.getElementById("planCount").textContent = plans.length;
    document.getElementById("anmariCount").textContent = anmaris.length;
}

function updateCountdown() {
    const el = document.getElementById("countdownDays");
    const dest = document.getElementById("countdownDestination");

    if (plans.length === 0) {
        el.textContent = "-- 日";
        dest.textContent = "予定を登録してね";
        return;
    }

    // 未来の予定を日付でソートして直近のものを取得
    const sortedPlans = [...plans].filter(p => new Date(p.date) >= new Date().setHours(0, 0, 0, 0))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedPlans.length === 0) {
        el.textContent = "-- 日";
        dest.textContent = "次の予定を作成してね";
        return;
    }

    const next = sortedPlans[0];
    const diff = Math.ceil((new Date(next.date) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));

    if (diff === 0) {
        el.textContent = "今日！";
    } else {
        el.textContent = `${diff} 日`;
    }
    dest.textContent = `📍 ${next.destination}`;
}

// 天気シミュレーター (APIキー未設定でも近畿の天気を出力)
function simulateWeather() {
    const weatherIcon = document.getElementById("weatherIcon");
    const weatherTemp = document.getElementById("weatherTemp");
    const weatherDesc = document.getElementById("weatherDesc");
    const weatherLocation = document.getElementById("weatherLocation");

    if (plans.length === 0) {
        weatherIcon.textContent = "🌤️";
        weatherTemp.textContent = "--°C";
        weatherDesc.textContent = "予定を登録すると表示されます";
        weatherLocation.textContent = "目的地の天気";
        return;
    }

    const sortedPlans = [...plans].filter(p => new Date(p.date) >= new Date().setHours(0, 0, 0, 0))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedPlans.length === 0) return;
    const next = sortedPlans[0];

    // 都府県に基づくダミー天候
    const weatherData = {
        "京都": { icon: "🌸", temp: "19°C", desc: "穏やかな晴れのち薄曇り" },
        "大阪": { icon: "☀️", temp: "24°C", desc: "快晴・絶好の食べ歩き日和" },
        "兵庫": { icon: "⚓", temp: "22°C", desc: "海風が心地よい晴れ" },
        "奈良": { icon: "🦌", temp: "18°C", desc: "小雨のち晴れ、緑が映える日" },
        "滋賀": { icon: "⛵", temp: "17°C", desc: "琵琶湖周辺は爽やかな強風" },
        "和歌山": { icon: "🍊", temp: "25°C", desc: "南風が暖かい夏日" }
    };

    const mockInfo = weatherData[next.prefecture] || { icon: "🌤️", temp: "20°C", desc: "快適な旅行日和" };
    weatherIcon.textContent = mockInfo.icon;
    weatherTemp.textContent = mockInfo.temp;
    weatherDesc.textContent = mockInfo.desc;
    weatherLocation.textContent = `📍 ${next.destination} (${next.prefecture})の天気`;
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
let standStats = [50, 50, 50, 50, 50, 50]; // 破壊力, スピード, 射程距離, 持続力, 精密動作, 成長性
let myChart = null;

function calculateStandStats() {
    // 基本パラメータ
    let power = 50;
    let speed = 50;
    let range = 50;
    let durability = 50;
    let precision = 50;
    let growth = 30 + (likes.length + anmaris.length) * 2.5; // スワイプ回数で成長

    // 府県の多様性算出 (射程距離ボーナス)
    const distinctPrefs = new Set(likes.map(l => l.prefecture));
    range += distinctPrefs.size * 8; // 6府県全てで最大+48

    // いいねごとの加算
    likes.forEach(item => {
        // カテゴリ影響
        if (item.category === "food") {
            power += 6;
            speed += 4;
            durability -= 1;
        } else if (item.category === "nature") {
            durability += 6;
            range += 3;
            speed -= 1;
        } else if (item.category === "history") {
            precision += 7;
            durability += 2;
            power -= 1;
        } else if (item.category === "healing") {
            durability += 5;
            precision += 3;
            power -= 3;
        }

        // タグの影響
        if (item.tags.includes("アクティブ")) { power += 4; speed += 4; }
        if (item.tags.includes("リラックス")) { durability += 5; speed -= 2; }
        if (item.tags.includes("歴史")) { precision += 4; }
        if (item.tags.includes("自然")) { range += 3; }
        if (item.tags.includes("グルメ")) { power += 3; }
    });

    // あんまりの影響 (少しマイナス調整で引き締める)
    anmaris.forEach(item => {
        if (item.category === "nature") durability -= 2;
        if (item.category === "food") power -= 2;
        if (item.category === "history") precision -= 2;
        if (item.category === "healing") durability -= 1;
    });

    // 計画の多さ（予定機能使用数）
    plans.forEach(plan => {
        precision += 6;     // 予定を細かく立てている＝精密
        durability += 4;    // 連泊数＝持続力
    });

    // 10から100の間にクランプ
    standStats = [
        Math.min(100, Math.max(10, power)),
        Math.min(100, Math.max(10, speed)),
        Math.min(100, Math.max(10, range)),
        Math.min(100, Math.max(10, durability)),
        Math.min(100, Math.max(10, precision)),
        Math.min(100, Math.max(10, growth))
    ];

    saveToStorage();
    updateStandProfile();
}

function updateStandProfile() {
    const labels = ["破壊力", "スピード", "射程距離", "持続力", "精密動作", "成長性"];
    const highestVal = Math.max(...standStats);
    const highestIndex = standStats.indexOf(highestVal);

    let standName = "トラベラー・スター";
    let rankText = "C";

    // 突出したステータスに基づくスタンド名生成
    if (highestIndex === 0) standName = "ザ・グルメブレイカー";
    else if (highestIndex === 1) standName = "アーバン・ハリケーン";
    else if (highestIndex === 2) standName = "近畿・レンジャー";
    else if (highestIndex === 3) standName = "グリーン・ガーディアン";
    else if (highestIndex === 4) standName = "ヒストリー・クロニクル";
    else if (highestIndex === 5) standName = "インフィニット・フューチャー";

    // バランスが良い場合
    const sum = standStats.reduce((a, b) => a + b, 0);
    const avg = sum / 6;
    let isBalanced = true;
    standStats.forEach(s => {
        if (Math.abs(s - avg) > 15) isBalanced = false;
    });
    if (isBalanced) {
        standName = "ハーモニアス・ジャーニー";
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
    if (standRankEl) standRankEl.textContent = `スタンド評価: Rank ${rankText}`;
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
            labels: ["破壊力", "スピード", "射程距離", "持続力", "精密動作", "成長性"],
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
}

// ==========================================
// 10. 設定機能 (アカウント、テーマ、文字サイズ)
// ==========================================
window.updateSettingsFromUI = function () {
    const usernameInput = document.getElementById("settingsUsername");
    const headerTitleInput = document.getElementById("settingsHeaderTitle");
    const rakutenInput = document.getElementById("settingsRakutenAppId");
    const geminiInput = document.getElementById("settingsGeminiApiKey");

    userName = usernameInput ? usernameInput.value.trim() || "トラベラー" : "トラベラー";
    headerTitle = headerTitleInput ? headerTitleInput.value.trim() || "Kinki Wander" : "Kinki Wander";
    rakutenAppId = rakutenInput ? rakutenInput.value.trim() : "";
    geminiApiKey = geminiInput ? geminiInput.value.trim() : "";

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
        "anmari": { label: "😐 あんまり（自動クリーンアップ予定）", list: anmaris, emptyMsg: "「あんまり」としたスポットはありません。" }
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
        if (type === "anmari") {
            const savedTime = item.savedAt || now;
            const daysPassed = (now - savedTime) / (1000 * 60 * 60 * 24);
            const daysLeft = Math.max(0, Math.ceil(15 - daysPassed));

            return `
                <div class="modal-item" id="modal-item-${item.id}">
                    <div class="modal-item-info">
                        <div class="modal-item-name">${item.name}</div>
                        <div class="modal-item-sub">📍 ${item.prefecture} / ${item.season}時期</div>
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
            return `
                <div class="modal-item" id="modal-item-${item.id}">
                    <div class="modal-item-info" style="flex: 1; cursor: pointer;" onclick="viewItineraryDetails(${item.id})">
                        <div class="modal-item-name">📅 ${item.destination} の旅 (${item.nights}泊${item.nights + 1}日)</div>
                        <div class="modal-item-sub">出発日: ${item.date} | 人数: ${item.people}名</div>
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
                        <div class="modal-item-name">${item.name}</div>
                        <div class="modal-item-sub">📍 ${item.prefecture} | ${item.description.substring(0, 30)}...</div>
                    </div>
                    <button class="btn-item-delete" onclick="deleteModalItem('favorites', ${item.id})">
                        <span class="material-icons" style="font-size: 1.2rem;">star</span>
                    </button>
                </div>
            `;
        } else {
            // recent-likes
            return `
                <div class="modal-item" id="modal-item-${item.id}">
                    <div class="modal-item-info">
                        <div class="modal-item-name">${item.name}</div>
                        <div class="modal-item-sub">📍 ${item.prefecture} | ${item.description.substring(0, 30)}...</div>
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

    document.getElementById("planFormPlaceholder").classList.add("hidden");
    document.getElementById("planForm").classList.add("hidden");
    document.getElementById("planLoading").classList.add("hidden");
    document.getElementById("planError").classList.add("hidden");

    // ホテル推薦をこの府県に合わせて表示
    const hotels = mockHotels[plan.prefecture] || [];
    const hotelList = document.getElementById("hotelList");
    hotelList.innerHTML = "";

    const referenceSpot = kinkiPlaces.find(p => p.name === plan.destination) || kinkiPlaces[0];

    hotels.forEach(h => {
        const card = document.createElement("div");
        card.className = "hotel-card";
        card.innerHTML = `
            <img src="${referenceSpot.img}" class="hotel-img">
            <div class="hotel-info">
                <div>
                    <h4>${h.name}</h4>
                    <div class="hotel-rating">⭐ ${h.rating} / 楽天トラベルユーザー評価</div>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">${h.desc}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="hotel-price">${h.price}</span>
                    <a href="https://travel.rakuten.co.jp/" target="_blank" class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem; text-decoration: none;">空室確認・予約</a>
                </div>
            </div>
        `;
        hotelList.appendChild(card);
    });

    document.getElementById("aiPlanText").textContent = plan.itineraryText;
    document.getElementById("planResults").classList.remove("hidden");
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
        "anmari": "「あんまり」としたスポットはありません。"
    };

    if (list.length === 0) {
        body.innerHTML = `<div class="modal-empty">${configs[type]}</div>`;
    } else {
        renderModalList(type, list, body);
    }

    showToast("項目を削除しました。");



};