const initialCenter = [138.25, 36.20];
const initialZoom = 2;

const map = new maplibregl.Map({
    container: 'map', 
    style: 'https://demotiles.maplibre.org/style.json',
    center: initialCenter,
    zoom: initialZoom,
    bearing: 0, 
    pitch: 0    
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

const initialLocations = [
    { lng: 21.43, lat: 41.60, name: "イスカンダル", images: ["images/FGO_Iskandar1.png", "images/FGO_Iskandar2.png"], videos: ["HzLYW4FkfLw", "dHFuL9ZTy9c"] },
    { lng: 50.587, lat: 36.396, name: "ハサン・サッバーフ", images: ["images/FGO_Hassan1.png", "images/FGO_Hassan2.png", "images/FGO_Hassan3.png", "images/FGO_Hassan4.png", "images/FGO_Hassan5.png"], videos: ["zIdo87JWR1E", "3H5M06Lq2OU", "6uLCm033Qgk", "BvLG5KsM31w", "1OvE-02E-tE", "-ep2lUo0BlI"] },
    { lng: -6.41, lat: 53.88, name: "クー・フーリン", images: ["images/FGO_Cu_Chulainn1.png", "images/FGO_Cu_Chulainn2.png"], videos: ["Oe1id7KeqmE", "rs-Thsmw9vg"]},
    { lng: -4.45, lat: 50.40, name: "アーサー王", images: ["images/FGO_Arthur1.png"], videos: ["4LCSTRy-P8M", "E3EAHZiBx3k"]},
    { lng: 86.93, lat: 25.26, name: "カルナ", images: ["images/FGO_Karna1.png", "images/FGO_Karna2.png"], videos: ["yTZs2V66LlE", "RQ8BJ3oi0mw"]},
    { lng: -4.08, lat: 53.02, name: "マーリン", images: ["images/FGO_Merlin1.png", "images/FGO_Merlin2.png"], videos: ["VzI1rpiu6rY", "9txN7o21NwM"]},
    { lng: 77.24, lat: 28.61, name: "アルジュナ", images: ["images/FGO_Arjuna1.png", "images/FGO_Arjuna2.png"], videos: ["I_BLZ8WCboM", "-6cDTRVlqbw"]},
    { lng: 8.67, lat: 49.79, name: "フランケンシュタイン", images: ["images/FGO_Frankenstein1.png"], videos: ["mau0Jfmsh8I", "PXJCQiz_rEI"]},
    { lng: 22.31, lat: 38.74, name: "ヘラクレス", images: ["images/FGO_Heracles1.png"], videos: ["oRyFnJxxGTo"]},
    { lng: 45.636, lat: 31.322, name: "ギルガメッシュ", images: ["images/FGO_Gilgamesh1.png", "images/FGO_Gilgamesh2.png", "images/FGO_Gilgamesh3.png", "images/FGO_Gilgamesh4.png"], videos: ["ZcoQ8Pd2FgQ", "bKJKy3MrBBs", "urHD_TYhWBQ"]},
    { lng: 107.240, lat: 34.296, name: "太公望", images: ["images/FGO_Taikoubou1.png", "images/FGO_Taikoubou2.png"], videos:["gXWXSNt3U8M"]},
    { lng: 138.204, lat: 37.145, name: "上杉謙信", images: ["images/FGO_Uesugi_Kenshin1.png", "images/FGO_Uesugi_Kenshin2.png"], videos: ["mmciVJjYZco", "TH1YZSW3bWQ"] },
    { lng: 138.577, lat: 35.686, name: "武田信玄", images: ["images/FGO_Takeda_Shingen1.png", "images/FGO_Takeda_Shingen2.png"], videos:["ZshCAp4_C24"]},
];

// データの保存と読み込み機能
const STORAGE_KEY = 'heroMapLocationsData';

function loadLocations() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        try {
            return JSON.parse(storedData);
        } catch (e) {
            console.error("保存データの読み込みに失敗しました", e);
        }
    }
    return initialLocations;
}

function saveLocations() {
    const locationsToSave = appData.map(data => data.loc);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(locationsToSave));
        return true;
    } catch (e) {
        console.error("保存容量エラー:", e);
        alert("⚠️ ブラウザの保存容量（約5MB）の上限に達しました！\n\nパソコン内の「動画」や「大量の画像」をファイル選択から直接追加すると容量オーバーになります。\n大きいファイルは直接追加せず、HTMLファイルと同じフォルダに置いて、ファイル名（例: videos/movie.mp4）をテキストで入力する方法をおすすめします。");
        return false;
    }
}

