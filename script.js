/* =========================================
   AIMS 2.1.13 拓扑与图表逻辑
   ========================================= */

const CONFIG = {
    SVG_NAMESPACE: 'http://www.w3.org/2000/svg',
    BASE_WIDTH: 1920,
    BASE_SCALE: 0.75
};

const AppState = {
    activeNodeId: null,
    viewTransform: { scale: CONFIG.BASE_SCALE, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 },
    domNodes: {},
    roomNodes: [],
    activeConnections: [] 
};

function toggleMenu(menuId, headerElement) {
    const menu = document.getElementById(menuId);
    const parent = headerElement.parentElement;
    if (menu.style.maxHeight === '0px' || menu.style.maxHeight === '') {
        menu.style.maxHeight = '500px'; 
        parent.classList.add('group-expanded');
    } else {
        menu.style.maxHeight = '0px';
        parent.classList.remove('group-expanded');
    }
}
window.toggleMenu = toggleMenu;

const ICONS = {
    root: `<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="12" cy="4.5" r="0.5" fill="currentColor"/><circle cx="12" cy="19.5" r="0.5" fill="currentColor"/></svg>`,
    platform: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
    terminal: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
};

function generateChildren(prefix) {
    const list = [];
    const statuses = ['normal', 'normal', 'normal', 'warning', 'normal', 'error']; 
    for(let i=1; i<=6; i++) {
        const status = statuses[(i-1)%statuses.length];
        list.push({ id: `${prefix}-T${i}`, type: 'terminal', name: `Terminal-${i.toString().padStart(2,'0')}`, status: status, stats: { port: status==='error'?'Down':'UP' } });
    }
    return list;
}

const NODES = [
  { id: 'HQ', x: 960, y: 180, type: 'root', name: '总部管理平台', status: 'normal', stats: { ping: '1ms', loss: '0%' } },
  { id: 'P1', x: 400, y: 500, type: 'platform', name: '西北节点', status: 'normal', stats: { ping: '18ms' }, children: generateChildren('P1') },
  { id: 'P2', x: 680, y: 650, type: 'platform', name: '华东节点', status: 'warning', stats: { ping: '45ms' }, children: generateChildren('P2') },
  { id: 'P3', x: 960, y: 750, type: 'platform', name: '研发中心', status: 'normal', stats: { ping: '2ms' }, children: generateChildren('P3') },
  { id: 'P4', x: 1240, y: 650, type: 'platform', name: '华南节点', status: 'normal', stats: { ping: '15ms' }, children: generateChildren('P4') },
  { id: 'P5', x: 1520, y: 500, type: 'platform', name: '海外节点', status: 'error', stats: { ping: '420ms' }, children: generateChildren('P5') }
];

function initializeApp() {
    lucide.createIcons();
    initCharts(); 
    renderResources(); 
    initView(); 
    initEventListeners();
    
    const container = document.getElementById('nodes-container');
    if (container) {
      NODES.forEach(node => {
        const el = createNodeElement(node, 'platform');
        container.appendChild(el);
        AppState.domNodes[node.id] = el;
      });
    }
    createRootConnections();
    renderLoop();
}

function createNodeElement(nodeData, levelType) {
    const div = document.createElement('div');
    const statusClass = nodeData.status; 
    const iconSvg = ICONS[nodeData.type] || ICONS.terminal;
    div.className = `node-wrapper dynamic-node ${levelType === 'root' || levelType === 'platform' ? '' : 'hidden'}`;
    if (levelType === 'platform' || levelType === 'root') {
        div.style.left = nodeData.x + 'px'; div.style.top = nodeData.y + 'px'; div.classList.remove('dynamic-node', 'hidden');
    }
    div.dataset.id = nodeData.id;
    div.innerHTML = `<div class="node-content-group"><div class="node-visual ${nodeData.type === 'root' ? 'large' : 'medium'}"><div class="pulse-ring" style="color:${getStatusColor(statusClass)}"></div><div class="node-icon ${statusClass}">${iconSvg}</div></div><div class="node-name">${nodeData.name}</div></div>${createTooltip(nodeData)}`;
    return div;
}

