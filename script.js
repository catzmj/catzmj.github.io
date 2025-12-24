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