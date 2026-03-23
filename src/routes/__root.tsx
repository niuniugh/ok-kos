import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	ClientOnly,
	createRootRoute,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import appCss from "../styles.css?url";

const queryClient = new QueryClient();

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Ok-Kos",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ClientOnly>
					<QueryClientProvider client={queryClient}>
						<ThemeProvider defaultTheme="dark">
							<TooltipProvider>{children}</TooltipProvider>
							<Toaster />
						</ThemeProvider>
					</QueryClientProvider>
				</ClientOnly>
				<Scripts />
			</body>
		</html>
	);
}