function createTooltip(nodeData) {
    if (!nodeData.stats) return '';
    const color = getStatusColor(nodeData.status);
    const trafficLight = `<div class="stat-traffic-light"><span class="stat-dot" style="background:#30F0C0;box-shadow:0 0 5px #30F0C0"></span><span class="stat-dot" style="background:#F59E0B;box-shadow:0 0 5px #F59E0B"></span><span class="stat-dot" style="background:#F05213;box-shadow:0 0 5px #F05213"></span></div>`;
    return `<div class="node-tooltip" style="border-color:${color}"><div class="tooltip-header"><span>${nodeData.name}</span><span style="font-size:10px; opacity:0.6">${nodeData.type.toUpperCase()}</span></div><div class="tooltip-row"><span>PING</span><span style="color:${color}">${nodeData.stats.ping || '--'}</span></div><div class="tooltip-row"><span>STATS</span>${trafficLight}</div><div class="tooltip-actions"><div class="btn-mini" onclick="event.stopPropagation()">设备详情</div><div class="btn-mini" onclick="event.stopPropagation()">智能诊断</div></div></div>`;
}

function getStatusColor(status) { return status === 'error' ? '#F05213' : status === 'warning' ? '#F59E0B' : '#18F7F5'; }

async function enterPlatformView(platformData) {
    if (AppState.activeNodeId === platformData.id) { await resetToDefault(); return; }
    if (AppState.roomNodes.length > 0) { gracefulExit(AppState.roomNodes, 960, 450); AppState.roomNodes = []; }
    AppState.activeNodeId = platformData.id;
    Object.entries(AppState.domNodes).forEach(([id, el]) => {
        if (id === 'HQ') { el.style.opacity = '0'; el.style.pointerEvents = 'none'; }
        else if (id === platformData.id) { el.style.left = '960px'; el.style.top = '250px'; el.classList.add('is-active'); el.classList.remove('is-dimmed'); } 
        else { el.style.opacity = '0'; el.style.pointerEvents = 'none'; }
    });
    spawnSecondLevelNodes(platformData);
}
function spawnSecondLevelNodes(platformData) {
    if (!platformData.children) return;
    const count = platformData.children.length; const gap = 140; const startX = 960 - ((count - 1) * gap) / 2;
    platformData.children.forEach((child, index) => {
        const el = createNodeElement(child, child.type); el.style.left = '960px'; el.style.top = '250px';
        document.getElementById('nodes-container').appendChild(el); AppState.roomNodes.push({ el, data: child });
        createDynamicConnection(AppState.domNodes[platformData.id], el, child.status);
        requestAnimationFrame(() => { el.classList.remove('hidden'); el.classList.add('visible'); el.style.left = (startX + index * gap) + 'px'; el.style.top = '600px'; });
    });
}
async function resetToDefault() {
    AppState.activeNodeId = null;
    if (AppState.roomNodes.length > 0) { gracefulExit(AppState.roomNodes, 960, 250); AppState.roomNodes = []; }
    Object.entries(AppState.domNodes).forEach(([id, el]) => {
        const origin = NODES.find(n => n.id === id);
        if (origin) { el.style.left = origin.x + 'px'; el.style.top = origin.y + 'px'; }
        el.classList.remove('is-active', 'is-dimmed'); el.style.opacity = ''; el.style.pointerEvents = '';
    });
    AppState.activeConnections = AppState.activeConnections.filter(conn => { if (conn.isDynamic && conn.path.parentNode) { conn.path.parentNode.removeChild(conn.path); return false; } return true; });
}
function gracefulExit(nodeArray, targetX, targetY) {
    nodeArray.forEach(item => { item.el.style.left = targetX + 'px'; item.el.style.top = targetY + 'px'; item.el.style.opacity = '0'; setTimeout(() => { if(item.el.parentNode) item.el.parentNode.removeChild(item.el); }, 500); });
}
function createRootConnections() {
    const svgLayer = document.getElementById('svg-lines');
    NODES.forEach(node => { if (node.id === 'HQ') return; const path = document.createElementNS(CONFIG.SVG_NAMESPACE, 'path'); path.setAttribute('class', `connection-line status-${node.status}`); svgLayer.appendChild(path); AppState.activeConnections.push({ from: AppState.domNodes['HQ'], to: AppState.domNodes[node.id], path: path, isDynamic: false }); });
}
function createDynamicConnection(fromEl, toEl, status) {
    const svgLayer = document.getElementById('svg-lines');
    const path = document.createElementNS(CONFIG.SVG_NAMESPACE, 'path'); path.setAttribute('class', `connection-line status-${status}`); svgLayer.appendChild(path); AppState.activeConnections.push({ from: fromEl, to: toEl, path: path, isDynamic: true });
}
function renderLoop() {
    AppState.activeConnections.forEach(conn => {
        if (!conn.from || !conn.to) return;
        if (AppState.activeNodeId && !conn.isDynamic) conn.path.style.opacity = '0'; else conn.path.style.opacity = '0.5';
        const x1 = parseFloat(conn.from.style.left); const y1 = parseFloat(conn.from.style.top); const x2 = parseFloat(conn.to.style.left); const y2 = parseFloat(conn.to.style.top);
        const cpY = y1 + (y2 - y1) * 0.5; const d = `M ${x1} ${y1} C ${x1} ${cpY}, ${x2} ${cpY}, ${x2} ${y2}`; conn.path.setAttribute('d', d);
    });
    requestAnimationFrame(renderLoop);
}

function calculateLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let newScale = CONFIG.BASE_SCALE * (w / CONFIG.BASE_WIDTH);
    newScale = Math.min(Math.max(newScale, 0.55), 1.1);
    AppState.viewTransform.scale = newScale;

    const leftBarrierEnd = 240 + 340; 
    const rightBarrierStart = w - (40 + 400); 
    const visualCenterX = (leftBarrierEnd + rightBarrierStart) / 2;
    
    const targetCenterY = 220; 
    const hqNodeY = 180 * newScale;
    
    AppState.viewTransform.x = visualCenterX - (960 * newScale);
    AppState.viewTransform.y = targetCenterY - hqNodeY;

    const hintBox = document.getElementById('topo-hint-box');
    if (hintBox) {
        hintBox.style.left = visualCenterX + 'px';
        hintBox.style.transform = 'translateX(-50%)';
    }
}

function initView() { calculateLayout(); updateTransform(); }
function updateTransform() {
    const world = document.getElementById('canvas-world');
    if(world) { world.style.transformOrigin = '0 0'; world.style.transform = `translate(${AppState.viewTransform.x}px, ${AppState.viewTransform.y}px) scale(${AppState.viewTransform.scale})`; }
}

function initEventListeners() {
    const viewport = document.getElementById('viewport');
    viewport.addEventListener('mousedown', e => { if (e.target.closest('.node-wrapper')) return; AppState.viewTransform.isDragging = true; AppState.viewTransform.startX = e.clientX - AppState.viewTransform.x; AppState.viewTransform.startY = e.clientY - AppState.viewTransform.y; viewport.style.cursor = 'grabbing'; });
    window.addEventListener('mousemove', e => { if (!AppState.viewTransform.isDragging) return; e.preventDefault(); AppState.viewTransform.x = e.clientX - AppState.viewTransform.startX; AppState.viewTransform.y = e.clientY - AppState.viewTransform.startY; updateTransform(); });
    window.addEventListener('mouseup', () => { AppState.viewTransform.isDragging = false; viewport.style.cursor = 'grab'; });
    viewport.addEventListener('wheel', e => { e.preventDefault(); const factor = e.deltaY < 0 ? 1.1 : 0.9; const newScale = Math.min(Math.max(AppState.viewTransform.scale * factor, 0.4), 2.5); const worldX = (e.clientX - AppState.viewTransform.x) / AppState.viewTransform.scale; const worldY = (e.clientY - AppState.viewTransform.y) / AppState.viewTransform.scale; AppState.viewTransform.scale = newScale; AppState.viewTransform.x = e.clientX - worldX * newScale; AppState.viewTransform.y = e.clientY - worldY * newScale; updateTransform(); });
    window.addEventListener('resize', () => { initView(); Object.values(chartInstances).forEach(c => c.resize()); });
    document.getElementById('nodes-container').addEventListener('click', e => { const wrapper = e.target.closest('.node-wrapper'); if (!wrapper) return; const id = wrapper.dataset.id; const node = NODES.find(n => n.id === id); if (node && node.type === 'platform') enterPlatformView(node); else if (id === 'HQ') resetToDefault(); });
}

const chartInstances = {};
const commonTooltip = { backgroundColor: '#242424', borderColor: 'rgba(169, 77, 255, 0.25)', textStyle: { color: '#fff' }, padding: [8, 12] };
function generateWaveData(points, base, amp) { return Array.from({length: points}, (_, i) => Math.floor(base + Math.sin(i * 0.5) * amp + Math.random() * (amp/2))); }

