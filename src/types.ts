export interface Book {
  title: string;
  author: string;
  description: string;
  recommendedBy: string;
  imageUrl?: string;
}

export interface Participant {
  id: string;
  name: string;
  address: string;
  penColor: string;
  recommendedBook: Book;
  sendToId: string;
  receiveFromId: string;
}

export interface UserChecklist {
  sentBook: boolean;
  receivedBook: boolean;
  trackingNumber: string;
  memo: string;
  calendarEvents?: Record<string, "sent" | "received">;
}
