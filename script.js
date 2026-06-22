import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
let headerTitle = localStorage.getItem("kw_headertitle") || "Kinki Wander";
let currentTheme = localStorage.getItem("kw_theme") || "mc-blue";
let currentFontSize = localStorage.getItem("kw_fontsize") || "100";
let currentLanguage = localStorage.getItem("kw_lang") || "ja";
let rakutenAppId = (localStorage.getItem("kw_rakuten_appid") || "").trim();
const DEFAULT_GEMINI_API_KEY = "AQ.Ab8RN6KFH8axdvRQQ0D9RSYAHu-f_EFbJrpWVXXb4ncEEDx5EA";
const DEFAULT_AI_API_KEY = ""; // 使用するOpenAI APIキー（sk-...）
// AQ.形式はGoogle AI Studioの新しいAPIキーフォーマットのため、削除せずそのまま保持します
const _storedGeminiKey = (localStorage.getItem("kw_gemini_apikey") || "").trim();
let geminiApiKey = _storedGeminiKey;

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
        if (statusEl) statusEl.textContent = "近畿エリア探索中";
        if (myPageName) myPageName.textContent = userName;
        if (myPageStatus) myPageStatus.textContent = "近畿エリア探索中";
        
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

    // 「興味なし」リストの自動削除 (15日経過したものをパージ)
    purgeOldAnmaris();

    // 検索カードプールの準備
    applyFilters();

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
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span class="material-icons" style="font-size: 1.2rem; color: var(--primary-color);">info</span><span>${message}</span>`;
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
window.applyFilters = function () {
    const seasonSelect = document.getElementById("filterSeason");
    const catSelect = document.getElementById("filterCategory");

    activeFilters.season = seasonSelect ? seasonSelect.value : "all";
    if (catSelect) {
        activeFilters.category = catSelect.value;
    }

    // フィルタ条件に合致するスポットプールを作成
    currentCardPool = kinkiPlaces.filter(place => {
        const matchSeason = (activeFilters.season === "all" || place.season === activeFilters.season);
        const matchCat = (activeFilters.category === "all" || place.category === activeFilters.category);

        // すでに「いいね」または「興味なし」に入っているものは除く (リセットされない限り)
        const isAlreadySelected = likes.some(l => l.id === place.id) || anmaris.some(a => a.id === place.id);

        let matchRecommendation = true;
        if (recommendationMode) {
            const highestVal = Math.max(...standStats);
            const highestIndex = standStats.indexOf(highestVal);
            matchRecommendation = matchesGenre(place, highestIndex);
        }

        return matchSeason && matchCat && !isAlreadySelected && matchRecommendation;
    });

    if (recommendationMode) {
        // AI推奨モードの場合、マッチ度順にソート
        currentCardPool.forEach(place => {
            place.tempCompatibilityScore = calculateCompatibilityScore(place);
        });
        currentCardPool.sort((a, b) => b.tempCompatibilityScore - a.tempCompatibilityScore);
    }

    nextPoolIndex = 0;
    renderStack();
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

function createCardElement(data, isTopCard) {
    const card = document.createElement("div");
    card.className = "swipe-card";
    // 表示優先順位の設定（待機カードも同サイズ・同位置でフラットに重ねる）
    card.style.zIndex = isTopCard ? 5 : 1;
    if (!isTopCard) {
        card.style.pointerEvents = "none";
    }

    const isStarred = favorites.some(f => f.id === data.id);
    const isRecommended = recommendationMode;
    const matchScore = calculateCompatibilityScore(data);

    card.innerHTML = `
        <div class="card-img-container">
            <img src="${data.img}" class="card-img" alt="${data.name}">
            <span class="card-prefecture-badge">📍 ${data.prefecture}</span>
            <span class="card-season-badge">🍂 ${data.season}おすすめ</span>
            ${isRecommended ? `<span class="card-match-badge"><span class="material-icons" style="font-size: 0.95rem; vertical-align: middle;">bolt</span>AIマッチ度 ${matchScore}%</span>` : ''}
            <div class="swipe-stamp stamp-like">いいね</div>
            <div class="swipe-stamp stamp-anmari">興味なし</div>
        </div>
        <button class="card-star-btn ${isStarred ? 'starred' : ''}" onclick="toggleFavorite(this, event, ${data.id})"><span class="material-icons-outlined star-icon">${isStarred ? 'star' : 'star_border'}</span></button>
        <div class="card-info">
            <h3>${data.name}</h3>
            <div class="card-tags-container">
                <span class="tag-pill"><span class="material-icons">people</span>${data.companion ? data.companion.join('・') : ''}</span>
                <span class="tag-pill"><span class="material-icons">payments</span>${data.budget || 'スタンダード'}</span>
                <span class="tag-pill"><span class="material-icons">commute</span>${data.transport || '公共交通機関'}</span>
                <span class="tag-pill"><span class="material-icons">explore</span>${data.purpose || '観光'}</span>
            </div>
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
        
        // Ensure favorited item is also in Saved Spots (likes)
        if (!likes.some(l => l.id === id)) {
            likes.push(item);
        }
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
        if (!isDragging) return;
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
        isDragging = false;

        // スワイプ判定 (130px以上移動)
        if (Math.abs(currentX) > 130) {
            const dir = currentX > 0 ? "like" : "anmari";
            card.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease";
            card.style.transform = `translateX(${currentX > 0 ? 1000 : -1000}px) rotate(${currentX > 0 ? 45 : -45}deg)`;
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
            card.style.transform = "translateX(0) rotate(0deg)";
            if (stampLike) stampLike.style.opacity = 0;
            if (stampAnmari) stampAnmari.style.opacity = 0;
        }
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
    topCard.style.transform = `translateX(${direction === "like" ? 1000 : -1000}px) rotate(${direction === "like" ? 45 : -45}deg)`;
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
    if (targetName) targetName.innerHTML = `<span class="material-icons" style="vertical-align: middle; color: var(--primary-color);">location_on</span> ${item.name} 行き旅行プラン設定`;
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

