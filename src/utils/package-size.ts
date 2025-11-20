import https from 'https';

export interface PackageSizeInfo {
    name: string;
    version: string;
    size: number;
    gzip: number;
}

export async function getPackageSize(packageName: string, version: string): Promise<PackageSizeInfo | null> {
    return new Promise((resolve) => {
        // Use bundlephobia API
        const url = `https://bundlephobia.com/api/size?package=${packageName}@${version}`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        name: packageName,
                        version,
                        size: parsed.size || 0,
                        gzip: parsed.gzip || 0,
                    });
                } catch {
                    resolve(null);
                }
            });
        }).on('error', () => {
            resolve(null);
        });
    });
}

export async function getPackageSizes(packages: { name: string; version: string }[]): Promise<Map<string, PackageSizeInfo>> {
    const sizeMap = new Map<string, PackageSizeInfo>();

    // Fetch sizes in parallel with a limit to avoid rate limiting
    const BATCH_SIZE = 5;
    for (let i = 0; i < packages.length; i += BATCH_SIZE) {
        const batch = packages.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
            batch.map(pkg => getPackageSize(pkg.name, pkg.version))
        );

        results.forEach((result, idx) => {
            if (result) {
                sizeMap.set(batch[idx].name, result);
            }
        });

        // Small delay between batches
        if (i + BATCH_SIZE < packages.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return sizeMap;
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
