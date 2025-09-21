import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";

export type NextApiResponseServerIo = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

interface SeatData {
  status: "available" | "reserved" | "booked";
  userId?: string;
  showId?: string;
  expiresAt?: number;
  reservedAt?: number;
  bookedAt?: number;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    console.log("*First use, starting Socket.IO server...");

    const io = new ServerIO(res.socket.server, {
      path: "/api/socketio",
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? false
            : "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    // Store seats data in memory (in production, use Redis or database)
    const seatsData: { [key: string]: SeatData } = {};

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Send current seats data to new client
      socket.emit("seats-update", seatsData);

      // Handle seat selection
      socket.on(
        "seat-select",
        (data: { seatId: string; userId: string; showId: string }) => {
          const { seatId, userId, showId } = data;

          // Check if seat is already booked
          if (seatsData[seatId]?.status === "booked") {
            socket.emit("seat-booked", {
              seatId,
              message: "Seat already booked!",
            });
            return;
          }

          // Temporarily reserve seat (hold for 5 minutes)
          seatsData[seatId] = {
            status: "reserved",
            userId,
            showId,
            reservedAt: Date.now(),
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
          };

          // Broadcast to all clients
          io.emit("seats-update", seatsData);
          socket.emit("seat-reserved", {
            seatId,
            message: "Seat reserved for 5 minutes!",
          });
        }
      );

      // Handle seat booking confirmation
      socket.on(
        "seat-confirm",
        (data: { seatId: string; userId: string; showId: string }) => {
          const { seatId, userId, showId } = data;

          if (seatsData[seatId]?.userId === userId) {
            seatsData[seatId] = {
              status: "booked",
              userId,
              showId,
              bookedAt: Date.now(),
            };

            // Broadcast to all clients
            io.emit("seats-update", seatsData);
            socket.emit("seat-booked", {
              seatId,
              message: "Seat successfully booked!",
            });
          }
        }
      );

      // Handle seat deselection
      socket.on("seat-deselect", (data: { seatId: string; userId: string }) => {
        const { seatId, userId } = data;

        if (
          seatsData[seatId]?.userId === userId &&
          seatsData[seatId]?.status === "reserved"
        ) {
          delete seatsData[seatId];
          io.emit("seats-update", seatsData);
        }
      });

      // Handle reservation expiry check
      socket.on("check-expiry", () => {
        const now = Date.now();
        let hasExpired = false;

        Object.keys(seatsData).forEach((seatId) => {
          const seat = seatsData[seatId];
          if (seat.status === "reserved" && seat.expiresAt && seat.expiresAt < now) {
            delete seatsData[seatId];
            hasExpired = true;
          }
        });

        if (hasExpired) {
          io.emit("seats-update", seatsData);
        }
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("Socket.IO server already running");
  }

  res.end();
};

export default ioHandler;