// 実際の楽天トラベルAPIを中継サーバー経由で呼び出す関数
async function fetchRakutenHotels(lat, lon) {
    const url = new URL("/api/travel/hotels", window.location.origin);
    url.searchParams.append("latitude", lat);
    url.searchParams.append("longitude", lon);

    try {
        const response = await fetch(url.toString());
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTPエラー! ステータス: ${response.status}`);
        }
        
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

// Gemini APIを中継サーバー経由で呼び出し、AIを用いて新しい観光地を生成する関数
async function fetchGeminiPlaces(excludeNames) {
    const url = new URL("/api/travel/generate", window.location.origin);
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
    "companion": ["同行者タグ1", "同行者タグ2"] ※ "一人旅", "カップル", "友人グループ", "子連れ" から適したものを複数選択して配列で設定してください,
    "budget": "予算目安" ※ "低予算", "スタンダード", "ラグジュアリー" のいずれか1つを設定してください,
    "transport": "移動手段" ※ "自家用車", "公共交通機関", "徒歩" のいずれか1つを設定してください,
    "purpose": "目的" ※ "リフレッシュ", "アクティビティ", "グルメ", "歴史探訪" のいずれか1つを設定してください,
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

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    const resData = await response.json();

    if (!response.ok) {
        let errMsg = resData.error || `Gemini APIエラー: ${response.status}`;
        throw new Error(errMsg);
    }

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
            companion: place.companion || ["カップル"],
            budget: place.budget || "スタンダード",
            transport: place.transport || "公共交通機関",
            purpose: place.purpose || "リフレッシュ",
            lat: place.lat,
            lon: place.lon,
            img: `https://loremflickr.com/500/350/japan,sightseeing,${encodeURIComponent(place.name)}`
        };
    });
}

