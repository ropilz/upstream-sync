import { MessageRepository } from "../datastore/repositories/MessageRepository";
import { initializeProviders } from "../initializeProviders";
import { EmailEntity } from "../model/entities/EmailEntity";
import { MessageEntity } from "../model/entities/MessageEntity";
import { Contact } from "../model/value-objects/Contact";
import { ContactList } from "../model/value-objects/ContactList";
import { EmailFetcherService, EmailResponse } from "./EmailFetcherService";

/*
 * This is a quick test for the emails import
 * this was chosen as it helps to quickly test and understand the main flow + this is the code I was more familiar with as I added a feature here
 *
 * Ideally we would have mock providers & repositories which woudl allow us more robust testing of core features
 * but on this test I mocked some key methods to help to easily debug the code
 */
test('Imports email', async () => {
  // given we are using a local SQLite database, we reuse initializeProviders
  // but on other circumstances we would create a initializeMockProviders to help us
  EmailFetcherService.prototype.fetch = jest.fn(generateMockEmails);
  MessageRepository.prototype.persist = jest.fn();
  jest.spyOn(MessageEntity, 'createFromEmail');
  const { emailImportService } = await initializeProviders();
  await emailImportService.import();
  expect(EmailFetcherService.prototype.fetch).toHaveBeenCalledTimes(1);
  expect(MessageRepository.prototype.persist).toHaveBeenCalledTimes(1);
  expect(MessageEntity.createFromEmail).toHaveBeenCalledTimes(3);
  
});

async function generateMockEmails () {
    return buildEntities([
      {
      "id": "f2j2k2ko8s470659",
      "universal_message_id": "<xyz01z23@starnet.tech>",
      "in_reply_to": "<stu90v12@starnet.tech>",
      "from": "Dev Team <dev@starnet.tech>",
      "to": "Ava Sky <ava.sky@starnet.tech>, Chris Blue <chris.blue@starnet.tech>",
      "cc": "",
      "body": "<html><body><p>Ava & Chris,</p><p>We've identified the primary issues. We'll discuss solutions during the brainstorming session.</p><p>Best,<br>Dev Team</p></body></html>",
      "subject": "Re: Software Release Update",
      "date": "2023-10-06T21:00:00Z"
    },
    {
      "id": "28b1a916c6e25736",
      "universal_message_id": "<abc56f89@techsolutions.inc>",
      "in_reply_to": "<abc12f34@techsolutions.inc>",
      "from": "Amy Lee <amy.lee@techsolutions.inc>",
      "to": "James Wilson <james.wilson@techsolutions.inc>",
      "cc": "Rachel Green <rachel.green@techsolutions.inc>",
      "body": "<html><body><p>James,</p><p>Yes, let's discuss tomorrow at 10 AM.</p><p>Best,<br>Amy</p></body></html>",
      "subject": "Re: Software Update Discussion",
      "date": "2023-10-06T11:00:00Z"
    },
    {
      "id": "48b3a938e8g47958",
      "universal_message_id": "<ghi78i90@biogenlabs.com>",
      "in_reply_to": "<def56g78@biogenlabs.com>",
      "from": "Dr. Marie <marie@biogenlabs.com>",
      "to": "Dr. Albert <albert@biogenlabs.com>",
      "cc": "",
      "body": "<html><body><p>Albert,</p><p>I've looked into the data. Let's meet today after lunch.</p><p>Regards,<br>Marie</p></body></html>",
      "subject": "Re: Recent Research Findings",
      "date": "2023-10-05T15:00:00Z"
    },
  ]);
}

  function buildEntities(responses: EmailResponse[]): EmailEntity[] {
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
