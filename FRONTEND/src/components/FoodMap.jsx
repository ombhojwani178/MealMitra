import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { io } from "socket.io-client";
import 'leaflet/dist/leaflet.css';
import API from '../api'; // Your configured axios instance

const socket = io("http://localhost:5001");

const donorIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/emoji/48/000000/green-circle-emoji.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const receiverIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/emoji/48/000000/red-circle-emoji.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const geocodeAddress = async (address) => {
  const query = encodeURIComponent(address);
  const apiKey = 'e809430e7727472da5e0607b1a3ee3ec';
  try {
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return [Number(lat), Number(lng)];
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// A new component for the popup content
const ListingPopup = ({ listing, onClaim }) => {
    const [claimQuantity, setClaimQuantity] = useState(1);
    const [isClaiming, setIsClaiming] = useState(false);
    const [isClaimed, setIsClaimed] = useState(false);

    const handleClaimClick = async () => {
        if (claimQuantity > 0 && claimQuantity <= listing.quantity && listing.quantity > 0) {
            setIsClaiming(true);
            try {
                await onClaim(listing._id, claimQuantity);
                setIsClaimed(true);
                setTimeout(() => setIsClaimed(false), 2000);
            } catch (error) {
                // Error handling is done in parent
            } finally {
                setIsClaiming(false);
            }
        } else {
            alert("Please enter a valid quantity.");
        }
    };

    return (
        <div style={{ minWidth: '200px' }}>
            <h4 style={{ marginBottom: '8px', fontWeight: 'bold' }}>{listing.title}</h4>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>By: {listing.donor?.name || 'Anonymous'}</p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>Description: {listing.description || 'N/A'}</p>
            <p style={{ margin: '8px 0', fontWeight: 'bold', color: listing.quantity > 0 ? '#16a34a' : '#dc2626' }}>
                Available Qty: {listing.quantity}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px', gap: '8px' }}>
                <input
                    type="number"
                    min="1"
                    max={listing.quantity}
                    value={claimQuantity}
                    onChange={(e) => setClaimQuantity(Number(e.target.value))}
                    disabled={listing.quantity <= 0 || isClaiming}
                    style={{ 
                        width: '60px', 
                        padding: '6px', 
                        border: '2px solid #ccc',
                        borderRadius: '6px',
                        opacity: listing.quantity <= 0 ? 0.6 : 1
                    }}
                />
                <button 
                    onClick={handleClaimClick}
                    disabled={listing.quantity <= 0 || isClaiming}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: isClaiming 
                            ? '#eab308' 
                            : isClaimed 
                            ? '#22c55e' 
                            : listing.quantity > 0 
                            ? '#16a34a' 
                            : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: listing.quantity <= 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.3s',
                        transform: isClaiming ? 'scale(0.95)' : isClaimed ? 'scale(1.05)' : 'scale(1)',
                        opacity: listing.quantity <= 0 ? 0.6 : 1
                    }}
                >
                    {isClaiming ? 'Claiming...' : isClaimed ? '✓ Claimed!' : 'Claim'}
                </button>
            </div>
        </div>
    );
};


export default function FoodMap() {
  const [listings, setListings] = useState([]);
  const [receivers] = useState([
    { id: 'rec1', name: 'Charity Home Delhi', position: [28.6167, 77.2083] }
  ]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/api/listings');
      if (data.success) {
        const geocodedListings = await Promise.all(
          data.listings.map(async (listing) => {
            const position = await geocodeAddress(listing.location);
            return { ...listing, position };
          })
        );
        setListings(geocodedListings.filter(l => l.position));
      }
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    socket.on("update-listings", fetchListings);
    return () => {
      socket.off("update-listings");
    };
  }, []);

  const handleClaim = async (listingId, claimQuantity) => {
    try {
      const response = await API.post(`/api/listings/claim/${listingId}`, { claimQuantity });
      if (response.data.success) {
        // Update the listing in state to reflect the new quantity
        setListings(prevListings => 
          prevListings.map(l => {
            if (l._id === listingId) {
              const newQuantity = l.quantity - claimQuantity;
              return {
                ...l,
                quantity: newQuantity,
                status: newQuantity === 0 ? 'claimed' : l.status
              };
            }
            return l;
          })
        );
        alert(`✅ Successfully claimed ${claimQuantity} ${claimQuantity === 1 ? 'item' : 'items'}!`);
      }
    } catch (error) {
      console.error("Error claiming listing:", error);
      alert(error.response?.data?.message || "Failed to claim food. You must be logged in as a receiver.");
      throw error; // Re-throw so popup can handle it
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        {loading && (
            <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <p>Loading Donations...</p>
            </div>
        )}
      <MapContainer center={[22.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {listings.map(listing => (
          <Marker key={listing._id} position={listing.position} icon={donorIcon}>
            <Popup>
                <ListingPopup listing={listing} onClaim={handleClaim} />
            </Popup>
          </Marker>
        ))}
        {receivers.map(receiver => (
            <Marker key={receiver.id} position={receiver.position} icon={receiverIcon}>
                <Popup><h4>{receiver.name}</h4><p>Verified Receiver</p></Popup>
            </Marker>
        ))}
      </MapContainer>
    </div>
  );
}