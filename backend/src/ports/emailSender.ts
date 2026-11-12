export interface OutboundEmail {
  to: string;
  from: string;
  subject: string;
  text: string;
  reference: string;
}

export interface EmailSender {
  send(email: OutboundEmail): Promise<void>;
}
