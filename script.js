// import { GoogleGenerativeAI } from 'https://unpkg.com/@google/generative-ai?module';

// const GEMINI_API_KEY = "AQ.Ab8RN6IW4MEgrWpFoWlrdvUI1GGqbZX1Q1S3W5DBBuG-Ut-m5w";
const OPENWEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY";
// const MODEL_NAME = 'gemini-2.0-flash';

let standStats = [50, 50, 50, 50, 50, 50];
let likes = [];
let anmaris = [];
let favorites = [];
let plans = [];

// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// =====================
// ビュー切り替え
// =====================
window.switchView = function(viewId, element) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(li => li.classList.remove('active'));
    if (element) element.classList.add('active');
    if (viewId === 'data') updateChart();
    if (viewId === 'home') updateHomeView();
};

// =====================
// ホーム画面
// =====================
function updateHomeView() {
    updateCountdown();
    updateGridCounts();
    fetchWeather();
}

function updateCountdown() {
    const el   = document.getElementById('countdownDays');
    const dest = document.getElementById('countdownDestination');
    if (plans.length === 0) {
        el.textContent   = '-- 日';
        dest.textContent = '予定を登録してね';
        return;
    }
    const next = [...plans].sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    const diff = Math.ceil((new Date(next.date) - new Date()) / (1000 * 60 * 60 * 24));
    el.textContent   = `${diff} 日`;
    dest.textContent = `📍 ${next.destination}`;
}

function updateGridCounts() {
    document.getElementById('favCount').textContent        = favorites.length;
    document.getElementById('recentLikeCount').textContent = likes.length;
    document.getElementById('planCount').textContent       = plans.length;
    document.getElementById('anmariCount').textContent     = anmaris.length;
}

