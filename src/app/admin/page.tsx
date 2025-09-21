"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, Plus, Users } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
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

interface BookingStats {
  totalBookings: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { user, mounted } = useAuth();
  const router = useRouter();

  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    totalRevenue: 0,
  });

  // Check if user is admin using server-side validation
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (mounted && user) {
        try {
          const response = await fetch("/api/admin/check", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            router.push("/shows");
            return;
          }
        } catch (error) {
          console.error("Admin check failed:", error);
          router.push("/shows");
          return;
        }
      }
    };

    checkAdminStatus();
  }, [user, mounted, router]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    show_date: "",
    show_time: "",
    duration: 120,
    venue: "Main Auditorium",
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchShows(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchShows = async () => {
    const { data, error } = await supabase
      .from("shows")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shows:", error);
    } else {
      setShows(data || []);
    }
  };

  const fetchStats = async () => {
    // Get total bookings and revenue
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("total_amount");

    if (!error && bookings) {
      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce(
        (sum, booking) => sum + booking.total_amount,
        0
      );
      setStats({ totalBookings, totalRevenue });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: show, error } = await supabase
      .from("shows")
      .insert({
        title: formData.title,
        description: formData.description,
        show_date: formData.show_date,
        show_time: formData.show_time,
        duration: formData.duration,
        venue: formData.venue,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating show:", error);
      alert("Failed to create show");
      return;
    }

    // Initialize seats for the show
    const { error: seatsError } = await supabase.rpc("initialize_show_seats", {
      p_show_id: show.id,
    });

    if (seatsError) {
      console.error("Error initializing seats:", seatsError);
      alert("Show created but failed to initialize seats");
    } else {
      alert("Show created successfully with seats initialized!");
    }

    // Reset form and refresh data
    setFormData({
      title: "",
      description: "",
      show_date: "",
      show_time: "",
      duration: 120,
      venue: "Main Auditorium",
    });
    setShowForm(false);
    fetchShows();
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
                Admin Dashboard
              </h1>
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← Back to Home
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Bookings
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalBookings}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">₹</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Create Show Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
            >
              <Plus className="mr-2" size={16} />
              {showForm ? "Cancel" : "Create New Show"}
            </button>
          </div>

          {/* Create Show Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Create New Show</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      aria-label="Show title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue
                    </label>
                    <select
                      name="venue"
                      value={formData.venue}
                      onChange={handleInputChange}
                      aria-label="Venue selection"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option>Main Auditorium</option>
                      <option>Mini Theater</option>
                      <option>Open Air Stage</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    aria-label="Show description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="show_date"
                      value={formData.show_date}
                      onChange={handleInputChange}
                      required
                      aria-label="Show date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      name="show_time"
                      value={formData.show_time}
                      onChange={handleInputChange}
                      required
                      aria-label="Show time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="30"
                      max="480"
                      aria-label="Show duration in minutes"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Create Show
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Shows List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">All Shows</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {shows.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No shows created yet. Create your first show above!
                </div>
              ) : (
                shows.map((show) => (
                  <div key={show.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {show.title}
                        </h4>
                        <p className="text-gray-600 mt-1">{show.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="mr-1" size={14} />
                            {new Date(show.show_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1" size={14} />
                            {show.show_time} ({show.duration}min)
                          </div>
                          <div className="flex items-center">
                            <MapPin className="mr-1" size={14} />
                            {show.venue}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/admin/shows/${show.id}`}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
