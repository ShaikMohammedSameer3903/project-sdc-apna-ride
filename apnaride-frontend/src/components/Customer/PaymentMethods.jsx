import React, { useState } from 'react';
import '../../modern-design-system.css';

const PAYMENT_METHODS = [
    { id: 'cash', name: 'Cash', icon: 'fa-money-bill-wave', color: 'green' },
    { id: 'upi', name: 'UPI', icon: 'fa-mobile-screen', color: 'purple' },
    { id: 'card', name: 'Card', icon: 'fa-credit-card', color: 'blue' },
    { id: 'wallet', name: 'Wallet', icon: 'fa-wallet', color: 'orange' }
];

export default function PaymentMethods({ onPaymentSelect, selectedMethod }) {
    const [showAddCard, setShowAddCard] = useState(false);
    const [savedCards, setSavedCards] = useState([
        { id: 1, last4: '4242', brand: 'Visa', expiry: '12/25' }
    ]);

    const handleMethodSelect = (methodId) => {
        onPaymentSelect(methodId);
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg">Payment Method</h3>

            {/* Payment Options */}
            <div className="space-y-3">
                {PAYMENT_METHODS.map(method => (
                    <button
                        key={method.id}
                        onClick={() => handleMethodSelect(method.id)}
                        className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 transition-all ${
                            selectedMethod === method.id
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        <i className={`fa-solid ${method.icon} text-2xl`}></i>
                        <div className="flex-1 text-left">
                            <p className="font-semibold">{method.name}</p>
                            {method.id === 'cash' && (
                                <p className="text-xs opacity-75">Pay after ride</p>
                            )}
                            {method.id === 'upi' && (
                                <p className="text-xs opacity-75">Google Pay, PhonePe, Paytm</p>
                            )}
                        </div>
                        {selectedMethod === method.id && (
                            <i className="fa-solid fa-check-circle text-xl"></i>
                        )}
                    </button>
                ))}
            </div>

            {/* Saved Cards */}
            {selectedMethod === 'card' && (
                <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Saved Cards</p>
                    {savedCards.map(card => (
                        <div key={card.id} className="p-4 border-2 border-gray-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <i className="fa-brands fa-cc-visa text-3xl text-blue-600"></i>
                                <div>
                                    <p className="font-semibold">•••• {card.last4}</p>
                                    <p className="text-xs text-gray-500">Expires {card.expiry}</p>
                                </div>
                            </div>
                            <button className="text-red-600 text-sm">Remove</button>
                        </div>
                    ))}
                    
                    <button
                        onClick={() => setShowAddCard(true)}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-900"
                    >
                        <i className="fa-solid fa-plus mr-2"></i>
                        Add New Card
                    </button>
                </div>
            )}

            {/* Add Card Modal */}
            {showAddCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">Add New Card</h3>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Card Number</label>
                                <input
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    className="input-minimal"
                                    maxLength="19"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Expiry</label>
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        className="input-minimal"
                                        maxLength="5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">CVV</label>
                                    <input
                                        type="text"
                                        placeholder="123"
                                        className="input-minimal"
                                        maxLength="3"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Cardholder Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="input-minimal"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCard(false)}
                                    className="flex-1 btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary"
                                >
                                    Add Card
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
