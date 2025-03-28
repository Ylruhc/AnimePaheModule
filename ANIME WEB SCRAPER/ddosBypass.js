class DdosGuardInterceptor {
    constructor() {
        this.errorCodes = [403]; // Blocked by DDoS-Guard
        this.serverCheck = ["ddos-guard"]; // Server header check
        this.cookieStore = {}; // In-memory cookie storage
    }

    async fetchWithBypass(url, options = {}) {
        let response = await this.fetchWithCookies(url, options);

        // If request is successful or not blocked, return response
        if (!this.errorCodes.includes(response.status) || !this.isDdosGuard(response)) {
            return response;
        }

        console.warn("DDoS-Guard detected, attempting to bypass...");

        // Check if we already have the __ddg2_ cookie
        if (this.cookieStore["__ddg2_"]) {
            console.log("Retrying request with existing DDoS-Guard cookie...");
            return this.fetchWithCookies(url, options);
        }

        // Get a new DDoS-Guard cookie
        const newCookie = await this.getNewCookie(url);
        if (!newCookie) {
            console.warn("Failed to retrieve DDoS-Guard cookie.");
            return response;
        }

        console.log("New DDoS-Guard cookie acquired, retrying request...");
        return this.fetchWithCookies(url, options);
    }

    async fetchWithCookies(url, options) {
        const cookieHeader = this.getCookieHeader();
        const headers = { ...options.headers, Cookie: cookieHeader };

        const response = await fetch(url, { ...options, headers });

        // Store any new cookies received
        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
            this.storeCookies(setCookieHeader);
        }

        return response;
    }

    isDdosGuard(response) {
        const serverHeader = response.headers.get("server");
        return serverHeader && this.serverCheck.includes(serverHeader.toLowerCase());
    }

    storeCookies(setCookieString) {
        setCookieString.split(";").forEach(cookieStr => {
            const [key, value] = cookieStr.split("=");
            this.cookieStore[key.trim()] = value?.trim() || "";
        });
    }

    getCookieHeader() {
        return Object.entries(this.cookieStore)
            .map(([key, value]) => `${key}=${value}`)
            .join("; ");
    }

    async getNewCookie(targetUrl) {
        try {
            // Fetch the challenge path from DDoS-Guard
            const wellKnownResponse = await fetch("https://check.ddos-guard.net/check.js");
            const wellKnownText = await wellKnownResponse.text();
            const wellKnownPath = wellKnownText.split("'")[1];

            const checkUrl = new URL(targetUrl);
            checkUrl.pathname = wellKnownPath;

            // Make a request to the challenge URL
            const checkResponse = await this.fetchWithCookies(checkUrl.toString(), {});
            const setCookieHeader = checkResponse.headers.get("set-cookie");

            if (!setCookieHeader) return null;

            // Store and return the new DDoS-Guard cookie
            this.storeCookies(setCookieHeader);
            return this.cookieStore["__ddg2_"];
        } catch (error) {
            console.error("Error fetching DDoS-Guard cookies:", error);
            return null;
        }
    }
}

// Usage Example (Works in Browser or Node 18+)
(async () => {
    const ddosInterceptor = new DdosGuardInterceptor();

    const response = await ddosInterceptor.fetchWithBypass("https://www.animepahe.ru/anime/4d560dfd-e606-c21e-2eef-e48fd09f8188");
    console.log("Final Response Status:", response.status);
    console.log("Final Response Body:", await response.text());
})();




