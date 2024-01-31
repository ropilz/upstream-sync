import { AbstractEntity } from "./AbstractEntity";
import { EmailEntity } from "./EmailEntity";

export class MessageEntity extends AbstractEntity {
  constructor(
    public readonly senderId: number | null,
    public readonly threadId: number,
    public readonly emailId: number,
    public readonly body: string,
    public readonly date: Date,
    id?: number
  ) {
    super(id);
  }

  public static createFromEmail(senderId: number | null, threadId: number, email: EmailEntity): MessageEntity {
    if (!email.id) {
      throw new Error("Email must have an id to be converted to a message");
    }

    return new MessageEntity(senderId, threadId, email.id!, this.removeHtmlTags(email.body), email.date);
  }
  
  /* removes html tags from the body of the email */
  private static removeHtmlTags(body: string): string {
    return body
      // uncomment if we want newlines for display purposes 
      // .replace(/<br[ ]*\/>/, "\n")
      // .replace(/<\/p>/, "\n</p>")
      .replace(/<[^>]*>?/gm, "");
  }
}
