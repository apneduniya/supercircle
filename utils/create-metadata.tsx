import { Metadata } from "next";
import basicInfo from "@/data/basic.json";


export function constructMetaData({
    title,
    description,
    authors,
    ogImage,
    creator,
    publisher,
}: {
    title?: string;
    description?: string;
    authors?: { name: string; url: string };
    ogImage?: string;
    creator?: string;
    publisher?: string;
} = {}): Metadata {
    return {
        title: title || `${basicInfo.name} | ${basicInfo.title}`,
        description: description || basicInfo.description,
        metadataBase: new URL(basicInfo.website),
        icons: {
            icon: '/favicon.ico?v=1',
            apple: '/apple-touch-icon.png?v=1',
            shortcut: '/favicon-16x16.png?v=1',
        },
        manifest: '/site.webmanifest',
        openGraph: {
            type: 'website',
            url: basicInfo.website,
            title: basicInfo.name,
            description: basicInfo.description,
            siteName: basicInfo.name,
            images: [ogImage || `${basicInfo.website}/og-image.png`],
        },
        authors: authors || basicInfo.authors,
        creator: creator || basicInfo.authors.name,  
        publisher: publisher || basicInfo.authors.name,
        twitter: {
            card: "summary_large_image",
            title: basicInfo.name,
            description: basicInfo.description,
            images: [ogImage || `${basicInfo.website}/og-image.png`],
            creator: `@${basicInfo.name.toLowerCase()}`,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}