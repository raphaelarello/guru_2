import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Notification {
  id: string;
  type: "goal" | "card" | "corner" | "substitution";
  title: string;
  message: string;
  team: string;
  timestamp: number;
}

export function EventNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Reproduzir som de notificação
  const playSound = (type: "goal" | "card" | "corner" | "substitution") => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === "goal") {
      // Som de gol (frequência alta)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === "card") {
      // Som de cartão (frequência média)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } else if (type === "corner") {
      // Som de escanteio (frequência baixa)
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  };

  // Adicionar notificação
  const addNotification = (notification: Omit<Notification, "id" | "timestamp">) => {
    const id = Math.random().toString(36);
    const newNotif: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [newNotif, ...prev].slice(0, 5));
    playSound(notification.type);

    // Remover após 5 segundos
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  // Expor função globalmente para uso em outros componentes
  useEffect(() => {
    (window as any).addEventNotification = addNotification;
    return () => {
      delete (window as any).addEventNotification;
    };
  }, []);

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "goal":
        return "bg-green-500/90 border-green-400";
      case "card":
        return "bg-yellow-500/90 border-yellow-400";
      case "corner":
        return "bg-blue-500/90 border-blue-400";
      case "substitution":
        return "bg-purple-500/90 border-purple-400";
      default:
        return "bg-slate-500/90 border-slate-400";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "goal":
        return "⚽";
      case "card":
        return "🟨";
      case "corner":
        return "🚩";
      case "substitution":
        return "🔄";
      default:
        return "📢";
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`${getNotificationStyle(notif.type)} border-2 rounded-lg p-3 text-white shadow-lg animate-slide-in pointer-events-auto max-w-xs`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <span className="text-xl">{getNotificationIcon(notif.type)}</span>
              <div className="flex-1">
                <div className="font-bold text-sm">{notif.title}</div>
                <div className="text-xs opacity-90">{notif.message}</div>
                <div className="text-xs opacity-75 mt-1">{notif.team}</div>
              </div>
            </div>
            <button
              onClick={() =>
                setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
              }
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
