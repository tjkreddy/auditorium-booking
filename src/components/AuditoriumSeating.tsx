"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Seat {
  id: string;
  row: string;
  number: number;
  section: string;
  status: "available" | "reserved" | "booked";
  price: number;
  user_id?: string;
}

export interface SelectedSeat {
  id: string;
  row: string;
  number: number;
  section: string;
  price: number;
}

interface AuditoriumSeatingProps {
  selectedSeats: SelectedSeat[];
  onSeatSelect: (seat: SelectedSeat) => void;
  onSeatDeselect: (seatId: string) => void;
  showId: string;
  userId: string;
}

export default function AuditoriumSeating({
  selectedSeats,
  onSeatSelect,
  onSeatDeselect,
  showId,
  userId,
}: AuditoriumSeatingProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);

  const fetchSeats = useCallback(async () => {
    try {
      const response = await fetch(`/api/seats?showId=${showId}`);
      if (response.ok) {
        const seatsData = await response.json();
        setSeats(seatsData);
      } else {
        console.error("Failed to fetch seats");
      }
    } catch (error) {
      console.error("Error fetching seats:", error);
    } finally {
      setLoading(false);
    }
  }, [showId]);

  // Fetch seats from API
  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  // Set up real-time subscription for seat updates
  useEffect(() => {
    if (!showId) return;

    const channel = supabase
      .channel(`seats-${showId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seats",
          filter: `show_id=eq.${showId}`,
        },
        (payload) => {
          console.log("Seat change received:", payload);
          // Refresh seats when changes occur
          fetchSeats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId]);

  // Calculate distance between two touch points
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle touch start for pinch gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
      setInitialZoom(zoomLevel);
    }
  };

  // Handle touch move for pinch gesture
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance !== null) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance;
      const newZoom = Math.max(0.5, Math.min(2, initialZoom * scale));
      setZoomLevel(newZoom);
    }
  };

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setInitialDistance(null);
      setInitialZoom(1);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    // Don't allow clicking on booked seats
    if (seat.status === "booked") return;

    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    if (isSelected) {
      // Deselect seat
      onSeatDeselect(seat.id);
    } else {
      // Single seat selection - clear previous selection
      if (selectedSeats.length > 0) {
        onSeatDeselect(selectedSeats[0].id);
      }

      // Select seat
      onSeatSelect({
        id: seat.id,
        row: seat.row,
        number: seat.number,
        section: seat.section,
        price: seat.price,
      });
    }
  };

  const getSeatColor = (seat: Seat) => {
    if (seat.status === "booked")
      return "bg-gray-400 cursor-not-allowed text-gray-600";
    if (seat.status === "reserved")
      return "bg-yellow-400 cursor-not-allowed text-gray-800";

    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    if (isSelected) return "bg-green-500 text-white";

    // Available seats (blue like BookMyShow)
    return "bg-blue-300 hover:bg-blue-400 cursor-pointer text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Group seats by section and row for auditorium layout
  const seatsBySectionAndRow = seats.reduce((acc, seat) => {
    const key = `${seat.section}-${seat.row}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Define section layout (6 sections in semi-circle)
  const sections = [
    "section1",
    "section2",
    "section3",
    "section4",
    "section5",
    "section6",
  ];

  // Row configuration matching the original design
  const rowConfig = [
    { id: "A", seats: 41 },
    { id: "B", seats: 42 },
    { id: "C", seats: 44 },
    { id: "D", seats: 46 },
    { id: "E", seats: 46 },
    { id: "F", seats: 48 },
    { id: "G", seats: 48 },
    { id: "H", seats: 50 },
    { id: "I", seats: 52 },
    { id: "J", seats: 52 },
    { id: "K", seats: 55 },
    { id: "L", seats: 56 },
    { id: "M", seats: 56 },
    { id: "N", seats: 60 },
    { id: "O", seats: 60 },
    { id: "P", seats: 62 },
    { id: "Q", seats: 63 },
    { id: "R", seats: 64 },
    { id: "S", seats: 66 },
    { id: "T", seats: 43 },
  ];

  // Split rows between front and back sections
  const frontRows = rowConfig.slice(0, 10).map((r) => r.id); // A through J
  const backRows = rowConfig.slice(10).map((r) => r.id); // K through T

  // Render seats for a specific section and row
  const renderSectionRow = (sectionId: string, rowId: string) => {
    const key = `${sectionId}-${rowId}`;
    const rowSeats = seatsBySectionAndRow[key] || [];

    if (rowSeats.length === 0) return null;

    // Sort seats by number
    const sortedSeats = rowSeats.sort((a, b) => a.number - b.number);

    // Determine if this section should be right-aligned (left sections of auditorium)
    const isRightAligned = sectionId === "section1" || sectionId === "section4";

    return (
      <div key={key} className="flex items-center gap-2 mb-1">
        {/* Row label */}
        <div className="w-6 text-xs font-medium text-gray-600 text-center">
          {rowId}
        </div>

        {/* Seats container */}
        <div
          className={`flex gap-1 flex-wrap ${
            isRightAligned ? "justify-end" : ""
          }`}
        >
          {sortedSeats.map((seat) => {
            const isSelected = selectedSeats.some((s) => s.id === seat.id);
            const isDisabled =
              seat.status === "booked" || seat.status === "reserved";

            return (
              <button
                key={seat.id}
                onClick={() => handleSeatClick(seat)}
                className={`w-6 h-6 text-xs rounded transition-colors flex items-center justify-center border border-gray-300 flex-shrink-0 ${
                  seat.status === "booked"
                    ? "bg-gray-400 cursor-not-allowed text-gray-600"
                    : seat.status === "reserved"
                    ? "bg-yellow-400 cursor-not-allowed text-gray-800"
                    : isSelected
                    ? "bg-green-500 text-white"
                    : "bg-blue-300 hover:bg-blue-400 cursor-pointer text-gray-800"
                }`}
                disabled={isDisabled}
                title={`Seat ${seat.row}${seat.number} - ₹${seat.price}`}
              >
                {seat.number}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto relative">
      {/* Zoom Level Indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <span className="text-sm font-medium">
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>

      {/* Zoomable Content */}
      <div
        className="transition-transform duration-200 origin-center"
        style={{ transform: `scale(${zoomLevel})` }} // eslint-disable-line react/style-prop-object
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
          Select Your Seats
        </h2>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-300 rounded border"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded border"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded border"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded border"></div>
            <span>Booked</span>
          </div>
        </div>

        {/* Auditorium Layout */}
        <div className="space-y-6">
          {/* Screen */}
          <div className="flex justify-center">
            <div className="bg-gray-800 text-white text-center py-3 px-16 rounded">
              STAGE / SCREEN
            </div>
          </div>

          {/* Front Section (Sections 1-3, Rows A-J) */}
          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
              FRONT SECTION
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {sections.slice(0, 3).map((sectionId) => (
                <div key={sectionId} className="space-y-1">
                  <div className="text-xs font-medium text-gray-600 text-center mb-2">
                    Section {sectionId.slice(-1)}
                  </div>
                  {frontRows.map((rowId) => renderSectionRow(sectionId, rowId))}
                </div>
              ))}
            </div>
          </div>

          {/* Back Section (Sections 4-6, Rows K-T) */}
          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
              BACK SECTION
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {sections.slice(3, 6).map((sectionId) => (
                <div key={sectionId} className="space-y-1">
                  <div className="text-xs font-medium text-gray-600 text-center mb-2">
                    Section {sectionId.slice(-1)}
                  </div>
                  {backRows.map((rowId) => renderSectionRow(sectionId, rowId))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
