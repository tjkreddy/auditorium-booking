"use client";

import Link from "next/link";
import { Calendar, Users, MapPin, Armchair, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, signOut, mounted } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // Don't render auth-dependent content until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-600">MU Audi Booking</h1>
          <nav className="flex space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {user.user_metadata?.name || user.email}
                </span>
                <Link
                  href="/shows"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Browse Shows
                </Link>
                <Link
                  href="/bookings"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  My Bookings
                </Link>
                <Link
                  href="/admin"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Admin Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  <LogOut className="mr-2" size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Book Your Perfect Seat
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Reserve the best seats for upcoming shows and events in our premium
            auditorium. Interactive seat selection, instant confirmation.
          </p>
          {user ? (
            <Link
              href="/shows"
              className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-black transition-colors"
            >
              Browse Shows
            </Link>
          ) : (
            <Link
              href="/auth"
              className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-black transition-colors"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Calendar className="mx-auto mb-4 text-black" size={48} />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Easy Booking
            </h3>
            <p className="text-gray-600">
              Select your seats with our interactive seating chart
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Armchair className="mx-auto mb-4 text-black" size={48} />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Premium Seating
            </h3>
            <p className="text-gray-600">
              Choose from regular, premium, or VIP seating options
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <MapPin className="mx-auto mb-4 text-black" size={48} />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Prime Location
            </h3>
            <p className="text-gray-600">
              Our auditorium is located in the heart of the city
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Users className="mx-auto mb-4 text-black" size={48} />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Group Bookings
            </h3>
            <p className="text-gray-600">
              Book multiple seats together for your group
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 MU Audi Booking. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