const appData = [];
let activeStyle = 'default'; 

// YouTubeのID抽出、またはローカル動画パス（mp4等）の許可
function sanitizeVideoList(videos) {
    return Array.isArray(videos)
        ? videos.map(v => {
            if (!v) return '';
            const str = String(v).trim();
            // Data URI や ローカルファイルのパス (mp4等) の場合はそのまま許可
            if (str.startsWith('data:video/') || str.match(/\.(mp4|webm|ogg)$/i)) {
                return str;
            }
            // YouTubeの場合
            const ytMatch = str.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/);
            if (ytMatch) return ytMatch[1];
            return /^[A-Za-z0-9_-]{11}$/.test(str) ? str : '';
        }).filter(Boolean)
        : [];
}

// ファイルをBase64データ(Data URL)に変換する関数
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function addLocationToMap(loc) {
    const listContainer = document.getElementById('location-list');
    const videos = sanitizeVideoList(loc.videos);

    const popupContainer = document.createElement('div');
    popupContainer.className = 'popup-container';

    const titleSpan = document.createElement('div');
    titleSpan.innerHTML = `<strong>${loc.name}</strong>`;
    
    const mediaBox = document.createElement('div');
    mediaBox.className = 'popup-media-box';

    let hasMedia = false;
    let currentRandomImgIndex = -1;
    let currentRandomVidIndex = -1;
    let imgElement = null;
    let ytWrapper = null; // 動画要素を包むコンテナ

    // 画像の処理
    if (loc.images && loc.images.length > 0) {
        currentRandomImgIndex = Math.floor(Math.random() * loc.images.length);
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'media-item';
        imgElement = document.createElement('img');
        imgElement.src = loc.images[currentRandomImgIndex];
        imgElement.style.width = '100%'; imgElement.style.height = '100%';
        imgElement.style.objectFit = 'contain'; imgElement.style.borderRadius = '4px';
        imgWrapper.appendChild(imgElement);
        mediaBox.appendChild(imgWrapper);
        hasMedia = true;
    }

    // 動画の生成処理（YouTubeとローカル動画の切り替え）
    function renderPopupVideo(src) {
        ytWrapper.innerHTML = '';
        let el;
        if (/^[A-Za-z0-9_-]{11}$/.test(src)) { // YouTubeの場合
            el = document.createElement('iframe');
            el.src = `https://www.youtube.com/embed/${src}`;
            el.style.border = 'none';
            el.setAttribute('allowfullscreen', '');
        } else { // ローカル動画(.mp4)やData URIの場合
            el = document.createElement('video');
            el.src = src;
            el.controls = true;
            el.style.backgroundColor = '#000';
            el.style.objectFit = 'contain';
        }
        el.style.width = '100%'; el.style.height = '100%'; el.style.borderRadius = '4px';
        ytWrapper.appendChild(el);
    }

    if (videos.length > 0) {
        currentRandomVidIndex = Math.floor(Math.random() * videos.length);
        ytWrapper = document.createElement('div');
        ytWrapper.className = 'media-item';
        renderPopupVideo(videos[currentRandomVidIndex]);
        mediaBox.appendChild(ytWrapper);
        hasMedia = true;
    }

    if (hasMedia) { mediaBox.classList.add('has-media'); } 
    else { mediaBox.innerHTML = '<span style="font-size:11px; color:#778899;">No Media</span>'; }

    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'popup-zoom-btn';
    zoomBtn.innerText = '全画面表示';

    popupContainer.appendChild(titleSpan);
    popupContainer.appendChild(mediaBox);
    popupContainer.appendChild(zoomBtn);

    const popup = new maplibregl.Popup({ offset: 25, closeOnClick: false })
        .setLngLat([loc.lng, loc.lat]) 
        .setDOMContent(popupContainer);

    // ポップアップを開き直すたびにランダム表示
    popup.on('open', () => {
        if (loc.images && loc.images.length > 1 && imgElement) {
            currentRandomImgIndex = Math.floor(Math.random() * loc.images.length);
            imgElement.src = loc.images[currentRandomImgIndex];
        }
        if (videos.length > 1 && ytWrapper) {
            currentRandomVidIndex = Math.floor(Math.random() * videos.length);
            renderPopupVideo(videos[currentRandomVidIndex]);
        }
    });

    // 全画面表示機能
    zoomBtn.onclick = (e) => {
        e.stopPropagation();
        const modal = document.getElementById('fullscreen-modal');
        const contentBox = document.getElementById('fullscreen-content');
        contentBox.innerHTML = '';

        const titleText = document.createElement('h2');
        titleText.style.color = '#333'; titleText.innerText = loc.name;
        titleText.style.margin = '0 0 20px 0';
        contentBox.appendChild(titleText);

        // 画像カルーセル
        if (loc.images && loc.images.length > 0) {
            let activeImgIdx = currentRandomImgIndex !== -1 ? currentRandomImgIndex : 0;
            const container = document.createElement('div');
            container.className = 'media-carousel-container';
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'media-item';
            const img = document.createElement('img');
            img.src = loc.images[activeImgIdx];
            img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'contain';
            imgWrapper.appendChild(img);
            container.appendChild(imgWrapper);

            if (loc.images.length > 1) {
                const controls = document.createElement('div'); controls.className = 'carousel-controls';
                const prevBtn = document.createElement('button'); prevBtn.className = 'carousel-btn'; prevBtn.innerText = '◀ 前の画像';
                const indicator = document.createElement('span'); indicator.innerText = `${activeImgIdx + 1} / ${loc.images.length}`;
                const nextBtn = document.createElement('button'); nextBtn.className = 'carousel-btn'; nextBtn.innerText = '次の画像 ▶';

                prevBtn.onclick = () => {
                    activeImgIdx = (activeImgIdx - 1 + loc.images.length) % loc.images.length;
                    img.src = loc.images[activeImgIdx];
                    indicator.innerText = `${activeImgIdx + 1} / ${loc.images.length}`;
                };
                nextBtn.onclick = () => {
                    activeImgIdx = (activeImgIdx + 1) % loc.images.length;
                    img.src = loc.images[activeImgIdx];
                    indicator.innerText = `${activeImgIdx + 1} / ${loc.images.length}`;
                };
                controls.appendChild(prevBtn); controls.appendChild(indicator); controls.appendChild(nextBtn);
                container.appendChild(controls);
            }
            contentBox.appendChild(container);
        }

        // 動画カルーセル（YouTubeとローカル動画対応）
        if (videos.length > 0) {
            let activeVidIdx = currentRandomVidIndex !== -1 ? currentRandomVidIndex : 0;
            const container = document.createElement('div');
            container.className = 'media-carousel-container';
            const vidWrapper = document.createElement('div');
            vidWrapper.className = 'media-item';
            
            function createFullscreenVideo(src) {
                vidWrapper.innerHTML = '';
                let el;
                if (/^[A-Za-z0-9_-]{11}$/.test(src)) {
                    el = document.createElement('iframe');
                    el.src = `https://www.youtube.com/embed/${src}`;
                    el.style.border = 'none';
                    el.setAttribute('allowfullscreen', '');
                } else {
                    el = document.createElement('video');
                    el.src = src;
                    el.controls = true;
                    el.style.backgroundColor = '#000';
                    el.style.objectFit = 'contain';
                }
                el.style.width = '100%'; el.style.height = '100%';
                vidWrapper.appendChild(el);
            }
            
            createFullscreenVideo(videos[activeVidIdx]);
            container.appendChild(vidWrapper);

            if (videos.length > 1) {
                const controls = document.createElement('div'); controls.className = 'carousel-controls';
                const prevBtn = document.createElement('button'); prevBtn.className = 'carousel-btn'; prevBtn.innerText = '◀ 前の動画';
                const indicator = document.createElement('span'); indicator.innerText = `${activeVidIdx + 1} / ${videos.length}`;
                const nextBtn = document.createElement('button'); nextBtn.className = 'carousel-btn'; nextBtn.innerText = '次の動画 ▶';

                prevBtn.onclick = () => {
                    activeVidIdx = (activeVidIdx - 1 + videos.length) % videos.length;
                    createFullscreenVideo(videos[activeVidIdx]);
                    indicator.innerText = `${activeVidIdx + 1} / ${videos.length}`;
                };
                nextBtn.onclick = () => {
                    activeVidIdx = (activeVidIdx + 1) % videos.length;
                    createFullscreenVideo(videos[activeVidIdx]);
                    indicator.innerText = `${activeVidIdx + 1} / ${videos.length}`;
                };
                controls.appendChild(prevBtn); controls.appendChild(indicator); controls.appendChild(nextBtn);
                container.appendChild(controls);
            }
            contentBox.appendChild(container);
        }
        modal.classList.add('active');
    };

    const defaultMarker = new maplibregl.Marker({ color: 'red' }).setLngLat([loc.lng, loc.lat]).setPopup(popup);
    const chaldeaImg = document.createElement('img'); chaldeaImg.src = 'images/Chaldea.png'; chaldeaImg.style.width = '20px'; chaldeaImg.style.height = '20px'; chaldeaImg.style.cursor = 'pointer';
    const chaldeaMarker = new maplibregl.Marker({ element: chaldeaImg }).setLngLat([loc.lng, loc.lat]).setPopup(popup);
    const bigbenImg = document.createElement('img'); bigbenImg.src = 'images/Big Ben.png'; bigbenImg.style.width = '45px'; bigbenImg.style.height = '45px'; bigbenImg.style.cursor = 'pointer';
    const bigbenMarker = new maplibregl.Marker({ element: bigbenImg }).setLngLat([loc.lng, loc.lat]).setPopup(popup);

    if (activeStyle === 'chaldea') chaldeaMarker.addTo(map);
    else if (activeStyle === 'bigben') bigbenMarker.addTo(map);
    else defaultMarker.addTo(map);

    const item = document.createElement('div'); item.className = 'loc-item';
    const leftWrapper = document.createElement('div'); leftWrapper.style.display = 'flex'; leftWrapper.style.alignItems = 'center'; leftWrapper.style.gap = '8px'; leftWrapper.style.flex = '1';
    
    const chk = document.createElement('input'); chk.type = 'checkbox'; chk.checked = document.getElementById('toggle-markers-chk').checked; chk.style.cursor = 'pointer';
    chk.addEventListener('change', (e) => {
        const show = e.target.checked;
        defaultMarker.getElement().style.display = show ? 'block' : 'none';
        chaldeaMarker.getElement().style.display = show ? 'block' : 'none';
        bigbenMarker.getElement().style.display = show ? 'block' : 'none';
    });

    const nameSpan = document.createElement('div'); nameSpan.className = 'loc-name'; nameSpan.innerHTML = `<strong>${loc.name}</strong>`;
    leftWrapper.appendChild(chk); leftWrapper.appendChild(nameSpan);

    const delBtn = document.createElement('button'); delBtn.className = 'delete-btn'; delBtn.innerText = '削除';

    item.appendChild(leftWrapper); item.appendChild(delBtn);
    
    leftWrapper.onclick = (e) => {
        if (e.target.tagName.toLowerCase() !== 'input') {
            map.flyTo({ center: [loc.lng, loc.lat], zoom: 6 }); popup.addTo(map);
        }
    };

    const dataObj = { loc, defaultMarker, chaldeaMarker, bigbenMarker, popup, item, chk };
    appData.push(dataObj);

    delBtn.onclick = (e) => { e.stopPropagation(); removeLocation(dataObj); };
    listContainer.appendChild(item);

    const showMarkers = chk.checked;
    defaultMarker.getElement().style.display = showMarkers ? 'block' : 'none';
    chaldeaMarker.getElement().style.display = showMarkers ? 'block' : 'none';
    bigbenMarker.getElement().style.display = showMarkers ? 'block' : 'none';

    if (document.getElementById('toggle-popups-chk').checked) popup.addTo(map);

    return dataObj;
}

