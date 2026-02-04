import { useState, useEffect } from 'react'
import io from 'socket.io-client'

// Подключаемся к серверу (убедись, что node server.js запущен!)
const socket = io('http://localhost:3001');

function App() {
    const [user, setUser] = useState(null);
    const [loginInput, setLoginInput] = useState('');
    const [messages, setMessages] = useState({}); // Объект для хранения чатов { "Имя": [сообщения] }
    const [currentChat, setCurrentChat] = useState('Общий');
    const [text, setText] = useState('');
    const [contacts, setContacts] = useState(['Общий', 'Артем', 'Никита']);

    // --- ЭФФЕКТЫ (Связь с сервером) ---
    useEffect(() => {
        // 1. Получаем историю из SQLite при подключении
        socket.on('chat_history', (history) => {
            // Распределяем историю по комнатам (упрощенно для Общего чата)
            setMessages(prev => ({ ...prev, 'Общий': history }));
        });

        // 2. Слушаем новые сообщения
        socket.on('message', (data) => {
            setMessages((prev) => {
                const chatName = data.target || 'Общий';
                const oldMsgs = prev[chatName] || [];
                return { ...prev, [chatName]: [...oldMsgs, data] };
            });
        });

        return () => {
            socket.off('chat_history');
            socket.off('message');
        };
    }, []);

    // --- ЛОГИКА ---
    const handleAuth = () => {
        if (loginInput.trim()) setUser(loginInput);
    };

    const addContact = () => {
        const name = prompt("Введите имя нового друга:");
        if (name && !contacts.includes(name)) {
            setContacts([...contacts, name]);
        }
    };

    const sendMessage = () => {
        if (!text.trim()) return;
        const msgData = {
            user: user,
            text: text,
            target: currentChat // Помечаем, кому пишем
        };
        socket.emit('message', msgData);
        setText('');
    };

    // --- ЭКРАН ВХОДА ---
    if (!user) {
        return (
            <div style={styles.container}>
                <div style={styles.authCard}>
                    <h2 style={{ color: '#ffd700', marginBottom: '20px' }}>⚡ ЗЕВС: ВХОД</h2>
                    <input
                        style={styles.input}
                        placeholder="Твой ник..."
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                    />
                    <button style={{ ...styles.button, width: '100%', marginTop: '15px' }} onClick={handleAuth}>Войти в сеть</button>
                </div>
            </div>
        );
    }

    // --- ГЛАВНЫЙ ИНТЕРФЕЙС ---
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Боковая панель */}
                <div style={styles.sidebar}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h4 style={{ color: '#ffd700', margin: 0 }}>КОНТАКТЫ</h4>
                        <button onClick={addContact} style={styles.addBtn}>+</button>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {contacts.map(name => (
                            <div key={name}
                                onClick={() => setCurrentChat(name)}
                                style={{
                                    ...styles.contact,
                                    backgroundColor: currentChat === name ? '#ffd70022' : 'transparent',
                                    borderLeft: currentChat === name ? '4px solid #ffd700' : 'none',
                                    color: currentChat === name ? '#ffd700' : 'white'
                                }}>
                                👤 {name}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 'auto', fontSize: '12px', color: '#888', borderTop: '1px solid #333', paddingTop: '10px' }}>
                        Вы зашли как: <b style={{ color: '#ffd700' }}>{user}</b>
                    </div>
                </div>

                {/* Область чата */}
                <div style={styles.chatArea}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                        {currentChat === 'Общий' ? '📢 Общий чат' : `💬 ЛС: ${currentChat}`}
                    </h3>
                    <div style={styles.messagesBox}>
                        {(messages[currentChat] || []).map((m, i) => (
                            <div key={i} style={{
                                ...styles.msg,
                                alignSelf: m.user === user ? 'flex-end' : 'flex-start',
                                backgroundColor: m.user === user ? '#ffd700' : '#333',
                                color: m.user === user ? 'black' : 'white'
                            }}>
                                <small style={{ display: 'block', fontSize: '10px', opacity: 0.7 }}>{m.user}</small>
                                {m.text}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            style={styles.input}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Напишите сообщение..."
                        />
                        <button style={styles.button} onClick={sendMessage}>🚀</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- СТИЛИ (ТЕМНАЯ ТЕМА) ---
const styles = {
    container: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', backgroundColor: '#000', color: 'white', margin: 0, padding: 0, overflow: 'hidden', fontFamily: 'Arial, sans-serif' },
    authCard: { background: '#1a1a1a', padding: '40px', borderRadius: '20px', textAlign: 'center', border: '1px solid #333', boxShadow: '0 0 30px rgba(255, 215, 0, 0.1)' },
    card: { display: 'flex', width: '90%', maxWidth: '1000px', height: '85vh', background: '#1a1a1a', borderRadius: '20px', border: '1px solid #333', overflow: 'hidden' },
    sidebar: { width: '250px', background: '#111', padding: '20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' },
    addBtn: { background: '#ffd700', border: 'none', borderRadius: '5px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', transition: '0.2s' },
    contact: { padding: '15px', cursor: 'pointer', borderRadius: '8px', marginBottom: '5px', transition: '0.2s' },
    chatArea: { flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', background: '#161616' },
    messagesBox: { flex: 1, overflowY: 'auto', background: '#0a0a0a', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid #222', display: 'flex', flexDirection: 'column' },
    input: { flex: 1, padding: '15px', borderRadius: '10px', border: '1px solid #333', background: '#000', color: 'white', outline: 'none' },
    button: { padding: '10px 25px', backgroundColor: '#ffd700', color: 'black', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    msg: { padding: '10px 15px', borderRadius: '15px', marginBottom: '10px', minWidth: '60px', maxWidth: '75%', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }
};

export default App;