async function fetchWeather() {
    if (plans.length === 0 || OPENWEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY') return;
    const next = [...plans].sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    try {
        const res  = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${next.lat}&lon=${next.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=ja`);
        const data = await res.json();
        const iconMap = {'01':'☀️','02':'🌤️','03':'☁️','04':'☁️','09':'🌧️','10':'🌦️','11':'⛈️','13':'❄️','50':'🌫️'};
        const code = data.weather[0].icon.slice(0, 2);
        document.getElementById('weatherIcon').textContent     = iconMap[code] || '🌤️';
        document.getElementById('weatherTemp').textContent     = `${Math.round(data.main.temp)}°C`;
        document.getElementById('weatherDesc').textContent     = data.weather[0].description;
        document.getElementById('weatherLocation').textContent = `📍 ${next.destination}の天気`;
    } catch (e) {
        console.warn('天気取得失敗', e);
    }
}

// =====================
// スライダー（フェード）
// =====================
let currentSlide = 0;
let sliderInterval;

window.goToSlide = function(index) {
    const slides = document.querySelectorAll('.home-slide');
    const dots   = document.querySelectorAll('.dot');
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    currentSlide = index;
};

function startSliderAuto() {
    clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        goToSlide((currentSlide + 1) % 2);
    }, 4000);
}

function initSliderSwipe() {
    const wrapper = document.querySelector('.home-slider-wrapper');
    if (!wrapper) return;
    let startX = 0;
    wrapper.addEventListener('pointerdown', e => { startX = e.clientX; });
    wrapper.addEventListener('pointerup', e => {
        const diff = e.clientX - startX;
        if (Math.abs(diff) > 50) {
            const next = diff < 0 ? Math.min(currentSlide + 1, 1) : Math.max(currentSlide - 1, 0);
            goToSlide(next);
            clearInterval(sliderInterval);
            startSliderAuto();
        }
    });
}

// =====================
// モーダル
// =====================
window.openModal = function(type) {
    const overlay = document.getElementById('modal-overlay');
    const title   = document.getElementById('modalTitle');
    const body    = document.getElementById('modalBody');

    const configs = {
        'favorites':    { label: '⭐ お気に入り',   list: favorites, emptyMsg: 'まだお気に入りがありません' },
        'recent-likes': { label: '❤️ 最近いいね',   list: likes,     emptyMsg: 'まだいいねがありません' },
        'plans':        { label: '📅 旅行予定',      list: plans,     emptyMsg: '予定がまだありません' },
        'anmari':       { label: '😐 あんまりリスト', list: anmaris,   emptyMsg: 'まだありません' },
    };

    const cfg = configs[type];
    title.textContent = cfg.label;

    if (cfg.list.length === 0) {
        body.innerHTML = `<div class="modal-empty">${cfg.emptyMsg}</div>`;
    } else if (type === 'anmari') {
        const now = Date.now();
        body.innerHTML = cfg.list.map(a => {
            const daysLeft = 15 - Math.floor((now - (a.savedAt || now)) / (1000 * 60 * 60 * 24));
            return `<div class="modal-item">
                <div>
                    <div class="modal-item-name">${a.name}</div>
                    <div class="modal-item-sub">${a.description || ''}</div>
                </div>
                <span class="modal-item-days">あと${daysLeft}日</span>
            </div>`;
        }).join('');
    } else if (type === 'plans') {
        body.innerHTML = cfg.list.length === 0
            ? `<div class="modal-empty">${cfg.emptyMsg}</div>`
            : cfg.list.map(p => `<div class="modal-item">
                <div>
                    <div class="modal-item-name">📍 ${p.destination}</div>
                    <div class="modal-item-sub">${p.date}</div>
                </div>
            </div>`).join('');
    } else {
        body.innerHTML = cfg.list.map(item => `
            <div class="modal-item">
                <div>
                    <div class="modal-item-name">${item.name}</div>
                    <div class="modal-item-sub">${item.description || ''}</div>
                </div>
            </div>`).join('');
    }

    overlay.classList.remove('hidden');
};

window.closeModal = function() {
    document.getElementById('modal-overlay').classList.add('hidden');
};

// =====================
// 探す（スワイプ）
// =====================
async function initApp() {
    goToSlide(0);
    initSliderSwipe();
    startSliderAuto();
    createCards(dummyPlaces);
}

// ダミーデータ（Gemini API復活時はコメントアウトして fetchGeminiPlaces() に戻す）
const dummyPlaces = [
    { id: 0, name: '嵐山竹林', category: 'nature', description: '京都を代表する竹林の小径。朝早い時間帯は観光客も少なく幻想的な雰囲気が漂う。', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400' },
    { id: 1, name: '道頓堀', category: 'food', description: '大阪グルメの聖地。たこ焼き・串カツなど食べ歩きが楽しめる活気あふれるエリア。', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400' },
    { id: 2, name: '奈良公園', category: 'nature', description: '野生の鹿が自由に歩き回る国内唯一の公園。鹿せんべいで気軽に触れ合える。', img: 'https://images.unsplash.com/photo-1576675784201-0e142b423952?w=400' },
    { id: 3, name: '伏見稲荷大社', category: 'culture', description: '千本鳥居で有名な京都の神社。山頂まで続く朱色の鳥居のトンネルは圧巻。', img: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=400' },
    { id: 4, name: '有馬温泉', category: 'nature', description: '日本三古湯のひとつ。金泉・銀泉の2種類の泉質が楽しめる神戸近郊の名湯。', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400' },
    { id: 5, name: '錦市場', category: 'food', description: '京都の台所と呼ばれるアーケード商店街。漬物・湯葉など京都ならではの食材が並ぶ。', img: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400' },
    { id: 6, name: '姫路城', category: 'culture', description: '白鷺城の愛称で知られる国宝・世界遺産。日本最大級の木造城郭建築。', img: 'https://images.unsplash.com/photo-1533050487297-09b450131914?w=400' },
    { id: 7, name: '天橋立', category: 'nature', description: '日本三景のひとつ。股のぞきで有名な松林が続く砂嘴は絶景スポット。', img: 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=400' },
    { id: 8, name: '黒門市場', category: 'food', description: '大阪の台所。新鮮な海鮮・肉・野菜が揃い、その場で食べ歩きもできる。', img: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400' },
    { id: 9, name: '東大寺', category: 'culture', description: '世界最大級の木造建築・大仏殿に鎮座する奈良の大仏。柱の穴くぐりも有名。', img: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400' },
];

// async function fetchGeminiPlaces() {
//     const model  = genAI.getGenerativeModel({ model: MODEL_NAME });
//     const prompt = "あなたは近畿地方（兵庫・大阪・京都・奈良・滋賀・和歌山）の観光に精通したプランナーです。体験や文化を楽しめる、少しニッチで魅力的な観光スポットを10個提案してください。出力は必ず以下のキーを持つJSON配列の形式のみとしてください。マークダウン記法や解説は含めないでください。キー: id(0からの連番), name(スポット名), category('culture'または'nature'または'food'), description(特徴、100文字以内), img('https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400')";
//     const result = await model.generateContent(prompt);
//     const raw    = await result.response.text();
//     const clean  = raw.replace(/```json|```/g, '').trim();
//     createCards(JSON.parse(clean));
// }

function createCards(dataList) {
    const stack = document.getElementById('card-stack');
    stack.innerHTML = '';
    [...dataList].reverse().forEach(data => {
        const card = document.createElement('div');
        card.className = 'swipe-card';
        card.innerHTML = `
            <img src="${data.img}" class="card-img">
            <button class="card-star-btn" data-id="${data.id}">⭐</button>
            <div class="card-info">
                <h3>${data.name}</h3>
                <p>${data.description}</p>
            </div>
        `;
        // ⭐ボタン
        const starBtn = card.querySelector('.card-star-btn');
        starBtn.addEventListener('click', e => {
            e.stopPropagation();
            const already = favorites.some(f => f.id === data.id);
            if (already) {
                favorites = favorites.filter(f => f.id !== data.id);
                starBtn.classList.remove('starred');
            } else {
                favorites.push(data);
                starBtn.classList.add('starred');
            }
            updateGridCounts();
        });

        stack.appendChild(card);
        initDrag(card, data);
    });
}

function initDrag(card, data) {
    let startX = 0, currentX = 0;
    card.addEventListener('pointerdown', e => {
        startX = e.clientX;
        card.style.transition = 'none';
        card.setPointerCapture(e.pointerId);
    });
    card.addEventListener('pointermove', e => {
        if (startX === 0) return;
        currentX = e.clientX - startX;
        card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.1}deg)`;
    });
    card.addEventListener('pointerup', () => {
        if (Math.abs(currentX) > 120) {
            const dir = currentX > 0 ? 1 : -1;
            card.style.transition = '0.5s';
            card.style.transform  = `translateX(${dir * 1000}px) rotate(${dir * 90}deg)`;
            handleAction(dir > 0 ? 'like' : 'anmari', data);
            setTimeout(() => card.remove(), 500);
        } else {
            card.style.transition = '0.3s';
            card.style.transform  = 'translateX(0) rotate(0)';
        }
        startX = 0;
    });
}

function handleAction(type, data) {
    if (type === 'like') {
        if (!likes.some(l => l.id === data.id)) likes.push(data);
        if (data.category === 'culture') { standStats[4] += 5; standStats[5] += 5; }
        else if (data.category === 'nature')  { standStats[2] += 5; standStats[3] += 5; }
        else if (data.category === 'food')    { standStats[0] += 5; standStats[1] += 5; }
    } else {
        if (!anmaris.some(a => a.id === data.id)) anmaris.push({ ...data, savedAt: Date.now() });
    }
    if (!document.getElementById('view-home').classList.contains('hidden')) {
        updateGridCounts();
    }
}

// =====================
// スタンドチャート
// =====================
let myChart;
function updateChart() {
    const ctx = document.getElementById('standChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['破壊力', 'スピード', '射程距離', '持続力', '精密動作', '成長性'],
            datasets: [{
                data: standStats,
                fill: true,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderColor: '#ffffff',
                pointBackgroundColor: '#ffffff',
            }]
        },
        options: {
            scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.2)' } } },
            plugins: { legend: { display: false } }
        }
    });
}

initApp();