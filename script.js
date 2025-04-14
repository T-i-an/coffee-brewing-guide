// 全局变量
let currentStep = 1;
let brewTimer = null;
let waterFlow = null;
let canvas = null;
let ctx = null;

// 冲泡记录功能
let brewingRecords = JSON.parse(localStorage.getItem('brewingRecords')) || [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化Canvas
    canvas = document.getElementById('coffee-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化参数控制
    initParamControls();
    
    // 初始化工具
    initTools();
    
    // 显示第一步
    showStep(1);

    // 在页面加载时显示记录
    displayBrewingRecords();

    // 温杯步骤交互
    const filterPaper = document.querySelector('.filter-paper');
    const filterCup = document.querySelector('.filter-cup');
    const completionMessage = document.querySelector('.completion-message');
    let isDragging = false;
    let startX, startY, initialX, initialY;

    // 拖拽开始
    filterPaper.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = filterPaper.offsetLeft;
        initialY = filterPaper.offsetTop;
        filterPaper.style.cursor = 'grabbing';
    });

    // 拖拽过程
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        filterPaper.style.left = `${initialX + deltaX}px`;
        filterPaper.style.top = `${initialY + deltaY}px`;
    });

    // 拖拽结束
    document.addEventListener('mouseup', function() {
        if (!isDragging) return;

        isDragging = false;
        filterPaper.style.cursor = 'move';

        // 检查是否放入滤杯
        const paperRect = filterPaper.getBoundingClientRect();
        const cupRect = filterCup.getBoundingClientRect();

        if (
            paperRect.right > cupRect.left &&
            paperRect.left < cupRect.right &&
            paperRect.bottom > cupRect.top &&
            paperRect.top < cupRect.bottom
        ) {
            // 放入成功
            filterPaper.style.left = '50%';
            filterPaper.style.top = '50%';
            filterPaper.style.transform = 'translate(-50%, -50%)';
            filterPaper.style.borderStyle = 'solid';
            filterPaper.style.backgroundColor = 'rgba(111, 78, 55, 0.1)';

            // 显示完成消息
            completionMessage.classList.add('show');
            setTimeout(() => {
                completionMessage.classList.remove('show');
            }, 2000);
        } else {
            // 放回原位
            filterPaper.style.left = 'initial';
            filterPaper.style.top = 'initial';
        }
    });

    // 触摸设备支持
    filterPaper.addEventListener('touchstart', function(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        initialX = filterPaper.offsetLeft;
        initialY = filterPaper.offsetTop;
        e.preventDefault();
    });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;

        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;

        filterPaper.style.left = `${initialX + deltaX}px`;
        filterPaper.style.top = `${initialY + deltaY}px`;
        e.preventDefault();
    });

    document.addEventListener('touchend', function() {
        if (!isDragging) return;

        isDragging = false;

        const paperRect = filterPaper.getBoundingClientRect();
        const cupRect = filterCup.getBoundingClientRect();

        if (
            paperRect.right > cupRect.left &&
            paperRect.left < cupRect.right &&
            paperRect.bottom > cupRect.top &&
            paperRect.top < cupRect.bottom
        ) {
            filterPaper.style.left = '50%';
            filterPaper.style.top = '50%';
            filterPaper.style.transform = 'translate(-50%, -50%)';
            filterPaper.style.borderStyle = 'solid';
            filterPaper.style.backgroundColor = 'rgba(111, 78, 55, 0.1)';

            completionMessage.classList.add('show');
            setTimeout(() => {
                completionMessage.classList.remove('show');
            }, 2000);
        } else {
            filterPaper.style.left = 'initial';
            filterPaper.style.top = 'initial';
        }
    });
});

// 调整Canvas大小
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

// 初始化参数控制
function initParamControls() {
    // 咖啡粉用量
    const doseInput = document.getElementById('dose');
    const doseValue = document.getElementById('dose-value');
    doseInput.addEventListener('input', (e) => {
        doseValue.textContent = e.target.value;
        updateFlavorProfile();
    });

    // 水温
    const tempInput = document.getElementById('temperature');
    const tempValue = document.getElementById('temp-value');
    tempInput.addEventListener('input', (e) => {
        tempValue.textContent = e.target.value;
        document.querySelector('.temp-display').textContent = `${e.target.value}°C`;
        updateFlavorProfile();
    });

    // 粉水比
    const ratioInput = document.getElementById('ratio');
    const ratioValue = document.getElementById('ratio-value');
    ratioInput.addEventListener('input', (e) => {
        ratioValue.textContent = e.target.value;
        updateFlavorProfile();
    });

    // 咖啡豆类型和烘焙度
    document.getElementById('bean-type').addEventListener('change', updateFlavorProfile);
    document.getElementById('roast-level').addEventListener('change', updateFlavorProfile);
    document.getElementById('grind-size').addEventListener('change', updateFlavorProfile);
}

