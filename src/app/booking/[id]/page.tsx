"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, MapPin } from "lucide-react";
import AuditoriumSeating, {
  SelectedSeat,
} from "@/components/AuditoriumSeating";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Show {
  id: string;
  title: string;
  description: string | null;
  show_date: string;
  show_time: string;
  duration: number;
  venue: string;
  created_at: string;
  updated_at: string;
}

export default function BookingPage() {
  const params = useParams();
  const showId = params?.id as string;
  const { user } = useAuth();

  const [show, setShow] = useState<Show | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (showId) {
      fetchShow();
    }
  }, [showId]);

  const fetchShow = async () => {
    try {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("id", showId)
        .single();

      if (error) throw error;
      setShow(data);
    } catch (err) {
      console.error("Error fetching show:", err);
      setError("Show not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seat: SelectedSeat) => {
    setSelectedSeats((prev) => [...prev, seat]);
  };

  const handleSeatDeselect = (seatId: string) => {
    setSelectedSeats((prev) => prev.filter((seat) => seat.id !== seatId));
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0 || !user) return;

    setBookingLoading(true);
    setError("");

    try {
      // First reserve the seats
      const reserveResponse = await fetch("/api/seats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatIds: selectedSeats.map((seat) => seat.id),
          userId: user.id,
        }),
      });

      if (!reserveResponse.ok) {
        const errorData = await reserveResponse.json();
        throw new Error(errorData.error || "Failed to reserve seats");
      }

      // Then create the booking
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          seatIds: selectedSeats.map((seat) => seat.id),
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || "Failed to create booking");
      }

      const bookingData = await bookingResponse.json();
      setBookingSuccess(true);

      // Redirect to bookings page after 3 seconds
      setTimeout(() => {
        window.location.href = "/bookings";
      }, 3000);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !show) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error || "Show not found"}</p>
            <Link
              href="/shows"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shows
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-red-600">MU Audi Booking</h1>
            <Link
              href="/shows"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Shows
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Show Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {show.title}
            </h1>
            <p className="text-gray-600 mb-4">{show.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="mr-2" size={16} />
                {new Date(show.show_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="flex items-center">
                <Clock className="mr-2" size={16} />
                {show.show_time} • {Math.floor(show.duration / 60)}h{" "}
                {show.duration % 60}m
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2" size={16} />
                {show.venue}
              </div>
            </div>
          </div>

          <div className="w-full">
            {/* Seating Chart */}
            <AuditoriumSeating
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
              onSeatDeselect={handleSeatDeselect}
              showId={showId}
              userId={user?.id || ""}
            />

            {/* Booking Summary */}
            {selectedSeats.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Booking Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {selectedSeats.length} seat
                      {selectedSeats.length > 1 ? "s" : ""} selected
                    </span>
                    <span className="font-medium">₹{totalAmount}</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-green-600">₹{totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Selected Seats:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((seat) => (
                      <span
                        key={seat.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        Row {seat.row}
                        {seat.number} (₹{seat.price})
                      </span>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                {bookingSuccess && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    🎉 Booking confirmed! Redirecting to your bookings...
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={bookingLoading || bookingSuccess}
                  className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Booking...
                    </div>
                  ) : bookingSuccess ? (
                    "Booking Confirmed!"
                  ) : (
                    `Book ${selectedSeats.length} Seat${
                      selectedSeats.length > 1 ? "s" : ""
                    } - ₹${totalAmount}`
                  )}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
