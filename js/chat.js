// DeepSeek API配置
const DEEPSEEK_API_KEY = 'YOUR_API_KEY'; // 请替换为您的API密钥
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// DOM元素
const chatButton = document.getElementById('chatButton');
const chatContainer = document.getElementById('chatContainer');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendMessage = document.getElementById('sendMessage');

// 聊天窗口状态
let isChatOpen = false;

// 打开/关闭聊天窗口
chatButton.addEventListener('click', () => {
    isChatOpen = !isChatOpen;
    chatContainer.classList.toggle('active', isChatOpen);
});

closeChat.addEventListener('click', () => {
    isChatOpen = false;
    chatContainer.classList.remove('active');
});

// 发送消息
async function sendMessageToBot() {
    const message = userInput.value.trim();
    if (!message) return;

    // 添加用户消息到聊天窗口
    addMessage('user', message);
    userInput.value = '';

    // 添加加载状态
    const loadingMessage = addMessage('bot', '正在思考...');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的咖啡顾问，精通手冲咖啡的各种技巧和知识。请用简洁专业的语言回答用户的问题。"
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            })
        });

        const data = await response.json();
        
        // 移除加载消息
        loadingMessage.remove();
        
        // 添加机器人回复
        if (data.choices && data.choices[0]) {
            addMessage('bot', data.choices[0].message.content);
        } else {
            addMessage('bot', '抱歉，我现在无法回答这个问题。请稍后再试。');
        }
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.remove();
        addMessage('bot', '抱歉，发生了一些错误。请稍后再试。');
    }
}

// 添加消息到聊天窗口
function addMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // 滚动到最新消息
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// 发送消息事件监听
sendMessage.addEventListener('click', sendMessageToBot);

// 按Enter发送消息
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessageToBot();
    }
});

// 自动调整输入框高度
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = (userInput.scrollHeight) + 'px';
}); 