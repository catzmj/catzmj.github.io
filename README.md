# catzmj.github.io
[index.html](https://github.com/user-attachments/files/24320507/index.html)
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>智能检测 - 动态AI版</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="bg-particles"></div>

    <div class="header">
        <div class="title-group">
            <div class="back-btn">←</div>
            <div class="main-title">智能检测</div>
        </div>
        <div class="status-group">
            <div><span class="status-label">设备温度</span> 42°C</div>
            <div><span class="status-label">运行时间</span> 00:03:15</div>
        </div>
    </div>

    <div class="container">
        <div class="completed-list" id="completedList"></div>

        <div class="card-frame" id="mainCard">
            <div class="corner tl"></div><div class="corner tr"></div>
            <div class="corner bl"></div><div class="corner br"></div>
            <div class="deco-line"></div>

            <div style="display:flex; width:100%; height:100%; align-items:center;" id="cardContent">
                
                <div class="meter-container">
                    <svg class="meter-svg" viewBox="0 0 300 300">
                        <defs>
                            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:var(--accent); stop-opacity:0" />
                                <stop offset="100%" style="stop-color:var(--accent); stop-opacity:0.05" />
                            </linearGradient>
                        </defs>
                        <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"></circle>
                        <circle class="circle-ticks" cx="150" cy="150" r="130"></circle>
                        <circle class="circle-progress" id="progressRing" cx="150" cy="150" r="120" transform="rotate(-90 150 150)"></circle>
                        <path class="radar-sector" d="M150,150 L150,20 A130,130 0 0,1 250,60 z"></path>
                    </svg>
                    <div class="data-display">
                        <div class="big-number" id="progressNum">0</div>
                        <div class="label-unit">正在分析</div>
                    </div>
                </div>

                <div class="info-panel">
                    <div class="task-header">
                        <div class="task-id">任务ID: <span id="taskId"></span></div>
                        <div class="task-title" id="taskName"></div>
                    </div>
                    <div class="log-stream" id="logStream">
                    </div>
                </div>
            </div>
        </div>

        <div class="ai-view" id="aiView">
            <div class="ai-core">
                <div class="ai-glow"></div>
                <div class="ai-ring ring-1"></div>
                <div class="ai-ring ring-2"></div>
                <div class="ai-ring ring-3"></div>
                <div class="ai-scanner"></div>
            </div>
            <div class="ai-title">AI分析报告生成中...</div>
            <div class="ai-subtext" id="aiSubtext">正在初始化神经网络引擎...</div>
        </div>

        <div class="queue-list" id="queueList"></div>
    </div>

    <script src="script.js"></script>
</body>
</html>
[script.js](https://github.com/user-attachments/files/24320508/script.js)
const tasks = [
    { 
        id: 'SYS_01', name: '资源使用率', icon: '◈', 
        logs: [
            '检测 CPU 使用率: 18% (正常)', 
            '检测内存使用率: 42% (3.2GB/8GB)', 
            '检测存储空间使用率: 28% (剩余 54GB)'
        ] 
    },
    { 
        id: 'NET_02', name: '网络信息', icon: '⟁', 
        logs: [
            '检测网关连接状态: 联通 (延迟 3ms)', 
            '检测云平台连接状态: 已连接 (API v2.4)'
        ] 
    },
    { 
        id: 'AUD_03', name: '音频信息', icon: '≋', 
        logs: [
            '检测输入接口状态: HDMI-IN (信号锁定)',
            '检测输出接口状态: Line-Out (已连接)',
            '检测麦克风状态: 开启 (On)',
            '检测扬声器状态: 开启 (On)',
            '读取输入音量值: -12dB',
            '读取输出音量值: 65%'
        ] 
    },
    { 
        id: 'CAM_04', name: '视频信息', icon: '◎', 
        logs: [
            '检测输入接口状态: Camera 1 (Ready)',
            '检测输出接口状态: HDMI 1 (Display)',
            '分析输入分辨率/帧率: 1920x1080 @ 60fps',
            '分析输出分辨率/帧率: 3840x2160 @ 60fps'
        ] 
    }
];

let currentIdx = 0;
const els = {
    card: document.getElementById('mainCard'),
    content: document.getElementById('cardContent'),
    ring: document.getElementById('progressRing'),
    num: document.getElementById('progressNum'),
    taskId: document.getElementById('taskId'),
    taskName: document.getElementById('taskName'),
    logStream: document.getElementById('logStream'),
    completedList: document.getElementById('completedList'),
    queueList: document.getElementById('queueList'),
    aiView: document.getElementById('aiView'),
    aiSubtext: document.getElementById('aiSubtext')
};

function getTimestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

function renderQueue() {
    els.queueList.innerHTML = '';
    for(let i = currentIdx + 1; i < tasks.length; i++) {
        const div = document.createElement('div');
        div.className = 'queue-card';
        div.innerHTML = `<span class="q-icon">${tasks[i].icon}</span> [等候] ${tasks[i].name}`;
        els.queueList.appendChild(div);
    }
}

function runTask(index) {
    if (index >= tasks.length) { finish(); return; }
    
    const task = tasks[index];

    els.card.classList.remove('success-mode');
    els.content.classList.remove('anim-exit');
    els.content.classList.add('anim-enter');
    
    els.taskId.innerText = task.id;
    els.taskName.innerHTML = task.name; 
    
    els.logStream.innerHTML = '';
    els.num.innerText = '0';
    renderQueue();

    let progress = 0;
    let logIdx = 0;
    const totalLength = 753;
    
    // --- 节奏控制逻辑 ---
    let logTriggerPoints = [];
    let totalDuration = 0;

    if (task.logs.length === 3) {
        logTriggerPoints = [1, 60, 80];
        totalDuration = 3500; 
    } else if (task.logs.length === 2) {
        logTriggerPoints = [1, 50];
        totalDuration = 3000;
    } else if (task.logs.length === 6) {
        logTriggerPoints = [1, 17, 34, 51, 68, 85];
        totalDuration = 6000; 
    } else if (task.logs.length === 4) {
        logTriggerPoints = [1, 25, 50, 80];
        totalDuration = 4000; 
    } else {
         logTriggerPoints = task.logs.map((_, i) => Math.floor((i + 1) * (95 / task.logs.length)));
         totalDuration = 3500;
    }

    const stepTime = totalDuration / 100;

    const addLog = () => {
        if(logIdx < task.logs.length) {
            const line = document.createElement('div');
            line.className = 'log-line';
            line.innerHTML = `
                <span class="log-time">${getTimestamp()}</span>
                <span class="log-status">检查</span>
                <span class="log-content">${task.logs[logIdx]}</span>
            `;
            els.logStream.appendChild(line);
            logIdx++;
        }
    };

    const timer = setInterval(() => {
        progress += 1;
        els.num.innerText = progress;
        
        const offset = totalLength - (progress / 100) * totalLength;
        els.ring.style.strokeDashoffset = offset;

        if (logIdx < logTriggerPoints.length && progress >= logTriggerPoints[logIdx]) {
            addLog();
        }

        if (progress >= 100) {
            clearInterval(timer);
            els.card.classList.add('success-mode');
            els.taskName.innerHTML = `${task.name} <span class="status-icon">✓</span>`;
            
            while(logIdx < task.logs.length) addLog();
            
            setTimeout(() => completeAndNext(task), 600);
        }
    }, stepTime);
}

function completeAndNext(task) {
    els.content.classList.remove('anim-enter');
    els.content.classList.add('anim-exit');

    setTimeout(() => {
        currentIdx++;
        runTask(currentIdx);
    }, 500);
}

function finish() {
    els.card.style.opacity = '0';
    els.card.style.transform = 'scale(0.8)';
    els.queueList.style.opacity = '0';
    
    setTimeout(() => {
        els.card.style.display = 'none';
        els.queueList.style.display = 'none';
        
        els.aiView.style.display = 'flex';
        
        startAILogCycle();
    }, 500);
}

function startAILogCycle() {
    const aiLogs = [
        "正在进行多维数据融合...",
        "正在对比历史健康模型...",
        "神经网络推演中...",
        "正在评估潜在风险...",
        "生成可视化图表中...",
        "正在校准预测算法..."
    ];
    let i = 0;
    
    setInterval(() => {
        els.aiSubtext.innerText = aiLogs[i];
        els.aiSubtext.style.animation = 'none';
        void els.aiSubtext.offsetWidth; 
        els.aiSubtext.style.animation = 'fadeSlideIn 0.5s';
        
        i++;
        if (i >= aiLogs.length) {
            i = 0;
        }
    }, 800);
}

setTimeout(() => runTask(0), 500);
[style.css](https://github.com/user-attachments/files/24320509/style.css)
:root {
    --bg-color: #050a14;
    --card-bg: rgba(10, 20, 35, 0.6);
    --accent: #00f0ff;
    --accent-dim: rgba(0, 240, 255, 0.2);
    --purple: #bc13fe;
    --secondary: #4d5d7e;
    --success: #00ff9d;
    --text-main: #ffffff;
    --text-muted: #8b9bb4;
}

body {
    margin: 0; padding: 0;
    background-color: var(--bg-color);
    background-image: radial-gradient(circle at 50% 40%, #111e33 0%, #020408 90%);
    font-family: 'PingFang SC', 'Microsoft YaHei', 'SF Mono', 'Consolas', sans-serif;
    color: var(--text-main);
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.bg-particles {
    position: absolute; width: 100%; height: 100%; pointer-events: none;
    background-image: radial-gradient(white 1px, transparent 1px);
    background-size: 50px 50px;
    opacity: 0.05;
    mask-image: radial-gradient(circle at center, black 0%, transparent 80%);
}

.header {
    padding: 40px 80px;
    display: flex; justify-content: space-between; align-items: center; z-index: 10;
    height: 60px;
}

.title-group { display: flex; align-items: center; gap: 20px; }
.back-btn { font-size: 40px; color: var(--text-muted); cursor: pointer; transition: 0.3s; }
.back-btn:hover { color: var(--accent); }

.main-title {
    font-size: 40px; font-weight: bold; letter-spacing: 4px;
    color: #ffffff; background: none; -webkit-text-fill-color: initial;
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.status-group {
    text-align: right; font-size: 16px; color: var(--accent);
    line-height: 1.6; border-right: 2px solid var(--accent);
    padding-right: 15px; font-family: 'Consolas', sans-serif;
}
.status-label { color: var(--secondary); margin-right: 10px; font-size: 14px; }

.container {
    flex: 1; display: flex; flex-direction: column; align-items: center; 
    justify-content: center; position: relative; z-index: 10; 
}

.completed-list { display: none; }

.card-frame {
    position: relative; width: 960px; height: 480px;
    background: var(--card-bg); border: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(20px); display: flex; align-items: center;
    justify-content: space-between; padding: 0 60px; box-sizing: border-box;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.corner {
    position: absolute; width: 20px; height: 20px;
    border: 2px solid var(--accent); transition: all 0.3s;
}
.tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
.bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }
.br { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.deco-line { display: none; }

/* === 核心修改区域：仪表盘弱化 === */
.meter-container {
    position: relative;
    width: 200px; /* 尺寸缩小 */
    height: 200px;
    display: flex; justify-content: center; align-items: center;
    opacity: 0.6; /* 整体变暗 */
    transition: opacity 0.3s;
}
.success-mode .meter-container { opacity: 0.9; }

.meter-svg { position: absolute; width: 100%; height: 100%; overflow: visible; }

.circle-ticks { 
    fill: none; stroke: var(--secondary); stroke-width: 2; 
    stroke-dasharray: 2 10; opacity: 0.3; /* 刻度变暗 */
}

.circle-progress {
    fill: none; stroke: var(--accent); 
    stroke-width: 3; /* 线条变细 */
    stroke-dasharray: 753; stroke-dashoffset: 753;
    transition: stroke-dashoffset 0.1s linear;
    filter: drop-shadow(0 0 5px var(--accent)); /* 光晕减弱 */
}

.radar-sector { fill: url(#radarGradient); transform-origin: center; animation: scanRotate 4s linear infinite; }

.data-display { z-index: 5; text-align: center; }

.big-number { 
    font-family: 'Consolas', sans-serif; 
    font-size: 48px; /* 数字缩小 */
    font-weight: 200; color: var(--white); 
    letter-spacing: -1px; line-height: 1; 
}
.label-unit { 
    font-size: 12px; /* 单位缩小 */
    color: var(--text-muted); /* 颜色变暗 */
    letter-spacing: 2px; margin-top: 5px; font-weight: normal; 
}

/* === 核心修改区域：右侧信息强化 === */
.info-panel {
    flex: 1; height: 280px; /* 高度增加 */
    margin-left: 40px; 
    display: flex; flex-direction: column;
    border-left: 1px solid rgba(255,255,255,0.15); /* 分割线稍微提亮 */
    padding-left: 50px; /* 间距拉大 */
}

.task-header { margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; }

.task-title { 
    font-size: 36px; /* 标题放大 */
    color: var(--white); font-weight: bold; 
    letter-spacing: 2px; display: flex; align-items: center; 
    text-shadow: 0 0 20px rgba(0,0,0,0.5);
}

.task-id { 
    font-family: 'Consolas', sans-serif; 
    font-size: 16px; /* ID放大 */
    color: var(--accent); /* ID高亮 */
    margin-bottom: 8px; opacity: 0.8;
}

.status-icon {
    color: var(--success); margin-left: 20px; font-size: 32px;
    text-shadow: 0 0 10px var(--success);
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    display: inline-block;
}
@keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.log-stream { 
    flex: 1; overflow: hidden; display: flex; flex-direction: column; 
    justify-content: flex-start; 
    font-size: 16px; /* 日志整体放大 */
    padding-top: 10px;
}

.log-line { display: flex; align-items: center; margin-bottom: 8px; color: var(--text-muted); opacity: 0; transform: translateY(10px); animation: fadeSlideIn 0.3s forwards; }
.log-time { font-family: 'Consolas', sans-serif; color: var(--secondary); margin-right: 15px; font-size: 14px; }
.log-status { color: var(--accent); margin-right: 10px; font-size: 12px; border: 1px solid var(--accent-dim); padding: 2px 6px; border-radius: 2px; font-weight: bold;}
.log-content { 
    flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
    font-size: 16px; /* 日志内容放大 */
    color: var(--text-muted);
}

/* 高亮最新日志 */
.log-line:last-child { color: var(--white); text-shadow: 0 0 10px rgba(255,255,255,0.3); }
.log-line:last-child .log-content { color: #fff; font-weight: 500; }
.log-line:last-child .log-status { background: var(--accent-dim); color: var(--accent); box-shadow: 0 0 5px var(--accent); }

.queue-list { margin-top: 40px; width: 960px; display: flex; gap: 20px; opacity: 0.5; }
.queue-card { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; display: flex; align-items: center; font-size: 15px; color: var(--text-muted); }
.q-icon { margin-right: 10px; font-size: 18px; color: var(--secondary); }

@keyframes scanRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes fadeSlideIn { to { opacity: 1; transform: translateY(0); } }

.anim-exit { animation: scaleOut 0.4s forwards cubic-bezier(0.6, -0.28, 0.735, 0.045); }
.anim-enter { animation: scaleIn 0.5s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0; }
@keyframes scaleOut { to { opacity: 0; transform: scale(0.9) translateY(-20px); filter: blur(10px); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(1.05) translateY(20px); filter: blur(5px); } to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); } }

.success-mode { border-color: var(--success); box-shadow: 0 0 30px rgba(0,255,157,0.1); }
.success-mode .corner { border-color: var(--success); }
.success-mode .circle-progress { stroke: var(--success); filter: drop-shadow(0 0 5px var(--success)); }
.success-mode .big-number { color: var(--success); text-shadow: 0 0 20px var(--success); }

/* AI 动效部分 */
.ai-view {
    display: none; flex-direction: column; align-items: center; justify-content: center;
    width: 100%; height: 400px; animation: fadeIn 1s ease-in-out;
}
.ai-core { 
    position: relative; width: 140px; height: 140px; 
    display: flex; justify-content: center; align-items: center; 
    margin-bottom: 80px;
}
.ai-glow { 
    width: 60px; height: 60px; 
    background: radial-gradient(circle, #fff 0%, var(--accent) 40%, transparent 80%); 
    border-radius: 50%; opacity: 0.8; 
    box-shadow: 0 0 20px var(--accent);
    animation: pulseGlow 1.5s infinite ease-in-out; 
    z-index: 2;
}
.ai-ring { position: absolute; border-radius: 50%; box-sizing: border-box; }
.ring-1 { 
    width: 100%; height: 100%; 
    border: 2px solid transparent; border-top: 2px solid var(--accent); border-bottom: 2px solid var(--accent);
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.2); animation: spin 6s linear infinite; 
}
.ring-2 { 
    width: 80%; height: 80%; 
    border: 2px solid transparent; border-left: 4px solid var(--purple); border-right: 4px solid var(--secondary); 
    animation: spinReverse 3s linear infinite; opacity: 0.9; 
}
.ring-3 { 
    width: 120%; height: 120%; 
    border: 1px dashed rgba(255,255,255,0.15); animation: spin 15s linear infinite; 
}
.ai-scanner { 
    position: absolute; width: 140%; height: 2px; 
    background: linear-gradient(to right, transparent, var(--success), transparent); 
    top: 50%; left: -20%;
    animation: scanDown 3s infinite ease-in-out; opacity: 0.4; z-index: 1;
}
@keyframes pulseGlow { 0%,100% { transform: scale(0.9); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
@keyframes scanDown { 0% { top: 0%; opacity: 0; } 50% { top: 50%; opacity: 0.8; } 100% { top: 100%; opacity: 0; } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.ai-title { font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #fff; margin-bottom: 10px; text-shadow: 0 0 20px var(--accent); }
.ai-subtext { font-size: 14px; color: var(--accent); font-family: 'Consolas', monospace; height: 20px; opacity: 0.8; }
.report-ready-btn { display: none !important; }