function removeLocation(dataObj) {
    dataObj.defaultMarker.remove(); dataObj.chaldeaMarker.remove(); dataObj.bigbenMarker.remove(); 
    dataObj.popup.remove(); dataObj.item.remove();   
    
    const index = appData.indexOf(dataObj);
    if (index > -1) {
        appData.splice(index, 1);
        saveLocations(); 
    }
}

map.on('style.load', () => {
    map.setProjection({ type: 'globe' });
    const locations = loadLocations();
    locations.forEach(loc => addLocationToMap(loc));
});

const toggleEditBtn = document.getElementById('toggle-edit-btn');
const editControls = document.getElementById('edit-controls');
toggleEditBtn.addEventListener('click', () => {
    const isActive = editControls.classList.toggle('active');
    toggleEditBtn.textContent = isActive ? '閉じる' : '編集メニューを開く';
    if (!isActive) {
        document.getElementById('location-list').classList.remove('delete-mode');
        document.getElementById('toggle-delete-mode-btn').style.background = '';
        document.getElementById('toggle-delete-mode-btn').style.color = '';
    }
});

const toggleDeleteModeBtn = document.getElementById('toggle-delete-mode-btn');
toggleDeleteModeBtn.addEventListener('click', () => {
    const list = document.getElementById('location-list');
    const isDeleteMode = list.classList.toggle('delete-mode');
    if (isDeleteMode) { toggleDeleteModeBtn.style.background = '#e74c3c'; toggleDeleteModeBtn.style.color = 'white'; } 
    else { toggleDeleteModeBtn.style.background = ''; toggleDeleteModeBtn.style.color = ''; }
});

