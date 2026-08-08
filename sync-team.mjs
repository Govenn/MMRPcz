// ============================================================
// sync-team.mjs
// Stáhne členy Discord serveru MMRP s vybranými rolemi a uloží
// je do team.json v kořeni repozitáře. Spouští se automaticky
// přes GitHub Actions — viz .github/workflows/sync-team.yml
// ============================================================

const GUILD_ID = '1474447187793412198';
const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
  console.error('Chybí proměnná prostředí DISCORD_BOT_TOKEN (GitHub Secret).');
  process.exit(1);
}

// Role seřazené od nejvyšší po nejnižší.
// Určuje pořadí zobrazení na stránce a — pokud má člen víc rolí
// ze seznamu — použije se u něj ta nejvýš postavená.
const ROLE_PRIORITY = [
  { id: '1474447187848073503', title: 'Project Owner' },
  { id: '1474447187848073502', title: 'Project Management' },
  { id: '1474447187848073500', title: 'Development Manager' },
  { id: '1474447187848073499', title: 'Community Manager' },
  { id: '1474447187839815739', title: 'Staff Manager' },
  { id: '1474447187839815737', title: 'Senior Admin' },
  { id: '1474447187839815736', title: 'Admin' },
  { id: '1474447187839815734', title: 'Developer' },
  { id: '1474447187839815733', title: 'Trial Developer' },
  { id: '1474447187839815732', title: 'Moderator' },
  { id: '1501093440749047809', title: 'Trial Moderator' },
];

const API = 'https://discord.com/api/v10';

async function fetchAllMembers() {
  let members = [];
  let after = '0';

  while (true) {
    const res = await fetch(`${API}/guilds/${GUILD_ID}/members?limit=1000&after=${after}`, {
      headers: { Authorization: `Bot ${TOKEN}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Discord API chyba ${res.status}: ${body}`);
    }

    const batch = await res.json();
    members = members.concat(batch);

    if (batch.length < 1000) break;
    after = batch[batch.length - 1].user.id;
  }

  return members;
}

function defaultAvatar(userId) {
  const index = Number((BigInt(userId) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function avatarUrl(member) {
  const { user } = member;
  if (member.avatar) {
    return `https://cdn.discordapp.com/guilds/${GUILD_ID}/users/${user.id}/avatars/${member.avatar}.png?size=128`;
  }
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  }
  return defaultAvatar(user.id);
}

async function main() {
  console.log('Stahuji členy serveru z Discordu…');
  const members = await fetchAllMembers();
  console.log(`Nalezeno ${members.length} členů serveru celkem.`);

  const team = [];

  for (const member of members) {
    const match = ROLE_PRIORITY.find((r) => member.roles.includes(r.id));
    if (!match) continue;

    const name = member.nick || member.user.global_name || member.user.username;

    team.push({
      name,
      role: match.title,
      priority: ROLE_PRIORITY.indexOf(match),
      avatar: avatarUrl(member),
    });
  }

  team.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, 'cs'));
  team.forEach((m) => delete m.priority);

  const output = {
    updatedAt: new Date().toISOString(),
    members: team,
  };

  const fs = await import('node:fs/promises');
  await fs.writeFile('team.json', JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`Uloženo ${team.length} členů týmu do team.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
