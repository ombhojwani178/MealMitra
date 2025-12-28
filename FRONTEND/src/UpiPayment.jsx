import React from "react"; // Add this line to import React
import { useLocation, useNavigate } from "react-router-dom";
import ReactQRCode from "react-qr-code";
import { useCart } from "./context/CartContext";

export default function UpiPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const orderDetails = location.state || { total: 0 };
  
  const handlePaymentConfirm = () => {
    console.log("Payment Confirmed for order:", orderDetails);
    clearCart();
    navigate("/order-confirmation");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center">
        <h1 className="text-3xl font-bold text-green-800 mb-2">Scan to Complete</h1>
        <p className="text-gray-700 text-lg mb-6">
          You are confirming a collection of <span className="font-bold text-black">₹{orderDetails.total}</span>
        </p>
        <div className="p-4 bg-white rounded-md shadow-inner inline-block">
          <ReactQRCode value={`upi://pay?pa=your-upi-id@okhdfcbank&pn=MealMitra&am=${orderDetails.total}&cu=INR`} size={256} />
        </div>
        <p className="text-gray-600 text-sm mt-6 mb-8">
          This is a simulation. Click below to confirm your collection.
        </p>
        <button onClick={handlePaymentConfirm} className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition font-semibold text-lg">
          Collection Confirmed
        </button>
      </div>
    </div>
  );
}