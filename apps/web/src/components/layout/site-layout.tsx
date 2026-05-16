import Footer from "./footer";
import Navbar from "./navbar";

export default function SiteLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col bg-surface">
			<Navbar />
			<main className="flex-1">{children}</main>
			<Footer />
		</div>
	);
}
