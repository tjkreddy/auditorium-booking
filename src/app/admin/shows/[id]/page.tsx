"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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

interface Booking {
  id: string;
  user_id: string;
  seat_id: string;
  show_id: string;
  total_amount: number;
  booking_date: string;
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface Seat {
  id: string;
  number: number;
  row: string;
  section: string;
  price: number | null;
  status: string | null;
  booked_at: string | null;
  reserved_at: string | null;
  expires_at: string | null;
  user_id: string | null;
  show_id: string;
  created_at: string;
  updated_at: string;
}

export default function ShowDetailPage() {
  const params = useParams();
  const showId = params?.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [show, setShow] = useState<Show | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session?.access_token) {
          router.push("/auth");
          return;
        }

        const response = await fetch("/api/admin/check", {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
          },
        });

        if (!response.ok) {
          router.push("/shows");
          return;
        }

        const data = await response.json();
        if (!data.isAdmin) {
          router.push("/shows");
          return;
        }

        // User is admin, proceed with loading data
        fetchShowDetails();
      } catch (error) {
        console.error("Admin check failed:", error);
        router.push("/shows");
      }
    };

    checkAdminStatus();
  }, [user, router]);

  useEffect(() => {
    if (showId) {
      fetchShowDetails();
    }
  }, [showId]);

  const fetchShowDetails = async () => {
    try {
      setLoading(true);

      // Fetch show details
      const { data: showData, error: showError } = await supabase
        .from("shows")
        .select("*")
        .eq("id", showId)
        .single();

      if (showError) throw showError;
      setShow(showData);

      // Fetch bookings for this show
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("show_id", showId);

      if (bookingError) throw bookingError;
      setBookings(bookingData || []);

      // Fetch seats for this show
      const { data: seatData, error: seatError } = await supabase
        .from("seats")
        .select("*")
        .eq("show_id", showId);

      if (seatError) throw seatError;
      setSeats(seatData || []);
    } catch (err) {
      console.error("Error fetching show details:", err);
      setError("Failed to load show details");
    } finally {
      setLoading(false);
    }
  };

  const getBookingStats = () => {
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + booking.total_amount,
      0
    );
    const bookedSeats = bookings.length; // Each booking corresponds to one seat
    const availableSeats = seats.filter(
      (seat) => seat.status === "available"
    ).length;

    return {
      totalBookings,
      totalRevenue,
      bookedSeats,
      availableSeats,
      totalSeats: seats.length,
    };
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

  if (error || !show) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error || "Show not found"}</p>
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = getBookingStats();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link
                  href="/admin"
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-4"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Admin
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">
                  {show.title}
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Show Details */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Show Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-900">{show.description}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">
                        {new Date(show.show_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">
                        {show.show_time} ({show.duration} minutes)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{show.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Bookings
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalBookings}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Revenue
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ₹{stats.totalRevenue.toFixed(2)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 bg-green-400 rounded"></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Booked Seats
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.bookedSeats}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 bg-gray-400 rounded"></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Available Seats
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.availableSeats}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Bookings
                </h2>
                {bookings.length === 0 ? (
                  <p className="text-gray-500">
                    No bookings yet for this show.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Booking ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Seats
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.slice(0, 10).map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {booking.id.slice(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(() => {
                                const seat = seats.find(s => s.id === booking.seat_id);
                                return seat ? `${seat.row}${seat.number}` : 'N/A';
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{booking.total_amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(
                                booking.created_at
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
