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
  apiKey: "AIzaSyCD2GZE-GhpCgLU9LN32lBAEq8e2y0EwDo",
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
let geminiApiKey = (localStorage.getItem("kw_gemini_apikey") || "").trim();

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

    if (user) {
        if (user.isAnonymous) {
            // ゲストログイン状態
            userName = "ゲストトラベラー";
            if (nameEl) nameEl.textContent = userName;
            if (statusEl) statusEl.textContent = "ゲストモードで利用中";
            
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
            
            if (settingsUserStatus) {
                settingsUserStatus.innerHTML = `
                    <div class="auth-status-card logged-in">
                        <span class="material-icons status-icon">verified_user</span>
                        <div>
                            <div class="status-title">同期完了</div>
                            <div class="status-email">${user.email}</div>
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
            if (viewId === "share" && labelText.includes("共有")) item.classList.add("active");
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
    if (viewId === "share") {
        renderShareView();
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
    activeFilters.category = catSelect ? catSelect.value : "all";

    // フィルタ条件に合致するスポットプールを作成
    currentCardPool = kinkiPlaces.filter(place => {
        const matchSeason = (activeFilters.season === "all" || place.season === activeFilters.season);
        const matchCat = (activeFilters.category === "all" || place.category === activeFilters.category);

        // すでに「いいね」または「あんまり」に入っているものは除く (リセットされない限り)
        const isAlreadySelected = likes.some(l => l.id === place.id) || anmaris.some(a => a.id === place.id);

        let matchRecommendation = true;
        if (recommendationMode) {
            const highestVal = Math.max(...standStats);
            const highestIndex = standStats.indexOf(highestVal);
            matchRecommendation = matchesGenre(place, highestIndex);
        }

        return matchSeason && matchCat && !isAlreadySelected && matchRecommendation;
    });

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
    const simulateError = document.getElementById("simulateApiError").checked;

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

    // 2. あんまり(anmaris)からの減算 (嗜好の除外を表現)
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
        "anmari": "「あんまり」としたスポットはありません。"
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