// AIでの観光地追加ボタンのアクション
window.generatePlacesWithAI = async function() {
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
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">近畿地方の魅力的なスポットを生成しています</p>
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

// 旅行プランの生成 (※APIを中で await するため async 関数に変更)
window.generateTravelPlan = async function (event) {
    event.preventDefault();
    if (!activePlanTarget) return;

    const dateVal = document.getElementById("planDate").value;
    const nightsVal = parseInt(document.getElementById("planNights").value);
    const peopleVal = parseInt(document.getElementById("planPeople").value);
    const budgetVal = parseInt(document.getElementById("planBudget").value);
    const othersVal = document.getElementById("planOthers").value;
    const simulateError = false;

    // フォームを隠してローディング表示
    document.getElementById("planForm").classList.add("hidden");
    const loadingView = document.getElementById("planLoading");
    loadingView.classList.remove("hidden");

    // progress bar reset
    let progressValue = 0;
    const fill = document.getElementById("planProgressBarFill");
    const train = document.getElementById("planProgressTrain");
    const percent = document.getElementById("planProgressPercent");
    if (fill) fill.style.width = "0%";
    if (train) train.style.left = "0%";
    if (percent) percent.textContent = "0%";

    // Ensure loading screen is visible to show off animations
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
        try {
            // 選択された観光地(activePlanTarget)の緯度(lat)・経度(lon)を中継サーバーに渡してホテルを検索します
            hotels = await fetchRakutenHotels(activePlanTarget.lat, activePlanTarget.lon);
            showToast("✨ 楽天トラベルAPIから周辺のホテル情報を取得しました！");
        } catch (err) {
            // API呼び出しでエラーが起きた場合は、従来のモックデータにフォールバック（自動切り替え）
            console.warn("ホテル情報の取得に失敗したため、モックデータにフォールバックします。", err);
            hotels = mockHotels[targetPref] || [];
            if (err.message && err.message.includes("429")) {
                showToast("⚠️ 本日のホテル検索制限に達したため、モックホテルを表示します。");
            } else {
                showToast("⚠️ API接続エラーのため、モックホテルを表示します。");
            }
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
        
        // アクセス情報表示
        const transitText = transitAccessRoutes[activePlanTarget.name] || "公共交通機関の情報が見つかりませんでした。詳細なルートはナビアプリ等でご確認ください。";
        const transitEl = document.getElementById("aiPlanTransitText");
        if (transitEl) transitEl.textContent = transitText;

        const elapsedTime = Date.now() - startTime;
        const minDuration = 1400;
        if (elapsedTime < minDuration) {
            await new Promise(resolve => setTimeout(resolve, minDuration - elapsedTime));
        }

        clearInterval(progressInterval);
        if (fill) fill.style.width = "100%";
        if (train) train.style.left = "100%";
        if (percent) percent.textContent = "100%";
        await new Promise(resolve => setTimeout(resolve, 250));

        loadingView.classList.add("hidden");
        document.getElementById("planResults").classList.remove("hidden");

        // ホーム画面のカウントダウン更新用
        updateCountdown();
        updateGridCounts();

        // 予定を入れたことによるスタンド能力の精密動作、持続力パラメータ更新
        calculateStandStats();

    } catch (error) {
        clearInterval(progressInterval);
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

    try {
        const url = new URL("/api/travel/weather", window.location.origin);
        url.searchParams.append("latitude", next.lat || 34.6937);
        url.searchParams.append("longitude", next.lon || 135.5023);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        const tempVal = Math.round(data.main.temp) + "°C";
        const descVal = data.weather[0].description;
        const emoji = getWeatherIconEmoji(data.weather[0].icon);

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
    headerTitle = headerTitleInput ? headerTitleInput.value.trim() || "Kinki Wander" : "Kinki Wander";
    // APIキーはサーバー側で管理されるため、フロントからの入力取得は廃止します
    rakutenAppId = "server";
    geminiApiKey = "server";

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

    // アクセス情報表示
    const transitText = transitAccessRoutes[plan.destination] || "公共交通機関の情報が見つかりませんでした。詳細なルートはナビアプリ等でご確認ください。";
    const transitEl = document.getElementById("aiPlanTransitText");
    if (transitEl) transitEl.textContent = transitText;

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
            const nightsText = `${sp.nights}泊${sp.nights + 1}日`;
            const div = document.createElement("div");
            div.className = "shared-plan-card";
            div.innerHTML = `
                <div class="shared-card-header">
                    <div class="shared-author-info">
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${sp.avatar || 'traveler'}" class="shared-author-avatar" alt="Avatar">
                        <div>
                            <span class="shared-author-name">${sp.author}</span>
                            <span class="shared-date-badge">プラン作成日: ${sp.date}</span>
                        </div>
                    </div>
                    <span class="shared-pref-badge">📍 ${sp.prefecture}</span>
                </div>
                <div class="shared-card-body">
                    <h4>📅 ${sp.destination} の旅 (${nightsText})</h4>
                    <p class="shared-details">👥 ${sp.people}名様 | 💰 予算目安: ${sp.budget.toLocaleString()}円程度</p>
                    <div class="shared-itinerary-preview" onclick="toggleSharedItinerary(this)">
                        <div class="preview-text">${sp.itineraryText}</div>
                        <div class="preview-fade"></div>
                        <div class="preview-toggle-btn">行程をすべて表示</div>
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
        itineraryText: plan.itineraryText
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

// ==========================================
// 14. AIチャットボット (旅行相談窓口) 制御ロジック
// ==========================================

window.openChatDrawer = function () {
    // 認証状態のチェック: ログインユーザー限定 (ゲストは無効)
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
        showToast("⚠️ AIチャットのご利用にはログインが必要です。");
        return;
    }

    // APIキーは中継サーバー側で管理されます
    
    const drawer = document.getElementById("chat-drawer");
    if (drawer) {
        drawer.classList.remove("hidden");
    }
};

window.closeChatDrawer = function () {
    const drawer = document.getElementById("chat-drawer");
    if (drawer) {
        drawer.classList.add("hidden");
    }
};

window.handleSendChatMessage = async function (event) {
    event.preventDefault();
    const input = document.getElementById("chatInput");
    if (!input) return;
    const messageText = input.value.trim();
    if (!messageText) return;
    
    // 入力欄をクリア
    input.value = "";
    
    // ユーザー発言を吹き出し追加
    appendChatBubble("user", messageText);
    
    // AI入力中インジケータ表示
    const typingId = appendTypingIndicator();
    
    try {
        // レーダーチャート値のフォーマット
        const labels = ["温泉・癒やし", "自然・景観", "歴史・文化", "グルメ", "アクティビティ", "都市・ショッピング"];
        const prefStatsStr = standStats.map((val, idx) => `${labels[idx]}: ${val}%`).join(", ");
        
        const systemPrompt = `ユーザー名: ${userName}
旅行の好みパラメータ: ${prefStatsStr}

あなたは旅行プランナーのAI相談員です。回答を行う際は、ユーザーの興味関心が高いパラメータ（特に値が大きい項目）を優先的に考慮した提案・目的地選定やアドバイスを行ってください。
【重要・最優先ルール】
- 提案やアドバイスを行う目的地は、必ず近畿地方（大阪府、京都府、兵庫県、奈良県、滋賀県、和歌山県）のスポットに限定してください。東京や北海道、沖縄など、近畿地方以外の地域は絶対に提案しないでください。
- 回答は極めて簡潔に、短く要点をまとめて答えてください。
- 長文は厳禁とし、最大でも「100〜150文字程度」または「3行以内」で簡潔に答えてください。
- 箇条書きを活用して読みやすくしてください。`;

        const chatUrl = new URL("/api/travel/generate", window.location.origin);
        const chatHeaders = { "Content-Type": "application/json" };

        const response = await fetch(chatUrl.toString(), {
            method: "POST",
            headers: chatHeaders,
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `${systemPrompt}\n\nユーザーからの相談: ${messageText}`
                            }
                        ]
                    }
                ]
            })
        });
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            let errMsg = errData.error || `HTTP ${response.status}`;
            if (response.status === 429) {
                errMsg = "本日のAIチャット利用上限に達しました。明日またご相談ください。";
            }
            throw new Error(errMsg);
        }
        
        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "申し訳ありません、お答えを生成できませんでした。";
        
        // 入力中を消す
        removeTypingIndicator(typingId);
        
        // AIの返答を吹き出し追加
        appendChatBubble("ai", replyText);
        
    } catch (error) {
        console.error("Gemini API Error:", error);
        removeTypingIndicator(typingId);
        appendChatBubble("ai", `⚠️ メッセージの送信に失敗しました。接続状況や設定をご確認ください。`);
    }
};

function appendChatBubble(sender, text) {
    const body = document.getElementById("chatDrawerBody");
    if (!body) return;
    
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble chat-bubble-${sender}`;
    bubble.innerHTML = `
        <div class="chat-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
        <div class="chat-text">${escapeHTML(text)}</div>
    `;
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

function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// 15. New Custom Helper Functions
// ==========================================
window.selectCategoryFilter = function (category, element) {
    document.querySelectorAll("#categoryFilters .filter-pill").forEach(el => el.classList.remove("active"));
    element.classList.add("active");
    activeFilters.category = category;
    applyFilters();
};

window.renderSavedSpotsHome = function () {
    const scrollContainer = document.getElementById("savedSpotsScroll");
    if (!scrollContainer) return;
    scrollContainer.innerHTML = "";

    if (likes.length === 0) {
        scrollContainer.innerHTML = `
            <div class="saved-spots-empty" style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem; width: 100%;">
                保存したスポットはまだありません。<br>「探す」タブでスワイプして保存しましょう！
            </div>
        `;
        return;
    }

    likes.forEach(item => {
        const isStarred = favorites.some(f => f.id === item.id);
        const card = document.createElement("div");
        card.className = "saved-spot-thumbnail-card";
        card.onclick = () => selectPlanAndGo(item);
        card.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="thumbnail-overlay"></div>
            <span class="thumbnail-pref">📍 ${item.prefecture}</span>
            <h4 class="thumbnail-name">${item.name}</h4>
            <button class="thumbnail-star-btn ${isStarred ? 'starred' : ''}" onclick="toggleFavoriteFromHome(this, event, ${item.id})">
                <span class="material-icons star-icon">${isStarred ? 'star' : 'star_border'}</span>
            </button>
        `;
        scrollContainer.appendChild(card);
    });
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
            <button class="home-plan-delete-btn" title="この予定を削除" onclick="deleteHomePlan(event, ${plan.id})">
                <span class="material-icons">delete_outline</span>
            </button>
            <span class="material-icons arrow-icon" style="cursor:pointer;">chevron_right</span>
        `;

        // テキスト部分クリックで詳細表示
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
                        companion: detailedPrefs.companion ? Object.entries(detailedPrefs.companion).sort((a,b)=>b[1]-a[1])[0][0] : "カップル",
                        budget: detailedPrefs.budget ? Object.entries(detailedPrefs.budget).sort((a,b)=>b[1]-a[1])[0][0] : "スタンダード",
                        transport: detailedPrefs.transport ? Object.entries(detailedPrefs.transport).sort((a,b)=>b[1]-a[1])[0][0] : "公共交通機関",
                        purpose: detailedPrefs.purpose ? Object.entries(detailedPrefs.purpose).sort((a,b)=>b[1]-a[1])[0][0] : "リフレッシュ"
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
                            companion: detailedPrefs.companion ? Object.entries(detailedPrefs.companion).sort((a,b)=>b[1]-a[1])[0][0] : "カップル",
                            budget: detailedPrefs.budget ? Object.entries(detailedPrefs.budget).sort((a,b)=>b[1]-a[1])[0][0] : "スタンダード",
                            transport: detailedPrefs.transport ? Object.entries(detailedPrefs.transport).sort((a,b)=>b[1]-a[1])[0][0] : "公共交通機関",
                            purpose: detailedPrefs.purpose ? Object.entries(detailedPrefs.purpose).sort((a,b)=>b[1]-a[1])[0][0] : "リフレッシュ"
                        });
                    } else {
                        // 単一スポットでの提案
                        candidates.push({
                            title: `ゆっくり巡る ${spots[0].name}日帰りリフレッシュ旅`,
                            spots: [spots[0]],
                            prefecture: pref,
                            season: spots[0].season,
                            companion: detailedPrefs.companion ? Object.entries(detailedPrefs.companion).sort((a,b)=>b[1]-a[1])[0][0] : "一人旅",
                            budget: detailedPrefs.budget ? Object.entries(detailedPrefs.budget).sort((a,b)=>b[1]-a[1])[0][0] : "スタンダード",
                            transport: detailedPrefs.transport ? Object.entries(detailedPrefs.transport).sort((a,b)=>b[1]-a[1])[0][0] : "公共交通機関",
                            purpose: detailedPrefs.purpose ? Object.entries(detailedPrefs.purpose).sort((a,b)=>b[1]-a[1])[0][0] : "リフレッシュ"
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
            const s = sug.spots[0];
            timelineHTML = `
                ・10:00 - 出発して「${s.name}」へ移動<br>
                ・11:30 - 「${s.name}」到着＆観光<br>
                ・13:00 - 周辺の特産ランチ＆カフェ散策
            `;
        } else {
            const s1 = sug.spots[0];
            const s2 = sug.spots[1];
            timelineHTML = `
                ・09:30 - 出発して「${s1.name}」を観光<br>
                ・12:00 - 地元の名物ランチを堪能<br>
                ・13:30 - 「${s2.name}」へ移動＆散策
            `;
        }

        const isDefault = likes.length === 0;

        const card = document.createElement("div");
        card.className = "proactive-suggestion-card";
        card.setAttribute("id", `proactive-sug-${sugId}`);
        card.innerHTML = `
            <div class="sug-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="sug-tag-badge" style="background: rgba(var(--primary-color-rgb), 0.1); color: var(--primary-color); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">✨ AI先回り自動提案</span>
                <span class="sug-season-badge" style="background: rgba(249, 115, 22, 0.1); color: #f97316; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">🍂 ${sug.season}時期に最適</span>
            </div>
            
            <h4 class="sug-title" style="font-size: 1.05rem; font-weight: 800; margin-bottom: 12px; color: var(--text-color);">${sug.title}</h4>
            
            <div class="sug-spots" style="display: flex; align-items: center; gap: 8px; background: var(--item-bg); padding: 10px; border-radius: 12px; margin-bottom: 10px;">
                ${sug.spots.map((spot, idx) => `
                    ${idx > 0 ? '<span class="sug-arrow" style="color: var(--text-muted); font-weight: bold;">➔</span>' : ''}
                    <div class="sug-spot-item" style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; color: var(--text-color);">
                        <img src="${spot.img}" class="sug-thumb" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;">
                        <span>${spot.name}</span>
                    </div>
                `).join("")}
            </div>

            <div class="sug-meta" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
                <span style="font-size: 0.7rem; background: rgba(0,0,0,0.04); color: var(--text-muted); padding: 2px 8px; border-radius: 6px; font-weight: 600;">👥 ${sug.companion}</span>
                <span style="font-size: 0.7rem; background: rgba(0,0,0,0.04); color: var(--text-muted); padding: 2px 8px; border-radius: 6px; font-weight: 600;">🚗 ${sug.transport}</span>
                <span style="font-size: 0.7rem; background: rgba(0,0,0,0.04); color: var(--text-muted); padding: 2px 8px; border-radius: 6px; font-weight: 600;">💰 ${sug.budget}</span>
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

    document.getElementById("planTargetName").innerHTML = `<span class="material-icons" style="vertical-align: middle; color: var(--primary-color);">location_on</span> ${spot.name} 行き旅行プラン設定`;
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