// 初始化工具
function initTools() {
    // 手冲壶
    const kettle = document.getElementById('kettle');
    kettle.addEventListener('mousedown', startPouring);
    kettle.addEventListener('mouseup', stopPouring);
    kettle.addEventListener('mouseleave', stopPouring);

    // 电子秤
    const scale = document.getElementById('scale');
    scale.addEventListener('click', () => {
        const weight = document.querySelector('.weight-display');
        weight.textContent = `${document.getElementById('dose').value}g`;
    });

    // 计时器
    const timer = document.getElementById('timer');
    timer.addEventListener('click', toggleTimer);
}

// 开始注水
function startPouring() {
    waterFlow = setInterval(() => {
        drawWaterFlow();
    }, 16);
}

// 停止注水
function stopPouring() {
    if (waterFlow) {
        clearInterval(waterFlow);
        waterFlow = null;
    }
}

// 绘制水流
function drawWaterFlow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.quadraticCurveTo(
        canvas.width / 2 + 50,
        canvas.height / 2,
        canvas.width / 2,
        canvas.height
    );
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
    ctx.lineWidth = 5;
    ctx.stroke();
}

// 切换计时器
function toggleTimer() {
    const timeDisplay = document.querySelector('.time-display');
    if (!brewTimer) {
        startTimer(timeDisplay);
    } else {
        stopTimer(timeDisplay);
    }
}

// 开始计时
function startTimer(display) {
    let seconds = 0;
    brewTimer = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        display.textContent = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }, 1000);
}

// 停止计时
function stopTimer(display) {
    clearInterval(brewTimer);
    brewTimer = null;
    display.textContent = '00:00';
}

// 更新风味预测
function updateFlavorProfile() {
    const beanType = document.getElementById('bean-type').value;
    const roastLevel = document.getElementById('roast-level').value;
    const temp = parseInt(document.getElementById('temperature').value);
    const grindSize = document.getElementById('grind-size').value;

    // 根据参数计算风味特征
    let acidity = 50;
    let sweetness = 50;
    let body = 50;

    // 咖啡豆类型影响
    if (beanType === 'yirgacheffe') {
        acidity += 20;
        sweetness += 10;
    } else if (beanType === 'mandheling') {
        body += 20;
        sweetness += 10;
    }

    // 烘焙度影响
    if (roastLevel === 'light') {
        acidity += 15;
    } else if (roastLevel === 'dark') {
        body += 15;
        sweetness += 10;
    }

    // 水温影响
    if (temp > 92) {
        acidity += 10;
    } else if (temp < 90) {
        body += 10;
    }

    // 研磨度影响
    if (grindSize === 'fine') {
        body += 10;
    } else if (grindSize === 'coarse') {
        acidity += 10;
    }

    // 更新显示
    document.querySelector('.flavor-attribute:nth-child(1) .fill').style.width = `${acidity}%`;
    document.querySelector('.flavor-attribute:nth-child(2) .fill').style.width = `${sweetness}%`;
    document.querySelector('.flavor-attribute:nth-child(3) .fill').style.width = `${body}%`;
}

// 显示步骤
function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => {
        step.style.display = 'none';
    });
    const currentStepElement = document.getElementById(`step${stepNumber}`);
    currentStepElement.style.display = 'block';
    currentStepElement.style.opacity = '0';
    currentStepElement.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        currentStepElement.style.transition = 'all 0.5s ease';
        currentStepElement.style.opacity = '1';
        currentStepElement.style.transform = 'translateY(0)';
    }, 50);
}

// 下一步
function nextStep(current) {
    if (current < 5) {
        showStep(current + 1);
    }
}

// 重新开始
function restart() {
    showStep(1);
    stopTimer(document.querySelector('.time-display'));
    document.querySelector('.weight-display').textContent = '0.0g';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 添加页面加载时的动画效果
document.addEventListener('DOMContentLoaded', () => {
    const firstStep = document.getElementById('step1');
    firstStep.style.opacity = '0';
    firstStep.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        firstStep.style.transition = 'all 0.5s ease';
        firstStep.style.opacity = '1';
        firstStep.style.transform = 'translateY(0)';
    }, 100);
});

