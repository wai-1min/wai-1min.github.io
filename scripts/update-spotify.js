const fs = require("fs");

const artistId = "2zpVycqK9i1EvL76vPThbJ";
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error("Missing Spotify GitHub Secrets.");
}

async function getToken() {
  const basic = Buffer
    .from(`${clientId}:${clientSecret}`)
    .toString("base64");

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify token error: ${response.status}`);
  }

  return (await response.json()).access_token;
}

async function updateReleases() {
  const token = await getToken();

  const spotifyURL =
    `https://api.spotify.com/v1/artists/${artistId}/albums` +
    `?include_groups=album,single&market=IN&limit=50`;

  const response = await fetch(spotifyURL, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  const data = await response.json();

  const releases = data.items
    .filter(album =>
      album.artists.some(artist => artist.id === artistId)
    )
    .map(album => ({
      name: album.name,
      release_date: album.release_date,
      image: album.images?.[0]?.url || "",
      url: album.external_urls.spotify,
      id: album.id
    }))
    .sort((a, b) =>
      b.release_date.localeCompare(a.release_date)
    );

  fs.writeFileSync(
    "releases.json",
    JSON.stringify(releases, null, 2) + "\n"
  );

  console.log(`Updated ${releases.length} releases.`);
}

updateReleases().catch(error => {
  console.error(error);
  process.exit(1);
});
