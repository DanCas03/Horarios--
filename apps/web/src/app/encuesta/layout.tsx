export default function EncuestaLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-[100dvh] flex-col bg-gray-50/50">
			{children}
		</div>
	);
}
