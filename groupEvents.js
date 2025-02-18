const events = process.env.EVENTS || 'false';
const botname = process.env.BOTNAME || 'CORAZON-MD';

const Events = async (client, Corazon) => {
    const Myself = await client.decodeJid(client.user.id);

    try {
        let metadata = await client.groupMetadata(corazon.id);
        let participants = corazon.participants;
        let desc = metadata.desc || "No Description";

        for (let num of participants) {
            let dpuser;

            try {
                dpuser = await client.profilePictureUrl(num, "image");
            } catch {
                dpuser = "https://i.imgur.com/iEWHnOH.jpeg";
            }

            if (corazon.action == "add") {
                let userName = num;

                let Welcometext = ` Hey  @${userName.split("@")[0]} 👋\n\nWelcome to ${metadata.subject}.\n\nyou may read the group Description to avoid being removed  ${desc}\n\n*Regards sime-o*.\n\nPowered by ${botname} .`;
                if (events === 'yes') {
                    await client.sendMessage(corazon.id, {
                        image: { url: dpuser },
                        caption: Welcometext,
                        mentions: [num],
                    });
                }
            } else if (corazon.action == "remove") {
                let userName2 = num;

                let Lefttext = `
          Goodbye to this idiot @${userName2.split("@")[0]} you will be highly remembered comrade`;
                if (events === 'yes') {
                    await client.sendMessage(corazon.id, {
                        image: { url: dpuser },
                        caption: Lefttext,
                        mentions: [num],
                    });
                }
            } else if (corazon.action == "demote" && events === 'yes') {
                await client.sendMessage(
                    corazon.id,
                    {
                        text: `@${(corazon.author).split("@")[0]}, has demoted @${(corazon.participants[0]).split("@")[0]} from admin 👀`,
                        mentions: [corazon.author, corazon.participants[0]]
                    }
                );
            } else if (corazon.action == "promote" && events === 'yes') {
                await client.sendMessage(
                    corazon.id,
                    {
                        text: `@${(corazon.author).split("@")[0]} has promoted @${(corazon.participants[0]).split("@")[0]} to admin. 👀`,
                        mentions: [corazon.author, corazon.participants[0]]
                    }
                );
            }
        }
    } catch (err) {
        console.log(err);
    }
};

module.exports = Events;
