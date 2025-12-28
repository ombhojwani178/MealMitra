import React from "react";
import { Link } from "react-router-dom";

export default function OrderConfirmation() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          Collection Confirmed!
        </h1>
        <p className="text-gray-700 text-lg mb-8">
          Thank you for helping reduce food waste. The donor(s) have been notified.
        </p>
        <Link
          to="/"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}