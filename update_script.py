import re
import sys

def update_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Normalize newlines
    has_crlf = '\r\n' in content
    newline = '\r\n' if has_crlf else '\n'

    # 1. Ensure authReadyPromise exists cleanly
    auth_ready_block = f"""// 認証確定を待つ Promise (A6: 初回 onAuthStateChanged コールバックで解決)
let resolveAuthReady;
export const authReadyPromise = new Promise((resolve) => {{
    resolveAuthReady = resolve;
}});
window.authReadyPromise = authReadyPromise;"""

    # If it has garbled comment or existing resolveAuthReady, replace it cleanly
    pattern_auth_ready = re.compile(
        r'(//[^\n]*\n)?let resolveAuthReady;\s*\nexport const authReadyPromise = new Promise\(\(resolve\) => \{\s*\n\s*resolveAuthReady = resolve;\s*\n\}\);\s*\nwindow\.authReadyPromise = authReadyPromise;',
        re.MULTILINE
    )
    if pattern_auth_ready.search(content):
        content = pattern_auth_ready.sub(auth_ready_block, content, count=1)
    else:
        # insert after window._analytics = analytics;
        content = content.replace(
            "window._analytics = analytics;",
            f"window._analytics = analytics;\n\n{auth_ready_block}"
        )

    # 2. Fix getAuthHeaders
    get_auth_headers_block = f"""async function getAuthHeaders() {{
    await authReadyPromise;
    const headers = {{ 'Content-Type': 'application/json' }};
    if (auth && auth.currentUser) {{
        try {{
            const token = await auth.currentUser.getIdToken();
            if (token) headers['Authorization'] = `Bearer ${{token}}`;
        }} catch (e) {{
            console.warn("Failed to get Firebase ID token:", e);
        }}
    }}
    return headers;
}}
window.getAuthHeaders = getAuthHeaders;"""

    pattern_headers = re.compile(
        r'async function getAuthHeaders\(\) \{[\s\S]*?window\.getAuthHeaders = getAuthHeaders;',
        re.MULTILINE
    )
    content = pattern_headers.sub(get_auth_headers_block, content, count=1)

    # 3. Replace photo handling block (AsyncQueue, imageObserver, NO_IMAGE_URL, fetchPlacePhoto)
    photo_block = f"""// ==========================================
// 🌟 写真取得用のキャッシュ・キュー・重複排除
// ==========================================
const pendingPhotoRequests = new Map();

class AsyncQueue {{
    constructor(concurrency = 3) {{
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }}

    enqueue(task) {{
        return new Promise((resolve, reject) => {{
            this.queue.push({{ task, resolve, reject }});
            this.dequeue();
        }});
    }}

    dequeue() {{
        if (this.running >= this.concurrency || this.queue.length === 0) {{
            return;
        }}
        const {{ task, resolve, reject }} = this.queue.shift();
        this.running++;
        task()
            .then(resolve)
            .catch(reject)
            .finally(() => {{
                this.running--;
                this.dequeue();
            }});
    }}
}}

const photoQueue = new AsyncQueue(3);

// ==========================================
// 🌟 429エラー対策: 画像の遅延読み込み (Lazy Loading) オブザーバー
// ==========================================
const imageObserver = new IntersectionObserver((entries, observer) => {{
    entries.forEach(entry => {{
        if (entry.isIntersecting) {{
            const card = entry.target;
            const placeName = card.dataset.placeName;
            const imgEl = card.querySelector('img');

            if (placeName && imgEl && (imgEl.src.includes('unsplash.com') || imgEl.src.includes('loremflickr.com') || imgEl.src === NO_IMAGE_URL || !imgEl.src)) {{
                fetchPlacePhoto(placeName).then(url => {{
                    const resolvedUrl = (url && !url.includes('placehold.co')) ? url : NO_IMAGE_URL;
                    imgEl.src = resolvedUrl;
                    const place = kinkiPlaces.find(p => p.name === placeName);
                    if (place) place.img = resolvedUrl;
                }});
            }}
            observer.unobserve(card);
        }}
    }});
}}, {{
    rootMargin: '100px 0px',
    threshold: 0.1
}});

// ==========================================
// 🌟 本物の Google Places API を呼び出す関数
// ==========================================
const NO_IMAGE_URL = "https://placehold.co/800x600/e2e8f0/94a3b8?text=No+Image";

window.fetchPlacePhoto = async function (placeName) {{
    if (!placeName) return NO_IMAGE_URL;

    if (typeof placeName === 'string' && placeName.startsWith("http")) {{
        return placeName;
    }}

    // 1. sessionStorage キャッシュ確認（同一 placeName は再リクエストしない）
    const cacheKey = `place_photo_${{placeName}}`;
    try {{
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {{
            return cached;
        }}
    }} catch (e) {{ }}

    // 2. 同一 placeName の進行中 Promise があれば共有（重複リクエスト排除）
    if (pendingPhotoRequests.has(placeName)) {{
        return pendingPhotoRequests.get(placeName);
    }}

    const requestPromise = (async () => {{
        try {{
            // 認証確定を待つ
            await authReadyPromise;

            // 未ログイン状態（currentUser が null）のときは API を呼ばずスキップ
            if (!auth || !auth.currentUser) {{
                return NO_IMAGE_URL;
            }}

            // 同時実行キュー（同時3件に制限）経由で実行
            return await photoQueue.enqueue(async () => {{
                // キュー待機中にキャッシュされたか再チェック
                try {{
                    const cached = sessionStorage.getItem(cacheKey);
                    if (cached) return cached;
                }} catch (e) {{ }}

                const url = new URL("https://tripdevelopment2.onrender.com/api/travel/places");

                const doFetch = async (forceRefresh = false) => {{
                    let token = null;
                    if (auth && auth.currentUser) {{
                        try {{
                            token = await auth.currentUser.getIdToken(forceRefresh);
                        }} catch (e) {{
                            console.warn("Failed to get Firebase token:", e);
                        }}
                    }}
                    if (!token) return null;

                    const headers = {{
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${{token}}`
                    }};

                    return await fetch(url, {{
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({{ textQuery: placeName, purpose: "photo", languageCode: "ja" }})
                    }});
                }};

                let response = await doFetch(false);

                // 401 が返ったときは getIdToken(true) で強制更新して 1 回だけ再試行
                if (response && response.status === 401 && auth && auth.currentUser) {{
                    console.warn(`[Places API 401] トークンを強制更新して再試行します: ${{placeName}}`);
                    response = await doFetch(true);
                }}

                if (!response || !response.ok) {{
                    console.warn(`[Places API] 写真取得失敗 (Status: ${{response ? response.status : 'No response'}}): ${{placeName}}`);
                    return NO_IMAGE_URL;
                }}

                const data = await response.json();
                if (data.places && data.places.length > 0 && data.places[0].photos && data.places[0].photos.length > 0) {{
                    const photoName = data.places[0].photos[0].name;
                    const photoUrl = `https://tripdevelopment2.onrender.com/api/travel/photo?name=${{encodeURIComponent(photoName)}}&maxWidthPx=800`;
                    try {{
                        sessionStorage.setItem(cacheKey, photoUrl);
                    }} catch (e) {{ }}
                    return photoUrl;
                }}

                return NO_IMAGE_URL;
            }});
        }} catch (error) {{
            console.warn(`[Places API] 写真取得エラー: ${{placeName}}`, error);
            return NO_IMAGE_URL;
        }} finally {{
            pendingPhotoRequests.delete(placeName);
        }}
    }})();

    pendingPhotoRequests.set(placeName, requestPromise);
    return requestPromise;
}};"""

    pattern_photo = re.compile(
        r'// ==========================================[\s\S]*?const imageObserver = new IntersectionObserver[\s\S]*?window\.fetchPlacePhoto = async function \(placeName\) \{[\s\S]*?\};\n',
        re.MULTILINE
    )
    content = pattern_photo.sub(photo_block + '\n\n', content, count=1)

    # 4. Update onAuthStateChanged
    auth_state_block = f"""// ログイン状態の監視とUI更新
let isAuthReadyResolved = false;
onAuthStateChanged(auth, (user) => {{
    if (!isAuthReadyResolved) {{
        isAuthReadyResolved = true;
        resolveAuthReady(user);
    }}
    isAuthStateResolved = true;
    updateAuthUI(user);
    if (user) {{
        // ログイン確定後、プレースホルダー状態の表示中カードがあれば写真を再取得
        refreshVisiblePlacePhotos();
    }}
    if (isSplashAnimationFinished) {{
        tryEnteringApp();
    }}
}});

function refreshVisiblePlacePhotos() {{
    if (!auth || !auth.currentUser) return;
    document.querySelectorAll('.spot-card[data-place-name]').forEach(card => {{
        const placeName = card.dataset.placeName;
        const imgEl = card.querySelector('img');
        if (placeName && imgEl && (imgEl.src === NO_IMAGE_URL || imgEl.src.includes('placehold.co'))) {{
            fetchPlacePhoto(placeName).then(url => {{
                const resolvedUrl = (url && !url.includes('placehold.co')) ? url : NO_IMAGE_URL;
                imgEl.src = resolvedUrl;
                const place = kinkiPlaces.find(p => p.name === placeName);
                if (place) place.img = resolvedUrl;
            }});
        }}
    }});
}}"""

    pattern_auth_change = re.compile(
        r'// ログイン状態の監視とUI更新\s*\nonAuthStateChanged\(auth, \(user\) => \{[\s\S]*?\}\);',
        re.MULTILINE
    )
    content = pattern_auth_change.sub(auth_state_block, content, count=1)

    # 5. Ensure safeFetchJson has await authReadyPromise;
    pattern_safe_fetch = re.compile(
        r'async function safeFetchJson\(url, options = \{\}\) \{\s*\n(\s*await authReadyPromise;\s*\n)?',
        re.MULTILINE
    )
    content = pattern_safe_fetch.sub("async function safeFetchJson(url, options = {}) {\n    await authReadyPromise;\n", content, count=1)

    if has_crlf:
        content = content.replace('\r\n', '\n').replace('\n', '\r\n')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file_path}")

if __name__ == '__main__':
    for p in ['public/script.js', 'script.js']:
        update_file(p)

