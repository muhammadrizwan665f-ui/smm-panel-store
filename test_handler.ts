import { getProviderServices } from './src/lib/providers/provider.functions';

async function main() {
    try {
        console.log("Calling getProviderServices for 9d6c8f35-cc65-4726-bbc4-c1fe827764bc...");
        const result = await (getProviderServices as any).handler({ 
            data: { providerId: '9d6c8f35-cc65-4726-bbc4-c1fe827764bc' },
            context: {} 
        });
        console.log("Result:", result);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
