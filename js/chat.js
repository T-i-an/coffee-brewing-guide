// 配置
const CONFIG = {
    DEEPSEEK_API_KEY: 'sk-aead008aea8d424da873cb120774468c',
    API_URL: 'https://api.deepseek.com/v1/chat/completions',
    FALLBACK_MESSAGE: '抱歉，我暂时无法回答您的问题。请稍后再试或检查网络连接。'
};

// DOM元素
let chatButton, chatContainer, closeChat, chatMessages, userInput, sendMessage;

// 聊天窗口状态
let isChatOpen = false;

// 初始化聊天功能
function initChat() {
    console.log('初始化聊天功能...');
    
    chatButton = document.getElementById('chatButton');
    chatContainer = document.getElementById('chatContainer');
    closeChat = document.getElementById('closeChat');
    chatMessages = document.getElementById('chatMessages');
    userInput = document.getElementById('userInput');
    sendMessage = document.getElementById('sendMessage');

    console.log('DOM元素检查:', {
        chatButton: !!chatButton,
        chatContainer: !!chatContainer,
        closeChat: !!closeChat,
        chatMessages: !!chatMessages,
        userInput: !!userInput,
        sendMessage: !!sendMessage
    });

    if (!chatButton || !chatContainer || !closeChat || !chatMessages || !userInput || !sendMessage) {
        console.warn('聊天功能初始化失败：缺少必要的DOM元素');
        return;
    }

    // 添加欢迎消息
    setTimeout(() => {
        addMessage('bot', '您好！我是您的咖啡助手。有任何关于咖啡冲泡的问题，都可以问我哦！');
    }, 500);

    // 打开/关闭聊天窗口
    chatButton.addEventListener('click', (e) => {
        console.log('点击聊天按钮');
        e.stopPropagation();
        isChatOpen = !isChatOpen;
        chatContainer.classList.toggle('active', isChatOpen);
        if (isChatOpen) {
            userInput.focus();
            // 确保消息容器滚动到底部
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        }
    });

    closeChat.addEventListener('click', (e) => {
        console.log('点击关闭按钮');
        e.stopPropagation();
        isChatOpen = false;
        chatContainer.classList.remove('active');
    });

    // 发送消息事件监听
    sendMessage.addEventListener('click', (e) => {
        e.stopPropagation();
        sendMessageToBot();
        userInput.focus();
    });

    // 按Enter发送消息
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            sendMessageToBot();
            userInput.focus();
        }
    });

    // 自动调整输入框高度
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    });

    // 点击其他地方关闭聊天窗口
    document.addEventListener('click', (e) => {
        if (isChatOpen && !chatContainer.contains(e.target) && !chatButton.contains(e.target)) {
            isChatOpen = false;
            chatContainer.classList.remove('active');
        }
    });
}

// 发送消息
async function sendMessageToBot() {
    if (!userInput) {
        console.error('User input element not found');
        return;
    }

    const message = userInput.value.trim();
    if (!message) return;

    try {
        // 添加用户消息到聊天窗口
        addMessage('user', message);
        userInput.value = '';
        userInput.style.height = 'auto';

        // 添加加载状态
        const loadingMessage = addMessage('bot', '正在思考...');

        // 检查网络连接
        if (!navigator.onLine) {
            throw new Error('网络连接已断开，请检查您的网络设置');
        }

        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: `你是一个专业的咖啡顾问，精通手冲咖啡的各种技巧和知识。
                                你需要：
                                1. 用简洁专业的语言回答用户的问题
                                2. 针对手冲咖啡的具体问题提供详细建议
                                3. 解释专业术语时要通俗易懂
                                4. 提供实用的技巧和建议
                                5. 遇到不确定的问题时，坦诚告知并建议咨询其他专业资源
                                6. 使用中文回答所有问题`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API请求失败: ${errorData.error?.message || '未知错误'}`);
        }

        const data = await response.json();
        
        // 移除加载消息
        if (loadingMessage) {
            loadingMessage.remove();
        }
        
        // 添加机器人回复
        if (data.choices && data.choices[0] && data.choices[0].message) {
            addMessage('bot', data.choices[0].message.content);
        } else {
            throw new Error('无效的API响应');
        }
    } catch (error) {
        console.error('Error:', error);
        if (loadingMessage) {
            loadingMessage.remove();
        }
        
        // 根据错误类型显示不同的错误信息
        let errorMessage = CONFIG.FALLBACK_MESSAGE;
        if (error.message.includes('network')) {
            errorMessage = '网络连接出现问题，请检查您的网络设置';
        } else if (error.message.includes('API')) {
            errorMessage = 'API服务暂时不可用，请稍后再试';
        }
        
        addMessage('bot', errorMessage);
    }
}

// 添加消息到聊天窗口
function addMessage(type, content) {
    if (!chatMessages) {
        console.error('Chat messages container not found');
        return null;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // 格式化消息内容
    let formattedContent = content
        // 处理标题
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        // 处理列表
        .replace(/^\s*[-*] (.*$)/gm, '<li>$1</li>')
        // 处理加粗
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // 处理斜体
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // 处理代码块
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // 处理行内代码
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // 处理换行
        .replace(/\n/g, '<br>');
    
    // 如果内容包含列表，添加ul标签
    if (formattedContent.includes('<li>')) {
        formattedContent = '<ul>' + formattedContent + '</ul>';
    }
    
    messageContent.innerHTML = formattedContent;
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // 滚动到最新消息
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// 初始化聊天功能
document.addEventListener('DOMContentLoaded', initChat); 