function saveBrewingRecord() {
    const record = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        params: {
            beanType: document.getElementById('bean-type').value,
            roastLevel: document.getElementById('roast-level').value,
            dose: document.getElementById('dose').value,
            temperature: document.getElementById('temperature').value,
            grindSize: document.getElementById('grind-size').value,
            ratio: document.getElementById('ratio').value
        },
        notes: document.getElementById('brewing-notes').value
    };
    
    brewingRecords.unshift(record);
    localStorage.setItem('brewingRecords', JSON.stringify(brewingRecords));
    displayBrewingRecords();
}

function displayBrewingRecords() {
    const recordsList = document.getElementById('records-list');
    recordsList.innerHTML = '';
    
    brewingRecords.forEach(record => {
        const recordElement = document.createElement('div');
        recordElement.className = 'record-item';
        recordElement.innerHTML = `
            <h4>${record.date}</h4>
            <div class="record-params">
                <div class="record-param">豆种: ${record.params.beanType}</div>
                <div class="record-param">烘焙度: ${record.params.roastLevel}</div>
                <div class="record-param">粉量: ${record.params.dose}g</div>
                <div class="record-param">水温: ${record.params.temperature}°C</div>
                <div class="record-param">研磨度: ${record.params.grindSize}</div>
                <div class="record-param">粉水比: 1:${record.params.ratio}</div>
            </div>
            <div class="record-notes">
                <strong>备注:</strong>
                <p>${record.notes || '无备注'}</p>
            </div>
            <div class="record-actions">
                <button class="edit-btn" onclick="editRecord(${record.id})">编辑</button>
                <button class="delete-btn" onclick="deleteRecord(${record.id})">删除</button>
            </div>
        `;
        recordsList.appendChild(recordElement);
    });
}

function editRecord(id) {
    const record = brewingRecords.find(r => r.id === id);
    if (record) {
        document.getElementById('bean-type').value = record.params.beanType;
        document.getElementById('roast-level').value = record.params.roastLevel;
        document.getElementById('dose').value = record.params.dose;
        document.getElementById('temperature').value = record.params.temperature;
        document.getElementById('grind-size').value = record.params.grindSize;
        document.getElementById('ratio').value = record.params.ratio;
        document.getElementById('brewing-notes').value = record.notes;
        
        deleteRecord(id);
    }
}

function deleteRecord(id) {
    brewingRecords = brewingRecords.filter(r => r.id !== id);
    localStorage.setItem('brewingRecords', JSON.stringify(brewingRecords));
    displayBrewingRecords();
}

