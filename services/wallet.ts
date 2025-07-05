import { APT_TO_OCTA, APTOS_NETWORK, NETWORK } from "@/data/constant";
import {
    Aptos,
    AptosConfig
} from "@aptos-labs/ts-sdk";


export class WalletService {

    private publicKey: string;
    private aptosClient: AptosConfig;
    private aptos: Aptos;
    
    constructor(publicKey: string) {
        this.publicKey = publicKey;
        this.aptosClient = new AptosConfig({
            network: APTOS_NETWORK,
        });
        this.aptos = new Aptos(this.aptosClient);
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

    async fundWallet(amount: number) {
        await this.aptos.fundAccount({
            accountAddress: this.publicKey,
            amount: amount * APT_TO_OCTA,
        });
    }

}