const addModal = document.getElementById('add-modal');
document.getElementById('show-add-modal-btn').addEventListener('click', () => { addModal.classList.add('active'); });
document.getElementById('cancel-add-btn').addEventListener('click', () => { addModal.classList.remove('active'); });

function toHalfWidth(str) {
    if (!str) return "";
    let half = str.replace(/ /g, ''); 
    half = half.replace(/[０-９．]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    return half.replace(/[－ー−–—]/g, '-').trim();
}

// 保存ボタンの処理（ファイル読み込みの非同期対応）
document.getElementById('submit-add-btn').addEventListener('click', async () => {
    const btn = document.getElementById('submit-add-btn');
    const originalText = btn.innerText;
    btn.innerText = '処理中...';
    btn.disabled = true;

    try {
        const nameVal = document.getElementById('add-name').value.trim() || '名称未設定';
        const lngRaw = toHalfWidth(document.getElementById('add-lng').value);
        const latRaw = toHalfWidth(document.getElementById('add-lat').value);

        const imagesVal = document.getElementById('add-images').value.trim();
        const videosVal = document.getElementById('add-videos').value.trim();
        
        const imagesArray = imagesVal ? imagesVal.split(',').map(s => s.trim()).filter(Boolean) : [];
        const videosArray = videosVal ? videosVal.split(',').map(s => s.trim()).filter(Boolean) : [];

        const lngVal = parseFloat(lngRaw);
        const latVal = parseFloat(latRaw);

        if (isNaN(lngVal) || isNaN(latVal)) {
            alert('経度と緯度には正しい数字を入力してください。'); return;
        }
        if (lngVal < -180 || lngVal > 180 || latVal < -90 || latVal > 90) {
            alert('経度: -180〜180、緯度: -90〜90 の間で入力してください。'); return;
        }

        const localImgFiles = document.getElementById('add-local-images').files;
        for (let i = 0; i < localImgFiles.length; i++) {
            const dataUrl = await readFileAsDataURL(localImgFiles[i]);
            imagesArray.push(dataUrl);
        }

        const localVidFiles = document.getElementById('add-local-videos').files;
        for (let i = 0; i < localVidFiles.length; i++) {
            const dataUrl = await readFileAsDataURL(localVidFiles[i]);
            videosArray.push(dataUrl);
        }

        const newLoc = { name: nameVal, lng: lngVal, lat: latVal, images: imagesArray, videos: videosArray };
        const newObj = addLocationToMap(newLoc);
        
        saveLocations(); 

        map.flyTo({ center: [lngVal, latVal], zoom: 6 });
        newObj.popup.addTo(map);

        // フォームのリセット
        document.getElementById('add-name').value = '';
        document.getElementById('add-lng').value = '';
        document.getElementById('add-lat').value = '';
        document.getElementById('add-images').value = ''; 
        document.getElementById('add-videos').value = ''; 
        document.getElementById('add-local-images').value = '';
        document.getElementById('add-local-videos').value = '';
        addModal.classList.remove('active');

    } catch(e) {
        console.error(e);
        alert("ファイルの追加中にエラーが発生しました。");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

document.getElementById('fast-map-btn').addEventListener('click', () => {
    map.flyTo({ center: initialCenter, zoom: initialZoom, bearing: 0, pitch: 0, speed: 1.2 });
    if (!document.getElementById('toggle-popups-chk').checked) { appData.forEach(data => data.popup.remove()); }
});

document.getElementById('toggle-markers-chk').addEventListener('change', (e) => {
    const show = e.target.checked;
    appData.forEach(data => {
        data.defaultMarker.getElement().style.display = show ? 'block' : 'none';
        data.chaldeaMarker.getElement().style.display = show ? 'block' : 'none';
        data.bigbenMarker.getElement().style.display = show ? 'block' : 'none';
        if (data.chk) data.chk.checked = show; 
    });
});

document.getElementById('toggle-popups-chk').addEventListener('change', (e) => {
    const show = e.target.checked;
    appData.forEach(data => { if (show) data.popup.addTo(map); else data.popup.remove(); });
});

let isGlobeMode = true;
const toggleMapModeBtn = document.getElementById('toggle-map-mode-btn');
toggleMapModeBtn.addEventListener('click', (e) => {
    isGlobeMode = !isGlobeMode;
    if (isGlobeMode) { map.setProjection({ type: 'globe' }); e.target.textContent = '2Dマップに切り替える'; } 
    else { map.setProjection({ type: 'mercator' }); e.target.textContent = '3Dマップに切り替える'; }
});

const markerToggleBtn = document.getElementById('marker-toggle-btn');
const markerDropdownMenu = document.getElementById('marker-dropdown-menu');

markerToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); markerDropdownMenu.classList.toggle('show'); });

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        activeStyle = item.getAttribute('data-value');
        document.querySelectorAll('.menu-item').forEach(btn => btn.classList.remove('selected'));
        item.classList.add('selected');
        markerDropdownMenu.classList.remove('show');

        appData.forEach(data => {
            data.defaultMarker.remove(); data.chaldeaMarker.remove(); data.bigbenMarker.remove();
            if (activeStyle === 'chaldea') data.chaldeaMarker.addTo(map);
            else if (activeStyle === 'bigben') data.bigbenMarker.addTo(map);
            else data.defaultMarker.addTo(map);

            const showMarkers = data.chk.checked;
            data.defaultMarker.getElement().style.display = showMarkers ? 'block' : 'none';
            data.chaldeaMarker.getElement().style.display = showMarkers ? 'block' : 'none';
            data.bigbenMarker.getElement().style.display = showMarkers ? 'block' : 'none';
        });
    });
});

