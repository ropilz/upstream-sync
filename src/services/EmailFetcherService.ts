import axios from "axios";
import { EmailEntity } from "../model/entities/EmailEntity";
import { Contact } from "../model/value-objects/Contact";
import { ContactList } from "../model/value-objects/ContactList";

/* should be moved to separate file */
export type EmailResponse = {
  id: string;
  universal_message_id: string;
  in_reply_to: string | null;
  from: string;
  to: string;
  cc: string;
  body: string;
  subject: string;
  date: string;
};

export class EmailFetcherService {
  constructor() {}

  private buildEntities(responses: EmailResponse[]): EmailEntity[] {
    return responses.map((response) => {
      return new EmailEntity(
        Contact.parse(response.universal_message_id),
        response.in_reply_to ? Contact.parse(response.in_reply_to) : null,
        response.id,
        Contact.parse(response.from),
        ContactList.parse(response.to),
        ContactList.parse(response.cc),
        response.body,
        response.subject,
        new Date(response.date)
      );
    });
  }

  public async fetch(): Promise<EmailEntity[]> {
    const response = await axios.get<EmailResponse[]>("https://my-json-server.typicode.com/jtiret/upstream-sync/emails");
    return this.buildEntities(response.data);
  }
}
