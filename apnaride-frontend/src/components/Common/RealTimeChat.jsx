import React, { useState, useEffect, useRef } from 'react';
import webSocketService from '../../services/webSocketService';

const RealTimeChat = ({ rideId, userId, userName, userType = 'rider', showHeader = true }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        let sub = null;
        const ensureConnected = () => new Promise((resolve) => {
            if (webSocketService.isConnected()) return resolve();
            webSocketService.connect(() => resolve(), () => resolve());
        });

        (async () => {
            await ensureConnected();
            sub = webSocketService.subscribeToChat(rideId, (message) => {
                // Ignore echo of my own messages to avoid duplicates
                if (message.senderId === userId) return;
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    rideId: message.rideId || rideId,
                    senderId: message.senderId,
                    senderName: message.senderName || (message.senderId === userId ? 'You' : 'User'),
                    senderType: message.senderType,
                    text: message.message || message.text,
                    timestamp: message.timestamp || new Date().toISOString()
                }]);
            });
        })();

        return () => {
            if (sub) {
                try { sub.unsubscribe(); } catch {}
            }
        };
    }, [rideId, userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const message = {
            id: Date.now(),
            rideId,
            senderId: userId,
            senderName: userName,
            senderType: userType,
            text: newMessage,
            timestamp: new Date().toISOString()
        };

        if (!webSocketService.isConnected()) {
            webSocketService.connect(() => {
                webSocketService.sendChatMessage(rideId, userId, newMessage);
            });
        } else {
            webSocketService.sendChatMessage(rideId, userId, newMessage);
        }

        setMessages(prev => [...prev, message]);
        setNewMessage('');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: 12,
            overflow: 'hidden'
        }}>
            {/* Chat Header */}
            {showHeader && (
                <div style={{
                    background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                    padding: '16px 20px',
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <i className="fa-solid fa-comments" style={{ fontSize: 18 }}></i>
                        Chat with {userType === 'rider' ? 'Customer' : 'Driver'}
                    </h3>
                </div>
            )}
            {/* Messages Container */}
            <div style={{
                background: '#f9fafb',
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
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
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💭</div>
                        <p style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>No messages yet</p>
                        <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.7 }}>Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const mine = msg.senderId === userId;
                        return (
                            <div
                                key={msg.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: mine ? 'flex-end' : 'flex-start',
                                    animation: 'messageSlideIn 0.3s ease-out'
                                }}
                            >
                                <div style={{
                                    maxWidth: '75%',
                                    display: 'flex',
                                    gap: '10px',
                                    flexDirection: mine ? 'row-reverse' : 'row',
                                    alignItems: 'flex-end'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: mine
                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        flexShrink: 0
                                    }}>
                                        {mine ? '👤' : '🚗'}
                                    </div>
                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                        background: mine
                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            : '#fff',
                                        color: mine ? '#fff' : '#1f2937',
                                        boxShadow: mine
                                            ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                                            : '0 2px 8px rgba(0, 0, 0, 0.08)',
                                        fontFamily: "'Poppins', sans-serif"
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            opacity: 0.8,
                                            marginBottom: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {msg.senderName}
                                            <span style={{ opacity: 0.6 }}>•</span>
                                            <span style={{ fontWeight: 400 }}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: '15px',
                                            lineHeight: '1.5',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
                onSubmit={sendMessage}
                style={{
                    padding: '20px 24px',
                    background: '#fff',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                }}
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={{
                        flex: 1,
                        padding: '14px 18px',
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
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                        background: newMessage.trim()
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : '#e5e7eb',
                        border: 'none',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        color: '#fff',
                        fontSize: '20px',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: newMessage.trim()
                            ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                            : 'none',
                        transition: 'all 0.2s'
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
                    title="Send"
                >
                    ➤
                </button>
            </form>

            <style>{`
                @keyframes messageSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default RealTimeChat;
