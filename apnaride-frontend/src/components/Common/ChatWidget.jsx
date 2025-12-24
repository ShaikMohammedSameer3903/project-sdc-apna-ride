import React, { useState, useEffect, useRef } from 'react';
import '../../modern-design-system.css';

export default function ChatWidget(props) {
    const { userId, recipientName } = props;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!newMessage.trim()) return;

        const message = {
            id: Date.now(),
            text: newMessage,
            sender: userId,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            isMine: true
        };

        setMessages([...messages, message]);
        setNewMessage('');

        // Here you would send via WebSocket
        // webSocketService.sendMessage(rideId, message);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '28px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)',
                    zIndex: 9998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: 'pulse 2s ease-in-out infinite'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.4)';
                }}
            >
                💬
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            height: '520px',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUpChat 0.3s ease-out'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}>
                        👤
                    </div>
                    <div>
                        <h3 style={{
                            margin: 0,
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 600,
                            fontSize: '17px',
                            color: '#fff',
                            letterSpacing: '-0.01em'
                        }}>
                            {recipientName || 'Chat'}
                        </h3>
                        <p style={{
                            margin: 0,
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '13px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#10b981',
                                display: 'inline-block',
                                animation: 'pulse 2s ease-in-out infinite'
                            }}></span>
                            Online
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '10px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '20px',
                        color: '#fff',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                background: '#f9fafb',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {messages.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#9ca3af',
                        fontFamily: "'Poppins', sans-serif"
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
                        <p style={{ fontSize: '15px', margin: 0 }}>No messages yet</p>
                        <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.7 }}>Start the conversation!</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} style={{
                            display: 'flex',
                            justifyContent: msg.isMine ? 'flex-end' : 'flex-start',
                            animation: 'messageSlide 0.3s ease-out'
                        }}>
                            <div style={{
                                maxWidth: '75%',
                                padding: '12px 16px',
                                borderRadius: msg.isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                background: msg.isMine 
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : '#fff',
                                color: msg.isMine ? '#fff' : '#1f2937',
                                boxShadow: msg.isMine 
                                    ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                                    : '0 2px 8px rgba(0, 0, 0, 0.08)',
                                fontFamily: "'Poppins', sans-serif"
                            }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: '15px',
                                    lineHeight: '1.5',
                                    wordBreak: 'break-word'
                                }}>
                                    {msg.text}
                                </p>
                                <p style={{
                                    margin: '6px 0 0 0',
                                    fontSize: '11px',
                                    opacity: 0.7,
                                    textAlign: 'right'
                                }}>
                                    {msg.timestamp}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '16px 20px',
                background: '#fff',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '24px',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.2s',
                        background: '#f9fafb'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#667eea';
                        e.target.style.background = '#fff';
                        e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.background = '#f9fafb';
                        e.target.style.boxShadow = 'none';
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: 'none',
                        background: newMessage.trim()
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : '#e5e7eb',
                        color: '#fff',
                        fontSize: '18px',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: newMessage.trim() 
                            ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                            : 'none'
                    }}
                    onMouseEnter={(e) => {
                        if (newMessage.trim()) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = newMessage.trim()
                            ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                            : 'none';
                    }}
                >
                    ➤
                </button>
            </div>

            <style>{`
                @keyframes slideUpChat {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes messageSlide {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.8;
                        transform: scale(1.05);
                    }
                }
            `}</style>
        </div>
    );
}
