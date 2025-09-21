"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin, Ticket } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Booking {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  show: {
    id: string;
    title: string;
    show_date: string;
    show_time: string;
    venue: string;
  };
  seat: {
    row: string;
    number: number;
    section: string;
  };
}

export default function BookingsPage() {
  const { user, session } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/bookings?userId=${user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-red-600">
                MU Audi Booking
              </h1>
              <Link
                href="/shows"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Shows
              </Link>
            </div>
            {user && (
              <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-4">
                <div>
                  <span className="font-medium">Welcome:</span>{" "}
                  {user.user_metadata?.name || user.email}
                </div>
                <div>
                  <span className="font-medium">Session ID:</span>{" "}
                  {session?.access_token
                    ? `${session.access_token.slice(0, 8)}...`
                    : "N/A"}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    My Bookings
                  </h1>
                  <p className="text-gray-600">
                    View all your auditorium bookings
                  </p>
                </div>
                <button
                  onClick={fetchBookings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {bookings.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {bookings.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Bookings</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-green-600">
                      ₹
                      {bookings.reduce(
                        (sum, booking) => sum + booking.total_amount,
                        0
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {bookings.filter((b) => b.status === "confirmed").length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Confirmed Bookings
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No bookings yet
                </h3>
                <p className="text-gray-600 mb-6">
                  You haven&apos;t booked any seats yet.
                </p>
                <Link
                  href="/shows"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Browse Shows
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {booking.show.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="mr-1" size={14} />
                            {new Date(
                              booking.show.show_date
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1" size={14} />
                            {booking.show.show_time}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="mr-1" size={14} />
                            {booking.show.venue}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ₹{booking.total_amount}
                        </div>
                        <div
                          className={`text-sm px-2 py-1 rounded-full ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Ticket className="mr-2 text-gray-400" size={16} />
                          <span className="text-gray-700">
                            Seat: Row {booking.seat.row}
                            {booking.seat.number} ({booking.seat.section})
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Booked on{" "}
                          {new Date(booking.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
