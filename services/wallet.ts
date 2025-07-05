import { APT_TO_OCTA, NETWORK } from "@/data/constant";


export class WalletService {

    private publicKey: string;

    constructor(publicKey: string) {
        this.publicKey = publicKey;
    }


    async getBalance(): Promise<number> {
        const balance = await fetch(`https://api.${NETWORK.toLowerCase()}.aptoslabs.com/v1/accounts/${this.publicKey}/balance/0x1::aptos_coin::AptosCoin`, {
         method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const response = await balance.json();
        return response / APT_TO_OCTA;
    }
}


