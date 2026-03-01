import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "LED Billboard Admin",
    description: "B2B marketplace admin panel for LED billboard truck operators and brokers",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">{children}</body>
        </html>
    );
}
