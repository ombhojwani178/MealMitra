import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import AuthContext from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import FoodMap from "./components/FoodMap";

export default function ReceiveResults() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifiedNgos, setVerifiedNgos] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [claimedIds, setClaimedIds] = useState(new Set());

  const { user } = useContext(AuthContext);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const userType = location.state?.userType || 'individual';

  const MOCK_NGO_LIST = [
    "Hope & Hunger Foundation",
    "Community Kitchen Services",
    "Sahara Relief Organization",
  ];

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/listings");
        if (response.data && Array.isArray(response.data.listings)) {
          setListings(response.data.listings);
        } else {
          setError("Could not find any listings.");
        }
      } catch (err) {
        setError("Failed to fetch available donations.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handleVerifyClick = (listing) => {
    setVerifiedNgos({
      listingTitle: listing.title,
      ngos: MOCK_NGO_LIST,
    });
  };

  const handleAddToCart = async (listing) => {
    const claimAmount = parseInt(document.getElementById(`claim-quantity-${listing._id}`).value);

    if (!user) {
      alert("Please log in to add items to your cart.");
      return navigate("/login");
    }
    if (isNaN(claimAmount) || claimAmount <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
    if (claimAmount > listing.quantity) {
      alert(`You cannot claim more than the available quantity of ${listing.quantity}.`);
      return;
    }
    if (listing.quantity <= 0) {
      alert("This item is out of stock.");
      return;
    }

    // Set claiming state for animation
    setClaimingId(listing._id);

    try {
      // Call the claim API to update the listing
      const response = await api.post(`/api/listings/claim/${listing._id}`, {
        claimQuantity: claimAmount
      });

      if (response.data.success) {
        // Update the listing in state
        setListings(prevListings => 
          prevListings.map(l => {
            if (l._id === listing._id) {
              const newQuantity = l.quantity - claimAmount;
              return {
                ...l,
                quantity: newQuantity,
                status: newQuantity === 0 ? 'claimed' : l.status
              };
            }
            return l;
          })
        );

        // Add to cart
        const price = userType === 'ngo' ? 0 : (listing.price || 0);
        addToCart(listing, claimAmount, price);

        // Show success animation
        setClaimedIds(prev => new Set([...prev, listing._id]));
        setTimeout(() => {
          setClaimedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(listing._id);
            return newSet;
          });
        }, 2000);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to claim item. Please try again.";
      alert(message);
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <div className="text-center py-20">Loading donations...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-green-50 py-12 px-6">
      <h2 className="text-4xl font-extrabold text-green-800 text-center mb-10">
        Live Donations Map & Listings
      </h2>

      <div className="max-w-6xl mx-auto mb-16">
        <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl" style={{ paddingTop: '40%' }}>
          <div className="absolute top-0 left-0 w-full h-full">
            <FoodMap />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {listings.map((listing) => {
          const price = userType === 'ngo' ? 0 : (listing.price || 0);

          return (
            <div key={listing._id} className="bg-white rounded-2xl shadow-xl p-6 flex flex-col">
              {listing.verified && (
                <div
                  className="absolute top-4 right-4 bg-lime-600 text-white text-xs px-3 py-1 rounded-full cursor-pointer"
                  onClick={() => handleVerifyClick(listing)}
                  title="Click to see verification history"
                >
                  ✅ MealMitra Assured
                </div>
              )}
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-green-800 mb-2 pr-24">{listing.title}</h3>
                <p className="text-gray-600 mb-3">📍 {listing.location}</p>
                <div className="text-sm text-gray-600 mb-4 space-y-2 pt-2 border-t">
                  <p><strong>Description:</strong> {listing.description}</p>
                  <p><strong>Available:</strong> <span className="text-lg font-semibold text-lime-600">{listing.quantity}</span> servings</p>
                  <p><strong>Donor:</strong> {listing.donor?.name || "Anonymous"}</p>
                  <p className="text-lg font-semibold text-green-700 mt-2">
                    Price: ₹{price} / serving
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t">
                <div className="flex items-center gap-4 mb-4">
                  <label htmlFor={`claim-quantity-${listing._id}`} className="text-sm font-medium">Claim for (people):</label>
                  <input
                    type="number"
                    id={`claim-quantity-${listing._id}`}
                    min="1"
                    max={listing.quantity}
                    defaultValue="1"
                    disabled={listing.quantity <= 0 || claimingId === listing._id}
                    className={`border-2 rounded-lg p-2 w-full transition-all ${
                      listing.quantity <= 0 || claimingId === listing._id
                        ? 'bg-gray-100 cursor-not-allowed opacity-60'
                        : 'focus:border-green-500 focus:ring-2 focus:ring-green-200'
                    }`}
                  />
                </div>
                <button
                  onClick={() => handleAddToCart(listing)}
                  disabled={listing.quantity <= 0 || claimingId === listing._id}
                  className={`w-full font-semibold py-3 rounded-xl transition-all duration-300 transform ${
                    claimingId === listing._id
                      ? 'bg-yellow-500 text-white scale-95 animate-pulse'
                      : claimedIds.has(listing._id)
                      ? 'bg-green-500 text-white scale-105 shadow-lg'
                      : listing.quantity > 0
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:scale-105 hover:shadow-xl'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  {claimingId === listing._id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Claiming...
                    </span>
                  ) : claimedIds.has(listing._id) ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Added to Cart!
                    </span>
                  ) : listing.quantity > 0 ? (
                    "Add to Cart"
                  ) : (
                    "Out of Stock"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {verifiedNgos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold text-green-800 mb-4">
              Verification History: {verifiedNgos.listingTitle}
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              This donor is trusted because the following NGOs have successfully claimed from them:
            </p>
            <ul className="space-y-2 mb-6">
              {verifiedNgos.ngos.map((ngo, index) => (
                <li key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <span className="text-lime-500 text-lg">★</span> {ngo}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setVerifiedNgos(null)}
              className="w-full bg-lime-500 text-white font-semibold py-2 rounded-xl hover:bg-lime-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}