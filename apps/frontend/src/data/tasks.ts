export type Domain =
  | "info"
  | "call"
  | "enqueteur"
  | "admin"
  | "manager"
  | "compta"
  | "formateur";

export type Task = {
  id: string;
  date: string;
  domain: Domain;
  activity: string;
  description: string;
  duration: string;
  status: "pending" | "success" | "in_progress";
  attachment?: string;
};

export const tasks: Task[] = [
  {
    id: "1",
    date: "31/08/2025",
    domain: "info",
    activity: "Support Client",
    description: "Répondre au ticket #12345",
    duration: "0h 15m",
    status: "success",
    attachment: "/attachments/ticket-12345.pdf",
  },
  {
    id: "2",
    date: "30/08/2025",
    domain: "call",
    activity: "Prospection",
    description: "Appel de suivi avec le prospect Y",
    duration: "0h 45m",
    status: "in_progress",
  },
  {
    id: "3",
    date: "29/08/2025",
    domain: "compta",
    activity: "Facturation",
    description: "Préparer la facture pour le client X",
    duration: "1h 30m",
    status: "pending",
  },
];
