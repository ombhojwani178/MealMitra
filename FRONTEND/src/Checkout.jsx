import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./context/CartContext";

export default function Checkout() {
  const { cartItems, getCartTotal } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", address: "", phone: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.phone) {
      alert("Please fill in all your details.");
      return;
    }

    const orderDetails = {
      ...formData,
      total: getCartTotal(),
      items: cartItems,
    };

    // Navigate to the simulated UPI payment page with order details
    navigate("/upi-payment", { state: orderDetails });
  };

  return (
    <div className="min-h-screen bg-green-50 py-12 px-6">
      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-10">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-6 border-b pb-4">
            Order Summary
          </h2>
          <div className="flex flex-col gap-3 mb-4">
            {cartItems.map((item) => (
              <div key={item._id} className="flex justify-between">
                <span className="text-gray-700">{item.title} (x{item.quantity})</span>
                <span className="font-semibold">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 flex justify-between text-xl font-bold text-gray-900">
            <span>Total</span>
            <span>₹{getCartTotal()}</span>
          </div>
        </div>

        {/* User Details Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-6">
            Confirmation Details
          </h2>
          <form onSubmit={handleSubmitOrder} className="flex flex-col gap-5">
            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="border-2 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-300" required />
            <input type="text" name="address" placeholder="Address for Pickup/Delivery" value={formData.address} onChange={handleChange} className="border-2 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-300" required />
            <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="border-2 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-300" required />
            
            <button type="submit" className="w-full bg-green-600 text-white font-semibold text-lg py-3 rounded-xl hover:bg-green-700 shadow-lg transition mt-4">
              Proceed to Payment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}