function initCharts() {
    const healthDom = document.getElementById('chart-health');
    if (healthDom) {
        chartInstances.health = echarts.init(healthDom);
        chartInstances.health.setOption({
            tooltip: { ...commonTooltip, trigger: 'item' },
            series: [{ name: '健康度', type: 'pie', radius: ['80%', '95%'], center: ['50%', '50%'], avoidLabelOverlap: false, padAngle: 3, itemStyle: { borderRadius: 5, borderColor: '#000', borderWidth: 3 }, label: { show: false },
            data: [
                { value: 657, name: '优秀', itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#30F0C0'},{offset:1,color:'#1FA886'}]) } },
                { value: 394, name: '良好', itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#18F7F5'},{offset:1,color:'#0D8A89'}]) } },
                { value: 197, name: '一般', itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#F59E0B'},{offset:1,color:'#A86C08'}]) } },
                { value: 67, name: '较差', itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#F05213'},{offset:1,color:'#94330C'}]) } }
            ]}]
        });
    }
    const termDom = document.getElementById('chart-terminal');
    if (termDom) {
        chartInstances.terminal = echarts.init(termDom);
        const labels = ['09:00','','','','10:00','','','','11:00','','','','12:00','','','','13:00','','','','14:00','','','','15:00'];
        chartInstances.terminal.setOption({
            tooltip: { ...commonTooltip, trigger: 'axis' }, grid: { top: 20, bottom: 20, left: 35, right: 10 },
            xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#444' } }, axisLabel: { color: '#888', fontSize: 10, interval: 0, showMaxLabel: true, formatter: (val) => val }, axisTick: { show: false } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: '#333', type: 'dashed' } }, axisLabel: { color: '#888', fontSize: 10 } },
            series: [
                { name: '在线', type: 'line', smooth: true, showSymbol: false, data: generateWaveData(25, 1200, 150), itemStyle: { color: '#18F7F5' }, lineStyle: { width: 2 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset: 0, color: 'rgba(24, 247, 245, 0.3)'}, {offset: 1, color: 'transparent'}]) } },
                { name: '会议中', type: 'line', smooth: true, showSymbol: false, data: generateWaveData(25, 400, 100), itemStyle: { color: '#A94DFF' }, lineStyle: { width: 2 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset: 0, color: 'rgba(169, 77, 255, 0.3)'}, {offset: 1, color: 'transparent'}]) } }
            ]
        });
    }
    const meetDom = document.getElementById('chart-meeting');
    if (meetDom) {
        chartInstances.meeting = echarts.init(meetDom);
        const labels = ['09:00','','','','10:00','','','','11:00','','','','12:00','','','','13:00','','','','14:00','','',''];
        const dataCount = labels.length;
        chartInstances.meeting.setOption({
            tooltip: { ...commonTooltip, trigger: 'axis' }, grid: { top: 20, bottom: 20, left: 35, right: 10 },
            xAxis: { show: true, type: 'category', data: labels, axisLine: { lineStyle: { color: '#444' } }, axisLabel: { color: '#888', fontSize: 10, interval: 0, showMaxLabel: true, formatter: (val) => val }, boundaryGap: false },
            yAxis: { show: true, type: 'value', splitLine: { lineStyle: { color: '#333', type: 'dashed' } }, axisLabel: { color: '#888', fontSize: 10 } },
            series: [{ name: '会议数', type: 'line', smooth: true, showSymbol: false, 
                data: generateWaveData(dataCount, 30, 15), 
                itemStyle: { color: '#A94DFF' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset: 0, color: 'rgba(169, 77, 255, 0.3)'}, {offset: 1, color: 'transparent'}]) } 
            }]
        });
    }
}

function getResColor(pct) { if (pct < 40) return '#30F0C0'; if (pct < 70) return '#18F7F5'; if (pct < 90) return '#F59E0B'; return '#F05213'; }

function renderResources() {
    const resources = [{ name: "AP接入端口", total: 400, used: 200 }, { name: "MP媒体端口", total: 100, used: 65 }, { name: "录像资源", total: 200, used: 20 }, { name: "ASR转写", total: 500, used: 450 }, { name: "语音调度", total: 50, used: 15 }];
    const container = document.getElementById('resource-bars');
    if (!container) return;
    let html = '';
    resources.forEach(res => {
        const pct = Math.round((res.used / res.total) * 100);
        const color = getResColor(pct);
        const gradient = `linear-gradient(90deg, ${color}33 0%, ${color} 100%)`; 
        html += `<div class="res-bar-wrapper"><div class="res-bar-label"><span>${res.name}</span><span style="color:${color}">${pct}%</span></div><div class="res-bar-track"><div class="res-bar-fill" style="width: 0%; background: ${gradient}; box-shadow: 0 0 6px ${color}66" data-width="${pct}%"></div></div><div class="res-bar-details"><span>总数 ${res.total} / 可用 ${res.total - res.used}</span></div></div>`;
    });
    container.innerHTML = html;
    setTimeout(() => { const bars = container.querySelectorAll('.res-bar-fill'); bars.forEach(bar => { bar.style.width = bar.getAttribute('data-width'); }); }, 100);
}

document.addEventListener('DOMContentLoaded', initializeApp);