import { EmailRepository } from "../datastore/repositories/EmailRepository";
import { MessageRepository } from "../datastore/repositories/MessageRepository";
import { ThreadRepository } from "../datastore/repositories/ThreadRepository";
import { UserRepository } from "../datastore/repositories/UserRepository";
import { EmailEntity } from "../model/entities/EmailEntity";
import { MessageEntity } from "../model/entities/MessageEntity";
import { ThreadEntity } from "../model/entities/ThreadEntity";
import { EmailFetcherService } from "./EmailFetcherService";

export class EmailImportService {
  constructor(
    private readonly emailFetcherService: EmailFetcherService,
    private readonly emailRepository: EmailRepository,
    private readonly messageRepository: MessageRepository,
    private readonly threadRepository: ThreadRepository,
    private readonly userRepository: UserRepository
  ) {}

  public async import(): Promise<void> {
    const fetchedEmails = await this.retrieveAndPersistEmails();
    const emailThreads = this.groupEmailThreads(fetchedEmails);
    let operations: Promise<MessageEntity>[] = [];
    for (const emailThread of emailThreads) {
      const thread = await this.createNamedThread(emailThread[0].subject);
      operations = operations.concat(emailThread.map((email) => this.createMessageFromEmail(email, thread)));
    }
    const messages = await Promise.all(operations);
    await this.messageRepository.persist(messages);
  }

  private async retrieveAndPersistEmails() {
    const fetchedEmails = await this.emailFetcherService.fetch();
    await this.emailRepository.persist(fetchedEmails);
    return fetchedEmails;
  }
  /**
   * Groups an array of emails by threads
   * This should also group emails in the case that the many people reply to the same email
   */
  private groupEmailThreads(emails: EmailEntity[]): EmailEntity[][] {
    emails = emails.sort((a, b) => a.date.getTime() - b.date.getTime());
    const groupByLead: { [key: string]: EmailEntity[] } = {};
    const groups: EmailEntity[][] = [];
    for (const email of emails) {
      const inReplyTo = email.inReplyTo?.email.toString();
      const universalMessageId = email.universalMessageId?.email.toString();
      let group = inReplyTo ? groupByLead[inReplyTo] : null;
      if (!group) {
        group = [];
        groups.push(group);
      }
      group.push(email);
      groupByLead[universalMessageId] = group;
    }
    return groups;
  }

  private async createDefaultThread() {
    const singleThread = new ThreadEntity("Default Thread");
    await this.threadRepository.persist([singleThread]);
    return singleThread;
  }

  private async createNamedThread(name: string) {
    const singleThread = new ThreadEntity(name);
    await this.threadRepository.persist([singleThread]);
    return singleThread;
  }

  private async createMessageFromEmail(email: EmailEntity, thread: ThreadEntity): Promise<MessageEntity> {
    const user = await this.userRepository.findByEmail(email.from.email);
    const messageSenderId = user?.id ?? null;

    const message = MessageEntity.createFromEmail(messageSenderId, thread.id!, email);
    return message;
  }
}