// 开始按钮功能
function startJourney() {
    // 隐藏当前页面
    document.querySelector('.landing-page').style.display = 'none';
    
    // 显示冲泡参数页面
    const brewingPage = document.createElement('div');
    brewingPage.className = 'brewing-page';
    brewingPage.innerHTML = `
        <div class="container">
            <header>
                <h1>手冲咖啡指南</h1>
                <p>一步步教你制作完美的手冲咖啡</p>
            </header>

            <div class="brewing-parameters">
                <h2>冲泡参数</h2>
                <div class="params-grid">
                    <div class="param-item">
                        <label for="bean-type">咖啡豆种类</label>
                        <select id="bean-type">
                            <option value="arabica">阿拉比卡</option>
                            <option value="robusta">罗布斯塔</option>
                            <option value="blend">混合豆</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <label for="roast-level">烘焙程度</label>
                        <select id="roast-level">
                            <option value="light">浅烘</option>
                            <option value="medium">中烘</option>
                            <option value="dark">深烘</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <label for="dose">咖啡粉量 (g)</label>
                        <input type="number" id="dose" value="15" min="10" max="30">
                    </div>
                    <div class="param-item">
                        <label for="temperature">水温 (°C)</label>
                        <input type="number" id="temperature" value="92" min="85" max="96">
                    </div>
                    <div class="param-item">
                        <label for="grind-size">研磨度</label>
                        <select id="grind-size">
                            <option value="fine">细</option>
                            <option value="medium">中</option>
                            <option value="coarse">粗</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <label for="ratio">粉水比</label>
                        <input type="number" id="ratio" value="15" min="10" max="20">
                    </div>
                </div>
                <div class="param-notes">
                    <label for="brewing-notes">冲泡备注</label>
                    <textarea id="brewing-notes" placeholder="记录你的冲泡心得..."></textarea>
                </div>
                <button id="save-params" class="btn">保存参数</button>
            </div>

            <div class="brewing-steps">
                <h2>冲泡步骤</h2>
                <div class="steps-container">
                    <!-- 步骤将通过JavaScript动态添加 -->
                </div>
            </div>

            <div class="brewing-records">
                <h2>冲泡记录</h2>
                <div id="records-list" class="records-list">
                    <!-- 记录将通过JavaScript动态添加 -->
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(brewingPage);
    
    // 初始化冲泡步骤
    initializeBrewingSteps();
}

// 初始化冲泡步骤
function initializeBrewingSteps() {
    const stepsContainer = document.querySelector('.steps-container');
    const steps = [
        {
            id: 1,
            title: '准备器具',
            icon: 'fa-mug-hot',
            description: '准备以下器具：',
            items: [
                { icon: 'fa-coffee', text: '手冲壶' },
                { icon: 'fa-filter', text: '滤杯和滤纸' },
                { icon: 'fa-weight-hanging', text: '电子秤' },
                { icon: 'fa-clock', text: '计时器' },
                { icon: 'fa-mug-hot', text: '分享壶' }
            ]
        },
        {
            id: 2,
            title: '预热器具',
            icon: 'fa-temperature-high',
            description: '用热水冲洗滤纸和滤杯，预热所有器具。'
        },
        {
            id: 3,
            title: '研磨咖啡',
            icon: 'fa-cogs',
            description: '根据选择的研磨度研磨咖啡豆。'
        },
        {
            id: 4,
            title: '第一次注水',
            icon: 'fa-tint',
            description: '注入咖啡粉重量2倍的热水，等待30秒让咖啡粉充分膨胀。'
        },
        {
            id: 5,
            title: '第二次注水',
            icon: 'fa-tint',
            description: '缓慢注入剩余的热水，保持水流稳定。'
        },
        {
            id: 6,
            title: '完成',
            icon: 'fa-check-circle',
            description: '等待咖啡完全滴滤完成，即可享用。'
        }
    ];

    steps.forEach(step => {
        const stepElement = document.createElement('div');
        stepElement.className = 'step';
        stepElement.id = `step${step.id}`;
        stepElement.style.display = step.id === 1 ? 'block' : 'none';

        stepElement.innerHTML = `
            <div class="step-header">
                <span class="step-number">${step.id}</span>
                <h3>${step.title}</h3>
            </div>
            <div class="step-content">
                <div class="step-icon">
                    <i class="fas ${step.icon} fa-3x"></i>
                </div>
                <div class="step-text">
                    <p>${step.description}</p>
                    ${step.items ? `
                        <ul>
                            ${step.items.map(item => `
                                <li><i class="fas ${item.icon}"></i> ${item.text}</li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
            <button class="next-btn" onclick="nextStep(${step.id})">
                ${step.id === steps.length ? '保存记录' : '下一步'}
            </button>
            ${step.id === steps.length ? `
                <button class="next-btn" onclick="restart()">重新开始</button>
            ` : ''}
        `;

        stepsContainer.appendChild(stepElement);
    });
}

// 下一步按钮功能
function nextStep(currentStep) {
    const currentElement = document.getElementById(`step${currentStep}`);
    const nextElement = document.getElementById(`step${currentStep + 1}`);
    
    if (currentStep === 6) {
        saveBrewingRecord();
    } else if (nextElement) {
        currentElement.style.display = 'none';
        nextElement.style.display = 'block';
    }
}

// 重新开始功能
function restart() {
    document.querySelector('.brewing-page').remove();
    document.querySelector('.landing-page').style.display = 'block';
}

// 在页面加载时显示记录
document.addEventListener('DOMContentLoaded', () => {
    displayBrewingRecords();
});

// 冲泡参数保存
function saveBrewingParams() {
    const params = {
        coffeeWeight: document.getElementById('coffee-weight').value,
        waterWeight: document.getElementById('water-weight').value,
        waterTemp: document.getElementById('water-temp').value,
        brewTime: document.getElementById('brew-time').value
    };

    localStorage.setItem('brewingParams', JSON.stringify(params));
    alert('参数已保存！');
}

// 冲泡记录管理
document.addEventListener('DOMContentLoaded', function() {
    const recordForm = document.getElementById('record-form');
    const recordsList = document.getElementById('records-list');

    // 加载保存的记录
    function loadRecords() {
        const records = JSON.parse(localStorage.getItem('brewingRecords') || '[]');
        recordsList.innerHTML = '';
        
        records.forEach((record, index) => {
            const recordElement = document.createElement('div');
            recordElement.className = 'record-item';
            recordElement.innerHTML = `
                <div class="record-params">
                    <div>
                        <strong>咖啡豆：</strong>
                        <span>${record.coffeeType}</span>
                    </div>
                    <div>
                        <strong>粉量：</strong>
                        <span>${record.coffeeWeight}g</span>
                    </div>
                    <div>
                        <strong>水量：</strong>
                        <span>${record.waterWeight}g</span>
                    </div>
                    <div>
                        <strong>水温：</strong>
                        <span>${record.waterTemp}°C</span>
                    </div>
                    <div>
                        <strong>时间：</strong>
                        <span>${record.brewTime}秒</span>
                    </div>
                    <div>
                        <strong>研磨度：</strong>
                        <span>${record.grindSize}</span>
                    </div>
                </div>
                <div class="record-notes">
                    <p>${record.notes || '无备注'}</p>
                </div>
                <div class="record-actions">
                    <button onclick="editRecord(${index})">
                        <i class="fas fa-edit"></i>
                        <span>编辑</span>
                    </button>
                    <button onclick="deleteRecord(${index})">
                        <i class="fas fa-trash"></i>
                        <span>删除</span>
                    </button>
                </div>
            `;
            recordsList.appendChild(recordElement);
        });
    }

    // 保存新记录
    recordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const record = {
            coffeeType: document.getElementById('coffee-type').value,
            coffeeWeight: document.getElementById('coffee-weight').value,
            waterWeight: document.getElementById('water-weight').value,
            waterTemp: document.getElementById('water-temp').value,
            brewTime: document.getElementById('brew-time').value,
            grindSize: document.getElementById('grind-size').value,
            notes: document.getElementById('notes').value,
            date: new Date().toLocaleString()
        };

        const records = JSON.parse(localStorage.getItem('brewingRecords') || '[]');
        records.push(record);
        localStorage.setItem('brewingRecords', JSON.stringify(records));

        loadRecords();
        recordForm.reset();
        alert('记录已保存！');
    });

    // 编辑记录
    window.editRecord = function(index) {
        const records = JSON.parse(localStorage.getItem('brewingRecords') || '[]');
        const record = records[index];

        document.getElementById('coffee-type').value = record.coffeeType;
        document.getElementById('coffee-weight').value = record.coffeeWeight;
        document.getElementById('water-weight').value = record.waterWeight;
        document.getElementById('water-temp').value = record.waterTemp;
        document.getElementById('brew-time').value = record.brewTime;
        document.getElementById('grind-size').value = record.grindSize;
        document.getElementById('notes').value = record.notes;

        records.splice(index, 1);
        localStorage.setItem('brewingRecords', JSON.stringify(records));
        loadRecords();
    };

    // 删除记录
    window.deleteRecord = function(index) {
        if (confirm('确定要删除这条记录吗？')) {
            const records = JSON.parse(localStorage.getItem('brewingRecords') || '[]');
            records.splice(index, 1);
            localStorage.setItem('brewingRecords', JSON.stringify(records));
            loadRecords();
        }
    };

    // 初始加载记录
    loadRecords();
});

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有导航链接
    const navLinks = document.querySelectorAll('.nav-link');
    // 获取所有内容区域
    const sections = document.querySelectorAll('.guide-section');
    // 获取所有下一步按钮
    const nextButtons = document.querySelectorAll('.next-step-button');

    // 处理导航链接点击
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            // 更新导航链接状态
            navLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
            
            // 显示目标部分
            showSection(targetId);
        });
    });

    // 处理下一步按钮点击
    nextButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            // 更新导航链接状态
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${targetId}`) {
                    link.classList.add('active');
                }
            });
            
            // 显示目标部分
            showSection(targetId);
            
            // 滚动到页面顶部
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });

    // 显示指定部分
    function showSection(sectionId) {
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    // 处理URL哈希变化
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            showSection(hash);
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${hash}`) {
                    link.classList.add('active');
                }
            });
        }
    });

    // 初始显示第一个部分
    if (!window.location.hash) {
        showSection('preheat');
    }
}); 