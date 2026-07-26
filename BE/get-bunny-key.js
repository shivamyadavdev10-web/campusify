import dotenv from 'dotenv';
dotenv.config();

async function fetchPullZoneKey() {
    const apiKey = process.env.BUNNY_API_KEY;
    if (!apiKey) {
        console.error("Missing BUNNY_API_KEY in .env");
        return;
    }

    try {
        const response = await fetch('https://api.bunny.net/pullzone', {
            method: 'GET',
            headers: {
                'AccessKey': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const pullZones = await response.json();
        const myZone = pullZones.find(pz => pz.Hostnames.some(h => h.Value.includes('vz-456fd924-c6c.b-cdn.net')));
        
        if (myZone) {
            console.log("Found Pull Zone!");
            console.log("TokenAuthKey:", myZone.TokenAuthenticationKey);
        } else {
            console.log("Pull zone not found.");
            console.log(pullZones.map(pz => pz.Hostnames));
        }
    } catch (error) {
        console.error("Error fetching pull zones:", error);
    }
}

fetchPullZoneKey();
