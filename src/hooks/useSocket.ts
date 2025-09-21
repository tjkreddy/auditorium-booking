import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface SeatData {
  status: "available" | "reserved" | "booked";
  userId?: string;
  showId?: string;
  reservedAt?: number;
  expiresAt?: number;
  bookedAt?: number;
}

export interface SeatsData {
  [seatId: string]: SeatData;
}

export const useSocket = (showId: string, userId: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [seatsData, setSeatsData] = useState<SeatsData>({});
  const [isConnected, setIsConnected] = useState(false);
  const [reservationTimer, setReservationTimer] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(
      process.env.NODE_ENV === "production" ? "" : "http://localhost:3000",
      {
        path: "/api/socketio",
      }
    );

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
      setIsConnected(false);
    });

    // Seat events
    socket.on("seats-update", (data: SeatsData) => {
      console.log("Seats updated:", data);
      setSeatsData(data);
    });

    socket.on("seat-reserved", (data: { seatId: string; message: string }) => {
      console.log("Seat reserved:", data);
      // You can show a toast notification here
    });

    socket.on("seat-booked", (data: { seatId: string; message: string }) => {
      console.log("Seat booked:", data);
      // You can show a toast notification here
    });

    // Check for expired reservations every 30 seconds
    const expiryCheck = setInterval(() => {
      socket.emit("check-expiry");
    }, 30000);

    return () => {
      clearInterval(expiryCheck);
      socket.disconnect();
    };
  }, []);

  // Seat selection function
  const selectSeat = (seatId: string) => {
    if (!socketRef.current || !isConnected) return;

    socketRef.current.emit("seat-select", {
      seatId,
      userId,
      showId,
    });

    // Set a timer to auto-confirm after 30 seconds (for demo purposes)
    const timer = setTimeout(() => {
      confirmSeat(seatId);
    }, 30000);

    setReservationTimer(timer);
  };

  // Seat confirmation function
  const confirmSeat = (seatId: string) => {
    if (!socketRef.current || !isConnected) return;

    socketRef.current.emit("seat-confirm", {
      seatId,
      userId,
      showId,
    });

    if (reservationTimer) {
      clearTimeout(reservationTimer);
      setReservationTimer(null);
    }
  };

  // Seat deselection function
  const deselectSeat = (seatId: string) => {
    if (!socketRef.current || !isConnected) return;

    socketRef.current.emit("seat-deselect", {
      seatId,
      userId,
    });

    if (reservationTimer) {
      clearTimeout(reservationTimer);
      setReservationTimer(null);
    }
  };

  // Get seat status
  const getSeatStatus = (
    seatId: string
  ): "available" | "reserved" | "booked" => {
    const seat = seatsData[seatId];
    if (!seat) return "available";

    // Check if reservation has expired
    if (
      seat.status === "reserved" &&
      seat.expiresAt &&
      seat.expiresAt < Date.now()
    ) {
      return "available";
    }

    return seat.status;
  };

  return {
    seatsData,
    isConnected,
    selectSeat,
    confirmSeat,
    deselectSeat,
    getSeatStatus,
  };
};
