// src/hooks/useSocket.ts
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5000");

type StockUpdateHandler = (data: any) => void;
type NotificationHandler = (data: any) => void;

export const useSocket = (
  onStockUpdate: StockUpdateHandler,
  onNotification?: NotificationHandler
): void => {
  useEffect(() => {
    socket.on("stockUpdated", onStockUpdate);

    if (onNotification) {
      socket.on("notification", onNotification);
    }

    return () => {
      socket.off("stockUpdated", onStockUpdate);
      if (onNotification) {
        socket.off("notification", onNotification);
      }
    };
  }, [onStockUpdate, onNotification]);
};