document.addEventListener('click', () => { markerDropdownMenu.classList.remove('show'); });

const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
const sidebar = document.getElementById('sidebar');
const resizer = document.getElementById('resizer');
const mapContainer = document.getElementById('map-container');
let lastSidebarWidth = '300px'; let isResizing = false;

toggleSidebarBtn.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    resizer.classList.toggle('hidden');
    if (isCollapsed) { toggleSidebarBtn.textContent = 'リストを開く'; } 
    else { toggleSidebarBtn.textContent = 'リストを閉じる'; sidebar.style.width = lastSidebarWidth; }
    map.resize(); setTimeout(() => map.resize(), 50);
});

resizer.addEventListener('mousedown', (e) => {
    if (sidebar.classList.contains('collapsed')) return;
    isResizing = true; document.body.style.cursor = 'col-resize'; mapContainer.style.pointerEvents = 'none'; e.preventDefault(); 
});
document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    let newWidth = e.clientX;
    if (newWidth > 150 && newWidth < window.innerWidth * 0.8) {
        lastSidebarWidth = newWidth + 'px'; sidebar.style.width = lastSidebarWidth; map.resize(); 
    }
});
document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false; document.body.style.cursor = 'default'; mapContainer.style.pointerEvents = 'auto'; map.resize(); 
    }
});

document.getElementById('fullscreen-close-btn').addEventListener('click', () => {
    const modal = document.getElementById('fullscreen-modal');
    modal.classList.remove('active'); 
    document.getElementById('fullscreen-content').innerHTML = '';
});

const welcomeImages = ["images/FGO1.png", "images/FGO2.png", "images/FGO3.png", "images/FGO4.png"];
window.addEventListener('DOMContentLoaded', () => {
    const randomIdx = Math.floor(Math.random() * welcomeImages.length);
    const welcomeImgEl = document.getElementById('welcome-bg-image');
    if (welcomeImgEl) welcomeImgEl.src = welcomeImages[randomIdx];
});

const welcomeOverlay = document.getElementById('welcome-overlay');
if (welcomeOverlay) {
    welcomeOverlay.addEventListener('click', () => {
        welcomeOverlay.classList.add('fade-out');
        setTimeout(() => {
            welcomeOverlay.style.display = 'none';
            if (typeof map !== 'undefined') map.resize();
        }, 1000);
    });
}