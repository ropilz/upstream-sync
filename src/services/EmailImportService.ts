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
    const fetchedEmails = await this.retrieveAndPersistEmails()
      .then(emails => emails.sort((a, b) => a.date.getTime() - b.date.getTime()));
    const emailThreads = fetchedEmails.reduce(this.addReplyToGroup, []);
    const messages = await Promise.all(
      emailThreads.flatMap(emails => this.assignThreadToEmail(emails))
    );
    await this.messageRepository.persist(messages);
  }

  private async retrieveAndPersistEmails() {
    const fetchedEmails = await this.emailFetcherService.fetch();
    await this.emailRepository.persist(fetchedEmails);
    return fetchedEmails;
  }

  private addReplyToGroup(groups: EmailEntity[][], email: EmailEntity): EmailEntity[][] {
    const inReplyTo = email.inReplyTo?.email.toString();
    if (inReplyTo) {
      groups.find(group => group.at(-1)?.universalMessageId?.toString() === inReplyTo)?.push(email);
    } else {
      groups.push([email]);
    }
    return groups;
  }

  private assignThreadToEmail(emails: EmailEntity[]): Promise<MessageEntity>[] {
    const threadPromise = this.createNamedThread(emails[0].subject);
    return emails.map(email => threadPromise.then(thread => this.createMessageFromEmail(email, thread)));
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
