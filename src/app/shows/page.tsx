"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";

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

export default function Shows() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    const { data, error } = await supabase
      .from("shows")
      .select("*")
      .order("show_date", { ascending: true });

    if (error) {
      console.error("Error fetching shows:", error);
    } else {
      setShows(data || []);
    }
    setLoading(false);
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
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-red-600">
                MU Audi Booking
              </h1>
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Admin Dashboard
                </Link>
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Shows List */}
        <main className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Available Shows
          </h2>

          {shows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No shows available at the moment.
              </p>
              <p className="text-gray-400 mt-2">
                Check back later for upcoming events!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shows.map((show) => (
                <div
                  key={show.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {show.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {show.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-500">
                        <Calendar className="mr-2" size={16} />
                        <span>
                          {new Date(show.show_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Clock className="mr-2" size={16} />
                        <span>
                          {show.show_time} ({show.duration} min)
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <MapPin className="mr-2" size={16} />
                        <span>{show.venue}</span>
                      </div>
                    </div>

                    <Link
                      href={`/booking/${show.id}`}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-center block"
                    >
                      Book Seats
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
